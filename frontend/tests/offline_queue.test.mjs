// Testes da fila offline do POS — Dexie real do projecto sobre fake-indexeddb.
// Correr: node --test tests/offline_queue.test.mjs   (dentro de frontend/)
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
import { classifyStatus, shouldQueueOffline, newUuid, salePayloadForSync, SYNC_STATE } from '../src/utils/syncPolicy.js';
import { runSync, countQueue } from '../src/utils/offlineQueue.js';

// 1) Uma base IGUAL a dos POS ja instalados (versao 5, `sync` booleano).
async function seedLegacyV5() {
  const old = new Dexie('GenesisLocalDB');
  old.version(5).stores({
    sales: 'id, tenant_id, status, created_at, sync, synced_at',
    sale_items: 'id, sale_id, product_id, sync',
    products: 'id, tenant_id, name, barcode, sync, stock_qty',
    demand_captures: 'id, tenant_id, product_id, sync, requested_at',
    shift_closings: 'id, tenant_id, cashier_user_id, closed_at, sync',
    shrinkage_records: 'id, tenant_id, product_id, recorded_at, sync',
    device_keys: 'id, device_name, created_at, secret',
  });
  await old.sales.bulkPut([
    { id: 'legacy-pending', created_at: '2026-10-01T10:00:00Z', sync: false, payload: { total_amount: 100 } },
    { id: 'legacy-synced', created_at: '2026-10-01T09:00:00Z', sync: true, payload: { id: 'legacy-synced' } },
  ]);
  await old.demand_captures.put({ id: 'dc-1', product_id: 'p', requested_at: '2026-10-01T10:00:00Z', sync: false });
  await old.shrinkage_records.put({ id: 'sh-1', product_id: 'p', quantity: 1, reason: 'other', recorded_at: '2026-10-01T10:00:00Z', sync: false, recorded_by: null, tenant_id: 'local-tenant' });
  // Prova do bug original: a query antiga lanca DataError.
  await assert.rejects(() => old.sales.where('sync').equals(false).toArray(), /DataError|valid key/i);
  old.close();
}

let db;
test('migracao v5 -> v6 converte a fila antiga e poe o id no payload', async () => {
  await seedLegacyV5();
  db = (await import('../src/db/localDb.js')).default;
  await db.open();
  const pending = await db.sales.get('legacy-pending');
  const synced = await db.sales.get('legacy-synced');
  assert.equal(pending.sync_state, 'pending');
  assert.equal(pending.payload.id, 'legacy-pending', 'reenvios passam a ser idempotentes');
  assert.equal(synced.sync_state, 'synced');
  assert.equal((await db.demand_captures.get('dc-1')).sync_state, 'pending');
  assert.deepEqual(await countQueue(db), { pending: 3, rejected: 0 });
});

test('classificacao: so rede/5xx vao para a fila; 4xx sao recusas', () => {
  assert.equal(classifyStatus(201), 'synced');
  assert.equal(classifyStatus(0), 'retry');
  assert.equal(classifyStatus(503), 'retry');
  assert.equal(classifyStatus(429), 'retry');
  assert.equal(classifyStatus(401), 'auth');
  for (const s of [400, 403, 404, 409, 423]) assert.equal(classifyStatus(s), 'rejected', String(s));
  assert.equal(shouldQueueOffline({}), true, 'sem resposta (rede caiu)');
  assert.equal(shouldQueueOffline({ response: { status: 502 } }), true);
  assert.equal(shouldQueueOffline({ response: { status: 403 } }), false, 'caixista bloqueado NAO vai para a fila');
  assert.equal(shouldQueueOffline({ response: { status: 409 } }), false, 'preco/stock NAO vai para a fila');
});

test('newUuid funciona sem crypto.randomUUID (POS aberto por http://IP)', () => {
  const original = globalThis.crypto.randomUUID;
  try {
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
    const id = newUuid();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } finally {
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: original, configurable: true });
  }
});

test('salePayloadForSync usa sempre o mesmo id', () => {
  const row = { id: 'abc', payload: { total_amount: 5 }, sync_state: 'pending' };
  assert.equal(salePayloadForSync(row).id, 'abc');
  assert.equal(salePayloadForSync(row).id, salePayloadForSync(row).id);
  assert.equal(salePayloadForSync(row).sync_state, undefined);
});

test('sem rede: nada muda e a passagem pára', async () => {
  const calls = [];
  const r = await runSync(db, async (path, body) => { calls.push(path); return { status: 0, data: null }; });
  assert.equal(calls.length, 1, 'parou na primeira falha de rede');
  assert.equal(r.retry, 1);
  assert.deepEqual(await countQueue(db), { pending: 3, rejected: 0 });
});

test('5xx: fica pendente para tentar depois', async () => {
  await runSync(db, async () => ({ status: 500, data: { error: 'x' } }));
  assert.deepEqual(await countQueue(db), { pending: 3, rejected: 0 });
});

test('sincroniza, marca recusas com motivo e nao volta a enviar o que ja foi', async () => {
  const sent = [];
  const post = async (path, body) => {
    sent.push({ path, body });
    if (path === '/api/shrinkage_records') return { status: 409, data: { error: 'Quantidade a registar excede stock actual' } };
    return { status: 201, data: { id: body.id } };
  };
  const r = await runSync(db, post);
  assert.equal(r.synced, 2);
  assert.equal(r.rejected, 1);
  const saleCall = sent.find((c) => c.path === '/api/sales');
  assert.equal(saleCall.body.id, 'legacy-pending');
  const shCall = sent.find((c) => c.path === '/api/shrinkage_records');
  assert.equal(shCall.body.recorded_by, undefined, 'campos locais (recorded_by null, tenant_id falso) nao vao para o servidor');
  assert.equal(shCall.body.tenant_id, undefined);
  const sh = await db.shrinkage_records.get('sh-1');
  assert.equal(sh.sync_state, 'rejected');
  assert.match(sh.reject_reason, /excede stock/);
  assert.deepEqual(await countQueue(db), { pending: 0, rejected: 1 });

  sent.length = 0;
  await runSync(db, post);
  assert.equal(sent.length, 0, 'nada pendente => nada enviado');
});

test('401: pára a passagem sem marcar nada como recusado', async () => {
  await db.sales.put({ id: newUuid(), created_at: '2026-10-02T10:00:00Z', sync_state: SYNC_STATE.PENDING, payload: { total_amount: 1 } });
  const r = await runSync(db, async () => ({ status: 401, data: null }));
  assert.equal(r.authFailed, true);
  assert.deepEqual(await countQueue(db), { pending: 1, rejected: 1 });
});
