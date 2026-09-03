#!/usr/bin/env bash
set -euo pipefail
for pid in $(ps -ef | grep '[n]ode src/index.js' | awk '{print $2}' || true); do
  echo "Stopping backend pid $pid"
  kill "$pid" || true
done
for pid in $(ps -ef | grep 'vite' | grep -v grep | awk '{print $2}' || true); do
  echo "Stopping frontend pid $pid"
  kill "$pid" || true
done
echo "Stopped Genesis local services."
