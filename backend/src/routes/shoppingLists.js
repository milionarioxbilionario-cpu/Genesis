// Lista de compras (Genesis 2.1, Fase 5.2) — so o dono.
// Gerada da recomendacao de restock (services/restock.js) ou feita a mao;
// guardada; enviada ao fornecedor por WhatsApp (wa.me, gratis, sem Twilio).
// Estado: draft -> sent -> received. Marcar "recebida" NAO mexe no stock: a
// entrada continua a ser feita em Produtos -> Stock, com o custo e a validade
// reais de cada lote.
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const { asyncHandler, httpError } = require('../utils/http');
const { writeAudit } = require('../utils/audit');
const { restockFor } = require('../services/reports');
const { listTotals, orderMessage, whatsappLink, waPhone } = require('../services/shoppingList');

const router = express.Router();
router.use(auth, requireRole('owner'));

const STATUSES = ['draft', 'sent', 'received'];
const tenantId = (req) => req.user.tenantId;

const listSchema = z.object({
  name: z.string().trim().min(2, 'Dê um nome à lista').max(80),
  supplier_id: z.string().uuid().nullable().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1),
    quantity: z.number().int().positive().max(100000),
    unit_cost: z.number().int().nonnegative().optional(), // centavos; omisso = custo actual do produto
  })).min(1, 'A lista precisa de pelo menos um produto').max(300),
});

async function supplierOf(tid, supplierId) {
  if (!supplierId) return null;
  const s = await prisma.supplier.findFirst({ where: { id: supplierId, tenant_id: tid } });
  if (!s) throw httpError(400, 'Fornecedor não encontrado', 'BAD_SUPPLIER');
  return s;
}

