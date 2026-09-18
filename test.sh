#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Lê uma variável de backend/.env sem executar o ficheiro
env_value() {
  grep -E "^$1=" backend/.env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"' || true
}

OWNER_EMAIL="${DEMO_OWNER_EMAIL:-$(env_value DEMO_OWNER_EMAIL)}"
OWNER_PASSWORD="${DEMO_OWNER_PASSWORD:-$(env_value DEMO_OWNER_PASSWORD)}"
OWNER_EMAIL="${OWNER_EMAIL:-owner@genesis.local}"

if [ -z "$OWNER_PASSWORD" ]; then
  echo "DEMO_OWNER_PASSWORD não definida. Define-a em backend/.env (ver backend/.env.example)." >&2
  exit 1
fi

echo "Checking project health..."

echo "- backend health"
curl -fsS http://127.0.0.1:4000/ >/dev/null || { echo "Backend not responding on port 4000"; exit 1; }

echo "- frontend health"
curl -fsS http://127.0.0.1:5173/ >/dev/null || { echo "Frontend not responding on port 5173"; exit 1; }

echo "- login smoke test"
COOKIE_FILE=$(mktemp)
LOGIN_RESPONSE=$(curl -fsS -c "$COOKIE_FILE" -X POST http://127.0.0.1:4000/api/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$OWNER_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | grep -q '"role"' || { echo 'Login smoke test failed'; exit 1; }

echo "- product list smoke test"
curl -fsS -b "$COOKIE_FILE" http://127.0.0.1:4000/api/products >/dev/null || { echo 'Product list smoke test failed'; exit 1; }

echo "Genesis smoke tests passed."
