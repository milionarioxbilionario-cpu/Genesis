import test from 'node:test';
import assert from 'node:assert';
import { buildEscPosReceipt, fold, twoCols, WIDTH } from '../src/utils/escpos.js';

const bytes = buildEscPosReceipt({
  shopName: 'Bottle Store Central', shopLocation: 'Polana, Maputo', cashierName: 'Carlos',
  sale: { daily_number: 7, created_at: '2026-10-11T10:00:00Z', payment_method: 'Dinheiro', total_amount: 19500, amount_received: 20000, change_given: 500 },
  items: [{ product_name: 'Água Namaacha 1,5L', quantity: 3, unit_sell_price: 6500 }],
  verifyUrl: 'https://genesismz.com/verify/abc',
});
const ascii = Buffer.from(bytes).toString('latin1');

test('comeca por ESC @ e acaba com avanco + corte', () => {
  assert.deepStrictEqual([...bytes.slice(0, 2)], [0x1b, 0x40]);
  assert.deepStrictEqual([...bytes.slice(-7)], [0x1b, 0x64, 4, 0x1d, 0x56, 0x42, 0x00]);
});

test('texto sem acentos e so ASCII', () => {
  assert.strictEqual(fold('Água Namaacha — 2×'), 'Agua Namaacha - 2x');
  assert.ok(ascii.includes('Agua Namaacha 1,5L'));
  assert.ok(!/[À-ÿ]/.test(ascii.replace(/[\x00-\x1f]/g, '')), 'nenhum caracter acentuado');
});

test('linhas de 32 colunas com valores em MT a partir de centavos', () => {
  const l = twoCols('  3 x 65,00', '195,00');
  assert.strictEqual(l.length, WIDTH);
  assert.ok(ascii.includes(l));
  assert.ok(ascii.includes(twoCols('TOTAL MT', '195,00')));
  assert.ok(ascii.includes(twoCols('Troco', '5,00')));
});

test('QR verdadeiro (GS ( k) com o endereco de verificacao', () => {
  const url = 'https://genesismz.com/verify/abc';
  const store = [0x1d, 0x28, 0x6b, (url.length + 3) & 0xff, 0x00, 0x31, 0x50, 0x30];
  const i = Buffer.from(bytes).indexOf(Buffer.from(store));
  assert.ok(i > 0, 'comando de guardar o QR presente');
  assert.strictEqual(Buffer.from(bytes.slice(i + store.length, i + store.length + url.length)).toString(), url);
  assert.ok(Buffer.from(bytes).indexOf(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30])) > i, 'imprime o QR depois de o guardar');
});
