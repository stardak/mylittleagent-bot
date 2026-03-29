// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGGER
// ══════════════════════════════════════════════════════════════════════════════
// Structured logging for the trading bot dashboard.
// Emits activity entries in a standard JSON format for the frontend.
// ══════════════════════════════════════════════════════════════════════════════

export class ActivityLogger {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.entries = [];
    this.maxEntries = 200;
  }

  /**
   * Log a structured activity entry
   * @param {string} type - buy | sell | skip | info
   * @param {string|null} coin - BTC, ETH, SOL, BNB, or null
   * @param {string} message - Human readable description
   * @param {string|null} reason - Specific reason with numbers
   * @param {string|null} tag - regime|15m|orderbook|correlation|cooldown|tp|sl|breakeven|ema|rsi|null
   */
  log(type, coin, message, reason = null, tag = null) {
    const entry = {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
      type,
      coin,
      message,
      reason,
      tag,
    };

    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    // Push to dashboard via WebSocket
    if (this.dashboard && this.dashboard.io) {
      this.dashboard.io.emit('activity', entry);
    }

    // Also log to console
    const icons = { buy: '🟢', sell: '🔴', skip: '⚪', info: '🔵' };
    const prefix = icons[type] || '📝';
    const coinStr = coin ? `[${coin}] ` : '';
    console.log(`${prefix} ${coinStr}${message}${reason ? ` (${reason})` : ''}`);
  }

  buy(coin, message, reason) {
    this.log('buy', coin, message, reason, 'ema');
  }

  sell(coin, message, reason, tag = 'sl') {
    this.log('sell', coin, message, reason, tag);
  }

  skip(coin, message, reason, tag) {
    this.log('skip', coin, message, reason, tag);
  }

  info(message, coin = null) {
    this.log('info', coin, message, null, null);
  }

  getRecent(limit = 50) {
    return this.entries.slice(0, limit);
  }
}
