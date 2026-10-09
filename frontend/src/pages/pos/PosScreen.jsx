import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Lock, Minus, Plus, ScanBarcode, Search, Trash2, WifiOff } from 'lucide-react';
import api from '../../utils/api';
import db from '../../db/localDb';
import useOfflineSync from '../../hooks/useOfflineSync';
import { newUuid, shouldQueueOffline, SYNC_STATE } from '../../utils/syncPolicy';
import { loadCatalog, decrementCached } from '../../utils/productCache';
import { money, errorMessage } from '../../utils/format';
import { Alert, Button, IconButton, MoneyInput, ProductImage, Segmented, useToast, cx } from '../../components/ui';
import { AuthorizationPinDialog, CloseShiftDialog, DemandDialog, ReceiptDialog, RecentSalesDialog, ShrinkageDialog } from './PosDialogs';

const PAYMENTS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'emola', label: 'e-Mola' },
  { value: 'card', label: 'Cartão' },
];

// Atalhos de teclado (todos com tecla de funcao ou modificador: o leitor de
// codigo de barras so escreve digitos + Enter, logo nunca os dispara).
const SHORTCUTS = [['F2', 'desconto'], ['F3', 'recebido'], ['F4', 'pagamento'], ['Ctrl+Enter', 'cobrar'], ['Alt+1…9', 'categoria'], ['Esc', 'pesquisa']];

