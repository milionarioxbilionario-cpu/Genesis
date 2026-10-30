// Etapa B: o que o leitor do guarda aceita como recibo.
// Correr: node --test tests/guard.test.js  (dentro de backend/)
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCode } = require('../src/routes/guard');

const ID = '1a2b3c4d-0000-4000-8000-00000000abcd';

test('QR do recibo (endereco /verify/<id>) e id solto', () => {
  assert.deepEqual(parseCode('https://genesismz.com/verify/' + ID), { id: ID });
  assert.deepEqual(parseCode(ID.toUpperCase()), { id: ID });
  assert.deepEqual(parseCode('  ' + ID + '\n'), { id: ID });
});

test('codigo de barras do recibo: AAAAMMDD + numero do dia (4 algarismos)', () => {
  assert.deepEqual(parseCode('202610300007'), { day: ['2026', '10', '30'], n: 7 });
});

test('o que nao e recibo e recusado', () => {
  assert.equal(parseCode('6001234000017'), null, 'EAN de um produto (13 algarismos)');
  assert.equal(parseCode('abc'), null);
  assert.equal(parseCode(''), null);
});
