const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

const catalogTemplates = {
  bottle_store: {
    categories: ['Bebidas', 'Cervejas', 'Águas e Sucos', 'Outros'],
    sampleProducts: [
      { name: '2M', sku: '2M-330', price_mzn: 45, cost_mzn: 25, stock: 20, category: 'Cervejas' },
      { name: 'Manica', sku: 'MANICA-330', price_mzn: 42, cost_mzn: 24, stock: 20, category: 'Cervejas' },
      { name: 'Txilar', sku: 'TXILAR-330', price_mzn: 43, cost_mzn: 25, stock: 18, category: 'Cervejas' },
      { name: 'Laurentina', sku: 'LAURENTINA-330', price_mzn: 46, cost_mzn: 24, stock: 12, category: 'Cervejas' },
      { name: 'Heineken', sku: 'HEINEKEN-330', price_mzn: 52, cost_mzn: 29, stock: 15, category: 'Cervejas' },
      { name: 'Coca-Cola 330ml', sku: 'CC-330', price_mzn: 32, cost_mzn: 18, stock: 30, category: 'Bebidas' },
      { name: 'Coca-Cola 500ml', sku: 'CC-500', price_mzn: 45, cost_mzn: 25, stock: 28, category: 'Bebidas' },
      { name: 'Água Mineral 500ml', sku: 'AGUA-500', price_mzn: 20, cost_mzn: 9, stock: 40, category: 'Águas e Sucos' },
      { name: 'Água Mineral 1.5L', sku: 'AGUA-1500', price_mzn: 38, cost_mzn: 18, stock: 25, category: 'Águas e Sucos' },
      { name: 'Sumol Laranja', sku: 'SUMOL-LAR-330', price_mzn: 35, cost_mzn: 16, stock: 30, category: 'Bebidas' }
    ]
  },
  mercearia: {
    categories: ['Arroz', 'Açúcar e Óleos', 'Higiene', 'Peixe e Enlatados'],
    sampleProducts: [
      { name: 'Arroz Mariana 1kg', sku: 'ARROZ-1K', price_mzn: 75, cost_mzn: 48, stock: 40, category: 'Arroz' },
      { name: 'Arroz Mariana 5kg', sku: 'ARROZ-5K', price_mzn: 330, cost_mzn: 250, stock: 20, category: 'Arroz' },
      { name: 'Açúcar 1kg', sku: 'ACUCAR-1K', price_mzn: 70, cost_mzn: 45, stock: 30, category: 'Açúcar e Óleos' },
      { name: 'Óleo Palmoil 1L', sku: 'OLEO-1L', price_mzn: 82, cost_mzn: 52, stock: 25, category: 'Açúcar e Óleos' },
      { name: 'Feijão 1kg', sku: 'FEIJAO-1K', price_mzn: 80, cost_mzn: 49, stock: 25, category: 'Mercearia' },
      { name: 'Ovos (unidade)', sku: 'OVO-U', price_mzn: 9, cost_mzn: 5, stock: 100, category: 'Mercearia' },
      { name: 'Sardinha Lata', sku: 'SARDINHA', price_mzn: 48, cost_mzn: 30, stock: 40, category: 'Peixe e Enlatados' },
      { name: 'Atum Lata', sku: 'ATUM', price_mzn: 55, cost_mzn: 32, stock: 35, category: 'Peixe e Enlatados' }
    ]
  },
  padaria: {
    categories: ['Pães', 'Confeitaria', 'Bebidas', 'Laticínios'],
    sampleProducts: [
      { name: 'Pão de Forma', sku: 'PAO-FORMA', price_mzn: 35, cost_mzn: 18, stock: 50, category: 'Pães' },
      { name: 'Pão de Metro', sku: 'PAO-METRO', price_mzn: 55, cost_mzn: 28, stock: 32, category: 'Pães' },
      { name: 'Bolo Simples', sku: 'BOLO-SIMPLES', price_mzn: 85, cost_mzn: 41, stock: 18, category: 'Confeitaria' },
      { name: 'Croissant', sku: 'CROISSANT', price_mzn: 45, cost_mzn: 22, stock: 25, category: 'Confeitaria' },
      { name: 'Café Expresso', sku: 'CAFE-EXP', price_mzn: 40, cost_mzn: 18, stock: 40, category: 'Bebidas' },
      { name: 'Manteiga', sku: 'MANTEIGA', price_mzn: 90, cost_mzn: 48, stock: 22, category: 'Laticínios' },
      { name: 'Queijo', sku: 'QUEIJO', price_mzn: 120, cost_mzn: 65, stock: 18, category: 'Laticínios' }
    ]
  },
  talho: {
    categories: ['Frango', 'Bovino', 'Suíno', 'Embutidos'],
    sampleProducts: [
      { name: 'Frango Inteiro', sku: 'FRANGO-INT', price_mzn: 450, cost_mzn: 260, stock: 12, category: 'Frango' },
      { name: 'Frango Peito', sku: 'FRANGO-PEITO', price_mzn: 230, cost_mzn: 140, stock: 18, category: 'Frango' },
      { name: 'Carne Bovina 1kg', sku: 'BOVINA-1K', price_mzn: 520, cost_mzn: 330, stock: 14, category: 'Bovino' },
      { name: 'Carne de Porco 1kg', sku: 'PORCO-1K', price_mzn: 500, cost_mzn: 300, stock: 12, category: 'Suíno' },
      { name: 'Chouriço', sku: 'CHOURISCO', price_mzn: 160, cost_mzn: 95, stock: 26, category: 'Embutidos' },
      { name: 'Linguiça', sku: 'LINGUICA', price_mzn: 170, cost_mzn: 100, stock: 25, category: 'Embutidos' }
    ]
  },
  supermercado: {
    categories: ['Bebidas', 'Limpeza', 'Frescos', 'Casa'],
    sampleProducts: [
      { name: 'Pão de Forma', sku: 'PAO-FORMA', price_mzn: 35, cost_mzn: 18, stock: 60, category: 'Frescos' },
      { name: 'Leite 1L', sku: 'LEITE-1L', price_mzn: 42, cost_mzn: 22, stock: 35, category: 'Frescos' },
      { name: 'Detergente OMO', sku: 'OMO', price_mzn: 130, cost_mzn: 70, stock: 18, category: 'Limpeza' },
      { name: 'Água 500ml', sku: 'AGUA-500', price_mzn: 20, cost_mzn: 9, stock: 80, category: 'Bebidas' }
    ]
  },
  outro: {
    categories: ['Geral'],
    sampleProducts: [
      { name: 'Produto Base', sku: 'GEN-001', price_mzn: 100, cost_mzn: 60, stock: 10, category: 'Geral' }
    ]
  }
};

// GET /api/catalogs/:businessType - retorna templates públicos para um tipo de negócio.
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
        stock: 0,
        category: r.category
      }));
      return res.json({ businessType, template: { categories, sampleProducts } });
    }
  } catch (err) {
    console.error('Catalog lookup error', err);
  }

  const tpl = catalogTemplates[businessType] || { categories: [], sampleProducts: [] };
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

    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { onboarding_completed: true }
      }),
      prisma.auditLog.create({
        data: {
          user_id: req.user.userId,
          action: 'IMPORT_CATALOG',
          entity_type: 'catalog_import',
          entity_id: null,
          ip_address: req.ip || '0.0.0.0'
        }
      })
    ]);

    return res.json({ imported: created.length, products: created, onboarding_completed: true });
  } catch (err) {
    console.error('Import catalog error', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
