import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowRight, Copy, MapPin, Plus, Store } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, int, date, dateTime, isoDay, errorMessage, PAYMENT_LABEL } from '../../utils/format';
import { formatHuman, formatQty } from '../../utils/units';
import { enterEstablishment } from '../../utils/establishments';
import { liveText } from '../../components/LiveSales';
import EstablishmentSwitcher from '../../components/EstablishmentSwitcher';
import ManagersCard from '../../components/ManagersCard';
import { BUSINESS_TYPES } from '../auth/RequestAccount';
import { useI18n } from '../../i18n/react';
import { Alert, Badge, Button, Card, CardHeader, Dialog, Input, KeyValue, PageHeader, Pagination, Segmented, Select, Skeleton, Stat, Table, Toolbar, cx, useToast } from '../../components/ui';

// E2 (31/10/2026): paginas do PAINEL GERAL (layouts/GroupShell.jsx). Tudo vem de
// /api/group/* (backend/src/routes/group.js): cada numero e lido dentro do
// estabelecimento respectivo e somado no servidor.
const typeLabel = (type) => BUSINESS_TYPES.find((b) => b.value === type)?.label || type;

// Canal ao vivo dos estabelecimentos do dono: chama onEvent(tipo, dados).
function useGroupLive(onEvent) {
  const ref = useRef(onEvent);
  ref.current = onEvent;
  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const es = new EventSource('/api/group/live', { withCredentials: true });
    const kinds = ['sale', 'cancel', 'loss', 'debt', 'debt_payment', 'expense', 'stock_in', 'shift_open', 'shift_close', 'shift_fail'];
    const on = (kind) => (ev) => { let d; try { d = JSON.parse(ev.data); } catch { return; } ref.current(kind, d); };
    for (const k of kinds) es.addEventListener(k, on(k));
    return () => es.close();
  }, []);
}

// Recarrega no maximo de N em N ms quando chegam eventos (varias vendas seguidas = 1 pedido).
function useThrottledReload(reload, ms = 4000) {
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return () => { if (!timer.current) timer.current = setTimeout(() => { timer.current = null; reload(); }, ms); };
}

function OpenDot({ e }) {
  const { t } = useI18n();
  const blocked = e.status === 'suspended' || e.status === 'blocked';
  const open = e.open_now && !e.closed && !blocked;
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs', open ? 'text-positive' : 'text-ink-muted')}>
      <span className={cx('h-2 w-2 rounded-full', open ? 'bg-positive' : 'bg-border-strong')} aria-hidden="true" />
      {blocked ? t('Suspenso') : e.closed ? t('Encerrado') : open ? t('Aberto agora') : t('Fechado agora')}
    </span>
  );
}

