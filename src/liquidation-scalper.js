// ══════════════════════════════════════════════════════════════════════════════
// LIQUIDATION CASCADE SCALPER
// ══════════════════════════════════════════════════════════════════════════════
// Fetches recent large liquidation events from Binance Futures REST API.
// When total liquidations in 5 minutes exceed $5M on a symbol,
// paper-bets on mean reversion: buy dip (from long liquidations) or
// short the spike (from short liquidations).
// Exit after 1 hour or when price retraces 1.5%.
// $100 paper balance, 25% sizing.
// ══════════════════════════════════════════════════════════════════════════════

const SYMBOLS           = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const POLL_MS           = 60_000;       // check every 60s
const LIQ_THRESHOLD_USD = 5_000_000;   // $5M in liquidations triggers entry
const TARGET_RETRACE    = 0.015;        // 1.5% target
const MAX_HOLD_MS       = 3_600_000;    // 1 hour max hold
const BET_PCT           = 0.25;
const STARTING_BALANCE  = 100;
const MAX_LOG           = 150;
const LIQ_WINDOW_MS     = 300_000;      // 5 minute window for liquidation sum

export class LiquidationScanner {
  constructor() {
    this._interval    = null;
    this.balance      = STARTING_BALANCE;
    this.positions    = new Map();    // symbol → trade
    this.trades       = [];
    this.activityLog  = [];
    this.liqFeed      = {};           // symbol → recent liq events
    this.stats        = {
      totalScans:    0,
      totalTrades:   0,
      totalPnl:      0,
      todayPnl:      0,
      _todayDate:    new Date().toDateString(),
      biggestCascade: null,
    };
  }

  start() {
    console.log('[LiqScalper] Scanner started — every 60s');
    this._scan();
    this._interval = setInterval(() => this._scan(), POLL_MS);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
  }

