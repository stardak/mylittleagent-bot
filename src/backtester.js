// ══════════════════════════════════════════════════════════════════════════════
// BACKTESTING ENGINE v6 — Confirmation Candle MR + Breakout
// ══════════════════════════════════════════════════════════════════════════════
// Matches scalper.js v6 exactly:
//   • Confirmation candle MR (prev outside BB → current inside)
//   • 1.5× ATR stop, 100% reversion to SMA20, no MACD
//   • Breakout on Donchian channel (ADX>40, 2× vol)
//   • 3% compounding position sizing
//   • $95 hard floor pause rule
//   • Max 2 concurrent positions (multi-symbol)
//   • Breakeven stop at 0.5× ATR
//
// Usage:
//   import { runBacktest } from './backtester.js';
//   const results = await runBacktest({ startingBalance: 100, days: 30 });
// ══════════════════════════════════════════════════════════════════════════════

const SYMBOLS = ['ETHUSDT', 'BTCUSDT', 'SOLUSDT'];
const INTERVAL = '15m';
const DAYS = 30;
const KLINE_LIMIT = 1000;

// ── Strategy params (must match scalper.js v6) ──
const SMA_PERIOD = 20;
const SMA50_PERIOD = 50;
const BB_STD_DEV = 2.0;
const RSI_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_PERIOD = 14;
const VOL_AVG_PERIOD = 20;
const DONCHIAN_PERIOD = 20;

// Regime
const ADX_TRENDING = 40;
const ADX_RANGING = 25;

// MR (v6 — confirmation candle, no MACD)
const MR_RSI_ENTRY = 30;
const MR_RSI_SHORT = 70;
const MR_VOL_MULT = 1.0;
const MR_STOP_ATR = 1.5;       // was 1.0 in v5
const MR_MAX_BARS_HELD = 20;
const MR_TARGET_REVERSION = 1.0;
const MR_BREAKEVEN_ATR = 0.5;

// Breakout
const BO_VOL_MULT = 2.0;
const BO_TRAIL_ATR = 2.5;
const BO_TP_PCT = 4.0;

// General
const BET_PCT = 0.03;         // 3% compounding
const HARD_FLOOR = 95;        // pause trading below $95
const MAX_CONCURRENT = 2;     // correlation guard
const FEE_PCT = 0.001;        // 0.1% per side
const COOLDOWN_BARS = 3;
const MIN_CANDLES = Math.max(ADX_PERIOD * 2 + 2, SMA50_PERIOD + 5, DONCHIAN_PERIOD + 2);

// ── Indicator Functions ──────────────────────────────────────────────────────

