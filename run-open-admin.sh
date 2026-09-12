#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Simple helper: only open the Super Admin login URL in the default browser
# Does not start servers. Use when backend and frontend are already running.

ADMIN_URL="http://localhost:5175/login"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$ADMIN_URL" || true
elif command -v open >/dev/null 2>&1; then
  open "$ADMIN_URL" || true
else
  echo "Please open your browser and visit: $ADMIN_URL"
fi
