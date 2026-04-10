#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
# KRONOS SERVICE — START (after setup.sh has been run once)
# ══════════════════════════════════════════════════════════
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
source venv/bin/activate
exec python3 server.py
