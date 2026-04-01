// ══════════════════════════════════════════════════════════════════════════════
// BINANCE TRADE EXECUTOR
// ══════════════════════════════════════════════════════════════════════════════
// Handles paper and live trading on Binance spot.
// Paper mode simulates fills at market price.
// Live mode uses Binance REST API with HMAC-SHA256 signing.
// ══════════════════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BINANCE_API = 'https://api.binance.com';

export class BinanceTrader {
  constructor(options = {}) {
    this.live = options.live || false;
    this.apiKey = options.apiKey || '';
    this.apiSecret = options.apiSecret || '';
    this.alerts = options.alerts || null;

    // Portfolio tracking
    this.portfolio = {
      startingBalance: options.startingBalance || 99,
      balance: options.startingBalance || 99,  // USDT available
      totalPnl: 0,
      trades: [],
      wins: 0,
      losses: 0,
    };

    // SQLite persistence
    this.db = new Database(path.join(__dirname, '..', 'trades.db'));
    this._initScalperTable();
    this._loadScalperState();
  }

  _initScalperTable() {
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scalper_trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        symbol TEXT NOT NULL,
        price REAL NOT NULL,
        quantity REAL NOT NULL,
        cost REAL,
        revenue REAL,
        pnl REAL,
        pnl_pct REAL,
        entry_price REAL,
        mode TEXT NOT NULL DEFAULT 'PAPER'
      );
    `);
  }

  _loadScalperState() {
    // Restore wins/losses/totalPnl from database
    const stats = this.db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type='SELL' AND pnl > 0 THEN 1 ELSE 0 END), 0) as wins,
        COALESCE(SUM(CASE WHEN type='SELL' AND pnl <= 0 THEN 1 ELSE 0 END), 0) as losses,
        COALESCE(SUM(CASE WHEN type='SELL' THEN pnl ELSE 0 END), 0) as totalPnl
      FROM scalper_trades
    `).get();

    if (stats) {
      this.portfolio.wins = stats.wins;
      this.portfolio.losses = stats.losses;
      this.portfolio.totalPnl = stats.totalPnl;
      this.portfolio.balance = this.portfolio.startingBalance + stats.totalPnl;
    }

    // Load recent trades for dashboard display
    const recentRows = this.db.prepare(
      'SELECT * FROM scalper_trades ORDER BY id DESC LIMIT 40'
    ).all();

    this.portfolio.trades = recentRows.reverse().map(r => ({
      id: `paper-${r.id}`,
      type: r.type,
      symbol: r.symbol,
      price: r.price,
      quantity: r.quantity,
      cost: r.cost,
      revenue: r.revenue,
      pnl: r.pnl,
      pnlPct: r.pnl_pct,
      entryPrice: r.entry_price,
      timestamp: r.timestamp,
      mode: r.mode,
    }));

    console.log(`📊 Scalper state restored: ${this.portfolio.wins}W/${this.portfolio.losses}L, P&L: $${this.portfolio.totalPnl.toFixed(2)}, Balance: $${this.portfolio.balance.toFixed(2)}`);
  }

  _persistTrade(trade) {
    this.db.prepare(`
      INSERT INTO scalper_trades (timestamp, type, symbol, price, quantity, cost, revenue, pnl, pnl_pct, entry_price, mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trade.timestamp, trade.type, trade.symbol, trade.price, trade.quantity,
      trade.cost || null, trade.revenue || null, trade.pnl || null,
      trade.pnlPct || null, trade.entryPrice || null, trade.mode
    );
  }

  // ── Execute a BUY ───────────────────────────────────────────────────────
  async buy(symbol, price, portfolioPct) {
    const amountUsd = this.portfolio.balance * (portfolioPct / 100);
    if (amountUsd < 5) {
      console.log(`📈 Skipping buy: balance too low ($${this.portfolio.balance.toFixed(2)})`);
      return null;
    }

    const quantity = amountUsd / price;

    if (this.live) {
      return await this._liveBuy(symbol, quantity, price);
    } else {
      return this._paperBuy(symbol, quantity, price, amountUsd);
    }
  }

  // ── Execute a SELL ──────────────────────────────────────────────────────
  async sell(symbol, quantity, price, entryPrice) {
    if (this.live) {
      return await this._liveSell(symbol, quantity, price, entryPrice);
    } else {
      return this._paperSell(symbol, quantity, price, entryPrice);
    }
  }

  // ── Paper Trading ───────────────────────────────────────────────────────
  _paperBuy(symbol, quantity, price, amountUsd) {
    const fillPrice = price;
    const cost = quantity * fillPrice;

    this.portfolio.balance -= cost;

    const trade = {
      id: `paper-${Date.now()}`,
      type: 'BUY',
      symbol: symbol.toUpperCase(),
      price: fillPrice,
      quantity,
      cost,
      timestamp: Date.now(),
      mode: 'PAPER',
    };

    this.portfolio.trades.push(trade);
    this._persistTrade(trade);
    console.log(`📝 PAPER BUY: ${quantity.toFixed(6)} ${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)} ($${cost.toFixed(2)})`);

    if (this.alerts) {
      this.alerts.send(
        `📈 <b>Paper BUY</b>\n\n` +
        `${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)}\n` +
        `Amount: $${cost.toFixed(2)}\n` +
        `SL: $${(fillPrice * 0.985).toFixed(2)} | TP: $${(fillPrice * 1.025).toFixed(2)}`
      );
    }

    return trade;
  }

  _paperSell(symbol, quantity, price, entryPrice) {
    const fillPrice = price;
    const revenue = quantity * fillPrice;
    const cost = quantity * entryPrice;
    const pnl = revenue - cost;
    const pnlPct = ((fillPrice - entryPrice) / entryPrice) * 100;

    this.portfolio.balance += revenue;
    this.portfolio.totalPnl += pnl;

    if (pnl >= 0) this.portfolio.wins++;
    else this.portfolio.losses++;

    const trade = {
      id: `paper-${Date.now()}`,
      type: 'SELL',
      symbol: symbol.toUpperCase(),
      price: fillPrice,
      quantity,
      revenue,
      pnl,
      pnlPct,
      entryPrice,
      timestamp: Date.now(),
      mode: 'PAPER',
    };

    this.portfolio.trades.push(trade);
    this._persistTrade(trade);

    const emoji = pnl >= 0 ? '✅' : '❌';
    console.log(`📝 PAPER SELL: ${quantity.toFixed(6)} ${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)} | P&L: ${emoji} $${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)`);

    if (this.alerts) {
      this.alerts.send(
        `${emoji} <b>Paper SELL</b>\n\n` +
        `${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)}\n` +
        `Entry: $${entryPrice.toFixed(2)}\n` +
        `P&L: $${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)\n` +
        `Balance: $${this.portfolio.balance.toFixed(2)}`
      );
    }

    return trade;
  }

  // ── Live Trading (Binance REST API) ─────────────────────────────────────
  async _liveBuy(symbol, quantity, price) {
    try {
      const order = await this._placeOrder(symbol.toUpperCase(), 'BUY', quantity);
      const fillPrice = parseFloat(order.fills?.[0]?.price || price);
      const cost = quantity * fillPrice;
      this.portfolio.balance -= cost;

      const trade = {
        id: order.orderId,
        type: 'BUY',
        symbol: symbol.toUpperCase(),
        price: fillPrice,
        quantity,
        cost,
        timestamp: Date.now(),
        mode: 'LIVE',
      };

      this.portfolio.trades.push(trade);
      this._persistTrade(trade);
      console.log(`🔴 LIVE BUY: ${quantity.toFixed(6)} ${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)}`);

      if (this.alerts) {
        await this.alerts.send(
          `🔴 <b>LIVE BUY</b>\n\n` +
          `${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)}\n` +
          `Amount: $${cost.toFixed(2)}\n` +
          `Order ID: ${order.orderId}`
        );
      }

      return trade;
    } catch (err) {
      console.error(`❌ Live BUY failed: ${err.message}`);
      if (this.alerts) await this.alerts.send(`❌ Live BUY failed: ${err.message}`);
      return null;
    }
  }

  async _liveSell(symbol, quantity, price, entryPrice) {
    try {
      const order = await this._placeOrder(symbol.toUpperCase(), 'SELL', quantity);
      const fillPrice = parseFloat(order.fills?.[0]?.price || price);
      const revenue = quantity * fillPrice;
      const cost = quantity * entryPrice;
      const pnl = revenue - cost;
      const pnlPct = ((fillPrice - entryPrice) / entryPrice) * 100;

      this.portfolio.balance += revenue;
      this.portfolio.totalPnl += pnl;
      if (pnl >= 0) this.portfolio.wins++;
      else this.portfolio.losses++;

      const trade = {
        id: order.orderId,
        type: 'SELL',
        symbol: symbol.toUpperCase(),
        price: fillPrice,
        quantity,
        revenue,
        pnl,
        pnlPct,
        entryPrice,
        timestamp: Date.now(),
        mode: 'LIVE',
      };

      this.portfolio.trades.push(trade);
      this._persistTrade(trade);
      const emoji = pnl >= 0 ? '✅' : '❌';
      console.log(`🔴 LIVE SELL: ${quantity.toFixed(6)} ${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)} | P&L: ${emoji} $${pnl.toFixed(2)}`);

      if (this.alerts) {
        await this.alerts.send(
          `${emoji} <b>LIVE SELL</b>\n\n` +
          `${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)}\n` +
          `P&L: $${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)\n` +
          `Balance: $${this.portfolio.balance.toFixed(2)}`
        );
      }

      return trade;
    } catch (err) {
      console.error(`❌ Live SELL failed: ${err.message}`);
      if (this.alerts) await this.alerts.send(`❌ Live SELL failed: ${err.message}`);
      return null;
    }
  }

  // ── Binance API Request Signing ─────────────────────────────────────────
  async _placeOrder(symbol, side, quantity) {
    const timestamp = Date.now();
    const params = new URLSearchParams({
      symbol,
      side,
      type: 'MARKET',
      quantity: quantity.toFixed(6),
      timestamp: String(timestamp),
    });

    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(params.toString())
      .digest('hex');

    params.append('signature', signature);

    const response = await fetch(`${BINANCE_API}/api/v3/order?${params.toString()}`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Binance API error ${response.status}: ${err}`);
    }

    return await response.json();
  }

  // ── Getters ─────────────────────────────────────────────────────────────
  getPortfolio() {
    const totalTrades = this.portfolio.wins + this.portfolio.losses;
    return {
      balance: this.portfolio.balance,
      startingBalance: this.portfolio.startingBalance,
      totalPnl: this.portfolio.totalPnl,
      totalPnlPct: (this.portfolio.totalPnl / this.portfolio.startingBalance) * 100,
      wins: this.portfolio.wins,
      losses: this.portfolio.losses,
      winRate: totalTrades > 0 ? (this.portfolio.wins / totalTrades) * 100 : 0,
      totalTrades,
      recentTrades: this.portfolio.trades.slice(-20).reverse(),
      mode: this.live ? 'LIVE' : 'PAPER',
    };
  }
}
