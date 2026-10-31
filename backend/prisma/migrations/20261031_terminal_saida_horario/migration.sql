-- 31/10/2026 (so acrescenta; pode correr mais de uma vez)
-- Terminal de saida (guarda): o terminal mostra so os perfis de guarda.
ALTER TABLE "PosTerminal" ADD COLUMN IF NOT EXISTS "purpose" TEXT NOT NULL DEFAULT 'counter';
-- Horario a serio: por dia, 24 h, depois da meia-noite, pausas, feriados (JSON).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "hours_json" TEXT;
-- Estabelecimento encerrado pelo dono (so leitura; pode reabrir durante 30 dias).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(3);
