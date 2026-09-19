import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import db from '../db/localDb';
import { printReceipt } from '../utils/receiptPrinter';
import { centsToMznInput, mznToCents } from '../utils/money';
import { useNavigate } from 'react-router-dom';
import { clearHubSeller } from '../utils/hubSession';
import { useIsolatedScreen } from '../hooks/useIsolatedScreen';

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

export default function CashierDashboard({ hubSeller = null, onRequestLeave = null, leaving = false, leaveMsg = '', onBackAttempt = null } = {}) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [message, setMessage] = useState('');
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(false);
  // Bloqueio do perfil (fecho cego). Quando bloqueado o POS fica
  // TOTALMENTE inutilizavel ate o dono desbloquear com a senha dele.
  const [locked, setLocked] = useState(false);
  const [lockAttempts, setLockAttempts] = useState(0);
  const [operatorName, setOperatorName] = useState('');
  const navigate = useNavigate();
  // POS e ecra isolado: o botao "voltar" do browser nao sai sem fechar o
  // turno. Sem PosGate (caixista directo) mostra erro local; com PosGate o
  // callback escreve em `leaveMsg` por baixo do botao "Sair do perfil".
  useIsolatedScreen(() => {
    if (typeof onBackAttempt === 'function') { onBackAttempt(); return; }
    setMessage('Termina o turno (fecho cego) antes de sair do caixa. O botao "voltar" do browser esta bloqueado neste ecra.');
  });
  const [blindOpen, setBlindOpen] = useState(false);
  const [blindDeclared, setBlindDeclared] = useState('');
  const [blindErr, setBlindErr] = useState('');
  const [blindInfo, setBlindInfo] = useState({ attempts: 0, remaining: 3, locked: false });
  const [blindLoading, setBlindLoading] = useState(false);
  const [ownerUnlockPw, setOwnerUnlockPw] = useState('');
  const [unlockErr, setUnlockErr] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const activeCashierId = hubSeller?.id || null;
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
    api.get('/api/auth/me')
      .then((res) => setOperatorName(res.data?.user?.name || ''))
      .catch(() => {});
  }, []);

  // O perfil bloqueado tranca logo na entrada do POS — antes bastava nao
  // clicar em "Fechar turno" para continuar a vender.
  useEffect(() => {
    if (!activeCashierId) return undefined;
    let alive = true;
    api.get(`/api/owner/cashiers/${activeCashierId}/shift-state`)
      .then((res) => {
        if (!alive) return;
        setLockAttempts(res.data?.attempts || 0);
        setLocked(Boolean(res.data?.locked));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [activeCashierId]);

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
    if (locked) {
      setMessage('Perfil bloqueado: nao e possivel vender ate o dono desbloquear com a senha dele.');
      return;
    }
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

  const openBlindModal = async () => {
    setBlindErr(''); setBlindDeclared('');
    try {
      const res = await api.get(`/api/owner/cashiers/${activeCashierId}/shift-state`);
      setBlindInfo({ attempts: res.data?.attempts || 0, remaining: Math.max(0, 3 - (res.data?.attempts || 0)), locked: Boolean(res.data?.locked) });
    } catch (err) {
      if (!handleUnauthorized(err)) setBlindErr('Não foi possível verificar o turno.');
    }
    setBlindOpen(true);
  };

  const doBlindClose = async () => {
    setBlindErr(''); setBlindLoading(true);
    try {
      const declared = mznToCents(blindDeclared);
      const res = await api.post(`/api/owner/cashiers/${activeCashierId}/close-shift-blind`, { declared_amount: declared });
      setBlindOpen(false);
      setMessage(res.data?.message || 'Fecho registado.');
      clearHubSeller();
      navigate('/hub');
    } catch (err) {
      if (handleUnauthorized(err)) return;
      const d = err?.response?.data || {};
      setBlindErr(d.error || 'Erro no fecho do turno.');
      setBlindInfo({ attempts: d.attemptNo || 0, remaining: d.remaining || 0, locked: Boolean(d.locked) });
      if (d.locked) { setLocked(true); setLockAttempts(d.attemptNo || 3); }
    } finally {
      setBlindLoading(false);
    }
  };

  const doUnlock = async () => {
    setUnlockErr(''); setUnlockLoading(true);
    try {
      await api.post(`/api/owner/cashiers/${activeCashierId}/unlock-shift`, { password: ownerUnlockPw });
      setUnlockErr(''); setBlindInfo({ attempts: 0, remaining: 3, locked: false });
      setLocked(false); setLockAttempts(0);
      setOwnerUnlockPw('');
    } catch (err) {
      setUnlockErr(err?.response?.data?.error || 'Senha do dono incorrecta.');
    } finally {
      setUnlockLoading(false);
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
      {locked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.985)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🔒</div>
          <div style={{ color: '#fb7185', fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em' }}>PERFIL BLOQUEADO</div>
          <p style={{ color: '#94a3b8', maxWidth: 560, margin: '14px 0 4px', lineHeight: 1.6 }}>
            <strong style={{ color: '#edf2f7' }}>{hubSeller?.name || operatorName || 'Este caixista'}</strong> falhou 3 vezes o fecho de turno,
            declarando valores inferiores ao dinheiro real. O perfil fica trancado e o dono foi avisado.
          </p>
          <p style={{ color: '#475569', fontSize: 13, marginBottom: 22 }}>
            Tentativas falhadas: {lockAttempts} de 3 - todas registadas na auditoria do dono
          </p>
          <input autoFocus type="password" value={ownerUnlockPw} onChange={(e) => setOwnerUnlockPw(e.target.value)}
            placeholder="Senha do dono"
            style={{ width: 320, padding: '15px 18px', borderRadius: 14, background: '#111c2b', border: '1px solid #30455f', color: '#edf2f7', textAlign: 'center', fontSize: 16 }} />
          {unlockErr && <div style={{ marginTop: 12, color: '#fb7185', fontWeight: 800 }}>{unlockErr}</div>}
          <button type="button" disabled={unlockLoading} onClick={doUnlock}
            style={{ marginTop: 20, padding: '14px 42px', borderRadius: 16, background: unlockLoading ? '#166534' : '#22c55e', color: '#052e16', fontWeight: 900, border: 'none', cursor: unlockLoading ? 'wait' : 'pointer', fontSize: 16 }}>
            {unlockLoading ? 'A desbloquear...' : 'Desbloquear perfil'}
          </button>
        </div>
      )}
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
          <div className="user-pill">{(hubSeller?.name || operatorName || 'C')[0].toUpperCase()}</div>
          <div className="user-name">{hubSeller?.name || operatorName || 'Caixa'}</div>
        </div>
      </div>

      <div className="pos-page-head">
        <div>
          <h1>Caixa</h1>
          <p>Venda rápida, em poucos cliques.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {hubSeller && onRequestLeave && (
            <button type="button" onClick={onRequestLeave} disabled={leaving} className="cashier-close-shift"
              style={{ background: 'rgba(148,163,184,0.14)', color: '#cbd5e1' }}>
              {leaving ? 'A verificar...' : 'Sair do perfil'}
            </button>
          )}
          <button type="button" onClick={openBlindModal} className="cashier-close-shift">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 7h10v10H7z" />
              <path d="M9 7V5h6v2" />
            </svg>
            Fechar turno
          </button>
        </div>
      </div>

      {message && <div className="pos-message">{message}</div>}

      {hubSeller && (
        <div className="pos-message" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span>A operar como <strong>{hubSeller.name}</strong> (perfil de caixista). As vendas ficam em nome dele; a operacao fica auditada ao dono.</span>
          <span style={{ opacity: 0.75 }}>Sair exige fecho de turno.</span>
        </div>
      )}
      {leaveMsg && (
        <div className="pos-message" style={{ borderColor: 'rgba(244,63,94,0.45)', color: '#fda4af' }}>{leaveMsg}</div>
      )}

      {blindOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{background:'rgba(2,6,23,0.97)',backdropFilter:'blur(10px)'}}>
          {blindInfo.locked ? (
            <div style={{textAlign:'center',maxWidth:460,padding:24}}>
              <div style={{fontSize:56,marginBottom:12}}>🔒</div>
              <div style={{color:'#fb7185',fontSize:26,fontWeight:900,marginBottom:10}}>Perfil bloqueado</div>
              <p style={{color:'#cbd5e1',marginBottom:22}}>Erros repetidos no fecho do turno. Só o dono pode desbloquear com a senha dele.</p>
              <input autoFocus type="password" value={ownerUnlockPw} onChange={(e)=>setOwnerUnlockPw(e.target.value)}
                placeholder="Senha do dono" style={{width:280,padding:'12px 16px',borderRadius:12,background:'#111c2b',border:'1px solid #30455f',color:'#edf2f7',textAlign:'center'}} />
              {unlockErr && <div style={{marginTop:10,color:'#fb7185',fontWeight:700}}>{unlockErr}</div>}
              <div style={{display:'flex',gap:12,marginTop:18,justifyContent:'center'}}>
                <button type="button" disabled={unlockLoading} onClick={doUnlock} style={{padding:'12px 26px',borderRadius:14,background:'#22c55e',color:'#052e16',fontWeight:900,border:'none'}}>{unlockLoading?'A desbloquear…':'Desbloquear'}</button>

              </div>
            </div>
          ) : (
            <div style={{textAlign:'center',maxWidth:520,padding:24}}>
              <div style={{fontSize:44,marginBottom:10}}>💰</div>
              <div style={{color:'#edf2f7',fontSize:30,fontWeight:900,letterSpacing:'-0.03em'}}>Quanto dinheiro foi feito hoje?</div>
              <p style={{color:'#64748b',margin:'10px 0 26px'}}>Escreve o valor que contaste no caixa. O sistema vai comparar.</p>
              <input autoFocus type="number" step="0.01" min="0" value={blindDeclared} onChange={(e)=>setBlindDeclared(e.target.value)}
                placeholder="0,00"
                style={{width:280,padding:'14px 18px',fontSize:30,fontWeight:900,textAlign:'center',background:'transparent',border:'none',borderBottom:'4px solid #7aa5d6',color:'#edf2f7',outline:'none'}} />
              {blindErr && <div style={{marginTop:22,padding:'12px 20px',borderRadius:14,background:'rgba(244,63,94,0.12)',border:'1px solid rgba(244,63,94,0.4)',color:'#fb7185',fontWeight:800}}>{blindErr}</div>}
              <div style={{marginTop:10,color:'#475569',fontSize:13}}>Tentativas restantes: {blindInfo.remaining} de 3</div>
              <button type="button" disabled={blindLoading||blindDeclared===''} onClick={doBlindClose}
                style={{marginTop:30,padding:'16px 46px',borderRadius:16,background:'#e50914',color:'#fff',fontSize:17,fontWeight:900,border:'none',cursor:blindLoading?'wait':'pointer'}}>
                {blindLoading?'A comparar…':'Confirmar fecho de turno'}</button>
              <div style={{marginTop:16}}><button type="button" onClick={()=>setBlindOpen(false)} style={{background:'transparent',border:'none',color:'#475569',fontSize:13,cursor:'pointer'}}>Cancelar</button></div>
            </div>
          )}
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
