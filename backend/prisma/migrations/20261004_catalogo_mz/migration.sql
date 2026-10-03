-- Genesis 2.1 / Fase 1 — catalogo-mestre com codigo de barras e imagem.
-- So adicoes (colunas opcionais); nada e apagado nem convertido.
ALTER TABLE "MasterCatalog" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
ALTER TABLE "MasterCatalog" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
