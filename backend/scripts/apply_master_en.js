// Fase 9.7: preenche MasterCatalog.product_name_en com a proposta de
// scripts/master_catalog_en.json (nomes revistos depois pelo fundador no painel
// admin). So toca no catalogo-mestre, nunca nos produtos das lojas.
//   node scripts/apply_master_en.js            -> so mostra (a seco)
//   node scripts/apply_master_en.js --aplicar  -> preenche os que estao vazios
//   node scripts/apply_master_en.js --aplicar --forcar -> substitui tambem os ja preenchidos
require('dotenv').config();
const prisma = require('../src/utils/prisma');
const NAMES = require('./master_catalog_en.json');

const APPLY = process.argv.includes('--aplicar');
const FORCE = process.argv.includes('--forcar');

(async () => {
  await prisma.ready();
  const rows = await prisma.masterCatalog.findMany({ select: { id: true, product_name: true, product_name_en: true } });
  const plan = [];
  const missing = [];
  for (const r of rows) {
    const en = NAMES[r.product_name];
    if (!en) { missing.push(r.product_name); continue; }
    if (r.product_name_en && !FORCE) continue;
    if (r.product_name_en === en) continue;
    plan.push({ id: r.id, pt: r.product_name, en });
  }
  console.log(`catalogo-mestre: ${rows.length} produtos; a preencher: ${plan.length}; sem proposta: ${missing.length}`);
  if (missing.length) console.log('sem proposta:', [...new Set(missing)].join(' | '));
  if (!APPLY) { console.log('A SECO (use --aplicar para gravar)'); process.exit(0); }
  for (const p of plan) await prisma.masterCatalog.update({ where: { id: p.id }, data: { product_name_en: p.en } });
  const filled = await prisma.masterCatalog.count({ where: { product_name_en: { not: null } } });
  console.log(`gravado: ${plan.length}; com nome ingles agora: ${filled}/${rows.length}`);
  process.exit(0);
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
