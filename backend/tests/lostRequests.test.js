const test = require('node:test');
const assert = require('node:assert');
const { groupLostDemand, groupLostRequests } = require('../src/utils/lostRequests');

test('dono: agrupa catalogo por produto e fora do catalogo por nome (sem acentos/maiusculas)', () => {
  const g = groupLostDemand([
    { product_id: 'p1', product: { name: '2M', sell_price: 6500 }, quantity: 2 },
    { product_id: 'p1', product: { name: '2M', sell_price: 6500 }, quantity: 1 },
    { product_id: null, product_name: 'Cotonetes', name_key: 'cotonetes', quantity: 3, unit_price: 2500 },
    { product_id: null, product_name: 'COTONETES', name_key: 'cotonetes', quantity: 1, unit_price: 3500 },
  ]);
  assert.strictEqual(g.length, 2);
  const cat = g.find((x) => x.product_id === 'p1');
  assert.deepStrictEqual([cat.requests, cat.units, cat.outside, cat.estimated_value], [2, 3, false, 19500]);
  const out = g.find((x) => x.outside);
  assert.deepStrictEqual([out.requests, out.units, out.unit_price, out.estimated_value], [2, 4, 3000, 12000]);
  assert.strictEqual(g[0].outside, true, 'ordenado por unidades');
});

test('dono: fora do catalogo sem preco nao inventa valor; registos antigos contam 1 unidade', () => {
  const g = groupLostDemand([
    { product_id: null, product_name: 'Agulhas', name_key: 'agulhas', quantity: 5, unit_price: null },
    { product_id: 'p2', product: { name: 'Sumol', sell_price: null } },
  ]);
  assert.strictEqual(g.find((x) => x.outside).estimated_value, null);
  assert.strictEqual(g.find((x) => !x.outside).units, 1);
});

test('admin: por tipo de negocio e nome, conta lojas distintas, sem nomes de lojas', () => {
  const rows = [
    { tenant_id: 't1', business_type: 'bottle_store', product_name: 'Gelo 2kg', name_key: 'gelo 2kg', quantity: 4, unit_price: 5000, requested_at: '2026-10-01T10:00:00Z' },
    { tenant_id: 't1', business_type: 'bottle_store', product_name: 'gelo 2kg', name_key: 'gelo 2kg', quantity: 1, unit_price: null, requested_at: '2026-10-02T10:00:00Z' },
    { tenant_id: 't2', business_type: 'bottle_store', product_name: 'Gelo 2KG', name_key: 'gelo 2kg', quantity: 2, unit_price: 7000, requested_at: '2026-10-03T10:00:00Z' },
    { tenant_id: 't3', business_type: 'mercearia', product_name: 'Gelo 2kg', name_key: 'gelo 2kg', quantity: 1, requested_at: '2026-10-01T10:00:00Z' },
  ];
  const g = groupLostRequests(rows);
  assert.strictEqual(g.length, 2, 'tipos diferentes ficam separados');
  const b = g[0];
  assert.deepStrictEqual([b.business_type, b.stores, b.requests, b.units, b.avg_price, b.min_price, b.max_price, b.product_name], ['bottle_store', 2, 3, 7, 6000, 5000, 7000, 'Gelo 2KG']);
  assert.ok(!('tenants' in b) && !JSON.stringify(g).includes('t1'), 'nenhum id/nome de loja sai');
});
