// ══════════════════════════════════════════════════════════════════════════════
// POLYMARKET ARB SCANNER  v3
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
//
// v3 additions:
//   • Gap duration tracking — records how long each gap stayed open
//   • Top-5 "Best Gaps Ever Seen" leaderboard — persisted to disk
//   • Market category breakdown — Crypto / Sports / Politics / Finance / Weather / Other
//   • Telegram alerts for gaps ≥ 5¢ (once per gap event, not repeatedly)
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const GAMMA_API             = 'https://gamma-api.polymarket.com';
const DISPLAY_GAP_THRESHOLD = 0.005;  // 0.5¢ — minimum gap to count at all
const MIN_GAP               = 0.02;   // 2¢ threshold to open a paper trade
const LIQUIDITY_THRESHOLD   = 5_000;  // $5 K minimum volume to show or trade
const ALERT_GAP             = 0.05;   // 5¢ threshold to fire Telegram alert
const BET_SIZE              = 10;     // $10 notional per trade
const MAX_LOG               = 200;    // Activity log cap
const MAX_TRADES            = 500;    // Closed-trade history cap
const MAX_OPPS              = 50;     // Live opportunities shown in UI
const MAX_FETCH_PAGES       = 3;      // Pages of 250 markets to fetch per scan
const TOP_GAPS_LIMIT        = 5;      // “Best Gaps” leaderboard size
const FLAG_GAP_THRESHOLD    = 0.15;   // >15¢ gap → flag as suspect
const FLAG_VOL_THRESHOLD    = 1_000;  // <$1 K volume → flag as thin
const HIGH_VOL_WINDOW_MS    = 86_400_000; // 24 h — window for highest-vol gap tracker

// ── Category keyword matching ──────────────────────────────────────────────
const CATEGORY_RULES = [
  { name: 'Crypto',   words: ['bitcoin','btc','eth','ethereum','solana','sol','crypto','blockchain','doge','xrp','nft','defi','usdc','usdt','token','altcoin'] },
  { name: 'Sports',   words: ['nba','nfl','nhl','mlb','soccer','tennis','golf','football','basketball','champion','league','match','super bowl','world cup','playoff','wimbledon','formula','mma','ufc','boxing','cricket','rugby','olympics'] },
  { name: 'Politics', words: ['president','election','vote','congress','senate','democrat','republican','trump','biden','harris','tariff','policy','governor','minister','parliament','white house','nato','geopolit'] },
  { name: 'Weather',  words: ['hurricane','earthquake','storm','flood','temperature','climate','tornado','typhoon','drought','wildfire','blizzard','cyclone'] },
  { name: 'Finance',  words: ['fed','fomc','rate','gdp','inflation','sp500','nasdaq','dow','recession','treasury','interest','yield','cpi','pce','employment','jobs','market cap','earnings'] },
];

function classifyMarket(question) {
  const q = question.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some(w => q.includes(w))) return rule.name;
  }
  return 'Other';
}

