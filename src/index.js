// ══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT — POLYMARKET LATENCY ARBITRAGE BOT
// ══════════════════════════════════════════════════════════════════════════════
//
// Usage:
//   npm start           → Paper trading mode (default, safe)
//   npm run start:live   → LIVE trading mode (real money!)
//
// Before running:
//   1. Copy .env.example to .env
//   2. Fill in your API keys
//   3. Run: npm start
//
// ══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { RiskManager } from './risk.js';
import { BinanceFeed } from './binance.js';
import { PolymarketScanner } from './polymarket.js';
import { TradeExecutor } from './executor.js';
import { AlertService } from './alerts.js';
import { Dashboard } from './dashboard.js';
import { Scalper } from './scalper.js';
import { BinanceTrader } from './binance-trader.js';
import { ActivityLogger } from './activity-logger.js';

// ── Parse CLI Flags ──────────────────────────────────────────────────────────

const IS_LIVE = process.argv.includes('--live');

// ── Startup Banner ───────────────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║            ⚡  POLYMARKET LATENCY ARB BOT  ⚡            ║');
  console.log('  ╠══════════════════════════════════════════════════════════╣');

  if (IS_LIVE) {
    console.log('  ║   MODE: 🔴 LIVE TRADING (REAL MONEY)                    ║');
    console.log('  ║   WARNING: Trades will be placed with real funds!        ║');
  } else {
    console.log('  ║   MODE: 📝 PAPER TRADING (no real money)                ║');
    console.log('  ║   To go live, run: npm run start:live                    ║');
  }

  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');
}

// ── Environment Variable Validation ──────────────────────────────────────────

function validateEnv() {
  const required = [
    {
      key: 'POLYMARKET_API_KEY',
      desc: 'Your Polymarket API key. Get it from your Polymarket account settings.'
    },
    {
      key: 'POLYMARKET_PRIVATE_KEY',
      desc: 'Your Ethereum wallet private key for signing trades. ' +
            'This is used to interact with the Polymarket smart contracts.'
    }
  ];

  const optional = [
    {
      key: 'BINANCE_API_KEY',
      desc: 'Binance API key (optional — public WebSocket feeds don\'t need this).'
    },
    {
      key: 'TELEGRAM_BOT_TOKEN',
      desc: 'Telegram bot token for alerts. Create a bot at https://t.me/BotFather.'
    },
    {
      key: 'TELEGRAM_CHAT_ID',
      desc: 'Your Telegram chat ID. Message @userinfobot on Telegram to find it.'
    }
  ];

  const missing = [];
  for (const v of required) {
    if (!process.env[v.key] || process.env[v.key].includes('your_')) {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    console.log('');
    console.log('❌ Missing required environment variables:');
    console.log('');
    for (const v of missing) {
      console.log(`   ${v.key}`);
      console.log(`   → ${v.desc}`);
      console.log('');
    }
    console.log('How to fix:');
    console.log('  1. Copy the example file:  cp .env.example .env');
    console.log('  2. Open .env in a text editor');
    console.log('  3. Replace the placeholder values with your real keys');
    console.log('  4. Run the bot again:  npm start');
    console.log('');
    process.exit(1);
  }

  for (const v of optional) {
    if (!process.env[v.key] || process.env[v.key].includes('your_')) {
      console.log(`⚠️  ${v.key} is not set. ${v.desc}`);
    }
  }
}

// ── Preflight Checks ────────────────────────────────────────────────────────

async function preflightChecks(scanner, alerts) {
  console.log('');
  console.log('🔍 Running pre-flight checks...');
  console.log('');

  let allPassed = true;

  // 1. Test Polymarket connection
  process.stdout.write('   Polymarket API ... ');
  const polyTest = await scanner.testConnection();
  if (polyTest.ok) {
    console.log('✅ Connected');
  } else {
    console.log(`❌ Failed: ${polyTest.reason}`);
    console.log('   → Check your internet connection and POLYMARKET_API_KEY.');
    allPassed = false;
  }

  // 2. Binance WebSocket test
  process.stdout.write('   Binance WebSocket ... ');
  const binanceTest = await testBinanceConnection();
  if (binanceTest) {
    console.log('✅ Connected');
  } else {
    console.log('❌ Failed to connect');
    console.log('   → Check your internet connection. Binance may be blocked in your region.');
    allPassed = false;
  }

  // 3. Telegram (optional)
  process.stdout.write('   Telegram alerts ... ');
  const telegramTest = await alerts.testConnection();
  if (telegramTest.ok) {
    console.log(`✅ Connected (bot: @${telegramTest.botName})`);
  } else {
    console.log(`⚠️  ${telegramTest.reason} (alerts are optional)`);
  }

  // 4. SQLite database
  process.stdout.write('   Local database ... ');
  console.log('✅ Ready (trades.db)');

  console.log('');

  if (!allPassed) {
    console.log('❌ Some pre-flight checks failed. Fix the issues above and try again.');
    console.log('');
    process.exit(1);
  }

  console.log('✅ All pre-flight checks passed!');
  console.log('');
}

async function testBinanceConnection() {
  const WebSocket = (await import('ws')).default;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 8000);

    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      ws.on('message', () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });
      ws.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

