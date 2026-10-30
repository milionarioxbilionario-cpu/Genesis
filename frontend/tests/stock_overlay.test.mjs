// Terminal sem rede (pedido de 30/10/2026). Correr: node --test tests/stock_overlay.test.mjs
//  - o stock vindo do servidor desconta o que ainda esta na fila deste terminal
//    (o ultimo atum vendido sem ligacao nao pode voltar a aparecer com 1);
//  - recibo provisorio (sem numero do dia) e 2.a via marcada.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPending } from '../src/utils/stockOverlay.js';
import { documentBarcode, documentNumber, isProvisional, receiptTitle } from '../src/utils/code128.js';

const catalogo = [{ id: 'atum', name: 'Atum', stock_qty: 1 }, { id: 'pao', name: 'Pão', stock_qty: 50 }];

test('venda por enviar: o servidor ainda diz 1 atum, o terminal mostra 0 (esgotado)', () => {
  const pend = [{ payload: { items: [{ product_id: 'atum', quantity: 1 }] } }];
  const out = applyPending(catalogo, pend, []);
  assert.equal(out.find((p) => p.id === 'atum').stock_qty, 0);
  assert.equal(out.find((p) => p.id === 'pao').stock_qty, 50);
  assert.equal(catalogo[0].stock_qty, 1, 'nao altera a lista original');
});

test('varias vendas e quebras somam; nunca abaixo de zero; personalizados ignorados', () => {
  const pend = [
    { payload: { items: [{ product_id: 'pao', quantity: 3 }, { custom: true, product_name: 'Xarope', quantity: 2 }] } },
    { payload: { items: [{ product_id: 'pao', quantity: 2 }, { product_id: 'atum', quantity: 5 }] } },
  ];
  const out = applyPending(catalogo, pend, [{ product_id: 'pao', quantity: 1 }]);
  assert.equal(out.find((p) => p.id === 'pao').stock_qty, 44);
  assert.equal(out.find((p) => p.id === 'atum').stock_qty, 0);
});

test('sem nada por enviar: a mesma lista', () => {
  assert.equal(applyPending(catalogo, [], []), catalogo);
});

test('recibo provisorio: numero P + inicio do id, sem codigo de barras', () => {
  const sale = { id: '1a2b3c4d-0000-4000-8000-000000000000', offline: true, created_at: '2026-10-30T01:16:00' };
  assert.ok(isProvisional(sale));
  assert.equal(documentNumber(sale), '20261030-P1A2B');
  assert.equal(documentBarcode(sale), '');
  // Depois de enviada (tem numero do dia): numero normal.
  const sent = { ...sale, daily_number: 7 };
  assert.ok(!isProvisional(sent));
  assert.equal(documentNumber(sent), '20261030-007');
  assert.equal(documentBarcode(sent), '202610300007');
});

test('2.a via fica escrita no titulo do recibo', () => {
  const t = (x) => x;
  assert.equal(receiptTitle({ copy: true }, t), 'RECIBO · 2.ª VIA');
  assert.equal(receiptTitle({}, t), 'RECIBO');
});
