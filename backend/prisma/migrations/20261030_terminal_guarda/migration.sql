-- Etapa B (30/10/2026): terminal do guarda. SO ADICOES; idempotente.
-- Um recibo conferido uma vez (sale_id unico); a mesma regra RLS das outras tabelas.
CREATE TABLE IF NOT EXISTS "ReceiptCheck" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sale_id" TEXT NOT NULL,
    "guard_user_id" TEXT NOT NULL,
    "terminal_id" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReceiptCheck_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReceiptCheck_sale_id_key" ON "ReceiptCheck"("sale_id");
CREATE INDEX IF NOT EXISTS "ReceiptCheck_tenant_id_idx" ON "ReceiptCheck"("tenant_id");

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."ReceiptCheck" TO genesis_app;
ALTER TABLE public."ReceiptCheck" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_receiptcheck ON public."ReceiptCheck";
CREATE POLICY tenant_isolation_receiptcheck ON public."ReceiptCheck" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
