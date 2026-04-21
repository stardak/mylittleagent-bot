// ══════════════════════════════════════════════════════════════════════════════
// FEAR & GREED CONTRARIAN STRATEGY
// ══════════════════════════════════════════════════════════════════════════════
// Monitors the Crypto Fear & Greed Index from alternative.me.
// Strategy: BUY BTC when "Extreme Fear" (<20), SELL when "Extreme Greed" (>80).
// Classic mean-reversion on market sentiment — trades ~4-6x per year.
// Checks every hour (index updates daily). $100 paper balance.
// ══════════════════════════════════════════════════════════════════════════════

const API_URL          = 'https://api.alternative.me/fng/?limit=1';
const POLL_MS          = 3_600_000;    // 1 hour
const BUY_THRESHOLD    = 20;           // Extreme Fear → buy
const SELL_THRESHOLD   = 80;           // Extreme Greed → sell
const BET_PCT          = 0.25;
const STARTING_BALANCE = 100;
const MAX_LOG          = 150;

export class FearGreedScanner {
  constructor() {
    this._interval   = null;
    this.balance     = STARTING_BALANCE;
    this.position    = null;     // null or { side:'LONG', entryPrice, entryFG, betSize, entryTime }
    this.trades      = [];      // closed trades
    this.activityLog = [];
    this.currentFG   = null;    // { value, classification, timestamp }
    this.history     = [];      // recent readings for chart
    this.stats       = {
      totalChecks:  0,
      totalTrades:  0,
      totalPnl:     0,
      todayPnl:     0,
      _todayDate:   new Date().toDateString(),
      buyZoneCount:  0,
      sellZoneCount: 0,
    };
  }

  start() {
    console.log('[FearGreed] Scanner started — every 1hr');
    this._scan();
    this._interval = setInterval(() => this._scan(), POLL_MS);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
  }

  async _scan() {
    this.stats.totalChecks++;
    const today = new Date().toDateString();
    if (today !== this.stats._todayDate) {
      this.stats._todayDate = today;
      this.stats.todayPnl = 0;
    }

    try {
      // Fetch F&G index
      const fgRes = await fetch(API_URL, { signal: AbortSignal.timeout(10_000) });
      if (!fgRes.ok) return;
      const fgData = await fgRes.json();
      const fg = fgData.data?.[0];
      if (!fg) return;

      const value = parseInt(fg.value);
      const classification = fg.value_classification;

      this.currentFG = { value, classification, timestamp: Date.now() };
      this.history.unshift({ value, classification, time: Date.now() });
      if (this.history.length > 168) this.history.pop(); // ~1 week of hourly

      // Fetch BTC price for position tracking
      let btcPrice = 0;
      try {
        const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: AbortSignal.timeout(5000) });
        const priceData = await priceRes.json();
        btcPrice = parseFloat(priceData.price || 0);
      } catch { /* use 0 */ }

      const zone = value <= BUY_THRESHOLD ? 'EXTREME_FEAR'
                 : value >= SELL_THRESHOLD ? 'EXTREME_GREED'
                 : 'NEUTRAL';

      if (zone === 'EXTREME_FEAR') this.stats.buyZoneCount++;
      if (zone === 'EXTREME_GREED') this.stats.sellZoneCount++;

      // Signal logic
      if (zone === 'EXTREME_FEAR' && !this.position && btcPrice > 0) {
        // BUY signal
        const betSize = +(this.balance * BET_PCT).toFixed(2);
        this.position = {
          side: 'LONG',
          entryPrice: btcPrice,
          entryFG: value,
          betSize,
          entryTime: Date.now(),
          entryTimeStr: new Date().toISOString(),
          btcQty: +(betSize / btcPrice).toFixed(8),
        };
        this._log(`🟢 BUY BTC @ $${btcPrice.toLocaleString()} · F&G: ${value} (${classification}) · $${betSize} (25%)`, 'buy');

      } else if (zone === 'EXTREME_GREED' && this.position && btcPrice > 0) {
        // SELL signal — close position
        const pos = this.position;
        const exitValue = +(pos.btcQty * btcPrice).toFixed(4);
        const pnl       = +(exitValue - pos.betSize).toFixed(4);
        const pnlPct    = +((pnl / pos.betSize) * 100).toFixed(2);

        this.balance          = +(this.balance + pnl).toFixed(4);
        this.stats.totalPnl   = +(this.stats.totalPnl + pnl).toFixed(4);
        this.stats.todayPnl   = +(this.stats.todayPnl + pnl).toFixed(4);
        this.stats.totalTrades++;

        this.trades.unshift({
          ...pos,
          exitPrice: btcPrice,
          exitFG: value,
          pnl,
          pnlPct,
          closedAt: new Date().toISOString(),
          durationDays: +((Date.now() - pos.entryTime) / 86_400_000).toFixed(1),
        });

        this.position = null;
        const emoji = pnl >= 0 ? '💰' : '📉';
        this._log(`${emoji} SELL BTC @ $${btcPrice.toLocaleString()} · F&G: ${value} · P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct}%)`, 'sell');

      } else {
        // Just log the reading
        const zoneLabel = zone === 'EXTREME_FEAR' ? '😱 EXTREME FEAR'
                        : zone === 'EXTREME_GREED' ? '🤑 EXTREME GREED'
                        : `${value <= 40 ? '😟' : value >= 60 ? '😊' : '😐'} ${classification}`;
        this._log(`F&G: ${value} — ${zoneLabel}${this.position ? ' · holding LONG' : ''}`, zone !== 'NEUTRAL' ? 'signal' : 'info');
      }

    } catch (e) {
      this._log(`Error: ${e.message}`, 'error');
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
      currentFG:   this.currentFG,
      position:    this.position,
      trades:      this.trades.slice(0, 30),
      activityLog: this.activityLog.slice(0, 60),
      history:     this.history.slice(0, 30),
      stats: {
        totalChecks:   this.stats.totalChecks,
        totalTrades:   this.stats.totalTrades,
        totalPnl:      +this.stats.totalPnl.toFixed(4),
        todayPnl:      +this.stats.todayPnl.toFixed(4),
        balance:       +this.balance.toFixed(2),
        startingBalance: STARTING_BALANCE,
        buyZoneCount:  this.stats.buyZoneCount,
        sellZoneCount: this.stats.sellZoneCount,
        hasPosition:   !!this.position,
        running:       !!this._interval,
      },
    };
  }
}
