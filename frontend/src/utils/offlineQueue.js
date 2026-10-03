// Fila offline do POS: envia ao servidor o que ficou guardado no IndexedDB.
// Separada do React para poder ser testada em Node (fake-indexeddb) — ver
// frontend/tests/offline_queue.test.mjs.
//
// `post(path, body)` tem de devolver { status, data } e status 0 quando nao ha
// resposta (rede). O hook useOfflineSync injecta um fetch real.
import { SYNC_STATE, classifyStatus, salePayloadForSync } from './syncPolicy.js';

const QUEUES = [
  { table: 'sales', path: '/api/sales', order: 'created_at', body: salePayloadForSync },
  { table: 'demand_captures', path: '/api/demand_captures', order: 'requested_at', body: stripLocal },
  { table: 'shrinkage_records', path: '/api/shrinkage_records', order: 'recorded_at', body: stripLocal },
];

function stripLocal(row) {
  const { sync, sync_state, synced_at, rejected_at, reject_reason, reject_status, tenant_id, recorded_by, ...rest } = row;
  return rest;
}

export async function countQueue(db) {
  let pending = 0;
  let rejected = 0;
  for (const q of QUEUES) {
    pending += await db.table(q.table).where('sync_state').equals(SYNC_STATE.PENDING).count();
    rejected += await db.table(q.table).where('sync_state').equals(SYNC_STATE.REJECTED).count();
  }
  return { pending, rejected };
}

// Devolve { synced, rejected, retry, authFailed } desta passagem.
export async function runSync(db, post) {
  const result = { synced: 0, rejected: 0, retry: 0, authFailed: false };
  for (const q of QUEUES) {
    const rows = await db.table(q.table).where('sync_state').equals(SYNC_STATE.PENDING).sortBy(q.order);
    for (const row of rows) {
      let res;
      try {
        res = await post(q.path, q.body(row));
      } catch (err) {
        res = { status: 0, data: null };
      }
      const kind = classifyStatus(res.status);
      if (kind === 'synced') {
        await db.table(q.table).update(row.id, { sync_state: SYNC_STATE.SYNCED, synced_at: new Date().toISOString() });
        result.synced++;
      } else if (kind === 'rejected') {
        // Nao adianta reenviar (regra de negocio). Fica visivel no POS em vez
        // de ser tentada para sempre em silencio.
        await db.table(q.table).update(row.id, {
          sync_state: SYNC_STATE.REJECTED,
          rejected_at: new Date().toISOString(),
          reject_status: res.status,
          reject_reason: (res.data && res.data.error) || ('HTTP ' + res.status),
        });
        result.rejected++;
      } else if (kind === 'auth') {
        // Sessao expirou: parar a passagem (tudo daria 401) e tentar depois.
        result.authFailed = true;
        return result;
      } else {
        result.retry++;
        // Sem rede/servidor em baixo: o resto da fila tambem falharia agora.
        if (res.status === 0) return result;
      }
    }
  }
  return result;
}
