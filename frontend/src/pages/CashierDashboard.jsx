import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import db from '../db/localDb';
import { printReceipt } from '../utils/receiptPrinter';
import { centsToMznInput, mznToCents } from '../utils/money';

const demoProducts = [
  // Prices in centavos; use UUID-like ids so offline sales won't fail schema validation on sync
  { id: '981d9ace-5c9f-4cfc-8898-6a1d916d3fe5', name: 'Cerveja Laurentina 550ml', category: 'Bebidas', sell_price: 9500, cost_price: 5500, stock_qty: 148 },
  { id: '85366c1c-ad7b-42df-8f82-102bdc5d72b9', name: 'Refrigerante Coca Cola 500ml', category: 'Bebidas', sell_price: 6000, cost_price: 4000, stock_qty: 210 },
  { id: '4bfe8388-941d-408a-b484-3cf615126386', name: 'Água Nana 1.5L', category: 'Bebidas', sell_price: 4500, cost_price: 2500, stock_qty: 18 },
  { id: 'a4e88390-3cc9-4cd1-ae5e-98148be305d8', name: 'Vinho Tinto Casa 750ml', category: 'Bebidas', sell_price: 48000, cost_price: 30000, stock_qty: 24 },
  { id: 'f61eb35a-d7dc-4fb9-9afc-266b05b857e7', name: 'Arroz Agulha 5kg', category: 'Mercearia', sell_price: 52000, cost_price: 42000, stock_qty: 36 },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Óleo Alimentar 2L', category: 'Mercearia', sell_price: 31000, cost_price: 25000, stock_qty: 41 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Farinha de Milho', category: 'Mercearia', sell_price: 39000, cost_price: 31000, stock_qty: 27 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Sal Refinado 1kg', category: 'Mercearia', sell_price: 4000, cost_price: 2300, stock_qty: 58 },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Sabão Azul 400g', category: 'Higiene', sell_price: 7500, cost_price: 5200, stock_qty: 64 },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Pasta de Dentes', category: 'Higiene', sell_price: 13000, cost_price: 9000, stock_qty: 22 },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Papel Higiênico 4un', category: 'Higiene', sell_price: 7500, cost_price: 5500, stock_qty: 18 },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Pão de Forma', category: 'Padaria', sell_price: 15000, cost_price: 12000, stock_qty: 15 },
  { id: '88888888-8888-8888-8888-888888888888', name: 'Frango', category: 'Talho', sell_price: 18500, cost_price: 15000, stock_qty: 12 },
  { id: '99999999-9999-9999-9999-999999999999', name: 'Cerveja Lager 2L', category: 'Bebidas', sell_price: 12000, cost_price: 9000, stock_qty: 30 },
];

const money = (cents) => {
  const value = Number(cents || 0) / 100;
  return `MZN ${value.toFixed(2).replace('.', ',')}`;
};

const currencyNumber = (cents) => Number(cents || 0) / 100;

