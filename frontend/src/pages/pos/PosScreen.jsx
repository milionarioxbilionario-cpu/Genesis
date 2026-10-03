import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Minus, Plus, Search, Trash2, WifiOff } from 'lucide-react';
import api from '../../utils/api';
import db from '../../db/localDb';
import useOfflineSync from '../../hooks/useOfflineSync';
import { newUuid, shouldQueueOffline, SYNC_STATE } from '../../utils/syncPolicy';
import { loadCatalog, decrementCached } from '../../utils/productCache';
import { money, errorMessage } from '../../utils/format';
import { Alert, Button, IconButton, MoneyInput, Segmented, useToast, cx } from '../../components/ui';
import { AuthorizationPinDialog, CloseShiftDialog, DemandDialog, ReceiptDialog, RecentSalesDialog, ShrinkageDialog } from './PosDialogs';

const PAYMENTS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'mobile_money', label: 'M-Pesa / e-Mola' },
  { value: 'card', label: 'Cartão' },
];

// Ecra de vendas do terminal. Regras de interface:
//  - o campo de pesquisa recebe o leitor de codigo de barras (Enter = adiciona
//    o produto com esse codigo). Nao ha atalhos globais de digitos nem um Enter
//    global que finalizasse a venda — o leitor disparava vendas por acidente.
//  - so vai para a fila offline o que falhou por rede/servidor; uma recusa de
//    regra mostra o motivo e mantem o cesto.
export default function PosScreen({ info, cashier, onLock }) {
  const toast = useToast();
  const { isOnline, pendingCount, rejectedCount, refreshCounts } = useOfflineSync();
  const [products, setProducts] = useState([]);
  const [catalogSource, setCatalogSource] = useState('online');
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [showDiscount, setShowDiscount] = useState(false);
  const [payment, setPayment] = useState('cash');
  const [received, setReceived] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shift, setShift] = useState(null);
  const [dialog, setDialog] = useState(null); // 'pin' | 'close' | 'recent' | 'shrink' | 'demand' | {receipt}
  const pendingSale = useRef(null);
  const searchRef = useRef(null);

  const refreshCatalog = useCallback(async () => {
    try {
      const { products: list, source } = await loadCatalog();
      setProducts(list);
      setCatalogSource(source);
    } catch (err) { setError(errorMessage(err)); } finally { setCatalogLoaded(true); }
  }, []);
  const refreshShift = useCallback(() => api.get('/api/pos/shift').then((r) => setShift(r.data)).catch(() => {}), []);

  useEffect(() => { refreshCatalog(); refreshShift(); }, [refreshCatalog, refreshShift]);
  useEffect(() => { if (!dialog) searchRef.current?.focus(); }, [dialog, cart.length]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (!category || p.category === category)
      && (!q || p.name.toLowerCase().includes(q) || (p.barcode || '').toLowerCase() === q));
  }, [products, query, category]);

  const subtotal = cart.reduce((s, l) => s + l.quantity * l.unit_sell_price, 0);
  const effectiveDiscount = Math.min(discount, subtotal);
  const total = subtotal - effectiveDiscount;
  const change = payment === 'cash' ? Math.max(0, received - total) : 0;
  const freeLimit = Math.floor(subtotal * (info.store.discount_free_pct ?? 10) / 100);
  const locked = Boolean(shift?.locked);
  const canCharge = cart.length > 0 && total > 0 && !busy && !locked && (payment !== 'cash' || received === 0 || received >= total);

  function add(p) {
    setError('');
    setCart((c) => {
      const line = c.find((l) => l.product_id === p.id);
      const inCart = line ? line.quantity : 0;
      if (inCart + 1 > (p.stock_qty || 0)) { setError(`Sem stock suficiente de ${p.name}.`); return c; }
      if (line) return c.map((l) => (l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...c, { product_id: p.id, product_name: p.name, unit_sell_price: p.sell_price, quantity: 1, stock: p.stock_qty }];
    });
  }
  const setQty = (id, q) => setCart((c) => c.flatMap((l) => (l.product_id !== id ? [l] : q <= 0 ? [] : [{ ...l, quantity: Math.min(q, l.stock) }])));

  function onSearchKey(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const exact = products.find((p) => (p.barcode || '').toLowerCase() === q);
    const pick = exact || (visible.length === 1 ? visible[0] : null);
    if (pick) { add(pick); setQuery(''); }
  }

  function resetSale() {
    setCart([]); setDiscount(0); setShowDiscount(false); setReceived(0); setPayment('cash'); setQuery(''); setError('');
  }

  async function charge(authorizationPin) {
    setBusy(true); setError('');
    const payload = pendingSale.current || {
      id: newUuid(),
      seller_user_id: cashier.id,
      items: cart.map((l) => ({ product_id: l.product_id, quantity: l.quantity, unit_sell_price: l.unit_sell_price, unit_cost_price: 0 })),
      discount_amount: effectiveDiscount,
      total_amount: total,
      payment_method: payment,
      ...(payment === 'cash' && received > 0 ? { amount_received: received } : {}),
      created_at: new Date().toISOString(),
    };
    const body = authorizationPin ? { ...payload, authorization_pin: authorizationPin } : payload;
    try {
      const res = await api.post('/api/sales', body);
      pendingSale.current = null;
      setDialog({ receipt: { sale: { ...payload, id: res.data.id, daily_number: res.data.daily_number, amount_received: payment === 'cash' && received ? received : total, change_given: change }, items: cart } });
      resetSale();
      refreshCatalog(); refreshShift();
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 'DISCOUNT_NEEDS_PIN' || code === 'INVALID_AUTH_PIN') {
        pendingSale.current = payload;
        setDialog({ pin: true, error: code === 'INVALID_AUTH_PIN' ? 'PIN incorrecto.' : '' });
      } else if (shouldQueueOffline(err)) {
        pendingSale.current = null;
        await db.sales.put({ id: payload.id, created_at: payload.created_at, sync_state: SYNC_STATE.PENDING, payload });
        await decrementCached(payload.items);
        await refreshCounts();
        toast('Sem ligação: venda guardada neste terminal. É enviada automaticamente.');
        resetSale();
        refreshCatalog();
      } else if (err?.response?.status !== 401) {
        pendingSale.current = null;
        setError('Venda não registada: ' + errorMessage(err));
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Barra superior */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-semibold text-ink">{info.store.name}</p>
            <p className="truncate text-xs text-ink-muted">{cashier.name} · {info.terminal.name}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {!isOnline && <span className="hidden items-center gap-1.5 text-warning sm:flex"><WifiOff size={15} /> Offline</span>}
          {pendingCount > 0 && <span className="hidden text-ink-muted sm:inline">{pendingCount} por enviar</span>}
          {rejectedCount > 0 && <span className="hidden text-danger sm:inline">{rejectedCount} recusado(s)</span>}
          <Button size="sm" variant="ghost" onClick={() => setDialog('recent')}>Vendas</Button>
          <Button size="sm" variant="ghost" className="hidden md:inline-flex" onClick={() => setDialog('demand')}>Produto em falta</Button>
          <Button size="sm" variant="ghost" className="hidden md:inline-flex" onClick={() => setDialog('shrink')}>Quebra</Button>
          <Button size="sm" onClick={() => setDialog('close')}>Fechar turno</Button>
          <IconButton label="Bloquear terminal" icon={Lock} size="sm" variant="secondary" onClick={onLock} />
        </div>
      </header>

      {locked && (
        <Alert tone="danger" className="m-4 mb-0" title="Perfil bloqueado">
          Três contagens erradas no fecho de turno. O dono tem de desbloquear este perfil no painel (Equipa).
        </Alert>
      )}
      {rejectedCount > 0 && (
        <Alert tone="warning" className="m-4 mb-0">{rejectedCount} registo(s) feitos sem ligação foram recusados pelo servidor (preço ou stock mudou). O dono deve rever.</Alert>
      )}
      {catalogSource === 'cache' && (
        <Alert tone="info" className="m-4 mb-0">Sem ligação: a usar o catálogo guardado neste terminal. As vendas são enviadas quando a ligação voltar.</Alert>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Produtos */}
        <section className="flex min-h-0 flex-1 flex-col p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Pesquisar ou ler código de barras"
              aria-label="Pesquisar produto"
              className="h-11 w-full rounded border border-border-strong bg-surface pl-9 pr-3 text-md text-ink focus:border-accent focus:shadow-focus focus:outline-none"
            />
          </div>
          {categories.length > 1 && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-none">
              {['', ...categories].map((c) => (
                <button key={c || 'todas'} type="button" onClick={() => setCategory(c)} className={cx('h-8 shrink-0 rounded-full border px-3 text-sm transition-colors', category === c ? 'border-ink bg-ink text-white' : 'border-border-strong bg-surface text-ink-2 hover:bg-subtle')}>
                  {c || 'Todas'}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => {
              const out = (p.stock_qty || 0) <= 0;
              const low = !out && p.stock_qty <= (p.min_stock || 5);
              return (
                <button key={p.id} type="button" disabled={out || locked} onClick={() => add(p)} className="flex min-h-[88px] flex-col justify-between rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="line-clamp-2 text-base font-medium text-ink">{p.name}</span>
                  <span className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="num font-semibold text-ink">{money(p.sell_price)}</span>
                    <span className={cx('num text-xs', out ? 'text-danger' : low ? 'text-warning' : 'text-ink-muted')}>{out ? 'Esgotado' : `${p.stock_qty} un.`}</span>
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <p className="col-span-full py-10 text-center text-ink-muted">
                {!catalogLoaded ? 'A carregar o catálogo…' : products.length ? 'Nenhum produto encontrado.' : 'Ainda não há produtos. O dono acrescenta-os em Produtos.'}
              </p>
            )}
          </div>
        </section>

        {/* Cesto */}
        <aside className="flex max-h-[55vh] w-full shrink-0 flex-col border-t border-border bg-surface lg:max-h-none lg:w-[400px] lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-semibold text-ink">Venda actual</h2>
            {cart.length > 0 && <Button size="sm" variant="ghost" onClick={resetSale}>Limpar</Button>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="px-4 py-10 text-center text-ink-muted">Adicione produtos para começar.</p>
            ) : cart.map((l) => (
              <div key={l.product_id} className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base text-ink">{l.product_name}</p>
                  <p className="num text-xs text-ink-muted">{money(l.unit_sell_price)} / un.</p>
                </div>
                <div className="flex items-center rounded border border-border-strong">
                  <button type="button" aria-label="Menos" className="flex h-8 w-8 items-center justify-center text-ink-2 hover:bg-subtle" onClick={() => setQty(l.product_id, l.quantity - 1)}>{l.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}</button>
                  <span className="num w-8 text-center text-base">{l.quantity}</span>
                  <button type="button" aria-label="Mais" className="flex h-8 w-8 items-center justify-center text-ink-2 hover:bg-subtle disabled:opacity-40" disabled={l.quantity >= l.stock} onClick={() => setQty(l.product_id, l.quantity + 1)}><Plus size={14} /></button>
                </div>
                <span className="num w-24 text-right font-medium text-ink">{money(l.quantity * l.unit_sell_price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="flex justify-between py-1 text-base text-ink-2"><span>Subtotal</span><span className="num">{money(subtotal)}</span></div>
            {showDiscount ? (
              <div className="py-1">
                <MoneyInput label="Desconto" valueCents={discount} onChangeCents={setDiscount} hint={`Até ${money(freeLimit)} sem autorização. Acima disso pede o PIN do dono.`} />
              </div>
            ) : (
              <button type="button" disabled={!cart.length} className="py-1 text-sm text-accent hover:text-accent-hover disabled:text-ink-faint" onClick={() => setShowDiscount(true)}>Aplicar desconto</button>
            )}
            {effectiveDiscount > 0 && <div className="flex justify-between py-1 text-base text-ink-2"><span>Desconto</span><span className="num">−{money(effectiveDiscount)}</span></div>}
            <div className="flex items-baseline justify-between border-t border-border pt-2 mt-1"><span className="font-semibold text-ink">Total</span><span className="num text-xl font-semibold text-ink">{money(total)}</span></div>

            <Segmented className="mt-3 flex w-full" size="lg" options={PAYMENTS} value={payment} onChange={(v) => { setPayment(v); setReceived(0); }} />
            {payment === 'cash' && (
              <div className="mt-3 grid grid-cols-2 items-end gap-3">
                <MoneyInput label="Recebido" valueCents={received} onChangeCents={setReceived} placeholder={total ? String(total / 100).replace('.', ',') : ''} />
                <div className="pb-1.5 text-right">
                  <p className="text-xs text-ink-muted">Troco</p>
                  <p className={cx('num text-lg font-semibold', received && received < total ? 'text-danger' : 'text-ink')}>{received && received < total ? 'Falta ' + money(total - received) : money(change)}</p>
                </div>
              </div>
            )}
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
            <Button variant="primary" size="xl" block className="mt-3" disabled={!canCharge} loading={busy} onClick={() => charge()}>
              {total > 0 ? `Cobrar ${money(total)}` : 'Cobrar'}
            </Button>
          </div>
        </aside>
      </div>

      {dialog?.pin && (
        <AuthorizationPinDialog
          error={dialog.error}
          title="Autorizar desconto"
          description={`O desconto passa do limite de ${info.store.discount_free_pct ?? 10}%. Peça ao dono o PIN de autorização.`}
          onCancel={() => { pendingSale.current = null; setDialog(null); }}
          onSubmit={(pin) => { setDialog(null); charge(pin); }}
        />
      )}
      {dialog?.receipt && <ReceiptDialog store={info.store} cashier={cashier} {...dialog.receipt} onClose={() => setDialog(null)} />}
      {dialog === 'close' && <CloseShiftDialog shift={shift} onClose={() => setDialog(null)} onDone={() => { refreshShift(); }} />}
      {dialog === 'recent' && <RecentSalesDialog onClose={() => setDialog(null)} onChanged={() => { refreshCatalog(); refreshShift(); }} />}
      {dialog === 'shrink' && <ShrinkageDialog products={products} onClose={() => setDialog(null)} onSaved={() => { refreshCounts(); refreshCatalog(); }} />}
      {dialog === 'demand' && <DemandDialog products={products} onClose={() => setDialog(null)} onSaved={refreshCounts} />}
    </div>
  );
}
