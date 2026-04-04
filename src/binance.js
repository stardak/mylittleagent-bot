// ══════════════════════════════════════════════════════════════════════════════
// BINANCE REAL-TIME PRICE MONITOR
// ══════════════════════════════════════════════════════════════════════════════
// Connects to Binance WebSocket for live BTC/USDT and ETH/USDT trade streams.
// Calculates 30-second price momentum and emits events for the strategy engine.
// Auto-reconnects on disconnect with exponential backoff.
// ══════════════════════════════════════════════════════════════════════════════

import { EventEmitter } from 'events';
import WebSocket from 'ws';

export class BinanceFeed extends EventEmitter {
  constructor() {
    super();
    this.symbols = ['btcusdt', 'ethusdt', 'solusdt'];
    this.connections = {};
    this.connected = {};
    this.reconnectDelay = {};

    this.MOMENTUM_WINDOW_MS = 30_000;
    this.priceBuffers = { btcusdt: [], ethusdt: [], solusdt: [] };
    this.latestPrices = { btcusdt: null, ethusdt: null, solusdt: null };
  }

  start() {
    for (const symbol of this.symbols) {
      this.reconnectDelay[symbol] = 1000;
      this._connect(symbol);
    }
  }

  isConnected() {
    return this.symbols.every(s => this.connected[s] === true);
  }

  getConnectionStatus() {
    return {
      btcusdt: this.connected.btcusdt || false,
      ethusdt: this.connected.ethusdt || false,
      solusdt: this.connected.solusdt || false,
      allConnected: this.isConnected()
    };
  }

  getPrice(symbol) {
    const sym = symbol.toLowerCase();
    return {
      price: this.latestPrices[sym],
      momentum: this._calculateMomentum(sym),
      symbol: sym.toUpperCase()
    };
  }

  shutdown() {
    for (const symbol of this.symbols) {
      if (this.connections[symbol]) {
        this.connections[symbol]._manualClose = true;
        this.connections[symbol].close();
      }
    }
  }

  _connect(symbol) {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@trade`;

    try {
      const ws = new WebSocket(url);
      this.connections[symbol] = ws;

      ws.on('open', () => {
        this.connected[symbol] = true;
        this.reconnectDelay[symbol] = 1000;
        this.emit('connection', { symbol, status: 'connected' });
        console.log(`✅ Binance WebSocket connected: ${symbol.toUpperCase()}`);
      });

      ws.on('message', (data) => {
        try {
          const trade = JSON.parse(data);
          this._handleTrade(symbol, trade);
        } catch (err) {
          // Ignore malformed messages
        }
      });

      ws.on('close', () => {
        this.connected[symbol] = false;
        this.emit('connection', { symbol, status: 'disconnected' });

        if (ws._manualClose) return;

        console.log(
          `⚠️  Binance WebSocket disconnected: ${symbol.toUpperCase()}. ` +
          `Reconnecting in ${this.reconnectDelay[symbol] / 1000}s...`
        );
        this._scheduleReconnect(symbol);
      });

      ws.on('error', (err) => {
        console.error(`❌ Binance WebSocket error (${symbol.toUpperCase()}): ${err.message}`);
      });
    } catch (err) {
      console.error(`❌ Failed to create Binance WebSocket for ${symbol}: ${err.message}`);
      this._scheduleReconnect(symbol);
    }
  }

  _scheduleReconnect(symbol) {
    setTimeout(() => this._connect(symbol), this.reconnectDelay[symbol]);
    this.reconnectDelay[symbol] = Math.min(this.reconnectDelay[symbol] * 2, 30_000);
  }

  _handleTrade(symbol, trade) {
    const price = parseFloat(trade.p);
    const timestamp = trade.T || Date.now();

    this.latestPrices[symbol] = price;
    this.priceBuffers[symbol].push({ price, timestamp });

    const cutoff = Date.now() - this.MOMENTUM_WINDOW_MS;
    this.priceBuffers[symbol] = this.priceBuffers[symbol].filter(
      entry => entry.timestamp >= cutoff
    );

    const momentum = this._calculateMomentum(symbol);
    this.emit('price', { symbol: symbol.toUpperCase(), price, momentum, timestamp });
  }

  _calculateMomentum(symbol) {
    const buffer = this.priceBuffers[symbol];
    if (!buffer || buffer.length < 2) return 0;
    const oldest = buffer[0].price;
    const newest = buffer[buffer.length - 1].price;
    return ((newest - oldest) / oldest) * 100;
  }
}
