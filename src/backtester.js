// ══════════════════════════════════════════════════════════════════════════════
// BACKTESTING ENGINE v5 — Regime-Adaptive Strategy (Profitability Overhaul)
// ══════════════════════════════════════════════════════════════════════════════
// Tests the dual strategy (Mean Reversion + Breakout) against historical data.
//
// Usage:
//   import { runBacktest } from './backtester.js';
//   const results = await runBacktest({ startingBalance: 10000, days: 30 });
// ══════════════════════════════════════════════════════════════════════════════

const SYMBOLS = ['ETHUSDT', 'BTCUSDT', 'SOLUSDT'];
const INTERVAL = '15m';
const DAYS = 30;
const KLINE_LIMIT = 1000; // Binance max per request

// Strategy params (must match scalper.js v5)
const SMA_PERIOD = 20;
const SMA50_PERIOD = 50;
const BB_STD_DEV = 2.0;
const RSI_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_PERIOD = 14;
const MACD_FAST = 12;
const MACD_SLOW = 26;
const MACD_SIGNAL = 9;
const VOL_AVG_PERIOD = 20;
const DONCHIAN_PERIOD = 20;

// Regime thresholds (v5)
const ADX_TRENDING = 40;  // was 35
const ADX_RANGING = 25;

// Mean Reversion params (v5 — R:R optimised)
const MR_RSI_ENTRY = 30;     // kept at 30
const MR_RSI_SHORT = 70;     // kept at 70
const MR_VOL_MULT = 1.0;     // was 0.8
const MR_STOP_ATR = 1.0;     // was 2.0 (halved!)
const MR_MAX_POS = 0.06;
const MR_MIN_BB_DISTANCE = 0.002; // was 0.001
const MR_MAX_BARS_HELD = 20; // was 30
const MR_TARGET_REVERSION = 1.0; // was 0.5 (full reversion!)
const MR_BREAKEVEN_ATR = 0.5; // move stop to entry after this × ATR profit

// Breakout params (v5 — nerfed)
const BO_VOL_MULT = 2.0;     // was 1.5
const BO_TRAIL_ATR = 2.5;
const BO_TP_PCT = 4.0;
const BO_MAX_POS = 0.05;     // was 0.10
const MAX_CONCURRENT = 2;    // correlation guard

// General
const FEE_PCT = 0.001; // 0.1% per side
const COOLDOWN_BARS = 3; // 3 candles cooldown between trades per symbol
const MIN_CANDLES = Math.max(ADX_PERIOD * 2 + 2, SMA50_PERIOD + 5, DONCHIAN_PERIOD + 2, MACD_SLOW + MACD_SIGNAL + 5);

// ── Indicator Functions ──────────────────────────────────────────────────────

