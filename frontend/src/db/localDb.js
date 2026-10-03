import Dexie from 'dexie';

export const db = new Dexie('GenesisLocalDB');

// bump db version to include synced_at and payload fields
// Version 5 ensures existing installs upgrade to both shrinkage_records and device_keys.
db.version(3).stores({
  sales: 'id, tenant_id, status, created_at, sync, synced_at',
  sale_items: 'id, sale_id, product_id, sync',
  products: 'id, tenant_id, name, barcode, sync, stock_qty',
  demand_captures: 'id, tenant_id, product_id, sync, requested_at',
  shift_closings: 'id, tenant_id, cashier_user_id, closed_at, sync'
});

try {
  db.version(4).stores({
    shrinkage_records: 'id, tenant_id, product_id, recorded_at, sync'
  });
} catch (e) {
  console.warn('Dexie version upgrade to include shrinkage_records failed or not needed', e.message);
}

try {
  db.version(5).stores({
    sales: 'id, tenant_id, status, created_at, sync, synced_at',
    sale_items: 'id, sale_id, product_id, sync',
    products: 'id, tenant_id, name, barcode, sync, stock_qty',
    demand_captures: 'id, tenant_id, product_id, sync, requested_at',
    shift_closings: 'id, tenant_id, cashier_user_id, closed_at, sync',
    shrinkage_records: 'id, tenant_id, product_id, recorded_at, sync',
    device_keys: 'id, device_name, created_at, secret'
  });
} catch (e) {
  console.warn('Dexie version upgrade to include device_keys failed or not needed', e.message);
}

// Versao 6 (2026-10-03) — a fila offline NUNCA sincronizou nada ate aqui.
// `sync` era um booleano indexado, e no IndexedDB um booleano NAO e uma chave
// valida: `where('sync').equals(false)` lancava DataError (provado com Dexie
// 3.2.7 + fake-indexeddb), o erro era engolido e nenhuma venda offline, pedido
// de reposicao ou quebra chegava ao servidor. Agora o estado vive em
// `sync_state` (string): 'pending' | 'synced' | 'rejected'. O upgrade converte
// os registos antigos (o modify percorre a tabela inteira, sem usar o indice).
db.version(6).stores({
  sales: 'id, tenant_id, status, created_at, sync_state, synced_at',
  sale_items: 'id, sale_id, product_id',
  products: 'id, tenant_id, name, barcode, stock_qty',
  demand_captures: 'id, tenant_id, product_id, requested_at, sync_state',
  shift_closings: 'id, tenant_id, cashier_user_id, closed_at',
  shrinkage_records: 'id, tenant_id, product_id, recorded_at, sync_state',
  device_keys: 'id, device_name, created_at, secret'
}).upgrade(async (tx) => {
  const toState = (row) => (row.sync === true ? 'synced' : 'pending');
  for (const table of ['sales', 'demand_captures', 'shrinkage_records']) {
    await tx.table(table).toCollection().modify((row) => {
      if (!row.sync_state) row.sync_state = toState(row);
      // Vendas antigas na fila foram guardadas SEM id no payload: cada reenvio
      // criava uma venda nova no servidor. O id local passa a ser a chave.
      if (table === 'sales' && row.payload && !row.payload.id) row.payload.id = row.id;
    });
  }
});

// Example shape notes:
// sales: { id, tenant_id, cashier_user_id, items: [...], total_amount, payment_method, amount_received, change_given, status, sync, created_at, payload? }
// sale_items: { id, sale_id, product_id, quantity, unit_price, sync }
// products: { id, tenant_id, name, sell_price, stock_qty, barcode, sync }
// demand_captures: { id, tenant_id, product_id, quantity, sync, requested_at }
// shift_closings: { id, tenant_id, cashier_user_id, counted_amount, expected_amount, difference, sync, closed_at }

export default db;
