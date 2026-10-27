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

// Fase 15.1: logotipo, codigo de barras, gaveta e dados fiscais.
import { ditherToRaster, rasterBytes, barcodeBytes, DRAWER_PULSE } from '../src/utils/escpos.js';

test('logotipo: preto/branco com 384 pontos no maximo; transparente = papel', () => {
  const w = 800; const h = 200;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (x < w / 2) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255; } // metade preta
    else data[i + 3] = 0; // metade transparente
  }
  const r = ditherToRaster({ data, width: w, height: h });
  assert.strictEqual(r.width, 384);
  assert.strictEqual(r.height, 96);
  assert.strictEqual(r.widthBytes, 48);
  assert.strictEqual(r.bytes[0], 0xff, 'lado preto = pontos pretos');
  assert.strictEqual(r.bytes[47], 0x00, 'lado transparente = papel');
  const cmd = rasterBytes(r);
  assert.deepStrictEqual(cmd.slice(0, 8), [0x1d, 0x76, 0x30, 0x00, 48, 0, 96, 0]);
  assert.strictEqual(cmd.length, 8 + 48 * 96);
});

test('codigo de barras CODE128 C nativo; texto que nao e de algarismos aos pares fica de fora', () => {
  const b = barcodeBytes('202610250007');
  const k = b.indexOf(0x6b);
  assert.deepStrictEqual(b.slice(k - 1, k + 5), [0x1d, 0x6b, 73, 8, 0x7b, 0x43]);
  assert.deepStrictEqual(b.slice(k + 5), [20, 26, 10, 25, 0, 7]);
  assert.deepStrictEqual(barcodeBytes('123'), []);
});

test('recibo completo: gaveta logo a seguir ao ESC @, NUIT, telefone, numero do documento e mensagem final', () => {
  const r = buildEscPosReceipt({
    shopName: 'Bottle Store Central', shopLocation: 'Polana', shopPhone: '841234567', shopNuit: '400123456', footer: 'Volte sempre!',
    cashierName: 'Carlos', docNumber: '20261025-007', barcode: '202610250007', openDrawer: true,
    sale: { daily_number: 7, total_amount: 1000, payment_method: 'Dinheiro', amount_received: 1000, change_given: 0 }, items: [],
  });
  assert.deepStrictEqual([...r.slice(2, 7)], DRAWER_PULSE);
  const a = Buffer.from(r).toString('latin1');
  for (const s of ['NUIT 400123456', 'Tel. 841234567', '20261025-007', 'Volte sempre!', 'Genesis MZ']) assert.ok(a.includes(s), s);
  const semGaveta = buildEscPosReceipt({ shopName: 'X', sale: { total_amount: 1 }, items: [] });
  assert.ok(Buffer.from(semGaveta).indexOf(Buffer.from(DRAWER_PULSE)) < 0, 'sem openDrawer nao abre a gaveta');
});
