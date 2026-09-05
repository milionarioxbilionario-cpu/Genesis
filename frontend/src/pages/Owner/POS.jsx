import React, { useEffect, useState, useRef } from 'react';
import db from '../../db/localDb';
import useOfflineSync from '../../hooks/useOfflineSync';
import PosProductList from '../../components/PosProductList';
import PosCart from '../../components/PosCart';
import { printReceipt } from '../../utils/receiptPrinter';

function formatMoney(cents) {
  return (cents / 100).toFixed(2) + ' MZN';
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const { isOnline, pendingCount } = useOfflineSync();
  
  async function createDemandCapture(product) {
    try {
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'dc-' + Date.now() + Math.random().toString(36).slice(2,8);
      const rec = {
        id,
        tenant_id: product.tenant_id || 'tenant-local',
        product_id: product.id,
        recorded_by: null,
        requested_at: new Date().toISOString(),
        sync: false
      };
      await db.demand_captures.add(rec);
      alert('Pedido de reposição registado localmente');
    } catch (err) {
      console.error('Failed to create demand capture', err);
      alert('Erro ao registar pedido');
    }
  }

  async function createShrinkage(product, quantity = 1, reason = 'other') {
    try {
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'sh-' + Date.now() + Math.random().toString(36).slice(2,8);
      const rec = {
        id,
        tenant_id: product.tenant_id || 'tenant-local',
        product_id: product.id,
        quantity: quantity,
        reason,
        recorded_by: null,
        recorded_at: new Date().toISOString(),
        sync: false
      };

      await db.transaction('rw', db.shrinkage_records, db.products, async () => {
        await db.shrinkage_records.add(rec);
        const prod = await db.products.get(product.id);
        if (prod) {
          const newQty = Math.max(0, (prod.stock_qty || 0) - quantity);
          await db.products.update(prod.id, { stock_qty: newQty });
        }
      });

      alert('Registo de perda criado localmente');
    } catch (err) {
      console.error('Failed to create shrinkage record', err);
      alert('Erro ao registar perda');
    }
  }


  useEffect(() => {
    // load products from indexedDB; if empty, seed from master catalog
    let mounted = true;
    async function loadAndSeed() {
      const count = await db.products.count();
      if (count === 0) {
        try {
          const master = await import('../../data/master_catalogs.json');
          const templates = master.templates || [];
          const samples = templates[0]?.sampleProducts || [];
          const toInsert = samples.map((p) => ({
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'p-' + Date.now() + Math.random().toString(36).slice(2,8),
            tenant_id: 'tenant-local',
            name: p.name,
            category: templates[0].categories ? templates[0].categories[0] : 'Geral',
            barcode: p.sku || null,
            image_url: null,
            cost_price: Math.round((p.cost_mzn || p.cost || 0) * 100),
            sell_price: Math.round((p.price_mzn || p.price || 0) * 100),
            stock_qty: p.stock || 0,
            min_stock: 5,
            has_expiry: false,
            is_active: true,
            created_at: new Date().toISOString()
          }));
          await db.products.bulkAdd(toInsert);
        } catch (err) {
          console.error('Failed to seed local products', err);
        }
      }

      const all = await db.products.where('is_active').equals(true).toArray();
      if (!mounted) return;
      setProducts(all);
    }
    loadAndSeed();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    // focus search input for barcode scanners / keyboard
    if (searchRef.current) searchRef.current.focus();
  }, []);

  function addToCart(product) {
    setCart((cur) => {
      const idx = cur.findIndex((c) => c.id === product.id);
      if (idx >= 0) {
        const next = [...cur];
        next[idx].quantity += 1;
        return next;
      }
      return [...cur, { id: product.id, name: product.name, unit_price: product.sell_price, quantity: 1, unit_cost: product.cost_price }];
    });
  }

  function updateQty(productId, qty) {
    setCart((cur) => cur.map((it) => (it.id === productId ? { ...it, quantity: Math.max(0, qty) } : it)).filter((it) => it.quantity > 0));
  }

  function removeItem(productId) {
    setCart((cur) => cur.filter((it) => it.id !== productId));
  }

  function searchProducts(list, q) {
    if (!q) return list;
    const qq = q.toLowerCase();
    return list.filter((p) => (p.name || '').toLowerCase().includes(qq) || (p.barcode || '').toLowerCase() === qq);
  }

  async function finalizeSale({ amountReceived = null, paymentMethod = 'cash' } = {}) {
    if (cart.length === 0) return alert('Carrinho vazio');
    const saleId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'sale-' + Date.now();
    const totalAmount = cart.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    const totalCost = cart.reduce((s, it) => s + (it.unit_cost || 0) * it.quantity, 0);
    const amtReceived = amountReceived === null ? totalAmount : amountReceived;
    const changeGiven = Math.max(0, amtReceived - totalAmount);

    const sale = {
      id: saleId,
      tenant_id: cart[0]?.tenant_id || null,
      cashier_user_id: null,
      items: cart.map((it) => ({ product_id: it.id, product_name: it.name, quantity: it.quantity, unit_sell_price: it.unit_price, unit_cost_price: it.unit_cost })),
      total_amount: totalAmount,
      total_cost: totalCost,
      payment_method: paymentMethod,
      amount_received: amtReceived,
      change_given: changeGiven,
      status: 'completed',
      sync: false,
      created_at: new Date().toISOString(),
      payload: {}
    };

    // write to indexedDB transactionally
    try {
      await db.transaction('rw', db.sales, db.sale_items, db.products, async () => {
        await db.sales.add(sale);
        for (const it of sale.items) {
          const saleItem = {
            id: saleId + '::' + it.product_id,
            sale_id: saleId,
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: it.quantity,
            unit_sell_price: it.unit_sell_price,
            unit_cost_price: it.unit_cost_price,
            sync: false
          };
          await db.sale_items.add(saleItem);
          // deduct local stock
          const prod = await db.products.get(it.product_id);
          if (prod) {
            const newQty = Math.max(0, (prod.stock_qty || 0) - it.quantity);
            await db.products.update(prod.id, { stock_qty: newQty });
          }
        }
      });

      setCart([]);
      alert('Venda registada localmente. Será sincronizada quando online.');
      // Attempt to show/print receipt (best-effort)
      try {
        await printReceipt({ shopName: 'Genesis', sale, items: sale.items });
      } catch (e) {
        console.warn('Falha ao gerar recibo', e);
      }
    } catch (err) {
      console.error('Erro ao gravar venda localmente', err);
      alert('Erro ao registar venda localmente');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded shadow p-4 grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar produto ou código de barras" className="flex-1 p-2 border rounded" />
            <div className="text-sm p-2">{isOnline ? (<span className="text-green-600">● Online</span>) : (<span className="text-yellow-600">● Offline</span>)} {pendingCount > 0 && <span className="ml-2 text-gray-600">{pendingCount} pendentes</span>}</div>
          </div>
          <PosProductList products={searchProducts(products, query)} onAdd={addToCart} onDemand={createDemandCapture} onShrink={createShrinkage} />
        </div>

        <div className="col-span-1">
          <PosCart cart={cart} onUpdateQty={updateQty} onRemove={removeItem} onCheckout={finalizeSale} formatMoney={formatMoney} />
        </div>
      </div>
    </div>
  );
}
