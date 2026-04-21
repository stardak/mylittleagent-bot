// ══════════════════════════════════════════════════════════════════════════════
// CLAUDE AGENT — Portfolio Review & Q&A
// ══════════════════════════════════════════════════════════════════════════════
// Calls Claude to analyse the full state of all 7 trading bots.
// Exposed as:
//   GET  /api/agent/review       — trigger a new review (cached 10 min)
//   POST /api/agent/ask          — ask a free-form question about the portfolio
// ══════════════════════════════════════════════════════════════════════════════

const CLAUDE_MODEL   = 'claude-haiku-4-5';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const REVIEW_TTL_MS  = 10 * 60 * 1000;   // cache for 10 minutes

const SYSTEM_PROMPT = `You are a concise trading portfolio analyst reviewing Stef's personal paper trading lab.
Stef runs 7 automated bots on crypto markets — all paper trading, no real money yet.
Be honest, plain-English, and specific. Don't be overly positive.
Keep your analysis to 3-4 short paragraphs. Use £ not $ in your reasoning since Stef is UK based.
Format your response as markdown with bold headers for each section.
Never give financial advice — describe what you observe, not what Stef should do with real money.`;

export class ClaudeAgent {
  constructor(apiKey) {
    this.apiKey   = apiKey;
    this._cache   = null;   // { text, timestamp, prompt }
    this._asking  = false;
  }

  // ── Build a plain-text snapshot of all bot states ────────────────────────
  _buildContext(status, poly, funding, fg, depeg, liq, cross) {
    const f = (v, dp=2) => v != null ? Number(v).toFixed(dp) : 'n/a';
    const pct = (v) => v != null ? (Number(v)*100).toFixed(3)+'%' : 'n/a';

    const kronosBal = status?.binancePortfolio?.balance ?? status?.status?.portfolio ?? 100;
    const kronosPnl = status?.binancePortfolio?.totalPnl ?? (kronosBal - 100);
    const kronosTrades = status?.status?.totalTrades ?? 0;
    const kronosWinRate = status?.status?.winRate ?? 0;

    const lines = [
      '=== PORTFOLIO SNAPSHOT ===',
      `Date: ${new Date().toUTCString()}`,
      '',
      '--- Bot 1: Kronos AI Scalper ---',
      `Balance: $${f(kronosBal)} | P&L: $${f(kronosPnl)} | Trades: ${kronosTrades} | Win rate: ${f(kronosWinRate,1)}%`,
      `Open positions: ${Object.values(status?.scalper?.positions||{}).filter(Boolean).length}`,
      `Today P&L: $${f(status?.status?.todayPnl)}`,
      '',
      '--- Bot 2: Polymarket Arb ---',
      `Balance: $${f(poly?.stats?.currentBalance)} | P&L: $${f(poly?.stats?.realizedPnl)}`,
      `Markets scanned: ${poly?.stats?.marketsChecked??0} | Gaps found: ${poly?.stats?.qualifiedGaps??0} | Trades taken: ${poly?.stats?.tradesAutoTaken??0}`,
      `Open positions: ${poly?.stats?.openPositions??0}`,
      '',
      '--- Bot 3: Funding Rate Arb ---',
      `Balance: $${f(funding?.stats?.balance)} | P&L: $${f(funding?.stats?.totalPnl)} | Settlements: ${funding?.stats?.totalSettlements??0}`,
      `Current rates — BTC: ${pct(funding?.rates?.BTCUSDT?.rate)} ETH: ${pct(funding?.rates?.ETHUSDT?.rate)} SOL: ${pct(funding?.rates?.SOLUSDT?.rate)}`,
      `Extreme rate detected: ${Object.values(funding?.rates||{}).some(r=>r.extreme) ? 'YES' : 'No'}`,
      '',
      '--- Bot 4: Fear & Greed Contrarian ---',
      `Balance: $${f(fg?.stats?.balance)} | P&L: $${f(fg?.stats?.totalPnl)} | Trades: ${fg?.stats?.totalTrades??0}`,
      `Current F&G index: ${fg?.currentFG?.value ?? 'n/a'} (${fg?.currentFG?.classification ?? 'unknown'})`,
      `Open position: ${fg?.position ? JSON.stringify(fg.position) : 'None'}`,
      `Trigger thresholds: buy <20 (Extreme Fear), sell >80 (Extreme Greed)`,
      '',
      '--- Bot 5: Stablecoin Depeg Watch ---',
      `Balance: $${f(depeg?.stats?.balance)} | P&L: $${f(depeg?.stats?.totalPnl)} | Open: ${depeg?.stats?.openPositions??0}`,
      `Prices — USDC: ${depeg?.prices?.USDC?.priceStr??'n/a'} DAI: ${depeg?.prices?.DAI?.priceStr??'n/a'} USDT: $1.0000`,
      `Deepest depeg seen: ${depeg?.stats?.deepestDepeg ? JSON.stringify(depeg.stats.deepestDepeg) : 'None yet'}`,
      '',
      '--- Bot 6: Liquidation Cascade Scalper ---',
      `Balance: $${f(liq?.stats?.balance)} | P&L: $${f(liq?.stats?.totalPnl)} | Trades: ${liq?.stats?.totalTrades??0}`,
      `Recent liq feed — BTC: ${liq?.liqFeed?.BTCUSDT?.estimatedMove??'n/a'} ETH: ${liq?.liqFeed?.ETHUSDT?.estimatedMove??'n/a'}`,
      '',
      '--- Bot 7: Cross-Exchange Spread ---',
      `Balance: $${f(cross?.stats?.balance)} | P&L: $${f(cross?.stats?.totalPnl)} | Trades: ${cross?.stats?.totalTrades??0}`,
      `Current spreads — BTC: ${cross?.spreads?.BTCUSDT?.spreadPctStr??'n/a'} ETH: ${cross?.spreads?.ETHUSDT?.spreadPctStr??'n/a'} SOL: ${cross?.spreads?.SOLUSDT?.spreadPctStr??'n/a'}`,
      `Trade threshold: 0.5% spread`,
      '',
      '=== END SNAPSHOT ===',
    ];
    return lines.join('\n');
  }

