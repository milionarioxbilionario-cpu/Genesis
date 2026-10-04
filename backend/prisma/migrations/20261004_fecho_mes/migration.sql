-- Genesis 2.1 / Fase 5.3 — dia do fecho do mes. SO ADICOES.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "month_close_day" INTEGER NOT NULL DEFAULT 1;
DO $$ BEGIN
  ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_month_close_day_range" CHECK ("month_close_day" BETWEEN 1 AND 28);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
