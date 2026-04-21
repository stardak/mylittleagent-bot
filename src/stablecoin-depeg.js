// ══════════════════════════════════════════════════════════════════════════════
// STABLECOIN DEPEG MONITOR
// ══════════════════════════════════════════════════════════════════════════════
// Monitors USDC, USDT, DAI prices on Binance every 2 minutes.
// Strategy: paper-buy when any drops below $0.995, wait for repeg above $0.999.
// Rare signal (~1-2x per year) but high conviction when it fires.
// $100 paper balance, 25% sizing per depeg event.
// ══════════════════════════════════════════════════════════════════════════════

const PAIRS            = ['USDCUSDT', 'DAIUSDT'];   // USDT itself is the base
const USDT_ORACLE      = 'https://api.binance.com/api/v3/ticker/price';
const POLL_MS          = 120_000;    // 2 min
const ENTRY_THRESHOLD  = 0.9950;     // buy if price drops below $0.9950
const EXIT_THRESHOLD   = 0.9990;     // sell when repeg to $0.9990
const BET_PCT          = 0.25;
const STARTING_BALANCE = 100;
const MAX_LOG          = 150;

export class StablecoinDepegScanner {
  constructor() {
    this._interval   = null;
    this.balance     = STARTING_BALANCE;
    this.positions   = new Map();   // symbol → { entryPrice, betSize, qty, entryTime }
    this.trades      = [];
    this.activityLog = [];
    this.prices      = {};          // symbol → { price, peg, lastUpdate, depegPct }
    this.alerts      = [];          // historical depeg events
    this.stats       = {
      totalScans:    0,
      totalTrades:   0,
      totalPnl:      0,
      todayPnl:      0,
      _todayDate:    new Date().toDateString(),
      deepestDepeg:  null,         // { symbol, depegPct, seenAt }
    };
  }

  start() {
    console.log('[Depeg] Scanner started — every 2min');
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

    // Fetch all stable prices
    const allPrices = {};
    for (const pair of PAIRS) {
      try {
        const res  = await fetch(`${USDT_ORACLE}?symbol=${pair}`, { signal: AbortSignal.timeout(8_000) });
        if (!res.ok) continue;
        const data = await res.json();
        allPrices[pair] = parseFloat(data.price || 1);
      } catch { /* skip */ }
    }
    // USDT vs BUSD or TUSD — approximate via USDC/USDT ratio
    // If USDCUSDT = 0.997 → USDC is at $0.997, USDT is at $1.00 (by definition on Binance)
    allPrices['USDT'] = 1.0000;   // USDT is the quote — always $1 on Binance

    for (const [pair, price] of Object.entries(allPrices)) {
      const symbol    = pair === 'USDT' ? 'USDT' : pair.replace('USDT', '');
      const depegPct  = +((1 - price) * 100).toFixed(4);
      const isPegged  = price >= EXIT_THRESHOLD;
      const isDepegged = price < ENTRY_THRESHOLD;

      this.prices[symbol] = {
        price,
        priceStr:   `$${price.toFixed(4)}`,
        depegPct,
        depegStr:   depegPct > 0 ? `-${depegPct.toFixed(3)}%` : `+${Math.abs(depegPct).toFixed(3)}%`,
        pegged:     isPegged,
        lastUpdate: Date.now(),
      };

      // Track deepest depeg ever
      if (depegPct > 0.1) {
        if (!this.stats.deepestDepeg || depegPct > this.stats.deepestDepeg.depegPct) {
          this.stats.deepestDepeg = { symbol, depegPct, price, seenAt: Date.now() };
        }
        if (!this.alerts.some(a => a.symbol === symbol && Date.now() - a.seenAt < 3_600_000)) {
          this.alerts.unshift({ symbol, depegPct, price, seenAt: Date.now() });
          if (this.alerts.length > 20) this.alerts.pop();
        }
      }

      // ── Entry: buy the depegged stable ──
      if (isDepegged && !this.positions.has(symbol)) {
        const betSize = +(this.balance * BET_PCT).toFixed(2);
        const qty     = +(betSize / price).toFixed(4);
        this.positions.set(symbol, {
          symbol, entryPrice: price, betSize, qty,
          entryTime: Date.now(),
          entryTimeStr: new Date().toISOString(),
          depegAtEntry: depegPct,
        });
        this._log(`🚨 DEPEG DETECTED — ${symbol} @ $${price.toFixed(4)} (−${depegPct.toFixed(3)}%) · BUY $${betSize}`, 'depeg');
      }

      // ── Exit: stable has repegged ──
      if (isPegged && this.positions.has(symbol)) {
        const pos       = this.positions.get(symbol);
        const exitValue = +(pos.qty * price).toFixed(4);
        const pnl       = +(exitValue - pos.betSize).toFixed(4);
        const pnlPct    = +((pnl / pos.betSize) * 100).toFixed(2);

        this.balance          = +(this.balance + pnl).toFixed(4);
        this.stats.totalPnl   = +(this.stats.totalPnl + pnl).toFixed(4);
        this.stats.todayPnl   = +(this.stats.todayPnl + pnl).toFixed(4);
        this.stats.totalTrades++;

        this.trades.unshift({
          ...pos, exitPrice: price, pnl, pnlPct,
          closedAt: new Date().toISOString(),
          durationMin: +((Date.now() - pos.entryTime) / 60_000).toFixed(1),
        });
        this.positions.delete(symbol);

        const emoji = pnl >= 0 ? '💰' : '📉';
        this._log(`${emoji} REPEG ${symbol} @ $${price.toFixed(4)} · P&L ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(4)} (${pnlPct}%)`, 'repeg');
      }

      // Info log if depegged but already in position
      if (isDepegged && this.positions.has(symbol)) {
        this._log(`⚠️ ${symbol} still depegged @ $${price.toFixed(4)} — holding`, 'warn');
      }
    }
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
      prices:       this.prices,
      positions:    [...this.positions.values()],
      trades:       this.trades.slice(0, 30),
      activityLog:  this.activityLog.slice(0, 60),
      alerts:       this.alerts,
      stats: {
        totalScans:   this.stats.totalScans,
        totalTrades:  this.stats.totalTrades,
        totalPnl:     +this.stats.totalPnl.toFixed(4),
        todayPnl:     +this.stats.todayPnl.toFixed(4),
        balance:      +this.balance.toFixed(2),
        startingBalance: STARTING_BALANCE,
        openPositions: this.positions.size,
        deepestDepeg:  this.stats.deepestDepeg,
        running:       !!this._interval,
      },
    };
  }
}
