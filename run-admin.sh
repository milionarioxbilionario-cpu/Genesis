#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Helper script to start local stack and open the Super Admin login page
# Usage: ./run-admin.sh

# Start the standard run-local.sh which starts backend and frontend in background
if [ -x "./run-local.sh" ]; then
  echo "Starting local stack using run-local.sh..."
  ./run-local.sh
else
  echo "run-local.sh not found. Please start the backend and frontend manually before opening the admin panel."
fi

ADMIN_URL="http://localhost:5173/admin/login"

echo "Waiting for frontend to be ready at $ADMIN_URL..."
# Wait until frontend responds then open the admin URL
for i in {1..30}; do
  if curl -sS http://127.0.0.1:5173/ >/dev/null 2>&1; then
    echo "Frontend ready, opening Super Admin login: $ADMIN_URL"
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$ADMIN_URL" || true
    elif command -v open >/dev/null 2>&1; then
      open "$ADMIN_URL" || true
    else
      echo "Please open your browser and visit: $ADMIN_URL"
    fi
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for frontend. Please check logs (logs/frontend.log) and try again."
exit 1
