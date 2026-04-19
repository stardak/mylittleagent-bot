// ══════════════════════════════════════════════════════════════════════════════
// POLYMARKET ARB SCANNER  v2
// ══════════════════════════════════════════════════════════════════════════════
// Scans ALL active binary (YES/NO) markets on Polymarket for price gaps.
// In an efficient market, YES + NO = $1.00 exactly.
// When YES + NO < $1.00, the difference is a theoretical arbitrage opportunity.
//
// Paper trading rules:
//   • One open paper trade per market at a time
//   • Trade opens when gap ≥ MIN_GAP and no open trade for that market
//   • Trade closes when YES + NO returns to ≥ $1.00 (gap disappears)
//   • Only CLOSED trades count toward realized P&L
//
// Data quality:
//   • YES and NO prices come from the SAME API response (delta = 0 ms always)
//   • Trades are flagged ⚠️ invalid if: gap > 15¢ OR volume < $1 K
//   • Flagged trades are excluded from "verified P&L"
// ══════════════════════════════════════════════════════════════════════════════

const GAMMA_API             = 'https://gamma-api.polymarket.com';
const MIN_GAP               = 0.02;      // 2¢ threshold to open a paper trade
const BET_SIZE              = 10;        // $10 notional per trade
const MAX_LOG               = 200;       // Activity log cap
const MAX_TRADES            = 500;       // Closed-trade history cap
const MAX_OPPS              = 50;        // Live opportunities shown in UI
const FLAG_GAP_THRESHOLD    = 0.15;      // >15¢ gap → flag as suspect
const FLAG_VOL_THRESHOLD    = 1_000;     // <$1 K volume → flag as thin

