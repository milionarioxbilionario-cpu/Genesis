-- Fase 9.3 (17/10/2026): cada pessoa escolhe a lingua da interface (PT/EN).
-- SO ADICOES; as contas existentes ficam em portugues.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'pt';
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_language_valida" CHECK ("language" IN ('pt', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
