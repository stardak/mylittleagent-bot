// ══════════════════════════════════════════════════════════════════════════════
// TRADING ENGINE v7 — KRONOS AI DIRECT SIGNAL MODE
// ══════════════════════════════════════════════════════════════════════════════
//
// Signal source: Kronos financial foundation model (AAAI 2026)
//   Pre-trained on K-line data from 45 global exchanges
//   Sends last 96 OHLCV candles → receives UP|DOWN + confidence
//
// Entry: fires when Kronos confidence ≥ 52%
// Stop:  1.5× ATR below/above entry
// Target: Kronos forecast close at horizon candle 5 (75 min)
// Breakeven stop: moves to entry once 0.5× ATR in profit
//
// Position sizing: 10% of current portfolio (compounding)
// Max concurrent: 3 positions | Cooldown: 5 min | 24/7
// Hard floor: pause at $95 (5% drawdown from $100 start)
//
// ══════════════════════════════════════════════════════════════════════════════

import WebSocket from 'ws';
import { EventEmitter } from 'events';

// ── Kronos config ─────────────────────────────────────────────────────────────
const KRONOS_URL  = process.env.KRONOS_URL  || 'http://localhost:5001';
const KRONOS_CONF = parseFloat(process.env.KRONOS_MIN_CONFIDENCE || '0.52');

