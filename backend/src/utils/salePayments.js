// Fase 15.4: pagamento misto (puro). O cliente paga parte por M-Pesa/e-Mola/
// cartao/transferencia e o resto em dinheiro (ou so com metodos electronicos).
// Tudo em centavos inteiros. O troco so sai da parte em dinheiro.
const { normalizePaymentMethod } = require('./paymentMethods');
const { httpError } = require('./http');

const MAX_PARTS = 4;

// payments: [{ method, amount }] que somam EXACTAMENTE o total da venda.
// cashReceived: dinheiro que o cliente deu (>= parte em dinheiro); sem ele, exacto.
// Devolve { payment_method, parts, amount_received, change_given }:
//   - um so metodo (depois de juntar repetidos) -> venda normal, sem parts;
//   - varios -> payment_method 'mixed' e as parts para gravar em SalePayment.
function splitPayment({ payments, total, cashReceived }) {
  if (!Array.isArray(payments) || payments.length === 0 || payments.length > MAX_PARTS) {
    throw httpError(400, `Pagamento dividido: entre 1 e ${MAX_PARTS} partes`, 'BAD_PAYMENTS');
  }
  const merged = new Map();
  for (const p of payments) {
    const method = normalizePaymentMethod(p?.method);
    const amount = Number(p?.amount);
    if (!Number.isInteger(amount) || amount <= 0) throw httpError(400, 'Cada parte do pagamento tem de ter um valor maior que zero', 'BAD_PAYMENTS');
    merged.set(method, (merged.get(method) || 0) + amount);
  }
  const parts = [...merged].map(([method, amount]) => ({ method, amount }));
  const sum = parts.reduce((s, p) => s + p.amount, 0);
  if (sum !== total) throw httpError(400, `As partes do pagamento somam ${sum}, mas o total é ${total}`, 'PAYMENTS_MISMATCH', { sum, total });
  const cash = merged.get('cash') || 0;
  const received = cashReceived === undefined || cashReceived === null ? cash : Number(cashReceived);
  if (!Number.isInteger(received) || received < cash) throw httpError(400, 'Dinheiro recebido inferior à parte em dinheiro', 'CASH_SHORT');
  const change = cash > 0 ? received - cash : 0;
  if (parts.length === 1) {
    return { payment_method: parts[0].method, parts: [], amount_received: total + change, change_given: change };
  }
  return { payment_method: 'mixed', parts, amount_received: total + change, change_given: change };
}

// Quanto entrou por cada metodo numa lista de vendas (venda mista -> as suas partes).
function totalsByMethod(sales) {
  const out = {};
  for (const s of sales) {
    const parts = s.payment_method === 'mixed' && s.payments?.length ? s.payments : [{ method: s.payment_method, amount: s.total_amount }];
    for (const p of parts) out[p.method] = (out[p.method] || 0) + Number(p.amount || 0);
  }
  return out;
}

module.exports = { splitPayment, totalsByMethod, MAX_PARTS };