// Ecra de vendas do terminal. Regras de interface:
//  - o campo de pesquisa recebe o leitor de codigo de barras (Enter = adiciona
//    o produto com esse codigo). Nao ha atalhos globais de digitos nem um Enter
//    global que finalizasse a venda — o leitor disparava vendas por acidente.
//  - so vai para a fila offline o que falhou por rede/servidor; uma recusa de
//    regra mostra o motivo e mantem o cesto.
export default function PosScreen({ info, cashier, onLock }) {
  const toast = useToast();
  const { isOnline, pendingCount, rejectedCount, refreshCounts, syncNow } = useOfflineSync();
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
  const [dialog, setDialog] = useState(null); // 'pin' | 'close' | 'recent' | 'shrink' | 'demand' | {openShift} | {receipt}
  const [scan, setScan] = useState(null); // ultima leitura: { code, name?, ok, at }
  const pendingSale = useRef(null);
  const searchRef = useRef(null);
  const gridRef = useRef(null);

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
  // Turno fechado: so o dono abre outro (PIN). Sem resposta do servidor
  // (offline) o estado anterior mantem-se e a venda nao fica presa.
  const shiftClosed = shift?.open === false;
  const blocked = locked || shiftClosed;
  const canCharge = cart.length > 0 && total > 0 && !busy && !blocked && (payment !== 'cash' || received === 0 || received >= total);

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
    if (e.key === 'ArrowDown') { e.preventDefault(); focusTile(0); return; }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const exact = products.find((p) => (p.barcode || '').toLowerCase() === q);
    if (exact) {
      add(exact);
      setScan({ code: query.trim(), name: exact.name, ok: true, at: Date.now() });
      setQuery('');
      return;
    }
    // So digitos (6+) = veio do leitor: dizer que o codigo nao existe em vez de nada.
    if (/^\d{6,}$/.test(q)) { setScan({ code: query.trim(), ok: false, at: Date.now() }); setQuery(''); return; }
    if (visible.length === 1) { add(visible[0]); setQuery(''); }
  }

  // A faixa da ultima leitura desaparece sozinha.
  useEffect(() => {
    if (!scan) return undefined;
    const t = setTimeout(() => setScan(null), scan.ok ? 2500 : 5000);
    return () => clearTimeout(t);
  }, [scan]);

  // Setas na grelha: a mesma linha visual = mesmo offsetTop.
  const tiles = () => [...(gridRef.current?.querySelectorAll('button[data-tile]') || [])];
  function focusTile(i) { tiles()[i]?.focus(); }
  function onGridKey(e) {
    const list = tiles();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const cols = list.filter((b) => b.offsetTop === list[0].offsetTop).length || 1;
    const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (move === undefined) return;
    e.preventDefault();
    if (e.key === 'ArrowUp' && i - cols < 0) { searchRef.current?.focus(); return; }
    list[Math.max(0, Math.min(list.length - 1, i + move))]?.focus();
  }

  function resetSale() {
    setCart([]); setDiscount(0); setShowDiscount(false); setReceived(0); setPayment('cash'); setQuery(''); setError('');
  }

  // Atalhos globais do terminal (desligados quando ha um dialogo aberto).
  const shortcutState = useRef({});
  shortcutState.current = { dialog, canCharge, payment, categories, cart };
  useEffect(() => {
    function onKey(e) {
      const s = shortcutState.current;
      if (s.dialog) return;
      const focusById = (id) => setTimeout(() => { const el = document.getElementById(id); el?.focus(); el?.select?.(); }, 0);
      if (e.key === 'F2') {
        e.preventDefault();
        if (!s.cart.length) return;
        setShowDiscount(true); focusById('pos-discount');
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (s.payment !== 'cash') { setPayment('cash'); setReceived(0); }
        focusById('pos-received');
      } else if (e.key === 'F4') {
        e.preventDefault();
        const i = PAYMENTS.findIndex((p) => p.value === s.payment);
        setPayment(PAYMENTS[(i + 1) % PAYMENTS.length].value); setReceived(0);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (s.canCharge) chargeRef.current();
      } else if (e.altKey && /^[1-9]$/.test(e.key)) {
        const list = ['', ...s.categories];
        const n = Number(e.key) - 1;
        if (n < list.length) { e.preventDefault(); setCategory(list[n]); }
      } else if (e.key === 'Escape') {
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const chargeRef = useRef(null);

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
      } else if (code === 'SHIFT_CLOSED') {
        pendingSale.current = null;
        refreshShift();
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
  chargeRef.current = () => charge();

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
      {!locked && shiftClosed && (
        <Alert tone="warning" className="m-4 mb-0" title="Turno fechado">
          <span className="flex flex-wrap items-center gap-3">
            <span>Este perfil não vende até o dono abrir um turno novo.</span>
            <Button size="sm" variant="primary" onClick={() => setDialog({ openShift: true })}>Abrir turno novo</Button>
          </span>
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
          {scan && (
            <div role="status" aria-live="polite" className={cx('pos-scan mt-3 flex items-center gap-3 rounded-lg border px-3 py-2', scan.ok ? 'border-accent bg-accent-soft' : 'border-warning bg-warning-soft')}>
              {scan.ok ? <ScanBarcode size={18} className="shrink-0 text-accent" /> : <CircleAlert size={18} className="shrink-0 text-warning" />}
              <span className="num shrink-0 rounded bg-surface px-2 py-0.5 text-sm tracking-wider text-ink">{scan.code}</span>
              <span className="min-w-0 truncate text-sm text-ink">
                {scan.ok ? <><span className="font-medium">{scan.name}</span> adicionado</> : 'Este código não existe no catálogo. O dono regista-o em Produtos.'}
              </span>
            </div>
          )}
          <div ref={gridRef} onKeyDown={onGridKey} className="mt-3 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-0.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visible.map((p) => {
              const out = (p.stock_qty || 0) <= 0;
              const low = !out && p.stock_qty <= (p.min_stock || 5);
              return (
                <button key={p.id} data-tile type="button" disabled={out || blocked} onClick={() => add(p)} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong hover:bg-subtle focus-visible:border-accent focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                  <ProductImage product={p} size={56} className="self-center" />
                  <span className="line-clamp-2 min-h-[2.5em] text-sm font-medium leading-tight text-ink">{p.name}</span>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="num text-base font-semibold text-ink">{money(p.sell_price)}</span>
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
                <MoneyInput id="pos-discount" label="Desconto" valueCents={discount} onChangeCents={setDiscount} hint={`Até ${money(freeLimit)} sem autorização. Acima disso pede o PIN do dono.`} />
              </div>
            ) : (
              <button type="button" disabled={!cart.length} className="py-1 text-sm text-accent hover:text-accent-hover disabled:text-ink-faint" onClick={() => setShowDiscount(true)}>Aplicar desconto</button>
            )}
            {effectiveDiscount > 0 && <div className="flex justify-between py-1 text-base text-ink-2"><span>Desconto</span><span className="num">−{money(effectiveDiscount)}</span></div>}
            <div className="flex items-baseline justify-between border-t border-border pt-2 mt-1"><span className="font-semibold text-ink">Total</span><span className="num text-xl font-semibold text-ink">{money(total)}</span></div>

            <Segmented className="mt-3 flex w-full" size="lg" options={PAYMENTS} value={payment} onChange={(v) => { setPayment(v); setReceived(0); }} />
            {payment === 'cash' && (
              <div className="mt-3 grid grid-cols-2 items-end gap-3">
                <MoneyInput id="pos-received" label="Recebido" valueCents={received} onChangeCents={setReceived} placeholder={total ? String(total / 100).replace('.', ',') : ''} />
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
            <p className="mt-2 hidden flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-ink-muted lg:flex" aria-label="Atalhos de teclado">
              {SHORTCUTS.map(([k, label]) => <span key={k}><kbd className="rounded border border-border-strong bg-subtle px-1 font-sans text-[11px] text-ink-2">{k}</kbd> {label}</span>)}
            </p>
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
      {dialog?.openShift && (
        <AuthorizationPinDialog
          key={dialog.error || 'abrir'}
          error={dialog.error}
          title="Abrir turno novo"
          description="O turno deste perfil foi fechado. Só o dono abre outro: peça-lhe o PIN de autorização."
          onCancel={() => setDialog(null)}
          onSubmit={async (pin) => {
            try {
              const res = await api.post('/api/pos/shift/open', { pin });
              setShift(res.data);
              setDialog(null);
              toast('Turno novo aberto.');
            } catch (err) { setDialog({ openShift: true, error: errorMessage(err) }); }
          }}
        />
      )}
      {dialog?.receipt && <ReceiptDialog store={info.store} cashier={cashier} {...dialog.receipt} onClose={() => setDialog(null)} />}
      {dialog === 'close' && <CloseShiftDialog shift={shift} syncNow={syncNow} onClose={() => setDialog(null)} onDone={() => { refreshShift(); }} />}
      {dialog === 'recent' && <RecentSalesDialog onClose={() => setDialog(null)} onChanged={() => { refreshCatalog(); refreshShift(); }} />}
      {dialog === 'shrink' && <ShrinkageDialog products={products} onClose={() => setDialog(null)} onSaved={() => { refreshCounts(); refreshCatalog(); }} />}
      {dialog === 'demand' && <DemandDialog products={products} onClose={() => setDialog(null)} onSaved={refreshCounts} />}
    </div>
  );
}
