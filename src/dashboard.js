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
import { runBacktest, runKronosBacktest } from './backtester.js';
import { PolymarketArbScanner }  from './polymarket-arb.js';
import { FundingRateScanner }    from './funding-rate.js';
import { FearGreedScanner }      from './fear-greed.js';
import { StablecoinDepegScanner } from './stablecoin-depeg.js';
import { LiquidationScanner }    from './liquidation-scalper.js';
import { CrossExchangeScanner }  from './cross-exchange.js';

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

    // Kronos backtest caches (normal + inverted, keyed by `${invert}_${confidence}`)
    this._kronosBtCache = {};
    this._kronosBtRunning = false;

    // Polymarket Arb Scanner
    this._arbScanner    = new PolymarketArbScanner();
    this._arbScanner.start(30_000);

    // Strategy Labs — 5 independent paper-trading strategies
    this._fundingScanner = new FundingRateScanner();
    this._fundingScanner.start();

    this._fearGreedScanner = new FearGreedScanner();
    this._fearGreedScanner.start();

    this._depegScanner = new StablecoinDepegScanner();
    this._depegScanner.start();

    this._liqScanner = new LiquidationScanner();
    this._liqScanner.start();

    this._crossExScanner = new CrossExchangeScanner();
    this._crossExScanner.start();

    // Serve index.html with no-cache headers so Cloudflare never caches it
    const publicDir = path.join(__dirname, '..', 'public');
    this.app.get('/', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.sendFile(path.join(publicDir, 'index.html'));
    });
    this.app.use(express.static(publicDir));
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
      ethusdt: this.binance ? this.binance.getPrice('ethusdt') : null,
      solusdt: this.binance ? this.binance.getPrice('solusdt') : null,
    };

    // Scalper data — build dynamically for all symbols
    let scalperData = null;
    if (this.scalper) {
      const signals = this.scalper.getSignals();
      const positions = {};
      for (const sym of this.scalper.symbols) {
        positions[sym] = this.scalper.getPosition(sym);
      }
      scalperData = { signals, positions };
    }

    const binancePortfolio = this.binanceTrader ? this.binanceTrader.getPortfolio() : null;
    const marketCards = this.polyScanner ? this.polyScanner.getMarketCards() : {};
    const backtestResults = this._backtestCache || null;
    const kronosAnalytics = this.scalper ? this.scalper.getKronosAnalytics() : null;

    return {
      status, trades, binanceStatus, prices,
      scalper: scalperData,
      binancePortfolio,
      marketCards,
      backtestResults,
      kronosAnalytics,
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
    // Kronos backtest — fire-and-forget start, then poll /status
    // Cloudflare has a 100s proxy timeout so we return immediately and let the client poll
    this.app.get('/api/backtest/kronos', (req, res) => {
      const invert     = req.query.invert === 'true';
      const confidence = parseFloat(req.query.confidence || process.env.KRONOS_MIN_CONFIDENCE || '0.65');
      const days       = parseInt(req.query.days || '30');
      const cacheKey   = `${invert}_${confidence}_${days}`;

      const cached = this._kronosBtCache[cacheKey];
      if (cached && (Date.now() - cached.ts) < 3600_000) {
        return res.json({ done: true, running: false, cached: true, ...cached.results });
      }
      if (this._kronosBtRunning) {
        return res.json({ done: false, running: true });
      }

      // Fire and forget
      this._kronosBtRunning = true;
      this._kronosBtError   = null;
      runKronosBacktest({
        startingBalance: parseFloat(process.env.STARTING_PORTFOLIO) || 100,
        days, invert, confidence,
      }).then(results => {
        this._kronosBtCache[cacheKey] = { ts: Date.now(), results };
        this._kronosBtRunning = false;
        console.log(`\u2705 Kronos backtest done: ${results.totalTrades} trades, ${results.winRate}% WR`);
      }).catch(err => {
        this._kronosBtRunning = false;
        this._kronosBtError   = err.message;
        console.error('Kronos backtest error:', err);
      });

      res.json({ done: false, running: true, started: true });
    });

    // Poll endpoint — browser calls this every 3s until done:true
    this.app.get('/api/backtest/kronos/status', (req, res) => {
      const invert     = req.query.invert === 'true';
      const confidence = parseFloat(req.query.confidence || process.env.KRONOS_MIN_CONFIDENCE || '0.65');
      const days       = parseInt(req.query.days || '30');
      const cacheKey   = `${invert}_${confidence}_${days}`;
      const cached     = this._kronosBtCache[cacheKey];
      if (cached)             return res.json({ done: true,  running: false, ...cached.results });
      if (this._kronosBtError) return res.json({ done: false, running: false, error: this._kronosBtError });
      res.json({ done: false, running: this._kronosBtRunning });
    });

    // Polymarket Arb — state (opportunities, paper trades, stats, activity log)
    this.app.get('/api/polymarket-arb/state', (req, res) => {
      res.json(this._arbScanner.getState());
    });

    // Strategy Labs — individual state endpoints
    this.app.get('/api/funding-rate/state',    (req, res) => res.json(this._fundingScanner.getState()));
    this.app.get('/api/fear-greed/state',      (req, res) => res.json(this._fearGreedScanner.getState()));
    this.app.get('/api/depeg/state',           (req, res) => res.json(this._depegScanner.getState()));
    this.app.get('/api/liquidation/state',     (req, res) => res.json(this._liqScanner.getState()));
    this.app.get('/api/cross-exchange/state',  (req, res) => res.json(this._crossExScanner.getState()));
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
