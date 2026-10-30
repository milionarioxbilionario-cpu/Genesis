import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Lock, ScanLine, ShieldAlert, XCircle } from 'lucide-react';
import BarcodeScanner from '../../components/BarcodeScanner';
import api from '../../utils/api';
import { money, dateTime, time, errorMessage } from '../../utils/format';
import { formatQty } from '../../utils/units';
import { useI18n } from '../../i18n/react';
import { BrandMark, Button, IconButton, Input, Spinner, cx } from '../../components/ui';

// Etapa B — terminal do guarda. Le o QR (ou o codigo de barras) do recibo a
// saida: mostra a venda e marca «conferido». Recibo ja conferido = ecra
// vermelho com quem e quando (trava o recibo reimpresso para levar mercadoria
// duas vezes). O guarda nao ve custos, lucros nem outras vendas.
//  - leitor USB/pistola: escreve o codigo no campo e Enter (o campo fica sempre com foco);
//  - camara: QR ou codigo de barras.
export default function GuardScreen({ info, guard, onLock }) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [state, setState] = useState({ kind: 'idle' }); // idle | loading | sale | checked | already | cancelled | error
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (!camera && !busy) inputRef.current?.focus(); }, [camera, busy, state.kind]);

  async function lookup(raw) {
    const value = String(raw || '').trim();
    if (!value) return;
    setCode(''); setState({ kind: 'loading' });
    try {
      const { data } = await api.get('/api/guard/receipt', { params: { code: value } });
      if (data.sale.status === 'cancelled') setState({ kind: 'cancelled', sale: data.sale });
      else if (data.check) setState({ kind: 'already', sale: data.sale, check: data.check });
      else setState({ kind: 'sale', sale: data.sale });
    } catch (err) {
      setState({ kind: 'error', message: errorMessage(err) });
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      const { data } = await api.post(`/api/guard/receipt/${state.sale.id}/check`);
      setState({ kind: 'checked', sale: state.sale, check: data.check });
    } catch (err) {
      const d = err?.response?.data;
      if (d?.code === 'ALREADY_CHECKED') setState({ kind: 'already', sale: state.sale, check: d.check });
      else if (d?.code === 'SALE_CANCELLED') setState({ kind: 'cancelled', sale: state.sale });
      else setState({ kind: 'error', message: errorMessage(err) });
    } finally { setBusy(false); }
  }

  const sale = state.sale;
  const red = state.kind === 'already' || state.kind === 'cancelled';
  return (
    <div className={cx('pos-root flex flex-col', red ? 'bg-danger' : 'bg-bg')}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-4">
        <BrandMark />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-semibold text-ink">{info.store.name}</p>
          <p className="truncate text-xs text-ink-muted">{t('Guarda')}: {guard.name} · {info.terminal.name}</p>
        </div>
        <IconButton className="ml-auto" label={t('Bloquear terminal')} icon={Lock} size="sm" variant="secondary" onClick={onLock} />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto p-4">
        <form onSubmit={(e) => { e.preventDefault(); lookup(code); }} className="flex items-end gap-2 rounded-lg border border-border bg-surface p-3">
          <Input ref={inputRef} className="flex-1" label={t('Recibo')} placeholder={t('Leia o QR ou o código de barras do recibo')} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
          <Button type="button" icon={Camera} onClick={() => setCamera(true)}>{t('Câmara')}</Button>
        </form>

        {state.kind === 'idle' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center text-ink-muted">
            <ScanLine size={48} />
            <p className="text-md">{t('Peça o recibo ao cliente e leia o código.')}</p>
          </div>
        )}
        {state.kind === 'loading' && <div className="flex justify-center py-10"><Spinner className="h-8 w-8" /></div>}
        {state.kind === 'error' && (
          <div className="rounded-lg border border-warning bg-warning-soft p-5 text-center" role="alert">
            <XCircle className="mx-auto mb-2 text-warning" size={36} />
            <p className="text-md font-semibold text-ink">{state.message}</p>
          </div>
        )}

        {red && (
          <div className="rounded-lg bg-surface p-5 text-center shadow-lg" role="alert">
            <ShieldAlert className="mx-auto mb-2 text-danger" size={48} />
            {state.kind === 'already' ? (
              <>
                <p className="text-2xl font-bold text-danger">{t('Recibo já conferido')}</p>
                <p className="mt-2 text-md text-ink">{t('Conferido a {when} por {who}.', { when: dateTime(state.check.checked_at), who: state.check.guard_name || t('outro guarda') })}</p>
              </>
            ) : <p className="text-2xl font-bold text-danger">{t('Venda cancelada')}</p>}
            <p className="mt-2 text-base text-ink-2">{t('Não deixe sair a mercadoria. Chame o responsável.')}</p>
          </div>
        )}

        {sale && (state.kind === 'sale' || state.kind === 'checked' || red) && (
          <section className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-ink">{t('Venda n.º {n}', { n: String(sale.daily_number || '').padStart(3, '0') })}</p>
              <p className="text-sm text-ink-muted">{time(sale.created_at)}{sale.cashier_name ? ' · ' + sale.cashier_name : ''}</p>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {sale.items.map((i, k) => (
                <li key={k} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="text-base text-ink"><span className="num font-semibold">{formatQty(i.quantity, i.unit)}</span> × {i.name}</span>
                  <span className="num text-sm text-ink-muted">{money(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-ink"><span>{t('Total')}</span><span className="num">{money(sale.total_amount)}</span></p>
          </section>
        )}

        {state.kind === 'sale' && (
          <Button variant="primary" size="lg" block loading={busy} icon={CheckCircle2} onClick={confirm}>{t('Marcar como conferido')}</Button>
        )}
        {state.kind === 'checked' && (
          <div className="rounded-lg border border-positive bg-positive-soft p-4 text-center" role="status">
            <CheckCircle2 className="mx-auto mb-1 text-positive" size={36} />
            <p className="text-lg font-semibold text-positive">{t('Conferido. Pode sair.')}</p>
          </div>
        )}
        {state.kind !== 'idle' && state.kind !== 'loading' && (
          <Button block onClick={() => setState({ kind: 'idle' })}>{t('Ler o próximo recibo')}</Button>
        )}
      </main>
      <BarcodeScanner open={camera} qr onClose={() => setCamera(false)} onCode={(c) => { setCamera(false); lookup(c); return { ok: true, message: t('Código lido') }; }} title={t('Ler o recibo')} />
    </div>
  );
}
