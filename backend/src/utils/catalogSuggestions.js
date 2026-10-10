// Produtos criados pelas lojas fora do catalogo-mestre (Fase 8.2, pedido do
// fundador 10/10/2026): ficam como sugestao para o super admin, que os pode
// acrescentar ao catalogo-mestre — as lojas novas desse tipo passam a recebe-los
// no onboarding.

// Chave para comparar nomes: sem acentos, maiusculas nem espacos repetidos
// ("Água  Namaacha" = "agua namaacha").
function nameKey(name) {
  return String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Puro: produtos cujo nome nao esta entre os nomes do catalogo-mestre.
function outsideCatalog(products, masterNames) {
  const known = new Set(masterNames.map(nameKey));
  const seen = new Set();
  return products.filter((p) => {
    const k = nameKey(p.name);
    if (!k || known.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Dentro da transaccao de quem cria os produtos (contexto da loja / RLS).
// businessType: o do pedido (onboarding) ou, sem ele, o da loja.
async function recordCatalogSuggestions(tx, { tenantId, products, businessType: given }) {
  if (!products.length) return 0;
  let businessType = given;
  if (!businessType) {
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: { business_type: true } });
    businessType = tenant?.business_type || 'outro';
  }
  // Contra o catalogo-mestre INTEIRO: o onboarding junta categorias de outros
  // tipos (ex.: bottle store + grelhados do restaurante) e esses nao sao novos.
  const master = await tx.masterCatalog.findMany({ select: { product_name: true } });
  const fresh = outsideCatalog(products, master.map((m) => m.product_name));
  if (!fresh.length) return 0;
  const r = await tx.catalogSuggestion.createMany({
    data: fresh.map((p) => ({
      tenant_id: tenantId, product_id: p.id, business_type: businessType,
      product_name: p.name, name_key: nameKey(p.name), category: p.category || 'Geral',
      icon: p.icon || null, barcode: p.barcode || null,
      cost_price: p.cost_price || 0, sell_price: p.sell_price || 0,
    })),
    skipDuplicates: true,
  });
  return r.count;
}

// Agrupa as sugestoes pendentes por (tipo de negocio, nome) para o admin. Sem
// nomes de lojas (decisao do fundador 10/10): so quantas lojas e os precos.
function groupSuggestions(rows) {
  const groups = new Map();
  for (const r of rows) {
    const k = r.business_type + '|' + r.name_key;
    const g = groups.get(k) || { business_type: r.business_type, name_key: r.name_key, product_name: r.product_name, category: r.category, icon: r.icon, barcode: r.barcode, tenants: new Set(), costs: [], sells: [], first_at: r.created_at, last_at: r.created_at };
    g.tenants.add(r.tenant_id);
    g.costs.push(r.cost_price); g.sells.push(r.sell_price);
    if (r.created_at < g.first_at) g.first_at = r.created_at;
    if (r.created_at >= g.last_at) { g.last_at = r.created_at; g.product_name = r.product_name; g.category = r.category; g.icon = r.icon || g.icon; g.barcode = r.barcode || g.barcode; }
    groups.set(k, g);
  }
  const avg = (xs) => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);
  return [...groups.values()].map(({ tenants, costs, sells, ...g }) => ({
    ...g,
    stores: tenants.size,
    avg_cost: avg(costs), avg_sell: avg(sells),
    min_sell: Math.min(...sells), max_sell: Math.max(...sells),
  })).sort((a, b) => b.stores - a.stores || (b.last_at - a.last_at));
}

module.exports = { nameKey, outsideCatalog, recordCatalogSuggestions, groupSuggestions };
