// ══════════════════════════════════════════════════════════════════════════════
// REGIME-ADAPTIVE TRADING ENGINE v4
// ══════════════════════════════════════════════════════════════════════════════
//
// Two strategies, selected automatically by market regime (ADX):
//
//   ┌─────────────────────────────────────────────────────────┐
//   │  REGIME DETECTOR — ADX(14) on 5m candles               │
//   │                                                        │
//   │  ADX > 25  → TRENDING   → Breakout strategy            │
//   │  ADX < 20  → RANGING    → Mean reversion strategy      │
//   │  ADX 20-25 → AMBIGUOUS  → No new entries               │
//   └─────────────────────────────────────────────────────────┘
//
//  MEAN REVERSION (ranging markets, ~60-70% of time):
//    BUY:  price < lower Bollinger Band(20,2) AND RSI < 30
//          AND volume > 0.8x average AND in trading window
//    SELL: price >= SMA(20) (target) OR
//          price < entry - ATR*0.8 (stop)
//    Expected: 65-75% win rate, ~1.5:1 R:R
//
//  BREAKOUT (trending markets, ~20-30% of time):
//    BUY:  price > 20-period high (Donchian) AND ADX > 25
//          AND +DI > -DI AND volume > 1.5x avg
//    SELL: trailing stop at highest_since_entry - ATR*2.0
//          OR take profit at +3%
//    Expected: 35-45% win rate, 3:1+ R:R
//
// ══════════════════════════════════════════════════════════════════════════════

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class Scalper extends EventEmitter {
  constructor(options = {}) {
    super();

    this.symbols = options.symbols || ['ethusdt'];
    this.interval = options.interval || '15m';

    // ── Indicator periods ──
    this.smaPeriod = 20;           // Bollinger / Donchian lookback
    this.sma50Period = 50;         // Macro trend filter
    this.bbStdDev = 2.0;           // Bollinger Band width (standard 2σ)
    this.rsiPeriod = 14;
    this.atrPeriod = 14;
    this.adxPeriod = 14;
    this.volumeAvgPeriod = 20;
    this.donchianPeriod = 20;

    // ── Regime thresholds ──
    this.adxTrendingThreshold = 35;  // Only breakout in VERY strong trends
    this.adxRangingThreshold = 25;   // Wider ranging zone (was 20)

    // ── Mean Reversion params ──
    this.mrRsiEntry = 30;           // RSI must be below this (LONG)
    this.mrRsiShortEntry = 70;      // RSI must be above this (SHORT)
    this.mrVolumeMultiplier = 0.8;  // Volume must be above this × avg
    this.mrStopAtrMult = 2.0;       // Stop distance = ATR × this
    this.mrMaxPositionPct = 0.06;   // 6% of portfolio max
    this.mrMinBBDistance = 0.001;    // Price must be beyond BB band
    this.mrMaxBarsHeld = 30;        // Force exit after 30 bars
    this.mrTargetReversion = 0.5;   // Target 50% reversion to SMA20

    // ── Breakout params ──
    this.boVolumeMultiplier = 1.5;  // Volume must be above this × avg
    this.boTrailAtrMult = 2.5;     // Trailing stop distance = ATR × this
    this.boTakeProfitPct = 4.0;    // Take profit at +4% / -4%
    this.boMaxPositionPct = 0.10;   // 10% of portfolio max

    // ── General ──
    this.maxTotalExposurePct = 0.25; // Max 25% total portfolio in trades
    this.cooldownMs = 15 * 60 * 1000; // 15 minutes between trades per coin

    // ── Per-symbol state ──
    this.candles = {};
    this.signals = {};
    this.positions = {};
    this.lastTradeTime = {};
    this.websockets = {};

    for (const sym of this.symbols) {
      this.candles[sym] = [];
      this.signals[sym] = {
        // Indicators
        sma20: 0, bbUpper: 0, bbLower: 0,
        rsi: 50, atr: 0,
        adx: 0, plusDI: 0, minusDI: 0,
        donchianHigh: 0, donchianLow: 0,
        volumeRatio: 0,
        price: 0,
        // Regime
        regime: 'WAIT',        // TRENDING, RANGING, AMBIGUOUS, WAIT
        activeStrategy: 'NONE', // MEAN_REVERSION, BREAKOUT, NONE
        signal: 'WAIT',
        candleCount: 0,
        lastSkipReason: 'Collecting data...',
      };
      this.positions[sym] = null;
      this.lastTradeTime[sym] = 0;
    }
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  async start() {
    for (const symbol of this.symbols) {
      await this._preseedCandles(symbol);
    }
    for (const symbol of this.symbols) {
      this._connectKline(symbol);
    }
    console.log(`📈 Scalper v4 REGIME-ADAPTIVE started: ${this.symbols.join(', ').toUpperCase()} @ ${this.interval}`);
    console.log(`   Strategies: Mean Reversion (ADX<${this.adxRangingThreshold}) + Breakout (ADX>${this.adxTrendingThreshold})`);
  }

  // ── Pre-seed from Binance REST ─────────────────────────────────────────
  async _preseedCandles(symbol) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${this.interval}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data)) {
        this.candles[symbol] = data.map(k => ({
          close: parseFloat(k[4]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          volume: parseFloat(k[5]),
          openTime: k[0],
        }));
        this._evaluate(symbol);
        console.log(`📊 ${symbol.toUpperCase()} pre-seeded: ${this.candles[symbol].length} × ${this.interval} candles — regime: ${this.signals[symbol].regime}`);
      }
    } catch (err) {
      console.error(`⚠️ ${symbol.toUpperCase()} pre-seed failed: ${err.message}`);
    }
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────
  _connectKline(symbol) {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_${this.interval}`;
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log(`📈 Connected: ${symbol.toUpperCase()} @ ${this.interval}`);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        const kline = msg.k;
        if (!kline) return;

        const close = parseFloat(kline.c);
        const high = parseFloat(kline.h);
        const low = parseFloat(kline.l);
        const volume = parseFloat(kline.v);
        const isClosed = kline.x;

        // Always update current price for live display
        this.signals[symbol].price = close;

        // Check trailing stop on every tick (not just candle close)
        if (this.positions[symbol]) {
          this._checkLiveExits(symbol, close);
        }

        if (isClosed) {
          this.candles[symbol].push({ close, high, low, volume, openTime: kline.t });
          if (this.candles[symbol].length > 120) {
            this.candles[symbol] = this.candles[symbol].slice(-120);
          }
          this._evaluate(symbol);
        }
      } catch (err) { /* ignore parse errors */ }
    });

    ws.on('error', (err) => {
      console.error(`📈 WS error (${symbol}): ${err.message}`);
    });

    ws.on('close', () => {
      console.log(`📈 Disconnected: ${symbol.toUpperCase()}, reconnecting in 3s...`);
      setTimeout(() => this._connectKline(symbol), 3000);
    });

    this.websockets[symbol] = ws;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INDICATORS
  // ══════════════════════════════════════════════════════════════════════════

  _sma(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  _ema(prices, period) {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  _stdDev(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period;
    return Math.sqrt(variance);
  }

  _bollingerBands(prices, period, numStdDev) {
    const sma = this._sma(prices, period);
    const std = this._stdDev(prices, period);
    if (sma === null || std === null) return null;
    return {
      upper: sma + numStdDev * std,
      middle: sma,
      lower: sma - numStdDev * std,
    };
  }

  _rsi(prices, period) {
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

  _atr(candles, period) {
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

  _avgVolume(candles, period) {
    if (candles.length < period + 1) return null;
    const recent = candles.slice(-period - 1, -1);
    return recent.reduce((a, b) => a + b.volume, 0) / recent.length;
  }

  // ── Donchian Channel (highest high / lowest low over N periods) ─────────
  _donchianChannel(candles, period) {
    if (candles.length < period) return null;
    // Exclude current candle — breakout happens when current candle CLOSES above prior high
    const lookback = candles.slice(-(period + 1), -1);
    return {
      high: Math.max(...lookback.map(c => c.high)),
      low: Math.min(...lookback.map(c => c.low)),
    };
  }

  // ── ADX (Average Directional Index) ─────────────────────────────────────
  // ADX measures trend STRENGTH regardless of direction.
  // +DI > -DI = uptrend, -DI > +DI = downtrend
  _adx(candles, period) {
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

      // True Range
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trs.push(tr);

      // Directional Movement
      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }

    if (trs.length < period) return null;

    // Smoothed values using Wilder's smoothing (RMA)
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
      if (tr === 0) {
        dxValues.push(0);
        continue;
      }
      const plusDI = (smoothPlusDM[i] / tr) * 100;
      const minusDI = (smoothMinusDM[i] / tr) * 100;
      const diSum = plusDI + minusDI;
      const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
      dxValues.push(dx);

      latestPlusDI = plusDI;
      latestMinusDI = minusDI;
    }

    if (dxValues.length < period) return null;

    // ADX = smoothed average of DX
    let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dxValues.length; i++) {
      adx = (adx * (period - 1) + dxValues[i]) / period;
    }

    return {
      adx,
      plusDI: latestPlusDI,
      minusDI: latestMinusDI,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN EVALUATION — runs every closed candle
  // ══════════════════════════════════════════════════════════════════════════

  _evaluate(symbol) {
    const candles = this.candles[symbol];
    const closes = candles.map(c => c.close);
    const candleCount = closes.length;

    // Need minimum data for all indicators
    const minRequired = Math.max(this.adxPeriod * 2 + 2, this.smaPeriod + 5, this.donchianPeriod + 2);
    if (candleCount < minRequired) {
      this.signals[symbol] = {
        ...this.signals[symbol],
        signal: 'WAIT',
        regime: 'WAIT',
        candleCount,
        lastSkipReason: `Collecting data (${candleCount}/${minRequired})`,
      };
      return;
    }

    // ── Calculate all indicators ──
    const bb = this._bollingerBands(closes, this.smaPeriod, this.bbStdDev);
    const rsi = this._rsi(closes, this.rsiPeriod);
    const atr = this._atr(candles, this.atrPeriod);
    const adxData = this._adx(candles, this.adxPeriod);
    const donchian = this._donchianChannel(candles, this.donchianPeriod);
    const avgVol = this._avgVolume(candles, this.volumeAvgPeriod);
    const sma50 = this._sma(closes, this.sma50Period);
    const currentCandle = candles[candles.length - 1];
    const volumeRatio = avgVol ? currentCandle.volume / avgVol : 0;
    const price = closes[closes.length - 1];

    if (!bb || !adxData || !donchian || !atr) {
      this.signals[symbol].lastSkipReason = 'Indicators not ready';
      return;
    }

    // ── Determine regime ──
    let regime = 'AMBIGUOUS';
    if (adxData.adx > this.adxTrendingThreshold) regime = 'TRENDING';
    else if (adxData.adx < this.adxRangingThreshold) regime = 'RANGING';

    const prevRegime = this.signals[symbol].regime;
    if (regime !== prevRegime && prevRegime !== 'WAIT') {
      const coin = symbol.replace('usdt', '').toUpperCase();
      console.log(`🔄 ${coin} regime: ${prevRegime} → ${regime} (ADX: ${adxData.adx.toFixed(1)})`);
      this.emit('regime-change', { symbol, from: prevRegime, to: regime, adx: adxData.adx });
    }

    // ── Update signal state ──
    this.signals[symbol] = {
      sma20: bb.middle,
      bbUpper: bb.upper,
      bbLower: bb.lower,
      rsi,
      atr,
      adx: adxData.adx,
      plusDI: adxData.plusDI,
      minusDI: adxData.minusDI,
      donchianHigh: donchian.high,
      donchianLow: donchian.low,
      volumeRatio,
      price,
      regime,
      activeStrategy: regime === 'RANGING' ? 'MEAN_REVERSION' : regime === 'TRENDING' ? 'BREAKOUT' : 'NONE',
      signal: 'HOLD',
      candleCount,
      lastSkipReason: '',
    };

    // ── Emit live data for dashboard ──
    this.emit('candle-eval', {
      symbol, price, rsi: Math.round(rsi),
      adx: parseFloat(adxData.adx.toFixed(1)),
      plusDI: parseFloat(adxData.plusDI.toFixed(1)),
      minusDI: parseFloat(adxData.minusDI.toFixed(1)),
      regime,
      bbUpper: bb.upper, bbLower: bb.lower, bbMiddle: bb.middle,
      donchianHigh: donchian.high, donchianLow: donchian.low,
      volumeRatio: parseFloat(volumeRatio.toFixed(1)),
      atr, candleCount,
      hasPosition: !!this.positions[symbol],
    });

    // ── Check exits for existing positions ──
    if (this.positions[symbol]) {
      this._checkExits(symbol, price, atr);
      this.signals[symbol].signal = 'IN TRADE';
      return;
    }

    // ── Session filter: UTC 07:00-21:00 ──
    const utcHour = new Date().getUTCHours();
    const inTradingWindow = utcHour >= 7 && utcHour < 21;

    // ── Cooldown check ──
    const cooldownOk = (Date.now() - (this.lastTradeTime[symbol] || 0)) > this.cooldownMs;

    // ── Route to correct strategy (LONG + SHORT) ──
    if (regime === 'RANGING') {
      this._evaluateMeanReversion(symbol, price, bb, rsi, volumeRatio, atr, inTradingWindow, cooldownOk);
    } else if (regime === 'TRENDING') {
      this._evaluateBreakout(symbol, price, donchian, adxData, volumeRatio, atr, inTradingWindow, cooldownOk, sma50);
    } else {
      // AMBIGUOUS — no new entries
      this.signals[symbol].signal = 'HOLD';
      this.signals[symbol].lastSkipReason = `Ambiguous regime (ADX ${adxData.adx.toFixed(1)} between ${this.adxRangingThreshold}-${this.adxTrendingThreshold})`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MEAN REVERSION STRATEGY (ranging markets) — LONG + SHORT
  // ══════════════════════════════════════════════════════════════════════════

  _evaluateMeanReversion(symbol, price, bb, rsi, volumeRatio, atr, inTradingWindow, cooldownOk) {
    const checks = [];
    const volumeOk = volumeRatio >= this.mrVolumeMultiplier;

    // ── LONG: price below lower BB + RSI oversold ──
    const belowLowerBB = price < bb.lower;
    const bbDistLong = (bb.lower - price) / price;
    const bbDistLongOk = bbDistLong >= this.mrMinBBDistance;
    const rsiOversold = rsi < this.mrRsiEntry;

    // ── SHORT: price above upper BB + RSI overbought ──
    const aboveUpperBB = price > bb.upper;
    const bbDistShort = (price - bb.upper) / price;
    const bbDistShortOk = bbDistShort >= this.mrMinBBDistance;
    const rsiOverbought = rsi > this.mrRsiShortEntry;

    // Try LONG first
    if (belowLowerBB && bbDistLongOk && rsiOversold && volumeOk && inTradingWindow && cooldownOk) {
      this.signals[symbol].signal = 'BUY';
      this.signals[symbol].lastSkipReason = '';
      const coin = symbol.replace('usdt', '').toUpperCase();
      console.log(`\n🟢 ${coin} MR LONG | Price: $${price.toFixed(2)} < BB lower $${bb.lower.toFixed(2)} | RSI: ${rsi.toFixed(1)} | Vol: ${volumeRatio.toFixed(1)}x`);
      this.emit('signal', {
        symbol, signal: 'BUY', side: 'LONG', strategy: 'MEAN_REVERSION',
        price, rsi, volumeRatio, atr,
        target: bb.middle, stop: price - atr * this.mrStopAtrMult,
      });
      return;
    }

    // Try SHORT
    if (aboveUpperBB && bbDistShortOk && rsiOverbought && volumeOk && inTradingWindow && cooldownOk) {
      this.signals[symbol].signal = 'SELL_SHORT';
      this.signals[symbol].lastSkipReason = '';
      const coin = symbol.replace('usdt', '').toUpperCase();
      console.log(`\n🔴 ${coin} MR SHORT | Price: $${price.toFixed(2)} > BB upper $${bb.upper.toFixed(2)} | RSI: ${rsi.toFixed(1)} | Vol: ${volumeRatio.toFixed(1)}x`);
      this.emit('signal', {
        symbol, signal: 'SELL_SHORT', side: 'SHORT', strategy: 'MEAN_REVERSION',
        price, rsi, volumeRatio, atr,
        target: bb.middle, stop: price + atr * this.mrStopAtrMult,
      });
      return;
    }

    // Neither triggered — build skip reasons
    if (!belowLowerBB && !aboveUpperBB) checks.push(`Price ${price.toFixed(2)} inside BB (${bb.lower.toFixed(2)}–${bb.upper.toFixed(2)})`);
    else if (belowLowerBB && !bbDistLongOk) checks.push(`BB long distance too small`);
    else if (aboveUpperBB && !bbDistShortOk) checks.push(`BB short distance too small`);
    if (!rsiOversold && !rsiOverbought) checks.push(`RSI ${rsi.toFixed(0)} neutral (${this.mrRsiEntry}–${this.mrRsiShortEntry})`);
    if (!volumeOk) checks.push(`Vol ${volumeRatio.toFixed(1)}x < ${this.mrVolumeMultiplier}x`);
    if (!inTradingWindow) checks.push(`Hour ${new Date().getUTCHours()} outside 07-21`);
    if (!cooldownOk) checks.push('Cooldown active');

    this.signals[symbol].signal = 'HOLD';
    this.signals[symbol].lastSkipReason = checks.join(' · ') || 'Waiting for BB touch';

    // Near-miss logging
    if ((price < bb.lower * 1.002 && price > bb.lower) || (price > bb.upper * 0.998 && price < bb.upper)) {
      this.emit('skip', {
        symbol, reason: `Near BB band — ${checks.join(' · ')}`,
        price, rsi, volumeRatio,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BREAKOUT STRATEGY (trending markets) — LONG + SHORT
  // ══════════════════════════════════════════════════════════════════════════

  _evaluateBreakout(symbol, price, donchian, adxData, volumeRatio, atr, inTradingWindow, cooldownOk, sma50) {
    const checks = [];
    const volumeOk = volumeRatio >= this.boVolumeMultiplier;

    // ── LONG: price above Donchian high + uptrend + above SMA50 ──
    const aboveDonchianHigh = price > donchian.high;
    const uptrendDI = adxData.plusDI > adxData.minusDI;
    const aboveSma50 = sma50 ? price > sma50 : true;

    // ── SHORT: price below Donchian low + downtrend + below SMA50 ──
    const belowDonchianLow = price < donchian.low;
    const downtrendDI = adxData.minusDI > adxData.plusDI;
    const belowSma50 = sma50 ? price < sma50 : true;

    // Try LONG breakout
    if (aboveDonchianHigh && uptrendDI && volumeOk && aboveSma50 && inTradingWindow && cooldownOk) {
      this.signals[symbol].signal = 'BUY';
      this.signals[symbol].lastSkipReason = '';
      const coin = symbol.replace('usdt', '').toUpperCase();
      console.log(`\n🟢 ${coin} BREAKOUT LONG | Price: $${price.toFixed(2)} > Donchian $${donchian.high.toFixed(2)} | ADX: ${adxData.adx.toFixed(1)} | +DI: ${adxData.plusDI.toFixed(1)} > -DI: ${adxData.minusDI.toFixed(1)}`);
      this.emit('signal', {
        symbol, signal: 'BUY', side: 'LONG', strategy: 'BREAKOUT',
        price, adx: adxData.adx, plusDI: adxData.plusDI, minusDI: adxData.minusDI,
        volumeRatio, atr, trailingStop: price - atr * this.boTrailAtrMult,
      });
      return;
    }

    // Try SHORT breakout
    if (belowDonchianLow && downtrendDI && volumeOk && belowSma50 && inTradingWindow && cooldownOk) {
      this.signals[symbol].signal = 'SELL_SHORT';
      this.signals[symbol].lastSkipReason = '';
      const coin = symbol.replace('usdt', '').toUpperCase();
      console.log(`\n🔴 ${coin} BREAKOUT SHORT | Price: $${price.toFixed(2)} < Donchian $${donchian.low.toFixed(2)} | ADX: ${adxData.adx.toFixed(1)} | -DI: ${adxData.minusDI.toFixed(1)} > +DI: ${adxData.plusDI.toFixed(1)}`);
      this.emit('signal', {
        symbol, signal: 'SELL_SHORT', side: 'SHORT', strategy: 'BREAKOUT',
        price, adx: adxData.adx, plusDI: adxData.plusDI, minusDI: adxData.minusDI,
        volumeRatio, atr, trailingStop: price + atr * this.boTrailAtrMult,
      });
      return;
    }

    // Neither triggered
    if (!aboveDonchianHigh && !belowDonchianLow) checks.push(`Price inside Donchian (${donchian.low.toFixed(2)}–${donchian.high.toFixed(2)})`);
    if (aboveDonchianHigh && !uptrendDI) checks.push(`+DI ${adxData.plusDI.toFixed(1)} < -DI (downtrend blocks long)`);
    if (belowDonchianLow && !downtrendDI) checks.push(`-DI ${adxData.minusDI.toFixed(1)} < +DI (uptrend blocks short)`);
    if (!volumeOk) checks.push(`Vol ${volumeRatio.toFixed(1)}x < ${this.boVolumeMultiplier}x`);
    if (aboveDonchianHigh && !aboveSma50) checks.push(`Below SMA50 — blocks long`);
    if (belowDonchianLow && !belowSma50) checks.push(`Above SMA50 — blocks short`);
    if (!inTradingWindow) checks.push(`Hour ${new Date().getUTCHours()} outside 07-21`);
    if (!cooldownOk) checks.push('Cooldown active');

    this.signals[symbol].signal = 'HOLD';
    this.signals[symbol].lastSkipReason = checks.join(' · ') || 'Waiting for Donchian break';

    if (aboveDonchianHigh || belowDonchianLow) {
      const coin = symbol.replace('usdt', '').toUpperCase();
      console.log(`⚪ ${coin} Donchian breakout blocked: ${checks.join(' · ')}`);
      this.emit('skip', { symbol, reason: checks.join(' · '), price, volumeRatio });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXIT LOGIC — checked on every tick and candle close
  // ══════════════════════════════════════════════════════════════════════════

  _checkLiveExits(symbol, currentPrice) {
    const position = this.positions[symbol];
    if (!position) return;
    const isLong = position.side === 'LONG';

    // Update extreme price tracker
    if (isLong && currentPrice > position.highestSinceEntry) {
      position.highestSinceEntry = currentPrice;
      if (position.strategy === 'BREAKOUT') {
        const newTrail = currentPrice - position.currentATR * this.boTrailAtrMult;
        if (newTrail > position.trailingStop) position.trailingStop = newTrail;
      }
    } else if (!isLong && currentPrice < position.lowestSinceEntry) {
      position.lowestSinceEntry = currentPrice;
      if (position.strategy === 'BREAKOUT') {
        const newTrail = currentPrice + position.currentATR * this.boTrailAtrMult;
        if (newTrail < position.trailingStop) position.trailingStop = newTrail;
      }
    }

    // Check exits — direction-aware
    if (position.strategy === 'BREAKOUT') {
      if (isLong && currentPrice <= position.trailingStop) {
        this._emitClose(symbol, 'TRAILING_STOP', currentPrice); return;
      } else if (!isLong && currentPrice >= position.trailingStop) {
        this._emitClose(symbol, 'TRAILING_STOP', currentPrice); return;
      }
      const pnlPct = isLong
        ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
        : ((position.entryPrice - currentPrice) / position.entryPrice) * 100;
      if (pnlPct >= this.boTakeProfitPct) {
        this._emitClose(symbol, 'TAKE_PROFIT', currentPrice); return;
      }
    } else if (position.strategy === 'MEAN_REVERSION') {
      if (isLong && currentPrice <= position.stopPrice) {
        this._emitClose(symbol, 'STOP_LOSS', currentPrice); return;
      } else if (!isLong && currentPrice >= position.stopPrice) {
        this._emitClose(symbol, 'STOP_LOSS', currentPrice); return;
      }
    }
  }

  _checkExits(symbol, currentPrice, atr) {
    const position = this.positions[symbol];
    if (!position) return;
    const isLong = position.side === 'LONG';

    // Update ATR for dynamic trail
    if (atr) position.currentATR = atr;

    if (position.strategy === 'MEAN_REVERSION') {
      // Target: price reaches reversion target
      if (isLong && currentPrice >= position.targetPrice) {
        this._emitClose(symbol, 'TARGET_HIT', currentPrice); return;
      } else if (!isLong && currentPrice <= position.targetPrice) {
        this._emitClose(symbol, 'TARGET_HIT', currentPrice); return;
      }
      // Stop
      if (isLong && currentPrice <= position.stopPrice) {
        this._emitClose(symbol, 'STOP_LOSS', currentPrice); return;
      } else if (!isLong && currentPrice >= position.stopPrice) {
        this._emitClose(symbol, 'STOP_LOSS', currentPrice); return;
      }
      // Time-based exit
      const barsHeld = Math.floor((Date.now() - position.timestamp) / (15 * 60 * 1000));
      if (barsHeld >= this.mrMaxBarsHeld) {
        this._emitClose(symbol, 'TIME_EXIT', currentPrice); return;
      }
    } else if (position.strategy === 'BREAKOUT') {
      const regime = this.signals[symbol].regime;
      if (regime === 'RANGING') {
        const pnlPct = isLong
          ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
          : ((position.entryPrice - currentPrice) / position.entryPrice) * 100;
        if (pnlPct > -0.5) {
          this._emitClose(symbol, 'REGIME_CHANGE', currentPrice); return;
        }
      }
    }
  }

  _emitClose(symbol, reason, exitPrice) {
    const position = this.positions[symbol];
    if (!position) return;
    const isLong = position.side === 'LONG';

    const pnlPct = isLong
      ? ((exitPrice - position.entryPrice) / position.entryPrice) * 100
      : ((position.entryPrice - exitPrice) / position.entryPrice) * 100;
    const coin = symbol.replace('usdt', '').toUpperCase();
    const sideLabel = isLong ? 'LONG' : 'SHORT';
    console.log(`\n🔴 ${coin} CLOSE ${sideLabel} [${position.strategy}]: ${reason} @ $${exitPrice.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`);

    this.emit('close-position', {
      symbol, reason, strategy: position.strategy, side: position.side,
      entryPrice: position.entryPrice, exitPrice, pnlPct, quantity: position.quantity,
    });
    this.positions[symbol] = null;
  }

  // ── Open a Position (LONG or SHORT) ─────────────────────────────────────
  openPosition(symbol, entryPrice, quantity, strategy, side = 'LONG', extras = {}) {
    const atr = this.signals[symbol]?.atr || entryPrice * 0.015;
    const isLong = side === 'LONG';

    let stopPrice, targetPrice, trailingStop;

    if (strategy === 'MEAN_REVERSION') {
      const sma20 = this.signals[symbol]?.sma20 || entryPrice * (isLong ? 1.01 : 0.99);
      if (isLong) {
        stopPrice = entryPrice - atr * this.mrStopAtrMult;
        targetPrice = entryPrice + (sma20 - entryPrice) * this.mrTargetReversion;
      } else {
        stopPrice = entryPrice + atr * this.mrStopAtrMult;
        targetPrice = entryPrice - (entryPrice - sma20) * this.mrTargetReversion;
      }
      trailingStop = null;
    } else {
      // BREAKOUT
      stopPrice = null;
      if (isLong) {
        targetPrice = entryPrice * (1 + this.boTakeProfitPct / 100);
        trailingStop = entryPrice - atr * this.boTrailAtrMult;
      } else {
        targetPrice = entryPrice * (1 - this.boTakeProfitPct / 100);
        trailingStop = entryPrice + atr * this.boTrailAtrMult;
      }
    }

    this.positions[symbol] = {
      side,
      strategy,
      entryPrice,
      quantity,
      timestamp: Date.now(),
      stopPrice,
      targetPrice,
      trailingStop,
      highestSinceEntry: entryPrice,
      lowestSinceEntry: entryPrice,
      currentATR: atr,
    };

    this.lastTradeTime[symbol] = Date.now();
    const coin = symbol.replace('usdt', '').toUpperCase();
    const arrow = isLong ? '📈' : '📉';

    if (strategy === 'MEAN_REVERSION') {
      console.log(`${arrow} [MR ${side}] ${coin} @ $${entryPrice.toFixed(2)} | Stop: $${stopPrice.toFixed(2)} | Target: $${targetPrice.toFixed(2)}`);
    } else {
      console.log(`${arrow} [BO ${side}] ${coin} @ $${entryPrice.toFixed(2)} | Trail: $${trailingStop.toFixed(2)} | TP: $${targetPrice.toFixed(2)}`);
    }
  }

  closePosition(symbol) {
    this.positions[symbol] = null;
  }

  // ── Position Sizing ─────────────────────────────────────────────────────
  getPositionSize(symbol, portfolioBalance) {
    const strategy = this.signals[symbol]?.activeStrategy;
    const atr = this.signals[symbol]?.atr;
    const price = this.signals[symbol]?.price || 1;

    let maxPct;
    if (strategy === 'MEAN_REVERSION') {
      maxPct = this.mrMaxPositionPct;
    } else {
      maxPct = this.boMaxPositionPct;
    }

    if (!atr || atr === 0) return portfolioBalance * maxPct;

    // Risk-based sizing: risk 1% of portfolio, size based on stop distance
    const riskAmount = portfolioBalance * 0.01;
    const stopDistance = strategy === 'MEAN_REVERSION'
      ? atr * this.mrStopAtrMult
      : atr * this.boTrailAtrMult;

    const shares = riskAmount / stopDistance;
    const positionValue = shares * price;

    // Check total exposure
    let currentExposure = 0;
    for (const sym of this.symbols) {
      if (this.positions[sym]) {
        currentExposure += this.positions[sym].quantity * (this.signals[sym]?.price || 0);
      }
    }
    const remainingBudget = portfolioBalance * this.maxTotalExposurePct - currentExposure;
    if (remainingBudget <= 0) return 0;

    return Math.min(positionValue, portfolioBalance * maxPct, remainingBudget);
  }

  getActiveStrategy(symbol) {
    return this.signals[symbol]?.activeStrategy || 'NONE';
  }

  // ── Getters ─────────────────────────────────────────────────────────────
  getSignals() { return { ...this.signals }; }
  getPosition(symbol) { return this.positions[symbol]; }
  hasOpenPosition(symbol) { return this.positions[symbol] !== null; }
  isOnCooldown(symbol) { return (Date.now() - (this.lastTradeTime[symbol] || 0)) < this.cooldownMs; }

  shutdown() {
    for (const symbol of this.symbols) {
      if (this.websockets[symbol]) this.websockets[symbol].close();
    }
    console.log('📈 Scalper v4 shut down.');
  }
}
