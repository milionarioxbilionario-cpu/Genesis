// Fase 15.5: venda ao peso. node --test tests/units.test.mjs (dentro de frontend/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { lineAmount, formatQty, parseQty, qtyInput, humanQty, formatHuman } from '../src/utils/units.js';
import { setLang } from '../src/i18n/core.js';

const require = createRequire(import.meta.url);
const server = require('../../backend/src/utils/units.js');

test('o ecra e o servidor fazem a mesma conta (o recibo bate com a venda gravada)', () => {
  for (const unit of ['un', 'kg', 'l', 'm']) {
    for (let q = 0; q <= 4000; q += 53) for (const p of [1, 99, 4500, 35000, 123457]) {
      assert.equal(lineAmount(q, p, unit), server.lineAmount(q, p, unit), `${q} ${p} ${unit}`);
    }
  }
});

test('peso escrito pelo caixista -> gramas inteiras (sem floats)', () => {
  assert.equal(parseQty('1,25', 'kg'), 1250);
  assert.equal(parseQty('1.250', 'kg'), 1250);
  assert.equal(parseQty('0,5', 'l'), 500);
  assert.equal(parseQty('2', 'kg'), 2000);
  assert.equal(parseQty('0,001', 'kg'), 1);
  assert.equal(parseQty('1,2345', 'kg'), null, 'mais de 3 casas: recusado');
  assert.equal(parseQty('abc', 'kg'), null);
  assert.equal(parseQty('', 'kg'), null);
  assert.equal(parseQty('3', 'un'), 3);
  assert.equal(parseQty('1,5', 'un'), null, 'unidades nao tem decimais');
});

test('mostrar: na lingua de quem ve', () => {
  setLang('pt');
  assert.equal(formatQty(1250, 'kg'), '1,25 kg');
  assert.equal(formatQty(3, 'un'), '3');
  assert.equal(qtyInput(1250, 'kg'), '1,25');
  assert.equal(formatHuman(1.25, 'kg'), '1,25 kg');
  setLang('en');
  assert.equal(formatQty(1250, 'kg'), '1.25 kg');
  setLang('pt');
  assert.equal(humanQty(1250, 'kg'), 1.25);
});
