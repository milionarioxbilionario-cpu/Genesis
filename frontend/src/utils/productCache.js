// Catalogo guardado no dispositivo (IndexedDB) — offline-first real.
//
// Antes: se /api/products falhasse, o POS mostrava 14 produtos de DEMONSTRACAO
// inventados (ids falsos), e as vendas desses produtos eram recusadas para
// sempre pelo servidor. Agora o catalogo verdadeiro fica guardado a cada
// carregamento bem sucedido e e usado quando nao ha rede.
import db from '../db/localDb';
import api from './api';

export async function loadCatalog() {
  try {
    const res = await api.get('/api/products');
    const active = (res.data || []).filter((p) => p.is_active !== false);
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
        const p = await db.products.get(it.product_id);
        if (p) await db.products.update(p.id, { stock_qty: Math.max(0, (p.stock_qty || 0) - it.quantity) });
      }
    });
  } catch { /* cache e auxiliar: nunca bloqueia a venda */ }
}

export async function clearCatalog() {
  try { await db.products.clear(); } catch { /* noop */ }
}
