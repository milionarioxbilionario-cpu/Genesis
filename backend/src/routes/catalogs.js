const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { imageUrlSchema } = require('../utils/productImage');
const { recordCatalogSuggestions } = require('../utils/catalogSuggestions');
const { iconSchema } = require('../utils/productIcons');
const { BUSINESS_TYPES, catalogTypeOf, MODE_PENDING } = require('../utils/businessTypes');

// Fonte unica: tabela MasterCatalog (carregada por scripts/seed_master_catalogs.js
// a partir de data/master_catalogs.json). Ja nao ha templates escritos aqui.

// GET /api/catalogs/:businessType — catalogo pre-definido (publico: nao tem dados de loja).
router.get('/:businessType', asyncHandler(async (req, res) => {
  const { businessType } = req.params;
  if (!BUSINESS_TYPES.includes(businessType)) throw httpError(404, 'Tipo de negócio desconhecido', 'UNKNOWN_BUSINESS_TYPE');
  // Sem catalogo proprio (ex.: pastelaria, cafetaria), usa o do tipo mais parecido.
  let rows = await prisma.masterCatalog.findMany({ where: { business_type: businessType }, orderBy: [{ category: 'asc' }, { product_name: 'asc' }] });
  if (!rows.length && catalogTypeOf(businessType) !== businessType) {
    rows = await prisma.masterCatalog.findMany({ where: { business_type: catalogTypeOf(businessType) }, orderBy: [{ category: 'asc' }, { product_name: 'asc' }] });
  }
  const sampleProducts = rows.map((r) => ({
    name: r.product_name,
    price_mzn: r.suggested_sell / 100,
    cost_mzn: r.suggested_cost / 100,
    stock: 0,
    category: r.category,
    barcode: r.barcode || null,
    image_url: r.image_url || null,
    icon: r.icon || null,
  }));
  res.json({ businessType, mode_pending: MODE_PENDING.includes(businessType), template: { categories: [...new Set(rows.map((r) => r.category))].sort(), sampleProducts } });
}));

// Valores em MZN (o que o dono escreve) — convertidos para centavos aqui.
const productSchema = z.object({
  name: z.string().trim().min(1, 'nome em falta').max(120, 'nome demasiado longo'),
  price_mzn: z.number({ invalid_type_error: 'preço de venda inválido' }).positive('preço de venda tem de ser maior que zero').max(10_000_000),
  cost_mzn: z.number({ invalid_type_error: 'custo inválido' }).nonnegative('custo não pode ser negativo').max(10_000_000),
  stock: z.number().int('stock tem de ser um número inteiro').nonnegative('stock não pode ser negativo').max(1_000_000).optional().default(0),
  category: z.string().trim().max(60).optional(),
  barcode: z.string().trim().regex(/^[0-9A-Za-z-]{4,32}$/, 'código de barras inválido').nullish(),
  image_url: imageUrlSchema,
  icon: iconSchema,
  // 31/10 (copiar de outro estabelecimento): sem isto um produto ao kg virava «un».
  unit: z.enum(['un', 'kg', 'l', 'm']).optional(),
  vat_rate: z.number().int().min(0).max(30).nullish(),
  min_stock: z.number().int().nonnegative().max(1_000_000).optional(),
  has_expiry: z.boolean().optional(),
});
const importSchema = z.object({ products: z.array(productSchema).max(1000) });

// POST /api/catalogs/:businessType/import — importa produtos para a loja autenticada
// e marca o onboarding como concluido.
router.post('/:businessType/import', auth, requireRole('owner'), asyncHandler(async (req, res) => {
  const products = parseCatalog(req.body?.products);
  const tenantId = req.user.tenantId;
  // Uma so transaccao interactiva (RLS: o contexto da loja aplica-se a tudo).
  const imported = await prisma.$transaction(async (tx) => {
    const count = await insertCatalogTx(tx, { tenantId, userId: req.user.userId, ip: req.ip, businessType: req.params.businessType, products });
    await tx.tenant.update({ where: { id: tenantId }, data: { onboarding_completed: true } });
    return count;
  });

  res.json({ imported, onboarding_completed: true });
}));

