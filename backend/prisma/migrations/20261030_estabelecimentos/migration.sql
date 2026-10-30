-- Etapa D (30/10/2026): varios estabelecimentos do mesmo dono. SO ADICOES; idempotente.
-- Cruza lojas, por isso a aplicacao (genesis_app) nao a le: so o cliente de sistema,
-- no middleware de autenticacao, valida que o dono pode actuar nesse estabelecimento.
CREATE TABLE IF NOT EXISTS "Membership" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_user_id_tenant_id_key" ON "Membership"("user_id", "tenant_id");
CREATE INDEX IF NOT EXISTS "Membership_tenant_id_idx" ON "Membership"("tenant_id");
ALTER TABLE public."Membership" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Membership" FROM genesis_app;
