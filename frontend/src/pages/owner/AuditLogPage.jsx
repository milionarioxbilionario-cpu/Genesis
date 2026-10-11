import React, { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';
import { dateTime, date, errorMessage } from '../../utils/format';
import { actionLabel, ALERT_ACTIONS, diffRows, fieldValue } from '../../utils/auditLabels';
import { Alert, Badge, Button, Card, CardHeader, Drawer, KeyValue, Segmented, Select, Skeleton, useConfirm, useToast, cx } from '../../components/ui';

// Auditoria do dono (Fase 8.5, pedido do fundador 10/10/2026): tudo o que
// acontece na loja (vendas, stock, edicoes, PINs, turnos...), por periodo e por
// tipo; tocar num registo mostra o detalhe (antes -> depois). O dono escolhe
// quantos meses guarda (minimo 2); o mais antigo apaga-se sozinho.
const PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'all', label: 'Tudo' },
];
const RETENTION = [
  { value: 2, label: '2 meses — este mês e o anterior' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 24, label: '24 meses' },
];

// Uma linha curta com o essencial do registo (produto, quantidade, valor).
function summary(a) {
  const n = a.new_value && typeof a.new_value === 'object' ? a.new_value : {};
  const o = a.old_value && typeof a.old_value === 'object' ? a.old_value : {};
  const parts = [];
  const name = n.name || n.product_name || o.name || n.debtor_name || n.description;
  if (name) parts.push(name);
  if (a.action === 'STOCK_ENTRY' && n.added != null) parts.push(`+${n.added} un.`);
  else if (n.delta != null) parts.push(`${n.delta > 0 ? '+' : ''}${n.delta} un.`);
  else if (n.quantity != null) parts.push(`${n.quantity} un.`);
  if (n.reason) parts.push(n.reason);
  if (n.total_amount != null) parts.push(fieldValue('total_amount', n.total_amount));
  return parts.join(' · ');
}

export default function AuditLogPage({ settings, reloadSettings }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [period, setPeriod] = useState('week');
  const [group, setGroup] = useState('all');
  const [state, setState] = useState({ items: [], next: null, loading: true, error: '', meta: null });
  const [open, setOpen] = useState(null);
  const [savingRet, setSavingRet] = useState(false);
  // Valor gravado acabado de escolher: as Definicoes recarregam depois (rede lenta).
  const [savedMonths, setSavedMonths] = useState(null);
  // So a resposta do pedido mais recente conta (filtro trocado duas vezes
  // com a rede lenta mostrava a lista errada).
  const seq = useRef(0);

  async function load(cursor) {
    const mine = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const q = new URLSearchParams({ period, group, limit: '50' });
      if (cursor) q.set('cursor', cursor);
      const { data } = await api.get('/api/owner/audit?' + q);
      if (mine !== seq.current) return;
      setState((s) => ({ items: cursor ? [...s.items, ...data.items] : data.items, next: data.next_cursor, loading: false, error: '', meta: data }));
    } catch (err) {
      if (mine !== seq.current) return;
      setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
    }
  }
  useEffect(() => { load(null); }, [period, group]); // eslint-disable-line react-hooks/exhaustive-deps

  const months = savedMonths ?? settings?.audit_retention_months ?? state.meta?.retention_months ?? 2;
  async function changeRetention(v) {
    const m = Number(v);
    if (m < months && !(await confirm({
      title: 'Guardar menos tempo',
      message: `Os registos anteriores a ${date(state.meta?.cutoffs?.[m] || null)} vão ser apagados de vez nas próximas horas. Não dá para os recuperar.`,
      confirmLabel: 'Guardar ' + m + ' meses', danger: true,
    }))) return;
    setSavingRet(true);
    try {
      await api.put('/api/settings/audit-retention', { months: m });
      setSavedMonths(m);
      toast(`A auditoria guarda agora ${m} meses.`);
      reloadSettings?.(); load(null);
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setSavingRet(false); }
  }

  const groups = state.meta?.groups || [];
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Quanto tempo guardar" description="Os registos mais antigos apagam-se sozinhos. Ficam sempre: bloqueios e contagens erradas dos caixistas, reaberturas de turno e o fecho de cada mês." />
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Guardar" value={String(months)} disabled={savingRet} onChange={(e) => changeRetention(e.target.value)} className="w-full max-w-xs">
            {RETENTION.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
          {state.meta?.kept_since && <p className="pb-2 text-sm text-ink-muted">Guardado desde {date(state.meta.kept_since)}.</p>}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={period} onChange={setPeriod} options={PERIODS} />
        <Select aria-label="Tipo" value={group} onChange={(e) => setGroup(e.target.value)} className="w-full sm:w-56">
          <option value="all">Todos os tipos</option>
          {groups.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </Select>
      </div>

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {state.loading && !state.items.length ? <div className="p-4"><Skeleton className="h-24 w-full" /></div>
          : !state.items.length ? <p className="py-10 text-center text-ink-muted">Sem registos neste período.</p>
          : (
            <ul className="divide-y divide-border">
              {state.items.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => setOpen(a)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-subtle">
                    <div className="min-w-0 flex-1">
                      <p className={cx('font-medium', ALERT_ACTIONS.has(a.action) ? 'text-danger' : 'text-ink')}>{actionLabel(a.action)}</p>
                      {summary(a) && <p className="truncate text-sm text-ink-2">{summary(a)}</p>}
                      <p className="text-xs text-ink-muted">{a.user_name}</p>
                    </div>
                    <span className="num shrink-0 whitespace-nowrap text-sm text-ink-muted">{dateTime(a.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>
      {state.next && <Button className="self-center" loading={state.loading} onClick={() => load(state.next)}>Carregar mais</Button>}

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? actionLabel(open.action) : ''} description={open ? dateTime(open.created_at) : ''}
        footer={<Button onClick={() => setOpen(null)}>Fechar</Button>}>
        {open && (
          <div className="flex flex-col gap-4">
            <div>
              <KeyValue label="Quem" value={open.user_name} />
              <KeyValue label="Tipo" value={<Badge tone="neutral">{groups.find((g) => g.key === open.group)?.label || 'Outros'}</Badge>} />
              {open.new_value?.terminal_id && <KeyValue label="Terminal" value={open.terminal_name || 'terminal da loja'} />}
              {open.ip_address && <KeyValue label="Endereço IP" value={open.ip_address} />}
            </div>
            <section>
              <h3 className="mb-2 font-medium text-ink">O que mudou</h3>
              {diffRows(open.old_value, open.new_value).length === 0 ? <p className="text-sm text-ink-muted">Sem detalhes guardados.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-ink-muted"><th className="pb-1 font-medium">Campo</th><th className="pb-1 font-medium">Antes</th><th className="pb-1 font-medium">Depois</th></tr></thead>
                  <tbody>
                    {diffRows(open.old_value, open.new_value).map((r) => (
                      <tr key={r.key} className="border-t border-border align-top">
                        <td className="py-1.5 pr-2 text-ink-2">{r.label}</td>
                        <td className="num py-1.5 pr-2 text-ink-muted">{r.before ?? '—'}</td>
                        <td className="num py-1.5 text-ink">{r.after ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
