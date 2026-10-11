-- Fase 8.4 (11/10/2026): vendas perdidas fora do catalogo. O caixista regista
-- o que o cliente pediu (texto livre), quantas unidades e, se souber, o preco
-- unitario (centavos). SO ADICOES + product_id passa a opcional (alarga, nao
-- apaga nada). Registos antigos: quantity = 1 (mesmo significado de antes).
ALTER TABLE "DemandCapture" ADD COLUMN IF NOT EXISTS "product_name" TEXT;
ALTER TABLE "DemandCapture" ADD COLUMN IF NOT EXISTS "name_key" TEXT;
ALTER TABLE "DemandCapture" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "DemandCapture" ADD COLUMN IF NOT EXISTS "unit_price" INTEGER;
ALTER TABLE "DemandCapture" ALTER COLUMN "product_id" DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE "DemandCapture" ADD CONSTRAINT "DemandCapture_produto_ou_nome"
    CHECK ("product_id" IS NOT NULL OR "product_name" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DemandCapture" ADD CONSTRAINT "DemandCapture_quantidade_positiva"
    CHECK ("quantity" > 0 AND ("unit_price" IS NULL OR "unit_price" >= 0));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "DemandCapture_fora_catalogo_idx" ON "DemandCapture" ("name_key", "requested_at") WHERE "product_id" IS NULL;
