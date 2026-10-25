-- Fase 15.1 (25/10/2026): recibo profissional. SO ADICOES; idempotente.
-- logo_data: logotipo do estabelecimento como data URL (PNG/JPEG/WebP, <= 300 KB),
-- guardado na BD (nao ha armazenamento de ficheiros) e levado pelo terminal sem rede.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo_data" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "receipt_footer" TEXT;
