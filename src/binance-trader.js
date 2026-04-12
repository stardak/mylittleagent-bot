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

    // Fee simulation (Binance spot taker fee)
    this.feePct = 0.001; // 0.1% per side = 0.2% round-trip

    // Portfolio tracking
    this.portfolio = {
      startingBalance: options.startingBalance || 100,
      balance: options.startingBalance || 100,  // USDT available
      totalPnl: 0,
      trades: [],
      wins: 0,
      losses: 0,
      // Per-strategy tracking
      strategyStats: {
        MEAN_REVERSION: { wins: 0, losses: 0, pnl: 0 },
        BREAKOUT: { wins: 0, losses: 0, pnl: 0 },
        UNKNOWN: { wins: 0, losses: 0, pnl: 0 },
      },
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
        fee REAL DEFAULT 0,
        strategy TEXT DEFAULT 'UNKNOWN',
        exit_reason TEXT,
        mode TEXT NOT NULL DEFAULT 'PAPER'
      );
    `);

    // Add columns if they don't exist (migration for existing DBs)
    try { this.db.exec(`ALTER TABLE scalper_trades ADD COLUMN fee REAL DEFAULT 0`); } catch(e) { /* already exists */ }
    try { this.db.exec(`ALTER TABLE scalper_trades ADD COLUMN strategy TEXT DEFAULT 'UNKNOWN'`); } catch(e) { /* already exists */ }
    try { this.db.exec(`ALTER TABLE scalper_trades ADD COLUMN exit_reason TEXT`); } catch(e) { /* already exists */ }
    try { this.db.exec(`ALTER TABLE scalper_trades ADD COLUMN kronos_confidence REAL`); } catch(e) { /* already exists */ }
    try { this.db.exec(`ALTER TABLE scalper_trades ADD COLUMN kronos_direction TEXT`); } catch(e) { /* already exists */ }
    try { this.db.exec(`ALTER TABLE scalper_trades ADD COLUMN side TEXT DEFAULT 'LONG'`); } catch(e) { /* already exists */ }
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

    // Restore per-strategy stats
    try {
      const stratStats = this.db.prepare(`
        SELECT
          COALESCE(strategy, 'UNKNOWN') as strategy,
          COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) as wins,
          COALESCE(SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END), 0) as losses,
          COALESCE(SUM(pnl), 0) as pnl
        FROM scalper_trades WHERE type='SELL'
        GROUP BY strategy
      `).all();

      for (const row of stratStats) {
        const key = row.strategy || 'UNKNOWN';
        if (this.portfolio.strategyStats[key]) {
          this.portfolio.strategyStats[key] = { wins: row.wins, losses: row.losses, pnl: row.pnl };
        }
      }
    } catch(e) { /* strategy column might not exist yet */ }

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
      strategy: r.strategy || 'UNKNOWN',
      exitReason: r.exit_reason || '',
      kronosConfidence: r.kronos_confidence || null,
      kronosDirection: r.kronos_direction || null,
      side: r.side || 'LONG',
      timestamp: r.timestamp,
      mode: r.mode,
    }));

    console.log(`📊 Scalper state restored: ${this.portfolio.wins}W/${this.portfolio.losses}L, P&L: $${this.portfolio.totalPnl.toFixed(2)}, Balance: $${this.portfolio.balance.toFixed(2)}`);
  }

  _persistTrade(trade) {
    this.db.prepare(`
      INSERT INTO scalper_trades (timestamp, type, symbol, price, quantity, cost, revenue, pnl, pnl_pct, entry_price, fee, strategy, exit_reason, mode, kronos_confidence, kronos_direction, side)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trade.timestamp, trade.type, trade.symbol, trade.price, trade.quantity,
      trade.cost || null, trade.revenue || null, trade.pnl || null,
      trade.pnlPct || null, trade.entryPrice || null, trade.fee || 0,
      trade.strategy || 'UNKNOWN', trade.exitReason || null, trade.mode,
      trade.kronosConfidence || null, trade.kronosDirection || null, trade.side || 'LONG'
    );
  }

  // ── Execute a BUY ───────────────────────────────────────────────────────
  async buy(symbol, price, portfolioPct, strategy = 'UNKNOWN', kronosInfo = {}) {
    const amountUsd = this.portfolio.balance * (portfolioPct / 100);
    if (amountUsd < 5) {
      console.log(`📈 Skipping buy: balance too low ($${this.portfolio.balance.toFixed(2)})`);
      return null;
    }

    const quantity = amountUsd / price;

    if (this.live) {
      return await this._liveBuy(symbol, quantity, price, strategy, kronosInfo);
    } else {
      return this._paperBuy(symbol, quantity, price, amountUsd, strategy, kronosInfo);
    }
  }

  // ── Execute a SELL ──────────────────────────────────────────────────────
  async sell(symbol, quantity, price, entryPrice, strategy = 'UNKNOWN', exitReason = '', side = 'LONG') {
    if (this.live) {
      return await this._liveSell(symbol, quantity, price, entryPrice, strategy, exitReason);
    } else {
      return this._paperSell(symbol, quantity, price, entryPrice, strategy, exitReason, side);
    }
  }

  // ── Paper Trading ───────────────────────────────────────────────────────
  _paperBuy(symbol, quantity, price, amountUsd, strategy = 'UNKNOWN', kronosInfo = {}) {
    const fillPrice = price;
    const fee = quantity * fillPrice * this.feePct;
    const cost = quantity * fillPrice + fee;

    this.portfolio.balance -= cost;

    const trade = {
      id: `paper-${Date.now()}`,
      type: 'BUY',
      symbol: symbol.toUpperCase(),
      price: fillPrice,
      quantity,
      cost,
      fee,
      strategy,
      kronosConfidence: kronosInfo.confidence || null,
      kronosDirection: kronosInfo.direction || null,
      side: kronosInfo.side || 'LONG',
      timestamp: Date.now(),
      mode: 'PAPER',
    };

    this.portfolio.trades.push(trade);
    this._persistTrade(trade);
    console.log(`📝 PAPER BUY [${strategy}]: ${quantity.toFixed(6)} ${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)} ($${cost.toFixed(2)} incl $${fee.toFixed(2)} fee)`);

    if (this.alerts) {
      this.alerts.send(
        `📈 <b>Paper BUY [${strategy}]</b>\n\n` +
        `${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)}\n` +
        `Amount: $${cost.toFixed(2)} (fee: $${fee.toFixed(2)})`
      );
    }

    return trade;
  }

  _paperSell(symbol, quantity, price, entryPrice, strategy = 'UNKNOWN', exitReason = '', side = 'LONG') {
    const fillPrice = price;
    const fee = quantity * fillPrice * this.feePct; // Sell-side fee
    const isLong = side === 'LONG';

    // Direction-aware P&L
    const revenue = quantity * fillPrice - fee;
    const cost = quantity * entryPrice;
    const pnl = isLong ? (revenue - cost) : (cost - revenue + quantity * fillPrice - quantity * fillPrice + quantity * (entryPrice - fillPrice) - fee);
    // Simplify: for longs, pnl = qty*(exit-entry) - fees. For shorts, pnl = qty*(entry-exit) - fees.
    const rawPnl = isLong
      ? quantity * (fillPrice - entryPrice)
      : quantity * (entryPrice - fillPrice);
    const totalFees = quantity * fillPrice * this.feePct + quantity * entryPrice * this.feePct; // buy + sell fees
    const netPnl = rawPnl - totalFees;
    const pnlPct = isLong
      ? ((fillPrice - entryPrice) / entryPrice) * 100 - (this.feePct * 2 * 100)
      : ((entryPrice - fillPrice) / entryPrice) * 100 - (this.feePct * 2 * 100);

    // Return collateral + P&L to balance
    this.portfolio.balance += (quantity * entryPrice) + netPnl;
    this.portfolio.totalPnl += netPnl;

    if (netPnl >= 0) this.portfolio.wins++;
    else this.portfolio.losses++;

    // Update per-strategy stats
    const stratKey = this.portfolio.strategyStats[strategy] ? strategy : 'UNKNOWN';
    if (netPnl >= 0) this.portfolio.strategyStats[stratKey].wins++;
    else this.portfolio.strategyStats[stratKey].losses++;
    this.portfolio.strategyStats[stratKey].pnl += netPnl;

    const trade = {
      id: `paper-${Date.now()}`,
      type: 'SELL',
      symbol: symbol.toUpperCase(),
      price: fillPrice,
      quantity,
      revenue: quantity * fillPrice,
      pnl: netPnl,
      pnlPct,
      entryPrice,
      fee: totalFees,
      strategy,
      exitReason,
      timestamp: Date.now(),
      mode: 'PAPER',
    };

    this.portfolio.trades.push(trade);
    this._persistTrade(trade);

    const emoji = netPnl >= 0 ? '✅' : '❌';
    const sideLabel = isLong ? 'LONG' : 'SHORT';
    console.log(`📝 PAPER CLOSE [${strategy}/${sideLabel}/${exitReason}]: ${quantity.toFixed(6)} ${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)} | P&L: ${emoji} $${netPnl.toFixed(2)} (${pnlPct.toFixed(2)}%) | Fee: $${totalFees.toFixed(2)}`);

    if (this.alerts) {
      this.alerts.send(
        `${emoji} <b>Paper ${sideLabel} CLOSE [${strategy}]</b>\n\n` +
        `${symbol.toUpperCase()} @ $${fillPrice.toFixed(2)}\n` +
        `Entry: $${entryPrice.toFixed(2)} | ${exitReason}\n` +
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

    // Today's stats — query DB directly so it survives restarts
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayStats = this.db.prepare(`
      SELECT
        COALESCE(SUM(pnl), 0) as todayPnl,
        COUNT(*) as todayTrades,
        COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) as todayWins,
        COALESCE(SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END), 0) as todayLosses
      FROM scalper_trades WHERE type='SELL' AND timestamp >= ?
    `).get(todayStart.getTime());

    return {
      balance: this.portfolio.balance,
      startingBalance: this.portfolio.startingBalance,
      totalPnl: this.portfolio.totalPnl,
      totalPnlPct: (this.portfolio.totalPnl / this.portfolio.startingBalance) * 100,
      wins: this.portfolio.wins,
      losses: this.portfolio.losses,
      winRate: totalTrades > 0 ? (this.portfolio.wins / totalTrades) * 100 : 0,
      totalTrades,
      todayPnl: todayStats.todayPnl,
      todayTradeCount: todayStats.todayTrades,
      todayWins: todayStats.todayWins,
      todayLosses: todayStats.todayLosses,
      recentTrades: this.portfolio.trades.slice(-20).reverse(),
      strategyStats: this.portfolio.strategyStats,
      mode: this.live ? 'LIVE' : 'PAPER',
    };
  }
}
