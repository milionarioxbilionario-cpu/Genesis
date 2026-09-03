#!/bin/bash
# Test harness for Genesis API-level E2E checks
# Usage: cd backend && ../docs/test_harness.sh

set -euo pipefail
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR/backend"

echo "Running API-level E2E: e2e_test2.js"
node scripts/e2e_test2.js

echo "Running shift-closing E2E: shift_closing_e2e.js"
node scripts/shift_closing_e2e.js

echo "Running RLS validation"
node scripts/rls_validation.js

echo "All harness steps completed successfully"