export class PolymarketArbScanner {
  constructor() {
    this.opportunities = [];          // Current scan's mispriced markets
    this.openTrades    = new Map();   // marketId → open trade object (one per market)
    this.paperTrades   = [];          // CLOSED trades (history)
    this.activityLog   = [];          // All gap events (tradeable or not)
    this._interval     = null;

    this.stats = {
      totalScans:          0,
      marketsChecked:      0,
      opportunitiesFound:  0,
      tradesAutoTaken:     0,   // total positions ever opened
      totalClosedTrades:   0,
      realizedPnl:         0,   // closed trades only (verified + unverified)
      verifiedPnl:         0,   // closed trades that are NOT flagged
      unverifiedPnl:       0,   // closed trades that ARE flagged
      _allGaps:            [],
      avgGapCents:         0,
      lastScan:            null,
      lastScanDuration:    null,
      startingBalance:     100,
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  start(intervalMs = 30_000) {
    this._doScan();
    this._interval = setInterval(() => this._doScan(), intervalMs);
    console.log(`[PolyArb] Scanner started — every ${intervalMs / 1000}s`);
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

      // O(1) lookup by id for the close-check loop
      const byId = new Map(
        markets.map(m => [m.conditionId || m.id || m.slug, m])
      );

      // ── Step 1: Close open trades where the gap has disappeared ─────────────
      for (const [marketId, trade] of this.openTrades) {
        const market = byId.get(marketId);
        if (!market) continue;   // not in this page of results — leave open

        const prices = (typeof market.outcomePrices === 'string'
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices).map(Number);
        const currentYes = prices[0];
        const currentNo  = prices[1];
        const total      = currentYes + currentNo;

        if (total >= 1.0) {
          // Gap is gone — close the trade
          const closed = {
            ...trade,
            status:      'closed',
            closedAt:    new Date().toISOString(),
            closedYes:   +currentYes.toFixed(4),
            closedNo:    +currentNo.toFixed(4),
            closedTotal: +total.toFixed(4),
          };

          this.paperTrades.unshift(closed);
          if (this.paperTrades.length > MAX_TRADES) this.paperTrades.pop();

          // Accumulate P&L
          this.stats.totalClosedTrades++;
          this.stats.realizedPnl = +(this.stats.realizedPnl + trade.profit).toFixed(4);
          if (trade.invalid) {
            this.stats.unverifiedPnl = +(this.stats.unverifiedPnl + trade.profit).toFixed(4);
          } else {
            this.stats.verifiedPnl = +(this.stats.verifiedPnl + trade.profit).toFixed(4);
          }

          console.log(`[PolyArb] CLOSE: "${trade.question.slice(0, 50)}" → total now ${(total * 100).toFixed(1)}¢ (profit: ${trade.profit >= 0 ? '+' : ''}$${trade.profit.toFixed(4)})`);
          this.openTrades.delete(marketId);
        }
      }

      // ── Step 2: Scan all markets for new opportunities ─────────────────────
      const found = [];

      for (const market of markets) {
        const opp = this._analyze(market, t0);
        if (!opp || opp.gap <= 0) continue;

        this.stats.opportunitiesFound++;
        this.stats._allGaps.push(opp.gap);
        this.stats.avgGapCents =
          this.stats._allGaps.reduce((a, b) => a + b, 0) /
          this.stats._allGaps.length;

        const hasOpenTrade = this.openTrades.has(opp.id);

        // Activity log — all detected gaps
        this.activityLog.unshift({
          time:      new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          question:  opp.question.slice(0, 72),
          yes:       opp.yesPrice,
          no:        opp.noPrice,
          gap:       opp.gap,
          profit:    opp.profit,
          tradeable: opp.gap >= MIN_GAP,
          skipped:   hasOpenTrade,
          invalid:   opp.invalid,
        });
        if (this.activityLog.length > MAX_LOG) this.activityLog.pop();

        // Open a paper trade only if: gap meets threshold AND no open trade for this market
        if (opp.gap >= MIN_GAP && !hasOpenTrade) {
          const trade = {
            ...opp,
            takenAt:     new Date().toISOString(),
            tradeId:     `PT-${Date.now().toString(36).toUpperCase()}`,
            status:      'open',
            priceDeltaMs: 0,   // YES & NO prices are from the SAME API response object
                               // (field: outcomePrices[0] and outcomePrices[1])
                               // so the fetch delta is always 0 ms by construction.
          };
          this.openTrades.set(opp.id, trade);
          this.stats.tradesAutoTaken++;
          console.log(`[PolyArb] OPEN: "${opp.question.slice(0, 50)}" gap=${(opp.gap * 100).toFixed(1)}¢${opp.invalid ? ' ⚠️ FLAGGED' : ''}`);
        }

        found.push({ ...opp, hasOpenTrade: this.openTrades.has(opp.id) });
      }

      this.opportunities = found
        .sort((a, b) => b.gap - a.gap)
        .slice(0, MAX_OPPS);

      this.stats.lastScanDuration = Date.now() - t0;

      const tradeable = found.filter(o => o.gap >= MIN_GAP);
      if (tradeable.length > 0 || this.openTrades.size > 0) {
        console.log(`[PolyArb] ${markets.length} mkts → ${found.length} gaps, ${tradeable.length} tradeable | open positions: ${this.openTrades.size}`);
      }

    } catch (err) {
      console.error('[PolyArb] Scan error:', err.message);
    }
  }

  // ── Market analysis ────────────────────────────────────────────────────────

  _analyze(market, fetchedAt) {
    try {
      const raw = market.outcomePrices;
      if (!raw) return null;

      // YES and NO come from the SAME array in the SAME API response.
      // priceDeltaMs is always 0 — this is documented in the trade object.
      const prices = (typeof raw === 'string' ? JSON.parse(raw) : raw).map(Number);
      if (prices.length < 2) return null;

      const yesPrice = prices[0];
      const noPrice  = prices[1];

      if (isNaN(yesPrice) || isNaN(noPrice)) return null;
      if (yesPrice <= 0 || noPrice <= 0)     return null;
      if (yesPrice >= 1 || noPrice >= 1)     return null;

      const total = yesPrice + noPrice;
      if (total >= 1.0) return null;

      const gap    = +((1.0 - total).toFixed(4));
      const shares = BET_SIZE / total;
      const profit = +(shares - BET_SIZE).toFixed(4);
      const volume = parseFloat(market.volume || market.volumeNum || 0);

      // Validation — flag trades that are likely stale / illiquid
      let invalid    = false;
      let flagReason = null;
      if (gap > FLAG_GAP_THRESHOLD) {
        invalid    = true;
        flagReason = `Gap ${(gap * 100).toFixed(0)}¢ > 15¢ — likely stale or illiquid data`;
      } else if (volume < FLAG_VOL_THRESHOLD) {
        invalid    = true;
        flagReason = `Volume $${volume.toFixed(0)} < $1K — market too thin`;
      }

      return {
        id:           market.conditionId || market.id || market.slug || String(Math.random()),
        question:     market.question || market.title || 'Unknown Market',
        slug:         market.slug || '',
        yesPrice:     +yesPrice.toFixed(4),
        noPrice:      +noPrice.toFixed(4),
        total:        +total.toFixed(4),
        gap,
        gapCents:     +(gap * 100).toFixed(2),
        profit,
        volume,
        volumeStr:    this._fmtVol(volume),
        url:          `https://polymarket.com/event/${market.slug || ''}`,
        endDate:      market.endDate || market.end_date_iso || null,
        fetchedAt,
        priceDeltaMs: 0,       // always 0 — same API response object
        invalid,
        flagReason,
      };
    } catch {
      return null;
    }
  }

  // ── Fetching ───────────────────────────────────────────────────────────────

  async _fetchMarkets() {
    const url = `${GAMMA_API}/markets?active=true&closed=false&limit=250&order=volume&ascending=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Gamma API ${res.status}`);

    const data = await res.json();
    const all  = Array.isArray(data) ? data : (data.markets || []);

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
    const s        = this.stats;
    const openArr  = [...this.openTrades.values()];
    const realPnl  = +s.realizedPnl.toFixed(2);

    return {
      opportunities: this.opportunities,
      // Open trades first, then closed history
      paperTrades:   [...openArr, ...this.paperTrades].slice(0, 100),
      activityLog:   this.activityLog.slice(0, 100),
      stats: {
        totalScans:          s.totalScans,
        marketsChecked:      s.marketsChecked,
        opportunitiesFound:  s.opportunitiesFound,
        tradesAutoTaken:     s.tradesAutoTaken,
        openPositions:       openArr.length,
        totalClosedTrades:   s.totalClosedTrades,
        realizedPnl:         realPnl,
        verifiedPnl:         +s.verifiedPnl.toFixed(2),
        unverifiedPnl:       +s.unverifiedPnl.toFixed(2),
        // Legacy fields — hero panel uses these
        totalTheoreticalProfit: realPnl,
        currentBalance:         +(100 + realPnl).toFixed(2),
        avgGapCents:            +(s.avgGapCents * 100).toFixed(2),
        startingBalance:        s.startingBalance,
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
