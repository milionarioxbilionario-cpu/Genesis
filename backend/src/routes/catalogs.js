const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

// GET /api/catalogs/:businessType - retorna templates públicos para um tipo de negócio.
// Primeiro tenta usar o master catalog persistido em DB; se não existir, usa fallback local.
router.get('/:businessType', async (req, res) => {
  const { businessType } = req.params;

  try {
    const rows = await prisma.masterCatalog.findMany({
      where: { business_type: businessType },
      orderBy: { product_name: 'asc' }
    });

    if (rows.length > 0) {
      const categories = [...new Set(rows.map(r => r.category))].sort();
      const sampleProducts = rows.map((r) => ({
        name: r.product_name,
        sku: r.product_name,
        price_mzn: r.suggested_sell / 100,
        cost_mzn: r.suggested_cost / 100,
        stock: 0
      }));

      return res.json({ businessType, template: { categories, sampleProducts } });
    }
  } catch (err) {
    console.error('Catalog lookup error', err);
  }

  const templates = {
    mercearia: {
      categories: ['Bebidas', 'Mercearia', 'Higiene', 'Frios'],
      sampleProducts: [
        { name: 'Cerveja 500ml', sku: 'CVR-500', price_mzn: 65.00, cost_mzn: 40.00, stock: 100 },
        { name: 'Água 500ml', sku: 'AG-500', price_mzn: 25.00, cost_mzn: 12.00, stock: 200 },
      ]
    },
    restaurante: {
      categories: ['Entradas', 'Pratos Principais', 'Bebidas', 'Sobremesas'],
      sampleProducts: [
        { name: 'Prato do Dia', sku: 'PRT-DIA', price_mzn: 250.00, cost_mzn: 120.00, stock: 9999 },
        { name: 'Coca-Cola 330ml', sku: 'CC-330', price_mzn: 45.00, cost_mzn: 20.00, stock: 150 },
      ]
    },
    boutique: {
      categories: ['Roupas', 'Acessórios', 'Calçado'],
      sampleProducts: [
        { name: 'Camiseta Básica', sku: 'CB-001', price_mzn: 350.00, cost_mzn: 150.00, stock: 50 },
      ]
    }
  };

  const tpl = templates[businessType] || { categories: [], sampleProducts: [] };
  return res.json({ businessType, template: tpl });
});

// Zod schema para importação em massa
const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  // price_mzn and cost_mzn can be passed as numbers (MZN) or integers (centavos)
  price_mzn: z.number().nonnegative(),
  cost_mzn: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional().default(0),
  category: z.string().optional()
});

const importSchema = z.object({ products: z.array(productSchema) });

// POST /api/catalogs/:businessType/import - importa produtos para o tenant autenticado
router.post('/:businessType/import', auth, requireRole('owner'), async (req, res) => {
  try {
    const parse = importSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.errors });

    const { products } = parse.data;
    const tenantId = req.user.tenantId;

    // Converter preços MZN (ex.: 150.50) para centavos (inteiro)
    const to_centavos = (val) => Math.round(val * 100);

    const createData = products.map(p => ({
      name: p.name,
      barcode: p.sku || null,
      sell_price: to_centavos(p.price_mzn),
      cost_price: to_centavos(p.cost_mzn),
      stock_qty: p.stock || 0,
      category: p.category || 'Geral',
      tenant: { connect: { id: tenantId } }
    }));

    // Inserção em batch usando transaction
    const created = await prisma.$transaction(
      createData.map(d => prisma.product.create({ data: d }))
    );

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'IMPORT_CATALOG',
        entity_type: 'catalog_import',
        entity_id: null,
        ip_address: req.ip || '0.0.0.0'
      }
    });

    return res.json({ imported: created.length, products: created });
  } catch (err) {
    console.error('Import catalog error', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
