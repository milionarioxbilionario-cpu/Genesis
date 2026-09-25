-- RLS policies for tenant isolation
-- Run these statements in the Supabase SQL editor as a project admin (or via psql)

-- For each table that has tenant_id, enable RLS and create a tenant_isolation policy
-- Assumes the application will set the current Postgres setting app.tenant_id to the
-- tenant UUID before executing queries (SET app.tenant_id = '...')

-- List of tables to apply RLS to (those with tenant_id):
-- Tenant, User (tenant_id nullable), Product, Sale, SaleItem (sale -> sale has tenant), StockEntry,
-- Employee, Supplier, FixedCost, Debt, DebtPayment (via debt), DemandCapture,
-- ShrinkageRecord, ShiftClosing, SaleGoal, AuditLog (tenant_id nullable), ProductPriceHistory

-- NOTE: For some tables (like SaleItem, DebtPayment) where tenant_id is not a direct column,
-- policies should be applied on the parent table (Sale, Debt). The statements below apply
-- to tables that have an explicit tenant_id column. For child tables that do not have tenant_id
-- enforce via triggers or rely on parent RLS + transaction-level checks.

-- Helper template (example):
-- ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON public.<table_name>
--   FOR ALL
--   USING (tenant_id = current_setting('app.tenant_id'));

-- Apply for tables that have tenant_id column

ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tenant ON public."Tenant"
  FOR ALL
  USING (true); -- allow super-admin processes to manage tenants; application-level checks required

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_user ON public."User"
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_product ON public."Product"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."Sale" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sale ON public."Sale"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."SaleItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_saleitem ON public."SaleItem"
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public."Sale" s WHERE s.id = sale_id AND s.tenant_id = current_setting('app.tenant_id')));

ALTER TABLE public."StockEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_stockentry ON public."StockEntry"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."Employee" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_employee ON public."Employee"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."Supplier" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_supplier ON public."Supplier"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."FixedCost" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_fixedcost ON public."FixedCost"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."Debt" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_debt ON public."Debt"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."DebtPayment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_debtpayment ON public."DebtPayment"
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public."Debt" d WHERE d.id = debt_id AND d.tenant_id = current_setting('app.tenant_id')));

ALTER TABLE public."DemandCapture" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_demandcapture ON public."DemandCapture"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."ShrinkageRecord" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_shrinkage ON public."ShrinkageRecord"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."ShiftClosing" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_shiftclosing ON public."ShiftClosing"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."SaleGoal" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_salegoal ON public."SaleGoal"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_auditlog ON public."AuditLog"
  FOR ALL
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id'));

ALTER TABLE public."ProductPriceHistory" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_pricehistory ON public."ProductPriceHistory"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id'));

-- End of RLS script
-- IMPORTANT:
-- 1) After running this script, the application must set the Postgres setting `app.tenant_id` before making queries
--    Example: SET app.tenant_id = '00000000-0000-0000-0000-000000000000';
-- 2) Review UPDATE policies if you allow clients to change tenant-linked rows: you may need WITH CHECK clauses
-- 3) For endpoints used by Super Admin, use a service_role or server-side function that temporarily sets the session variable

