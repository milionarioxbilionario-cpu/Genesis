// Politica da fila offline do POS (2026-10-03). Funcoes puras, testadas em
// frontend/tests/offline_queue.test.mjs.
//
// Regra central: so se guarda/reenvia o que FALHOU POR CAUSA DA REDE ou do
// servidor. Uma recusa de regra de negocio (4xx: caixista bloqueado, preco
// errado, stock insuficiente) NAO e "servidor indisponivel" — antes o POS
// guardava-a na fila, dizia "venda guardada" e a venda nunca existia.

export const SYNC_STATE = Object.freeze({ PENDING: 'pending', SYNCED: 'synced', REJECTED: 'rejected' });

// 'synced' | 'auth' | 'retry' | 'rejected'
export function classifyStatus(status) {
  const s = Number(status) || 0;
  if (s >= 200 && s < 300) return 'synced';
  if (s === 401) return 'auth';
  if (s === 0 || s === 408 || s === 429 || s >= 500) return 'retry';
  return 'rejected';
}

// Erro do axios ao finalizar uma venda: vai para a fila offline?
// Sem resposta (rede caiu, timeout) ou 5xx/408/429 -> sim. 4xx -> nao.
export function shouldQueueOffline(err) {
  return classifyStatus(err?.response?.status) === 'retry';
}

// crypto.randomUUID so existe em contexto seguro (https ou localhost). Um POS
// aberto por IP da rede local (http://192.168.x.x) nao o tem — e o catch que
// guardava a venda offline rebentava ali mesmo. getRandomValues existe sempre.
export function newUuid() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Corpo a enviar para uma venda da fila. O id e SEMPRE o mesmo em todos os
// reenvios: se a resposta se perder depois de o servidor gravar, o reenvio
// devolve a venda existente em vez de a duplicar.
export function salePayloadForSync(row) {
  const payload = { ...(row.payload || row) };
  if (!payload.id) payload.id = row.id;
  delete payload.sync;
  delete payload.sync_state;
  return payload;
}