// Valida os produtos (todos desta loja e activos) e fixa nome e custo.
async function resolveItems(tid, items) {
  const ids = [...new Set(items.map((i) => i.product_id))];
  if (ids.length !== items.length) throw httpError(400, 'O mesmo produto aparece duas vezes na lista', 'DUPLICATE_PRODUCT');
  const products = await prisma.product.findMany({ where: { tenant_id: tid, id: { in: ids }, is_active: true }, select: { id: true, name: true, cost_price: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((i) => {
    const p = byId.get(i.product_id);
    if (!p) throw httpError(400, 'Produto não encontrado nesta loja', 'BAD_PRODUCT');
    return { product_id: p.id, product_name: p.name, quantity: i.quantity, unit_cost: i.unit_cost ?? p.cost_price ?? 0 };
  });
}

async function withTotals(tid, list) {
  const supplier = list.supplier_id ? await prisma.supplier.findFirst({ where: { id: list.supplier_id, tenant_id: tid } }) : null;
  return { ...list, supplier: supplier ? { id: supplier.id, name: supplier.name, phone: supplier.phone, delivery_cost_per_visit: supplier.delivery_cost_per_visit } : null, totals: listTotals(list.items, supplier) };
}

async function ownList(req) {
  const list = await prisma.shoppingList.findFirst({ where: { id: req.params.id, tenant_id: tenantId(req) }, include: { items: { orderBy: { product_name: 'asc' } } } });
  if (!list) throw httpError(404, 'Lista não encontrada');
  return list;
}

// Sugestao: o que comprar para N dias, ao ritmo das ultimas 4 semanas.
router.get('/suggestion', asyncHandler(async (req, res) => {
  const { days } = z.object({ days: z.coerce.number().int().refine((d) => [7, 14, 30].includes(d), 'dias: 7, 14 ou 30').default(30) }).parse(req.query);
  res.json(await restockFor(tenantId(req), new Date(), days));
}));

router.get('/', asyncHandler(async (req, res) => {
  const tid = tenantId(req);
  const [lists, suppliers] = await Promise.all([
    prisma.shoppingList.findMany({ where: { tenant_id: tid }, include: { items: true }, orderBy: { created_at: 'desc' }, take: 100 }),
    prisma.supplier.findMany({ where: { tenant_id: tid } }),
  ]);
  const byId = new Map(suppliers.map((s) => [s.id, s]));
  res.json(lists.map((l) => {
    const s = l.supplier_id ? byId.get(l.supplier_id) : null;
    return { id: l.id, name: l.name, status: l.status, supplier_id: l.supplier_id, supplier_name: s?.name || null, created_at: l.created_at, updated_at: l.updated_at, item_count: l.items.length, totals: listTotals(l.items, s) };
  }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await withTotals(tenantId(req), await ownList(req)));
}));

router.post('/', asyncHandler(async (req, res) => {
  const tid = tenantId(req);
  const data = listSchema.parse(req.body);
  await supplierOf(tid, data.supplier_id);
  const items = await resolveItems(tid, data.items);
  const list = await prisma.$transaction(async (tx) => {
    const l = await tx.shoppingList.create({ data: { tenant_id: tid, name: data.name, supplier_id: data.supplier_id || null, created_by: req.user.userId } });
    await tx.shoppingListItem.createMany({ data: items.map((it) => ({ ...it, tenant_id: tid, list_id: l.id })) });
    return tx.shoppingList.findUnique({ where: { id: l.id }, include: { items: { orderBy: { product_name: 'asc' } } } });
  });
  await writeAudit({ req, action: 'CREATE_SHOPPING_LIST', entityType: 'shopping_list', entityId: list.id, newValue: { name: data.name, supplier_id: data.supplier_id || null, items: items.length } });
  res.status(201).json(await withTotals(tid, list));
}));

// Editar nome, fornecedor e itens (substitui os itens). Uma lista ja recebida
// fica como registo e nao se edita.
router.put('/:id', asyncHandler(async (req, res) => {
  const tid = tenantId(req);
  const before = await ownList(req);
  if (before.status === 'received') throw httpError(409, 'Lista já recebida: não pode ser alterada', 'LIST_RECEIVED');
  const data = listSchema.parse(req.body);
  await supplierOf(tid, data.supplier_id);
  const items = await resolveItems(tid, data.items);
  const list = await prisma.$transaction(async (tx) => {
    await tx.shoppingListItem.deleteMany({ where: { tenant_id: tid, list_id: before.id } });
    await tx.shoppingListItem.createMany({ data: items.map((it) => ({ ...it, tenant_id: tid, list_id: before.id })) });
    await tx.shoppingList.update({ where: { id: before.id }, data: { name: data.name, supplier_id: data.supplier_id || null } });
    return tx.shoppingList.findUnique({ where: { id: before.id }, include: { items: { orderBy: { product_name: 'asc' } } } });
  });
  await writeAudit({ req, action: 'UPDATE_SHOPPING_LIST', entityType: 'shopping_list', entityId: list.id, oldValue: { name: before.name, items: before.items.length }, newValue: { name: data.name, items: items.length } });
  res.json(await withTotals(tid, list));
}));

router.put('/:id/status', asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
  const before = await ownList(req);
  await prisma.shoppingList.update({ where: { id: before.id }, data: { status } });
  await writeAudit({ req, action: 'SHOPPING_LIST_STATUS', entityType: 'shopping_list', entityId: before.id, oldValue: { status: before.status }, newValue: { status } });
  res.json({ ok: true, status });
}));

// Mensagem e link do WhatsApp para o fornecedor da lista.
router.get('/:id/whatsapp', asyncHandler(async (req, res) => {
  const tid = tenantId(req);
  const list = await ownList(req);
  const [tenant, supplier] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tid }, select: { name: true } }),
    list.supplier_id ? prisma.supplier.findFirst({ where: { id: list.supplier_id, tenant_id: tid } }) : null,
  ]);
  const text = orderMessage({ storeName: tenant?.name, supplierName: supplier?.name, items: list.items });
  res.json({ text, url: whatsappLink(supplier?.phone, text), has_phone: Boolean(waPhone(supplier?.phone)) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const before = await ownList(req);
  await prisma.$transaction(async (tx) => {
    await tx.shoppingListItem.deleteMany({ where: { tenant_id: tenantId(req), list_id: before.id } });
    await tx.shoppingList.delete({ where: { id: before.id } });
  });
  await writeAudit({ req, action: 'DELETE_SHOPPING_LIST', entityType: 'shopping_list', entityId: before.id, oldValue: { name: before.name, status: before.status, items: before.items.length } });
  res.json({ ok: true });
}));

module.exports = router;
