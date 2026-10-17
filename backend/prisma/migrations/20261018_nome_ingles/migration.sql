-- Fase 9.7 (18/10/2026): nome em ingles dos produtos do catalogo-mestre
-- (decisao do fundador 12/10: so estes tem nome ingles; preenchido pelo super
-- admin). Serve a pesquisa nas duas linguas ("water" encontra "Agua").
-- SO ADICOES: coluna opcional, sem valor = sem nome ingles.
ALTER TABLE "MasterCatalog" ADD COLUMN IF NOT EXISTS "product_name_en" TEXT;
