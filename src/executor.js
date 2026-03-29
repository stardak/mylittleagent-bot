// ══════════════════════════════════════════════════════════════════════════════
// TRADE EXECUTION ENGINE
// ══════════════════════════════════════════════════════════════════════════════
// Handles both paper and live trade execution.
//
// Paper mode:  Simulates order placement, immediately logs to SQLite.
// Live mode:   Signs and submits orders to Polymarket CLOB API.
//
// Position sizing uses Half-Kelly Criterion (calculated in RiskManager).
// All trades are capped at 8% of portfolio.
// ══════════════════════════════════════════════════════════════════════════════

import { ethers } from 'ethers';

const CLOB_API = 'https://clob.polymarket.com';

export class TradeExecutor {
  constructor(riskManager, alertService, options = {}) {
    this.risk = riskManager;
    this.alerts = alertService;
    this.isLive = options.live || false;
    this.privateKey = options.privateKey || null;
    this.apiKey = options.apiKey || null;

    this.signer = null;
    if (this.isLive && this.privateKey) {
      try {
        this.signer = new ethers.Wallet(this.privateKey);
        console.log(`🔑 Wallet loaded: ${this.signer.address.slice(0, 8)}...${this.signer.address.slice(-6)}`);
      } catch (err) {
        console.error(
          '❌ Could not load wallet from POLYMARKET_PRIVATE_KEY.\n' +
          '   Make sure it is a valid Ethereum private key (64 hex characters).\n' +
          `   Error: ${err.message}`
        );
        this.isLive = false;
      }
    }

    this.pendingTrades = new Map();
  }

  async executeTrade(opportunity) {
    const winProb = opportunity.binanceImpliedProb;
    const odds = 1 / opportunity.polyPrice;
    const sizing = this.risk.calculatePositionSize(winProb, odds);
    const reasoning = this._buildReasoning(opportunity, sizing);

    const riskCheck = this.risk.canTrade(sizing.sizeUsd);
    if (!riskCheck.allowed) {
      this.risk.logDecision({
        marketId: opportunity.marketId,
        symbol: opportunity.symbol.toUpperCase(),
        side: opportunity.side,
        entryPrice: opportunity.polyPrice,
        sizeUsd: sizing.sizeUsd,
        impliedProbBinance: opportunity.binanceImpliedProb,
        impliedProbPolymarket: opportunity.polyImpliedProb,
        gapPct: opportunity.gapPct,
        kellyFraction: sizing.kellyFraction,
        reasoning: `SKIPPED: ${riskCheck.reason}\n\n${reasoning}`,
        status: 'skipped',
        isPaper: !this.isLive
      });
      console.log(`⏭️  Skipped trade: ${riskCheck.reason}`);
      return null;
    }

    if (sizing.sizeUsd <= 0) {
      this.risk.logDecision({
        marketId: opportunity.marketId,
        symbol: opportunity.symbol.toUpperCase(),
        side: opportunity.side,
        entryPrice: opportunity.polyPrice,
        sizeUsd: 0,
        impliedProbBinance: opportunity.binanceImpliedProb,
        impliedProbPolymarket: opportunity.polyImpliedProb,
        gapPct: opportunity.gapPct,
        kellyFraction: sizing.kellyFraction,
        reasoning: `SKIPPED: Kelly criterion says no edge\n\n${reasoning}`,
        status: 'skipped',
        isPaper: !this.isLive
      });
      console.log('⏭️  Skipped trade: Kelly criterion says no edge.');
      return null;
    }

    if (this.isLive) {
      return await this._executeLive(opportunity, sizing, reasoning);
    } else {
      return this._executePaper(opportunity, sizing, reasoning);
    }
  }

  async checkResolutions() {
    for (const [tradeId, trade] of this.pendingTrades) {
      try {
        const resolved = await this._checkMarketResolution(trade.marketId);
        if (resolved !== null) {
          const won = (trade.side === 'YES' && resolved === true) ||
                      (trade.side === 'NO' && resolved === false);
          const pnl = won
            ? trade.sizeUsd * (1 / trade.entryPrice - 1)
            : -trade.sizeUsd;

          await this.risk.closePosition(tradeId, resolved ? 1 : 0, pnl);
          this.pendingTrades.delete(tradeId);

          const emoji = won ? '✅' : '❌';
          console.log(
            `${emoji} Trade #${tradeId} resolved: ${won ? 'WIN' : 'LOSS'} ` +
            `(${trade.side} on ${trade.symbol}) P&L: $${pnl.toFixed(2)}`
          );
        }
      } catch (err) {
        console.error(`⚠️  Error checking resolution for trade #${tradeId}: ${err.message}`);
      }
    }
  }

  _executePaper(opportunity, sizing, reasoning) {
    const tradeId = this.risk.logDecision({
      marketId: opportunity.marketId,
      symbol: opportunity.symbol.toUpperCase(),
      side: opportunity.side,
      entryPrice: opportunity.polyPrice,
      sizeUsd: sizing.sizeUsd,
      impliedProbBinance: opportunity.binanceImpliedProb,
      impliedProbPolymarket: opportunity.polyImpliedProb,
      gapPct: opportunity.gapPct,
      kellyFraction: sizing.kellyFraction,
      reasoning: `PAPER TRADE\n\n${reasoning}`,
      status: 'open',
      isPaper: true
    });

    this.risk.openPosition(tradeId);

    this.pendingTrades.set(tradeId, {
      marketId: opportunity.marketId,
      symbol: opportunity.symbol,
      side: opportunity.side,
      entryPrice: opportunity.polyPrice,
      sizeUsd: sizing.sizeUsd
    });

    console.log(
      `📝 PAPER TRADE #${tradeId}: ${opportunity.side} on "${opportunity.question}"\n` +
      `   Size: $${sizing.sizeUsd.toFixed(2)} | ` +
      `Gap: ${opportunity.gapPct.toFixed(1)}% | ` +
      `Kelly: ${(sizing.halfKelly * 100).toFixed(1)}%`
    );

    return {
      id: tradeId,
      ...opportunity,
      sizeUsd: sizing.sizeUsd,
      kellyFraction: sizing.kellyFraction,
      isPaper: true
    };
  }