// Valida a lista de produtos e diz QUAL produto e QUAL campo falhou.
function parseCatalog(list) {
  const parse = importSchema.safeParse({ products: list });
  if (!parse.success) {
    const issue = parse.error.errors[0];
    const idx = issue.path[0] === 'products' && Number.isInteger(issue.path[1]) ? issue.path[1] : null;
    const name = idx !== null ? list?.[idx]?.name : null;
    const where = idx !== null ? `Produto ${idx + 1}${name ? ` (${String(name).slice(0, 40)})` : ''}: ` : '';
    throw httpError(400, where + issue.message, 'INVALID_CATALOG');
  }
  // O mesmo codigo em dois produtos deixa o leitor do balcao sem saber qual somar.
  const seen = new Map();
  for (const p of parse.data.products) {
    if (!p.barcode) continue;
    if (seen.has(p.barcode)) throw httpError(400, `O código ${p.barcode} está em dois produtos: ${seen.get(p.barcode)} e ${p.name}`, 'DUPLICATE_BARCODE');
    seen.set(p.barcode, p.name);
  }
  return parse.data.products;
}

// Grava os produtos (e o stock inicial em lotes) dentro da transaccao do chamador.
async function insertCatalogTx(tx, { tenantId, userId, ip, businessType, products }) {
  // Codigos que ja existem neste estabelecimento: recusado antes de gravar.
  const codes = products.map((p) => p.barcode).filter(Boolean);
  if (codes.length) {
    const taken = await tx.product.findFirst({ where: { tenant_id: tenantId, barcode: { in: codes } }, select: { name: true, barcode: true } });
    if (taken) throw httpError(409, `O código ${taken.barcode} já é do produto «${taken.name}».`, 'DUPLICATE_BARCODE');
  }
  const toCents = (val) => Math.round(val * 100);
  // Ids gerados aqui: o createMany nao os devolve e os lotes precisam deles.
  const createData = products.map((p) => ({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    name: p.name,
    barcode: p.barcode || null,
    image_url: p.image_url || null,
    icon: p.icon || null,
    sell_price: toCents(p.price_mzn),
    cost_price: toCents(p.cost_mzn),
    stock_qty: p.stock || 0,
    category: p.category || 'Geral',
    ...(p.unit ? { unit: p.unit } : {}),
    ...(p.vat_rate !== undefined && p.vat_rate !== null ? { vat_rate: p.vat_rate } : {}),
    ...(p.min_stock !== undefined ? { min_stock: p.min_stock } : {}),
    ...(p.has_expiry !== undefined ? { has_expiry: p.has_expiry } : {}),
  }));

  {
    const result = createData.length ? await tx.product.createMany({ data: createData }) : { count: 0 };
    // Stock inicial = um lote por produto (sem validade: entra depois por compra).
    const lots = createData.filter((p) => p.stock_qty > 0).map((p) => ({ tenant_id: tenantId, product_id: p.id, quantity_remaining: p.stock_qty, unit_cost: p.cost_price }));
    if (lots.length) await tx.stockLot.createMany({ data: lots });
    // Produtos escritos a mao no onboarding (fora do catalogo-mestre) -> sugestao ao admin.
    await recordCatalogSuggestions(tx, { tenantId, products: createData, businessType });
    await tx.auditLog.create({ data: {
      tenant_id: tenantId,
      user_id: userId,
      action: 'IMPORT_CATALOG',
      entity_type: 'catalog_import',
      entity_id: null,
      new_value: JSON.stringify({ products: result.count, with_barcode: createData.filter((p) => p.barcode).length }),
      ip_address: ip || '0.0.0.0',
    } });
    return result.count;
  }
}

module.exports = router;
module.exports.parseCatalog = parseCatalog;
module.exports.insertCatalogTx = insertCatalogTx;
