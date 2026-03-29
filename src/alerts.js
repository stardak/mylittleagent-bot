// ══════════════════════════════════════════════════════════════════════════════
// TELEGRAM ALERT SERVICE
// ══════════════════════════════════════════════════════════════════════════════
// Sends Telegram messages for critical events:
//   • Kill switch triggered
//   • Daily loss limit hit
//   • Single loss over 5% of portfolio
//   • Unexpected disconnects
//
// Falls back gracefully if Telegram credentials are missing (logs to console).
// ══════════════════════════════════════════════════════════════════════════════

export class AlertService {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.enabled = !!(botToken && chatId && !botToken.includes('your_') && !chatId.includes('your_'));

    if (!this.enabled) {
      console.log(
        '⚠️  Telegram alerts are disabled. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID ' +
        'in your .env file to enable them. The bot will still run, but you won\'t get ' +
        'alerts on your phone.'
      );
    }
  }

  /**
   * Send a message to Telegram. If Telegram isn't configured, logs to console.
   * Never throws — alerts should not crash the bot.
   */
  async send(message) {
    console.log(`📢 ALERT: ${message}`);

    if (!this.enabled) return false;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `❌ Telegram API error (${response.status}): ${errorBody}\n` +
          `   This usually means your bot token or chat ID is wrong.\n` +
          `   Double-check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your .env file.`
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error(
        `❌ Could not send Telegram alert: ${err.message}\n` +
        `   This might be a network issue. The bot will keep trying on the next alert.`
      );
      return false;
    }
  }

  /**
   * Send a disconnect alert — used when Binance WebSocket drops.
   */
  async sendDisconnectAlert(service) {
    await this.send(
      `🔌 <b>Disconnected from ${service}</b>\n\n` +
      `The bot lost its connection to ${service}. It will try to reconnect automatically, ` +
      `but trading is paused until the connection is restored.`
    );
  }

  /**
   * Send a startup notification so you know the bot is running.
   */
  async sendStartupAlert(mode) {
    await this.send(
      `🤖 <b>Trading bot started</b>\n\n` +
      `Mode: ${mode === 'live' ? '🔴 LIVE TRADING' : '📝 Paper Trading'}\n` +
      `Time: ${new Date().toLocaleString()}`
    );
  }

  /**
   * Test the connection — useful for preflight checks.
   */
  async testConnection() {
    if (!this.enabled) {
      return { ok: false, reason: 'Telegram credentials not configured (optional)' };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        return { ok: true, botName: data.result?.username };
      } else {
        return { ok: false, reason: `API returned status ${response.status}` };
      }
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }
}
