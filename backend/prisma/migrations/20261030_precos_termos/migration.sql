-- 30/10/2026: precos novos do fundador (Basico 8 000 MT/mes). So o valor por
-- omissao das contas NOVAS; as contas existentes mantem o preco que tem. Idempotente.
ALTER TABLE "Tenant" ALTER COLUMN "subscription_price" SET DEFAULT 800000;
-- 30/10/2026: o dono confirma que tem 18 anos ou mais e aceita os Termos e a
-- Politica de Privacidade ao pedir a conta. Guarda-se quando e que versao. So adicoes.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "terms_accepted_at" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "terms_version" TEXT;
