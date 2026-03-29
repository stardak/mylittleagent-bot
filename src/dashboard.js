// ══════════════════════════════════════════════════════════════════════════════
// WEB DASHBOARD SERVER
// ══════════════════════════════════════════════════════════════════════════════
// Express server on port 3000 with Socket.IO for live updates.
//
// Includes: Backtesting endpoint, PIN-protected toggle, live data streaming.
//
// Features:
//   • Portfolio value and P&L in large text
//   • Live feed of last 20 trade decisions
//   • Win rate and trade count
//   • ON/OFF toggle to pause/resume trading
//   • Red banner for approaching risk limits
//   • Green/red Binance connection indicator
// ══════════════════════════════════════════════════════════════════════════════

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { runBacktest } from './backtester.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Dashboard {
  constructor(riskManager, binanceFeed, options = {}) {
    this.risk = riskManager;
    this.binance = binanceFeed;
    this.port = options.port || 3000;
    this.isLive = options.live || false;

    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);

    // These get set by index.js after construction
    this.scalper = null;
    this.binanceTrader = null;
    this.polyScanner = null;

    // Backtest cache (1 hour TTL)
    this._backtestCache = null;
    this._backtestCacheTime = 0;
    this._backtestRunning = false;

    this.app.use(express.static(path.join(__dirname, '..', 'public')));
    this.app.use(express.json());

    this._setupRoutes();
    this._setupWebSocket();
  }

  start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🌐 Dashboard running at http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  pushUpdate() {
    this.io.emit('update', this._buildPayload());
  }

  _buildPayload() {
    const status = this.risk.getStatus();
    const trades = this.risk.getRecentTrades(20);
    const binanceStatus = this.binance ? this.binance.getConnectionStatus() : { allConnected: false };
    const prices = {
      btcusdt: this.binance ? this.binance.getPrice('btcusdt') : null,
      ethusdt: this.binance ? this.binance.getPrice('ethusdt') : null
    };

    // Scalper data
    const scalperData = this.scalper ? {
      signals: this.scalper.getSignals(),
      positions: {
        btcusdt: this.scalper.getPosition('btcusdt'),
        ethusdt: this.scalper.getPosition('ethusdt'),
        solusdt: this.scalper.getPosition('solusdt'),
      },
    } : null;

    const binancePortfolio = this.binanceTrader ? this.binanceTrader.getPortfolio() : null;
    const marketCards = this.polyScanner ? this.polyScanner.getMarketCards() : {};
    const backtestResults = this._backtestCache || null;

    return {
      status, trades, binanceStatus, prices,
      scalper: scalperData,
      binancePortfolio,
      marketCards,
      backtestResults,
      isLive: this.isLive,
      timestamp: new Date().toISOString()
    };
  }

  pushTradeNotification(trade) {
    this.io.emit('trade', trade);
    this.pushUpdate();
  }

  _setupRoutes() {
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/api/status', (req, res) => {
      res.json(this._buildPayload());
    });

    this.app.get('/api/trades', (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      res.json(this.risk.getRecentTrades(limit));
    });

    this.app.post('/api/toggle', (req, res) => {
      const pin = process.env.DASHBOARD_PIN;
      if (pin && req.body.pin !== pin) {
        return res.status(401).json({ success: false, message: 'Wrong PIN' });
      }
      const isPaused = this.risk.togglePause();
      this.pushUpdate();
      res.json({
        success: true, isPaused,
        message: isPaused ? 'Trading is now PAUSED' : 'Trading is now ACTIVE'
      });
    });

    // Backtest endpoint
    this.app.get('/api/backtest', async (req, res) => {
      try {
        // Return cached results if fresh (< 1 hour)
        const now = Date.now();
        if (this._backtestCache && (now - this._backtestCacheTime) < 3600_000) {
          return res.json({ cached: true, ...this._backtestCache });
        }

        if (this._backtestRunning) {
          return res.status(429).json({ error: 'Backtest already running, please wait...' });
        }

        this._backtestRunning = true;
        const results = await runBacktest({
          startingBalance: parseFloat(process.env.STARTING_PORTFOLIO) || 10_000,
        });
        this._backtestCache = results;
        this._backtestCacheTime = now;
        this._backtestRunning = false;

        res.json(results);
      } catch (err) {
        this._backtestRunning = false;
        console.error('Backtest error:', err);
        res.status(500).json({ error: err.message });
      }
    });
  }

  _setupWebSocket() {
    this.io.on('connection', (socket) => {
      socket.emit('update', this._buildPayload());

      // Send existing activity log
      if (this.activityLogger) {
        const entries = this.activityLogger.getRecent(50);
        entries.reverse().forEach(e => socket.emit('activity', e));
      }

      socket.on('toggle', (data) => {
        const pin = process.env.DASHBOARD_PIN;
        if (pin && (!data || data.pin !== pin)) {
          socket.emit('pin-error', { message: 'Wrong PIN' });
          return;
        }
        this.risk.togglePause();
        this.pushUpdate();
      });
    });
  }

  shutdown() {
    return new Promise((resolve) => {
      this.io.close();
      this.server.close(resolve);
    });
  }
}
