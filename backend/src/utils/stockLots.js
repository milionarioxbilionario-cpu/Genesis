// Lotes de stock dentro de uma transaccao (Genesis 2.1, Fase 3).
//
// Product.stock_qty continua a ser a fonte de verdade da QUANTIDADE (e a guarda
// atomica da venda). Os lotes dizem de QUE DATA e esse stock. Todas as funcoes
// recebem o `tx` da transaccao de quem chama: o lote muda junto com o stock ou
// nao muda de todo.
const { allocateFefo } = require('./fefo');

// Entrada de stock (compra, stock inicial, ajuste positivo, venda cancelada).
function addLot(tx, { tenantId, productId, quantity, expiryDate = null, unitCost = 0, stockEntryId = null }) {
  if (!(quantity > 0)) return null;
  return tx.stockLot.create({ data: {
    tenant_id: tenantId,
    product_id: productId,
    quantity_remaining: quantity,
    expiry_date: expiryDate ? new Date(expiryDate) : null,
    unit_cost: unitCost || 0,
    stock_entry_id: stockEntryId,
  } });
}

// Saida (venda, quebra, ajuste negativo): desconta por FEFO. Guarda atomica
// por lote (quantity_remaining >= o que se tira); se outra venda em paralelo
// esvaziou o lote, rele os lotes e reparte o resto. Devolve as parcelas por
// lote; o que os lotes nao cobrirem (stock antigo sem lote) fica em `uncovered`.
async function consumeLots(tx, { tenantId, productId, quantity }) {
  const taken = [];
  let left = quantity;
  for (let attempt = 0; attempt < 5 && left > 0; attempt++) {
    const lots = await tx.stockLot.findMany({ where: { tenant_id: tenantId, product_id: productId, quantity_remaining: { gt: 0 } } });
    if (!lots.length) break;
    const { allocations } = allocateFefo(lots, left);
    if (!allocations.length) break;
    for (const a of allocations) {
      const r = await tx.stockLot.updateMany({
        where: { id: a.lot_id, tenant_id: tenantId, quantity_remaining: { gte: a.quantity } },
        data: { quantity_remaining: { decrement: a.quantity } },
      });
      if (r.count === 1) { taken.push(a); left -= a.quantity; }
    }
  }
  return { allocations: taken, uncovered: left };
}

module.exports = { addLot, consumeLots };
