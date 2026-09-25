-- Add recommended indexes for performance
-- Run this on your Postgres (Supabase) instance or include in a migration

-- Products: frequent filter by tenant and active
CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON "Product" (tenant_id, is_active);

-- Sales: queries by tenant and created_at range
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at ON "Sale" (tenant_id, created_at);

-- SaleItem: fast lookup by sale_id
CREATE INDEX IF NOT EXISTS idx_saleitem_sale_id ON "SaleItem" (sale_id);

-- Debts: frequent filters
CREATE INDEX IF NOT EXISTS idx_debts_tenant_status_due ON "Debt" (tenant_id, status, due_date);

-- StockEntry: lookup by product
CREATE INDEX IF NOT EXISTS idx_stockentry_product ON "StockEntry" (product_id);

-- AuditLog: queries by tenant and created_at
CREATE INDEX IF NOT EXISTS idx_auditlog_tenant_created_at ON "AuditLog" (tenant_id, created_at);

-- SaleGoal: tenant/month/year
CREATE INDEX IF NOT EXISTS idx_salegoal_tenant_month_year ON "SaleGoal" (tenant_id, year, month);

-- Product price history: lookup by product
CREATE INDEX IF NOT EXISTS idx_pricehistory_product ON "ProductPriceHistory" (product_id);

-- Consider creating partial indexes for hot paths (e.g., products with stock_qty <= min_stock)
-- Example (Postgres supports partial indexes):
-- CREATE INDEX idx_products_low_stock ON "Product" (tenant_id) WHERE stock_qty <= min_stock;

-- End of index suggestions
