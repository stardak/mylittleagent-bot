// ══════════════════════════════════════════════════════════════════════════════
// BACKTESTING ENGINE
// ══════════════════════════════════════════════════════════════════════════════
// Replays the Scalper v2 strategy against 30 days of historical 1m Binance
// candles. Uses the exact same indicator logic and buy/sell conditions.
//
// Usage:
//   import { runBacktest } from './backtester.js';
//   const results = await runBacktest({ startingBalance: 10000 });
// ══════════════════════════════════════════════════════════════════════════════

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const INTERVAL = '1m';
const DAYS = 30;
const KLINE_LIMIT = 1000; // Binance max per request

// Strategy params (must match scalper.js exactly)
const FAST_PERIOD = 9;
const SLOW_PERIOD = 21;
const RSI_PERIOD = 14;
const MACD_FAST = 12;
const MACD_SLOW = 26;
const MACD_SIGNAL = 9;
const ATR_PERIOD = 14;
const VOL_AVG_PERIOD = 20;
const VOL_MULTIPLIER = 1.5;
const TAKE_PROFIT_PCT = 3.0;
const BREAKEVEN_TRIGGER_PCT = 1.2;
const COOLDOWN_MS = 4 * 60 * 60 * 1000;
const MIN_CANDLES = MACD_SLOW + MACD_SIGNAL + 3;

// ── Indicator Functions (copied from scalper.js) ─────────────────────────────

function ema(prices, period) {
  if (prices.length < period) return null;
  const k = 2 / (period + 1);
  let e = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    e = prices[i] * k + e * (1 - k);
  }
  return e;
}

