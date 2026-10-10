-- Fase 8.2 — icone do produto + sugestoes para o catalogo-mestre. SO ADICOES.
-- Tipos reais da BD (tenant_id e uuid) — ver 20261003_genesis2. product_id sem
-- FK: a sugestao e uma fotografia do produto no momento em que foi criado.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "MasterCatalog" ADD COLUMN IF NOT EXISTS "icon" TEXT;

CREATE TABLE IF NOT EXISTS "CatalogSuggestion" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "name_key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "barcode" TEXT,
    "cost_price" INTEGER NOT NULL DEFAULT 0,
    "sell_price" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    CONSTRAINT "CatalogSuggestion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatalogSuggestion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CatalogSuggestion_status_check" CHECK ("status" IN ('pending', 'added', 'dismissed'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogSuggestion_tenant_id_product_id_key" ON "CatalogSuggestion"("tenant_id", "product_id");
CREATE INDEX IF NOT EXISTS "CatalogSuggestion_status_business_type_name_key_idx" ON "CatalogSuggestion"("status", "business_type", "name_key");

-- RLS: a loja so escreve/le as suas; o super admin le tudo pelo cliente de sistema.
ALTER TABLE "CatalogSuggestion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_catalogsuggestion ON "CatalogSuggestion";
CREATE POLICY tenant_isolation_catalogsuggestion ON "CatalogSuggestion" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON "CatalogSuggestion" TO genesis_app;