export class PolymarketArbScanner {
  constructor(options = {}) {
    this.opportunities  = [];
    this.openTrades     = new Map();   // marketId → open trade
    this.paperTrades    = [];          // CLOSED trades
    this.activityLog    = [];
    this._interval      = null;

    // ── Feature 1: Gap duration — track when each gap first appeared ────────
    this.gapStartTimes  = new Map();   // marketId → Date.now() when first seen
    this._allDurations  = [];          // seconds, for average computation

    // ── Feature 2: Leaderboard ──────────────────────────────────────────────
    this.topGaps        = [];          // up to TOP_GAPS_LIMIT entries, sorted by gapCents desc
    this._dataDir       = options.dataDir || process.cwd();
    this._leaderboardPath = path.join(this._dataDir, 'data', 'poly-topgaps.json');
    this._loadLeaderboard();

    // ── Feature 3: Category stats ───────────────────────────────────────────
    this.categoryStats  = {};
    for (const rule of CATEGORY_RULES) {
      this.categoryStats[rule.name] = { count: 0, totalGapCents: 0 };
    }
    this.categoryStats['Other'] = { count: 0, totalGapCents: 0 };

    // ── Feature 4: Telegram alerts ──────────────────────────────────────────
    this.telegramAlerted = new Set();
    this._tgToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this._tgChat  = process.env.TELEGRAM_CHAT_ID   || null;

    // ── Liquidity tracking: highest-volume market with any gap (24 h) ────────
    this.highVolumeGap = null;   // { question, volume, volumeStr, gapCents, seenAt, url }

    this.stats = {
      totalScans:          0,
      marketsChecked:      0,
      totalGapsRaw:        0,   // any gap ≥ 0.5¢ regardless of volume
      qualifiedGaps:       0,   // gap ≥ 2¢ AND volume ≥ $5 K
      opportunitiesFound:  0,   // alias kept for legacy UI fields
      tradesAutoTaken:     0,
      totalClosedTrades:   0,
      realizedPnl:         0,
      verifiedPnl:         0,
      unverifiedPnl:       0,
      todayPnl:            0,
      todayTrades:         0,
      todayWins:           0,
      _todayDate:          new Date().toDateString(),
      avgGapDurationSec:   0,
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

      const byId = new Map(
        markets.map(m => [m.conditionId || m.id || m.slug, m])
      );

      // ── Step 1: Close open trades where the gap has disappeared ─────────
      for (const [marketId, trade] of this.openTrades) {
        const market = byId.get(marketId);
        if (!market) continue;

        const prices     = (typeof market.outcomePrices === 'string'
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices).map(Number);
        const currentYes = prices[0];
        const currentNo  = prices[1];
        const total      = currentYes + currentNo;

        if (total >= 1.0) {
          // ── Compute duration ──────────────────────────────────────────
          const durationSec = trade.gapOpenedAt
            ? Math.round((Date.now() - trade.gapOpenedAt) / 1000)
            : null;

          if (durationSec !== null) {
            this._allDurations.push(durationSec);
            this.stats.avgGapDurationSec = Math.round(
              this._allDurations.reduce((a, b) => a + b, 0) /
              this._allDurations.length
            );
          }

          const closed = {
            ...trade,
            status:      'closed',
            closedAt:    new Date().toISOString(),
            closedYes:   +currentYes.toFixed(4),
            closedNo:    +currentNo.toFixed(4),
            closedTotal: +total.toFixed(4),
            durationSec,
          };

          this.paperTrades.unshift(closed);
          if (this.paperTrades.length > MAX_TRADES) this.paperTrades.pop();

          // P&L
          this.stats.totalClosedTrades++;
          this.stats.realizedPnl = +(this.stats.realizedPnl + trade.profit).toFixed(4);
          if (trade.invalid) {
            this.stats.unverifiedPnl = +(this.stats.unverifiedPnl + trade.profit).toFixed(4);
          } else {
            this.stats.verifiedPnl = +(this.stats.verifiedPnl + trade.profit).toFixed(4);
          }

          // Today's stats
          const todayStr = new Date().toDateString();
          if (this.stats._todayDate !== todayStr) {
            this.stats.todayPnl    = 0;
            this.stats.todayTrades = 0;
            this.stats.todayWins   = 0;
            this.stats._todayDate  = todayStr;
          }
          this.stats.todayTrades++;
          this.stats.todayPnl = +(this.stats.todayPnl + trade.profit).toFixed(4);
          if (trade.profit > 0) this.stats.todayWins++;

          // ── Update leaderboard ────────────────────────────────────────
          this._updateLeaderboard({
            question:    trade.question,
            gapCents:    trade.gapCents,
            durationSec,
            hadTrade:    true,
            seenAt:      trade.takenAt,
          });

          // Clean up duration tracker + telegram alert set for this market
          this.gapStartTimes.delete(marketId);
          this.telegramAlerted.delete(marketId);

          console.log(`[PolyArb] CLOSE: "${trade.question.slice(0, 50)}" → ${(total * 100).toFixed(1)}¢ total, duration ${durationSec ?? '?'}s`);
          this.openTrades.delete(marketId);
        }
      }

      // ── Step 2: Scan all markets for new opportunities ─────────────────
      const found = [];

      for (const market of markets) {
        const opp = this._analyze(market, t0);
        // Display threshold: 0.5¢. Auto-trade threshold: 2¢.
        if (!opp || opp.gap < DISPLAY_GAP_THRESHOLD) continue;

        this.stats.totalGapsRaw++;        // count every gap ≥ 0.5¢ seen
        const isLiquid = opp.volume >= LIQUIDITY_THRESHOLD;

        // ── Highest-volume gap tracker (24 h window) ──────────────────
        const now24 = Date.now();
        if (
          !this.highVolumeGap ||
          opp.volume > this.highVolumeGap.volume ||
          (this.highVolumeGap.seenAt && now24 - this.highVolumeGap.seenAt > HIGH_VOL_WINDOW_MS)
        ) {
          if (!this.highVolumeGap || opp.volume > this.highVolumeGap.volume) {
            this.highVolumeGap = {
              question:  opp.question,
              volume:    opp.volume,
              volumeStr: opp.volumeStr,
              gapCents:  opp.gapCents,
              category:  opp.category,
              url:       opp.url,
              seenAt:    now24,
            };
          }
        }

        // Skip illiquid markets from activity feed entirely
        if (!isLiquid) continue;

        this.stats.opportunitiesFound++;   // legacy — now means liquid gaps found
        this.stats._allGaps.push(opp.gap);
        this.stats.avgGapCents =
          this.stats._allGaps.reduce((a, b) => a + b, 0) /
          this.stats._allGaps.length;

        // ── Feature 1: Record gap start time if first sighting ────────
        if (!this.gapStartTimes.has(opp.id)) {
          this.gapStartTimes.set(opp.id, t0);
        }
        const gapOpenedAt = this.gapStartTimes.get(opp.id);

        // ── Feature 3: Category stats ─────────────────────────────────
        const cat = classifyMarket(opp.question);
        if (this.categoryStats[cat]) {
          this.categoryStats[cat].count++;
          this.categoryStats[cat].totalGapCents = +(
            this.categoryStats[cat].totalGapCents + opp.gapCents
          ).toFixed(2);
        }

        const hasOpenTrade = this.openTrades.has(opp.id);

        // Activity log — liquid gaps ≥ 0.5¢ only
        this.activityLog.unshift({
          time:      new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          question:  opp.question.slice(0, 72),
          yes:       opp.yesPrice,
          no:        opp.noPrice,
          gap:       opp.gap,
          profit:    opp.profit,
          tradeable: opp.gap >= MIN_GAP,           // ≥2¢ + liquid → auto-trade eligible
          watch:     opp.gap < MIN_GAP,             // 0.5¢–2¢ + liquid → monitor only
          skipped:   hasOpenTrade,
          invalid:   opp.invalid,
          volumeStr: opp.volumeStr,
        });
        if (this.activityLog.length > MAX_LOG) this.activityLog.pop();

        // Open paper trade only for qualified gaps: ≥2¢ AND liquid AND no open trade
        const isQualified = opp.gap >= MIN_GAP;
        if (isQualified) this.stats.qualifiedGaps++;

        if (isQualified && !hasOpenTrade) {
          const trade = {
            ...opp,
            gapOpenedAt,
            takenAt:      new Date().toISOString(),
            tradeId:      `PT-${Date.now().toString(36).toUpperCase()}`,
            status:       'open',
            priceDeltaMs: 0,
          };
          this.openTrades.set(opp.id, trade);
          this.stats.tradesAutoTaken++;
          console.log(`[PolyArb] OPEN: "${opp.question.slice(0, 50)}" gap=${(opp.gap * 100).toFixed(1)}¢${opp.invalid ? ' ⚠️ FLAGGED' : ''}`);
        }

        // ── Feature 4: Telegram alert for big gaps ─────────────────────
        if (opp.gap >= ALERT_GAP && !this.telegramAlerted.has(opp.id)) {
          this.telegramAlerted.add(opp.id);
          this._sendTelegram(
            `🚨 *Polymarket gap alert*\n` +
            `*${opp.question.slice(0, 80)}*\n` +
            `YES ${(opp.yesPrice * 100).toFixed(1)}¢ + NO ${(opp.noPrice * 100).toFixed(1)}¢ = ${(opp.total * 100).toFixed(1)}¢\n` +
            `Gap: *+${opp.gapCents.toFixed(1)}¢* · Vol: ${opp.volumeStr}` +
            (opp.invalid ? `\n⚠️ _${opp.flagReason}_` : '')
          );
        }

        found.push({ ...opp, gapOpenedAt, hasOpenTrade: this.openTrades.has(opp.id) });
      }

      // Clean up gapStartTimes for markets no longer showing a gap
      for (const [marketId] of this.gapStartTimes) {
        if (!found.some(o => o.id === marketId)) {
          this.gapStartTimes.delete(marketId);
          this.telegramAlerted.delete(marketId);
        }
      }

      this.opportunities = found
        .sort((a, b) => b.gap - a.gap)
        .slice(0, MAX_OPPS);

      this.stats.lastScanDuration = Date.now() - t0;

      const tradeable = found.filter(o => o.gap >= MIN_GAP);
      const watching  = found.filter(o => o.gap >= DISPLAY_GAP_THRESHOLD && o.gap < MIN_GAP);
      console.log(`[PolyArb] ${markets.length} mkts | raw gaps: ${this.stats.totalGapsRaw} | liquid ≥0.5¢: ${found.length} (${tradeable.length} qualified, ${watching.length} watch) | open: ${this.openTrades.size}`);

    } catch (err) {
      console.error('[PolyArb] Scan error:', err.message);
    }
  }

