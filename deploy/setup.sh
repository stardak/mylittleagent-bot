#!/bin/bash
# ══════════════════════════════════════════════════════════════
# MyLittleAgent.co — VPS Setup Script
# Run this on a fresh Ubuntu 22.04+ VPS
# ══════════════════════════════════════════════════════════════

set -e

echo "🚀 MyLittleAgent VPS Setup"
echo "════════════════════════════"

# 1. System updates
echo "📦 Installing system dependencies..."
sudo apt update -qq
sudo apt install -y -qq curl git

# 2. Install Node.js 20
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y -qq nodejs
fi
echo "✅ Node.js $(node -v)"

# 3. Install PM2
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  sudo npm install -g pm2
fi
echo "✅ PM2 $(pm2 -v)"

# 4. Install Cloudflared
if ! command -v cloudflared &> /dev/null; then
  echo "📦 Installing Cloudflared..."
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  rm cloudflared.deb
fi
echo "✅ Cloudflared $(cloudflared --version)"

# 5. Clone repo (if not already)
APP_DIR="$HOME/mylittleagent-bot"
if [ ! -d "$APP_DIR" ]; then
  echo "📦 Cloning repo..."
  git clone https://github.com/stardak/mylittleagent-bot.git "$APP_DIR"
fi
cd "$APP_DIR"

# 6. Install dependencies
echo "📦 Installing npm packages..."
npm install --production

# 7. Create logs directory
mkdir -p logs

# 8. Check for .env
if [ ! -f .env ]; then
  echo ""
  echo "⚠️  No .env file found!"
  echo "   Copy your .env from your local machine:"
  echo "   scp /Volumes/LaCie/TraderApp/.env root@YOUR_VPS_IP:~/mylittleagent-bot/.env"
  echo ""
  exit 1
fi

# 9. Start with PM2
echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# 10. Set PM2 to start on boot
echo "🔄 Setting up auto-start on boot..."
pm2 startup | tail -1 | bash

echo ""
echo "════════════════════════════════════════════"
echo "✅ MyLittleAgent is running 24/7!"
echo ""
echo "   Dashboard: http://localhost:3000"
echo "   Logs:      pm2 logs mylittleagent"
echo "   Status:    pm2 status"
echo "   Restart:   pm2 restart mylittleagent"
echo "   Stop:      pm2 stop mylittleagent"
echo "════════════════════════════════════════════"
