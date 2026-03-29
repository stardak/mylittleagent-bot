// ══════════════════════════════════════════════════════════════════════════════
// RISK MANAGEMENT MODULE
// ══════════════════════════════════════════════════════════════════════════════
// This is the most important module in the bot. It enforces all safety limits
// and logs every trade decision to a local SQLite database.
//
// Rules enforced:
//   • Daily loss limit:  -20% of portfolio → halt trading for 24 hours
//   • Total drawdown:    -40% of starting portfolio → full stop + alert
//   • Max single trade:  8% of portfolio
//   • Max open positions: 5 concurrent
//   • Every decision is logged with reasoning
// ══════════════════════════════════════════════════════════════════════════════

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RiskManager {
  constructor(startingPortfolio, alertService = null) {
    this.startingPortfolio = startingPortfolio;
    this.currentPortfolio = startingPortfolio;
    this.alertService = alertService;

    // Risk limits
    this.DAILY_LOSS_LIMIT = 0.20;
    this.TOTAL_DRAWDOWN_LIMIT = 0.40;
    this.MAX_SINGLE_TRADE_PCT = 0.08;
    this.MAX_OPEN_POSITIONS = 5;
    this.SINGLE_LOSS_ALERT_PCT = 0.05;

    // State
    this.openPositions = [];
    this.haltedUntil = null;
    this.killed = false;
    this.tradingPaused = false;

    // Initialise SQLite database
    this.db = new Database(path.join(__dirname, '..', 'trades.db'));
    this._initDatabase();
    this._loadState();
  }

  // ── Database Setup ─────────────────────────────────────────────────────────

  _initDatabase() {
    this.db.pragma('journal_mode = WAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        market_id TEXT,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        entry_price REAL,
        size_usd REAL,
        implied_prob_binance REAL,
        implied_prob_polymarket REAL,
        gap_pct REAL,
        kelly_fraction REAL,
        reasoning TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        exit_price REAL,
        pnl REAL,
        is_paper INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        starting_value REAL,
        ending_value REAL,
        pnl REAL,
        trade_count INTEGER DEFAULT 0,
        win_count INTEGER DEFAULT 0,
        loss_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bot_state (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS alerts_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        sent INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  _loadState() {
    const killState = this.db.prepare(
      "SELECT value FROM bot_state WHERE key = 'killed'"
    ).get();
    if (killState && killState.value === 'true') {
      this.killed = true;
    }

    const haltState = this.db.prepare(
      "SELECT value FROM bot_state WHERE key = 'halted_until'"
    ).get();
    if (haltState && haltState.value) {
      const haltTime = new Date(haltState.value);
      if (haltTime > new Date()) {
        this.haltedUntil = haltTime;
      }
    }

    const pauseState = this.db.prepare(
      "SELECT value FROM bot_state WHERE key = 'paused'"
    ).get();
    if (pauseState && pauseState.value === 'true') {
      this.tradingPaused = true;
    }

    const openTrades = this.db.prepare(
      "SELECT * FROM trades WHERE status = 'pending' OR status = 'open'"
    ).all();
    this.openPositions = openTrades;

    const totalPnl = this.db.prepare(
      "SELECT COALESCE(SUM(pnl), 0) as total FROM trades WHERE pnl IS NOT NULL"
    ).get();
    this.currentPortfolio = this.startingPortfolio + totalPnl.total;
  }

  _saveState(key, value) {
    this.db.prepare(
      "INSERT OR REPLACE INTO bot_state (key, value) VALUES (?, ?)"
    ).run(key, String(value));
  }

  // ── Core Risk Checks ──────────────────────────────────────────────────────

  canTrade(tradeSize = 0) {
    if (this.killed) {
      return {
        allowed: false,
        reason: 'The bot has been stopped by the kill switch because total losses exceeded 40%. ' +
                'This is a safety measure to protect your funds. The bot must be manually restarted.'
      };
    }

    if (this.tradingPaused) {
      return {
        allowed: false,
        reason: 'Trading is paused. You can resume it from the dashboard.'
      };
    }

    if (this.haltedUntil) {
      if (new Date() < this.haltedUntil) {
        const hoursLeft = Math.ceil((this.haltedUntil - new Date()) / (1000 * 60 * 60));
        return {
          allowed: false,
          reason: `Trading is halted for ${hoursLeft} more hour(s) because daily losses exceeded 20%. ` +
                  `Trading will automatically resume at ${this.haltedUntil.toLocaleString()}.`
        };
      } else {
        this.haltedUntil = null;
        this._saveState('halted_until', '');
      }
    }

    if (this.openPositions.length >= this.MAX_OPEN_POSITIONS) {
      return {
        allowed: false,
        reason: `You already have ${this.openPositions.length} open positions (max is ${this.MAX_OPEN_POSITIONS}). ` +
                `The bot will trade again once some positions close.`
      };
    }

    const maxAllowed = this.currentPortfolio * this.MAX_SINGLE_TRADE_PCT;
    if (tradeSize > 0 && tradeSize > maxAllowed) {
      return {
        allowed: false,
        reason: `Trade size ($${tradeSize.toFixed(2)}) exceeds the maximum allowed ` +
                `($${maxAllowed.toFixed(2)}, which is 8% of your portfolio).`
      };
    }

    return { allowed: true, reason: 'All checks passed.' };
  }

  // ── Position Sizing (Half-Kelly) ───────────────────────────────────────────

  calculatePositionSize(winProb, odds) {
    const b = odds - 1;
    const q = 1 - winProb;
    const kellyFraction = (b * winProb - q) / b;
    const halfKelly = Math.max(0, kellyFraction / 2);
    const cappedFraction = Math.min(halfKelly, this.MAX_SINGLE_TRADE_PCT);

    return {
      fraction: cappedFraction,
      sizeUsd: cappedFraction * this.currentPortfolio,
      kellyFraction,
      halfKelly
    };
  }

  // ── Trade Logging ──────────────────────────────────────────────────────────

  logDecision(trade) {
    const stmt = this.db.prepare(`
      INSERT INTO trades (
        market_id, symbol, side, entry_price, size_usd,
        implied_prob_binance, implied_prob_polymarket, gap_pct,
        kelly_fraction, reasoning, status, is_paper
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      trade.marketId || null,
      trade.symbol,
      trade.side,
      trade.entryPrice || null,
      trade.sizeUsd || null,
      trade.impliedProbBinance || null,
      trade.impliedProbPolymarket || null,
      trade.gapPct || null,
      trade.kellyFraction || null,
      trade.reasoning,
      trade.status || 'pending',
      trade.isPaper ? 1 : 0
    );

    return result.lastInsertRowid;
  }

  openPosition(tradeId) {
    this.db.prepare("UPDATE trades SET status = 'open' WHERE id = ?").run(tradeId);
    const trade = this.db.prepare("SELECT * FROM trades WHERE id = ?").get(tradeId);
    if (trade) this.openPositions.push(trade);
  }

  async closePosition(tradeId, exitPrice, pnl) {
    this.db.prepare(
      "UPDATE trades SET status = 'closed', exit_price = ?, pnl = ? WHERE id = ?"
    ).run(exitPrice, pnl, tradeId);

    this.openPositions = this.openPositions.filter(p => p.id !== tradeId);
    this.currentPortfolio += pnl;

    if (pnl < 0 && Math.abs(pnl) > this.startingPortfolio * this.SINGLE_LOSS_ALERT_PCT) {
      const msg = `⚠️ Large single loss: $${Math.abs(pnl).toFixed(2)} ` +
                  `(${(Math.abs(pnl) / this.startingPortfolio * 100).toFixed(1)}% of portfolio)`;
      this._logAlert('large_loss', msg);
      if (this.alertService) await this.alertService.send(msg);
    }

    this._updateDailyStats(pnl);
    await this._checkDailyLossLimit();
    await this._checkKillSwitch();
  }

  // ── Daily Stats ────────────────────────────────────────────────────────────

  _updateDailyStats(pnl) {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.db.prepare(
      "SELECT * FROM daily_stats WHERE date = ?"
    ).get(today);

    if (existing) {
      this.db.prepare(`
        UPDATE daily_stats SET
          ending_value = ?,
          pnl = pnl + ?,
          trade_count = trade_count + 1,
          win_count = win_count + ?,
          loss_count = loss_count + ?
        WHERE date = ?
      `).run(this.currentPortfolio, pnl, pnl > 0 ? 1 : 0, pnl <= 0 ? 1 : 0, today);
    } else {
      this.db.prepare(`
        INSERT INTO daily_stats (date, starting_value, ending_value, pnl, trade_count, win_count, loss_count)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `).run(today, this.currentPortfolio - pnl, this.currentPortfolio, pnl, pnl > 0 ? 1 : 0, pnl <= 0 ? 1 : 0);
    }
  }

  async _checkDailyLossLimit() {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.db.prepare(
      "SELECT * FROM daily_stats WHERE date = ?"
    ).get(today);

    if (!stats) return;

    const dailyLossPct = Math.abs(stats.pnl) / stats.starting_value;

    if (stats.pnl < 0 && dailyLossPct >= this.DAILY_LOSS_LIMIT) {
      this.haltedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      this._saveState('halted_until', this.haltedUntil.toISOString());

      const msg = `🛑 Daily loss limit hit! Lost ${(dailyLossPct * 100).toFixed(1)}% today. ` +
                  `Trading halted for 24 hours.`;
      this._logAlert('daily_halt', msg);
      if (this.alertService) await this.alertService.send(msg);
    }
  }

  async _checkKillSwitch() {
    const drawdownPct = (this.startingPortfolio - this.currentPortfolio) / this.startingPortfolio;

    if (drawdownPct >= this.TOTAL_DRAWDOWN_LIMIT) {
      this.killed = true;
      this._saveState('killed', 'true');

      const msg = `🚨 KILL SWITCH TRIGGERED! Total drawdown is ${(drawdownPct * 100).toFixed(1)}% ` +
                  `(portfolio: $${this.currentPortfolio.toFixed(2)}, started at: $${this.startingPortfolio.toFixed(2)}). ` +
                  `The bot has been completely stopped.`;
      this._logAlert('kill_switch', msg);
      if (this.alertService) await this.alertService.send(msg);
    }
  }

  _logAlert(type, message) {
    this.db.prepare(
      "INSERT INTO alerts_log (type, message, sent) VALUES (?, ?, 0)"
    ).run(type, message);
  }

  // ── Dashboard Queries ──────────────────────────────────────────────────────

  getStatus() {
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = this.db.prepare(
      "SELECT * FROM daily_stats WHERE date = ?"
    ).get(today) || { pnl: 0, trade_count: 0, win_count: 0, loss_count: 0 };

    const totalStats = this.db.prepare(
      "SELECT COUNT(*) as total, SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins FROM trades WHERE status = 'closed'"
    ).get();

    const dailyLossPct = dailyStats.pnl < 0
      ? Math.abs(dailyStats.pnl) / (this.currentPortfolio - dailyStats.pnl) : 0;
    const totalDrawdownPct = Math.max(0,
      (this.startingPortfolio - this.currentPortfolio) / this.startingPortfolio);

    return {
      portfolio: this.currentPortfolio,
      startingPortfolio: this.startingPortfolio,
      todayPnl: dailyStats.pnl,
      todayTradeCount: dailyStats.trade_count,
      todayWins: dailyStats.win_count,
      todayLosses: dailyStats.loss_count,
      totalTrades: totalStats.total,
      totalWins: totalStats.wins || 0,
      winRate: totalStats.total > 0 ? ((totalStats.wins || 0) / totalStats.total * 100).toFixed(1) : '0.0',
      openPositions: this.openPositions.length,
      maxPositions: this.MAX_OPEN_POSITIONS,
      isHalted: this.haltedUntil && new Date() < this.haltedUntil,
      haltedUntil: this.haltedUntil,
      isKilled: this.killed,
      isPaused: this.tradingPaused,
      dailyLossWarning: dailyLossPct > this.DAILY_LOSS_LIMIT * 0.7,
      drawdownWarning: totalDrawdownPct > this.TOTAL_DRAWDOWN_LIMIT * 0.7,
      dailyLossPct: (dailyLossPct * 100).toFixed(1),
      totalDrawdownPct: (totalDrawdownPct * 100).toFixed(1)
    };
  }

  getRecentTrades(limit = 20) {
    return this.db.prepare(
      "SELECT * FROM trades ORDER BY id DESC LIMIT ?"
    ).all(limit);
  }

  togglePause() {
    this.tradingPaused = !this.tradingPaused;
    this._saveState('paused', this.tradingPaused ? 'true' : 'false');
    return this.tradingPaused;
  }

  resetKillSwitch() {
    this.killed = false;
    this._saveState('killed', 'false');
  }

  shutdown() {
    if (this.db && this.db.open) {
      this.db.close();
    }
  }
}