export class Scalper extends EventEmitter {
  constructor(options = {}) {
    super();

    this.symbols = options.symbols || ['ethusdt'];
    this.interval = options.interval || '15m';

    // ── ATR for stop sizing ──
    this.atrPeriod = 14;
    this.stopAtrMult = 1.5;          // Stop = 1.5× ATR from entry
    this.breakevenAtrMult = 0.5;     // Move stop to entry once 0.5× ATR in profit
    this.maxBarsHeld = 20;           // Force exit after 20 × 15m bars (~5h)

    // ── Aggressive mode params ──
    this.betPct = 0.10;              // 10% compounding position sizing
    this.maxConcurrentPositions = 3; // All 3 coins can trade simultaneously
    this.hardFloor = 95;             // Pause if portfolio drops below $95
    this.cooldownMs = 5 * 60 * 1000; // 5 minutes between trades per coin

    // ── Per-symbol state ──
    this.candles = {};
    this.signals = {};
    this.positions = {};
    this.lastTradeTime = {};
    this.websockets = {};

    for (const sym of this.symbols) {
      this.candles[sym] = [];
      this.signals[sym] = {
        price: 0, atr: 0,
        regime: 'WAIT',
        activeStrategy: 'NONE',
        signal: 'WAIT',
        candleCount: 0,
        lastSkipReason: 'Collecting data...',
        kronosDirection: null,
        kronosConfidence: null,
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
    console.log(`🔮 Scalper v7 started: ${this.symbols.join(', ').toUpperCase()} @ ${this.interval} | KRONOS DIRECT MODE`);
    console.log(`   Confidence: ${(KRONOS_CONF * 100).toFixed(0)}% | Bet: ${(this.betPct * 100).toFixed(0)}% | 24/7 | Max ${this.maxConcurrentPositions} pos | ${this.cooldownMs / 60000}m cooldown`);

    // Check Kronos at startup (non-blocking)
    this._checkKronosHealth();
  }

  async _checkKronosHealth() {
    try {
      const res = await fetch(`${KRONOS_URL}/health`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      if (data.ready) {
        console.log(`🔮 Kronos-${data.model?.split('-').pop() || 'small'} connected — DIRECT SIGNAL MODE (confidence ≥ ${(KRONOS_CONF * 100).toFixed(0)}%)`);
      } else {
        console.log(`⏳ Kronos service is loading — will activate once model is ready.`);
      }
    } catch {
      console.log(`⚠️  Kronos service not reachable at ${KRONOS_URL} — bot will HOLD until Kronos comes online.`);
    }
  }

  // ── Kronos Directional Forecast ───────────────────────────────────────────
  // Returns { direction: 'UP'|'DOWN', confidence: 0.82 } or null (fail-open).
  // Packages the last 96 OHLCV candles (24h of 15m data) as input.
  async _getKronosForecast(symbol) {
    const candles = this.candles[symbol];
    if (!candles || candles.length < 30) return null;

    try {
      const payload = {
        candles: candles.slice(-96).map(c => ({
          open:     c.open  ?? c.close,   // pre-seeded candles may lack open/high/low
          high:     c.high  ?? c.close,
          low:      c.low   ?? c.close,
          close:    c.close,
          volume:   c.volume ?? 0,
          openTime: c.openTime ?? null,
        })),
        horizon: 5,
        interval_minutes: 15,
      };

      const res = await fetch(`${KRONOS_URL}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),   // 8s max — must not block a candle eval
      });

      if (!res.ok) return null;
      const data = await res.json();
      // Include forecast candles so we can derive a target price
      return {
        direction: data.direction,
        confidence: data.confidence,
        model: data.model,
        forecast: data.forecast || [],   // array of { open, high, low, close, volume }
      };
    } catch {
      return null;
    }
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

    ws.on('message', async (data) => {
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
          await this._evaluate(symbol);
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

  // ── MACD (Moving Average Convergence Divergence) ────────────────────────
  // Returns the histogram value: positive = bullish momentum, negative = bearish
  _macd(prices, fastPeriod, slowPeriod, signalPeriod) {
    if (prices.length < slowPeriod + signalPeriod) return null;
    const emaFast = this._ema(prices, fastPeriod);
    const emaSlow = this._ema(prices, slowPeriod);
    if (emaFast === null || emaSlow === null) return null;

    // Build full MACD line series to compute signal line
    const macdLine = [];
    const kFast = 2 / (fastPeriod + 1);
    const kSlow = 2 / (slowPeriod + 1);
    let runFast = prices.slice(0, fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
    let runSlow = prices.slice(0, slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;
    for (let i = slowPeriod; i < prices.length; i++) {
      runFast = prices[i] * kFast + runFast * (1 - kFast);
      runSlow = prices[i] * kSlow + runSlow * (1 - kSlow);
      macdLine.push(runFast - runSlow);
    }
    if (macdLine.length < signalPeriod) return null;

    // Signal line = EMA of MACD line
    const kSig = 2 / (signalPeriod + 1);
    let signal = macdLine.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
    for (let i = signalPeriod; i < macdLine.length; i++) {
      signal = macdLine[i] * kSig + signal * (1 - kSig);
    }

    const latestMacd = macdLine[macdLine.length - 1];
    const prevMacd = macdLine.length >= 2 ? macdLine[macdLine.length - 2] : latestMacd;
    const histogram = latestMacd - signal;
    const prevHistogram = prevMacd - signal; // approximate

    return {
      macd: latestMacd,
      signal,
      histogram,
      rising: histogram > prevHistogram,  // momentum improving
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
  // MAIN EVALUATION — Kronos direct signal mode
  // Every closed 15m candle → ask Kronos → trade if confidence ≥ 52%
  // ══════════════════════════════════════════════════════════════════════════

  async _evaluate(symbol) {
    const candles = this.candles[symbol];
    const closes = candles.map(c => c.close);
    const candleCount = closes.length;
    const price = closes[closes.length - 1];

    // Need enough candles for ATR + Kronos input
    const minRequired = this.atrPeriod + 5;
    if (candleCount < minRequired) {
      this.signals[symbol] = {
        ...this.signals[symbol],
        signal: 'WAIT', regime: 'WAIT', price, candleCount,
        lastSkipReason: `Collecting data (${candleCount}/${minRequired})`,
      };
      return;
    }

    const atr = this._atr(candles, this.atrPeriod);
    if (!atr) { this.signals[symbol].lastSkipReason = 'ATR not ready'; return; }

    // Update signal state for dashboard
    this.signals[symbol] = {
      ...this.signals[symbol],
      price, atr, candleCount,
      regime: 'KRONOS',
      activeStrategy: 'KRONOS',
      signal: 'HOLD',
    };

    // Emit candle-eval for dashboard ticker
    this.emit('candle-eval', {
      symbol, price, atr, candleCount,
      regime: 'KRONOS',
      hasPosition: !!this.positions[symbol],
      // Legacy fields dashboard may reference — send neutrals
      rsi: 50, adx: 0, plusDI: 0, minusDI: 0,
      bbUpper: 0, bbLower: 0, bbMiddle: price,
      donchianHigh: 0, donchianLow: 0, volumeRatio: 1,
    });

    // ── Check exits for existing positions ──
    if (this.positions[symbol]) {
      this._checkExits(symbol, price, atr);
      this.signals[symbol].signal = 'IN TRADE';
      return;
    }

    // ── Cooldown: 5 min between trades per coin ──
    const cooldownOk = (Date.now() - (this.lastTradeTime[symbol] || 0)) > this.cooldownMs;
    if (!cooldownOk) {
      const remaining = Math.ceil((this.cooldownMs - (Date.now() - this.lastTradeTime[symbol])) / 1000);
      this.signals[symbol].lastSkipReason = `Cooldown (${remaining}s left)`;
      return;
    }

    // ── Max concurrent positions: 3 ──
    const openCount = this.symbols.filter(s => this.positions[s] !== null).length;
    if (openCount >= this.maxConcurrentPositions) {
      this.signals[symbol].lastSkipReason = `Max ${this.maxConcurrentPositions} positions open`;
      return;
    }

    // ── Ask Kronos ──
    const coin = symbol.replace('usdt', '').toUpperCase();
    const forecast = await this._getKronosForecast(symbol);

    if (!forecast) {
      this.signals[symbol].lastSkipReason = 'Kronos offline — holding';
      console.log(`⏳ ${coin} | Kronos offline — no signal`);
      this.emit('filter-audit', {
        symbol, coin, price, regime: 'KRONOS', signal: 'HOLD',
        passed: [], failed: ['Kronos offline'],
        auditLine: `${coin} | Kronos offline — holding`,
        failedStr: 'Kronos service not reachable',
        adx: 0, rsi: 50, volumeRatio: 1,
      });
      return;
    }

    const confPct = (forecast.confidence * 100).toFixed(1);

    // Store Kronos reading on signals for dashboard
    this.signals[symbol].kronosDirection  = forecast.direction;
    this.signals[symbol].kronosConfidence = forecast.confidence;

    // Derive target from Kronos forecast closes (horizon = 5 candles)
    const forecastCloses = (forecast.forecast || []).map(f => f.close).filter(Boolean);
    const hasTarget = forecastCloses.length > 0;

    if (forecast.confidence < KRONOS_CONF) {
      const reason = `Kronos: ${forecast.direction} ${confPct}% < ${(KRONOS_CONF * 100).toFixed(0)}% threshold`;
      this.signals[symbol].lastSkipReason = reason;
      console.log(`⚪ ${coin} | ${reason}`);
      this.emit('filter-audit', {
        symbol, coin, price, regime: 'KRONOS', signal: 'HOLD',
        passed: [`Kronos responded: ${forecast.direction}`],
        failed: [`Confidence ${confPct}% below ${(KRONOS_CONF * 100).toFixed(0)}%`],
        auditLine: `${coin} | Kronos: ${forecast.direction} ${confPct}% | Below threshold`,
        failedStr: reason,
        adx: 0, rsi: 50, volumeRatio: 1,
      });
      return;
    }

    // ── FIRE TRADE ──
    if (forecast.direction === 'UP') {
      const stop   = price - atr * this.stopAtrMult;
      const target = hasTarget ? Math.max(...forecastCloses) : price * 1.02;
      this.signals[symbol].signal = 'BUY';
      this.signals[symbol].lastSkipReason = '';
      console.log(`\n🟢 ${coin} KRONOS LONG | ${confPct}% | $${price.toFixed(2)} → target $${target.toFixed(2)} | stop $${stop.toFixed(2)}`);
      this.emit('filter-audit', {
        symbol, coin, price, regime: 'KRONOS', signal: 'BUY',
        passed: [`Kronos: UP ${confPct}%`], failed: [],
        auditLine: `${coin} | Kronos UP ${confPct}% | LONG signal`,
        failedStr: '',
        adx: 0, rsi: 50, volumeRatio: 1,
      });
      this.emit('signal', {
        symbol, signal: 'BUY', side: 'LONG', strategy: 'KRONOS',
        price, atr, target, stop, kronos: forecast,
      });
    } else {
      const stop   = price + atr * this.stopAtrMult;
      const target = hasTarget ? Math.min(...forecastCloses) : price * 0.98;
      this.signals[symbol].signal = 'SELL_SHORT';
      this.signals[symbol].lastSkipReason = '';
      console.log(`\n🔴 ${coin} KRONOS SHORT | ${confPct}% | $${price.toFixed(2)} → target $${target.toFixed(2)} | stop $${stop.toFixed(2)}`);
      this.emit('filter-audit', {
        symbol, coin, price, regime: 'KRONOS', signal: 'SELL_SHORT',
        passed: [`Kronos: DOWN ${confPct}%`], failed: [],
        auditLine: `${coin} | Kronos DOWN ${confPct}% | SHORT signal`,
        failedStr: '',
        adx: 0, rsi: 50, volumeRatio: 1,
      });
      this.emit('signal', {
        symbol, signal: 'SELL_SHORT', side: 'SHORT', strategy: 'KRONOS',
        price, atr, target, stop, kronos: forecast,
      });
    }
  }

  // ── (Mean Reversion and Breakout strategies removed in v7 — Kronos direct mode) ──

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

    // ── Breakeven stop (v5): once profitable by 0.5× ATR, move stop to entry ──
    // Breakeven stop: once 0.5× ATR in profit, move stop to entry
    if ((position.strategy === 'MEAN_REVERSION' || position.strategy === 'KRONOS') && !position.breakevenStop) {
      const breakevenThreshold = position.currentATR * this.breakevenAtrMult;
      const inProfit = isLong
        ? (currentPrice - position.entryPrice) >= breakevenThreshold
        : (position.entryPrice - currentPrice) >= breakevenThreshold;
      if (inProfit) {
        position.stopPrice = position.entryPrice; // Move stop to entry = zero risk
        position.breakevenStop = true;
        position.dynamicStop = position.entryPrice;
        const coin = symbol.replace('usdt', '').toUpperCase();
        console.log(`🛡️ ${coin} breakeven stop activated — stop moved to entry $${position.entryPrice.toFixed(2)}`);
        this.emit('breakeven', { symbol, entryPrice: position.entryPrice });
      }
    }

    // Live stop check (KRONOS + MR legacy)
    if (position.stopPrice) {
      if (isLong && currentPrice <= position.stopPrice) {
        this._emitClose(symbol, position.breakevenStop ? 'BREAKEVEN_EXIT' : 'STOP_LOSS', currentPrice); return;
      } else if (!isLong && currentPrice >= position.stopPrice) {
        this._emitClose(symbol, position.breakevenStop ? 'BREAKEVEN_EXIT' : 'STOP_LOSS', currentPrice); return;
      }
    }
  }

  _checkExits(symbol, currentPrice, atr) {
    const position = this.positions[symbol];
    if (!position) return;
    const isLong = position.side === 'LONG';

    // Update ATR for dynamic trail
    if (atr) position.currentATR = atr;

    // KRONOS: target hit
    if (position.targetPrice) {
      if (isLong && currentPrice >= position.targetPrice) {
        this._emitClose(symbol, 'TARGET_HIT', currentPrice); return;
      } else if (!isLong && currentPrice <= position.targetPrice) {
        this._emitClose(symbol, 'TARGET_HIT', currentPrice); return;
      }
    }
    // KRONOS: stop loss
    if (position.stopPrice) {
      if (isLong && currentPrice <= position.stopPrice) {
        this._emitClose(symbol, 'STOP_LOSS', currentPrice); return;
      } else if (!isLong && currentPrice >= position.stopPrice) {
        this._emitClose(symbol, 'STOP_LOSS', currentPrice); return;
      }
    }
    // Time-based exit: max 20 bars (5h)
    const barsHeld = Math.floor((Date.now() - position.timestamp) / (15 * 60 * 1000));
    if (barsHeld >= this.maxBarsHeld) {
      this._emitClose(symbol, 'TIME_EXIT', currentPrice); return;
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

    // KRONOS: stop from ATR, target from forecast (passed via extras)
    const stopPrice   = isLong
      ? entryPrice - atr * this.stopAtrMult
      : entryPrice + atr * this.stopAtrMult;
    const targetPrice = extras.target ||
      (isLong ? entryPrice * 1.02 : entryPrice * 0.98);

    this.positions[symbol] = {
      side, strategy, entryPrice, quantity,
      timestamp: Date.now(),
      stopPrice,
      dynamicStop: stopPrice,
      targetPrice,
      trailingStop: null,
      highestSinceEntry: entryPrice,
      lowestSinceEntry: entryPrice,
      currentATR: atr,
      breakevenStop: false,
    };

    this.lastTradeTime[symbol] = Date.now();
    const coin = symbol.replace('usdt', '').toUpperCase();
    const arrow = isLong ? '📈' : '📉';
    console.log(`${arrow} [KRONOS ${side}] ${coin} @ $${entryPrice.toFixed(2)} | Stop: $${stopPrice.toFixed(2)} | Target: $${targetPrice.toFixed(2)}`);
  }

  closePosition(symbol) {
    this.positions[symbol] = null;
  }

  // ── Position Sizing (v6: 3% compounding) ─────────────────────────────────
  getPositionSize(symbol, portfolioBalance) {
    // Hard floor check: if below $95, return 0 to block trades
    if (portfolioBalance < this.hardFloor) {
      console.log(`🚨 HARD FLOOR: Portfolio $${portfolioBalance.toFixed(2)} < $${this.hardFloor}. Trading paused.`);
      this.emit('hard-floor', { balance: portfolioBalance, floor: this.hardFloor });
      return 0;
    }

    // Simple: 3% of current portfolio value
    return portfolioBalance * this.betPct;
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
    console.log('🔮 Scalper v7 (Kronos direct) shut down.');
  }
}
