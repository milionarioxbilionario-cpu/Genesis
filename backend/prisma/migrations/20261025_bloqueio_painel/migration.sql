-- Fase 12.4 (25/10/2026): bloqueio do painel do dono (PIN pessoal + Face ID).
-- SO ADICOES; idempotente. Contas existentes ficam sem PIN (o painel pede para o criar).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lock_pin_hash" TEXT;

CREATE TABLE IF NOT EXISTS "WebAuthnCredential" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "public_key" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WebAuthnCredential_user_id_idx" ON "WebAuthnCredential"("user_id");
CREATE INDEX IF NOT EXISTS "WebAuthnCredential_tenant_id_idx" ON "WebAuthnCredential"("tenant_id");

-- RLS: a mesma regra das outras tabelas com tenant_id (rls_v2.sql).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."WebAuthnCredential" TO genesis_app;
ALTER TABLE public."WebAuthnCredential" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_webauthncredential ON public."WebAuthnCredential";
CREATE POLICY tenant_isolation_webauthncredential ON public."WebAuthnCredential" FOR ALL TO genesis_app
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
