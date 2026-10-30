// Vendas e quebras feitas aqui e ainda por enviar: o servidor ainda nao as
// conhece, por isso o stock que ele devolve esta alto demais. Sem isto, ao
// voltar a rede o ultimo atum vendido sem ligacao voltava a aparecer com 1
// (30/10/2026). Puro (testado em tests/stock_overlay.test.mjs).
export function applyPending(products, pendingSales = [], pendingShrinkage = []) {
  const minus = new Map();
  const add = (id, q) => { if (id && q > 0) minus.set(id, (minus.get(id) || 0) + q); };
  for (const s of pendingSales) for (const it of s?.payload?.items || []) if (!it.custom) add(it.product_id, Number(it.quantity) || 0);
  for (const r of pendingShrinkage) add(r.product_id, Number(r.quantity) || 0);
  if (!minus.size) return products;
  return products.map((p) => (minus.has(p.id) ? { ...p, stock_qty: Math.max(0, (p.stock_qty || 0) - minus.get(p.id)) } : p));
}
