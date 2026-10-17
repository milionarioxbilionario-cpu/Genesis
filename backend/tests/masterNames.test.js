// Fase 9.8: nome ingles dos produtos da loja, juntado pelo nome do catalogo-mestre.
// Correr: node --test tests/masterNames.test.js  (dentro de backend/)
const test = require('node:test');
const assert = require('node:assert');
const { englishIndex, withEnglishNames } = require('../src/utils/masterNames');

test('so produtos com o nome do catalogo-mestre recebem name_en', () => {
  const index = englishIndex([
    { product_name: 'Água Namaacha 1,5L', product_name_en: 'Namaacha Water 1.5L' },
    { product_name: 'Gelo (saco 2kg)', product_name_en: '  ' },
    { product_name: 'Sem ingles', product_name_en: null },
  ]);
  const out = withEnglishNames([
    { id: 1, name: 'agua  namaacha 1,5l' },
    { id: 2, name: 'Água Namaacha 1,5L (fresca)' },
    { id: 3, name: 'Gelo (saco 2kg)' },
  ], index);
  assert.deepStrictEqual(out.map((p) => p.name_en), ['Namaacha Water 1.5L', null, null]);
  assert.strictEqual(out[0].id, 1, 'o resto do produto fica igual');
});
