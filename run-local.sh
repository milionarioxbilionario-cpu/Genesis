#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs

echo "Stopping any existing backend instances..."
for pid in $(ps -ef | grep '[n]ode src/index.js' | awk '{print $2}' || true); do
  if [ -n "$pid" ]; then
    echo "Killing backend pid $pid"
    kill "$pid" || true
  fi
done

echo "Stopping existing vite instances..."
for pid in $(ps -ef | grep 'vite' | grep -v grep | awk '{print $2}' || true); do
  if [ -n "$pid" ]; then
    echo "Killing vite pid $pid"
    kill "$pid" || true
  fi
done

# Start backend
echo "Starting backend..."
cd backend
nohup node src/index.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "backend pid: $BACKEND_PID"
cd ..

# Start frontend
echo "Starting frontend..."
cd frontend
# Ensure vite cache is writable (fixes EACCES if .vite was created by sudo earlier)
if [ -d "node_modules/.vite" ]; then
  echo "Fixing .vite cache ownership"
  chown -R $(id -u):$(id -g) node_modules/.vite 2>/dev/null || true
fi
nohup npm run dev -- --host > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "frontend pid: $FRONTEND_PID"
cd ..

# Wait for servers
echo "Waiting for backend to be ready..."
for i in {1..25}; do
  if curl -sS http://127.0.0.1:4000/ >/dev/null 2>&1; then
    echo "backend ready"
    break
  fi
  sleep 1
done

echo "Waiting for frontend to be ready..."
for i in {1..25}; do
  if curl -sS http://127.0.0.1:5173/ >/dev/null 2>&1; then
    echo "frontend ready"
    break
  fi
  sleep 1
done

# Open browser to /login if xdg-open present
if command -v xdg-open >/dev/null 2>&1; then
  echo "Opening browser at http://localhost:5173/login"
  xdg-open "http://localhost:5173/login" || true
else
  echo "xdg-open not available; open http://localhost:5173/login manually"
fi

echo "Done. Backend pid: $BACKEND_PID, Frontend pid: $FRONTEND_PID"
