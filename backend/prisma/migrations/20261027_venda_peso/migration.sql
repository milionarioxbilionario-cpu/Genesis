-- Fase 15.5 (27/10/2026): venda ao peso / medida. SO ADICOES; idempotente.
-- unit: 'un' (unidades, como sempre) | 'kg' | 'l' | 'm'. Nos produtos a peso/medida
-- todas as quantidades ficam em milesimos inteiros (g, ml, mm); o preco e por kg/l/m.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'un';
-- Unidade do produto no momento da venda (o recibo e os relatorios fazem as contas com ela).
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'un';
