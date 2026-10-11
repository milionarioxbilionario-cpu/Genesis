// Vendas perdidas (Fase 8.4, pedido do fundador 10/10/2026): o caixista regista
// o que o cliente pediu e nao havia — do catalogo da loja ou escrito a mao
// (fora do catalogo), com quantidade e, opcional, o preco unitario.
// Funcoes PURAS (testadas em tests/lostRequests.test.js).
const { nameKey } = require('./catalogSuggestions');

const avg = (list) => (list.length ? Math.round(list.reduce((s, v) => s + v, 0) / list.length) : null);

// Relatorio do dono: um grupo por produto do catalogo ou por nome escrito.
// rows: { product_id, product: {name, sell_price}?, product_name, name_key, quantity, unit_price }
// Valor estimado: unidades x preco de venda (catalogo) ou x preco indicado
// pelo caixista (fora do catalogo; sem preco -> null, nao se inventa).
function groupLostDemand(rows) {
  const groups = new Map();
  for (const r of rows) {
    const outside = !r.product_id;
    const key = outside ? 'n:' + (r.name_key || nameKey(r.product_name)) : 'p:' + r.product_id;
    const g = groups.get(key) || {
      key,
      product_id: r.product_id || null,
      name: outside ? r.product_name : (r.product?.name || '—'),
      outside,
      requests: 0,
      units: 0,
      prices: [],
      sell_price: r.product?.sell_price ?? null,
    };
    g.requests += 1;
    g.units += r.quantity || 1;
    if (outside && Number.isInteger(r.unit_price)) g.prices.push(r.unit_price);
    if (outside && r.product_name) g.name = r.product_name; // nome mais recente (linhas vem por data)
    groups.set(key, g);
  }
  return [...groups.values()].map(({ prices, sell_price, ...g }) => {
    const unit = g.outside ? avg(prices) : sell_price;
    return { ...g, unit_price: unit, estimated_value: unit == null ? null : unit * g.units };
  }).sort((a, b) => b.units - a.units || b.requests - a.requests || a.name.localeCompare(b.name));
}

// Super admin: pedidos FORA do catalogo de todas as lojas, por tipo de negocio
// e nome. Decisao do fundador (10/10): sem nomes das lojas — so quantas.
// rows: { tenant_id, business_type, product_name, name_key, quantity, unit_price, requested_at }
function groupLostRequests(rows) {
  const groups = new Map();
  for (const r of rows) {
    const nk = r.name_key || nameKey(r.product_name);
    if (!nk) continue;
    const type = r.business_type || 'outro';
    const key = `${type}|${nk}`;
    const g = groups.get(key) || { key, business_type: type, name_key: nk, product_name: r.product_name, tenants: new Set(), requests: 0, units: 0, prices: [], last_at: null };
    g.tenants.add(r.tenant_id);
    g.requests += 1;
    g.units += r.quantity || 1;
    if (Number.isInteger(r.unit_price)) g.prices.push(r.unit_price);
    const at = new Date(r.requested_at);
    if (!g.last_at || at > g.last_at) { g.last_at = at; g.product_name = r.product_name; }
    groups.set(key, g);
  }
  return [...groups.values()].map(({ tenants, prices, ...g }) => ({
    ...g,
    stores: tenants.size,
    avg_price: avg(prices),
    min_price: prices.length ? Math.min(...prices) : null,
    max_price: prices.length ? Math.max(...prices) : null,
  })).sort((a, b) => b.stores - a.stores || b.units - a.units || b.last_at - a.last_at);
}

module.exports = { groupLostDemand, groupLostRequests };
