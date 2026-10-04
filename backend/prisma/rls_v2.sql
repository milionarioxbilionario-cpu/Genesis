-- ============================================================================
-- GENESIS 2.0 — ROW LEVEL SECURITY A SERIO
--
-- Porque: o utilizador `postgres` tem rolbypassrls=true. Todas as politicas
-- antigas (rls.sql / rls_policies.sql) eram ignoradas: o isolamento entre lojas
-- dependia SO dos filtros da aplicacao. (Verificado 2026-10-03 em pg_roles.)
--
-- Agora:
--  - a aplicacao liga-se com o papel `genesis_app` (SEM bypassrls) para todos os
--    pedidos de uma loja, e define app.tenant_id em cada transaccao
--    (backend/src/utils/prisma.js);
--  - o papel `postgres` fica para o "cliente de sistema" (login, sessao, painel
--    admin, emparelhamento de terminais, scripts).
--  - sem app.tenant_id definido, as politicas devolvem ZERO linhas (falha
--    fechada) em vez de erro.
--
-- A criacao do papel e a senha estao em rls_v2_role.sql (correr primeiro, com
-- a senha gerada). Este ficheiro e idempotente.
-- ============================================================================

-- Permissoes do papel da aplicacao (DML apenas; nunca DDL).
GRANT USAGE ON SCHEMA public TO genesis_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO genesis_app;
REVOKE ALL ON TABLE public."_prisma_migrations" FROM genesis_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO genesis_app;

-- Expressao comum: tenant do pedido ou NULL (=> nenhuma linha).
-- NULLIF(current_setting('app.tenant_id', true), '')::uuid

DO $$
DECLARE t text;
BEGIN
  -- Tabelas com tenant_id directo.
  FOREACH t IN ARRAY ARRAY['Product','Sale','StockEntry','Employee','Supplier','FixedCost','Debt',
                           'DemandCapture','ShrinkageRecord','ShiftClosing','SaleGoal','ProductPriceHistory','PosTerminal','StockLot']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%s ON public.%I', lower(t), t);
    EXECUTE format('CREATE POLICY tenant_isolation_%s ON public.%I FOR ALL TO genesis_app
                    USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)
                    WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)', lower(t), t);
  END LOOP;
END $$;

-- Politicas antigas com nomes diferentes (do rls_policies.sql) — removidas.
DROP POLICY IF EXISTS tenant_isolation_pricehistory ON public."ProductPriceHistory";
DROP POLICY IF EXISTS tenant_isolation_shrinkage ON public."ShrinkageRecord";

-- Tenant: cada loja so ve a sua propria linha.
ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tenant ON public."Tenant";
CREATE POLICY tenant_isolation_tenant ON public."Tenant" FOR ALL TO genesis_app
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- User: so os da propria loja (os super_admin, com tenant_id NULL, ficam INVISIVEIS
-- — a politica antiga mostrava-os a todas as lojas).
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_user ON public."User";
CREATE POLICY tenant_isolation_user ON public."User" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- AuditLog: so os da loja (os do painel admin, tenant_id NULL, ficam invisiveis).
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_auditlog ON public."AuditLog";
CREATE POLICY tenant_isolation_auditlog ON public."AuditLog" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- Tabelas-filho: pelo pai.
ALTER TABLE public."SaleItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_saleitem ON public."SaleItem";
CREATE POLICY tenant_isolation_saleitem ON public."SaleItem" FOR ALL TO genesis_app
  USING (EXISTS (SELECT 1 FROM public."Sale" s WHERE s.id = sale_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public."Sale" s WHERE s.id = sale_id));

ALTER TABLE public."DebtPayment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_debtpayment ON public."DebtPayment";
CREATE POLICY tenant_isolation_debtpayment ON public."DebtPayment" FOR ALL TO genesis_app
  USING (EXISTS (SELECT 1 FROM public."Debt" d WHERE d.id = debt_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public."Debt" d WHERE d.id = debt_id));

-- Catalogo-mestre: so leitura para a aplicacao.
ALTER TABLE public."MasterCatalog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_catalog_read ON public."MasterCatalog";
CREATE POLICY master_catalog_read ON public."MasterCatalog" FOR SELECT TO genesis_app USING (true);

-- device_keys (legado, ja nao usado): sem acesso para a aplicacao.
REVOKE ALL ON TABLE public.device_keys FROM genesis_app;
