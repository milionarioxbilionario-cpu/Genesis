-- RLS policies to enforce tenant isolation. Run these in Supabase SQL editor for each table that has tenant_id.
-- This file assumes you will set the PostgreSQL setting `app.tenant_id` per connection:
-- SET app.tenant_id = 'THE_TENANT_UUID';

-- Example for one table (repeat for all tables that have tenant_id):

-- Enable RLS and create tenant isolation policy for tables with tenant_id

-- Tenants table: tenant_id is the row key, allow super admin to view all (tenant_id is NULL for super_admin actions)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL
  USING (true); -- allow access to tenants table from super admin workflows; application should restrict write

-- For tables with tenant_id, enable RLS and restrict by app.tenant_id

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON users
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id')::uuid);

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON products
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON sales
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Sale Items (sale_id links to sales which are protected; but add policy too)
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON sale_items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.tenant_id = current_setting('app.tenant_id')::uuid));

-- Stock Entries
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON stock_entries
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON employees
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON suppliers
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Fixed costs
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON fixed_costs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Debts
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON debts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Debt Payments
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON debt_payments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_payments.debt_id AND debts.tenant_id = current_setting('app.tenant_id')::uuid));

-- Demand captures
ALTER TABLE demand_captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON demand_captures
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Shrinkage records
ALTER TABLE shrinkage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON shrinkage_records
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Shift closings
ALTER TABLE shift_closings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON shift_closings
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Sale goals
ALTER TABLE sale_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON sale_goals
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Audit logs (allow tenant-specific and NULL for super admin actions)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON audit_logs
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id')::uuid);

-- Master catalogs (global across tenants; restrict writes if needed)
ALTER TABLE master_catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON master_catalogs
  FOR SELECT
  USING (true);

-- Product price history
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON product_price_history
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- NOTE: Run these statements in Supabase SQL editor. Replace or adapt policies for your Super Admin use-cases.