  // ── Market analysis ────────────────────────────────────────────────────────

  _analyze(market, fetchedAt) {
    try {
      const raw = market.outcomePrices;
      if (!raw) return null;

      const prices = (typeof raw === 'string' ? JSON.parse(raw) : raw).map(Number);
      if (prices.length < 2) return null;

      const yesPrice = prices[0];
      const noPrice  = prices[1];

      if (isNaN(yesPrice) || isNaN(noPrice)) return null;
      if (yesPrice <= 0 || noPrice <= 0)     return null;
      if (yesPrice >= 1 || noPrice >= 1)     return null;

      const total  = yesPrice + noPrice;
      if (total >= 1.0) return null;

      const gap    = +((1.0 - total).toFixed(4));
      const profit = +(BET_SIZE / total - BET_SIZE).toFixed(4);
      const volume = parseFloat(market.volume || market.volumeNum || 0);

      let invalid = false, flagReason = null;
      if (gap > FLAG_GAP_THRESHOLD) {
        invalid = true;
        flagReason = `Gap ${(gap * 100).toFixed(0)}¢ > 15¢ — likely stale or illiquid data`;
      } else if (volume < FLAG_VOL_THRESHOLD) {
        invalid = true;
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
        priceDeltaMs: 0,
        invalid,
        flagReason,
        category:     classifyMarket(market.question || market.title || ''),
      };
    } catch {
      return null;
    }
  }

