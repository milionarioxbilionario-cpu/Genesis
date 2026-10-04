-- Genesis 2.1 / Fase 5.2 — lista de compras. SO ADICOES.
-- Tipos reais da BD (tenant_id e uuid) — ver 20261003_genesis2.

CREATE TABLE IF NOT EXISTS "ShoppingList" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "supplier_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ShoppingList_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShoppingList_status_check" CHECK ("status" IN ('draft', 'sent', 'received'))
);
CREATE INDEX IF NOT EXISTS "ShoppingList_tenant_id_created_at_idx" ON "ShoppingList"("tenant_id", "created_at");

CREATE TABLE IF NOT EXISTS "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "list_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" INTEGER NOT NULL,
    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ShoppingListItem_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingListItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShoppingListItem_quantity_positive" CHECK ("quantity" > 0),
    CONSTRAINT "ShoppingListItem_unit_cost_nonneg" CHECK ("unit_cost" >= 0)
);
CREATE INDEX IF NOT EXISTS "ShoppingListItem_tenant_id_list_id_idx" ON "ShoppingListItem"("tenant_id", "list_id");

-- RLS: mesmo padrao das outras tabelas com tenant_id (rls_v2.sql).
ALTER TABLE "ShoppingList" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_shoppinglist ON "ShoppingList";
CREATE POLICY tenant_isolation_shoppinglist ON "ShoppingList" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "ShoppingList" TO genesis_app;

ALTER TABLE "ShoppingListItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_shoppinglistitem ON "ShoppingListItem";
CREATE POLICY tenant_isolation_shoppinglistitem ON "ShoppingListItem" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "ShoppingListItem" TO genesis_app;
