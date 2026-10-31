-- 31/10/2026 (E2; so acrescenta; pode correr mais de uma vez)
-- De que terminal saiu cada venda: o painel geral mostra «de onde veio cada valor»
-- (estabelecimento, terminal, perfil). Vendas antigas ficam sem terminal (null).
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "terminal_id" TEXT;