  // ── Feature 2: Leaderboard helpers ────────────────────────────────────────

  _updateLeaderboard(entry) {
    // Add or replace if same question
    const idx = this.topGaps.findIndex(g => g.question === entry.question);
    if (idx === -1) {
      this.topGaps.push(entry);
    } else if (entry.gapCents > this.topGaps[idx].gapCents) {
      this.topGaps[idx] = entry;   // update with bigger gap observation
    }
    this.topGaps.sort((a, b) => b.gapCents - a.gapCents);
    if (this.topGaps.length > TOP_GAPS_LIMIT) this.topGaps.length = TOP_GAPS_LIMIT;
    this._saveLeaderboard();
  }

  _saveLeaderboard() {
    try {
      const dir = path.join(this._dataDir, 'data');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this._leaderboardPath, JSON.stringify(this.topGaps, null, 2));
    } catch (e) {
      console.warn('[PolyArb] Leaderboard save failed:', e.message);
    }
  }

  _loadLeaderboard() {
    try {
      if (existsSync(this._leaderboardPath)) {
        this.topGaps = JSON.parse(readFileSync(this._leaderboardPath, 'utf8'));
        console.log(`[PolyArb] Loaded ${this.topGaps.length} leaderboard entries`);
      }
    } catch (e) {
      console.warn('[PolyArb] Leaderboard load failed:', e.message);
      this.topGaps = [];
    }
  }

  // ── Feature 4: Telegram ────────────────────────────────────────────────────

  async _sendTelegram(text) {
    if (!this._tgToken || !this._tgChat) return;
    try {
      const url = `https://api.telegram.org/bot${this._tgToken}/sendMessage`;
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: this._tgChat, text, parse_mode: 'Markdown' }),
        signal:  AbortSignal.timeout(8_000),
      });
      if (!res.ok) console.warn('[PolyArb] Telegram error:', res.status);
      else console.log('[PolyArb] Telegram alert sent');
    } catch (e) {
      console.warn('[PolyArb] Telegram send failed:', e.message);
    }
  }

  // ── Fetching (paginated) ───────────────────────────────────────────────────
  // Fetches up to MAX_FETCH_PAGES × 250 markets per scan.
  // Pages 1–2: top-volume markets (already ordered desc)
  // Page 3+: reversed order (lowest-volume first) to capture illiquid markets
  // where pricing inefficiencies are more common.

  async _fetchMarkets() {
    const pages  = [];
    const perPage = 250;

    const fetchPage = async (offset, ascending = false) => {
      const url = `${GAMMA_API}/markets?active=true&closed=false&limit=${perPage}&order=volume&ascending=${ascending}&offset=${offset}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`Gamma API ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.markets || []);
    };

    // Page 1: top 250 by volume (most liquid, already fetched historically)
    const page1 = await fetchPage(0, false);
    pages.push(...page1);

    // Page 2: next 250 by volume (offset 250)
    if (MAX_FETCH_PAGES >= 2 && page1.length === perPage) {
      try {
        const page2 = await fetchPage(250, false);
        pages.push(...page2);

        // Page 3: lowest-volume active markets (ascending) — most likely to have gaps
        if (MAX_FETCH_PAGES >= 3 && page2.length === perPage) {
          try {
            const page3 = await fetchPage(0, true);
            // Deduplicate by conditionId/id/slug
            const seen = new Set(pages.map(m => m.conditionId || m.id || m.slug));
            pages.push(...page3.filter(m => !seen.has(m.conditionId || m.id || m.slug)));
          } catch (e) {
            console.warn('[PolyArb] Page 3 fetch failed (offset may not be supported):', e.message);
          }
        }
      } catch (e) {
        console.warn('[PolyArb] Page 2 fetch failed:', e.message);
      }
    }

    // Filter to binary YES/NO markets with parseable prices
    return pages.filter(m => {
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
    const s       = this.stats;
    const openArr = [...this.openTrades.values()];
    const realPnl = +s.realizedPnl.toFixed(2);

    // Category breakdown with averages
    const cats = Object.entries(this.categoryStats).map(([name, d]) => ({
      name,
      count:      d.count,
      avgGapCents: d.count > 0 ? +(d.totalGapCents / d.count).toFixed(2) : 0,
    })).sort((a, b) => b.count - a.count);

    // Open trades with current duration (still ticking)
    const now = Date.now();
    const openWithDuration = openArr.map(t => ({
      ...t,
      durationSec: t.gapOpenedAt ? Math.round((now - t.gapOpenedAt) / 1000) : null,
    }));

    return {
      opportunities: this.opportunities,
      paperTrades:   [...openWithDuration, ...this.paperTrades].slice(0, 100),
      activityLog:   this.activityLog.slice(0, 100),
      topGaps:       this.topGaps,
      categoryStats: cats,
      stats: {
        totalScans:          s.totalScans,
        marketsChecked:      s.marketsChecked,
        totalGapsRaw:        s.totalGapsRaw,
        qualifiedGaps:       s.qualifiedGaps,
        opportunitiesFound:  s.opportunitiesFound,
        tradesAutoTaken:     s.tradesAutoTaken,
        openPositions:       openArr.length,
        totalClosedTrades:   s.totalClosedTrades,
        realizedPnl:         realPnl,
        verifiedPnl:         +s.verifiedPnl.toFixed(2),
        unverifiedPnl:       +s.unverifiedPnl.toFixed(2),
        todayPnl:            +s.todayPnl.toFixed(4),
        todayTrades:         s.todayTrades,
        todayWins:           s.todayWins,
        winRate:             s.totalClosedTrades > 0
                               ? +((s.todayWins / s.totalClosedTrades) * 100).toFixed(1)
                               : null,
        avgGapDurationSec:   s.avgGapDurationSec,
        highVolumeGap:       this.highVolumeGap,
        // Legacy
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
