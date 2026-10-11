const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { applyTenantRls } = require('../utils/tenantRls');
const { asyncHandler, httpError } = require('../utils/http');
const { nameKey } = require('../utils/catalogSuggestions');

// "Cliente pediu e nao havia" (especificacao 6.2 + Fase 8.4): produto do
// catalogo da loja OU produto fora do catalogo escrito pelo caixista, com
// quantidade e, se souber, o preco unitario (centavos).
const schema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional().nullable(),
  product_name: z.string().trim().min(2, 'Escreva o que o cliente pediu (2 letras no mínimo).').max(80, 'Nome demasiado longo (máximo 80).').optional().nullable(),
  quantity: z.number().int('Quantidade inteira.').min(1, 'Quantidade mínima: 1.').max(1000, 'Quantidade máxima: 1000.').optional().default(1),
  unit_price: z.number().int().nonnegative('O preço não pode ser negativo.').max(100_000_000).optional().nullable(),
  requested_at: z.string().optional()
}).refine((d) => d.product_id || d.product_name, { message: 'Escolha o produto ou escreva o que o cliente pediu.' });

router.post('/', asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const tenantId = req.user && req.user.tenantId;
  const userId = req.user && req.user.userId;
  // posWriteAuth garante sempre um utilizador real (sessao ou caixista do terminal).
  if (!tenantId || !userId) throw httpError(400, 'Tenant não identificado', 'NO_TENANT');

  const result = await prisma.$transaction(async (tx) => {
    // Contexto de tenant para as politicas RLS do Postgres (no-op em SQLite).
    await applyTenantRls(tx, tenantId);

    if (data.id) {
      const exists = await tx.demandCapture.findFirst({ where: { id: data.id, tenant_id: tenantId } });
      if (exists) return { existed: true, id: exists.id };
    }

    let productId = data.product_id || null;
    let productName = null;
    if (productId) {
      const product = await tx.product.findFirst({ where: { id: productId, tenant_id: tenantId }, select: { id: true } });
      if (!product) throw httpError(400, 'Produto não encontrado nesta loja', 'PRODUCT_NOT_FOUND');
    } else {
      // Escrito a mao mas a loja ja tem esse produto: conta como o produto
      // (entra na recomendacao de compra em vez de ficar "fora do catalogo").
      const key = nameKey(data.product_name);
      const own = await tx.product.findMany({ where: { tenant_id: tenantId, is_active: true }, select: { id: true, name: true } });
      const match = own.find((p) => nameKey(p.name) === key);
      if (match) productId = match.id;
      else productName = data.product_name.replace(/\s+/g, ' ');
    }

    const dc = await tx.demandCapture.create({
      data: {
        id: data.id || undefined,
        tenant_id: tenantId,
        product_id: productId,
        product_name: productName,
        name_key: productName ? nameKey(productName) : null,
        quantity: data.quantity,
        unit_price: data.unit_price ?? null,
        recorded_by: userId,
        requested_at: data.requested_at ? new Date(data.requested_at) : new Date()
      }
    });

    const newValue = productId ? { product_id: productId, quantity: data.quantity } : { product_name: productName, quantity: data.quantity, unit_price: data.unit_price ?? null };
    if (req.user.tid) newValue.terminal_id = req.user.tid;

    await tx.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action: 'CREATE_DEMAND_CAPTURE',
        entity_type: 'demand_capture',
        entity_id: dc.id,
        old_value: null,
        new_value: JSON.stringify(newValue),
        ip_address: req.ip || '0.0.0.0'
      }
    });

    return { existed: false, id: dc.id, product_id: productId };
  });

  if (result.existed) return res.status(200).json({ id: result.id, message: 'Já existe' });
  return res.status(201).json({ id: result.id, product_id: result.product_id });
}));

module.exports = router;
