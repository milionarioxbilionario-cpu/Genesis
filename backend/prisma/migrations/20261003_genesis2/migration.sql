-- Genesis 2.0 (2026-10-03) — SO ADICOES.
--
-- O `prisma migrate diff` contra a BD real propunha alteracoes DESTRUTIVAS por
-- causa de drift antigo (tenant_id e Tenant.id sao `uuid` na BD mas `String`
-- no schema; recriava a PK do Tenant). Foram excluidas de proposito. Este
-- ficheiro contem apenas o que o Genesis 2.0 acrescenta, com os tipos reais.
-- Aplicar com: npx prisma db execute --file prisma/migrations/20261003_genesis2/migration.sql

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "discount_free_pct" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "opening_time" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "closing_time" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pin_hash" TEXT;

CREATE TABLE IF NOT EXISTS "PosTerminal" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    CONSTRAINT "PosTerminal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PosTerminal_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PosTerminal_tenant_id_idx" ON "PosTerminal"("tenant_id");

-- RLS: a tabela nova nasce com isolamento por loja (mesmo padrao das outras).
ALTER TABLE "PosTerminal" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_posterminal ON "PosTerminal";
CREATE POLICY tenant_isolation_posterminal ON "PosTerminal"
  FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);