function sma(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function stdDev(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
}

function bollingerBands(prices, period, numStdDev) {
  const s = sma(prices, period);
  const sd = stdDev(prices, period);
  if (s === null || sd === null) return null;
  return { upper: s + numStdDev * sd, middle: s, lower: s - numStdDev * sd };
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
  if (candles.length < period + 1) return null;
  const recent = candles.slice(-period - 1, -1);
  return recent.reduce((a, b) => a + b.volume, 0) / recent.length;
}

function donchianChannel(candles, period) {
  if (candles.length < period + 1) return null;
  const lookback = candles.slice(-(period + 1), -1);
  return {
    high: Math.max(...lookback.map(c => c.high)),
    low: Math.min(...lookback.map(c => c.low)),
  };
}

// MACD (v5)
function macd(prices, fastPeriod, slowPeriod, signalPeriod) {
  if (prices.length < slowPeriod + signalPeriod) return null;
  const kFast = 2 / (fastPeriod + 1);
  const kSlow = 2 / (slowPeriod + 1);
  const macdLine = [];
  let runFast = prices.slice(0, fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
  let runSlow = prices.slice(0, slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;
  for (let i = slowPeriod; i < prices.length; i++) {
    runFast = prices[i] * kFast + runFast * (1 - kFast);
    runSlow = prices[i] * kSlow + runSlow * (1 - kSlow);
    macdLine.push(runFast - runSlow);
  }
  if (macdLine.length < signalPeriod) return null;
  const kSig = 2 / (signalPeriod + 1);
  let signal = macdLine.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
  for (let i = signalPeriod; i < macdLine.length; i++) {
    signal = macdLine[i] * kSig + signal * (1 - kSig);
  }
  const latestMacd = macdLine[macdLine.length - 1];
  const prevMacd = macdLine.length >= 2 ? macdLine[macdLine.length - 2] : latestMacd;
  const histogram = latestMacd - signal;
  const prevHistogram = prevMacd - signal;
  return { histogram, rising: histogram > prevHistogram };
}

function adx(candles, period) {
  if (candles.length < period * 2 + 1) return null;

  const plusDMs = [];
  const minusDMs = [];
  const trs = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);

    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  if (trs.length < period) return null;

  const smooth = (arr, p) => {
    let sum = arr.slice(0, p).reduce((a, b) => a + b, 0);
    const result = [sum];
    for (let i = p; i < arr.length; i++) {
      sum = sum - sum / p + arr[i];
      result.push(sum);
    }
    return result;
  };

  const smoothTR = smooth(trs, period);
  const smoothPlusDM = smooth(plusDMs, period);
  const smoothMinusDM = smooth(minusDMs, period);

  const len = Math.min(smoothTR.length, smoothPlusDM.length, smoothMinusDM.length);
  if (len < period) return null;

  const dxValues = [];
  let latestPlusDI = 0;
  let latestMinusDI = 0;

  for (let i = 0; i < len; i++) {
    const tr = smoothTR[i];
    if (tr === 0) { dxValues.push(0); continue; }
    const plusDI = (smoothPlusDM[i] / tr) * 100;
    const minusDI = (smoothMinusDM[i] / tr) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxValues.push(dx);
    latestPlusDI = plusDI;
    latestMinusDI = minusDI;
  }

  if (dxValues.length < period) return null;

  let adxVal = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxValues.length; i++) {
    adxVal = (adxVal * (period - 1) + dxValues[i]) / period;
  }

  return { adx: adxVal, plusDI: latestPlusDI, minusDI: latestMinusDI };
}

// ── Fetch Historical Candles ─────────────────────────────────────────────────

async function fetchCandles(symbol, interval, days) {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  const candlesPerDay = interval === '5m' ? 288 : interval === '15m' ? 96 : 1440;
  const totalCandles = days * candlesPerDay;
  const batches = Math.ceil(totalCandles / KLINE_LIMIT);

  let allCandles = [];
  let batchStart = startTime;

  for (let i = 0; i < batches; i++) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${batchStart}&limit=${KLINE_LIMIT}`;

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
    batchStart = data[data.length - 1][6] + 1;

    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  return allCandles;
}

// ── Backtest Core ────────────────────────────────────────────────────────────

function backtestSymbol(candles, symbol, startingBalance) {
  const trades = [];
  let position = null;
  let lastTradeBar = -COOLDOWN_BARS - 1;
  const buffer = [];
  const maxBuffer = 120;

  // Regime counters
  let barsInTrending = 0;
  let barsInRanging = 0;
  let barsInAmbiguous = 0;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    buffer.push(candle);
    if (buffer.length > maxBuffer) buffer.shift();

    const closes = buffer.map(c => c.close);
    const candleCount = closes.length;

    if (candleCount < MIN_CANDLES) continue;

    // ── Calculate indicators ──
    const bb = bollingerBands(closes, SMA_PERIOD, BB_STD_DEV);
    const rsiVal = rsi(closes, RSI_PERIOD);
    const atrVal = atr(buffer, ATR_PERIOD);
    const adxData = adx(buffer, ADX_PERIOD);
    const macdData = macd(closes, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
    const donch = donchianChannel(buffer, DONCHIAN_PERIOD);
    const avgVol = avgVolume(buffer, VOL_AVG_PERIOD);
    const sma50Val = sma(closes, SMA50_PERIOD);
    const volumeRatio = avgVol ? candle.volume / avgVol : 0;
    const price = candle.close;

    if (!bb || !adxData || !donch || !atrVal) continue;

    // ── Determine regime ──
    let regime;
    if (adxData.adx > ADX_TRENDING) { regime = 'TRENDING'; barsInTrending++; }
    else if (adxData.adx < ADX_RANGING) { regime = 'RANGING'; barsInRanging++; }
    else { regime = 'AMBIGUOUS'; barsInAmbiguous++; }

    // ── Check exits ──
    if (position) {
      const isLong = position.side === 'LONG';
      const pnlPct = isLong
        ? ((price - position.entryPrice) / position.entryPrice) * 100
        : ((position.entryPrice - price) / position.entryPrice) * 100;

      // Track extreme price for trailing stop
      if (isLong && price > position.highestSinceEntry) {
        position.highestSinceEntry = price;
        if (position.strategy === 'BREAKOUT') {
          const newTrail = price - atrVal * BO_TRAIL_ATR;
          if (newTrail > position.trailingStop) position.trailingStop = newTrail;
        }
      } else if (!isLong && price < position.lowestSinceEntry) {
        position.lowestSinceEntry = price;
        if (position.strategy === 'BREAKOUT') {
          const newTrail = price + atrVal * BO_TRAIL_ATR;
          if (newTrail < position.trailingStop) position.trailingStop = newTrail;
        }
      }

      let exitReason = null;

      if (position.strategy === 'MEAN_REVERSION') {
        // v5: breakeven stop logic
        if (!position.breakevenStop) {
          const beThreshold = atrVal * MR_BREAKEVEN_ATR;
          const inProfit = isLong
            ? (price - position.entryPrice) >= beThreshold
            : (position.entryPrice - price) >= beThreshold;
          if (inProfit) {
            position.stopPrice = position.entryPrice;
            position.breakevenStop = true;
          }
        }

        if (isLong && price >= position.targetPrice) exitReason = 'TARGET_HIT';
        else if (!isLong && price <= position.targetPrice) exitReason = 'TARGET_HIT';
        else if (isLong && price <= position.stopPrice) exitReason = position.breakevenStop ? 'BREAKEVEN_EXIT' : 'STOP_LOSS';
        else if (!isLong && price >= position.stopPrice) exitReason = position.breakevenStop ? 'BREAKEVEN_EXIT' : 'STOP_LOSS';
        else if (i - position.entryBar >= MR_MAX_BARS_HELD) exitReason = 'TIME_EXIT';
      } else {
        // BREAKOUT
        if (pnlPct >= BO_TP_PCT) exitReason = 'TAKE_PROFIT';
        else if (isLong && price <= position.trailingStop) exitReason = 'TRAILING_STOP';
        else if (!isLong && price >= position.trailingStop) exitReason = 'TRAILING_STOP';
        else if (regime === 'RANGING' && pnlPct > -0.5) exitReason = 'REGIME_CHANGE';
      }

      if (exitReason) {
        const fee = position.quantity * price * FEE_PCT;
        const rawPnl = isLong
          ? position.quantity * (price - position.entryPrice)
          : position.quantity * (position.entryPrice - price);
        const totalFees = position.quantity * price * FEE_PCT + position.quantity * position.entryPrice * FEE_PCT;
        const pnlUsd = rawPnl - totalFees;
        const netPnlPct = pnlPct - FEE_PCT * 2 * 100;

        trades.push({
          symbol,
          strategy: position.strategy,
          side: position.side,
          type: 'SELL',
          entryPrice: position.entryPrice,
          exitPrice: price,
          quantity: position.quantity,
          cost: position.cost,
          revenue: position.quantity * price,
          pnlPct: netPnlPct,
          pnlUsd,
          reason: exitReason,
          entryTime: position.entryTime,
          exitTime: candle.openTime,
          barsHeld: i - position.entryBar,
        });
        position = null;
      }
      continue; // Don't evaluate entries while in position
    }

    // ── Session filter ──
    const utcHour = new Date(candle.openTime).getUTCHours();
    const inTradingWindow = utcHour >= 7 && utcHour < 21;
    if (!inTradingWindow) continue;

    // ── Cooldown ──
    if (i - lastTradeBar < COOLDOWN_BARS) continue;

    // ── Route by regime ──
    if (regime === 'RANGING') {
      const volOk = volumeRatio >= MR_VOL_MULT;
      const macdBullish = macdData ? macdData.rising : true;
      const macdBearish = macdData ? !macdData.rising : true;

      // LONG: buy below lower BB + RSI oversold + MACD confirming
      const belowBB = price < bb.lower;
      const bbDistLong = (bb.lower - price) / price;
      const bbDistLongOk = bbDistLong >= MR_MIN_BB_DISTANCE;
      const rsiOversold = rsiVal < MR_RSI_ENTRY;

      // SHORT: sell above upper BB + RSI overbought + MACD confirming
      const aboveBB = price > bb.upper;
      const bbDistShort = (price - bb.upper) / price;
      const bbDistShortOk = bbDistShort >= MR_MIN_BB_DISTANCE;
      const rsiOverbought = rsiVal > MR_RSI_SHORT;

      if (belowBB && bbDistLongOk && rsiOversold && volOk && macdBullish) {
        // MR LONG
        const stopPrice = price - atrVal * MR_STOP_ATR;
        const targetPrice = price + (bb.middle - price) * MR_TARGET_REVERSION;
        const positionValue = Math.min(startingBalance * 0.01 / (atrVal * MR_STOP_ATR) * price, startingBalance * MR_MAX_POS);
        const qty = positionValue / price;
        const fee = qty * price * FEE_PCT;

        position = {
          strategy: 'MEAN_REVERSION', side: 'LONG',
          entryPrice: price, quantity: qty, cost: qty * price + fee,
          entryTime: candle.openTime, entryBar: i,
          stopPrice, targetPrice,
          highestSinceEntry: price, lowestSinceEntry: price, trailingStop: null,
          breakevenStop: false,
        };
        lastTradeBar = i;
      } else if (aboveBB && bbDistShortOk && rsiOverbought && volOk && macdBearish) {
        // MR SHORT
        const stopPrice = price + atrVal * MR_STOP_ATR;
        const targetPrice = price - (price - bb.middle) * MR_TARGET_REVERSION;
        const positionValue = Math.min(startingBalance * 0.01 / (atrVal * MR_STOP_ATR) * price, startingBalance * MR_MAX_POS);
        const qty = positionValue / price;
        const fee = qty * price * FEE_PCT;

        position = {
          strategy: 'MEAN_REVERSION', side: 'SHORT',
          entryPrice: price, quantity: qty, cost: qty * price + fee,
          entryTime: candle.openTime, entryBar: i,
          stopPrice, targetPrice,
          highestSinceEntry: price, lowestSinceEntry: price, trailingStop: null,
          breakevenStop: false,
        };
        lastTradeBar = i;
      }
    } else if (regime === 'TRENDING') {
      const volOk = volumeRatio >= BO_VOL_MULT;

      // LONG breakout
      const aboveDonchian = price > donch.high;
      const uptrendDI = adxData.plusDI > adxData.minusDI;
      const aboveSma50 = sma50Val ? price > sma50Val : true;

      // SHORT breakout
      const belowDonchian = price < donch.low;
      const downtrendDI = adxData.minusDI > adxData.plusDI;
      const belowSma50 = sma50Val ? price < sma50Val : true;

      if (aboveDonchian && uptrendDI && volOk && aboveSma50) {
        // BO LONG
        const trailingStop = price - atrVal * BO_TRAIL_ATR;
        const positionValue = Math.min(startingBalance * 0.01 / (atrVal * BO_TRAIL_ATR) * price, startingBalance * BO_MAX_POS);
        const qty = positionValue / price;
        const fee = qty * price * FEE_PCT;

        position = {
          strategy: 'BREAKOUT', side: 'LONG',
          entryPrice: price, quantity: qty, cost: qty * price + fee,
          entryTime: candle.openTime, entryBar: i,
          stopPrice: null, targetPrice: price * (1 + BO_TP_PCT / 100),
          highestSinceEntry: price, lowestSinceEntry: price, trailingStop,
        };
        lastTradeBar = i;
      } else if (belowDonchian && downtrendDI && volOk && belowSma50) {
        // BO SHORT
        const trailingStop = price + atrVal * BO_TRAIL_ATR;
        const positionValue = Math.min(startingBalance * 0.01 / (atrVal * BO_TRAIL_ATR) * price, startingBalance * BO_MAX_POS);
        const qty = positionValue / price;
        const fee = qty * price * FEE_PCT;

        position = {
          strategy: 'BREAKOUT', side: 'SHORT',
          entryPrice: price, quantity: qty, cost: qty * price + fee,
          entryTime: candle.openTime, entryBar: i,
          stopPrice: null, targetPrice: price * (1 - BO_TP_PCT / 100),
          highestSinceEntry: price, lowestSinceEntry: price, trailingStop,
        };
        lastTradeBar = i;
      }
    }
    // AMBIGUOUS → no trade
  }

  // Close any open position at the end
  if (position) {
    const lastCandle = candles[candles.length - 1];
    const price = lastCandle.close;
    const isLong = position.side === 'LONG';
    const rawPnl = isLong
      ? position.quantity * (price - position.entryPrice)
      : position.quantity * (position.entryPrice - price);
    const totalFees = position.quantity * price * FEE_PCT + position.quantity * position.entryPrice * FEE_PCT;
    const pnlUsd = rawPnl - totalFees;
    const pnlPct = isLong
      ? ((price - position.entryPrice) / position.entryPrice) * 100 - FEE_PCT * 2 * 100
      : ((position.entryPrice - price) / position.entryPrice) * 100 - FEE_PCT * 2 * 100;

    trades.push({
      symbol,
      strategy: position.strategy,
      side: position.side,
      type: 'SELL',
      entryPrice: position.entryPrice,
      exitPrice: price,
      quantity: position.quantity,
      cost: position.cost,
      revenue: position.quantity * price,
      pnlPct,
      pnlUsd,
      reason: 'END_OF_DATA',
      entryTime: position.entryTime,
      exitTime: lastCandle.openTime,
      barsHeld: candles.length - position.entryBar,
    });
  }

  const totalBars = barsInTrending + barsInRanging + barsInAmbiguous;
  return {
    trades,
    regimeDistribution: {
      trending: totalBars > 0 ? ((barsInTrending / totalBars) * 100).toFixed(1) : 0,
      ranging: totalBars > 0 ? ((barsInRanging / totalBars) * 100).toFixed(1) : 0,
      ambiguous: totalBars > 0 ? ((barsInAmbiguous / totalBars) * 100).toFixed(1) : 0,
    },
  };
}

// ── Main Backtest Runner ─────────────────────────────────────────────────────

export async function runBacktest(options = {}) {
  const startingBalance = options.startingBalance || parseFloat(process.env.STARTING_PORTFOLIO) || 10_000;
  const days = options.days || DAYS;
  const symbols = options.symbols || SYMBOLS;

  console.log(`📊 Backtester v4: Fetching ${days} days of ${INTERVAL} candles for ${symbols.join(', ')}...`);

  // Fetch all candles
  const candleData = {};
  for (const symbol of symbols) {
    candleData[symbol] = await fetchCandles(symbol, INTERVAL, days);
    console.log(`   ${symbol}: ${candleData[symbol].length} candles loaded`);
  }

  // Run backtest for each symbol
  const allTrades = [];
  const perSymbol = {};
  const regimeDistributions = {};

  for (const symbol of symbols) {
    const { trades, regimeDistribution } = backtestSymbol(candleData[symbol], symbol, startingBalance);

    const mrTrades = trades.filter(t => t.strategy === 'MEAN_REVERSION');
    const boTrades = trades.filter(t => t.strategy === 'BREAKOUT');

    perSymbol[symbol] = {
      trades: trades.length,
      wins: trades.filter(t => t.pnlUsd > 0).length,
      losses: trades.filter(t => t.pnlUsd <= 0).length,
      totalPnl: trades.reduce((s, t) => s + t.pnlUsd, 0),
      meanReversion: {
        trades: mrTrades.length,
        wins: mrTrades.filter(t => t.pnlUsd > 0).length,
        losses: mrTrades.filter(t => t.pnlUsd <= 0).length,
        pnl: mrTrades.reduce((s, t) => s + t.pnlUsd, 0),
      },
      breakout: {
        trades: boTrades.length,
        wins: boTrades.filter(t => t.pnlUsd > 0).length,
        losses: boTrades.filter(t => t.pnlUsd <= 0).length,
        pnl: boTrades.reduce((s, t) => s + t.pnlUsd, 0),
      },
    };
    regimeDistributions[symbol] = regimeDistribution;
    allTrades.push(...trades);
  }

  // Sort all trades by entry time
  allTrades.sort((a, b) => a.entryTime - b.entryTime);

  // Per-strategy aggregate stats
  const mrTrades = allTrades.filter(t => t.strategy === 'MEAN_REVERSION');
  const boTrades = allTrades.filter(t => t.strategy === 'BREAKOUT');
  const longTrades = allTrades.filter(t => t.side === 'LONG');
  const shortTrades = allTrades.filter(t => t.side === 'SHORT');

  // Aggregate stats
  const wins = allTrades.filter(t => t.pnlUsd > 0).length;
  const losses = allTrades.filter(t => t.pnlUsd <= 0).length;
  const totalTrades = allTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;
  const totalPnlUsd = allTrades.reduce((s, t) => s + t.pnlUsd, 0);
  const totalPnlPct = (totalPnlUsd / startingBalance) * 100;
  const avgPnlPerTrade = totalTrades > 0 ? totalPnlUsd / totalTrades : 0;

  const winTrades = allTrades.filter(t => t.pnlUsd > 0);
  const lossTrades = allTrades.filter(t => t.pnlUsd <= 0);
  const avgWin = winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.pnlUsd, 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? lossTrades.reduce((s, t) => s + t.pnlUsd, 0) / lossTrades.length : 0;

  // Profit factor
  const grossProfit = winTrades.reduce((s, t) => s + t.pnlUsd, 0);
  const grossLoss = Math.abs(lossTrades.reduce((s, t) => s + t.pnlUsd, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

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

  // Max consecutive losses
  let maxConsecLosses = 0;
  let currentConsecLosses = 0;
  for (const t of allTrades) {
    if (t.pnlUsd <= 0) {
      currentConsecLosses++;
      maxConsecLosses = Math.max(maxConsecLosses, currentConsecLosses);
    } else {
      currentConsecLosses = 0;
    }
  }

  // Average bars held
  const avgBarsHeld = totalTrades > 0 ? allTrades.reduce((s, t) => s + (t.barsHeld || 0), 0) / totalTrades : 0;

  // Exit reason breakdown
  const exitReasons = {};
  for (const t of allTrades) {
    exitReasons[t.reason] = (exitReasons[t.reason] || 0) + 1;
  }

  const mrWinRate = mrTrades.length > 0 ? (mrTrades.filter(t => t.pnlUsd > 0).length / mrTrades.length * 100) : 0;
  const boWinRate = boTrades.length > 0 ? (boTrades.filter(t => t.pnlUsd > 0).length / boTrades.length * 100) : 0;

  const result = {
    startingBalance,
    daysBacktested: days,
    interval: INTERVAL,
    symbols,
    totalTrades,
    wins,
    losses,
    winRate: parseFloat(winRate.toFixed(1)),
    totalPnlUsd: parseFloat(totalPnlUsd.toFixed(2)),
    totalPnlPct: parseFloat(totalPnlPct.toFixed(2)),
    avgPnlPerTrade: parseFloat(avgPnlPerTrade.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(1)),
    maxConsecutiveLosses: maxConsecLosses,
    avgBarsHeld: parseFloat(avgBarsHeld.toFixed(1)),
    finalEquity: parseFloat(equity.toFixed(2)),
    perStrategy: {
      MEAN_REVERSION: {
        trades: mrTrades.length,
        wins: mrTrades.filter(t => t.pnlUsd > 0).length,
        losses: mrTrades.filter(t => t.pnlUsd <= 0).length,
        winRate: parseFloat(mrWinRate.toFixed(1)),
        pnl: parseFloat(mrTrades.reduce((s, t) => s + t.pnlUsd, 0).toFixed(2)),
        avgPnl: mrTrades.length > 0 ? parseFloat((mrTrades.reduce((s, t) => s + t.pnlUsd, 0) / mrTrades.length).toFixed(2)) : 0,
      },
      BREAKOUT: {
        trades: boTrades.length,
        wins: boTrades.filter(t => t.pnlUsd > 0).length,
        losses: boTrades.filter(t => t.pnlUsd <= 0).length,
        winRate: parseFloat(boWinRate.toFixed(1)),
        pnl: parseFloat(boTrades.reduce((s, t) => s + t.pnlUsd, 0).toFixed(2)),
        avgPnl: boTrades.length > 0 ? parseFloat((boTrades.reduce((s, t) => s + t.pnlUsd, 0) / boTrades.length).toFixed(2)) : 0,
      },
    },
    perSymbol,
    regimeDistributions,
    exitReasons,
    equityCurve,
    trades: allTrades.map(t => ({
      symbol: t.symbol,
      strategy: t.strategy,
      side: t.side,
      entryPrice: parseFloat(t.entryPrice.toFixed(2)),
      exitPrice: parseFloat(t.exitPrice.toFixed(2)),
      pnlPct: parseFloat(t.pnlPct.toFixed(2)),
      pnlUsd: parseFloat(t.pnlUsd.toFixed(2)),
      reason: t.reason,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      barsHeld: t.barsHeld,
    })),
    ranAt: new Date().toISOString(),
  };

  // Print summary
  const longWR = longTrades.length > 0 ? (longTrades.filter(t => t.pnlUsd > 0).length / longTrades.length * 100) : 0;
  const shortWR = shortTrades.length > 0 ? (shortTrades.filter(t => t.pnlUsd > 0).length / shortTrades.length * 100) : 0;
  const longPnl = longTrades.reduce((s, t) => s + t.pnlUsd, 0);
  const shortPnl = shortTrades.reduce((s, t) => s + t.pnlUsd, 0);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 BACKTEST RESULTS — ${days} days, ${symbols.join(' + ')}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`Total trades:     ${totalTrades} (${longTrades.length} LONG, ${shortTrades.length} SHORT)`);
  console.log(`Win rate:         ${winRate.toFixed(1)}%`);
  console.log(`P&L:              ${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}% ($${totalPnlUsd.toFixed(2)})`);
  console.log(`Profit factor:    ${profitFactor.toFixed(2)}`);
  console.log(`Max drawdown:     ${maxDrawdownPct.toFixed(1)}%`);
  console.log(`Max consec losses: ${maxConsecLosses}`);
  console.log(`Avg bars held:    ${avgBarsHeld.toFixed(1)}`);
  console.log(`\n  MEAN REVERSION: ${mrTrades.length} trades, ${mrWinRate.toFixed(1)}% WR, $${mrTrades.reduce((s, t) => s + t.pnlUsd, 0).toFixed(2)} P&L`);
  console.log(`  BREAKOUT:       ${boTrades.length} trades, ${boWinRate.toFixed(1)}% WR, $${boTrades.reduce((s, t) => s + t.pnlUsd, 0).toFixed(2)} P&L`);
  console.log(`\n  LONG:           ${longTrades.length} trades, ${longWR.toFixed(1)}% WR, $${longPnl.toFixed(2)} P&L`);
  console.log(`  SHORT:          ${shortTrades.length} trades, ${shortWR.toFixed(1)}% WR, $${shortPnl.toFixed(2)} P&L`);
  console.log(`${'═'.repeat(60)}\n`);

  return result;
}
