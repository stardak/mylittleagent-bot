#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
# KRONOS SERVICE — SETUP + START
# Clones Kronos repo, creates venv, installs deps, starts server.
# Run once: bash kronos-service/setup.sh
# Subsequent starts: bash kronos-service/start.sh
# ══════════════════════════════════════════════════════════

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "══════════════════════════════════════════════════"
echo "  🔮 Kronos Financial Foundation Model — Setup"
echo "══════════════════════════════════════════════════"

# ── 1. Clone Kronos repo if not present ──────────────────
if [ ! -d "Kronos" ]; then
  echo "📦 Cloning Kronos repository..."
  git clone https://github.com/shiyu-coder/Kronos.git
  echo "✅ Cloned."
else
  echo "✅ Kronos repo already present."
fi

# ── 2. Create Python venv ─────────────────────────────────
if [ ! -d "venv" ]; then
  echo "🐍 Creating Python virtual environment..."
  python3 -m venv venv
  echo "✅ venv created."
fi

source venv/bin/activate

# ── 3. Install dependencies ───────────────────────────────
echo "📚 Installing Python dependencies (first run may take a few minutes)..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# Install Kronos's own dependencies
if [ -f "Kronos/requirements.txt" ]; then
  pip install --quiet -r Kronos/requirements.txt
fi

echo "✅ Dependencies installed."

# ── 4. Pre-download model checkpoint (optional but useful) ─
echo ""
echo "🤖 Pre-downloading Kronos model weights from HuggingFace..."
echo "   (This downloads ~500MB–1GB on first run. Cached after that.)"
python3 - <<'EOF'
import sys
sys.path.insert(0, 'Kronos')
try:
    from model import Kronos, KronosTokenizer
    print("  Downloading tokenizer...")
    KronosTokenizer.from_pretrained("NeoQuasar/Kronos-Tokenizer-base")
    print("  Downloading Kronos-small model...")
    Kronos.from_pretrained("NeoQuasar/Kronos-small")
    print("✅ Model weights cached successfully.")
except Exception as e:
    print(f"⚠️  Pre-download failed (will retry on first request): {e}")
EOF

echo ""
echo "✅ Setup complete! Starting Kronos service on port 5001..."
echo ""

# ── 5. Start the server ───────────────────────────────────
exec python3 server.py
