-- Genesis 2.1 / Fase 5.1 — despesas avulsas. SO ADICOES.
-- Tipos reais da BD (tenant_id e uuid) — ver 20261003_genesis2. created_by sem
-- FK, como em PosTerminal.

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Expense_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_amount_positive" CHECK ("amount" > 0)
);
CREATE INDEX IF NOT EXISTS "Expense_tenant_id_date_idx" ON "Expense"("tenant_id", "date");

-- RLS: mesmo padrao das outras tabelas com tenant_id (rls_v2.sql).
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_expense ON "Expense";
CREATE POLICY tenant_isolation_expense ON "Expense" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Expense" TO genesis_app;
