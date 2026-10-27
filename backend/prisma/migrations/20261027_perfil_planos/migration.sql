-- Fase 16 (27/10/2026): perfil do dono, planos e aniversario. SO ADICOES; idempotente.
-- Aniversario do dono: definido UMA vez ('AAAA-MM-DD'); ano do ultimo presente recolhido.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthday" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthday_gift_year" INTEGER;
-- Plano do estabelecimento: basic | premium; monthly | annual; Premium temporario (presente).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "plan_period" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "premium_from" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "premium_until" TIMESTAMP(3);
