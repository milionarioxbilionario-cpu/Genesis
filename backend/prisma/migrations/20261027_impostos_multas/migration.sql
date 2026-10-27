-- Fases 15.2 e 15.3 (27/10/2026): impostos, INSS, multas e taxas anuais. SO ADICOES; idempotente.
-- vat_mode: 'none' (sem imposto nas vendas) | 'iva' (16%, Lei 22/2022, precos com IVA incluido)
--           | 'ispc' (imposto simplificado sobre o volume de negocios, Lei 9/2025).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "vat_mode" TEXT NOT NULL DEFAULT 'none';
-- % do INSS pago pelo patrao sobre os salarios (0 = trabalhadores nao inscritos; 4 = taxa legal).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "inss_employer_pct" INTEGER NOT NULL DEFAULT 0;
-- Taxa do IVA do produto em % inteiro: NULL = taxa normal (16), 0 = isento.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vat_rate" INTEGER;
-- IVA incluido na venda (centavos, depois do desconto) e a taxa de cada linha no momento da venda.
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "vat_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "vat_rate" INTEGER;
-- 15.3: multas sao despesas de tipo proprio, com a entidade que multou.
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "entity" TEXT;
-- 15.3: custo fixo mensal ou anual (anual = repartido por 12 meses).
ALTER TABLE "FixedCost" ADD COLUMN IF NOT EXISTS "period" TEXT NOT NULL DEFAULT 'monthly';
