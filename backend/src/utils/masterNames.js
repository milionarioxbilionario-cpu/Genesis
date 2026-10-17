// Nome em ingles dos produtos da loja (Fase 9.8, decisao do fundador 12/10):
// so os produtos que vieram do catalogo-mestre tem nome ingles, preenchido pelo
// super admin. Junta-se NA LEITURA, pelo nome igual ao do catalogo-mestre (sem
// acentos/maiusculas, como nas sugestoes): nada e copiado para as lojas, uma
// correccao do admin vale logo, e um produto que o dono renomeou fica so com o
// nome dele. Serve a pesquisa nas duas linguas ("water" encontra "Água").
const prisma = require('./prisma');
const { nameKey } = require('./catalogSuggestions');

// Puro: Map nameKey(nome pt) -> nome en.
function englishIndex(masterRows) {
  const map = new Map();
  for (const m of masterRows) {
    const en = String(m.product_name_en || '').trim();
    if (en && !map.has(nameKey(m.product_name))) map.set(nameKey(m.product_name), en);
  }
  return map;
}

// Puro: acrescenta name_en (ou null) a cada produto.
function withEnglishNames(products, index) {
  return products.map((p) => ({ ...p, name_en: index.get(nameKey(p.name)) || null }));
}

// O catalogo-mestre inteiro (o onboarding junta categorias de varios tipos).
// MasterCatalog tem leitura aberta ao papel da app (rls_v2.sql).
async function loadEnglishIndex(client = prisma) {
  const rows = await client.masterCatalog.findMany({ where: { product_name_en: { not: null } }, select: { product_name: true, product_name_en: true } });
  return englishIndex(rows);
}

module.exports = { englishIndex, withEnglishNames, loadEnglishIndex };
