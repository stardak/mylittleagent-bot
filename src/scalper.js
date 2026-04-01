// ══════════════════════════════════════════════════════════════════════════════
// BINANCE MOMENTUM SCALPER v3
// ══════════════════════════════════════════════════════════════════════════════
// Swing-scalping on 5-minute klines with multi-timeframe confirmation:
//
//   BUY requires ALL of:
//     1. EMA9 crosses above EMA21
//     2. RSI(14) between 30-70
//     3. Volume >= 1.0x 20-period average
//     4. UTC hour between 08:00 and 21:00
//     5. No open position on this coin
//     6. Last trade > 30 min ago
//     7. 15m MTF not in strong downtrend
//     8. 1h trend is up (price above 1h EMA21)
//
//   SELL on ANY of:
//     1. EMA9 crosses below EMA21
//     2. Price reaches +1.5% (take profit)
//     3. Price falls below entry - ATR(14)*1.0 (dynamic stop)
//
//   Position sizing: risk 1% of portfolio, size = (portfolio*0.01) / ATR
//   Max position: 15% of portfolio
// ══════════════════════════════════════════════════════════════════════════════

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class Scalper extends EventEmitter {
  constructor(options = {}) {
    super();

    this.symbols = options.symbols || ['ethusdt'];
    this.interval = options.interval || '5m';

    // Strategy parameters
    this.fastPeriod = 9;
    this.slowPeriod = 21;
    this.rsiPeriod = 14;
    this.macdFast = 12;
    this.macdSlow = 26;
    this.macdSignal = 9;
    this.atrPeriod = 14;
    this.volumeAvgPeriod = 20;
    this.volumeMultiplier = 1.0;
    this.takeProfitPct = 1.5;
    this.cooldownMs = 30 * 60 * 1000;  // 30 minutes between trades per coin

    // State per symbol
    this.candles = {};       // { symbol: [{ close, high, low, volume }] }
    this.candles5m = {};     // { symbol: [{ close, high, low, volume }] } — 15m for MTF
    this.candles1h = {};     // { symbol: [{ close, high, low, volume }] } — 1h for trend
    this.signals = {};       // { symbol: { emaFast, emaSlow, rsi, macdHist, signal, ... } }
    this.positions = {};     // { symbol: { side, entryPrice, quantity, timestamp } }
    this.lastTradeTime = {}; // { symbol: timestamp }
    this.websockets = {};

    for (const sym of this.symbols) {
      this.candles[sym] = [];
      this.candles5m[sym] = [];
      this.candles1h[sym] = [];
      this.signals[sym] = {
        emaFast: 0, emaSlow: 0, rsi: 50, macdHist: 0,
        volumeRatio: 0, atr: 0, signal: 'WAIT', price: 0,
        candleCount: 0, lastSkipReason: 'Collecting data...',
        mtfBlocked: false,
        hourlyTrendUp: true,
      };
      this.positions[sym] = null;
      this.lastTradeTime[sym] = 0;
    }
  }

  // ── Connect to Binance kline WebSocket ──────────────────────────────────
  async start() {
    // Pre-seed candles from Binance REST API so indicators are ready instantly
    for (const symbol of this.symbols) {
      await this._preseedCandles(symbol);
    }

    for (const symbol of this.symbols) {
      this._connectKline(symbol);
      this._connectKline5m(symbol);
      this._connectKline1h(symbol);
    }
    console.log(`📈 Scalper v3 started: ${this.symbols.join(', ').toUpperCase()} @ ${this.interval} + 15m MTF + 1h trend`);
  }

  // ── Pre-seed historical candles from REST API ───────────────────────────
  async _preseedCandles(symbol) {
    try {
      // Fetch 50 x 5m candles (primary timeframe)
      const url5m = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=5m&limit=50`;
      const res5m = await fetch(url5m);
      const data5m = await res5m.json();

      if (Array.isArray(data5m)) {
        this.candles[symbol] = data5m.map(k => ({
          close: parseFloat(k[4]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          volume: parseFloat(k[5]),
        }));
        // Run initial evaluation
        this._evaluate(symbol);
        console.log(`📊 ${symbol.toUpperCase()} pre-seeded: ${this.candles[symbol].length} x 5m candles — indicators ready`);
      }

      // Fetch 30 x 15m candles for MTF
      const url15m = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=15m&limit=30`;
      const res15m = await fetch(url15m);
      const data15m = await res15m.json();

      if (Array.isArray(data15m)) {
        this.candles5m[symbol] = data15m.map(k => ({
          close: parseFloat(k[4]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          volume: parseFloat(k[5]),
        }));

        // Compute initial 15m trend
        const closes15m = this.candles5m[symbol].map(c => c.close);
        if (closes15m.length >= this.slowPeriod + 3) {
          const ema9_15m = this._ema(closes15m, this.fastPeriod);
          const ema21_15m = this._ema(closes15m, this.slowPeriod);
          const ema21_3ago = this._ema(closes15m.slice(0, -3), this.slowPeriod);
          const price15m = closes15m[closes15m.length - 1];

          const isBelow9 = price15m < ema9_15m;
          const isBelow21 = price15m < ema21_15m;
          const ema21Falling = ema21_15m < ema21_3ago;
          this.signals[symbol].mtfBlocked = isBelow9 && isBelow21 && ema21Falling;
        }
        console.log(`📊 ${symbol.toUpperCase()} pre-seeded: ${this.candles5m[symbol].length} x 15m candles — MTF ready`);
      }

      // Fetch 30 x 1h candles for trend filter
      const url1h = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1h&limit=30`;
      const res1h = await fetch(url1h);
      const data1h = await res1h.json();

      if (Array.isArray(data1h)) {
        this.candles1h[symbol] = data1h.map(k => ({
          close: parseFloat(k[4]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          volume: parseFloat(k[5]),
        }));

        // Compute initial 1h trend
        const closes1h = this.candles1h[symbol].map(c => c.close);
        if (closes1h.length >= this.slowPeriod) {
          const ema21_1h = this._ema(closes1h, this.slowPeriod);
          const price1h = closes1h[closes1h.length - 1];
          this.signals[symbol].hourlyTrendUp = price1h > ema21_1h;
        }
        console.log(`📊 ${symbol.toUpperCase()} pre-seeded: ${this.candles1h[symbol].length} x 1h candles — trend filter ready`);
      }
    } catch (err) {
      console.error(`⚠️ ${symbol.toUpperCase()} pre-seed failed: ${err.message} — falling back to live warmup`);
    }
  }

  _connectKline(symbol) {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_${this.interval}`;
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log(`📈 Scalper connected: ${symbol.toUpperCase()} klines`);
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

        // Always update current price
        this.signals[symbol].price = close;

        if (isClosed) {
          this.candles[symbol].push({ close, high, low, volume });

          // Keep buffer of data
          const maxCandles = 60;
          if (this.candles[symbol].length > maxCandles) {
            this.candles[symbol] = this.candles[symbol].slice(-maxCandles);
          }

          this._evaluate(symbol);
        }
      } catch (err) {
        // Ignore parse errors
      }
    });

    ws.on('error', (err) => {
      console.error(`📈 Scalper WebSocket error (${symbol}): ${err.message}`);
    });

    ws.on('close', () => {
      console.log(`📈 Scalper disconnected: ${symbol.toUpperCase()}, reconnecting in 3s...`);
      setTimeout(() => this._connectKline(symbol), 3000);
    });

    this.websockets[symbol] = ws;
  }

  // ── 15-minute Multi-Timeframe Feed ───────────────────────────────────────
  _connectKline5m(symbol) {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_15m`;
    const ws = new WebSocket(url);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        const kline = msg.k;
        if (!kline || !kline.x) return; // Only process closed 15m candles

        const close = parseFloat(kline.c);
        const high = parseFloat(kline.h);
        const low = parseFloat(kline.l);
        const volume = parseFloat(kline.v);

        this.candles5m[symbol].push({ close, high, low, volume });
        if (this.candles5m[symbol].length > 30) {
          this.candles5m[symbol] = this.candles5m[symbol].slice(-30);
        }

        // Update 15m trend data (loose filter)
        const closes15m = this.candles5m[symbol].map(c => c.close);
        if (closes15m.length >= this.slowPeriod + 3) {
          const ema9_15m = this._ema(closes15m, this.fastPeriod);
          const ema21_15m = this._ema(closes15m, this.slowPeriod);
          const ema21_3ago = this._ema(closes15m.slice(0, -3), this.slowPeriod);
          const price15m = closes15m[closes15m.length - 1];

          // Only block if ALL THREE downtrend conditions are true
          const strongDowntrend = (ema9_15m < ema21_15m) && (ema21_15m < ema21_3ago) && (price15m < ema9_15m);
          this.signals[symbol].mtfBlocked = strongDowntrend;
        }
      } catch (err) { /* ignore */ }
    });

    ws.on('error', () => {});
    ws.on('close', () => {
      setTimeout(() => this._connectKline5m(symbol), 3000);
    });
  }

  // ── 1-hour Trend Filter Feed ────────────────────────────────────────────
  _connectKline1h(symbol) {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_1h`;
    const ws = new WebSocket(url);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        const kline = msg.k;
        if (!kline || !kline.x) return; // Only process closed 1h candles

        const close = parseFloat(kline.c);
        const high = parseFloat(kline.h);
        const low = parseFloat(kline.l);
        const volume = parseFloat(kline.v);

        this.candles1h[symbol].push({ close, high, low, volume });
        if (this.candles1h[symbol].length > 30) {
          this.candles1h[symbol] = this.candles1h[symbol].slice(-30);
        }

        // Update 1h trend: price above EMA21 = uptrend
        const closes1h = this.candles1h[symbol].map(c => c.close);
        if (closes1h.length >= this.slowPeriod) {
          const ema21_1h = this._ema(closes1h, this.slowPeriod);
          const price1h = closes1h[closes1h.length - 1];
          this.signals[symbol].hourlyTrendUp = price1h > ema21_1h;
        }
      } catch (err) { /* ignore */ }
    });

    ws.on('error', () => {});
    ws.on('close', () => {
      setTimeout(() => this._connectKline1h(symbol), 3000);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INDICATORS
  // ══════════════════════════════════════════════════════════════════════════

  _ema(prices, period) {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
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

  _macdHistogram(prices) {
    // Returns array of MACD histogram values
    if (prices.length < this.macdSlow + this.macdSignal) return [];

    const histograms = [];
    for (let i = this.macdSlow + this.macdSignal; i <= prices.length; i++) {
      const slice = prices.slice(0, i);
      const emaFast = this._ema(slice, this.macdFast);
      const emaSlow = this._ema(slice, this.macdSlow);
      const macdLine = emaFast - emaSlow;
      histograms.push(macdLine);
    }

    // Now compute signal line (EMA of MACD line)
    if (histograms.length < this.macdSignal) return [];

    const result = [];
    const k = 2 / (this.macdSignal + 1);
    let signal = histograms.slice(0, this.macdSignal).reduce((a, b) => a + b, 0) / this.macdSignal;

    for (let i = this.macdSignal; i < histograms.length; i++) {
      signal = histograms[i] * k + signal * (1 - k);
      result.push(histograms[i] - signal);
    }
    return result;
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
    if (candles.length < period) return null;
    const recent = candles.slice(-period - 1, -1); // Exclude current candle
    return recent.reduce((a, b) => a + b.volume, 0) / recent.length;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN EVALUATION — runs every closed candle
  // ══════════════════════════════════════════════════════════════════════════

  _evaluate(symbol) {
    const candles = this.candles[symbol];
    const closes = candles.map(c => c.close);
    const candleCount = closes.length;

    // Need minimum data
    if (candleCount < this.macdSlow + this.macdSignal + 3) {
      this.signals[symbol] = {
        ...this.signals[symbol],
        signal: 'WAIT',
        candleCount,
        lastSkipReason: `Collecting data (${candleCount}/${this.macdSlow + this.macdSignal + 3})`,
      };
      return;
    }

    // Calculate all indicators
    const emaFast = this._ema(closes, this.fastPeriod);
    const emaSlow = this._ema(closes, this.slowPeriod);
    const prevEmaFast = this._ema(closes.slice(0, -1), this.fastPeriod);
    const prevEmaSlow = this._ema(closes.slice(0, -1), this.slowPeriod);

    const rsi = this._rsi(closes, this.rsiPeriod);
    const rsi2ago = this._rsi(closes.slice(0, -2), this.rsiPeriod);
    const rsiRising = rsi > rsi2ago;

    const macdHists = this._macdHistogram(closes);
    const currentMacdHist = macdHists.length > 0 ? macdHists[macdHists.length - 1] : 0;

    // Check if MACD crossed zero (neg→pos) within last 3 candles
    let macdCrossedZero = false;
    if (macdHists.length >= 4) {
      for (let i = macdHists.length - 3; i < macdHists.length; i++) {
        if (macdHists[i] > 0 && macdHists[i - 1] <= 0) {
          macdCrossedZero = true;
          break;
        }
      }
    }

    const currentCandle = candles[candles.length - 1];
    const avgVol = this._avgVolume(candles, this.volumeAvgPeriod);
    const volumeRatio = avgVol ? currentCandle.volume / avgVol : 0;

    const atr = this._atr(candles, this.atrPeriod);

    const utcHour = new Date().getUTCHours();
    const inTradingWindow = (utcHour >= 8 && utcHour < 21);

    // Update signal state
    this.signals[symbol] = {
      emaFast, emaSlow, rsi, rsiRising,
      macdHist: currentMacdHist, macdCrossedZero,
      volumeRatio, atr,
      price: closes[closes.length - 1],
      candleCount,
      signal: 'HOLD',
      lastSkipReason: '',
    };

    // Emit candle evaluation for live ticker
    this.emit('candle-eval', {
      symbol,
      price: closes[closes.length - 1],
      emaFast, emaSlow,
      rsi: Math.round(rsi),
      macdHist: currentMacdHist,
      volumeRatio: parseFloat(volumeRatio.toFixed(1)),
      atr,
      candleCount,
      hasPosition: !!this.positions[symbol],
    });

    // ── Check existing position for exits ──────────────────────
    if (this.positions[symbol]) {
      this._checkExits(symbol, closes[closes.length - 1], emaFast, emaSlow, prevEmaFast, prevEmaSlow, rsi, atr);
      this.signals[symbol].signal = 'IN TRADE';
      return;
    }

    // ── Evaluate BUY conditions ────────────────────────────────
    const emaCrossUp = prevEmaFast <= prevEmaSlow && emaFast > emaSlow;
    const rsiInRange = rsi >= 30 && rsi <= 70;
    const volumeOk = volumeRatio >= this.volumeMultiplier;
    const cooldownOk = (Date.now() - (this.lastTradeTime[symbol] || 0)) > this.cooldownMs;

    // Multi-timeframe check: only block if strong 15m downtrend
    const mtfOk = !this.signals[symbol].mtfBlocked;

    // 1-hour trend filter: only buy when hourly trend is up
    const hourlyOk = this.signals[symbol].hourlyTrendUp;

    // Build skip reason log
    const checks = [];
    if (!emaCrossUp) checks.push('EMA no cross');
    if (!rsiInRange) checks.push(`RSI ${rsi.toFixed(0)} not in 30-70`);
    if (!volumeOk) checks.push(`Vol ${volumeRatio.toFixed(1)}x < 1.0x`);
    if (!inTradingWindow) checks.push(`Hour ${utcHour} outside 08-21`);
    if (!cooldownOk) checks.push('Cooldown active');
    if (!mtfOk) checks.push('15m strong downtrend');
    if (!hourlyOk) checks.push('1h trend down');

    if (emaCrossUp && rsiInRange && volumeOk && inTradingWindow && cooldownOk && mtfOk && hourlyOk) {
      this.signals[symbol].signal = 'BUY';
      this.signals[symbol].lastSkipReason = '';

      console.log(`\n🟢 ${symbol.toUpperCase()} BUY SIGNAL | EMA9:${emaFast.toFixed(2)} > EMA21:${emaSlow.toFixed(2)} | RSI:${rsi.toFixed(1)} rising:${rsiRising} | MACD:${currentMacdHist.toFixed(4)} | Vol:${volumeRatio.toFixed(1)}x | ATR:${atr?.toFixed(2)}`);

      this.emit('signal', {
        symbol,
        signal: 'BUY',
        price: closes[closes.length - 1],
        emaFast, emaSlow, rsi, macdHist: currentMacdHist,
        volumeRatio, atr,
      });
    } else {
      this.signals[symbol].signal = 'HOLD';
      this.signals[symbol].lastSkipReason = checks.join(' · ');

      // Emit skip event when EMA cross happened but other filters blocked
      if (emaCrossUp) {
        console.log(`⚪ ${symbol.toUpperCase()} EMA cross blocked: ${checks.join(' · ')}`);
        this.emit('skip', {
          symbol,
          reason: checks.join(' · '),
          price: closes[closes.length - 1],
          rsi, volumeRatio, macdHist: currentMacdHist,
        });
      }
    }
  }

  // ── Check Exit Conditions ───────────────────────────────────────────────
  _checkExits(symbol, currentPrice, emaFast, emaSlow, prevEmaFast, prevEmaSlow, rsi, atr) {
    const position = this.positions[symbol];
    if (!position) return;

    const pnlPct = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

    // Rule 1: Take profit at +1.5%
    if (pnlPct >= this.takeProfitPct) {
      this._emitClose(symbol, 'TAKE_PROFIT', currentPrice, pnlPct);
      return;
    }

    // Rule 2: Dynamic stop loss = entry - ATR*1.0
    if (currentPrice <= position.dynamicStop) {
      this._emitClose(symbol, 'ATR_STOP', currentPrice, pnlPct);
      return;
    }

    // Rule 3: EMA9 crosses below EMA21
    if (prevEmaFast >= prevEmaSlow && emaFast < emaSlow) {
      this._emitClose(symbol, 'EMA_CROSS_DOWN', currentPrice, pnlPct);
      return;
    }
  }

  _emitClose(symbol, reason, exitPrice, pnlPct) {
    const position = this.positions[symbol];
    console.log(`\n🔴 ${symbol.toUpperCase()} CLOSE: ${reason} @ $${exitPrice.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`);

    this.emit('close-position', {
      symbol, reason,
      entryPrice: position.entryPrice,
      exitPrice,
      pnlPct,
      quantity: position.quantity,
    });
    this.positions[symbol] = null;
  }

  // ── Open a Position ─────────────────────────────────────────────────────
  openPosition(symbol, entryPrice, quantity) {
    const atr = this.signals[symbol]?.atr || entryPrice * 0.015;
    const dynamicStop = entryPrice - (atr * 1.0);
    const takeProfit = entryPrice * (1 + this.takeProfitPct / 100);

    this.positions[symbol] = {
      side: 'LONG',
      entryPrice,
      quantity,
      timestamp: Date.now(),
      dynamicStop,
      takeProfit,
    };
    this.lastTradeTime[symbol] = Date.now();
    console.log(`📈 Position opened: ${symbol.toUpperCase()} @ $${entryPrice.toFixed(2)} | SL: $${dynamicStop.toFixed(2)} (ATR×1.0) | TP: $${takeProfit.toFixed(2)} (+${this.takeProfitPct}%)`);
  }

  closePosition(symbol) {
    this.positions[symbol] = null;
  }

  // ── Position sizing: risk 1% of portfolio / (ATR * 1.5) ────────────────
  getPositionSize(symbol, portfolioBalance) {
    const atr = this.signals[symbol]?.atr;
    if (!atr || atr === 0) return portfolioBalance * 0.15;  // fallback 15%
    const riskAmount = portfolioBalance * 0.01;  // 1% risk
    const price = this.signals[symbol]?.price || 1;
    const shares = riskAmount / atr;  // ATR×1.0 stop
    const positionValue = shares * price;
    // Cap at 15% of portfolio
    return Math.min(positionValue, portfolioBalance * 0.15);
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
    console.log('📈 Scalper shut down.');
  }
}
