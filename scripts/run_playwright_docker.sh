#!/usr/bin/env bash
# Helper to run Playwright tests inside official Playwright Docker image.
# Usage:
#   TEST_CASHIER_EMAIL=... TEST_CASHIER_PASSWORD=... API_BASE=http://host.docker.internal:4000 FRONTEND=http://host.docker.internal:5174 ./scripts/run_playwright_docker.sh

set -euo pipefail
ROOT_DIR="/work"
CONTAINER_IMAGE="mcr.microsoft.com/playwright:focal"

# Recommended: use host.docker.internal for Docker Desktop; on Linux use --network=host instead.
# This script mounts the repo into /work and runs the Playwright test script.

if [ "$(id -u)" -eq 0 ]; then
  echo "Warning: running as root inside container"
fi

docker run --rm \
  -e TEST_CASHIER_EMAIL=${TEST_CASHIER_EMAIL:-} \
  -e TEST_CASHIER_PASSWORD=${TEST_CASHIER_PASSWORD:-} \
  -e API_BASE=${API_BASE:-http://host.docker.internal:4000} \
  -e FRONTEND=${FRONTEND:-http://host.docker.internal:5174} \
  -v "$(pwd)":/work \
  -w /work \
  --network host \
  $CONTAINER_IMAGE \
  bash -lc "cd frontend && node tests/playwright_offline_sync_test.js"
