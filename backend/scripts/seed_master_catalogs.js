require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

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

  console.log(`master catalogs seeded: ${inserted}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
