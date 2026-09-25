const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const requireRole = require('../middleware/rbac');
const auth = require('../middleware/auth');

const productTemplateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  price_mzn: z.number().nonnegative(),
  cost_mzn: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  category: z.string().optional()
});

const templateInputSchema = z.object({
  businessType: z.string().min(1),
  categories: z.array(z.string()).default([]),
  sampleProducts: z.array(productTemplateSchema).default([]),
  name: z.string().optional()
});

// GET /api/master_catalogs - lista templates globais do super admin.
router.get('/', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const records = await prisma.masterCatalog.findMany({
      orderBy: { business_type: 'asc' }
    });

    const grouped = records.reduce((acc, item) => {
      if (!acc[item.business_type]) {
        acc[item.business_type] = {
          businessType: item.business_type,
          categories: new Set(),
          sampleProducts: []
        };
      }
      acc[item.business_type].categories.add(item.category);
      acc[item.business_type].sampleProducts.push({
        name: item.product_name,
        sku: item.product_name,
        price_mzn: item.suggested_sell / 100,
        cost_mzn: item.suggested_cost / 100,
        stock: 0
      });
      return acc;
    }, {});

    return res.json({
      templates: Object.values(grouped).map((template) => ({
        ...template,
        categories: Array.from(template.categories)
      }))
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar master catalog' });
  }
});

// POST /api/master_catalogs - persiste templates na base de dados.
router.post('/', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const payload = templateInputSchema.parse(req.body);
    const rows = payload.sampleProducts.map((product) => ({
      business_type: payload.businessType,
      product_name: product.name,
      category: product.category || payload.categories[0] || 'Geral',
      suggested_cost: Math.round((product.cost_mzn || 0) * 100),
      suggested_sell: Math.round((product.price_mzn || 0) * 100)
    }));

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Nenhum produto foi enviado' });
    }

    const created = await prisma.$transaction(
      rows.map((row) => prisma.masterCatalog.create({ data: row }))
    );

    return res.status(201).json({ created: created.length, message: 'Template salvo com sucesso' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erro ao salvar master catalog' });
  }
});

module.exports = router;
