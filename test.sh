#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Checking project health..."

echo "- backend health"
curl -fsS http://127.0.0.1:4000/ >/dev/null || { echo "Backend not responding on port 4000"; exit 1; }

echo "- frontend health"
curl -fsS http://127.0.0.1:5173/ >/dev/null || { echo "Frontend not responding on port 5173"; exit 1; }

echo "- login smoke test"
COOKIE_FILE=$(mktemp)
LOGIN_RESPONSE=$(curl -fsS -c "$COOKIE_FILE" -X POST http://127.0.0.1:4000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"owner@genesis.local","password":"<password-demo-removida-do-historico>"}')

echo "$LOGIN_RESPONSE" | grep -q '"role"' || { echo 'Login smoke test failed'; exit 1; }

echo "- product list smoke test"
curl -fsS -b "$COOKIE_FILE" http://127.0.0.1:4000/api/products >/dev/null || { echo 'Product list smoke test failed'; exit 1; }

echo "Genesis smoke tests passed."
