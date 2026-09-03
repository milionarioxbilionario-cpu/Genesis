import Dexie from 'dexie';

export const db = new Dexie('GenesisLocalDB');

db.version(2).stores({
  sales: 'id, tenant_id, status, created_at, sync',
  sale_items: 'id, sale_id, product_id, sync',
  products: 'id, tenant_id, name, barcode, sync',
  demand_captures: 'id, tenant_id, product_id, sync, requested_at',
  shift_closings: 'id, tenant_id, cashier_user_id, closed_at, sync'
});

// Example shape notes:
// sales: { id, tenant_id, cashier_user_id, items: [...], total_amount, payment_method, amount_received, change_given, status, sync, created_at, payload? }
// sale_items: { id, sale_id, product_id, quantity, unit_price, sync }
// products: { id, tenant_id, name, sell_price, stock_qty, barcode, sync }
// demand_captures: { id, tenant_id, product_id, quantity, sync, requested_at }
// shift_closings: { id, tenant_id, cashier_user_id, counted_amount, expected_amount, difference, sync, closed_at }

export default db;
