-- Fase 8.7 (11/10/2026): o dono escolhe a hora do relatorio diario, o dia da
-- semana + hora do semanal e a hora do mensal (o dia do mensal e o
-- month_close_day que ja existe). SO ADICOES; valores por defeito para as
-- lojas existentes.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "daily_report_time" TEXT NOT NULL DEFAULT '21:00';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "weekly_report_day" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "weekly_report_time" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "monthly_report_time" TEXT NOT NULL DEFAULT '08:00';
DO $$ BEGIN
  ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_horarios_relatorios_validos" CHECK (
    "weekly_report_day" BETWEEN 0 AND 6
    AND "daily_report_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND "weekly_report_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND "monthly_report_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
