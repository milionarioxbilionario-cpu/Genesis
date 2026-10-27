-- Fase 15.4 (27/10/2026): pagamento misto. SO ADICOES; idempotente.
-- Venda com payment_method = 'mixed' tem aqui as partes (metodo + valor em centavos);
-- as outras vendas continuam so com Sale.payment_method (sem linhas aqui).
CREATE TABLE IF NOT EXISTS "SalePayment" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sale_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SalePayment_amount_positive" CHECK ("amount" > 0)
);
CREATE INDEX IF NOT EXISTS "SalePayment_sale_id_idx" ON "SalePayment"("sale_id");
CREATE INDEX IF NOT EXISTS "SalePayment_tenant_id_idx" ON "SalePayment"("tenant_id");

-- RLS: a mesma regra das outras tabelas com tenant_id (rls_v2.sql).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."SalePayment" TO genesis_app;
ALTER TABLE public."SalePayment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_salepayment ON public."SalePayment";
CREATE POLICY tenant_isolation_salepayment ON public."SalePayment" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
