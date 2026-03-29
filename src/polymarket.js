// ══════════════════════════════════════════════════════════════════════════════
// POLYMARKET MULTI-CATEGORY SCANNER
// ══════════════════════════════════════════════════════════════════════════════
// Scans Polymarket for high-volume markets across:
//   1. Politics/Elections — highest volume, most liquidity
//   2. Macro events — Fed, CPI, jobs data
//   3. AI & Tech milestones
//   4. Crypto price (original)
//
// For each market: YES/NO prices, volume, resolution date, edge score
// Minimum $10K total volume to filter illiquid markets
// ══════════════════════════════════════════════════════════════════════════════

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API  = 'https://clob.polymarket.com';

// Category search terms with priority ordering
const CATEGORIES = [
  {
    name: 'Politics',
    icon: '🏛️',
    color: '#ff453a',
    searches: [
      'president', 'election', 'trump', 'biden', 'democrat', 'republican',
      'congress', 'senate', 'governor', 'primary', 'vote', 'nominee',
      'cabinet', 'impeach', 'executive order', 'poll'
    ],
  },
  {
    name: 'Macro',
    icon: '📊',
    color: '#ff9f0a',
    searches: [
      'fed', 'federal reserve', 'interest rate', 'rate cut', 'rate hike',
      'cpi', 'inflation', 'jobs report', 'unemployment', 'nonfarm', 'gdp',
      'recession', 'treasury', 'debt ceiling', 'tariff', 'trade war'
    ],
  },
  {
    name: 'AI & Tech',
    icon: '🤖',
    color: '#30d158',
    searches: [
      'ai', 'artificial intelligence', 'openai', 'gpt', 'chatgpt',
      'apple', 'google', 'microsoft', 'tesla', 'nvidia', 'agi',
      'spacex', 'launch', 'self-driving', 'quantum', 'tiktok ban'
    ],
  },
  {
    name: 'Crypto',
    icon: '₿',
    color: '#ff9f0a',
    searches: [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol',
      'crypto', 'blockchain', 'etf', 'halving'
    ],
  },
];

