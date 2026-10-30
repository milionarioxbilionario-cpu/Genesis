-- Etapa A (28/10/2026): «Avise-me quando estiver pronto» dos modos de negocio ainda
-- por construir. SO ADICOES; idempotente. Sem tenant_id (vem do site publico): so o
-- cliente de sistema (admin) le e escreve; o papel da aplicacao nao ve nada (RLS sem politica).
CREATE TABLE IF NOT EXISTS "ModeWaitlist" (
    "id" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModeWaitlist_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ModeWaitlist_business_type_idx" ON "ModeWaitlist"("business_type");
CREATE INDEX IF NOT EXISTS "ModeWaitlist_phone_idx" ON "ModeWaitlist"("phone");
ALTER TABLE public."ModeWaitlist" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."ModeWaitlist" FROM genesis_app;