export default function CashierDashboard({ hubSeller = null } = {}) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [message, setMessage] = useState('');
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);
  const [countedAmount, setCountedAmount] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('0');
  const [cancelPinConfigured, setCancelPinConfigured] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUnauthorized = (err) => {
    if (err?.response?.status === 401) {
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  const handleDemandCapture = async (product) => {
    try {
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
      const record = {
        id,
        tenant_id: product.tenant_id || 'local-tenant',
        product_id: product.id,
        recorded_by: null,
        requested_at: new Date().toISOString(),
        sync: false
      };
      await db.demand_captures.add(record);
      setMessage(`Pedido de reposição registado para ${product.name}.`);
    } catch (err) {
      console.error('Failed to create demand capture', err);
      setMessage('Não foi possível registar o pedido de reposição.');
    }
  };

  const handleShrinkage = async (product) => {
    const quantity = Number(window.prompt(`Quantidade perdida para ${product.name}?`, '1') || 0);
    if (!quantity || quantity <= 0) return;

    try {
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
      const record = {
        id,
        tenant_id: product.tenant_id || 'local-tenant',
        product_id: product.id,
        quantity,
        reason: 'other',
        recorded_by: null,
        recorded_at: new Date().toISOString(),
        sync: false
      };

      await db.transaction('rw', db.shrinkage_records, db.products, async () => {
        await db.shrinkage_records.add(record);
        const existing = await db.products.get(product.id);
        if (existing) {
          const nextQty = Math.max(0, Number(existing.stock_qty || 0) - quantity);
          await db.products.update(existing.id, { stock_qty: nextQty });
        }
      });

      await loadProducts();
      setMessage(`Perda registada: ${quantity} unidade(s) de ${product.name}.`);
    } catch (err) {
      console.error('Failed to create shrinkage record', err);
      setMessage('Não foi possível registar a perda.');
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/products');
      const nextProducts = (res.data || []).filter((p) => p.is_active !== false);
      setProducts(nextProducts.length ? nextProducts : demoProducts);
    } catch (err) {
      console.error(err);
      if (!handleUnauthorized(err)) {
        setProducts(demoProducts);
      }
    }
  };

  const loadRecentSales = async () => {
    try {
      const res = await api.get('/api/sales');
      setRecentSales(res.data || []);
    } catch (err) {
      console.error(err);
      if (!handleUnauthorized(err)) {
        setRecentSales([]);
      }
    }
  };

  const syncPendingSales = async () => {
    try {
      const pendingSales = await db.sales.where('sync').equals(false).toArray();
      for (const queuedSale of pendingSales) {
        const payload = queuedSale.payload || queuedSale;
        const response = await api.post('/api/sales', payload);
        if (response.status >= 200 && response.status < 300) {
          await db.sales.update(queuedSale.id, { sync: true, synced_at: new Date().toISOString() });
        }
      }
    } catch (err) {
      handleUnauthorized(err);
      console.warn('Offline sync skipped:', err.message || err);
    }
  };

  const loadCancelPinStatus = async () => {
    try {
      const res = await api.get('/api/sales/cancel-pin-status');
      setCancelPinConfigured(Boolean(res.data?.configured));
    } catch (err) {
      console.error('Cancel PIN status query failed', err);
      setCancelPinConfigured(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadRecentSales();
    syncPendingSales();
    loadCancelPinStatus();
  }, []);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, Number(product.stock_qty || 0)) }
            : item
        );
      }

      return [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_sell_price: Number(product.sell_price || 0),
          unit_cost_price: Number(product.cost_price || 0),
          stock_qty: Number(product.stock_qty || 0),
        },
      ];
    });
  };

  const adjustQuantity = (productId, delta) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product_id !== productId) return item;
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.product_id !== productId));
  };

  const totals = useMemo(() => {
    const totalAmount = cart.reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_sell_price || 0),
      0
    );
    const totalCost = cart.reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_cost_price || 0),
      0
    );
    return { totalAmount, totalCost };
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const name = String(product.name || '').toLowerCase();
      const category = String(product.category || '').toLowerCase();
      const barcode = String(product.barcode || '').toLowerCase();
      return name.includes(query) || category.includes(query) || barcode.includes(query);
    });
  }, [products, searchTerm]);

  const currentReceived = paymentMethod === 'cash'
    ? (amountReceived === '' ? totals.totalAmount : mznToCents(amountReceived))
    : totals.totalAmount;

  const changeGiven = Math.max(0, currentReceived - totals.totalAmount);

  async function submitSale() {
    if (!cart.length) {
      setMessage('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    const payload = {
      ...(hubSeller?.id ? { seller_user_id: hubSeller.id } : {}),
      items: cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit_sell_price: Number(item.unit_sell_price),
        unit_cost_price: Number(item.unit_cost_price),
      })),
      total_amount: Number(totals.totalAmount),
      total_cost: Number(totals.totalCost),
      payment_method: paymentMethod,
      amount_received: Number(currentReceived),
      change_given: Number(changeGiven),
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    try {
      setLoading(true);
      const res = await api.post('/api/sales', payload);
      const receiptSale = {
        id: res?.data?.id || crypto.randomUUID(),
        total_amount: Number(totals.totalAmount),
        amount_received: Number(currentReceived),
        change_given: Number(changeGiven),
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      };
      try {
        await printReceipt({ shopName: 'Genesis', sale: receiptSale, items: cart });
      } catch (printerErr) {
        console.warn('Receipt printing failed', printerErr);
      }
      setMessage('Venda registada com sucesso.');
      setCart([]);
      setAmountReceived('');
      await loadProducts();
      await loadRecentSales();
    } catch (err) {
      const queuedSale = {
        id: crypto.randomUUID(),
        tenant_id: 'offline',
        status: 'pending',
        created_at: new Date().toISOString(),
        sync: false,
        payload,
      };

      await db.sales.put(queuedSale);
      setMessage('Servidor indisponível. Venda guardada localmente e vai sincronizar quando o backend voltar.');
      setCart([]);
      setAmountReceived('');
      await loadRecentSales();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setExpectedAmount(String(centsToMznInput(totals.totalAmount)));
  }, [totals.totalAmount]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
        return;
      }

      if (event.key === 'Escape') {
        setCart([]);
        setMessage('Cesto limpo.');
        return;
      }

      if (event.key === 'Enter' && cart.length > 0) {
        event.preventDefault();
        submitSale();
        return;
      }

      if (/^\d$/.test(event.key) && filteredProducts.length > 0) {
        const index = Number(event.key) - 1;
        const product = filteredProducts[index];
        if (product) {
          addToCart(product);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProducts, cart.length, addToCart]);

  const closeShift = async () => {
    const payload = {
      counted_amount: mznToCents(countedAmount),
      expected_amount: mznToCents(expectedAmount),
      // Em modo Hub: o fecho fica em nome do caixista cujo perfil está activo
      // (o backend valida; sem isto o perfil dele nunca destrava).
      ...(hubSeller?.id ? { cashier_user_id: hubSeller.id } : {}),
    };

    if (!payload.counted_amount && !payload.expected_amount) {
      setMessage('Insira o valor contado e o valor esperado antes de fechar o turno.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/shift_closings', payload);
      setClosingOpen(false);
      setCountedAmount('');
      setExpectedAmount(String(centsToMznInput(totals.totalAmount)));
      setMessage(`Fecho de turno registado com sucesso. Diferença: ${money(res.data.difference || 0)}`);
    } catch (err) {
      console.error(err);
      setMessage('Não foi possível registar o fecho de turno.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSale = async (sale) => {
    if (!cancelPinConfigured) {
      setMessage('O PIN de cancelamento ainda não foi configurado no painel do proprietário.');
      return;
    }

    const pin = window.prompt('Digite o PIN de cancelamento do proprietário:');
    if (!pin || !pin.trim()) {
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/sales/${sale.id}/cancel`, {
        pin: pin.trim(),
        reason: 'Cancelado no POS'
      });
      setMessage('Venda cancelada com sucesso.');
      await loadRecentSales();
    } catch (err) {
      console.error(err);
      const errorMessage = err?.response?.data?.error || 'Não foi possível cancelar a venda.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-shell">
      <div className="pos-header-bar">
        <div className="pos-searchbar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20L16.65 16.65" />
          </svg>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar em tudo…"
            aria-label="Buscar produtos"
          />
          <span className="shortcut">⌘K</span>
        </div>

        <div className="pos-top-actions">
          <button type="button" className="demo-chip">Dados de demonstração</button>
          <div className="user-pill">SB</div>
          <div className="user-name">Sérgio Bila</div>
        </div>
      </div>

      <div className="pos-page-head">
        <div>
          <h1>Caixa</h1>
          <p>Venda rápida, em poucos cliques.</p>
        </div>
        <button type="button" onClick={() => setClosingOpen(true)} className="cashier-close-shift">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 7h10v10H7z" />
            <path d="M9 7V5h6v2" />
          </svg>
          Fechar turno
        </button>
      </div>

      {message && <div className="pos-message">{message}</div>}

      {closingOpen && (
        <div className="shift-modal">
          <div className="shift-form-grid">
            <label className="shift-field">
              <span>Valor contado no caixa</span>
              <input
                type="number"
                step="0.01"
                value={countedAmount}
                onChange={(e) => setCountedAmount(e.target.value)}
                placeholder="Ex.: 1500.00"
              />
            </label>
            <label className="shift-field">
              <span>Valor esperado</span>
              <input
                type="number"
                step="0.01"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
                placeholder="Ex.: 1500.00"
              />
            </label>
          </div>
          <div className="shift-actions">
            <button type="button" onClick={() => setClosingOpen(false)} className="secondary-btn">Cancelar</button>
            <button type="button" onClick={closeShift} className="primary-btn">Registar fecho de turno</button>
          </div>
        </div>
      )}

      <div className="pos-layout">
        <div className="product-panel">
          <div className="product-toolbar">
            <div className="pill-group">
              <button type="button" className="pill active">Todas</button>
              <button type="button" className="pill">Bebidas</button>
              <button type="button" className="pill">Mercearia</button>
              <button type="button" className="pill">Higiene</button>
              <button type="button" className="pill">Padaria</button>
              <button type="button" className="pill">Talho</button>
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addToCart(product)}
                className="product-card"
              >
                <div className="product-card-head">
                  <div className="product-name">{product.name}</div>
                  <div className="product-plus">+</div>
                </div>
                <div className="product-meta">
                  <span className="product-price">{money(product.sell_price)}</span>
                  <span className="product-stock">Stock: {product.stock_qty || 0}</span>
                </div>
                <div className="product-rank">{index + 1}</div>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-products">Nenhum produto encontrado para a pesquisa atual.</div>
          )}
        </div>

        <aside className="cart-panel">
          <div className="cart-title">Carrinho</div>

          {cart.length === 0 ? (
            <div className="empty-cart">Carrinho vazio — escolha um produto.</div>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-header">
                    <div>
                      <div className="cart-item-name">{item.product_name}</div>
                      <div className="cart-item-unit">{money(item.unit_sell_price)} cada</div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.product_id)} className="remove-item">Remover</button>
                  </div>

                  <div className="cart-item-controls">
                    <div className="quantity-box">
                      <button type="button" onClick={() => adjustQuantity(item.product_id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => adjustQuantity(item.product_id, 1)}>+</button>
                    </div>
                    <div className="cart-item-total">{money(item.quantity * item.unit_sell_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="totals-box">
            <div className="total-row"><span>Subtotal</span><strong>{money(totals.totalAmount)}</strong></div>
            <div className="total-row"><span>Desconto</span><strong>{money(0)}</strong></div>
            <div className="total-row total-highlight"><span>Total</span><strong>{money(totals.totalAmount)}</strong></div>
          </div>

          <div className="payment-box">
            <label className="payment-label">
              <span>Pagamento</span>
              <div className="payment-methods">
                <button type="button" className={`method-btn ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>Dinheiro</button>
                <button type="button" className={`method-btn ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>Cartão</button>
                <button type="button" className={`method-btn ${paymentMethod === 'mobile_money' ? 'selected' : ''}`} onClick={() => setPaymentMethod('mobile_money')}>M-Pesa</button>
              </div>
            </label>

            {paymentMethod === 'cash' && (
              <label className="cash-field">
                <span>Dinheiro recebido</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="MZN"
                />
              </label>
            )}

            <div className="total-row"><span>Troco</span><strong>{money(changeGiven)}</strong></div>
            <button type="button" onClick={submitSale} disabled={loading || cart.length === 0} className="finalize-sale">
              Finalizar venda
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
