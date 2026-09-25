#!/usr/bin/env bash
set -euo pipefail

# run_phase0.sh
# Automates Phase 0 steps that require DB access:
#  - npm install
#  - npx prisma generate
#  - npx prisma migrate dev --name init
#  - apply prisma/rls.sql via psql
#  - insert two tenant test rows and products
#  - test tenant isolation with SET LOCAL app.tenant_id

# USAGE:
# 1) Open the VS Code terminal connected to MCP and cd to /path/to/Genesis/backend
# 2) Ensure DATABASE_URL is set in the environment or defined in .env in this folder.
#    If you have a .env file with DATABASE_URL, export it first, e.g.:
#      export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.host.supabase.co:5432/postgres'
# 3) Run: bash scripts/run_phase0.sh
# 4) Paste the full output back here so I can verify and continue.

# Check for DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set in the environment."
  echo "Set it first, for example:\n  export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.host.supabase.co:5432/postgres'"
  exit 1
fi

echo "Step 1: npm install (backend)"
npm install --no-audit --no-fund

echo "\nStep 2: npx prisma generate"
npx prisma generate

echo "\nStep 3: npx prisma migrate dev --name init"
# This will interactively create and apply migrations. If running in non-interactive CI, consider --create-only then migrate deploy.
npx prisma migrate dev --name init

echo "\nStep 4: apply RLS SQL (prisma/rls.sql) via psql"
if command -v psql >/dev/null 2>&1; then
  echo "psql found. Applying prisma/rls.sql..."
  # Use PGPASSWORD if DATABASE_URL contains password; psql will parse the URL. We'll extract password for PGPASSWORD if present to avoid prompts.
  # Parse password (simple): extract between //user:pass@ in DATABASE_URL
  if echo "$DATABASE_URL" | grep -q "@"; then
    # Try to extract password safely
    PW=$(echo "$DATABASE_URL" | sed -n 's|.*//[^:]*:\([^@]*\)@.*|\1|p') || true
    if [ -n "$PW" ]; then
      export PGPASSWORD="$PW"
    fi
  fi
  psql "$DATABASE_URL" -f prisma/rls.sql || {
    echo "psql failed to apply rls.sql. See instructions to run the SQL in Supabase SQL Editor.";
  }
else
  echo "psql not installed in this environment. Please open Supabase Studio → SQL Editor and run the file prisma/rls.sql manually."
fi

echo "\nStep 5: Insert test tenants and test products via psql"
SQL="\
-- Insert two tenants\n\
INSERT INTO tenants (id, name, owner_name, business_type, location, phone, status, created_at) VALUES\n  ('11111111-1111-1111-1111-111111111111','Tenant A','Dono A','mercearia','Zona A','+258800000001','active', now()),\n  ('22222222-2222-2222-2222-222222222222','Tenant B','Dono B','padaria','Zona B','+258800000002','active', now());\n\
-- Insert products for each tenant\n\
INSERT INTO products (id, tenant_id, name, category, cost_price, sell_price, stock_qty, created_at) VALUES\n  ('a1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','Arroz Teste 1kg','mercearia',15000,20000,50, now()),\n  ('b2222222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222','Pão Teste','padaria',5000,8000,100, now());\n\
-- Verify inserts\n\
SELECT 'TENANTS' as what, id, name, status FROM tenants WHERE id IN ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');\n\
"

if command -v psql >/dev/null 2>&1; then
  echo "Running insertion SQL via psql..."
  echo "$SQL" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 || echo "Insertion may have failed or rows may already exist."
else
  echo "psql not found. Please run the following SQL in Supabase SQL Editor:\n"
  echo "$SQL"
fi

echo "\nStep 6: Test RLS isolation with SET LOCAL app.tenant_id and SELECT from products"
TESTSQL="\
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';\nSELECT 'PRODUCTS_TENANT_A' as test, id, tenant_id, name FROM products;\n\nSET LOCAL app.tenant_id = '22222222-2222-2222-2222-222222222222';\nSELECT 'PRODUCTS_TENANT_B' as test, id, tenant_id, name FROM products;\n\nRESET app.tenant_id;\nSELECT 'PRODUCTS_NO_TENANT' as test, id, tenant_id, name FROM products LIMIT 10;\n"

if command -v psql >/dev/null 2>&1; then
  echo "Running RLS test queries via psql..."
  echo "$TESTSQL" | psql "$DATABASE_URL" || echo "RLS test queries failed."
else
  echo "psql not found. Please run the following test queries in Supabase SQL Editor (three blocks):\n"
  echo "$TESTSQL"
fi

echo "\nPhase 0 script finished. Please paste the full terminal output here so I can verify results and mark Phase 0 complete." 
