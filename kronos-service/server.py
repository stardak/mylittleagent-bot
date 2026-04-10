#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════════════════════
KRONOS FORECAST MICROSERVICE
══════════════════════════════════════════════════════════════════════════════
Financial K-line foundation model (AAAI 2026) running as a local HTTP service.
The trading bot's scalper calls this before emitting any trade signal.

Input:  POST /forecast  { "candles": [{open,high,low,close,volume},...], "horizon": 5 }
Output: { "direction": "UP"|"DOWN", "confidence": 0.78, "forecast": [{...},...] }

Fail-open: if this service is down, the bot trades on technicals only.
══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import time
import logging
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("kronos-service")

# ── Config ───────────────────────────────────────────────────────────────────
MODEL_SIZE   = os.getenv("KRONOS_MODEL", "small")          # mini | small | base
TOKENIZER_HF = "NeoQuasar/Kronos-Tokenizer-base"
MODEL_HF     = f"NeoQuasar/Kronos-{MODEL_SIZE}"
MAX_CONTEXT  = 512
PORT         = int(os.getenv("KRONOS_PORT", "5001"))

# ── Global model state ───────────────────────────────────────────────────────
predictor = None

# ── Pydantic models ──────────────────────────────────────────────────────────

class Candle(BaseModel):
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = 0.0
    openTime: Optional[int] = None   # ms epoch — used to build timestamps

class ForecastRequest(BaseModel):
    candles: List[Candle]
    horizon: Optional[int] = 5       # how many candles ahead to forecast
    interval_minutes: Optional[int] = 15  # candle interval for timestamp generation

class CandleForecast(BaseModel):
    open: float
    high: float
    low: float
    close: float

class ForecastResponse(BaseModel):
    direction: str          # "UP" | "DOWN"
    confidence: float       # 0.0 – 1.0
    forecast: List[CandleForecast]
    model: str
    latency_ms: float

# ── Lifespan: load model on startup ─────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor
    log.info(f"Loading Kronos-{MODEL_SIZE} from HuggingFace…  (first run downloads ~1-2 GB)")
    t0 = time.time()
    try:
        # Import here so failure is visible at startup, not request time
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "Kronos"))
        from model import Kronos, KronosTokenizer, KronosPredictor

        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        log.info(f"Using device: {device}")

        tokenizer = KronosTokenizer.from_pretrained(TOKENIZER_HF)
        model     = Kronos.from_pretrained(MODEL_HF).to(device)
        model.eval()

        predictor = KronosPredictor(model, tokenizer, max_context=MAX_CONTEXT)
        elapsed = time.time() - t0
        log.info(f"✅ Kronos-{MODEL_SIZE} loaded in {elapsed:.1f}s — service ready on :{PORT}")
    except Exception as e:
        log.error(f"❌ Failed to load Kronos model: {e}")
        log.warning("Service will return 503 for /forecast until model loads successfully.")
    yield
    log.info("Shutting down Kronos service.")

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Kronos Forecast Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok" if predictor is not None else "loading",
        "model": f"Kronos-{MODEL_SIZE}",
        "ready": predictor is not None,
    }


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet — try again in a moment.")

    if len(req.candles) < 30:
        raise HTTPException(status_code=400, detail="Need at least 30 candles for a meaningful forecast.")

    t0 = time.time()

    # ── Build input DataFrame ────────────────────────────────────────────────
    interval_ms = req.interval_minutes * 60 * 1000

    # Use openTime if provided, otherwise synthesise backwards from now
    if req.candles[0].openTime:
        timestamps = pd.to_datetime([c.openTime for c in req.candles], unit="ms")
    else:
        base = int(time.time() * 1000) - len(req.candles) * interval_ms
        timestamps = pd.to_datetime([base + i * interval_ms for i in range(len(req.candles))], unit="ms")

    # Trim to MAX_CONTEXT
    candles_trimmed = req.candles[-MAX_CONTEXT:]
    timestamps_trimmed = timestamps[-MAX_CONTEXT:]

    df = pd.DataFrame({
        "open":   [c.open   for c in candles_trimmed],
        "high":   [c.high   for c in candles_trimmed],
        "low":    [c.low    for c in candles_trimmed],
        "close":  [c.close  for c in candles_trimmed],
        "volume": [c.volume for c in candles_trimmed],
        "amount": [c.volume * c.close for c in candles_trimmed],  # proxy if not provided
    })

    # ── Future timestamps for the forecast horizon ───────────────────────────
    last_ts = timestamps_trimmed[-1]
    y_timestamps = pd.date_range(
        start=last_ts + pd.Timedelta(minutes=req.interval_minutes),
        periods=req.horizon,
        freq=f"{req.interval_minutes}min",
    )

    # Kronos internally calls .dt.minute/.hour etc — needs a pandas Series
    x_ts = pd.Series(timestamps_trimmed)
    y_ts = pd.Series(y_timestamps)

    # ── Run Kronos forecast ──────────────────────────────────────────────────
    try:
        pred_df = predictor.predict(
            df=df,
            x_timestamp=x_ts,
            y_timestamp=y_ts,
            pred_len=req.horizon,
            T=1.0,
            top_p=0.9,
            sample_count=1,
        )
    except Exception as e:
        log.error(f"Kronos predict() failed: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

    # ── Direction + confidence ───────────────────────────────────────────────
    current_close = candles_trimmed[-1].close
    forecast_closes = pred_df["close"].tolist()
    final_close = forecast_closes[-1]

    # Direction: compare end of forecast window vs current price
    direction = "UP" if final_close > current_close else "DOWN"

    # Confidence: magnitude of move relative to ATR-like spread
    recent_highs = [c.high for c in candles_trimmed[-14:]]
    recent_lows  = [c.low  for c in candles_trimmed[-14:]]
    atr_proxy = np.mean([h - l for h, l in zip(recent_highs, recent_lows)])
    move = abs(final_close - current_close)

    # Scale confidence: 0 = no move, 1 = move ≥ 2× ATR
    raw_confidence = min(move / (2 * atr_proxy + 1e-9), 1.0)
    # Sigmoid-smooth so small moves give ~0.5 and large moves approach 1.0
    confidence = float(0.5 + 0.5 * raw_confidence)

    elapsed_ms = (time.time() - t0) * 1000

    log.info(
        f"Forecast: {direction} {confidence:.0%} | "
        f"Current ${current_close:.2f} → Predicted ${final_close:.2f} | "
        f"{elapsed_ms:.0f}ms"
    )

    return ForecastResponse(
        direction=direction,
        confidence=round(confidence, 3),
        forecast=[
            CandleForecast(
                open=float(row["open"]),
                high=float(row["high"]),
                low=float(row["low"]),
                close=float(row["close"]),
            )
            for _, row in pred_df.iterrows()
        ],
        model=f"Kronos-{MODEL_SIZE}",
        latency_ms=round(elapsed_ms, 1),
    )


# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, log_level="warning")