// ---------------------------------------------------------------- Visao geral
export function GroupOverview() {
  const { t } = useI18n();
  const ov = useApi('/api/group/overview');
  const recent = useApi('/api/group/recent?limit=15');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const reloadOv = useThrottledReload(ov.reload, 8000);
  const reloadRecent = useThrottledReload(recent.reload, 2500);
  useGroupLive((kind) => { reloadRecent(); if (kind === 'sale' || kind === 'cancel') reloadOv(); });

  async function enter(id) {
    setBusy(id); setError('');
    try { await enterEstablishment(id); } catch (err) { setError(errorMessage(err)); setBusy(''); }
  }
  const d = ov.data;
  const Tot = ({ label, v, hint, net }) => (
    <Stat label={label} value={money(v.revenue)} delta={v.change_pct ?? undefined}
      hint={[t('Lucro bruto {p} · {n} venda(s)', { p: money(v.profit), n: int(v.count) }), net != null ? t('Lucro líquido do mês {v}', { v: money(net) }) : null, hint].filter(Boolean).join(' · ')} />
  );
  return (
    <>
      <PageHeader title={t('Visão geral')} description={t('Todos os seus estabelecimentos juntos. Cada um continua com os seus produtos, caixistas e vendas.')} />
      {(error || ov.error) && <Alert tone="danger" className="mb-4">{error || ov.error}</Alert>}
      {!d ? <Skeleton className="h-40 w-full" /> : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Tot label={t('Hoje')} v={d.totals.today} hint={t('vs ontem à mesma hora')} />
            <Tot label={t('Últimos 7 dias')} v={d.totals.week} hint={t('vs 7 dias antes')} />
            <Tot label={t('Este mês')} v={d.totals.month} net={d.totals.month.net_profit} hint={t('vs mês anterior')} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {d.establishments.map((e) => (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{e.name}</p>
                    <p className="truncate text-xs text-ink-muted">{t(typeLabel(e.business_type))} · {e.location}</p>
                  </div>
                  <OpenDot e={e} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-ink-muted">{t('Hoje')}</p><p className="num font-semibold text-ink">{money(e.today.revenue)}</p>{e.today.change_pct != null && <p className={cx('num text-xs', e.today.change_pct >= 0 ? 'text-positive' : 'text-danger')}>{e.today.change_pct >= 0 ? '▲' : '▼'} {Math.abs(e.today.change_pct).toFixed(0)}%</p>}</div>
                  <div><p className="text-xs text-ink-muted">{t('7 dias')}</p><p className="num font-semibold text-ink">{money(e.week.revenue)}</p></div>
                  <div><p className="text-xs text-ink-muted">{t('Mês')}</p><p className="num font-semibold text-ink">{money(e.month.revenue)}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                  <span className="text-ink-muted">{t('Lucro do mês')} <span className="num font-medium text-ink">{money(e.month.profit)}</span>{e.month.net_profit != null && <> · {t('líquido')} <span className={cx('num font-medium', e.month.net_profit < 0 ? 'text-danger' : 'text-ink')}>{money(e.month.net_profit)}</span></>}</span>
                  <Button size="sm" icon={ArrowRight} loading={busy === e.id} onClick={() => enter(e.id)}>{t('Entrar')}</Button>
                </div>
              </Card>
            ))}
          </div>
          <Card padded={false}>
            <div className="p-5 pb-0"><CardHeader title={t('De onde veio cada valor')} description={t('As últimas vendas de todos, ao vivo: estabelecimento, terminal, quem vendeu e o quê.')} /></div>
            <div className="px-5 pb-5">
              <Table
                columns={[
                  { key: 'at', header: t('Hora'), render: (s) => <span className="num text-ink-2">{dateTime(s.created_at)}</span> },
                  { key: 'est', header: t('Estabelecimento'), render: (s) => s.establishment },
                  { key: 'who', header: t('Terminal · perfil'), render: (s) => [s.terminal, s.cashier].filter(Boolean).join(' · ') || '—' },
                  { key: 'what', header: t('O que se vendeu'), render: (s) => <span className="line-clamp-2 text-ink-2">{(s.items || []).map((i) => `${formatQty(i.quantity, i.unit)} × ${i.product_name}`).join(', ')}</span> },
                  { key: 'total', header: t('Valor'), align: 'right', render: (s) => (s.status === 'cancelled' ? <span className="num text-ink-faint line-through">{money(s.total_amount)}</span> : <span className="num font-medium text-ink">{money(s.total_amount)}</span>) },
                ]}
                rows={recent.data || []}
                loading={recent.loading && !recent.data}
                empty={<p className="py-8 text-center text-ink-muted">{t('Ainda não há vendas.')}</p>}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Estabelecimentos
export function GroupEstablishments() {
  const { t } = useI18n();
  const { reloadEstablishments } = useOutletContext() || {};
  const ov = useApi('/api/group/overview?light=1');
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function enter(id, to) {
    setBusy(id + to); setError('');
    try { await enterEstablishment(id, to); } catch (err) { setError(errorMessage(err)); setBusy(''); }
  }
  async function reopen(id) {
    setBusy('reopen' + id); setError('');
    try { await api.post('/api/establishments/' + id + '/reopen'); ov.reload(); reloadEstablishments?.(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  return (
    <>
      <PageHeader title={t('Estabelecimentos')} description={t('Entre em cada um para vender e configurar. O principal é onde vive a sua conta: não se encerra.')}
        actions={<Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>{t('Acrescentar estabelecimento')}</Button>} />
      {(error || ov.error) && <Alert tone="danger" className="mb-4">{error || ov.error}</Alert>}
      <EstablishmentSwitcher open={adding} onClose={() => { setAdding(false); ov.reload(); }} />
      <Table
        columns={[
          { key: 'name', header: t('Estabelecimento'), render: (e) => <span className="flex items-center gap-2"><Store size={16} className="text-ink-muted" /><span><span className="block font-medium text-ink">{e.name}</span><span className="block text-xs text-ink-muted">{t(typeLabel(e.business_type))} · {e.location}</span></span>{e.is_home && <Badge>{t('Principal')}</Badge>}</span> },
          { key: 'state', header: t('Estado'), render: (e) => <OpenDot e={e} /> },
          { key: 'today', header: t('Hoje'), align: 'right', render: (e) => <span className="num">{money(e.today.revenue)}</span> },
          { key: 'month', header: t('Mês'), align: 'right', render: (e) => <span className="num">{money(e.month.revenue)}</span> },
          { key: 'go', header: '', align: 'right', render: (e) => (
            <span className="flex flex-wrap justify-end gap-1">
              {e.closed && !e.is_home ? (
                <Button size="sm" variant="ghost" loading={busy === 'reopen' + e.id} onClick={() => reopen(e.id)}>{t('Reabrir')}</Button>
              ) : (<>
                <Button size="sm" icon={ArrowRight} loading={busy === e.id + '/app'} onClick={() => enter(e.id, '/app')}>{t('Entrar')}</Button>
                <Button size="sm" variant="ghost" icon={Copy} loading={busy === e.id + '/app/produtos'} onClick={() => enter(e.id, '/app/produtos')}>{t('Copiar catálogo')}</Button>
                {!e.is_home && <Button size="sm" variant="danger-ghost" onClick={() => setClosing(e)}>{t('Encerrar…')}</Button>}
              </>)}
            </span>
          ) },
        ]}
        rows={ov.data?.establishments || []}
        loading={!ov.data}
      />
      <p className="mt-3 text-sm text-ink-muted">{t('«Copiar catálogo» abre os Produtos desse estabelecimento, onde escolhe de qual copiar.')}</p>
      <CloseDialog target={closing} onClose={() => setClosing(null)} onDone={() => { setClosing(null); ov.reload(); reloadEstablishments?.(); }} />
    </>
  );
}

function CloseDialog({ target, onClose, onDone }) {
  const { t } = useI18n();
  const toast = useToast();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setName(''); setPassword(''); setError(''); }, [target]);
  if (!target) return null;
  async function closeIt() {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/api/establishments/' + target.id + '/close', { password, confirm_name: name });
      toast(data?.deleted ? t('Estabelecimento apagado (nunca vendeu).') : t('Estabelecimento encerrado: fica só para consulta.'));
      onDone();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <Dialog open size="sm" title={t('Encerrar {name}', { name: target.name })} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('Cancelar')}</Button><Button variant="danger" loading={busy} disabled={name.trim().toLowerCase() !== target.name.trim().toLowerCase() || !password} onClick={closeIt}>{t('Encerrar')}</Button></>}>
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">{t('Se nunca vendeu, é apagado. Se já tem vendas, fica só para consulta (relatórios e rastreio guardados) e pode reabri-lo nos 30 dias seguintes.')}</p>
        <Alert tone="warning">{t('Antes de encerrar: ligue à internet os terminais que estiveram sem rede, para enviarem as vendas que guardaram. Durante 7 dias ainda as aceitamos.')}</Alert>
        <Input label={t('Escreva o nome do estabelecimento: {name}', { name: target.name })} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <Input label={t('Senha da conta')} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------- Relatorios
const shiftDay = (day, n) => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDay(d); };
export function GroupReports() {
  const { t } = useI18n();
  const now = new Date();
  const [period, setPeriod] = useState('daily');
  const [day, setDay] = useState(isoDay());
  const [month, setMonth] = useState(`${now.getFullYear()}-${now.getMonth() + 1}`);
  const [y, m] = month.split('-').map(Number);
  const url = period === 'daily' ? `/api/group/reports?period=daily&date=${day}`
    : period === 'weekly' ? `/api/group/reports?period=weekly&start=${shiftDay(day, -6)}&end=${day}`
      : `/api/group/reports?period=monthly&year=${y}&month=${m}`;
  const r = useApi(url);
  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return { value: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }; });
  const d = r.data;
  const monthly = period === 'monthly';
  const exportCsv = () => {
    if (!d) return;
    const head = [t('Estabelecimento'), t('Receita'), t('Vendas'), t('Custo dos produtos'), t('Lucro bruto'), t('Descontos'), t('Perdas'), t('Cancelado'), ...(monthly ? [t('Lucro líquido real')] : [])];
    const line = (name, x) => [name, x.gross_revenue, x.sales_count, x.cost_of_goods, x.gross_profit, x.discounts_total, x.losses_total, x.cancelled_total, ...(monthly ? [x.net_profit ?? ''] : [])]
      .map((v, i) => (i === 0 || i === 2 ? v : typeof v === 'number' ? (v / 100).toFixed(2) : v));
    const rows = [head, ...d.establishments.map((e) => line(e.name, e)), line(t('Todos'), d.totals)];
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `genesis-geral-${period}-${monthly ? month : day}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  return (
    <>
      <PageHeader title={t('Relatórios de todos')} description={t('Os números de cada estabelecimento (iguais aos do relatório dele) e a soma de todos.')} />
      <Toolbar className="no-print">
        <Segmented value={period} onChange={setPeriod} options={[{ value: 'daily', label: t('Diário') }, { value: 'weekly', label: t('Semanal') }, { value: 'monthly', label: t('Mensal') }]} />
        {monthly
          ? <Select aria-label={t('Mês')} value={month} onChange={(e) => setMonth(e.target.value)} className="w-52">{months.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
          : <Input type="date" aria-label={period === 'daily' ? t('Dia') : t('Fim da semana')} value={day} max={isoDay()} onChange={(e) => e.target.value && setDay(e.target.value)} className="w-44" />}
        <span className="ml-auto flex gap-2">
          <Button disabled={!d} onClick={exportCsv}>{t('Exportar (Excel)')}</Button>
          <Button disabled={!d} onClick={() => window.print()}>{t('Imprimir / PDF')}</Button>
        </span>
      </Toolbar>
      {r.error && <Alert tone="danger" className="mb-4">{r.error}</Alert>}
      {!d ? <Skeleton className="h-40 w-full" /> : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t('Receita de todos')} value={money(d.totals.gross_revenue)} delta={d.totals.revenue_change_pct ?? undefined} hint={t('{n} venda(s)', { n: int(d.totals.sales_count) })} />
            <Stat label={t('Lucro bruto')} value={money(d.totals.gross_profit)} hint={t('custo {v}', { v: money(d.totals.cost_of_goods) })} />
            <Stat label={t('Perdas')} value={d.totals.losses_total ? '−' + money(d.totals.losses_total) : money(0)} tone={d.totals.losses_total ? 'danger' : undefined} />
            {monthly
              ? <Stat label={t('Lucro líquido real')} value={d.totals.net_profit == null ? '—' : money(d.totals.net_profit)} tone={d.totals.net_profit < 0 ? 'danger' : 'positive'} hint={t('Depois de salários, renda, entregas e despesas')} />
              : <Stat label={t('Ticket médio')} value={money(d.totals.average_ticket)} />}
          </div>
          <Table
            columns={[
              { key: 'name', header: t('Estabelecimento'), render: (e) => <span className="font-medium text-ink">{e.name}</span> },
              { key: 'rev', header: t('Receita'), align: 'right', render: (e) => <span className="num">{money(e.gross_revenue)}{e.revenue_change_pct != null && <span className={cx('ml-1.5 text-xs', e.revenue_change_pct >= 0 ? 'text-positive' : 'text-danger')}>{e.revenue_change_pct >= 0 ? '▲' : '▼'}{Math.abs(e.revenue_change_pct).toFixed(0)}%</span>}</span> },
              { key: 'n', header: t('Vendas'), align: 'right', render: (e) => int(e.sales_count) },
              { key: 'gp', header: t('Lucro bruto'), align: 'right', render: (e) => money(e.gross_profit) },
              { key: 'loss', header: t('Perdas'), align: 'right', render: (e) => (e.losses_total ? <span className="text-danger">−{money(e.losses_total)}</span> : '—') },
              ...(monthly ? [{ key: 'net', header: t('Lucro líquido real'), align: 'right', render: (e) => (e.net_profit == null ? '—' : <span className={cx('num font-medium', e.net_profit < 0 ? 'text-danger' : 'text-ink')}>{money(e.net_profit)}</span>) }] : []),
            ]}
            rows={d.establishments}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={t('Por forma de pagamento (todos)')} />
              {Object.entries(d.totals.by_payment).filter(([, v]) => v > 0).map(([k, v]) => <KeyValue key={k} label={PAYMENT_LABEL[k] || k} value={money(v)} />)}
              {d.totals.discounts_total > 0 && <KeyValue label={t('Descontos concedidos')} value={'−' + money(d.totals.discounts_total)} tone="danger" />}
            </Card>
            <Card>
              <CardHeader title={t('Mais vendidos em cada um')} />
              {d.establishments.map((e) => (
                <div key={e.id} className="mb-2">
                  <p className="text-sm font-medium text-ink">{e.name}</p>
                  <p className="text-sm text-ink-muted">{(e.top_products || []).slice(0, 3).map((p) => `${p.name} (${formatHuman(p.quantity, p.unit)})`).join(', ') || t('Sem vendas.')}</p>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Rastreio geral
export function GroupTimeline() {
  const { t } = useI18n();
  const { establishments } = useOutletContext() || {};
  const [from, setFrom] = useState(isoDay());
  const [to, setTo] = useState(isoDay());
  const [tenant, setTenant] = useState('');
  const [page, setPage] = useState(1);
  const r = useApi(`/api/group/timeline?from=${from}&to=${to}&page=${page}&page_size=50${tenant ? '&tenant_id=' + tenant : ''}`);
  const d = r.data;
  const amount = (e) => (e.effect === 'gain' ? <span className="num font-medium text-positive">{money(e.amount, { sign: true })}</span>
    : (e.effect === 'loss' || e.effect === 'expense') ? <span className="num font-medium text-danger">{money(e.amount)}</span>
      : e.amount ? <span className="num text-ink-muted">{money(e.amount)}</span> : <span className="text-ink-faint">—</span>);
  return (
    <>
      <PageHeader title={t('Rastreio geral')} description={t('Tudo o que aconteceu em todos os estabelecimentos, por ordem, com o estabelecimento de cada linha.')} />
      <Toolbar>
        <Input type="date" aria-label={t('De')} value={from} max={to} onChange={(e) => { if (e.target.value) { setFrom(e.target.value); setPage(1); } }} className="w-44" />
        <Input type="date" aria-label={t('Até')} value={to} min={from} max={isoDay()} onChange={(e) => { if (e.target.value) { setTo(e.target.value); setPage(1); } }} className="w-44" />
        <Select aria-label={t('Estabelecimento')} value={tenant} onChange={(e) => { setTenant(e.target.value); setPage(1); }} className="w-56">
          <option value="">{t('Todos os estabelecimentos')}</option>
          {(establishments || []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </Toolbar>
      {r.error && <Alert tone="danger" className="mb-3">{r.error}</Alert>}
      {d && (
        <p className="mb-2 text-sm text-ink-2">
          <span className="num text-positive">{money(d.totals.gains, { sign: true })}</span> {t('em vendas')} · <span className="num text-danger">{money(d.totals.losses)}</span> {t('em perdas')} · {t('lucro do período')} <span className={cx('num font-medium', d.totals.profit < 0 ? 'text-danger' : 'text-ink')}>{money(d.totals.profit)}</span>
        </p>
      )}
      <Table
        columns={[
          { key: 'at', header: t('Quando'), render: (e) => <span className="num text-ink-2">{e.day_only ? date(e.at) : dateTime(e.at)}</span> },
          { key: 'est', header: t('Estabelecimento'), render: (e) => <span className="font-medium text-ink">{e.establishment}</span> },
          { key: 'title', header: t('O que aconteceu'), render: (e) => <span><span className="block text-ink">{e.title}</span>{e.detail && <span className="block text-xs text-ink-muted">{e.detail}</span>}</span> },
          { key: 'who', header: t('Quem'), render: (e) => e.who },
          { key: 'amount', header: t('Valor'), align: 'right', render: amount },
        ]}
        rows={d?.rows || []}
        loading={r.loading && !d}
        empty={<p className="py-8 text-center text-ink-muted">{t('Nada neste período.')}</p>}
      />
      {d && d.total > d.page_size && <Pagination page={page} pageSize={d.page_size} total={d.total} onPage={setPage} />}
    </>
  );
}

// ---------------------------------------------------------------- Stock geral
export function GroupStock() {
  const { t } = useI18n();
  const s = useApi('/api/group/stock');
  const d = s.data;
  return (
    <>
      <PageHeader title={t('Stock geral')} description={t('O que está a acabar ou a expirar em todos, com o mesmo produto junto (pelo código de barras, ou pelo nome).')} />
      {s.error && <Alert tone="danger" className="mb-3">{s.error}</Alert>}
      {!d ? <Skeleton className="h-40 w-full" /> : (
        <div className="flex flex-col gap-4">
          <Card padded={false}>
            <div className="p-5 pb-0"><CardHeader title={t('A acabar')} description={t('{n} produto(s) abaixo do mínimo em pelo menos um estabelecimento.', { n: d.low.length })} /></div>
            <div className="px-5 pb-5">
              <Table
                columns={[
                  { key: 'name', header: t('Produto'), render: (g) => <span><span className="block text-ink">{g.name}</span>{g.barcode && <span className="num block text-xs text-ink-muted">{g.barcode}</span>}</span> },
                  ...d.establishments.map((e) => ({ key: e.id, header: e.name, align: 'right', render: (g) => { const p = g.per.find((x) => x.tenant_id === e.id); return !p || p.missing ? <span className="text-ink-faint">{t('não tem')}</span> : <Badge tone={p.qty <= 0 ? 'danger' : p.low ? 'warning' : 'neutral'}>{formatQty(p.qty, g.unit)}</Badge>; } })),
                  { key: 'total', header: t('Total'), align: 'right', render: (g) => <span className="num font-medium">{formatQty(g.total, g.unit)}</span> },
                ]}
                rows={d.low}
                rowKey="key"
                empty={<p className="py-8 text-center text-ink-muted">{t('Nada a acabar.')}</p>}
              />
            </div>
          </Card>
          <Card padded={false}>
            <div className="p-5 pb-0"><CardHeader title={t('A expirar')} description={t('Lotes perto da validade (ou já fora dela), em todos.')} /></div>
            <div className="px-5 pb-5">
              <Table
                columns={[
                  { key: 'name', header: t('Produto'), render: (l) => l.name },
                  { key: 'est', header: t('Estabelecimento'), render: (l) => l.establishment },
                  { key: 'qty', header: t('Qtd.'), align: 'right', render: (l) => formatQty(l.quantity, l.unit) },
                  { key: 'days', header: t('Validade'), align: 'right', render: (l) => <Badge tone={l.days_left < 0 ? 'danger' : l.days_left <= 2 ? 'warning' : 'neutral'}>{l.days_left < 0 ? t('expirou') : l.days_left === 0 ? t('hoje') : t('{n} dia(s)', { n: l.days_left })}</Badge> },
                ]}
                rows={d.expiring}
                rowKey="lot_id"
                empty={<p className="py-8 text-center text-ink-muted">{t('Nenhum lote a expirar.')}</p>}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Gerentes
export function GroupManagers() {
  const { t } = useI18n();
  const { establishments } = useOutletContext() || {};
  return (
    <>
      <PageHeader title={t('Gerentes')} description={t('Cada gerente trabalha num estabelecimento. Entra com o e-mail e a senha; não vê custos, lucro, salários nem os seus dados de dono.')} />
      <ManagersCard establishments={(establishments || []).filter((e) => e.available !== false && e.status !== 'closed')} />
    </>
  );
}

// ---------------------------------------------------------------- Mapa
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
function staticMap(points) {
  if (!TOKEN || !points.length) return null;
  const pins = points.map((p, i) => `pin-l-${i + 1}+${p.open ? '047857' : '78716C'}(${p.lng},${p.lat})`).join(',');
  const view = points.length === 1 ? `${points[0].lng},${points[0].lat},14,0` : 'auto';
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins}/${view}/900x480@2x?padding=60&access_token=${TOKEN}`;
}
export function GroupMap() {
  const { t } = useI18n();
  const ov = useApi('/api/group/overview?light=1');
  const [feed, setFeed] = useState([]);
  const reload = useThrottledReload(ov.reload, 5000);
  useGroupLive((kind, d) => {
    const text = liveText(kind, d, t, false);
    if (text) setFeed((f) => [{ id: Date.now() + Math.random(), kind, est: d.establishment, text, at: new Date() }, ...f].slice(0, 12));
    if (kind === 'sale' || kind === 'cancel') reload();
  });
  const rows = ov.data?.establishments || [];
  const placed = rows.filter((e) => e.lat != null && e.lng != null).map((e) => ({ ...e, open: e.open_now && !e.closed }));
  const img = staticMap(placed);
  return (
    <>
      <PageHeader title={t('Mapa')} description={t('Os seus estabelecimentos no mapa, com as vendas de hoje a chegar ao vivo. (O mapa 3D completo vem a seguir.)')} />
      {ov.error && <Alert tone="danger" className="mb-3">{ov.error}</Alert>}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padded={false} className="overflow-hidden lg:col-span-2">
          {img ? <img src={img} alt={t('Mapa dos seus estabelecimentos')} className="block h-auto w-full" loading="lazy" />
            : <div className="flex h-72 flex-col items-center justify-center gap-2 p-6 text-center text-ink-muted"><MapPin size={22} /><p>{TOKEN ? t('Marque cada estabelecimento no mapa: entre nele e vá a Definições › Estabelecimento › «Onde fica o estabelecimento?».') : t('O mapa não está disponível neste servidor.')}</p></div>}
        </Card>
        <div className="flex flex-col gap-3">
          {rows.map((e) => {
            const n = placed.findIndex((p) => p.id === e.id);
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{n >= 0 ? `${n + 1}. ` : ''}{e.name}</p>
                  <OpenDot e={e} />
                </div>
                <p className="num mt-1 text-lg font-semibold text-ink">{money(e.today.revenue)}</p>
                <p className="text-xs text-ink-muted">{t('Hoje · lucro {v}', { v: money(e.today.profit) })}{n < 0 ? ' · ' + t('sem ponto no mapa') : ''}</p>
              </Card>
            );
          })}
          <Card>
            <CardHeader title={t('Ao vivo')} description={feed.length ? undefined : t('Cada venda, perda ou txeneka aparece aqui no momento em que acontece.')} />
            {feed.map((f) => <p key={f.id} className="mb-1.5 text-sm text-ink-2"><span className="num text-xs text-ink-muted">{f.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> · <span className="font-medium text-ink">{f.est}</span>: {f.text}</p>)}
          </Card>
        </div>
      </div>
    </>
  );
}
