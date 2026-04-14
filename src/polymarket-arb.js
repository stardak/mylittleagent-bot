// ══════════════════════════════════════════════════════════════════════════════
// POLYMARKET ARB SCANNER
// ══════════════════════════════════════════════════════════════════════════════
// Scans ALL active binary (YES/NO) markets on Polymarket for price gaps.
// In an efficient market, YES + NO = $1.00 exactly.
// When YES + NO < $1.00, the difference is a theoretical arbitrage opportunity.
//
// Auto-takes any gap ≥ 2¢ as a paper trade ($10 notional).
// Runs completely independently of the Kronos scalper.
// ══════════════════════════════════════════════════════════════════════════════

const GAMMA_API      = 'https://gamma-api.polymarket.com';
const MIN_GAP        = 0.02;   // 2 cents threshold to paper-trade
const BET_SIZE       = 10;     // $10 notional per paper trade
const MAX_LOG        = 200;    // Activity log cap
const MAX_TRADES     = 500;    // Paper trades cap
const MAX_OPPS       = 50;     // Max live opportunities to show

export class PolymarketArbScanner {
  constructor() {
    this.opportunities  = [];    // Current scan's mispriced markets
    this.paperTrades    = [];    // History of auto-taken paper trades
    this.activityLog    = [];    // All gap events (tradeable or not)
    this._interval      = null;

    this.stats = {
      totalScans:            0,
      marketsChecked:        0,
      opportunitiesFound:    0,   // Any gap > 0
      tradesAutoTaken:       0,   // Gaps ≥ MIN_GAP
      totalTheoreticalProfit: 0,
      avgGapCents:           0,
      _allGaps:              [],
      lastScan:              null,
      lastScanDuration:      null,
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  start(intervalMs = 30_000) {
    this._doScan();                                      // Immediate first scan
    this._interval = setInterval(() => this._doScan(), intervalMs);
    console.log(`[PolyArb] Scanner started (every ${intervalMs / 1000}s)`);
  }

  stop() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
  }

  // ── Core scan ──────────────────────────────────────────────────────────────

  async _doScan() {
    const t0 = Date.now();
    this.stats.totalScans++;
    this.stats.lastScan = new Date().toISOString();

    try {
      const markets = await this._fetchMarkets();
      this.stats.marketsChecked += markets.length;

      const found = [];

      for (const market of markets) {
        const opp = this._analyze(market);
        if (!opp || opp.gap <= 0) continue;

        // Track stats
        this.stats.opportunitiesFound++;
        this.stats._allGaps.push(opp.gap);
        this.stats.avgGapCents =
          this.stats._allGaps.reduce((a, b) => a + b, 0) /
          this.stats._allGaps.length;

        // Activity log (all gaps, tradeable or not)
        this.activityLog.unshift({
          time:      new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          question:  opp.question.slice(0, 72),
          yes:       opp.yesPrice,
          no:        opp.noPrice,
          gap:       opp.gap,
          profit:    opp.profit,
          tradeable: opp.gap >= MIN_GAP,
        });
        if (this.activityLog.length > MAX_LOG) this.activityLog.pop();

        // Auto paper trade for gaps ≥ threshold
        if (opp.gap >= MIN_GAP) {
          this.stats.tradesAutoTaken++;
          this.stats.totalTheoreticalProfit = +(this.stats.totalTheoreticalProfit + opp.profit).toFixed(4);
          this.paperTrades.unshift({
            ...opp,
            takenAt: new Date().toISOString(),
            tradeId: `PT-${Date.now().toString(36).toUpperCase()}`,
          });
          if (this.paperTrades.length > MAX_TRADES) this.paperTrades.pop();
        }

        found.push(opp);
      }

      // Sort by gap descending, keep top N
      this.opportunities = found
        .sort((a, b) => b.gap - a.gap)
        .slice(0, MAX_OPPS);

      this.stats.lastScanDuration = Date.now() - t0;

      if (found.length > 0) {
        console.log(`[PolyArb] ${markets.length} markets → ${found.length} gaps found (${found.filter(o => o.gap >= MIN_GAP).length} tradeable)`);
      }
    } catch (err) {
      console.error('[PolyArb] Scan error:', err.message);
    }
  }

  // ── Market analysis ────────────────────────────────────────────────────────

  _analyze(market) {
    try {
      // Parse YES and NO prices from outcomePrices JSON string
      const raw = market.outcomePrices;
      if (!raw) return null;
      const prices = (typeof raw === 'string' ? JSON.parse(raw) : raw).map(Number);
      if (prices.length < 2) return null;

      const yesPrice = prices[0];
      const noPrice  = prices[1];

      if (isNaN(yesPrice) || isNaN(noPrice)) return null;
      if (yesPrice <= 0 || noPrice <= 0)     return null;
      if (yesPrice >= 1 || noPrice >= 1)     return null;

      const total = yesPrice + noPrice;
      if (total >= 1.0) return null; // No arb (total ≥ $1)

      const gap = +((1.0 - total).toFixed(4));

      // Profit calculation: with $BET_SIZE, buy 1/(YES+NO) shares of each side
      // Cost = BET_SIZE, Return = BET_SIZE / total, Profit = BET_SIZE * (1/total - 1)
      const shares = BET_SIZE / total;
      const profit = +(shares - BET_SIZE).toFixed(4);

      const volume = parseFloat(market.volume || market.volumeNum || 0);

      return {
        id:         market.conditionId || market.id || market.slug || String(Math.random()),
        question:   market.question || market.title || 'Unknown Market',
        slug:       market.slug || '',
        yesPrice:   +yesPrice.toFixed(4),
        noPrice:    +noPrice.toFixed(4),
        total:      +total.toFixed(4),
        gap,
        gapCents:   +(gap * 100).toFixed(2),
        profit,
        volume,
        volumeStr:  this._fmtVol(volume),
        url:        `https://polymarket.com/event/${market.slug || ''}`,
        endDate:    market.endDate || market.end_date_iso || null,
      };
    } catch {
      return null;
    }
  }

  // ── Fetching ───────────────────────────────────────────────────────────────

  async _fetchMarkets() {
    // Fetch top-volume active markets — all categories (not just BTC)
    const url = `${GAMMA_API}/markets?active=true&closed=false&limit=250&order=volume&ascending=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Gamma API ${res.status}`);

    const data = await res.json();
    const all  = Array.isArray(data) ? data : (data.markets || []);

    // Filter to binary YES/NO markets with parseable prices
    return all.filter(m => {
      try {
        const p = typeof m.outcomePrices === 'string'
          ? JSON.parse(m.outcomePrices)
          : m.outcomePrices;
        return Array.isArray(p) && p.length === 2;
      } catch { return false; }
    });
  }

  // ── Public state (for API endpoint) ───────────────────────────────────────

  getState() {
    const s = this.stats;
    return {
      opportunities: this.opportunities,
      paperTrades:   this.paperTrades.slice(0, 100),
      activityLog:   this.activityLog.slice(0, 100),
      stats: {
        totalScans:             s.totalScans,
        marketsChecked:         s.marketsChecked,
        opportunitiesFound:     s.opportunitiesFound,
        tradesAutoTaken:        s.tradesAutoTaken,
        totalTheoreticalProfit: +s.totalTheoreticalProfit.toFixed(2),
        avgGapCents:            +(s.avgGapCents * 100).toFixed(2),
        lastScan:               s.lastScan,
        lastScanDuration:       s.lastScanDuration,
        running:                !!this._interval,
      },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _fmtVol(v) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  }
}
