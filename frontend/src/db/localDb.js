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

// Example shape notes:
// sales: { id, tenant_id, cashier_user_id, items: [...], total_amount, payment_method, amount_received, change_given, status, sync, created_at, payload? }
// sale_items: { id, sale_id, product_id, quantity, unit_price, sync }
// products: { id, tenant_id, name, sell_price, stock_qty, barcode, sync }
// demand_captures: { id, tenant_id, product_id, quantity, sync, requested_at }
// shift_closings: { id, tenant_id, cashier_user_id, counted_amount, expected_amount, difference, sync, closed_at }

export default db;
