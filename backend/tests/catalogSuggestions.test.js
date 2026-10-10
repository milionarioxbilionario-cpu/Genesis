const test = require('node:test');
const assert = require('node:assert');
const { nameKey, outsideCatalog, groupSuggestions } = require('../src/utils/catalogSuggestions');

test('nameKey ignora acentos, maiusculas e espacos', () => {
  assert.strictEqual(nameKey('  Água   NAMAACHA 1,5L '), 'agua namaacha 1,5l');
});

test('outsideCatalog: so o que nao esta no catalogo, sem repetir', () => {
  const r = outsideCatalog([{ name: 'Agua Namaacha 1,5L' }, { name: 'Cotonetes' }, { name: 'cotonetes ' }, { name: 'Agulhas' }], ['Água Namaacha 1,5L']);
  assert.deepStrictEqual(r.map((p) => p.name), ['Cotonetes', 'Agulhas']);
});

test('groupSuggestions: junta lojas, medias de preco, sem nomes de loja', () => {
  const t0 = new Date('2026-10-01'); const t1 = new Date('2026-10-05');
  const g = groupSuggestions([
    { tenant_id: 'a', business_type: 'mercearia', name_key: 'cotonetes', product_name: 'Cotonetes', category: 'Higiene', icon: null, barcode: null, cost_price: 3000, sell_price: 5000, created_at: t0 },
    { tenant_id: 'b', business_type: 'mercearia', name_key: 'cotonetes', product_name: 'Cotonetes 100un', category: 'Higiene', icon: 'bath', barcode: null, cost_price: 4000, sell_price: 6000, created_at: t1 },
    { tenant_id: 'a', business_type: 'bottle_store', name_key: 'gelo', product_name: 'Gelo', category: 'Gelo', icon: null, barcode: null, cost_price: 1000, sell_price: 2000, created_at: t0 },
  ]);
  assert.strictEqual(g.length, 2);
  assert.deepStrictEqual({ name: g[0].product_name, stores: g[0].stores, avg_cost: g[0].avg_cost, avg_sell: g[0].avg_sell, icon: g[0].icon }, { name: 'Cotonetes 100un', stores: 2, avg_cost: 3500, avg_sell: 5500, icon: 'bath' });
  assert.ok(!('tenants' in g[0]) && !('tenant_id' in g[0]));
});
