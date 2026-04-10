#!/usr/bin/env bash
# ══════════════════════════════════════════════════════
# DEPLOY — push local changes to production VPS
# Usage: npm run deploy
#        npm run deploy -- "optional commit message"
# ══════════════════════════════════════════════════════

set -e
VPS="root@64.227.33.170"
APP_DIR="~/mylittleagent-bot"
MSG="${1:-deploy: update $(date '+%Y-%m-%d %H:%M')}"

echo ""
echo "🚀 Deploying MyLittleAgent to production..."
echo ""

# ── 1. Commit anything staged / changed ──────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "📦 Committing local changes..."
  git add -A
  git commit -m "$MSG"
fi

# ── 2. Push to GitHub ─────────────────────────────────
echo "⬆️  Pushing to GitHub..."
git push origin main

# ── 3. Deploy to VPS ─────────────────────────────────
echo "🖥️  Deploying to VPS (${VPS})..."
ssh -o StrictHostKeyChecking=no "$VPS" "
  cd $APP_DIR
  git checkout -- logs/ 2>/dev/null || true
  git clean -fd kronos-service/__pycache__ 2>/dev/null || true
  git pull origin main
  pm2 restart mylittleagent
  pm2 restart kronos-service 2>/dev/null || true
  echo '✅ VPS restarted'
"

echo ""
echo "✅ Done! Live at https://trader.mylittleagent.co"
echo ""
