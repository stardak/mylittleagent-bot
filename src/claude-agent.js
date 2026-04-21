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

  // ── Bot explanation — simple (10 y/o) or technical ───────────────────────
  async explain(bot, mode) {
    const BOT_DESCRIPTIONS = {
      kronos:    'The Kronos Scalper uses a specialised AI model called Kronos (trained on tick-level data from 45 global exchanges) to predict whether BTC, ETH or SOL will move up or down over the next 15 minutes. When confidence exceeds 60%, it places a market order with 10% of the paper portfolio. It scales up to 3x on strong signals, uses an ATR-based trailing stop, and exits when the model flips direction. No human decisions — entirely model-driven.',
      poly:      'The Polymarket Arb bot scans prediction markets (binary YES/NO contracts on events like elections and economic outcomes). It looks for markets where YES price + NO price does not equal 100 cents — a pricing inefficiency. It simultaneously buys both sides of the gap, locking in the difference as risk-free profit regardless of outcome. It filters for at least £5,000 in volume to avoid illiquid traps.',
      funding:   'The Funding Rate bot monitors perpetual futures funding rates on Binance — fees paid every 8 hours between long and short holders to keep the contract price close to spot. When a rate goes extreme (above 0.03% per 8h, which annualises to about 13%), it takes the opposite position to collect the funding payment. It holds until the rate normalises. This is a delta-neutral strategy — it hedges market direction risk.',
      feargreed: 'The Fear & Greed Contrarian bot watches the Crypto Fear & Greed Index (0 = pure panic, 100 = pure euphoria), published daily by Alternative.me. When the index drops below 20 (Extreme Fear), it buys BTC with 25% of the portfolio. When the index exceeds 80 (Extreme Greed), it sells. The thesis: crypto crowds overreact to sentiment — markets tend to reverse from extremes. This is a slow strategy — maybe 4-6 signals per year.',
      depeg:     'The Stablecoin Depeg bot monitors USDC and DAI prices on Binance every 30 seconds. These coins should always be worth exactly £1. When either drops below £0.995 (a 0.5% depeg), it buys on the assumption that the peg will be restored — either by market arbitrage or by the issuer. The profit is the recovery back to £1.00. A sanity guard rejects prices below £0.80 to avoid bad data feeds from triggering ghost trades.',
      liq:       'The Liquidation Cascade bot monitors the Binance liquidation WebSocket feed in real-time. When leveraged traders get forcibly liquidated, they create a cascade of forced sells that temporarily pushes price below fair value. The bot detects large clusters (£500K+ liquidated in 60 seconds) and enters the opposite direction, betting on the snap-back once the cascade exhausts itself. High frequency — looks for 1-3% bounces.',
      crossex:   'The Cross-Exchange Spread bot compares BTC, ETH and SOL prices between Binance and Bybit every 10 seconds. The same asset should trade at the same price across venues. When the spread exceeds 0.5%, it simultaneously buys on the cheaper exchange and short-sells on the more expensive one — locking in the gap as risk-free profit. The position closes when prices converge.',
    };

    const description = BOT_DESCRIPTIONS[bot];
    if (!description) throw new Error('Unknown bot: ' + bot);

    const prompt = mode === 'simple'
      ? `Explain this trading bot to a curious 10-year-old using a simple everyday analogy. No jargon, no numbers you need to explain. Max 3 short, punchy sentences. Make it fun and relatable:\n\n${description}`
      : `Give a precise, technically rigorous explanation of this trading strategy. Include: the specific market microstructure inefficiency being exploited, the exact signal thresholds, the execution mechanics, the edge hypothesis, and the key risks that could make this strategy fail. Be specific and quantitative. Max 150 words:\n\n${description}`;

    const text = await this._callClaude(prompt, 250);
    return { text };
  }
}
