-- Fase 8.5 (11/10/2026): o dono escolhe quantos meses a auditoria guarda
-- (minimo 2 = o mes corrente + o anterior; decisao do fundador 10/10).
-- SO ADICOES.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "audit_retention_months" INTEGER NOT NULL DEFAULT 2;
DO $$ BEGIN
  ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_retencao_auditoria_minimo"
    CHECK ("audit_retention_months" >= 2 AND "audit_retention_months" <= 24);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Lista do dono por loja + data (ja criado por add_indexes.sql em algumas BDs).
CREATE INDEX IF NOT EXISTS "idx_auditlog_tenant_created_at" ON "AuditLog" ("tenant_id", "created_at");
