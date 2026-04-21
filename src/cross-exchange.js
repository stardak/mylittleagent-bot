// ══════════════════════════════════════════════════════════════════════════════
// CROSS-EXCHANGE SPREAD MONITOR
// ══════════════════════════════════════════════════════════════════════════════
// Compares BTC/ETH/SOL spot prices between Binance and Bybit every 10 seconds.
// Logs spread in USD and %. Paper-trades when spread exceeds 0.1% (10 bps).
// Strategy: buy on cheaper exchange, (notionally) sell on more expensive.
// In practice this is execution speed limited; paper data shows feasibility.
// $100 paper balance, 25% sizing.
// ══════════════════════════════════════════════════════════════════════════════

const SYMBOLS           = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const POLL_MS           = 10_000;      // 10s
const SPREAD_THRESHOLD  = 0.001;       // 0.1% spread triggers logging/paper trade
const TRADE_THRESHOLD   = 0.005;       // 0.5% spread triggers actual paper trade
const BET_PCT           = 0.25;
const STARTING_BALANCE  = 100;
const MAX_LOG           = 150;
const MAX_SPREAD_HIST   = 200;

export class CrossExchangeScanner {
  constructor() {
    this._interval   = null;
    this.balance     = STARTING_BALANCE;
    this.positions   = new Map();
    this.trades      = [];
    this.activityLog = [];
    this.spreads     = {};           // symbol → { binance, bybit, spread, spreadPct, etc. }
    this.spreadHist  = [];           // [ { time, symbol, spreadPct } ]
    this.stats       = {
      totalScans:    0,
      totalTrades:   0,
      totalPnl:      0,
      todayPnl:      0,
      _todayDate:    new Date().toDateString(),
      maxSpread:     null,          // largest spread ever seen
    };
  }

  start() {
    console.log('[CrossEx] Scanner started — every 10s');
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

    // Fetch prices from both exchanges in parallel
    const [binancePrices, bybitPrices] = await Promise.all([
      this._fetchBinance(),
      this._fetchBybit(),
    ]);

    for (const symbol of SYMBOLS) {
      const short    = symbol.replace('USDT', '');
      const binance  = binancePrices[symbol];
      const bybit    = bybitPrices[symbol];

      if (!binance || !bybit) continue;

      const spread    = Math.abs(binance - bybit);
      const spreadPct = spread / Math.min(binance, bybit);
      const cheaperEx = binance < bybit ? 'Binance' : 'Bybit';
      const expensiveEx = binance < bybit ? 'Bybit' : 'Binance';

      this.spreads[symbol] = {
        binance, bybit, spread, spreadPct,
        spreadPctStr:  `${(spreadPct * 100).toFixed(4)}%`,
        spreadUsdStr:  `$${spread.toFixed(spread > 10 ? 0 : 2)}`,
        cheaperEx, expensiveEx,
        aboveThreshold: spreadPct >= SPREAD_THRESHOLD,
        tradeable:      spreadPct >= TRADE_THRESHOLD,
        lastUpdate: Date.now(),
      };

      // Track max spread
      if (!this.stats.maxSpread || spreadPct > this.stats.maxSpread.spreadPct) {
        this.stats.maxSpread = { symbol, spreadPct, spread, binance, bybit, seenAt: Date.now() };
      }

      // Spread history
      this.spreadHist.unshift({ time: Date.now(), symbol, spreadPct: +(spreadPct * 100).toFixed(4) });
      if (this.spreadHist.length > MAX_SPREAD_HIST) this.spreadHist.pop();

      // Check exit for open positions
      if (this.positions.has(symbol)) {
        const pos = this.positions.get(symbol);
        // Exit when spread closes (falls below threshold or 5min timeout)
        const elapsed = Date.now() - pos.entryTime;
        if (spreadPct < SPREAD_THRESHOLD || elapsed > 300_000) {
          // P&L = spread narrowed = small profit; simplified as spreadPct × betSize
          const capturedSpread = Math.max(0, pos.spreadPct - spreadPct);
          const pnl = +(capturedSpread * pos.betSize).toFixed(4);
          const reason = spreadPct < SPREAD_THRESHOLD ? 'spread closed' : 'timeout';

          this.balance          = +(this.balance + pnl).toFixed(4);
          this.stats.totalPnl   = +(this.stats.totalPnl + pnl).toFixed(4);
          this.stats.todayPnl   = +(this.stats.todayPnl + pnl).toFixed(4);
          this.stats.totalTrades++;

          this.trades.unshift({
            ...pos, closedSpreadPct: spreadPct, pnl, reason,
            closedAt: new Date().toISOString(),
            durationSec: +((elapsed / 1000)).toFixed(0),
          });
          this.positions.delete(symbol);

          const emoji = pnl >= 0 ? '💰' : '📉';
          this._log(`${emoji} CLOSE ${short} · ${reason} · spread now ${(spreadPct * 100).toFixed(4)}% · +$${pnl.toFixed(4)}`, pnl >= 0 ? 'win' : 'loss');
        }
      }

      // Enter paper trade on significant spreads
      if (spreadPct >= TRADE_THRESHOLD && !this.positions.has(symbol)) {
        const betSize = +(this.balance * BET_PCT).toFixed(2);
        this.positions.set(symbol, {
          symbol, betSize, spreadPct,
          entryBinance: binance, entryBybit: bybit,
          cheaperEx, expensiveEx,
          entryTime: Date.now(),
          entryTimeStr: new Date().toISOString(),
        });
        this._log(`📊 ARBITRAGE ${short} · B:$${binance.toLocaleString()} vs BB:$${bybit.toLocaleString()} · spread ${(spreadPct * 100).toFixed(3)}% [$${spread.toFixed(2)}] · buy ${cheaperEx} · $${betSize}`, 'trade');
      }

      // Log notable spreads
      if (spreadPct >= SPREAD_THRESHOLD) {
        this._log(`🔍 ${short} spread ${(spreadPct * 100).toFixed(4)}% — B:$${binance.toLocaleString()} Bybit:$${bybit.toLocaleString()} · buy ${cheaperEx}`, 'signal');
      }
    }
  }

  async _fetchBinance() {
    const prices = {};
    try {
      const res  = await fetch('https://api.binance.com/api/v3/ticker/price', { signal: AbortSignal.timeout(8_000) });
      const data = await res.json();
      for (const item of data) {
        if (SYMBOLS.includes(item.symbol)) prices[item.symbol] = parseFloat(item.price);
      }
    } catch { /* skip */ }
    return prices;
  }

  async _fetchBybit() {
    const prices = {};
    try {
      for (const symbol of SYMBOLS) {
        const res  = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`, { signal: AbortSignal.timeout(8_000) });
        const data = await res.json();
        const item = data?.result?.list?.[0];
        if (item) prices[symbol] = parseFloat(item.lastPrice || 0);
      }
    } catch { /* skip */ }
    return prices;
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
      spreads:     this.spreads,
      positions:   [...this.positions.values()],
      trades:      this.trades.slice(0, 30),
      activityLog: this.activityLog.slice(0, 60),
      spreadHist:  this.spreadHist.slice(0, 60),
      stats: {
        totalScans:      this.stats.totalScans,
        totalTrades:     this.stats.totalTrades,
        totalPnl:        +this.stats.totalPnl.toFixed(4),
        todayPnl:        +this.stats.todayPnl.toFixed(4),
        balance:         +this.balance.toFixed(2),
        startingBalance: STARTING_BALANCE,
        openPositions:   this.positions.size,
        maxSpread:       this.stats.maxSpread,
        running:         !!this._interval,
      },
    };
  }
}
