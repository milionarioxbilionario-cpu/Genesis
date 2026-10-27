// Fase 15.4: pagamento misto. node --test backend/tests/salePayments.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { splitPayment, totalsByMethod } = require('../src/utils/salePayments');

test('M-Pesa + dinheiro com troco: o troco sai so da parte em dinheiro', () => {
  const r = splitPayment({ payments: [{ method: 'mpesa', amount: 50000 }, { method: 'cash', amount: 30000 }], total: 80000, cashReceived: 100000 });
  assert.deepEqual(r, { payment_method: 'mixed', parts: [{ method: 'mpesa', amount: 50000 }, { method: 'cash', amount: 30000 }], amount_received: 150000, change_given: 70000 });
});

test('sem dinheiro recebido indicado: exacto, sem troco', () => {
  const r = splitPayment({ payments: [{ method: 'card', amount: 1000 }, { method: 'transfer', amount: 500 }], total: 1500 });
  assert.equal(r.payment_method, 'mixed');
  assert.equal(r.change_given, 0);
  assert.equal(r.amount_received, 1500);
});

test('transferencia e um metodo proprio (ja nao conta como cartao)', () => {
  const r = splitPayment({ payments: [{ method: 'transferência', amount: 700 }], total: 700 });
  assert.equal(r.payment_method, 'transfer');
  assert.deepEqual(r.parts, []);
});

test('partes repetidas juntam-se; uma so = venda normal', () => {
  const r = splitPayment({ payments: [{ method: 'cash', amount: 300 }, { method: 'dinheiro', amount: 200 }], total: 500, cashReceived: 1000 });
  assert.deepEqual(r, { payment_method: 'cash', parts: [], amount_received: 1000, change_given: 500 });
});

test('recusas: soma errada, valor zero/decimal, dinheiro a menos, metodo inventado, partes a mais', () => {
  const code = (fn) => { try { fn(); return null; } catch (e) { return e.code || e.statusCode; } };
  assert.equal(code(() => splitPayment({ payments: [{ method: 'cash', amount: 100 }], total: 101 })), 'PAYMENTS_MISMATCH');
  assert.equal(code(() => splitPayment({ payments: [{ method: 'cash', amount: 0 }, { method: 'card', amount: 100 }], total: 100 })), 'BAD_PAYMENTS');
  assert.equal(code(() => splitPayment({ payments: [{ method: 'cash', amount: 50.5 }, { method: 'card', amount: 49.5 }], total: 100 })), 'BAD_PAYMENTS');
  assert.equal(code(() => splitPayment({ payments: [{ method: 'cash', amount: 60 }, { method: 'card', amount: 40 }], total: 100, cashReceived: 50 })), 'CASH_SHORT');
  assert.equal(code(() => splitPayment({ payments: [{ method: 'bitcoin', amount: 100 }], total: 100 })), 400);
  assert.equal(code(() => splitPayment({ payments: [1, 2, 3, 4, 5].map(() => ({ method: 'cash', amount: 1 })), total: 5 })), 'BAD_PAYMENTS');
});

test('totais por metodo: venda mista conta as partes; normal conta o total', () => {
  const t = totalsByMethod([
    { payment_method: 'cash', total_amount: 1000 },
    { payment_method: 'mixed', total_amount: 800, payments: [{ method: 'mpesa', amount: 500 }, { method: 'cash', amount: 300 }] },
  ]);
  assert.deepEqual(t, { cash: 1300, mpesa: 500 });
});
