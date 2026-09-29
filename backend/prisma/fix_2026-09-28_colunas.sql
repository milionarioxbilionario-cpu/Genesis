-- ===========================================================================
-- Migracao CIRURGICA de 28/09 —Executada com `prisma db execute`.
--
-- Porque nao `prisma db push`? Porque o push completo tentava converter
-- varias colunas de `uuid` para `text` e o Postgres recusa:
--     ERROR: cannot alter type of a column used in a policy definition
--     DETAIL: policy tenant_isolation_auditlog on table "AuditLog" ...
-- As 16 politicas de RLS que isolam os dados entre empresas nao podem ser
-- destruidas so por mudar um tipo de coluna. Este script faz o MINIMO:
-- adicionar as colunas/tabelas que faltam e que fazem o login, o login com
-- Google e o pedido de conta devolverem 500.
--
-- ESTA SCRIPT E SEGURA: so adiciona, nunca apaga nem altera dados.
-- ===========================================================================

-- 1) A CAUSA RAIZ: faltava esta coluna. Toda a query de login faz
--    `include: { tenant: true }`, que traz TODAS as colunas de "Tenant".
--    Sem esta coluna o Prisma lancava
--    "The column `Tenant.onboarding_completed` does not exist" e a rota
--    devolvia 500 "Erro interno no servidor" — com a senha certa ou errada.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- 2) Colunas do modelo Sale que faltam (descontos e numeracao de recibo).
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "daily_number" INTEGER;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "discount_amount" INTEGER NOT NULL DEFAULT 0;

-- 3) Indice usado pelas consultas de relatorios/POS.
CREATE INDEX IF NOT EXISTS "Sale_tenant_created_idx" ON "Sale"("tenant_id", "created_at");

-- 4) Tabela de chaves de dispositivo (POS). O schema marca o modelo como
--    @@ignore, por isso o `db push` nunca a criava.
CREATE TABLE IF NOT EXISTS "device_keys" (
    "id" TEXT PRIMARY KEY,
    "device_name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "metadata" TEXT
);