export class PolymarketScanner {
  constructor(apiKey, alertService) {
    this.apiKey = apiKey;
    this.alerts = alertService;
    this.activeMarkets = [];        // All discovered markets across categories
    this.marketsByCategory = {};    // Categorized for dashboard
    this.knownMarketIds = new Set();
    this.lastMarketRefresh = 0;
    this.MARKET_REFRESH_INTERVAL = 30_000;  // 30s (broader search = less frequent)
    this.MIN_VOLUME = 10_000;               // $10K minimum total volume

    for (const cat of CATEGORIES) {
      this.marketsByCategory[cat.name] = [];
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${GAMMA_API}/markets?limit=1`);
      if (!response.ok) return { ok: false, reason: `Gamma API returned ${response.status}` };
      const clobResponse = await fetch(`${CLOB_API}/midpoint?token_id=test`);
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  // ── Main entry: get all interesting markets ──────────────────────────────
  async getOpportunities(binanceData) {
    await this._refreshMarkets();

    // For crypto price markets, run the old arbitrage check
    const opportunities = [];
    for (const market of (this.marketsByCategory['Crypto'] || [])) {
      try {
        const symbol = this._detectCryptoSymbol(market);
        if (!symbol) continue;
        const priceData = binanceData[symbol];
        if (!priceData || !priceData.price) continue;

        const polyPrice = market.yesPrice;
        if (polyPrice === null) continue;

        const binanceImpliedProb = this._calculateBinanceImpliedProb(priceData, market);
        if (binanceImpliedProb === null) continue;

        const gapPct = (binanceImpliedProb - polyPrice) * 100;

        if (Math.abs(gapPct) >= 4.0) {
          opportunities.push({
            marketId: market.id,
            slug: market.slug,
            symbol,
            question: market.question,
            polyImpliedProb: polyPrice,
            binanceImpliedProb,
            gapPct: Math.abs(gapPct),
            side: gapPct > 0 ? 'YES' : 'NO',
            currentPrice: priceData.price,
            momentum: priceData.momentum,
            liquidity: market.volume,
            polyPrice,
          });
        }
      } catch (err) { /* skip */ }
    }

    return opportunities;
  }

  // ── Get all markets for dashboard display ───────────────────────────────
  getMarketCards() {
    return this.marketsByCategory;
  }

  getAllMarkets() {
    return this.activeMarkets;
  }

  // ── Refresh: scan all categories ────────────────────────────────────────
  async _refreshMarkets() {
    const now = Date.now();
    if (now - this.lastMarketRefresh < this.MARKET_REFRESH_INTERVAL) return;
    this.lastMarketRefresh = now;

    const allDiscovered = [];

    // 1. Fetch top markets by volume (catches most high-volume markets)
    try {
      const url = `${GAMMA_API}/markets?active=true&closed=false&limit=200&order=volume&ascending=false`;
      const resp = await fetch(url);
      if (resp.ok) {
        const markets = await resp.json();
        if (Array.isArray(markets)) allDiscovered.push(...markets);
      }
    } catch { /* skip */ }

    // 2. Fetch top events (catches grouped markets)
    try {
      const url = `${GAMMA_API}/events?active=true&closed=false&limit=100&order=volume&ascending=false`;
      const resp = await fetch(url);
      if (resp.ok) {
        const events = await resp.json();
        for (const event of events) {
          if (event.markets && Array.isArray(event.markets)) {
            allDiscovered.push(...event.markets);
          }
        }
      }
    } catch { /* skip */ }

    // 3. Category-specific keyword searches for anything missed
    for (const cat of CATEGORIES) {
      // Only search a few key terms (not all, to avoid rate limits)
      const topSearches = cat.searches.slice(0, 3);
      for (const term of topSearches) {
        try {
          const url = `${GAMMA_API}/markets?` + new URLSearchParams({
            active: 'true', closed: 'false', limit: '50', search: term
          });
          const resp = await fetch(url);
          if (resp.ok) {
            const markets = await resp.json();
            if (Array.isArray(markets)) allDiscovered.push(...markets);
          }
        } catch { /* skip */ }
        // Tiny delay between searches to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // Deduplicate
    const seen = new Set();
    const unique = [];
    for (const m of allDiscovered) {
      const id = m.conditionId || m.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      unique.push(m);
    }

    // Filter: must have $10K+ volume, must be active
    const filtered = unique.filter(m => {
      const vol = parseFloat(m.volume || m.volumeNum || 0);
      if (vol < this.MIN_VOLUME) return false;
      if (m.endDate || m.end_date_iso) {
        const end = new Date(m.endDate || m.end_date_iso);
        if (end < new Date()) return false;
      }
      return true;
    });

    // Categorize
    for (const cat of CATEGORIES) {
      this.marketsByCategory[cat.name] = [];
    }
    this.marketsByCategory['Other'] = [];

    for (const m of filtered) {
      const cat = this._categorize(m);
      const enriched = this._enrichMarket(m, cat);
      if (!this.marketsByCategory[cat]) this.marketsByCategory[cat] = [];
      this.marketsByCategory[cat].push(enriched);
    }

    // Sort each category by volume descending
    for (const cat of Object.keys(this.marketsByCategory)) {
      this.marketsByCategory[cat].sort((a, b) => b.volume - a.volume);
      // Keep top 10 per category
      this.marketsByCategory[cat] = this.marketsByCategory[cat].slice(0, 10);
    }

    this.activeMarkets = filtered.map(m => this._enrichMarket(m, this._categorize(m)));

    // Count totals
    const totalMarkets = Object.values(this.marketsByCategory).flat().length;
    const catCounts = Object.entries(this.marketsByCategory)
      .filter(([, v]) => v.length > 0)
      .map(([k, v]) => `${k}:${v.length}`)
      .join(', ');

    if (totalMarkets > 0) {
      console.log(`📋 Found ${totalMarkets} markets (${catCounts})`);

      // Alert on new markets
      const newMarkets = filtered.filter(m => {
        const id = m.conditionId || m.id;
        return !this.knownMarketIds.has(id);
      });
      for (const m of newMarkets) {
        this.knownMarketIds.add(m.conditionId || m.id);
      }
      // Only alert on first new markets after initial load
      if (this.knownMarketIds.size > newMarkets.length && newMarkets.length > 0) {
        for (const m of newMarkets.slice(0, 3)) {
          const q = m.question || m.title || 'Unknown';
          console.log(`🆕 NEW: ${q}`);
          if (this.alerts) {
            await this.alerts.send(`🆕 <b>New market found!</b>\n\n📊 ${q}`);
          }
        }
      }
    } else {
      console.log('📋 No qualifying markets found (>$10K volume).');
    }
  }

  // ── Categorize a market by its text ─────────────────────────────────────
  _categorize(market) {
    const text = (
      (market.question || '') + ' ' + (market.title || '') + ' ' +
      (market.description || '') + ' ' + (market.slug || '')
    ).toLowerCase();

    for (const cat of CATEGORIES) {
      const matchCount = cat.searches.filter(kw => text.includes(kw)).length;
      if (matchCount >= 1) return cat.name;
    }
    return 'Other';
  }

  // ── Enrich with pricing, edge score, etc ────────────────────────────────
  _enrichMarket(market, category) {
    // outcomePrices comes as a JSON string from the API: "[\"0.5\", \"0.5\"]"
    let prices = [0.5, 0.5];
    try {
      const raw = market.outcomePrices;
      if (typeof raw === 'string') prices = JSON.parse(raw).map(Number);
      else if (Array.isArray(raw)) prices = raw.map(Number);
    } catch { /* default to [0.5, 0.5] */ }

    const yesPrice = prices[0] || 0.5;
    const noPrice = prices[1] || (1 - yesPrice);
    const volume = parseFloat(market.volume || market.volumeNum || 0);

    // Resolution date
    let endDate = null;
    if (market.endDate || market.end_date_iso) {
      endDate = new Date(market.endDate || market.end_date_iso).toISOString();
    }

    // Edge score: distance from 50/50 (markets near 50/50 = most opportunity)
    // Combined with volume for a simple "opportunity" metric
    const distanceFrom50 = Math.abs(yesPrice - 0.5);
    const volatilityScore = 1 - (distanceFrom50 * 2); // 1.0 at 50/50, 0.0 at extremes
    const volumeScore = Math.min(1, volume / 500000); // Normalize volume
    const edgeScore = Math.round((volatilityScore * 0.6 + volumeScore * 0.4) * 100);

    const catInfo = CATEGORIES.find(c => c.name === category) || { icon: '📊', color: '#a1a1a6' };

    return {
      id: market.conditionId || market.id,
      question: market.question || market.title || 'Unknown',
      slug: market.slug || '',
      category,
      categoryIcon: catInfo.icon,
      categoryColor: catInfo.color,
      yesPrice: Math.round(yesPrice * 100) / 100,
      noPrice: Math.round(noPrice * 100) / 100,
      volume,
      endDate,
      edgeScore,
      // Human-readable
      yesPct: Math.round(yesPrice * 100),
      noPct: Math.round(noPrice * 100),
      volumeStr: volume >= 1_000_000 ? `$${(volume / 1_000_000).toFixed(1)}M`
                 : volume >= 1_000 ? `$${(volume / 1_000).toFixed(0)}K`
                 : `$${volume.toFixed(0)}`,
      endDateStr: endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    };
  }

  // ── Crypto-specific helpers (kept for arbitrage) ────────────────────────

  _detectCryptoSymbol(market) {
    const text = ((market.question || '') + (market.title || '')).toLowerCase();
    if (text.includes('bitcoin') || text.includes('btc')) return 'btcusdt';
    if (text.includes('ethereum') || text.includes('eth')) return 'ethusdt';
    return null;
  }

  _calculateBinanceImpliedProb(priceData, market) {
    const { price, momentum } = priceData;
    const strike = this._extractStrikePrice(market);

    if (strike === null) {
      const isUpMarket = this._isUpMarket(market);
      if (isUpMarket === null) return null;
      const raw = 1 / (1 + Math.exp(-momentum * 4));
      return isUpMarket ? raw : 1 - raw;
    }

    const distancePct = ((price - strike) / strike) * 100;
    const isUpMarket = this._isUpMarket(market);
    if (isUpMarket === null) return null;

    const combined = distancePct * 2 + momentum * 3;
    const prob = 1 / (1 + Math.exp(-combined));
    return isUpMarket ? prob : 1 - prob;
  }

  _extractStrikePrice(market) {
    const text = (market.question || '') + (market.title || '');
    const match = text.match(/\$[\d,]+\.?\d*/);
    if (match) {
      const parsed = parseFloat(match[0].replace(/[$,]/g, ''));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  }

  _isUpMarket(market) {
    const text = ((market.question || '') + (market.title || '')).toLowerCase();
    if (text.includes('above') || text.includes('up') || text.includes('higher') || text.includes('over')) return true;
    if (text.includes('below') || text.includes('down') || text.includes('lower') || text.includes('under')) return false;
    return null;
  }
}
