// Carrega o catalogo-mestre (onboarding) a partir de data/master_catalogs.json.
//   node scripts/seed_master_catalogs.js
// Idempotente e nao destrutivo: so insere os produtos que faltam (por tipo de
// negocio + nome). Nunca apaga nem altera precos que o super admin ja tenha
// mexido; apenas preenche barcode/image_url quando estao vazios.
require('dotenv').config();
const path = require('path');
const prisma = require('../src/utils/prisma');

async function main() {
  await prisma.ready();
  const data = require(path.join(__dirname, '..', 'data', 'master_catalogs.json'));
  const toCents = (mzn) => Math.round(Number(mzn) * 100);
  let inserted = 0; let completed = 0;

  for (const [businessType, products] of Object.entries(data.catalogs || {})) {
    const existing = await prisma.masterCatalog.findMany({ where: { business_type: businessType } });
    const byName = new Map(existing.map((r) => [r.product_name.toLowerCase(), r]));
    const rows = [];
    for (const p of products) {
      const found = byName.get(p.name.toLowerCase());
      if (!found) {
        rows.push({
          business_type: businessType,
          product_name: p.name,
          category: p.category || 'Geral',
          suggested_sell: toCents(p.sell_mzn),
          suggested_cost: toCents(p.cost_mzn),
          barcode: p.barcode || null,
          image_url: p.image_url || null,
        });
      } else if ((p.barcode && !found.barcode) || (p.image_url && !found.image_url)) {
        await prisma.masterCatalog.update({ where: { id: found.id }, data: { barcode: found.barcode || p.barcode || null, image_url: found.image_url || p.image_url || null } });
        completed += 1;
      }
    }
    if (rows.length) await prisma.masterCatalog.createMany({ data: rows });
    inserted += rows.length;
    console.log(`${businessType.padEnd(13)} ${String(rows.length).padStart(3)} novos · ${existing.length} ja existiam`);
  }
  console.log(`catalogo-mestre: ${inserted} inseridos, ${completed} completados`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('ERRO', e.message); process.exit(1); });
