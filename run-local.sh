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
if [ -d "node_modules/.vite" ]; then
  echo "Fixing .vite cache ownership"
  chown -R $(id -u):$(id -g) node_modules/.vite 2>/dev/null || true
fi
nohup npm run dev -- --host > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "frontend pid: $FRONTEND_PID"
cd ..

# Start admin frontend
echo "Starting admin frontend..."
cd admin-frontend
if [ -d "node_modules" ]; then
  echo "Admin frontend dependencies present"
fi
nohup npm run dev > ../logs/admin-frontend.log 2>&1 &
ADMIN_FRONTEND_PID=$!
echo "admin frontend pid: $ADMIN_FRONTEND_PID"
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

echo "Waiting for admin frontend to be ready..."
for i in {1..25}; do
  if curl -sS http://127.0.0.1:5175/ >/dev/null 2>&1; then
    echo "admin frontend ready"
    break
  fi
  sleep 1
done

TARGET_HOST="http://localhost:5173"
TARGET_PATH="/login"
if [ "${1:-}" = "--admin" ] || [ "${ADMIN_OPEN:-}" = "true" ]; then
  TARGET_HOST="http://localhost:5175"
  TARGET_PATH="/login"
fi

if command -v xdg-open >/dev/null 2>&1; then
  echo "Opening browser at ${TARGET_HOST}${TARGET_PATH}"
  xdg-open "${TARGET_HOST}${TARGET_PATH}" || true
elif command -v open >/dev/null 2>&1; then
  echo "Opening browser at ${TARGET_HOST}${TARGET_PATH}"
  open "${TARGET_HOST}${TARGET_PATH}" || true
else
  echo "Please open ${TARGET_HOST}${TARGET_PATH} manually"
fi

echo "Done. Backend pid: $BACKEND_PID, Frontend pid: $FRONTEND_PID, Admin frontend pid: $ADMIN_FRONTEND_PID"
