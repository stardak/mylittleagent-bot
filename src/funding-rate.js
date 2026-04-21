// ══════════════════════════════════════════════════════════════════════════════
// FUNDING RATE ARBITRAGE SCANNER
// ══════════════════════════════════════════════════════════════════════════════
// Tracks BTC/ETH/SOL perpetual funding rates from Binance Futures.
// When funding is extreme (>0.03% per 8h), paper-opens a delta-neutral position:
//   → Short perp + Long spot (funding positive = shorts get paid)
//   → Long perp + Short spot (funding negative = longs get paid)
// Funding is settled every 8 hours (00:00, 08:00, 16:00 UTC).
// P&L = |funding rate| × position size per settlement.
// ══════════════════════════════════════════════════════════════════════════════

const SYMBOLS          = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const POLL_MS          = 300_000;      // check every 5 min
const EXTREME_RATE     = 0.0003;       // 0.03% threshold for "extreme"
const BET_PCT          = 0.25;         // 25% of balance
const STARTING_BALANCE = 100;
const MAX_LOG          = 150;

export class FundingRateScanner {
  constructor() {
    this._interval   = null;
    this.balance     = STARTING_BALANCE;
    this.positions   = new Map();   // symbol → { side, rate, entryTime, betSize }
    this.trades      = [];          // closed trades
    this.activityLog = [];
    this.rates       = {};          // symbol → { rate, nextTime, lastUpdate }
    this.stats       = {
      totalScans: 0,
      totalSettlements: 0,
      totalPnl: 0,
      todayPnl: 0,
      todayTrades: 0,
      _todayDate: new Date().toDateString(),
      bestRate: null,
    };
  }

  start() {
    console.log('[FundingRate] Scanner started — every 5min');
    this._scan();
    this._interval = setInterval(() => this._scan(), POLL_MS);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
  }

  async _scan() {
    this.stats.totalScans++;

    // Reset daily stats
    const today = new Date().toDateString();
    if (today !== this.stats._todayDate) {
      this.stats._todayDate = today;
      this.stats.todayPnl   = 0;
      this.stats.todayTrades = 0;
    }

    for (const symbol of SYMBOLS) {
      try {
        const url = `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) continue;
        const data = await res.json();

        const rate      = parseFloat(data.lastFundingRate || 0);
        const nextTime  = parseInt(data.nextFundingTime || 0);
        const markPrice = parseFloat(data.markPrice || 0);
        const ratePct   = (rate * 100).toFixed(4);

        this.rates[symbol] = {
          rate,
          ratePct: `${rate >= 0 ? '+' : ''}${ratePct}%`,
          markPrice,
          nextTime,
          nextTimeStr: new Date(nextTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          lastUpdate: Date.now(),
          extreme: Math.abs(rate) >= EXTREME_RATE,
        };

        // Track best rate ever seen
        if (!this.stats.bestRate || Math.abs(rate) > Math.abs(this.stats.bestRate.rate)) {
          this.stats.bestRate = { symbol, rate, ratePct: `${ratePct}%`, seenAt: Date.now() };
        }

        const isExtreme = Math.abs(rate) >= EXTREME_RATE;
        const hasPos    = this.positions.has(symbol);

        // Settle existing position if we just passed a funding time
        if (hasPos) {
          const pos = this.positions.get(symbol);
          // Check if 8h has passed since entry (simplified settlement)
          const elapsed = Date.now() - pos.entryTime;
          if (elapsed >= 28_800_000) { // 8 hours
            const pnl = +(Math.abs(pos.rate) * pos.betSize).toFixed(4);
            this.balance   = +(this.balance + pnl).toFixed(4);
            this.stats.totalPnl     = +(this.stats.totalPnl + pnl).toFixed(4);
            this.stats.todayPnl     = +(this.stats.todayPnl + pnl).toFixed(4);
            this.stats.todayTrades++;
            this.stats.totalSettlements++;

            const closedTrade = {
              ...pos,
              pnl,
              closedAt: new Date().toISOString(),
              status: 'settled',
              durationHrs: +(elapsed / 3_600_000).toFixed(1),
            };
            this.trades.unshift(closedTrade);
            this.positions.delete(symbol);

            this._log(`💰 SETTLED ${symbol} · ${pos.side} · rate ${(pos.rate * 100).toFixed(4)}% · +$${pnl.toFixed(4)}`, 'settlement');
          }
        }

        // Open new position if extreme and no existing
        if (isExtreme && !this.positions.has(symbol)) {
          const betSize = +(this.balance * BET_PCT).toFixed(2);
          const side    = rate > 0 ? 'SHORT perp (collect funding)' : 'LONG perp (collect funding)';
          const pos     = {
            symbol,
            side,
            rate,
            ratePct: `${ratePct}%`,
            markPrice,
            betSize,
            entryTime: Date.now(),
            entryTimeStr: new Date().toISOString(),
          };
          this.positions.set(symbol, pos);
          this._log(`📊 OPEN ${symbol} · ${side} · rate ${ratePct}% · $${betSize} (25%)`, 'trade');
        }

        // Activity log for all rates
        this._log(
          `${symbol} funding: ${rate >= 0 ? '+' : ''}${ratePct}% ${isExtreme ? '🔥 EXTREME' : ''} · next @ ${this.rates[symbol].nextTimeStr}`,
          isExtreme ? 'extreme' : 'info'
        );

      } catch (e) {
        // silently skip on fetch error
      }
    }
  }

  _log(message, type = 'info') {
    this.activityLog.unshift({
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      type,
    });
    if (this.activityLog.length > MAX_LOG) this.activityLog.pop();
  }

  getState() {
    return {
      rates:       this.rates,
      positions:   [...this.positions.values()],
      trades:      this.trades.slice(0, 50),
      activityLog: this.activityLog.slice(0, 80),
      stats: {
        totalScans:       this.stats.totalScans,
        totalSettlements: this.stats.totalSettlements,
        totalPnl:         +this.stats.totalPnl.toFixed(4),
        todayPnl:         +this.stats.todayPnl.toFixed(4),
        todayTrades:      this.stats.todayTrades,
        balance:          +this.balance.toFixed(2),
        startingBalance:  STARTING_BALANCE,
        openPositions:    this.positions.size,
        bestRate:         this.stats.bestRate,
        running:          !!this._interval,
      },
    };
  }
}