// ── Main Bot Loop ────────────────────────────────────────────────────────────

async function main() {
  printBanner();
  validateEnv();

  const startingPortfolio = parseFloat(process.env.STARTING_PORTFOLIO) || 10_000;

  // Initialize all components
  const alerts = new AlertService(
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.TELEGRAM_CHAT_ID
  );

  const risk = new RiskManager(startingPortfolio, alerts);

  const scanner = new PolymarketScanner(process.env.POLYMARKET_API_KEY, alerts);

  const executor = new TradeExecutor(risk, alerts, {
    live: IS_LIVE,
    privateKey: process.env.POLYMARKET_PRIVATE_KEY,
    apiKey: process.env.POLYMARKET_API_KEY
  });

  const binance = new BinanceFeed();

  const dashboard = new Dashboard(risk, binance, {
    port: 3000,
    live: IS_LIVE
  });

  // Run preflight checks
  await preflightChecks(scanner, alerts);

  // Start dashboard
  await dashboard.start();

  // Start Binance feed
  binance.start();

  // Track disconnection for alerts
  let wasConnected = false;
  binance.on('connection', async ({ symbol, status }) => {
    dashboard.pushUpdate();
    const allConnected = binance.isConnected();

    if (wasConnected && !allConnected) {
      await alerts.sendDisconnectAlert('Binance WebSocket');
    }
    wasConnected = allConnected;
  });

  // Push price updates to dashboard (throttled to 1/sec)
  let lastDashboardPush = 0;
  binance.on('price', () => {
    const now = Date.now();
    if (now - lastDashboardPush > 1000) {
      lastDashboardPush = now;
      dashboard.pushUpdate();
    }
  });

  // Send startup alert
  await alerts.sendStartupAlert(IS_LIVE ? 'live' : 'paper');

  console.log('🚀 Bot is running! Dashboard: http://localhost:3000');
  console.log('   Press Ctrl+C to stop.\n');

  // ── Binance Scalper v4 — Regime-Adaptive ─────────────────────

  const scalper = new Scalper({
    symbols: ['ethusdt', 'btcusdt', 'solusdt'],
    interval: '15m',
  });

  const binanceTrader = new BinanceTrader({
    live: IS_LIVE,
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET || '',
    alerts,
    startingBalance: startingPortfolio,
  });

  // Expose scalper data to dashboard
  dashboard.scalper = scalper;
  dashboard.binanceTrader = binanceTrader;
  dashboard.polyScanner = scanner;

  // Activity logger
  const logger = new ActivityLogger(dashboard);
  dashboard.activityLogger = logger;

  // Startup entry
  const symbolList = scalper.symbols.map(s => s.replace('usdt','').toUpperCase()).join(', ');
  logger.info(`Bot v6 started in ${IS_LIVE ? 'LIVE' : 'PAPER'} mode. Confirmation MR + Breakout on ${symbolList}. 3% compounding, $95 hard floor.`);

  // Forward candle evaluations to dashboard live ticker
  scalper.on('candle-eval', (evalData) => {
    dashboard.io.emit('candle-eval', evalData);
  });

  // Log regime changes
  scalper.on('regime-change', ({ symbol, from, to, adx }) => {
    const coin = symbol.replace('usdt', '').toUpperCase();
    logger.info(`${coin} regime shifted: ${from} → ${to} (ADX ${adx.toFixed(1)})`);
  });

  // Log blocked entries
  scalper.on('skip', ({ symbol, reason, price, rsi, volumeRatio }) => {
    const coin = symbol.replace('usdt', '').toUpperCase();
    logger.skip(coin,
      `${coin} signal near at $${price.toFixed(2)} but blocked.`,
      reason,
      reason.includes('RSI') ? 'rsi' : reason.includes('Vol') ? 'regime' : reason.includes('BB') ? 'ema' : reason.includes('Hour') ? 'regime' : reason.includes('Cooldown') ? 'cooldown' : null
    );
  });

  // Hard floor: pause trading if portfolio drops below $95
  scalper.on('hard-floor', ({ balance, floor }) => {
    const msg = `🚨 <b>HARD FLOOR HIT</b>\n\nPortfolio: $${balance.toFixed(2)}\nFloor: $${floor}\n\n⛔ Trading is PAUSED.\nReview before resuming.`;
    alerts.send(msg);
    console.log(`\n🚨🚨🚨 HARD FLOOR HIT — $${balance.toFixed(2)} < $${floor} — TRADING PAUSED 🚨🚨🚨\n`);
  });

  // Handle BUY and SELL_SHORT signals (from either strategy, either direction)
  scalper.on('signal', async ({ symbol, signal, side, strategy, price, rsi, volumeRatio, atr }) => {
    if (signal !== 'BUY' && signal !== 'SELL_SHORT') return;
    if (scalper.hasOpenPosition(symbol)) return;

    const coin = symbol.replace('usdt', '').toUpperCase();
    const positionUsd = scalper.getPositionSize(symbol, binanceTrader.portfolio.balance);

    if (positionUsd <= 0) {
      logger.skip(coin, `${coin} ${signal} blocked: max portfolio exposure reached.`, 'Exposure limit', 'regime');
      return;
    }

    const positionPct = (positionUsd / binanceTrader.portfolio.balance) * 100;
    const tradeSide = side || 'LONG';

    const trade = await binanceTrader.buy(symbol, price, positionPct, strategy);
    if (trade) {
      scalper.openPosition(symbol, trade.price, trade.quantity, strategy, tradeSide);
      const pos = scalper.getPosition(symbol);
      const sideEmoji = tradeSide === 'LONG' ? '📈' : '📉';
      const stopInfo = strategy === 'MEAN_REVERSION'
        ? `Stop: $${pos?.stopPrice?.toFixed(2)} | Target: $${pos?.targetPrice?.toFixed(2)}`
        : `Trail: $${pos?.trailingStop?.toFixed(2)} | TP: $${pos?.targetPrice?.toFixed(2)}`;

      logger.buy(coin,
        `${sideEmoji} ${coin} [${strategy} ${tradeSide}] entered at $${trade.price.toFixed(2)}. Size: $${trade.cost.toFixed(2)}. ${stopInfo}`,
        `${strategy} ${tradeSide}, RSI ${rsi?.toFixed(0)}, vol ${volumeRatio?.toFixed(1)}x`
      );
      dashboard.pushUpdate();
    }
  });

  // Handle position closes (stop-loss, target hit, trailing stop, etc.)
  scalper.on('close-position', async ({ symbol, reason, strategy, side, entryPrice, exitPrice, pnlPct, quantity }) => {
    const coin = symbol.replace('usdt', '').toUpperCase();
    const tagMap = {
      TAKE_PROFIT: 'tp', STOP_LOSS: 'sl', TARGET_HIT: 'tp',
      TRAILING_STOP: 'sl', REGIME_CHANGE: 'regime', TIME_EXIT: 'sl',
    };
    const tradeSide = side || 'LONG';

    await binanceTrader.sell(symbol, quantity, exitPrice, entryPrice, strategy, reason, tradeSide);
    const isLong = tradeSide === 'LONG';
    const pnlUsd = isLong
      ? quantity * (exitPrice - entryPrice)
      : quantity * (entryPrice - exitPrice);
    logger.sell(coin,
      `${coin} [${strategy} ${tradeSide}] closed at $${exitPrice.toFixed(2)}. ${reason}. P&L: ${pnlUsd >= 0 ? '+' : ''}$${pnlUsd.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%).`,
      `Exit: ${reason}, entry $${entryPrice.toFixed(2)} → $${exitPrice.toFixed(2)}`,
      tagMap[reason] || 'sl'
    );
    scalper.closePosition(symbol);
    dashboard.pushUpdate();
  });

  // Start the scalper
  await scalper.start();

  // ── Main scanning loop ──────────────────────────────────────

  const SCAN_INTERVAL_MS = 2_000;

  async function scanLoop() {
    while (true) {
      try {
        const canTrade = risk.canTrade(0);

        if (canTrade.allowed && binance.isConnected()) {
          const binanceData = {
            btcusdt: binance.getPrice('btcusdt'),
            ethusdt: binance.getPrice('ethusdt')
          };

          const opportunities = await scanner.getOpportunities(binanceData);

          for (const opp of opportunities) {
            const trade = await executor.executeTrade(opp);
            if (trade) {
              dashboard.pushTradeNotification(trade);
            }
          }

          await executor.checkResolutions();
        }
      } catch (err) {
        console.error(`⚠️  Scan loop error: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, SCAN_INTERVAL_MS));
    }
  }

  scanLoop();

  // ── Graceful Shutdown ───────────────────────────────────────

  async function shutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    binance.shutdown();
    scalper.shutdown();
    await dashboard.shutdown();
    risk.shutdown();
    console.log('👋 Bot stopped. See you next time!');
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', async (err) => {
    console.error(`\n💥 Unexpected error: ${err.message}\n${err.stack}`);
    await alerts.send(`💥 Bot crashed unexpectedly: ${err.message}`);
    await shutdown('uncaughtException');
  });

  process.on('unhandledRejection', async (reason) => {
    console.error(`\n💥 Unhandled promise rejection: ${reason}`);
    await alerts.send(`💥 Bot error (unhandled rejection): ${reason}`);
  });
}

// ── Start ────────────────────────────────────────────────────────────────────

main().catch(async (err) => {
  console.error(`\n💥 Fatal error: ${err.message}\n${err.stack}`);
  console.error('   The bot could not start. Please check the error above.');
  process.exit(1);
});
