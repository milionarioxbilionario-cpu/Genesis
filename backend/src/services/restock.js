// Recomendacao de restock (especificacao 6.3) — logica pura, testada.
//
// Regras (sem IA; a IA fica para mais tarde, decisao do fundador):
//  - ritmo = unidades vendidas na janela / dias da janela;
//  - procura perdida (cliente pediu e nao havia) conta como 1 unidade por pedido;
//  - comprar = arredondar para cima (ritmo + perdidos/dia) x dias a cobrir - stock;
//  - produto com stock e (quase) sem vendas na janela -> "nao reforcar".
// Valores em centavos.

// `now` serve para so julgar "nao reforcar" produtos que ja existiam durante
// toda a janela (uma loja ou um produto novo ainda nao teve tempo de vender).
function recommendRestock({ products, soldByProduct = {}, lostByProduct = {}, windowDays = 28, coverDays = 30, now = new Date() }) {
  if (!(windowDays > 0) || !(coverDays > 0)) throw new Error('janela e cobertura tem de ser > 0');
  const items = [];
  const slowMovers = [];
  for (const p of products) {
    const sold = soldByProduct[p.id] || 0;
    const lost = lostByProduct[p.id] || 0;
    const perDay = (sold + lost) / windowDays;
    const need = Math.ceil(perDay * coverDays - 1e-9);
    const quantity = Math.max(0, need - Math.max(0, p.stock_qty || 0));
    if (quantity > 0) {
      items.push({
        product_id: p.id, name: p.name, stock: p.stock_qty || 0, sold, lost,
        per_day: Math.round(perDay * 100) / 100, quantity,
        unit_cost: p.cost_price || 0, investment: quantity * (p.cost_price || 0),
        reason: lost > 0 && sold === 0 ? 'pedido por clientes sem stock' : 'ritmo de vendas',
      });
    } else if ((p.stock_qty || 0) > 0 && sold <= 1 && lost === 0
      && (!p.created_at || now - new Date(p.created_at) >= windowDays * 86400000)) {
      slowMovers.push({ product_id: p.id, name: p.name, stock: p.stock_qty, sold, stock_value: (p.stock_qty || 0) * (p.cost_price || 0) });
    }
  }
  items.sort((a, b) => b.investment - a.investment || b.quantity - a.quantity);
  slowMovers.sort((a, b) => b.stock_value - a.stock_value);
  return {
    window_days: windowDays,
    cover_days: coverDays,
    items,
    total_investment: items.reduce((s, i) => s + i.investment, 0),
    slow_movers: slowMovers,
  };
}

module.exports = { recommendRestock };
