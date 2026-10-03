const test = require('node:test');
const assert = require('node:assert');
const { normalizePaymentMethod } = require('../src/utils/paymentMethods');

test('M-Pesa e e-Mola ficam separados', () => {
  assert.strictEqual(normalizePaymentMethod('mpesa'), 'mpesa');
  assert.strictEqual(normalizePaymentMethod('M-Pesa'), 'mpesa');
  assert.strictEqual(normalizePaymentMethod('emola'), 'emola');
  assert.strictEqual(normalizePaymentMethod('E-Mola'), 'emola');
});

test('valor antigo mobile_money continua aceite (vendas offline pendentes)', () => {
  assert.strictEqual(normalizePaymentMethod('mobile_money'), 'mobile_money');
});

test('dinheiro e cartao inalterados', () => {
  assert.strictEqual(normalizePaymentMethod('cash'), 'cash');
  assert.strictEqual(normalizePaymentMethod('Cartão'), 'card');
});

test('metodo desconhecido e recusado com 400', () => {
  assert.throws(() => normalizePaymentMethod('bitcoin'), (e) => e.statusCode === 400);
});