function rsi(prices, period) {
  if (prices.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  const recent = changes.slice(-period);
  let avgGain = 0, avgLoss = 0;
  for (const c of recent) {
    if (c > 0) avgGain += c;
    else avgLoss += Math.abs(c);
  }
  avgGain /= period;
  avgLoss /= period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function macdHistogram(prices) {
  if (prices.length < MACD_SLOW + MACD_SIGNAL) return [];
  const histograms = [];
  for (let i = MACD_SLOW + MACD_SIGNAL; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const emaF = ema(slice, MACD_FAST);
    const emaS = ema(slice, MACD_SLOW);
    histograms.push(emaF - emaS);
  }
  if (histograms.length < MACD_SIGNAL) return [];
  const result = [];
  const k = 2 / (MACD_SIGNAL + 1);
  let signal = histograms.slice(0, MACD_SIGNAL).reduce((a, b) => a + b, 0) / MACD_SIGNAL;
  for (let i = MACD_SIGNAL; i < histograms.length; i++) {
    signal = histograms[i] * k + signal * (1 - k);
    result.push(histograms[i] - signal);
  }
  return result;
}

function atr(candles, period) {
  if (candles.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function avgVolume(candles, period) {
  if (candles.length < period) return null;
  const recent = candles.slice(-period - 1, -1);
  return recent.reduce((a, b) => a + b.volume, 0) / recent.length;
}

// ── Fetch Historical Candles ─────────────────────────────────────────────────

async function fetchCandles(symbol, days) {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  const totalCandles = days * 24 * 60; // 1m candles
  const batches = Math.ceil(totalCandles / KLINE_LIMIT);

  let allCandles = [];
  let batchStart = startTime;

  for (let i = 0; i < batches; i++) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${INTERVAL}&startTime=${batchStart}&limit=${KLINE_LIMIT}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance API error: ${res.status} for ${symbol}`);
    const data = await res.json();

    if (data.length === 0) break;

    const candles = data.map(k => ({
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
    }));

    allCandles = allCandles.concat(candles);
    batchStart = data[data.length - 1][6] + 1; // next batch starts after last close time

    // Rate limit: 100ms between requests
    await new Promise(r => setTimeout(r, 100));
  }

  return allCandles;
}

// ── Backtest Core ────────────────────────────────────────────────────────────

function backtestSymbol(candles, symbol, startingBalance) {
  const trades = [];
  let position = null;
  let lastTradeTime = 0;
  const buffer = [];
  const buffer5m = [];  // 5m candles built from 1m
  let candle5mAccum = [];  // accumulator for building 5m candles
  const maxBuffer = 60;
  let mtfTrendUp = false;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    buffer.push(candle);
    if (buffer.length > maxBuffer) buffer.shift();

    // Build 5m candles from 1m candles
    candle5mAccum.push(candle);
    if (candle5mAccum.length >= 5) {
      const c5m = {
        close: candle5mAccum[candle5mAccum.length - 1].close,
        high: Math.max(...candle5mAccum.map(c => c.high)),
        low: Math.min(...candle5mAccum.map(c => c.low)),
        volume: candle5mAccum.reduce((s, c) => s + c.volume, 0),
      };
      buffer5m.push(c5m);
      if (buffer5m.length > 30) buffer5m.shift();
      candle5mAccum = [];

      // Update 5m trend
      const closes5m = buffer5m.map(c => c.close);
      if (closes5m.length >= SLOW_PERIOD) {
        const ema9_5m = ema(closes5m, FAST_PERIOD);
        const ema21_5m = ema(closes5m, SLOW_PERIOD);
        mtfTrendUp = ema9_5m > ema21_5m;
      }
    }

    const closes = buffer.map(c => c.close);
    const candleCount = closes.length;

    if (candleCount < MIN_CANDLES) continue;

    // Calculate indicators
    const emaFast = ema(closes, FAST_PERIOD);
    const emaSlow = ema(closes, SLOW_PERIOD);
    const prevEmaFast = ema(closes.slice(0, -1), FAST_PERIOD);
    const prevEmaSlow = ema(closes.slice(0, -1), SLOW_PERIOD);

    const rsiVal = rsi(closes, RSI_PERIOD);
    const rsi2ago = rsi(closes.slice(0, -2), RSI_PERIOD);
    const rsiRising = rsiVal > rsi2ago;

    const macdHists = macdHistogram(closes);
    const currentMacdHist = macdHists.length > 0 ? macdHists[macdHists.length - 1] : 0;

    let macdCrossedZero = false;
    if (macdHists.length >= 4) {
      for (let j = macdHists.length - 3; j < macdHists.length; j++) {
        if (macdHists[j] > 0 && macdHists[j - 1] <= 0) {
          macdCrossedZero = true;
          break;
        }
      }
    }

    const avgVol = avgVolume(buffer, VOL_AVG_PERIOD);
    const volumeRatio = avgVol ? candle.volume / avgVol : 0;
    const atrVal = atr(buffer, ATR_PERIOD);

    const utcHour = new Date(candle.openTime).getUTCHours();
    const inTradingWindow = utcHour >= 8 && utcHour < 22;

    // ── Check exits if in position ──
    if (position) {
      const currentPrice = candle.close;
      const pnlPct = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      // Breakeven stop
      if (pnlPct >= BREAKEVEN_TRIGGER_PCT && !position.breakevenStop) {
        position.breakevenStop = true;
        position.dynamicStop = position.entryPrice;
      }

      let exitReason = null;

      // Take profit
      if (pnlPct >= TAKE_PROFIT_PCT) {
        exitReason = 'TAKE_PROFIT';
      }
      // Dynamic stop / breakeven stop
      else if (currentPrice <= position.dynamicStop) {
        exitReason = position.breakevenStop ? 'BREAKEVEN_STOP' : 'ATR_STOP';
      }
      // RSI overbought
      else if (rsiVal > 75) {
        exitReason = 'RSI_OVERBOUGHT';
      }
      // EMA cross down
      else if (prevEmaFast >= prevEmaSlow && emaFast < emaSlow) {
        exitReason = 'EMA_CROSS_DOWN';
      }

      if (exitReason) {
        const pnlUsd = position.quantity * (currentPrice - position.entryPrice);
        trades.push({
          symbol,
          type: 'SELL',
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          quantity: position.quantity,
          pnlPct,
          pnlUsd,
          reason: exitReason,
          entryTime: position.entryTime,
          exitTime: candle.openTime,
          cost: position.cost,
        });
        position = null;
      }
      continue; // Don't evaluate buys while in position
    }

    // ── Evaluate BUY ──
    const emaCrossUp = prevEmaFast <= prevEmaSlow && emaFast > emaSlow;
    const rsiInRange = rsiVal >= 45 && rsiVal <= 60;
    const volumeOk = volumeRatio >= VOL_MULTIPLIER;
    const cooldownOk = (candle.openTime - lastTradeTime) > COOLDOWN_MS;

    if (emaCrossUp && rsiInRange && rsiRising && volumeOk && macdCrossedZero && inTradingWindow && cooldownOk && mtfTrendUp) {
      // Position sizing: risk 1% of balance / (ATR * 1.5)
      const riskAmount = startingBalance * 0.01;
      const stopDistance = atrVal ? atrVal * 1.5 : candle.close * 0.015;
      const shares = riskAmount / stopDistance;
      const positionValue = Math.min(shares * candle.close, startingBalance * 0.3);
      const qty = positionValue / candle.close;

      position = {
        entryPrice: candle.close,
        quantity: qty,
        cost: positionValue,
        entryTime: candle.openTime,
        dynamicStop: candle.close - stopDistance,
        breakevenStop: false,
      };
      lastTradeTime = candle.openTime;
    }
  }

  // Close any open position at the end
  if (position) {
    const lastCandle = candles[candles.length - 1];
    const pnlPct = ((lastCandle.close - position.entryPrice) / position.entryPrice) * 100;
    const pnlUsd = position.quantity * (lastCandle.close - position.entryPrice);
    trades.push({
      symbol,
      type: 'SELL',
      entryPrice: position.entryPrice,
      exitPrice: lastCandle.close,
      quantity: position.quantity,
      pnlPct,
      pnlUsd,
      reason: 'END_OF_DATA',
      entryTime: position.entryTime,
      exitTime: lastCandle.openTime,
      cost: position.cost,
    });
  }

  return trades;
}

// ── Main Backtest Runner ─────────────────────────────────────────────────────

export async function runBacktest(options = {}) {
  const startingBalance = options.startingBalance || parseFloat(process.env.STARTING_PORTFOLIO) || 10_000;
  const days = options.days || DAYS;

  console.log(`📊 Backtester: Fetching ${days} days of 1m candles for ${SYMBOLS.join(', ')}...`);

  // Fetch all candles
  const candleData = {};
  for (const symbol of SYMBOLS) {
    candleData[symbol] = await fetchCandles(symbol, days);
    console.log(`   ${symbol}: ${candleData[symbol].length} candles loaded`);
  }

  // Run backtest for each symbol
  const allTrades = [];
  const perSymbol = {};

  for (const symbol of SYMBOLS) {
    const trades = backtestSymbol(candleData[symbol], symbol, startingBalance);
    perSymbol[symbol] = {
      trades: trades.length,
      wins: trades.filter(t => t.pnlUsd > 0).length,
      losses: trades.filter(t => t.pnlUsd <= 0).length,
      totalPnl: trades.reduce((s, t) => s + t.pnlUsd, 0),
    };
    allTrades.push(...trades);
  }

  // Sort all trades by entry time
  allTrades.sort((a, b) => a.entryTime - b.entryTime);

  // Calculate aggregate stats
  const wins = allTrades.filter(t => t.pnlUsd > 0).length;
  const losses = allTrades.filter(t => t.pnlUsd <= 0).length;
  const totalTrades = allTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;
  const totalPnlUsd = allTrades.reduce((s, t) => s + t.pnlUsd, 0);
  const totalPnlPct = (totalPnlUsd / startingBalance) * 100;
  const avgPnlPerTrade = totalTrades > 0 ? totalPnlUsd / totalTrades : 0;
  const avgWin = wins > 0 ? allTrades.filter(t => t.pnlUsd > 0).reduce((s, t) => s + t.pnlUsd, 0) / wins : 0;
  const avgLoss = losses > 0 ? allTrades.filter(t => t.pnlUsd <= 0).reduce((s, t) => s + t.pnlUsd, 0) / losses : 0;

  // Equity curve + max drawdown
  let equity = startingBalance;
  let peak = equity;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  const equityCurve = [{ time: allTrades[0]?.entryTime || Date.now(), equity: startingBalance }];

  for (const trade of allTrades) {
    equity += trade.pnlUsd;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    const ddPct = (dd / peak) * 100;
    if (ddPct > maxDrawdownPct) {
      maxDrawdownPct = ddPct;
      maxDrawdown = dd;
    }
    equityCurve.push({ time: trade.exitTime, equity });
  }

  // Exit reason breakdown
  const exitReasons = {};
  for (const t of allTrades) {
    exitReasons[t.reason] = (exitReasons[t.reason] || 0) + 1;
  }

  const result = {
    startingBalance,
    daysBacktested: days,
    totalTrades,
    wins,
    losses,
    winRate: parseFloat(winRate.toFixed(1)),
    totalPnlUsd: parseFloat(totalPnlUsd.toFixed(2)),
    totalPnlPct: parseFloat(totalPnlPct.toFixed(2)),
    avgPnlPerTrade: parseFloat(avgPnlPerTrade.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(1)),
    finalEquity: parseFloat(equity.toFixed(2)),
    perSymbol,
    exitReasons,
    equityCurve,
    trades: allTrades.map(t => ({
      symbol: t.symbol,
      entryPrice: parseFloat(t.entryPrice.toFixed(2)),
      exitPrice: parseFloat(t.exitPrice.toFixed(2)),
      pnlPct: parseFloat(t.pnlPct.toFixed(2)),
      pnlUsd: parseFloat(t.pnlUsd.toFixed(2)),
      reason: t.reason,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      cost: parseFloat(t.cost.toFixed(2)),
    })),
    ranAt: new Date().toISOString(),
  };

  console.log(`📊 Backtest complete: ${totalTrades} trades, ${winRate.toFixed(1)}% win rate, ${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}% P&L`);

  return result;
}