  async _executeLive(opportunity, sizing, reasoning) {
    if (!this.signer) {
      console.error('❌ Cannot execute live trade: wallet not loaded.');
      return null;
    }

    try {
      const order = {
        tokenID: opportunity.marketId,
        price: opportunity.polyPrice.toString(),
        size: Math.floor(sizing.sizeUsd / opportunity.polyPrice).toString(),
        side: opportunity.side === 'YES' ? 'BUY' : 'SELL',
        feeRateBps: '0',
        nonce: Date.now().toString(),
        expiration: '0'
      };

      const orderHash = ethers.solidityPackedKeccak256(
        ['string'], [JSON.stringify(order)]
      );
      const signature = await this.signer.signMessage(ethers.getBytes(orderHash));

      const response = await fetch(`${CLOB_API}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Signature': signature
        },
        body: JSON.stringify({ order, signature, owner: this.signer.address })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Order rejected (${response.status}): ${errorBody}`);
      }

      const result = await response.json();

      const tradeId = this.risk.logDecision({
        marketId: opportunity.marketId,
        symbol: opportunity.symbol.toUpperCase(),
        side: opportunity.side,
        entryPrice: opportunity.polyPrice,
        sizeUsd: sizing.sizeUsd,
        impliedProbBinance: opportunity.binanceImpliedProb,
        impliedProbPolymarket: opportunity.polyImpliedProb,
        gapPct: opportunity.gapPct,
        kellyFraction: sizing.kellyFraction,
        reasoning: `LIVE TRADE\nOrder ID: ${result.orderID || 'unknown'}\n\n${reasoning}`,
        status: 'open',
        isPaper: false
      });

      this.risk.openPosition(tradeId);
      this.pendingTrades.set(tradeId, {
        marketId: opportunity.marketId,
        symbol: opportunity.symbol,
        side: opportunity.side,
        entryPrice: opportunity.polyPrice,
        sizeUsd: sizing.sizeUsd
      });

      console.log(
        `🔴 LIVE TRADE #${tradeId}: ${opportunity.side} on "${opportunity.question}"\n` +
        `   Size: $${sizing.sizeUsd.toFixed(2)} | Gap: ${opportunity.gapPct.toFixed(1)}%`
      );

      return {
        id: tradeId,
        orderId: result.orderID,
        ...opportunity,
        sizeUsd: sizing.sizeUsd,
        kellyFraction: sizing.kellyFraction,
        isPaper: false
      };

    } catch (err) {
      console.error(`❌ Live trade failed: ${err.message}`);

      this.risk.logDecision({
        marketId: opportunity.marketId,
        symbol: opportunity.symbol.toUpperCase(),
        side: opportunity.side,
        entryPrice: opportunity.polyPrice,
        sizeUsd: sizing.sizeUsd,
        impliedProbBinance: opportunity.binanceImpliedProb,
        impliedProbPolymarket: opportunity.polyImpliedProb,
        gapPct: opportunity.gapPct,
        kellyFraction: sizing.kellyFraction,
        reasoning: `FAILED: ${err.message}\n\n${reasoning}`,
        status: 'failed',
        isPaper: false
      });

      if (this.alerts) await this.alerts.send(`❌ Trade failed: ${err.message}`);
      return null;
    }
  }

  _buildReasoning(opportunity, sizing) {
    return [
      `Market: ${opportunity.question || opportunity.slug}`,
      `Symbol: ${opportunity.symbol.toUpperCase()}`,
      `Current price: $${opportunity.currentPrice?.toFixed(2) || 'N/A'}`,
      `30s momentum: ${opportunity.momentum?.toFixed(3) || 'N/A'}%`,
      `Polymarket implied prob: ${(opportunity.polyImpliedProb * 100).toFixed(1)}%`,
      `Binance implied prob: ${(opportunity.binanceImpliedProb * 100).toFixed(1)}%`,
      `Gap: ${opportunity.gapPct.toFixed(1)}%`,
      `Liquidity: $${opportunity.liquidity?.toFixed(0) || 'N/A'}`,
      `Kelly fraction: ${(sizing.kellyFraction * 100).toFixed(2)}%`,
      `Half-Kelly: ${(sizing.halfKelly * 100).toFixed(2)}%`,
      `Position size: $${sizing.sizeUsd.toFixed(2)} (${(sizing.fraction * 100).toFixed(1)}% of portfolio)`
    ].join('\n');
  }

  async _checkMarketResolution(marketId) {
    try {
      const url = `${CLOB_API}/markets/${marketId}`;
      const response = await fetch(url);
      if (!response.ok) return null;

      const market = await response.json();
      if (market.resolved || market.is_resolved) {
        if (market.outcome === 'Yes' || market.outcome === true) return true;
        if (market.outcome === 'No' || market.outcome === false) return false;
      }
      return null;
    } catch { return null; }
  }
}
