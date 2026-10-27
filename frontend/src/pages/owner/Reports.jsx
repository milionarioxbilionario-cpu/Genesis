import React, { useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { lossReason, timelineDetail, timelineExtra, timelineTitle, timelineWhen, timelineWho } from '../../utils/timelineText';
import PdfButton from '../../components/PdfButton';
import { money, int, isoDay, date, dateTime, monthName, PAYMENT_LABEL, axisMoney } from '../../utils/format';
import { getLang, locale } from '../../i18n/core';
import { useI18n } from '../../i18n/react';
import SaleDrawer from '../../components/SaleDrawer';
import { Alert, Badge, Button, Card, CardHeader, Input, KeyValue, PageHeader, Pagination, ProgressBar, Select, Skeleton, Stat, Table, Tabs, Toolbar, cx } from '../../components/ui';

// Grafico sem dados: mensagem em vez de um eixo "0, 0, 0".
function NoData() {
  const { t } = useI18n();
  return <div className="flex h-full items-center justify-center text-base text-ink-muted">{t('Sem vendas neste período.')}</div>;
}

const tooltipStyle = { border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 };
// Portugues como sempre foi ("segunda, 12/10"); ingles pelo Intl ("Monday, 12/10").
const WEEKDAYS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const weekdayName = (d) => (getLang() === 'pt' ? WEEKDAYS_PT[d.getDay()] : d.toLocaleDateString(locale(), { weekday: 'long' }));
const dayLabel = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${weekdayName(d)}, ${d.getDate()}/${d.getMonth() + 1}`; };
const shiftDay = (iso, n) => isoDay(new Date(new Date(iso + 'T12:00:00').getTime() + n * 86400000));
const dec = (v) => (getLang() === 'pt' ? String(v).replace('.', ',') : String(v));

export default function Reports() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'daily';
  const day = params.get('date') || isoDay();
  const go = (next) => setParams({ tab: next.tab || tab, ...(next.date || (next.tab || tab) === 'daily' ? { date: next.date || day } : {}) });
  return (
    <>
      <PageHeader title={t('Relatórios')} description={t('Tudo o que aconteceu na loja, com o porquê de cada valor.')} />
      <Tabs className="no-print mb-5" value={tab} onChange={(v) => go({ tab: v })} items={[{ value: 'daily', label: t('Diário') }, { value: 'weekly', label: t('Semanal') }, { value: 'monthly', label: t('Mensal') }]} />
      {tab === 'daily' && <Daily day={day} setDay={(d) => go({ tab: 'daily', date: d })} />}
      {tab === 'weekly' && <Weekly openDay={(d) => go({ tab: 'daily', date: d })} />}
      {tab === 'monthly' && <Monthly />}
    </>
  );
}

// ------------------------------------------------------------------ comuns
function Kpis({ r, compareLabel }) {
  const { t } = useI18n();
  const result = r.gross_profit - r.losses_total;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label={t('Receita')} value={money(r.gross_revenue)} delta={r.compare?.revenue_change_pct ?? undefined} hint={t('{n} venda(s)', { n: int(r.sales_count) }) + (r.compare?.revenue_change_pct != null ? ' · ' + compareLabel : '')} />
      <Stat label={t('Lucro bruto')} value={money(r.gross_profit)} tone={r.gross_profit < 0 ? 'danger' : undefined} hint={r.gross_revenue ? t('{p}% da receita · custo {v}', { p: Math.round((r.gross_profit / r.gross_revenue) * 100), v: money(r.cost_of_goods) }) : t('Receita − custo dos produtos')} />
      <Stat label={t('Perdas')} value={r.losses_total ? '−' + money(r.losses_total) : money(0)} tone={r.losses_total ? 'danger' : undefined} hint={t('Quebras, validades e consumo, ao custo')} />
      <Stat label={t('Resultado')} value={money(result)} tone={result < 0 ? 'danger' : 'positive'} hint={t('Lucro bruto − perdas')} />
    </div>
  );
}

function ProductRanking({ title, description, rows, valueKey }) {
  const { t } = useI18n();
  return (
    <Card padded={false}>
      <div className="p-5 pb-0"><CardHeader title={title} description={description} /></div>
      <div className="px-5 pb-5">
        <Table
          columns={[
            { key: 'rank', header: '#', render: (p) => <span className="num text-ink-muted">{t('{n}.º', { n: p.rank })}</span> },
            { key: 'name', header: t('Produto') },
            { key: 'quantity', header: t('Qtd.'), align: 'right', render: (p) => <span className={valueKey === 'quantity' ? 'font-medium' : ''}>{int(p.quantity)}</span> },
            { key: 'revenue', header: t('Receita'), align: 'right', render: (p) => money(p.revenue) },
            { key: 'profit', header: t('Lucro'), align: 'right', render: (p) => <span className={valueKey === 'profit' ? 'font-medium' : ''}>{money(p.profit)}</span> },
          ]}
          rows={rows}
          rowKey="product_id"
          empty={<p className="py-6 text-center text-ink-muted">{valueKey === 'profit' ? t('Sem vendas com lucro.') : t('Sem vendas.')}</p>}
        />
      </div>
    </Card>
  );
}

function Breakdown({ r }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ProductRanking title={t('Mais vendidos')} description={t('Por quantidade. Até 3 lugares; empates partilham o lugar.')} rows={r.top_products} valueKey="quantity" />
      <ProductRanking title={t('Mais rentáveis')} description={t('Por lucro. Não é o mesmo que vender mais.')} rows={r.top_profitable || []} valueKey="profit" />
      <Card>
        <CardHeader title={t('Por forma de pagamento')} />
        {Object.entries(r.by_payment).filter(([k, v]) => v > 0 || k !== 'mobile_money').map(([k, v]) => <KeyValue key={k} label={PAYMENT_LABEL[k] || k} value={money(v)} />)}
        {r.discounts_total > 0 && <KeyValue label={t('Descontos concedidos')} value={'−' + money(r.discounts_total)} tone="danger" />}
      </Card>
      <Card>
        <CardHeader title={t('Por caixista')} />
        {r.by_cashier.length === 0 ? <p className="text-ink-muted">{t('Sem vendas.')}</p> : r.by_cashier.map((c) => <KeyValue key={c.cashier_id} label={`${c.name} · ${t('{n} venda(s)', { n: c.sales })}`} value={money(c.revenue)} />)}
      </Card>
      <Card>
        <CardHeader title={t('Perdas')} description={r.losses.length ? t('{n} registo(s) · {v} ao custo', { n: r.losses.length, v: money(r.losses_total) }) : undefined} />
        {r.losses.length === 0 ? <p className="text-ink-muted">{t('Nenhuma perda registada.')}</p> : r.losses.slice(0, 8).map((l) => (
          <KeyValue key={l.id} label={`${l.quantity} × ${l.name} · ${lossReason(l.reason)}`} value={'−' + money(l.value)} tone="danger" />
        ))}
      </Card>
      {r.by_category.length > 0 && (
        <Card>
          <CardHeader title={t('Por categoria')} />
          {r.by_category.map((c) => <KeyValue key={c.category} label={c.category} value={money(c.revenue)} />)}
        </Card>
      )}
      <Card>
        <CardHeader title={t('Vendas perdidas')} description={t('O que os clientes pediram e não havia (registado pelos caixistas).')} />
        {r.lost_demand.length === 0 ? <p className="text-ink-muted">{t('Nenhum pedido registado.')}</p> : r.lost_demand.map((d) => (
          <KeyValue key={d.key || d.product_id}
            label={<span className="flex flex-wrap items-center gap-2">{d.name}{d.outside && <Badge tone="neutral">{t('fora do catálogo')}</Badge>}</span>}
            value={<span className="text-right"><span className="num">{int(d.units)} {t('un.')}</span>{d.requests > 1 && <span className="text-ink-muted"> · {t('{n} pedidos', { n: d.requests })}</span>}{d.estimated_value != null && <span className="block text-sm text-ink-muted num">≈ {money(d.estimated_value)}</span>}</span>} />
        ))}
      </Card>
      <Card>
        <CardHeader title={t('Cancelamentos')} description={r.cancellations.length ? t('{n} venda(s) · {v}', { n: r.cancellations.length, v: money(r.cancelled_total) }) : undefined} />
        {r.cancellations.length === 0 ? <p className="text-ink-muted">{t('Nenhum.')}</p> : r.cancellations.map((c) => <KeyValue key={c.id} label={`${dateTime(c.created_at)} · ${c.cashier} · ${c.reason || t('sem motivo')}`} value={money(c.total_amount)} />)}
      </Card>
      <Card>
        <CardHeader title={t('Fechos de turno')} />
        {r.shift_closings.length === 0 ? <p className="text-ink-muted">{t('Nenhum.')}</p> : r.shift_closings.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5">
            <span className="text-ink-2">{s.cashier} · {dateTime(s.closed_at)}</span>
            {s.difference === 0 ? <Badge tone="positive">{t('Certo')}</Badge> : <Badge tone="warning">{money(s.difference, { sign: true })}</Badge>}
          </div>
        ))}
      </Card>
    </div>
  );
}

function Restock({ data, title }) {
  const { t } = useI18n();
  if (!data) return null;
  return (
    <Card padded={false} className="mt-4">
      <div className="p-5 pb-0">
        <CardHeader
          title={title}
          description={t('Ao ritmo das vendas dos últimos {w} dias, para {c} dias. Inclui produtos pedidos quando não havia.', { w: data.window_days, c: data.cover_days })}
          action={data.items.length > 0 && <span className="num text-base font-semibold text-ink">{money(data.total_investment)}</span>}
        />
      </div>
      <div className="px-5 pb-5">
        <Table
          columns={[
            { key: 'name', header: t('Produto') },
            { key: 'stock', header: t('Stock'), align: 'right', render: (i) => int(i.stock) },
            { key: 'per_day', header: t('Vende/dia'), align: 'right', render: (i) => dec(i.per_day) },
            { key: 'quantity', header: t('Comprar'), align: 'right', render: (i) => <span className="font-medium">{int(i.quantity)}</span> },
            { key: 'investment', header: t('Investimento'), align: 'right', render: (i) => money(i.investment) },
          ]}
          rows={data.items.slice(0, 12)}
          rowKey="product_id"
          empty={<p className="py-6 text-center text-ink-muted">{t('O stock actual chega para este período.')}</p>}
        />
        {data.slow_movers.length > 0 && (
          <Alert tone="info" className="mt-3" title={t('Não reforçar')}>
            {t('Quase não se venderam:')} {data.slow_movers.slice(0, 6).map((s) => t('{name} ({n} em stock, {v} parado)', { name: s.name, n: int(s.stock), v: money(s.stock_value) })).join(' · ')}.
          </Alert>
        )}
      </div>
    </Card>
  );
}

// PDF do relatorio (substitui o window.print, que nao funciona na app do ecra
// principal do iPhone). Junta o rastreio inteiro do periodo (ate 1000 movimentos).
const loadReportPdf = () => import('../../utils/pdf/reportPdf');
function ReportPdf({ kind, data, from, to, labels }) {
  const { tenant } = useOutletContext() || {};
  async function build() {
    const { buildReportPdf } = await loadReportPdf();
    const base = `/api/owner/reports/timeline?from=${from}&to=${to}&page_size=200`;
    const first = (await api.get(base + '&page=1')).data;
    const rows = [...first.rows];
    for (let page = 2; rows.length < first.total && page <= 5; page += 1) rows.push(...(await api.get(base + '&page=' + page)).data.rows);
    return buildReportPdf({ kind, shopName: tenant?.name, data, timeline: { ...first, rows }, labels });
  }
  return <PdfButton build={build} preload={loadReportPdf} disabled={!data} />;
}

// Rastreio: cada evento do periodo, com quem, quando (ao segundo) e o efeito.
// label em portugues = chave da traducao.
const TYPE_FILTERS = [
  { value: '', label: 'Tudo' },
  { value: 'sale', label: 'Vendas' },
  { value: 'loss', label: 'Perdas' },
  { value: 'cancelled', label: 'Cancelamentos' },
  { value: 'stock', label: 'Entradas de stock' },
  { value: 'debt,debt_payment', label: 'Txenekas' },
  { value: 'shift', label: 'Fechos de turno' },
  { value: 'demand', label: 'Pedidos em falta' },
  { value: 'expense', label: 'Despesas' },
];
const PAGE = 50;

function Timeline({ from, to }) {
  const { t } = useI18n();
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [sale, setSale] = useState(null);
  const url = `/api/owner/reports/timeline?from=${from}&to=${to}&page=${page}&page_size=${PAGE}${type ? '&types=' + type : ''}`;
  const { data, loading, error } = useApi(url);
  const sameDay = from === to;
  const value = (e) => {
    if (e.effect === 'gain') return <span className="num font-medium text-positive">{money(e.amount, { sign: true })}</span>;
    if (e.effect === 'loss' || e.effect === 'expense') return <span className="num font-medium text-danger">{money(e.amount)}</span>;
    if (e.type === 'cancelled') return <span className="num text-ink-faint line-through">{money(e.sale.total_amount)}</span>;
    if (e.type === 'shift') return <span className={cx('num', e.amount === 0 ? 'text-ink-muted' : 'text-warning')}>{money(e.amount, { sign: true })}</span>;
    return e.amount ? <span className="num text-ink-muted">{money(e.amount)}</span> : <span className="text-ink-faint">—</span>;
  };
  return (
    <section className="mt-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{t('Rastreio')}</h2>
          <p className="text-sm text-ink-muted">{t('Cada movimento, por ordem. Clique numa venda para ver o recibo.')}</p>
        </div>
        <Select aria-label={t('Tipo de movimento')} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="no-print w-52">
          {TYPE_FILTERS.map((f) => <option key={f.value} value={f.value}>{t(f.label)}</option>)}
        </Select>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      {data && (
        <p className="mb-2 text-sm text-ink-2">
          <span className="num text-positive">{money(data.totals.gains, { sign: true })}</span> {t('em vendas')} ·{' '}
          <span className="num text-danger">{money(data.totals.losses)}</span> {t('em perdas')} ·{' '}
          {t('lucro do período')} <span className={cx('num font-medium', data.totals.profit < 0 ? 'text-danger' : 'text-ink')}>{money(data.totals.profit)}</span>
        </p>
      )}
      <div className={cx('transition-opacity', loading && data && 'opacity-50')} aria-busy={loading}>
      <Table
        columns={[
          { key: 'at', header: sameDay ? t('Hora') : t('Data'), render: (e) => <span className="num whitespace-nowrap text-ink-2">{timelineWhen(e, sameDay)}</span> },
          { key: 'title', header: t('Movimento'), render: (e) => (
            <div className="min-w-0">
              <p className="text-ink">{timelineTitle(e)}</p>
              <p className="text-xs text-ink-muted">{[timelineDetail(e), timelineExtra(e)].filter(Boolean).join(' · ')}</p>
            </div>
          ) },
          { key: 'who', header: t('Quem'), render: (e) => <span className="text-ink-2">{timelineWho(e)}</span> },
          { key: 'value', header: t('Valor'), align: 'right', render: value },
        ]}
        rows={data?.rows || []}
        loading={loading && !data}
        onRowClick={(e) => e.sale && setSale(e.sale)}
        empty={<p className="py-8 text-center text-ink-muted">{t('Nada aconteceu neste período.')}</p>}
      />
      </div>
      {data && data.total > PAGE && <Pagination page={page} pageSize={PAGE} total={data.total} onPage={setPage} />}
      <SaleDrawer sale={sale} onClose={() => setSale(null)} />
    </section>
  );
}

// ------------------------------------------------------------------ diario
function Daily({ day, setDay }) {
  const { t } = useI18n();
  const { data, loading, error } = useApi('/api/owner/reports/daily?date=' + day);
  const g = data?.goal_progress;
  return (
    <>
      <Toolbar className="no-print">
        <Button size="sm" variant="ghost" onClick={() => setDay(shiftDay(day, -1))}>{t('← Dia anterior')}</Button>
        <Input type="date" aria-label={t('Dia')} value={day} max={isoDay()} onChange={(e) => e.target.value && setDay(e.target.value)} className="w-44" />
        <Button size="sm" variant="ghost" disabled={day >= isoDay()} onClick={() => setDay(shiftDay(day, 1))}>{t('Dia seguinte →')}</Button>
        <ReportPdf kind="daily" data={data} from={day} to={day} labels={{ title: t('Relatório diário'), subtitle: dayLabel(day) + '/' + day.slice(0, 4), period: day.split('-').reverse().join('-'), dayLabel }} />
      </Toolbar>
      <h2 className="mb-3 text-lg font-semibold capitalize text-ink">{dayLabel(day)}</h2>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-40 w-full" /> : (
        <>
          <Kpis r={data} compareLabel={t('vs {d}', { d: dayLabel(data.compare.previous_date) })} />
          {g ? (
            <Card className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-base text-ink-2">{t('Meta do mês:')} <span className="num font-medium text-ink">{money(g.target)}</span></p>
                <p className="text-base text-ink-2">
                  {t('Este dia:')} <span className="num font-semibold text-ink">+{dec(g.today_pct)}%</span> · {t('acumulado até aqui:')} <span className="num font-semibold text-ink">{dec(g.accumulated_pct)}%</span> ({money(g.accumulated)})
                </p>
              </div>
              <ProgressBar className="mt-3" value={g.accumulated_pct} />
            </Card>
          ) : <Alert tone="info" className="mt-4">{t('Sem meta para este mês. Defina-a no Início para ver quanto cada dia vale da meta.')}</Alert>}
          <Breakdown r={data} />
          <Timeline from={day} to={day} />
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ semanal
function Weekly({ openDay }) {
  const { t } = useI18n();
  const [end, setEnd] = useState(isoDay());
  const start = shiftDay(end, -6);
  const { data, loading, error } = useApi(`/api/owner/reports/weekly?start=${start}&end=${end}`);
  return (
    <>
      <Toolbar className="no-print">
        <span className="text-sm text-ink-muted">{t('Semana a terminar em')}</span>
        <Input type="date" aria-label={t('Fim da semana')} value={end} max={isoDay()} onChange={(e) => e.target.value && setEnd(e.target.value)} className="w-44" />
        <ReportPdf kind="weekly" data={data} from={start} to={end} labels={{ title: t('Relatório semanal'), subtitle: t('{a} a {b}', { a: dayLabel(start), b: dayLabel(end) + '/' + end.slice(0, 4) }), period: t('{a} a {b}', { a: start.split('-').reverse().join('-'), b: end.split('-').reverse().join('-') }), dayLabel }} />
      </Toolbar>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-40 w-full" /> : (
        <>
          <Kpis r={data} compareLabel={t('vs semana anterior')} />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={t('Receita por dia')} description={t('{a} a {b}', { a: date(data.start), b: date(data.end) })} />
              <div className="h-60">
                {data.gross_revenue === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.by_day.map((d) => ({ ...d, label: d.date.slice(8, 10) + '/' + d.date.slice(5, 7) }))} margin={{ left: -12, right: 4, top: 4 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis width={80} tickFormatter={axisMoney} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--subtle)' }} formatter={(v) => [money(v), t('Receita')]} contentStyle={tooltipStyle} />
                      <Bar isAnimationActive={false} dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title={t('Melhor e pior dia')} description={t('Pelo resultado (lucro bruto − perdas).')} />
              {data.best_day ? (
                <>
                  <KeyValue label={<span className="capitalize">{t('Melhor · {d}', { d: dayLabel(data.best_day.date) })}</span>} value={money(data.best_day.gross_profit - data.best_day.losses)} tone="positive" />
                  {data.worst_day && data.worst_day.date !== data.best_day.date && <KeyValue label={<span className="capitalize">{t('Pior · {d}', { d: dayLabel(data.worst_day.date) })}</span>} value={money(data.worst_day.gross_profit - data.worst_day.losses)} tone={data.worst_day.gross_profit - data.worst_day.losses < 0 ? 'danger' : undefined} />}
                </>
              ) : <p className="text-ink-muted">{t('Sem movimento nesta semana.')}</p>}
            </Card>
          </div>
          <Card padded={false} className="mt-4">
            <div className="p-5 pb-0"><CardHeader title={t('Dia a dia')} description={t('Clique num dia para abrir o relatório diário completo.')} /></div>
            <div className="px-5 pb-5">
              <Table
                columns={[
                  { key: 'date', header: t('Dia'), render: (d) => <span className="capitalize">{dayLabel(d.date)}</span> },
                  { key: 'sales', header: t('Vendas'), align: 'right', render: (d) => int(d.sales) },
                  { key: 'revenue', header: t('Receita'), align: 'right', render: (d) => money(d.revenue) },
                  { key: 'gross_profit', header: t('Lucro bruto'), align: 'right', render: (d) => money(d.gross_profit) },
                  { key: 'losses', header: t('Perdas'), align: 'right', render: (d) => (d.losses ? <span className="text-danger">−{money(d.losses)}</span> : '—') },
                  { key: 'result', header: t('Resultado'), align: 'right', render: (d) => <span className={cx('font-medium', d.gross_profit - d.losses < 0 && 'text-danger')}>{money(d.gross_profit - d.losses)}</span> },
                ]}
                rows={data.by_day}
                rowKey="date"
                onRowClick={(d) => openDay(d.date)}
              />
            </div>
          </Card>
          <Breakdown r={data} />
          <Restock data={data.restock} title={t('O que comprar para a próxima semana')} />
          <Timeline from={data.start} to={data.end} />
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ mensal
// O DIFERENCIADOR: lucro liquido real depois de todas as deducoes.
function Monthly() {
  const { t } = useI18n();
  const now = new Date();
  // ?y=2026&m=9 abre esse mes (ligacao do fecho do mes).
  const [params] = useSearchParams();
  const [period, setPeriod] = useState(() => {
    const y = Number(params.get('y')); const m = Number(params.get('m'));
    return y >= 2020 && m >= 1 && m <= 12 ? { year: y, month: m } : { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const { data, loading, error } = useApi(`/api/owner/reports/monthly?year=${period.year}&month=${period.month}`);
  const goals = useApi('/api/owner/goals/history');
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return { year: d.getFullYear(), month: d.getMonth() + 1 }; }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const first = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
  const lastDay = new Date(period.year, period.month, 0).getDate();
  const last = isoDay(new Date(Math.min(new Date(period.year, period.month - 1, lastDay).getTime(), Date.now())));
  const monthTitle = `${monthName(period.month)} ${period.year}`;

  const steps = data ? [
    { key: 'gross', label: t('Receita bruta'), value: data.gross_revenue, kind: 'base' },
    { key: 'cogs', label: t('Custo dos produtos vendidos'), value: -data.cost_of_goods },
    { key: 'profit', label: t('Lucro bruto'), value: data.gross_profit, kind: 'subtotal' },
    { key: 'salaries', label: t('Salários'), value: -data.deductions.total_salaries },
    { key: 'rent', label: t('Renda'), value: -data.deductions.total_rent },
    { key: 'fixed', label: t('Outros custos fixos'), value: -data.deductions.total_other_fixed },
    { key: 'delivery', label: t('Entregas de fornecedores'), value: -data.deductions.total_supplier_delivery },
    { key: 'expenses', label: t('Despesas avulsas'), value: -(data.deductions.total_expenses || 0) },
    ...(data.deductions.total_fines ? [{ key: 'fines', label: t('Multas'), value: -data.deductions.total_fines }] : []),
    // Fase 15.2: impostos so aparecem quando a loja os tem.
    ...(data.taxes?.vat_mode === 'iva' ? [{ key: 'vat', label: t('IVA a entregar ao Estado'), value: -(data.deductions.total_vat_due || 0) }] : []),
    ...(data.taxes?.ispc ? [{ key: 'ispc', label: t('ISPC (estimativa, {pct}%)', { pct: data.taxes.ispc.pct }), value: -(data.deductions.total_ispc || 0) }] : []),
    ...(data.taxes?.inss_employer_pct ? [{ key: 'inss', label: t('INSS do patrão ({pct}% dos salários)', { pct: data.taxes.inss_employer_pct }), value: -(data.deductions.total_inss || 0) }] : []),
    { key: 'net', label: t('Lucro líquido real'), value: data.net_profit, kind: 'result' },
  ] : [];
  const scale = data ? Math.max(1, data.gross_revenue, ...steps.map((s) => Math.abs(s.value))) : 1;

  return (
    <>
      <Toolbar className="no-print">
        <Select aria-label={t('Mês')} value={`${period.year}-${period.month}`} onChange={(e) => { const [y, m] = e.target.value.split('-').map(Number); setPeriod({ year: y, month: m }); }} className="w-48">
          {months.map((m) => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{monthName(m.month)} {m.year}</option>)}
        </Select>
        <ReportPdf kind="monthly" data={data} from={first} to={last} labels={{ title: t('Relatório mensal'), subtitle: monthTitle, period: monthTitle, dayLabel }} />
      </Toolbar>
      <h2 className="mb-3 text-lg font-semibold capitalize text-ink">{monthTitle}</h2>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-60 w-full" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t('Receita')} value={money(data.gross_revenue)} delta={data.compare.revenue_change_pct ?? undefined} hint={t('vs {v} no mês anterior', { v: money(data.compare.previous_revenue) })} />
            <Stat label={t('Lucro bruto')} value={money(data.gross_profit)} delta={data.compare.gross_profit_change_pct ?? undefined} hint={t('vs {d}', { d: money(data.compare.previous_gross_profit) })} />
            <Stat label={t('Lucro líquido real')} value={money(data.net_profit)} tone={data.net_profit < 0 ? 'danger' : 'positive'} hint={t('Depois de salários, renda, entregas e despesas')} />
            <Stat label={t('Meta')} value={data.goal ? `${dec(data.goal.pct)}%` : '—'} hint={data.goal ? t('{a} de {b}', { a: money(data.goal.achieved), b: money(data.goal.target) }) : t('Sem meta neste mês')} tone={data.goal && data.goal.pct >= 100 ? 'positive' : undefined} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={t('Do que entrou ao que ficou')} description={t('Lucro líquido real depois de todas as despesas do mês.')} />
              <div className="flex flex-col gap-2.5">
                {steps.map((s) => (
                  <div key={s.key} className={cx('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4', (s.kind === 'subtotal' || s.kind === 'result') && 'border-t border-border pt-2.5')}>
                    <span className={cx('text-base', s.kind ? 'font-medium text-ink' : 'text-ink-2')}>{s.label}</span>
                    <span className={cx('num text-base', s.kind === 'result' ? (s.value >= 0 ? 'text-lg font-semibold text-positive' : 'text-lg font-semibold text-danger') : s.kind ? 'font-medium text-ink' : 'text-ink-2')}>
                      {s.kind ? money(s.value) : (s.value === 0 ? money(0) : '−' + money(-s.value))}
                    </span>
                    <div className="col-span-2 mt-1 h-1.5 rounded-full bg-subtle">
                      <div className={cx('h-full rounded-full', s.kind === 'result' ? (s.value >= 0 ? 'bg-positive' : 'bg-danger') : s.kind ? 'bg-ink-2' : 'bg-border-strong')} style={{ width: Math.min(100, (Math.abs(s.value) / scale) * 100) + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
              {data.taxes?.vat && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-1 text-sm font-medium text-ink">{t('IVA do mês')}</p>
                  <KeyValue label={t('Cobrado nas vendas')} value={money(data.taxes.vat.collected)} />
                  <KeyValue label={t('Já pago nas compras do que vendeu (estimativa)')} value={'−' + money(data.taxes.vat.on_cost)} />
                  <KeyValue label={t('A entregar ao Estado')} value={money(data.taxes.vat.due)} strong />
                </div>
              )}
              {data.taxes?.ispc && (
                <p className="mt-4 text-sm text-ink-2">{t('ISPC: {pct}% do que vendeu, pago por trimestre. O escalão é escolhido pelo que deve vender no ano, ao ritmo de agora: {total}.', { pct: data.taxes.ispc.pct, total: money(data.taxes.ispc.projected_annual) })}</p>
              )}
              {data.taxes?.ispc?.over_limit && (
                <Alert tone="warning" className="mt-2">{t('Ao ritmo de agora, as vendas do ano passam de 4 000 000 MT, o limite do ISPC. Fale com o seu contabilista sobre a mudança para o IVA.')}</Alert>
              )}
              {data.losses_total > 0 && (
                <div className="mt-4 rounded border border-border bg-danger-soft p-3 text-sm text-ink-2">
                  {t('Perdas do mês (quebras e validades):')} <span className="num font-medium text-danger">−{money(data.losses_total)}</span>. {t('Depois das perdas ficariam')} <span className="num font-medium text-ink">{money(data.net_profit - data.losses_total)}</span>.
                </div>
              )}
              {data.fines?.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-1 text-sm font-medium text-ink">{t('Multas do mês')}</p>
                  {data.fines.map((f) => <KeyValue key={f.id} label={[f.entity, f.description].filter(Boolean).join(' · ')} value={'−' + money(f.amount)} />)}
                </div>
              )}
              {data.expenses?.by_category.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-1 text-sm font-medium text-ink">{t('Despesas avulsas por categoria')}</p>
                  {data.expenses.by_category.map((c) => <KeyValue key={c.category} label={c.category} value={'−' + money(c.amount)} />)}
                </div>
              )}
              {data.deductions.total_rent === 0 && (
                <Alert tone="warning" className="mt-4">{t('Não há renda registada. Se paga renda, registe-a em Definições → Custos e despesas para o lucro ser real.')}</Alert>
              )}
            </Card>
            <Card>
              <CardHeader title={t('Últimos 6 meses')} description={t('Receita bruta')} />
              <div className="h-56">
                {data.revenue_history.every((m) => m.revenue === 0) ? <NoData /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenue_history.map((m) => ({ ...m, label: monthName(Number(m.key.slice(5))).slice(0, 3) }))} margin={{ left: -12, right: 4, top: 4 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis width={80} tickFormatter={axisMoney} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--subtle)' }} formatter={(v) => [money(v), t('Receita')]} contentStyle={tooltipStyle} />
                      <Bar isAnimationActive={false} dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card padded={false}>
              <div className="p-5 pb-0"><CardHeader title={t('Semanas do mês')} description={data.best_week ? (data.worst_week ? t('Melhor: semana {a} · pior: semana {b}', { a: data.best_week.week, b: data.worst_week.week }) : t('Melhor: semana {a}', { a: data.best_week.week })) : undefined} /></div>
              <div className="px-5 pb-5">
                <Table
                  columns={[
                    { key: 'week', header: t('Semana'), render: (w) => <span>{w.week} <span className="text-xs text-ink-muted">({w.from.slice(8)}–{w.to.slice(8)})</span> {data.best_week?.week === w.week && <Badge tone="positive">{t('melhor')}</Badge>}{data.worst_week?.week === w.week && <Badge tone="warning">{t('pior')}</Badge>}</span> },
                    { key: 'revenue', header: t('Receita'), align: 'right', render: (w) => money(w.revenue) },
                    { key: 'result', header: t('Resultado'), align: 'right', render: (w) => money(w.gross_profit - w.losses) },
                  ]}
                  rows={data.weeks}
                  rowKey="week"
                />
              </div>
            </Card>
            <Card>
              <CardHeader title={t('Metas dos últimos 12 meses')} />
              {!goals.data ? <Skeleton className="h-32 w-full" /> : goals.data.filter((g) => g.target || g.achieved).length === 0 ? <p className="text-ink-muted">{t('Ainda não há metas registadas.')}</p> : (
                <div className="flex flex-col gap-2.5">
                  {[...goals.data].reverse().filter((g) => g.target || g.achieved).slice(0, 8).map((g) => (
                    <div key={`${g.year}-${g.month}`}>
                      <div className="flex justify-between text-sm">
                        <span className={cx('capitalize text-ink-2', g.current && 'font-medium text-ink')}>{monthName(g.month)} {g.year}{g.current ? ' ' + t('(este mês)') : ''}</span>
                        <span className="num text-ink-2">{g.target ? t('{p}% de {v}', { p: dec(g.pct), v: money(g.target) }) : t('{v} · sem meta', { v: money(g.achieved) })}</span>
                      </div>
                      {g.target > 0 && <ProgressBar className="mt-1" value={g.pct} />}
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title={t('A crescer')} description={t('Mais vendidos do que no mês anterior.')} />
              {data.trends.growing.length === 0 ? <p className="text-ink-muted">{t('Nada a crescer.')}</p> : data.trends.growing.map((x) => <KeyValue key={x.product_id} label={x.name} value={`${int(x.previous_quantity)} → ${int(x.quantity)}${x.change_pct != null ? ` (+${Math.round(x.change_pct)}%)` : ''}`} tone="positive" />)}
            </Card>
            <Card>
              <CardHeader title={t('A cair')} description={t('Menos vendidos do que no mês anterior.')} />
              {data.trends.declining.length === 0 ? <p className="text-ink-muted">{t('Nada a cair.')}</p> : data.trends.declining.map((x) => <KeyValue key={x.product_id} label={x.name} value={`${int(x.previous_quantity)} → ${int(x.quantity)}${x.change_pct != null ? ` (${Math.round(x.change_pct)}%)` : ''}`} tone="danger" />)}
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title={t('Txenekas')} description={t('Novas {a} · recebidas {b} · em aberto {c}', { a: money(data.debts.new_total), b: money(data.debts.received_total), c: money(data.debts.outstanding_total) })} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <h3 className="mb-1 text-sm font-medium text-ink-muted">{t('Novas no mês')}</h3>
                  {data.debts.new.length === 0 ? <p className="text-sm text-ink-muted">{t('Nenhuma.')}</p> : data.debts.new.map((d) => <KeyValue key={d.id} label={d.debtor} value={money(d.amount)} />)}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-ink-muted">{t('Pagamentos recebidos')}</h3>
                  {data.debts.received.length === 0 ? <p className="text-sm text-ink-muted">{t('Nenhum.')}</p> : data.debts.received.map((p) => <KeyValue key={p.id} label={`${p.debtor} · ${date(p.paid_at)}`} value={money(p.amount)} tone="positive" />)}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-ink-muted">{t('Em aberto agora')}</h3>
                  {data.debts.outstanding.length === 0 ? <p className="text-sm text-ink-muted">{t('Nada em dívida.')}</p> : data.debts.outstanding.map((d) => <KeyValue key={d.id} label={`${d.debtor}${d.overdue ? ' · ' + t('vencida') : ''}`} value={money(d.remaining)} tone={d.overdue ? 'danger' : undefined} />)}
                </div>
              </div>
            </Card>
          </div>
          <Restock data={data.restock} title={t('O que comprar para o próximo mês')} />
          <Breakdown r={data} />
          <Timeline from={first} to={last} />
        </>
      )}
    </>
  );
}
