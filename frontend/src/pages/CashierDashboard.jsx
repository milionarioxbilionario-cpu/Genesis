import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import db from '../db/localDb';
import { printReceipt } from '../utils/receiptPrinter';
import { centsToMznInput, mznToCents } from '../utils/money';
import { useNavigate } from 'react-router-dom';
import {
  Banknote, Lock, LogOut, Search, ShoppingCart, X,
} from 'lucide-react';
import { clearHubSeller } from '../utils/hubSession';
import { useIsolatedScreen } from '../hooks/useIsolatedScreen';
import { AmbientLayer, Modal, Button, Receipt3D } from '../components/ui';
import QRCode from 'qrcode';

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

// Etiquetas de pagamento usadas no recibo (valores do backend sao tecnicos).
const PAYMENT_LABEL = { cash: 'Dinheiro', card: 'Cartão', mobile_money: 'M-Pesa' };

export default function CashierDashboard({ hubSeller = null, onRequestLeave = null, leaving = false, leaveMsg = '', onBackAttempt = null } = {}) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [message, setMessage] = useState('');
  // Desconto manual em MZN (convertido para centavos no payload).
  const [discountInput, setDiscountInput] = useState('');
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
  // Identidade da loja para o recibo (nome + local), vem de /api/auth/me.
  const [shopInfo, setShopInfo] = useState({ name: 'Genesis', location: '' });
  // Recibo: mostra a pre-visualizacao ANTES de imprimir (nome da loja, local,
  // caixista, numero do dia, QR). Antes disto o POS imprimia as cegas.
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptQr, setReceiptQr] = useState('');
  const [printingReceipt, setPrintingReceipt] = useState(false);

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
      .then((res) => {
        setOperatorName(res.data?.user?.name || '');
        const t = res.data?.user?.tenant;
        if (t?.name) setShopInfo({ name: t.name, location: t.location || '' });
      })
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

  // Subtotal bruto (soma dos items sem desconto). O desconto e aplicado
  // sobre este valor; o total final e o que e enviado ao backend.
  const subtotalAmount = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity * Number(item.unit_sell_price || 0), 0),
    [cart]
  );
  const totalCost = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity * Number(item.unit_cost_price || 0), 0),
    [cart]
  );
  const discountCents = useMemo(() => mznToCents(discountInput), [discountInput]);
  const finalTotal = useMemo(() => Math.max(0, Number(subtotalAmount) - Number(discountCents)), [subtotalAmount, discountCents]);
  const totals = useMemo(() => ({ totalAmount: finalTotal, totalCost: Number(totalCost), subtotalAmount: Number(subtotalAmount) }), [finalTotal, totalCost, subtotalAmount]);

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
    ? (amountReceived === '' ? finalTotal : mznToCents(amountReceived))
    : finalTotal;

  const changeGiven = Math.max(0, currentReceived - finalTotal);

  // QR do recibo (aponta para a verificacao da venda). Gerado localmente,
  // sem CDN — funciona offline assim que a venda entra.
  const buildReceiptQr = async (saleId) => {
    if (!saleId) return '';
    try {
      return await QRCode.toDataURL(`https://genesis.co.mz/verify/${saleId}`, {
        width: 220,
        margin: 1,
        color: { dark: '#111c2b', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    } catch (e) {
      console.warn('QR generation failed', e);
      return '';
    }
  };

  // Imprime o recibo a partir da pre-visualizacao (o caixista ja confirmou
  // loja, local, caixista, numero do dia e QR no modal).
  const printPreviewReceipt = async () => {
    if (!receiptPreview) return;
    setPrintingReceipt(true);
    try {
      const result = await printReceipt({
        shopName: shopInfo.name,
        shopLocation: shopInfo.location,
        cashierName: hubSeller?.name || operatorName || 'Caixa',
        sale: receiptPreview.sale,
        items: receiptPreview.items,
      });
      if (result && result.ok === false) {
        setMessage(`Recibo nao impresso: ${result.reason || 'erro'}. A venda ficou registada.`);
      } else {
        setMessage('Recibo enviado para a impressora.');
      }
      setReceiptPreview(null);
    } catch (e) {
      console.warn('Receipt printing failed', e);
      setMessage('Falha ao imprimir o recibo. A venda ficou registada.');
    } finally {
      setPrintingReceipt(false);
    }
  };

  async function submitSale() {
    if (locked) {
      setMessage('Perfil bloqueado: nao e possivel vender ate o dono desbloquear com a senha dele.');
      return;
    }
    if (!cart.length) {
      setMessage('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    // Calcular e validar desconto antes de construir o payload.
    const rawDiscount = mznToCents(discountInput);
    // Se o input estiver vazio ou zero, usar 0; se superar o subtotal, capear.
    const appliedDiscount = (discountInput === '' || rawDiscount <= 0)
      ? 0
      : Math.min(rawDiscount, Number(subtotalAmount));

    const payload = {
      ...(hubSeller?.id ? { seller_user_id: hubSeller.id } : {}),
      items: cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit_sell_price: Number(item.unit_sell_price),
        unit_cost_price: Number(item.unit_cost_price),
      })),
      discount_amount: appliedDiscount,
      total_amount: Number(finalTotal),
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
        daily_number: res?.data?.daily_number || 0,
        total_amount: Number(finalTotal),
        discount_amount: appliedDiscount,
        amount_received: Number(currentReceived),
        change_given: Number(changeGiven),
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      };
      // A venda esta registada. O recibo aparece em ecra (loja, local,
      // caixista, numero do dia e QR) para confirmar antes de imprimir.
      const qr = await buildReceiptQr(receiptSale.id);
      setReceiptQr(qr);
      setReceiptPreview({ sale: receiptSale, items: cart.map((item) => ({ ...item })) });
      setMessage('Venda registada com sucesso.');
      setCart([]);
      setAmountReceived('');
      setDiscountInput('');
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
        <div className="pos-lock">
          <AmbientLayer />
          <div className="pos-lock-card">
            <div className="pos-lock-icon"><Lock size={34} strokeWidth={2.2} aria-hidden="true" /></div>
            <div className="pos-lock-title">Perfil bloqueado</div>
            <p className="pos-lock-text">
              <strong>{hubSeller?.name || operatorName || 'Este caixista'}</strong> falhou 3 vezes o fecho de turno,
              declarando valores inferiores ao dinheiro real. O perfil fica trancado e o dono foi avisado.
            </p>
            <p className="pos-lock-audit">
              Tentativas falhadas: {lockAttempts} de 3 — todas registadas na auditoria do dono
            </p>
            <input
              autoFocus
              type="password"
              value={ownerUnlockPw}
              onChange={(e) => setOwnerUnlockPw(e.target.value)}
              placeholder="Senha do dono"
              className="pos-overlay-input"
              autoComplete="current-password"
            />
            {unlockErr && <div className="pos-overlay-error" role="alert">{unlockErr}</div>}
            <div className="pos-overlay-actions">
              <Button variant="ok" onClick={doUnlock} loading={unlockLoading}>
                {unlockLoading ? 'A desbloquear...' : 'Desbloquear perfil'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="pos-header-bar">
        <div className="pos-searchbar">
          <Search size={17} strokeWidth={2.2} aria-hidden="true" />
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
            <button type="button" onClick={onRequestLeave} disabled={leaving} className="cashier-close-shift cashier-close-shift-muted">
              {leaving ? 'A verificar...' : 'Sair do perfil'}
            </button>
          )}
          <button type="button" onClick={openBlindModal} className="cashier-close-shift">
            <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
            Fechar turno
          </button>
        </div>
      </div>

      {message && <div className="pos-message">{message}</div>}

      {hubSeller && (
        <div className="pos-message pos-message-flex">
          <span>A operar como <strong>{hubSeller.name}</strong> (perfil de caixista). As vendas ficam em nome dele; a operacao fica auditada ao dono.</span>
          <span className="pos-message-muted">Sair exige fecho de turno.</span>
        </div>
      )}
      {leaveMsg && (
        <div className="pos-message pos-message-err">{leaveMsg}</div>
      )}

      {blindOpen && (
        <div className="pos-overlay">
          <AmbientLayer />
          {blindInfo.locked ? (
            <div className="pos-overlay-card">
              <div className="pos-overlay-icon pos-overlay-icon-lock">
                <Lock size={30} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div className="pos-overlay-title">Perfil bloqueado</div>
              <p className="pos-overlay-text">Erros repetidos no fecho de turno. Só o dono pode desbloquear com a senha dele.</p>
              <input
                autoFocus
                type="password"
                value={ownerUnlockPw}
                onChange={(e) => setOwnerUnlockPw(e.target.value)}
                placeholder="Senha do dono"
                className="pos-overlay-input"
                autoComplete="current-password"
              />
              {unlockErr && <div className="pos-overlay-error" role="alert">{unlockErr}</div>}
              <div className="pos-overlay-actions">
                <Button variant="ok" onClick={doUnlock} loading={unlockLoading}>
                  {unlockLoading ? 'A desbloquear...' : 'Desbloquear'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="pos-overlay-card">
              <div className="pos-overlay-icon pos-overlay-icon-money">
                <Banknote size={30} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div className="pos-overlay-title">Quanto dinheiro foi feito hoje?</div>
              <p className="pos-overlay-text">Escreve o valor que contaste no caixa. O sistema vai comparar.</p>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                value={blindDeclared}
                onChange={(e) => setBlindDeclared(e.target.value)}
                placeholder="0,00"
                className="pos-overlay-amount"
                inputMode="decimal"
              />
              <div className="pos-overlay-currency">MZN</div>
              {blindErr && <div className="pos-overlay-error" role="alert">{blindErr}</div>}
              <div className="pos-overlay-attempts">Tentativas restantes: {blindInfo.remaining} de 3</div>
              <div className="pos-overlay-actions">
                <Button variant="ghost" onClick={() => setBlindOpen(false)}>Cancelar</Button>
                <Button variant="primary" onClick={doBlindClose} disabled={blindDeclared === ''} loading={blindLoading}>
                  {blindLoading ? 'A comparar...' : 'Confirmar fecho de turno'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {receiptPreview && (
        <Modal
          open
          title="Venda registada"
          hint={`Confirma o recibo antes de imprimir — venda nº ${String(receiptPreview.sale.daily_number || 0).padStart(3, '0')}`}
          onClose={() => setReceiptPreview(null)}
          width={430}
          footer={(
            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setReceiptPreview(null)}>Nova venda</Button>
              <Button variant="primary" onClick={printPreviewReceipt} disabled={printingReceipt}>
                {printingReceipt ? 'A imprimir...' : 'Imprimir recibo'}
              </Button>
            </div>
          )}
        >
          <Receipt3D>
          <div className="receipt-shell">
            <div className="receipt-shop">{shopInfo.name}</div>
            {shopInfo.location && <div className="receipt-sub">{shopInfo.location}</div>}

            <div className="receipt-meta">
              <div><span>Venda</span><strong>nº {String(receiptPreview.sale.daily_number || 0).padStart(3, '0')}</strong></div>
              <div><span>Caixista</span><strong>{hubSeller?.name || operatorName || 'Caixa'}</strong></div>
              <div><span>Data</span><strong>{new Date(receiptPreview.sale.created_at).toLocaleString('pt-MZ')}</strong></div>
              <div><span>Pagamento</span><strong>{PAYMENT_LABEL[receiptPreview.sale.payment_method] || receiptPreview.sale.payment_method}</strong></div>
            </div>

            <div className="receipt-items">
              {receiptPreview.items.map((item) => (
                <div key={item.product_id} className="receipt-line">
                  <span>{item.quantity}× {item.product_name}</span>
                  <strong>{money(item.quantity * Number(item.unit_sell_price || 0))}</strong>
                </div>
              ))}
            </div>

            <div className="receipt-totals">
              <div>
                <span>Subtotal</span>
                <strong>{money(Number(receiptPreview.sale.total_amount || 0) + Number(receiptPreview.sale.discount_amount || 0))}</strong>
              </div>
              {Number(receiptPreview.sale.discount_amount || 0) > 0 && (
                <div>
                  <span>Desconto</span>
                  <strong style={{ color: 'var(--danger)' }}>-{money(receiptPreview.sale.discount_amount)}</strong>
                </div>
              )}
              <div className="receipt-grand"><span>Total</span><strong>{money(receiptPreview.sale.total_amount)}</strong></div>
              {receiptPreview.sale.payment_method === 'cash' && (
                <>
                  <div><span>Recebido</span><strong>{money(receiptPreview.sale.amount_received)}</strong></div>
                  <div><span>Troco</span><strong>{money(receiptPreview.sale.change_given)}</strong></div>
                </>
              )}
            </div>

            {receiptQr && (
              <div className="receipt-qr">
                <img src={receiptQr} alt="QR do recibo" width="128" height="128" />
                <div className="receipt-qr-hint">Escaneia para verificar esta venda</div>
              </div>
            )}
          </div>
          </Receipt3D>
        </Modal>
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
            <div className="empty-cart">
              <ShoppingCart size={24} strokeWidth={1.8} aria-hidden="true" />
              <span>Carrinho vazio — escolha um produto.</span>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-header">
                    <div>
                      <div className="cart-item-name">{item.product_name}</div>
                      <div className="cart-item-unit">{money(item.unit_sell_price)} cada</div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.product_id)} className="remove-item" aria-label={`Remover ${item.product_name}`}>
                      <X size={14} strokeWidth={2.4} aria-hidden="true" />
                    </button>
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
            <div className="total-row"><span>Subtotal</span><strong>{money(totals.subtotalAmount)}</strong></div>
            <div className="total-row">
              <span>Desconto</span>
              <strong style={totals.subtotalAmount - totals.totalAmount > 0 ? { color: 'var(--danger)' } : undefined}>
                -{money(totals.subtotalAmount - totals.totalAmount)}
              </strong>
            </div>
            <div className="total-row total-highlight"><span>Total</span><strong>{money(totals.totalAmount)}</strong></div>
          </div>

          <div className="discount-field">
            <label className="discount-label">
              <span>Desconto (opcional)</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0,00"
                  className="pos-input"
                  inputMode="decimal"
                />
                <span className="pos-input-suffix">MZN</span>
              </div>
            </label>
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
