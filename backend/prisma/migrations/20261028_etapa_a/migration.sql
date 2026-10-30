-- Etapa A (28/10/2026): correccoes rapidas. SO ADICOES (e um NOT NULL que passa a opcional); idempotente.
-- A5: taxa normal do IVA escolhida pelo dono (16% por omissao).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "vat_rate_std" INTEGER NOT NULL DEFAULT 16;
-- A9: subscricao activa ate esta data (depois: so leitura, sozinho).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscription_until" TIMESTAMP(3);
-- A11: venda personalizada (artigo fora do catalogo) ligada ou desligada pelo dono.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "custom_items_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "custom" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SaleItem" ALTER COLUMN "product_id" DROP NOT NULL;

-- A6: perfis que trabalham em cada terminal (sem linhas = todos os caixistas).
CREATE TABLE IF NOT EXISTS "PosTerminalMember" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "PosTerminalMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PosTerminalMember_terminal_id_user_id_key" ON "PosTerminalMember"("terminal_id", "user_id");
CREATE INDEX IF NOT EXISTS "PosTerminalMember_tenant_id_idx" ON "PosTerminalMember"("tenant_id");

-- RLS: a mesma regra das outras tabelas com tenant_id (rls_v2.sql).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."PosTerminalMember" TO genesis_app;
ALTER TABLE public."PosTerminalMember" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_posterminalmember ON public."PosTerminalMember";
CREATE POLICY tenant_isolation_posterminalmember ON public."PosTerminalMember" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
