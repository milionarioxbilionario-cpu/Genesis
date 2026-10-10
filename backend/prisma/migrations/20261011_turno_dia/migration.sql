-- Turno por dia (10/10/2026): o fecho guarda o dia de Maputo em que o turno
-- comecou (um fecho por dia). SO ADICOES; fechos antigos ficam a NULL e contam
-- no dia (de Maputo) em que fecharam (utils/shiftDay.js closingDay).
ALTER TABLE "ShiftClosing" ADD COLUMN IF NOT EXISTS "shift_day" TEXT;
