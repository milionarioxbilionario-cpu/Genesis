-- Migration: add discount_amount + daily_number to Sale (Etapa 4).
-- SQLite (dev local). Em Postgres de producao aplicar ALTER equivalente.

ALTER TABLE "Sale" ADD COLUMN "discount_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN "daily_number" INTEGER;

CREATE INDEX IF NOT EXISTS "Sale_tenant_created_idx" ON "Sale"("tenant_id", "created_at");