function smaF(prices, period) {
  if (prices.length < period) return null;
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function stdDevF(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  return Math.sqrt(slice.reduce((sum, p) => sum + (p - mean) ** 2, 0) / period);
}

function bbF(prices, period, numStdDev) {
  const s = smaF(prices, period);
  const sd = stdDevF(prices, period);
  if (s === null || sd === null) return null;
  return { upper: s + numStdDev * sd, middle: s, lower: s - numStdDev * sd };
}

function rsiF(prices, period) {
  if (prices.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);
  const recent = changes.slice(-period);
  let avgGain = 0, avgLoss = 0;
  for (const c of recent) { if (c > 0) avgGain += c; else avgLoss += Math.abs(c); }
  avgGain /= period; avgLoss /= period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function atrF(candles, period) {
  if (candles.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function avgVolF(candles, period) {
  if (candles.length < period + 1) return null;
  return candles.slice(-period - 1, -1).reduce((a, b) => a + b.volume, 0) / period;
}

function donchF(candles, period) {
  if (candles.length < period + 1) return null;
  const lb = candles.slice(-(period + 1), -1);
  return { high: Math.max(...lb.map(c => c.high)), low: Math.min(...lb.map(c => c.low)) };
}

function adxF(candles, period) {
  if (candles.length < period * 2 + 1) return null;
  const pD = [], mD = [], tr = [];
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low, ph = candles[i-1].high, pl = candles[i-1].low, pc = candles[i-1].close;
    tr.push(Math.max(h-l, Math.abs(h-pc), Math.abs(l-pc)));
    const u = h-ph, d = pl-l;
    pD.push(u > d && u > 0 ? u : 0);
    mD.push(d > u && d > 0 ? d : 0);
  }
  if (tr.length < period) return null;
  const sm = (a, p) => { let s = a.slice(0,p).reduce((x,y)=>x+y,0); const r=[s]; for(let i=p;i<a.length;i++){s=s-s/p+a[i];r.push(s)} return r };
  const st = sm(tr,period), sp = sm(pD,period), smm = sm(mD,period);
  const len = Math.min(st.length,sp.length,smm.length);
  if (len < period) return null;
  const dx = [];
  let lPDI = 0, lMDI = 0;
  for (let i = 0; i < len; i++) {
    if (st[i]===0){dx.push(0);continue}
    const p2=(sp[i]/st[i])*100, m2=(smm[i]/st[i])*100, s2=p2+m2;
    dx.push(s2>0?(Math.abs(p2-m2)/s2)*100:0);
    lPDI = p2; lMDI = m2;
  }
  if (dx.length < period) return null;
  let a = dx.slice(0,period).reduce((x,y)=>x+y,0)/period;
  for(let i=period;i<dx.length;i++) a=(a*(period-1)+dx[i])/period;
  return { adx: a, plusDI: lPDI, minusDI: lMDI };
}

// ── Fetch Historical Candles ─────────────────────────────────────────────────

async function fetchCandles(symbol, interval, days) {
  const startTime = Date.now() - days * 86400000;
  const candlesPerDay = interval === '15m' ? 96 : 288;
  const batches = Math.ceil((days * candlesPerDay) / KLINE_LIMIT);
  let all = [], bs = startTime;
  for (let i = 0; i < batches; i++) {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${bs}&limit=${KLINE_LIMIT}`);
    if (!res.ok) throw new Error(`Binance API error: ${res.status} for ${symbol}`);
    const data = await res.json();
    if (!data.length) break;
    all = all.concat(data.map(k => ({
      openTime: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5], closeTime: k[6],
    })));
    bs = data[data.length - 1][6] + 1;
    await new Promise(r => setTimeout(r, 100));
  }
  return all;
}

// ══════════════════════════════════════════════════════════════════════════════
// MULTI-SYMBOL BACKTEST (interleaved by time, shared portfolio)
// ══════════════════════════════════════════════════════════════════════════════

export async function runBacktest(options = {}) {
  const startingBalance = options.startingBalance || parseFloat(process.env.STARTING_PORTFOLIO) || 100;
  const days = options.days || DAYS;
  const symbols = options.symbols || SYMBOLS;

  console.log(`📊 Backtester v6: Fetching ${days} days of ${INTERVAL} candles...`);

  // Fetch all candles
  const candleData = {};
  for (const symbol of symbols) {
    candleData[symbol] = await fetchCandles(symbol, INTERVAL, days);
    console.log(`   ${symbol}: ${candleData[symbol].length} candles loaded`);
  }

  // Interleave all candles by time
  const events = [];
  for (const [sym, candles] of Object.entries(candleData)) {
    for (const c of candles) events.push({ ...c, symbol: sym });
  }
  events.sort((a, b) => a.openTime - b.openTime);

  // ── Shared state ──
  let equity = startingBalance;
  let tradingPaused = false;
  const positions = {};  // per symbol
  const buffers = {};    // per symbol
  const prevState = {};  // per symbol: confirmation candle state
  const lastTradeBars = {};
  const barCounts = {};

  for (const sym of symbols) {
    positions[sym] = null;
    buffers[sym] = [];
    prevState[sym] = { belowBB: false, aboveBB: false, rsi: 50 };
    lastTradeBars[sym] = -COOLDOWN_BARS - 1;
    barCounts[sym] = 0;
  }

  const allTrades = [];
  let barsInTrending = 0, barsInRanging = 0, barsInAmbiguous = 0;

  // Daily equity tracking
  const dailyEquity = {};

  for (const ev of events) {
    const sym = ev.symbol;
    const buf = buffers[sym];
    buf.push(ev);
    if (buf.length > 120) buf.shift();
    barCounts[sym]++;

    const closes = buf.map(c => c.close);
    if (closes.length < MIN_CANDLES) continue;

    const price = ev.close;
    const bb = bbF(closes, SMA_PERIOD, BB_STD_DEV);
    const rv = rsiF(closes, RSI_PERIOD);
    const av = atrF(buf, ATR_PERIOD);
    const adxData = adxF(buf, ADX_PERIOD);
    const donch = donchF(buf, DONCHIAN_PERIOD);
    const volAvg = avgVolF(buf, VOL_AVG_PERIOD);
    const sma50 = smaF(closes, SMA50_PERIOD);
    const volumeRatio = volAvg ? ev.volume / volAvg : 0;

    if (!bb || !adxData || !donch || !av) {
      prevState[sym] = { belowBB: false, aboveBB: false, rsi: rv };
      continue;
    }

    // Regime
    let regime = 'AMBIGUOUS';
    if (adxData.adx > ADX_TRENDING) { regime = 'TRENDING'; barsInTrending++; }
    else if (adxData.adx < ADX_RANGING) { regime = 'RANGING'; barsInRanging++; }
    else { barsInAmbiguous++; }

    // BB state for confirmation
    const curBelowBB = price < bb.lower;
    const curAboveBB = price > bb.upper;
    const curInsideBB = !curBelowBB && !curAboveBB;

    // Track daily equity
    const day = new Date(ev.openTime).toISOString().split('T')[0];

    // ── Check exits ──
    if (positions[sym]) {
      const pos = positions[sym];
      const isL = pos.side === 'LONG';

      // Trailing stop update (breakout)
      if (pos.strategy === 'BREAKOUT') {
        if (isL && price > pos.highestSinceEntry) {
          pos.highestSinceEntry = price;
          const nt = price - av * BO_TRAIL_ATR;
          if (nt > pos.trailingStop) pos.trailingStop = nt;
        }
        if (!isL && price < pos.lowestSinceEntry) {
          pos.lowestSinceEntry = price;
          const nt = price + av * BO_TRAIL_ATR;
          if (nt < pos.trailingStop) pos.trailingStop = nt;
        }
      }

      let exitReason = null;

      if (pos.strategy === 'MEAN_REVERSION') {
        // Breakeven stop
        if (!pos.breakevenStop) {
          const beT = av * MR_BREAKEVEN_ATR;
          const inProfit = isL ? (price - pos.entryPrice) >= beT : (pos.entryPrice - price) >= beT;
          if (inProfit) { pos.stopPrice = pos.entryPrice; pos.breakevenStop = true; }
        }
        if (isL && price >= pos.targetPrice) exitReason = 'TARGET';
        else if (!isL && price <= pos.targetPrice) exitReason = 'TARGET';
        else if (isL && price <= pos.stopPrice) exitReason = pos.breakevenStop ? 'BREAKEVEN' : 'STOP';
        else if (!isL && price >= pos.stopPrice) exitReason = pos.breakevenStop ? 'BREAKEVEN' : 'STOP';
        else if (barCounts[sym] - pos.entryBar >= MR_MAX_BARS_HELD) exitReason = 'TIME';
      } else {
        // Breakout
        const pnlPct = isL ? ((price - pos.entryPrice) / pos.entryPrice) * 100 : ((pos.entryPrice - price) / pos.entryPrice) * 100;
        if (pnlPct >= BO_TP_PCT) exitReason = 'TP';
        else if (isL && price <= pos.trailingStop) exitReason = 'TRAIL';
        else if (!isL && price >= pos.trailingStop) exitReason = 'TRAIL';
      }

      if (exitReason) {
        const raw = isL ? pos.qty * (price - pos.entryPrice) : pos.qty * (pos.entryPrice - price);
        const fees = pos.qty * price * FEE_PCT + pos.qty * pos.entryPrice * FEE_PCT;
        const pnl = raw - fees;
        equity += pnl;
        allTrades.push({
          symbol: sym, strategy: pos.strategy, side: pos.side,
          entryPrice: pos.entryPrice, exitPrice: price,
          quantity: pos.qty, pnlUsd: pnl,
          pnlPct: (isL ? (price - pos.entryPrice) / pos.entryPrice : (pos.entryPrice - price) / pos.entryPrice) * 100 - FEE_PCT * 2 * 100,
          reason: exitReason,
          entryTime: pos.entryTime, exitTime: ev.openTime,
          barsHeld: barCounts[sym] - pos.entryBar,
        });
        positions[sym] = null;
        dailyEquity[day] = equity;
      }

      prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
      continue;
    }

    // ── Hard floor check ──
    if (equity < HARD_FLOOR && !tradingPaused) {
      tradingPaused = true;
      console.log(`🚨 HARD FLOOR HIT at $${equity.toFixed(2)} — trading paused`);
    }
    if (tradingPaused) {
      prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
      continue;
    }

    // Session filter
    const utcHour = new Date(ev.openTime).getUTCHours();
    if (utcHour < 7 || utcHour >= 21) {
      prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
      continue;
    }

    // Cooldown
    if (barCounts[sym] - lastTradeBars[sym] < COOLDOWN_BARS) {
      prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
      continue;
    }

    // Correlation guard
    const openCount = Object.values(positions).filter(p => p !== null).length;
    if (openCount >= MAX_CONCURRENT) {
      prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
      continue;
    }

    // ── 3% compounding position size ──
    const betSize = equity * BET_PCT;
    const qty = betSize / price;
    const prev = prevState[sym];

    // ══════════════════════════════════════════════════════════════════════════
    // MEAN REVERSION — CONFIRMATION CANDLE (v6)
    // ══════════════════════════════════════════════════════════════════════════
    if (regime === 'RANGING') {
      const volOk = volumeRatio >= MR_VOL_MULT;

      // LONG: prev closed below BB with RSI<30, current bounced inside
      if (prev.belowBB && curInsideBB && prev.rsi < MR_RSI_ENTRY && volOk) {
        const sp = price - av * MR_STOP_ATR;
        const tp = price + (bb.middle - price) * MR_TARGET_REVERSION;
        positions[sym] = {
          strategy: 'MEAN_REVERSION', side: 'LONG',
          entryPrice: price, qty, stopPrice: sp, targetPrice: tp,
          entryTime: ev.openTime, entryBar: barCounts[sym],
          highestSinceEntry: price, lowestSinceEntry: price,
          breakevenStop: false,
        };
        lastTradeBars[sym] = barCounts[sym];
        prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
        continue;
      }

      // SHORT: prev closed above BB with RSI>70, current bounced inside
      if (prev.aboveBB && curInsideBB && prev.rsi > MR_RSI_SHORT && volOk) {
        const sp = price + av * MR_STOP_ATR;
        const tp = price - (price - bb.middle) * MR_TARGET_REVERSION;
        positions[sym] = {
          strategy: 'MEAN_REVERSION', side: 'SHORT',
          entryPrice: price, qty, stopPrice: sp, targetPrice: tp,
          entryTime: ev.openTime, entryBar: barCounts[sym],
          highestSinceEntry: price, lowestSinceEntry: price,
          breakevenStop: false,
        };
        lastTradeBars[sym] = barCounts[sym];
        prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
        continue;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BREAKOUT — Donchian Channel (unchanged from v5)
    // ══════════════════════════════════════════════════════════════════════════
    if (regime === 'TRENDING') {
      const volOk = volumeRatio >= BO_VOL_MULT;
      const aboveSma50 = sma50 ? price > sma50 : true;
      const belowSma50 = sma50 ? price < sma50 : true;

      if (price > donch.high && adxData.plusDI > adxData.minusDI && volOk && aboveSma50) {
        const trail = price - av * BO_TRAIL_ATR;
        positions[sym] = {
          strategy: 'BREAKOUT', side: 'LONG',
          entryPrice: price, qty, trailingStop: trail,
          targetPrice: price * (1 + BO_TP_PCT / 100),
          entryTime: ev.openTime, entryBar: barCounts[sym],
          highestSinceEntry: price, lowestSinceEntry: price,
        };
        lastTradeBars[sym] = barCounts[sym];
        prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
        continue;
      }
      if (price < donch.low && adxData.minusDI > adxData.plusDI && volOk && belowSma50) {
        const trail = price + av * BO_TRAIL_ATR;
        positions[sym] = {
          strategy: 'BREAKOUT', side: 'SHORT',
          entryPrice: price, qty, trailingStop: trail,
          targetPrice: price * (1 - BO_TP_PCT / 100),
          entryTime: ev.openTime, entryBar: barCounts[sym],
          highestSinceEntry: price, lowestSinceEntry: price,
        };
        lastTradeBars[sym] = barCounts[sym];
      }
    }

    prevState[sym] = { belowBB: curBelowBB, aboveBB: curAboveBB, rsi: rv };
    dailyEquity[day] = equity;
  }

  // Close any remaining positions
  for (const sym of symbols) {
    if (positions[sym]) {
      const lastC = candleData[sym][candleData[sym].length - 1];
      const p = lastC.close;
      const pos = positions[sym];
      const isL = pos.side === 'LONG';
      const raw = isL ? pos.qty * (p - pos.entryPrice) : pos.qty * (pos.entryPrice - p);
      const fees = pos.qty * p * FEE_PCT + pos.qty * pos.entryPrice * FEE_PCT;
      equity += raw - fees;
      allTrades.push({
        symbol: sym, strategy: pos.strategy, side: pos.side,
        entryPrice: pos.entryPrice, exitPrice: p, quantity: pos.qty,
        pnlUsd: raw - fees,
        pnlPct: (isL ? (p - pos.entryPrice) / pos.entryPrice : (pos.entryPrice - p) / pos.entryPrice) * 100 - FEE_PCT * 2 * 100,
        reason: 'END_OF_DATA', entryTime: pos.entryTime, exitTime: lastC.openTime,
        barsHeld: barCounts[sym] - pos.entryBar,
      });
    }
  }

  // Sort by time
  allTrades.sort((a, b) => a.entryTime - b.entryTime);

  // ── Stats ──
  const wins = allTrades.filter(t => t.pnlUsd > 0);
  const losses = allTrades.filter(t => t.pnlUsd <= 0);
  const totalTrades = allTrades.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades * 100) : 0;
  const totalPnl = allTrades.reduce((s, t) => s + t.pnlUsd, 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlUsd, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlUsd, 0) / losses.length : 0;
  const grossProfit = wins.reduce((s, t) => s + t.pnlUsd, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlUsd, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

  const mrTrades = allTrades.filter(t => t.strategy === 'MEAN_REVERSION');
  const boTrades = allTrades.filter(t => t.strategy === 'BREAKOUT');
  const longTrades = allTrades.filter(t => t.side === 'LONG');
  const shortTrades = allTrades.filter(t => t.side === 'SHORT');

  // Equity curve + drawdown
  let eq = startingBalance, peak = eq, maxDD = 0, maxDDpct = 0;
  for (const t of allTrades) {
    eq += t.pnlUsd;
    if (eq > peak) peak = eq;
    const dd = peak - eq, ddp = (dd / peak) * 100;
    if (ddp > maxDDpct) { maxDDpct = ddp; maxDD = dd; }
  }

  // Streaks
  let maxWS = 0, maxLS = 0, cw = 0, cl = 0;
  for (const t of allTrades) {
    if (t.pnlUsd > 0) { cw++; cl = 0; maxWS = Math.max(maxWS, cw); }
    else { cl++; cw = 0; maxLS = Math.max(maxLS, cl); }
  }

  // Per-symbol breakdown
  const perSymbol = {};
  for (const sym of symbols) {
    const st = allTrades.filter(t => t.symbol === sym);
    const smr = st.filter(t => t.strategy === 'MEAN_REVERSION');
    const sbo = st.filter(t => t.strategy === 'BREAKOUT');
    perSymbol[sym] = {
      trades: st.length,
      wins: st.filter(t => t.pnlUsd > 0).length,
      losses: st.filter(t => t.pnlUsd <= 0).length,
      pnl: st.reduce((s, t) => s + t.pnlUsd, 0),
      mr: { trades: smr.length, wins: smr.filter(t => t.pnlUsd > 0).length, pnl: smr.reduce((s, t) => s + t.pnlUsd, 0) },
      bo: { trades: sbo.length, wins: sbo.filter(t => t.pnlUsd > 0).length, pnl: sbo.reduce((s, t) => s + t.pnlUsd, 0) },
    };
  }

  // Exit reasons
  const exitReasons = {};
  for (const t of allTrades) exitReasons[t.reason] = (exitReasons[t.reason] || 0) + 1;

  // Avg bars held
  const avgBarsHeld = totalTrades > 0 ? allTrades.reduce((s, t) => s + (t.barsHeld || 0), 0) / totalTrades : 0;

  const totalBars = barsInTrending + barsInRanging + barsInAmbiguous;
  const mrWR = mrTrades.length > 0 ? (mrTrades.filter(t => t.pnlUsd > 0).length / mrTrades.length * 100) : 0;
  const boWR = boTrades.length > 0 ? (boTrades.filter(t => t.pnlUsd > 0).length / boTrades.length * 100) : 0;
  const longWR = longTrades.length > 0 ? (longTrades.filter(t => t.pnlUsd > 0).length / longTrades.length * 100) : 0;
  const shortWR = shortTrades.length > 0 ? (shortTrades.filter(t => t.pnlUsd > 0).length / shortTrades.length * 100) : 0;

  // ── Print results ──
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 BACKTEST v6 — ${days} days, ${symbols.join(' + ')}, 3% compounding`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  Starting:       $${startingBalance.toFixed(2)}`);
  console.log(`  Ending:         $${equity.toFixed(4)} (${((equity - startingBalance) / startingBalance * 100).toFixed(2)}%)`);
  console.log(`  Total trades:   ${totalTrades} (${wins.length}W / ${losses.length}L)`);
  console.log(`  Win rate:       ${winRate.toFixed(1)}%`);
  console.log(`  Avg win:        $${avgWin.toFixed(4)}  |  Avg loss: $${avgLoss.toFixed(4)}`);
  console.log(`  Profit factor:  ${profitFactor.toFixed(2)}`);
  console.log(`  Max drawdown:   ${maxDDpct.toFixed(2)}% ($${maxDD.toFixed(4)})`);
  console.log(`  Max win streak: ${maxWS}`);
  console.log(`  Max loss streak: ${maxLS}`);
  console.log(`  Avg bars held:  ${avgBarsHeld.toFixed(1)}`);
  if (tradingPaused) console.log(`  🚨 HARD FLOOR HIT — trading paused during backtest`);

  console.log(`\n  ── Strategy Breakdown ──`);
  console.log(`  MR (confirm):   ${mrTrades.length} trades, ${mrWR.toFixed(1)}% WR, $${mrTrades.reduce((s,t)=>s+t.pnlUsd,0).toFixed(4)} P&L`);
  console.log(`  Breakout:       ${boTrades.length} trades, ${boWR.toFixed(1)}% WR, $${boTrades.reduce((s,t)=>s+t.pnlUsd,0).toFixed(4)} P&L`);
  console.log(`  LONG:           ${longTrades.length} trades, ${longWR.toFixed(1)}% WR, $${longTrades.reduce((s,t)=>s+t.pnlUsd,0).toFixed(4)} P&L`);
  console.log(`  SHORT:          ${shortTrades.length} trades, ${shortWR.toFixed(1)}% WR, $${shortTrades.reduce((s,t)=>s+t.pnlUsd,0).toFixed(4)} P&L`);

  console.log(`\n  ── Per-Coin Breakdown ──`);
  for (const sym of symbols) {
    const ps = perSymbol[sym];
    const wr = ps.trades > 0 ? (ps.wins / ps.trades * 100).toFixed(1) : '0.0';
    console.log(`  ${sym.replace('USDT','').padEnd(4)} ${String(ps.trades).padEnd(4)} trades  ${wr}% WR  $${ps.pnl.toFixed(4)} P&L  (MR: ${ps.mr.trades}, BO: ${ps.bo.trades})`);
  }

  console.log(`\n  ── Exit Reasons ──`);
  for (const [reason, count] of Object.entries(exitReasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason.padEnd(15)} ${count}`);
  }

  console.log(`\n  ── Regime Distribution ──`);
  console.log(`  Trending: ${totalBars > 0 ? (barsInTrending / totalBars * 100).toFixed(1) : 0}%  |  Ranging: ${totalBars > 0 ? (barsInRanging / totalBars * 100).toFixed(1) : 0}%  |  Ambiguous: ${totalBars > 0 ? (barsInAmbiguous / totalBars * 100).toFixed(1) : 0}%`);

  console.log(`\n  ── Day-by-Day Portfolio ──`);
  const sortedDays = Object.keys(dailyEquity).sort();
  for (const d of sortedDays) {
    const v = dailyEquity[d];
    const change = v >= startingBalance ? `+${((v - startingBalance) / startingBalance * 100).toFixed(2)}%` : `${((v - startingBalance) / startingBalance * 100).toFixed(2)}%`;
    const bar = '█'.repeat(Math.max(1, Math.round((v / startingBalance) * 30)));
    console.log(`  ${d}  $${v.toFixed(4).padStart(9)}  ${bar}  ${change}`);
  }

  // Last 10 trades
  console.log(`\n  ── Last 10 Trades ──`);
  for (const t of allTrades.slice(-10)) {
    const e = t.pnlUsd > 0 ? '✅' : '❌';
    const coin = t.symbol.replace('USDT', '');
    console.log(`  ${e} ${t.strategy === 'MEAN_REVERSION' ? 'MR' : 'BO'} ${t.side.padEnd(5)} ${coin.padEnd(4)} $${t.entryPrice.toFixed(2)} → $${t.exitPrice.toFixed(2)} | $${t.pnlUsd.toFixed(4)} | ${t.reason} (${t.barsHeld} bars)`);
  }

  console.log(`${'═'.repeat(70)}\n`);

  return {
    startingBalance, finalEquity: equity, daysBacktested: days, interval: INTERVAL,
    symbols, totalTrades, wins: wins.length, losses: losses.length,
    winRate: parseFloat(winRate.toFixed(1)),
    totalPnlUsd: parseFloat(totalPnl.toFixed(4)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDDpct.toFixed(2)),
    maxConsecutiveLosses: maxLS, maxConsecutiveWins: maxWS,
    perSymbol, exitReasons, dailyEquity, tradingPaused,
    trades: allTrades,
  };
}
