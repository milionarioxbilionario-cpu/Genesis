-- Genesis 2.1 / Fase 3 — stock por lote e validades. SO ADICOES.
-- Tipos reais da BD (tenant_id e uuid; ids de Product sao text) — ver 20261003_genesis2.

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "expiry_alert_days" INTEGER NOT NULL DEFAULT 7;

ALTER TABLE "ShrinkageRecord" ADD COLUMN IF NOT EXISTS "lot_id" TEXT;
ALTER TABLE "ShrinkageRecord" ADD COLUMN IF NOT EXISTS "unit_cost" INTEGER;

CREATE TABLE IF NOT EXISTS "StockLot" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "stock_entry_id" TEXT,
    "quantity_remaining" INTEGER NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "unit_cost" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockLot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockLot_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockLot_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockLot_quantity_nonneg" CHECK ("quantity_remaining" >= 0)
);
CREATE INDEX IF NOT EXISTS "StockLot_tenant_id_product_id_expiry_date_idx" ON "StockLot"("tenant_id", "product_id", "expiry_date");

-- RLS: mesmo padrao das outras tabelas com tenant_id (rls_v2.sql).
ALTER TABLE "StockLot" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_stocklot ON "StockLot";
CREATE POLICY tenant_isolation_stocklot ON "StockLot" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "StockLot" TO genesis_app;

-- Preenchimento inicial: o stock que ja existe vira UM lote por produto
-- (com a validade do produto, se tinha). Idempotente: so produtos sem lotes.
INSERT INTO "StockLot" ("id", "tenant_id", "product_id", "quantity_remaining", "expiry_date", "unit_cost", "created_at")
SELECT gen_random_uuid()::text, p."tenant_id", p."id", p."stock_qty",
       CASE WHEN p."has_expiry" THEN p."expiry_date" ELSE NULL END,
       p."cost_price", CURRENT_TIMESTAMP
FROM "Product" p
WHERE p."stock_qty" > 0
  AND NOT EXISTS (SELECT 1 FROM "StockLot" l WHERE l."product_id" = p."id");
