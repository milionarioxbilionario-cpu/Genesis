// FEFO (First Expired, First Out) — logica pura, sem base de dados.
//
// Ordem de saida: primeiro o lote que expira primeiro; lotes sem validade vao
// por ultimo; empate -> o lote mais antigo. Lotes vazios sao ignorados.

const time = (d) => (d ? new Date(d).getTime() : Infinity);

function sortFefo(lots) {
  return [...lots].sort((a, b) => (time(a.expiry_date) - time(b.expiry_date)) || (new Date(a.created_at) - new Date(b.created_at)));
}

// Divide `quantity` pelos lotes. `uncovered` = o que os lotes nao cobrem (stock
// sem lote, ex.: diferencas antigas) — quem chama decide o que fazer.
function allocateFefo(lots, quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('quantidade invalida');
  const allocations = [];
  let left = quantity;
  for (const lot of sortFefo(lots)) {
    if (left === 0) break;
    if (!(lot.quantity_remaining > 0)) continue;
    const take = Math.min(lot.quantity_remaining, left);
    allocations.push({ lot_id: lot.id, quantity: take, unit_cost: lot.unit_cost ?? 0, expiry_date: lot.expiry_date ?? null });
    left -= take;
  }
  return { allocations, uncovered: left };
}

// Dia civil em Maputo (UTC+2, sem hora de verao) de uma data. As validades sao
// datas (AAAA-MM-DD) guardadas a meia-noite UTC; o "hoje" e o da loja.
const MAPUTO_OFFSET_MS = 2 * 3600 * 1000;
const dayInMaputo = (d) => new Date(new Date(d).getTime() + MAPUTO_OFFSET_MS).toISOString().slice(0, 10);
const dayOfDate = (d) => new Date(d).toISOString().slice(0, 10);

// "Valido ate 12/10" vende-se no dia 12 e e perda a partir do dia 13.
function isExpired(expiryDate, now = new Date()) {
  if (!expiryDate) return false;
  return dayOfDate(expiryDate) < dayInMaputo(now);
}

// Dias ate expirar (0 = expira hoje; negativo = ja expirou).
function daysUntilExpiry(expiryDate, now = new Date()) {
  if (!expiryDate) return null;
  return Math.round((Date.parse(dayOfDate(expiryDate)) - Date.parse(dayInMaputo(now))) / 86400000);
}

module.exports = { sortFefo, allocateFefo, isExpired, daysUntilExpiry };
