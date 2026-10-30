// Catalogo guardado no dispositivo (IndexedDB) — offline-first real.
//
// Antes: se /api/products falhasse, o POS mostrava 14 produtos de DEMONSTRACAO
// inventados (ids falsos), e as vendas desses produtos eram recusadas para
// sempre pelo servidor. Agora o catalogo verdadeiro fica guardado a cada
// carregamento bem sucedido e e usado quando nao ha rede.
import db from '../db/localDb';
import api from './api';
import { SYNC_STATE } from './syncPolicy.js';
import { applyPending } from './stockOverlay.js';

async function pendingRows() {
  try {
    const [sales, shrink] = await Promise.all([
      db.sales.where('sync_state').equals(SYNC_STATE.PENDING).toArray(),
      db.shrinkage_records.where('sync_state').equals(SYNC_STATE.PENDING).toArray(),
    ]);
    return { sales, shrink };
  } catch { return { sales: [], shrink: [] }; }
}

export async function loadCatalog() {
  try {
    const res = await api.get('/api/products');
    const { sales, shrink } = await pendingRows();
    const active = applyPending((res.data || []).filter((p) => p.is_active !== false), sales, shrink);
    try {
      await db.transaction('rw', db.products, async () => {
        await db.products.clear();
        await db.products.bulkPut(active);
      });
    } catch (e) { console.warn('cache do catalogo falhou', e); }
    return { products: active, source: 'online' };
  } catch (err) {
    if (err?.response && err.response.status < 500) throw err; // 401/403: nao e falta de rede
    const cached = await db.products.toArray().catch(() => []);
    return { products: cached, source: 'cache' };
  }
}

// Venda guardada offline: baixa o stock no catalogo local para o caixista nao
// vender o que ja nao existe enquanto espera pela rede.
export async function decrementCached(items) {
  try {
    await db.transaction('rw', db.products, async () => {
      for (const it of items) {
        if (!it.product_id) continue; // pedido personalizado: sem stock
        const p = await db.products.get(it.product_id);
        if (p) await db.products.update(p.id, { stock_qty: Math.max(0, (p.stock_qty || 0) - it.quantity) });
      }
    });
  } catch { /* cache e auxiliar: nunca bloqueia a venda */ }
}

export async function clearCatalog() {
  try { await db.products.clear(); } catch { /* noop */ }
}
