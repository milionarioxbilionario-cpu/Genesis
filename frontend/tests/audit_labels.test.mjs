// Auditoria legivel para o dono (pedido de 30/10/2026): sem codigos (ids),
// dinheiro em MT, nomes em vez de ids, pagamento em portugues.
// Correr: node --test tests/audit_labels.test.mjs  (dentro de frontend/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { setLang } from '../src/i18n/core.js';
import '../src/i18n/en/common.js';
import '../src/i18n/en/owner.js';
import { diffRows } from '../src/utils/auditLabels.js';

const KLEYTON = '657061dd-7cf3-498c-8709-f4e629b6cdd1';
// O registo real que o fundador viu no tablet (CREATE_SALE de 30/10, 01:18).
const venda = {
  total_amount: 44500, subtotal: 44500, total_cost: 31700, discount_amount: 0, payment_method: 'mixed',
  item_count: 3, cashier_user_id: KLEYTON, operated_by: KLEYTON, client_created_at: '2026-10-30T01:18:00.000Z',
};
const nbsp = (s) => String(s).replace(/\s/g, ' ');

test('venda: nada de ids, dinheiro em MT, pagamento traduzido, caixista pelo nome', () => {
  setLang('pt');
  const rows = diffRows(null, venda, { [KLEYTON]: 'Kleyton' });
  const flat = rows.map((r) => `${r.label}=${nbsp(r.after)}`);
  assert.ok(!flat.some((x) => x.includes(KLEYTON)), 'nenhum codigo do caixista: ' + flat.join(' | '));
  assert.ok(!rows.some((r) => r.key === 'operated_by'), '«operated by» escondido (ja esta em «Quem»)');
  assert.ok(flat.includes('Subtotal=445,00 MT'), flat.join(' | '));
  assert.ok(flat.includes('Custo da mercadoria=317,00 MT'), flat.join(' | '));
  assert.ok(flat.includes('Pagamento=Pagamento dividido'), flat.join(' | '));
  assert.ok(flat.includes('Caixista=Kleyton'), flat.join(' | '));
  assert.ok(flat.includes('Nº de artigos=3'), flat.join(' | '));
  assert.ok(rows.every((r) => !/_/.test(r.label)), 'nenhum nome tecnico com _');
});

test('id sem nome conhecido nao aparece (um codigo nao diz nada ao dono)', () => {
  setLang('pt');
  const rows = diffRows(null, { product_id: 'abc-123', delta: -2, reason: 'Partido' }, {});
  assert.ok(!rows.some((r) => r.key === 'product_id'));
  assert.ok(rows.some((r) => r.key === 'delta'));
});

test('produto e fornecedor pelo nome; ingles tambem', () => {
  setLang('en');
  const rows = diffRows(null, { product_id: 'p1', supplier_id: 's1', payment_method: 'cash' }, { p1: 'Atum Bom Petisco', s1: 'Grossista Xai-Xai' });
  const flat = rows.map((r) => `${r.label}=${r.after}`);
  assert.ok(flat.includes('Product=Atum Bom Petisco'), flat.join(' | '));
  assert.ok(flat.includes('Supplier=Grossista Xai-Xai'), flat.join(' | '));
  assert.ok(flat.includes('Payment=Cash'), flat.join(' | '));
  setLang('pt');
});

test('datas: «Hora no dispositivo» sai como data e hora, nao o texto ISO', () => {
  setLang('pt');
  const rows = diffRows(null, { client_created_at: '2026-10-30T01:18:00.000Z' }, {});
  assert.ok(!/T01:18|Z$/.test(rows[0].after), rows[0].after);
  assert.ok(/30\/10/.test(rows[0].after), rows[0].after);
});

// Os campos que o servidor grava hoje (backend/src/routes/sales.js e pos.js):
// todos tem de ter nome em portugues (a captura de 30/10 ainda mostrava
// «discount amount»).
test('todos os campos gravados nas vendas, descontos e 2.a via tem nome', () => {
  setLang('pt');
  const registos = [
    { total_amount: 1, subtotal: 1, total_cost: 1, discount_amount: 1, payment_method: 'cash', item_count: 1, cashier_user_id: KLEYTON, operated_by: KLEYTON, client_created_at: '2026-10-30T01:18:00.000Z' },
    { subtotal: 1, discount_amount: 1, free_limit: 1 },
    { daily_number: 2, total_amount: 1, terminal_id: 't', offline_at: '2026-10-30T01:18:00.000Z' },
  ];
  for (const r of registos) {
    for (const row of diffRows(null, r, { [KLEYTON]: 'Kleyton' })) {
      assert.ok(!row.label.includes('_') && row.label !== row.key.replace(/_/g, ' '), 'campo sem nome: ' + row.key);
    }
  }
});
