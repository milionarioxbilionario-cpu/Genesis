require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const realCatalogs = {
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
  }
};

async function main() {
  const filePath = path.join(__dirname, '..', 'data', 'master_catalogs.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const templates = data.templates || [];
  let inserted = 0;

  for (const template of templates) {
    const rows = (template.sampleProducts || []).map((product) => ({
      business_type: template.businessType || template.business_type,
      product_name: product.name,
      category: (product.category || (template.categories && template.categories[0]) || 'Geral').toString(),
      suggested_cost: Math.round((Number(product.cost_mzn || 0)) * 100),
      suggested_sell: Math.round((Number(product.price_mzn || 0)) * 100)
    }));

    for (const row of rows) {
      const existing = await prisma.masterCatalog.findFirst({
        where: {
          business_type: row.business_type,
          product_name: row.product_name,
          category: row.category
        }
      });

      if (!existing) {
        await prisma.masterCatalog.create({ data: row });
        inserted += 1;
      }
    }
  }

  for (const [businessType, template] of Object.entries(realCatalogs)) {
    for (const product of template.sampleProducts) {
      const row = {
        business_type: businessType,
        product_name: product.name,
        category: product.category || template.categories[0],
        suggested_cost: Math.round((Number(product.cost_mzn || 0)) * 100),
        suggested_sell: Math.round((Number(product.price_mzn || 0)) * 100)
      };
      const existing = await prisma.masterCatalog.findFirst({
        where: {
          business_type: row.business_type,
          product_name: row.product_name,
          category: row.category
        }
      });
      if (!existing) {
        await prisma.masterCatalog.create({ data: row });
        inserted += 1;
      }
    }
  }

  console.log(`master catalogs seeded: ${inserted}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