  async _scan() {
    this.stats.totalScans++;
    const today = new Date().toDateString();
    if (today !== this.stats._todayDate) {
      this.stats._todayDate = today;
      this.stats.todayPnl = 0;
    }

    // Check existing positions for exit conditions first
    for (const [symbol, pos] of this.positions) {
      try {
        const priceRes = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`, { signal: AbortSignal.timeout(8_000) });
        if (!priceRes.ok) continue;
        const priceData = await priceRes.json();
        const currentPrice = parseFloat(priceData.markPrice || 0);
        const elapsed      = Date.now() - pos.entryTime;

        // Check: hit target or time exit
        const retrace = pos.side === 'LONG'
          ? (currentPrice - pos.entryPrice) / pos.entryPrice
          : (pos.entryPrice - currentPrice) / pos.entryPrice;

        if (retrace >= TARGET_RETRACE || elapsed >= MAX_HOLD_MS) {
          const pnl     = +(pos.betSize * retrace).toFixed(4);
          const pnlPct  = +(retrace * 100).toFixed(2);
          const reason  = retrace >= TARGET_RETRACE ? 'target hit' : 'time exit';

          this.balance          = +(this.balance + pnl).toFixed(4);
          this.stats.totalPnl   = +(this.stats.totalPnl + pnl).toFixed(4);
          this.stats.todayPnl   = +(this.stats.todayPnl + pnl).toFixed(4);
          this.stats.totalTrades++;

          this.trades.unshift({
            ...pos, exitPrice: currentPrice, pnl, pnlPct, reason,
            closedAt: new Date().toISOString(),
            durationMin: +((elapsed / 60_000)).toFixed(0),
          });
          this.positions.delete(symbol);

          const emoji = pnl >= 0 ? '💰' : '📉';
          this._log(`${emoji} CLOSE ${symbol} ${pos.side} @ $${currentPrice.toLocaleString()} · ${reason} · ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(4)} (${pnlPct}%)`, pnl >= 0 ? 'win' : 'loss');
        }
      } catch { /* skip */ }
    }

    // Scan for new cascade events
    for (const symbol of SYMBOLS) {
      if (this.positions.has(symbol)) continue;

      try {
        // Fetch recent liquidation orders from Binance Futures
        const liqUrl = `https://fapi.binance.com/fapi/v1/forceOrders?symbol=${symbol}&limit=200`;
        const liqRes = await fetch(liqUrl, { signal: AbortSignal.timeout(10_000) });

        // Binance requires auth for forceOrders — use aggTrades as a proxy
        // Instead, use the public liquidation liquidations endpoint approximation
        // via large trades in last 5 minutes
        if (!liqRes.ok) {
          // Fallback: detect large price moves as a proxy for cascades
          await this._detectMoveProxy(symbol);
          continue;
        }

        const liqs = await liqRes.json();
        const cutoff = Date.now() - LIQ_WINDOW_MS;

        let longLiqs = 0, shortLiqs = 0;
        for (const l of liqs) {
          if (parseInt(l.time || l.transactTime || 0) < cutoff) continue;
          const notional = parseFloat(l.origQty || 0) * parseFloat(l.price || l.avgPrice || 0);
          if (l.side === 'BUY')  shortLiqs += notional;  // short positions liquidated → buy orders
          if (l.side === 'SELL') longLiqs  += notional;  // long positions liquidated → sell orders
        }

        const totalLiq = longLiqs + shortLiqs;
        if (!this.liqFeed[symbol]) this.liqFeed[symbol] = {};
        this.liqFeed[symbol] = { longLiqs, shortLiqs, totalLiq, lastUpdate: Date.now() };

        // Track biggest cascade
        if (totalLiq > 0 && (!this.stats.biggestCascade || totalLiq > this.stats.biggestCascade.totalLiq)) {
          this.stats.biggestCascade = { symbol, totalLiq, longLiqs, shortLiqs, seenAt: Date.now() };
        }

        if (totalLiq >= LIQ_THRESHOLD_USD) {
          const priceRes = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`, { signal: AbortSignal.timeout(8_000) });
          if (!priceRes.ok) continue;
          const priceData   = await priceRes.json();
          const currentPrice = parseFloat(priceData.markPrice || 0);

          // Enter counter-trend: if mostly long liquidations, dip-buy; if mostly short, short the spike
          const side    = longLiqs > shortLiqs ? 'LONG' : 'SHORT';
          const betSize = +(this.balance * BET_PCT).toFixed(2);

          this.positions.set(symbol, {
            symbol, side, entryPrice: currentPrice, betSize,
            longLiqs, shortLiqs, totalLiq,
            entryTime: Date.now(),
            entryTimeStr: new Date().toISOString(),
            target: side === 'LONG'
              ? +(currentPrice * (1 + TARGET_RETRACE)).toFixed(2)
              : +(currentPrice * (1 - TARGET_RETRACE)).toFixed(2),
          });

          const fmtM = v => `$${(v / 1_000_000).toFixed(1)}M`;
          this._log(`⚡ CASCADE ${symbol} · $${fmtM(totalLiq)} liq in 5min → ${side} @ $${currentPrice.toLocaleString()} · $${betSize}`, 'cascade');
        }

      } catch { /* skip */ }
    }
  }

  // Fallback: detect sudden 1%+ price moves as cascade proxy
  async _detectMoveProxy(symbol) {
    try {
      const url  = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=5m&limit=3`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return;
      const k    = await res.json();
      if (k.length < 2) return;

      const prev = { h: parseFloat(k[0][2]), l: parseFloat(k[0][3]), c: parseFloat(k[0][4]) };
      const curr = { o: parseFloat(k[1][1]), c: parseFloat(k[1][4]), vol: parseFloat(k[1][5]) };
      const move = (curr.c - curr.o) / curr.o;

      if (!this.liqFeed[symbol]) this.liqFeed[symbol] = {};
      this.liqFeed[symbol] = {
        estimatedMove: (move * 100).toFixed(2) + '%',
        lastUpdate: Date.now(),
        proxy: true,
      };

      // Only enter on very large moves (>1.5%) without auth
      if (Math.abs(move) > 0.015 && !this.positions.has(symbol)) {
        const betSize = +(this.balance * BET_PCT).toFixed(2);
        const side    = move < 0 ? 'LONG' : 'SHORT';       // buy the dip, short the spike
        this.positions.set(symbol, {
          symbol, side, entryPrice: curr.c, betSize,
          longLiqs: 0, shortLiqs: 0, totalLiq: 0,
          entryTime: Date.now(),
          entryTimeStr: new Date().toISOString(),
          proxy: true,
          target: side === 'LONG'
            ? +(curr.c * (1 + TARGET_RETRACE)).toFixed(2)
            : +(curr.c * (1 - TARGET_RETRACE)).toFixed(2),
        });
        this._log(`⚡ MOVE PROXY ${symbol} · ${(move * 100).toFixed(2)}% in 5min → ${side} @ $${curr.c.toLocaleString()} · $${betSize}`, 'cascade');
      }
    } catch { /* skip */ }
  }

  _log(message, type = 'info') {
    this.activityLog.unshift({
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message, type,
    });
    if (this.activityLog.length > MAX_LOG) this.activityLog.pop();
  }

  getState() {
    return {
      liqFeed:     this.liqFeed,
      positions:   [...this.positions.values()],
      trades:      this.trades.slice(0, 30),
      activityLog: this.activityLog.slice(0, 60),
      stats: {
        totalScans:      this.stats.totalScans,
        totalTrades:     this.stats.totalTrades,
        totalPnl:        +this.stats.totalPnl.toFixed(4),
        todayPnl:        +this.stats.todayPnl.toFixed(4),
        balance:         +this.balance.toFixed(2),
        startingBalance: STARTING_BALANCE,
        openPositions:   this.positions.size,
        biggestCascade:  this.stats.biggestCascade,
        running:         !!this._interval,
      },
    };
  }
}