  // ── Call Claude API ───────────────────────────────────────────────────────
  async _callClaude(userMessage, maxTokens = 600) {
    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key':         this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: maxTokens,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || 'No response from Claude.';
  }

  // ── Full portfolio review (cached) ────────────────────────────────────────
  async review(status, poly, funding, fg, depeg, liq, cross) {
    const now = Date.now();
    if (this._cache && (now - this._cache.timestamp) < REVIEW_TTL_MS) {
      return { text: this._cache.text, cached: true, age: Math.round((now - this._cache.timestamp)/1000) };
    }

    const context = this._buildContext(status, poly, funding, fg, depeg, liq, cross);
    const prompt = `Please review my paper trading portfolio and give me a brief analysis.\n\n${context}\n\nGive me:\n**What's happening** — a one-paragraph summary of the portfolio state\n**What's working** — any strategies finding genuine signals\n**Concerns** — anything that looks wrong or suspicious\n**One thing to watch** — the most interesting signal or trigger level right now`;

    const text = await this._callClaude(prompt, 700);
    this._cache = { text, timestamp: now, prompt };
    return { text, cached: false };
  }

  // ── Free-form Q&A ─────────────────────────────────────────────────────────
  async ask(question, status, poly, funding, fg, depeg, liq, cross) {
    const context = this._buildContext(status, poly, funding, fg, depeg, liq, cross);
    const prompt = `Here is the current portfolio state:\n\n${context}\n\nQuestion from Stef: ${question}`;
    const text = await this._callClaude(prompt, 500);
    return { text };
  }

  clearCache() {
    this._cache = null;
  }
}
