import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useApi from '../../utils/useApi';
import { money, int, isoDay, date, dateTime, timeSec, PAYMENT_LABEL } from '../../utils/format';
import SaleDrawer from '../../components/SaleDrawer';
import { Alert, Badge, Button, Card, CardHeader, Input, KeyValue, PageHeader, Pagination, ProgressBar, Select, Skeleton, Stat, Table, Tabs, Toolbar, cx } from '../../components/ui';

// Grafico sem dados: mensagem em vez de um eixo "0, 0, 0".
const NoData = () => <div className="flex h-full items-center justify-center text-base text-ink-muted">Sem vendas neste período.</div>;

const chartMoney = (v) => (v / 100).toLocaleString('pt-PT', { maximumFractionDigits: 0 });
const tooltipStyle = { border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 };
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const dayLabel = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`; };
const shiftDay = (iso, n) => isoDay(new Date(new Date(iso + 'T12:00:00').getTime() + n * 86400000));

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'daily';
  const day = params.get('date') || isoDay();
  const go = (next) => setParams({ tab: next.tab || tab, ...(next.date || (next.tab || tab) === 'daily' ? { date: next.date || day } : {}) });
  return (
    <>
      <PageHeader title="Relatórios" description="Tudo o que aconteceu na loja, com o porquê de cada valor." actions={<Button className="no-print" icon={Printer} onClick={() => window.print()}>Imprimir / PDF</Button>} />
      <Tabs className="no-print mb-5" value={tab} onChange={(t) => go({ tab: t })} items={[{ value: 'daily', label: 'Diário' }, { value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensal' }]} />
      {tab === 'daily' && <Daily day={day} setDay={(d) => go({ tab: 'daily', date: d })} />}
      {tab === 'weekly' && <Weekly openDay={(d) => go({ tab: 'daily', date: d })} />}
      {tab === 'monthly' && <Monthly />}
    </>
  );
}

// ------------------------------------------------------------------ comuns
function Kpis({ r, compareLabel }) {
  const result = r.gross_profit - r.losses_total;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Receita" value={money(r.gross_revenue)} delta={r.compare?.revenue_change_pct ?? undefined} hint={`${int(r.sales_count)} venda(s)${r.compare?.revenue_change_pct != null ? ' · ' + compareLabel : ''}`} />
      <Stat label="Lucro bruto" value={money(r.gross_profit)} tone={r.gross_profit < 0 ? 'danger' : undefined} hint={r.gross_revenue ? `${Math.round((r.gross_profit / r.gross_revenue) * 100)}% da receita · custo ${money(r.cost_of_goods)}` : 'Receita − custo dos produtos'} />
      <Stat label="Perdas" value={r.losses_total ? '−' + money(r.losses_total) : money(0)} tone={r.losses_total ? 'danger' : undefined} hint="Quebras, validades e consumo, ao custo" />
      <Stat label="Resultado" value={money(result)} tone={result < 0 ? 'danger' : 'positive'} hint="Lucro bruto − perdas" />
    </div>
  );
}

function ProductRanking({ title, description, rows, valueKey }) {
  return (
    <Card padded={false}>
      <div className="p-5 pb-0"><CardHeader title={title} description={description} /></div>
      <div className="px-5 pb-5">
        <Table
          columns={[
            { key: 'name', header: 'Produto' },
            { key: 'quantity', header: 'Qtd.', align: 'right', render: (p) => <span className={valueKey === 'quantity' ? 'font-medium' : ''}>{int(p.quantity)}</span> },
            { key: 'revenue', header: 'Receita', align: 'right', render: (p) => money(p.revenue) },
            { key: 'profit', header: 'Lucro', align: 'right', render: (p) => <span className={valueKey === 'profit' ? 'font-medium' : ''}>{money(p.profit)}</span> },
          ]}
          rows={rows.slice(0, 5)}
          rowKey="product_id"
          empty={<p className="py-6 text-center text-ink-muted">Sem vendas.</p>}
        />
      </div>
    </Card>
  );
}

function Breakdown({ r }) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <ProductRanking title="Mais vendidos" description="Por quantidade." rows={r.top_products} valueKey="quantity" />
      <ProductRanking title="Mais rentáveis" description="Por lucro. Não é o mesmo que vender mais." rows={r.top_profitable || []} valueKey="profit" />
      <Card>
        <CardHeader title="Por forma de pagamento" />
        {Object.entries(r.by_payment).filter(([k, v]) => v > 0 || k !== 'mobile_money').map(([k, v]) => <KeyValue key={k} label={PAYMENT_LABEL[k] || k} value={money(v)} />)}
        {r.discounts_total > 0 && <KeyValue label="Descontos concedidos" value={'−' + money(r.discounts_total)} tone="danger" />}
      </Card>
      <Card>
        <CardHeader title="Por caixista" />
        {r.by_cashier.length === 0 ? <p className="text-ink-muted">Sem vendas.</p> : r.by_cashier.map((c) => <KeyValue key={c.cashier_id} label={`${c.name} · ${c.sales} venda(s)`} value={money(c.revenue)} />)}
      </Card>
      <Card>
        <CardHeader title="Perdas" description={r.losses.length ? `${r.losses.length} registo(s) · ${money(r.losses_total)} ao custo` : undefined} />
        {r.losses.length === 0 ? <p className="text-ink-muted">Nenhuma perda registada.</p> : r.losses.slice(0, 8).map((l) => (
          <KeyValue key={l.id} label={`${l.quantity} × ${l.name} · ${l.reason_label}`} value={'−' + money(l.value)} tone="danger" />
        ))}
      </Card>
      {r.by_category.length > 0 && (
        <Card>
          <CardHeader title="Por categoria" />
          {r.by_category.map((c) => <KeyValue key={c.category} label={c.category} value={money(c.revenue)} />)}
        </Card>
      )}
      <Card>
        <CardHeader title="Oportunidades perdidas" description="Produtos pedidos por clientes quando não havia." />
        {r.lost_demand.length === 0 ? <p className="text-ink-muted">Nenhum pedido registado.</p> : r.lost_demand.map((d) => <KeyValue key={d.product_id} label={d.name} value={`${d.requests}×`} />)}
      </Card>
      <Card>
        <CardHeader title="Cancelamentos" description={r.cancellations.length ? `${r.cancellations.length} venda(s) · ${money(r.cancelled_total)}` : undefined} />
        {r.cancellations.length === 0 ? <p className="text-ink-muted">Nenhum.</p> : r.cancellations.map((c) => <KeyValue key={c.id} label={`${dateTime(c.created_at)} · ${c.cashier} · ${c.reason || 'sem motivo'}`} value={money(c.total_amount)} />)}
      </Card>
      <Card>
        <CardHeader title="Fechos de turno" />
        {r.shift_closings.length === 0 ? <p className="text-ink-muted">Nenhum.</p> : r.shift_closings.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5">
            <span className="text-ink-2">{s.cashier} · {dateTime(s.closed_at)}</span>
            {s.difference === 0 ? <Badge tone="positive">Certo</Badge> : <Badge tone="warning">{money(s.difference, { sign: true })}</Badge>}
          </div>
        ))}
      </Card>
    </div>
  );
}

function Restock({ data, title }) {
  if (!data) return null;
  return (
    <Card padded={false} className="mt-4">
      <div className="p-5 pb-0">
        <CardHeader
          title={title}
          description={`Ao ritmo das vendas dos últimos ${data.window_days} dias, para ${data.cover_days} dias. Inclui produtos pedidos quando não havia.`}
          action={data.items.length > 0 && <span className="num text-base font-semibold text-ink">{money(data.total_investment)}</span>}
        />
      </div>
      <div className="px-5 pb-5">
        <Table
          columns={[
            { key: 'name', header: 'Produto' },
            { key: 'stock', header: 'Stock', align: 'right', render: (i) => int(i.stock) },
            { key: 'per_day', header: 'Vende/dia', align: 'right', render: (i) => String(i.per_day).replace('.', ',') },
            { key: 'quantity', header: 'Comprar', align: 'right', render: (i) => <span className="font-medium">{int(i.quantity)}</span> },
            { key: 'investment', header: 'Investimento', align: 'right', render: (i) => money(i.investment) },
          ]}
          rows={data.items.slice(0, 12)}
          rowKey="product_id"
          empty={<p className="py-6 text-center text-ink-muted">O stock actual chega para este período.</p>}
        />
        {data.slow_movers.length > 0 && (
          <Alert tone="info" className="mt-3" title="Não reforçar">
            Quase não se venderam: {data.slow_movers.slice(0, 6).map((s) => `${s.name} (${int(s.stock)} em stock, ${money(s.stock_value)} parado)`).join(' · ')}.
          </Alert>
        )}
      </div>
    </Card>
  );
}

// Rastreio: cada evento do periodo, com quem, quando (ao segundo) e o efeito.
const TYPE_FILTERS = [
  { value: '', label: 'Tudo' },
  { value: 'sale', label: 'Vendas' },
  { value: 'loss', label: 'Perdas' },
  { value: 'cancelled', label: 'Cancelamentos' },
  { value: 'stock', label: 'Entradas de stock' },
  { value: 'debt,debt_payment', label: 'Chenecas' },
  { value: 'shift', label: 'Fechos de turno' },
  { value: 'demand', label: 'Pedidos em falta' },
  { value: 'expense', label: 'Despesas' },
];
const PAGE = 50;

function Timeline({ from, to }) {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [sale, setSale] = useState(null);
  const url = `/api/owner/reports/timeline?from=${from}&to=${to}&page=${page}&page_size=${PAGE}${type ? '&types=' + type : ''}`;
  const { data, loading, error } = useApi(url);
  const sameDay = from === to;
  const extra = (e) => [
    e.expiry_date ? `validade ${date(e.expiry_date)}` : null,
    e.due_date ? `vence a ${date(e.due_date)}` : null,
    e.discount ? `desconto ${money(e.discount)}` : null,
    e.type === 'loss' ? `${money(e.unit_cost)} por unidade` : null,
    e.type === 'stock' ? `${money(e.unit_cost)} por unidade` : null,
    e.type === 'shift' ? `contado ${money(e.counted)} · esperado ${money(e.expected)}` : null,
  ].filter(Boolean).join(' · ');
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
          <h2 className="text-lg font-semibold text-ink">Rastreio</h2>
          <p className="text-sm text-ink-muted">Cada movimento, por ordem. Clique numa venda para ver o recibo.</p>
        </div>
        <Select aria-label="Tipo de movimento" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="no-print w-52">
          {TYPE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      {data && (
        <p className="mb-2 text-sm text-ink-2">
          <span className="num text-positive">{money(data.totals.gains, { sign: true })}</span> em vendas ·{' '}
          <span className="num text-danger">{money(data.totals.losses)}</span> em perdas ·{' '}
          lucro do período <span className={cx('num font-medium', data.totals.profit < 0 ? 'text-danger' : 'text-ink')}>{money(data.totals.profit)}</span>
        </p>
      )}
      <div className={cx('transition-opacity', loading && data && 'opacity-50')} aria-busy={loading}>
      <Table
        columns={[
          { key: 'at', header: sameDay ? 'Hora' : 'Data', render: (e) => <span className="num whitespace-nowrap text-ink-2">{e.day_only ? (sameDay ? '(dia)' : date(e.at)) : sameDay ? timeSec(e.at) : `${date(e.at)} ${timeSec(e.at)}`}</span> },
          { key: 'title', header: 'Movimento', render: (e) => (
            <div className="min-w-0">
              <p className="text-ink">{e.title}</p>
              <p className="text-xs text-ink-muted">{[e.detail, extra(e)].filter(Boolean).join(' · ')}</p>
            </div>
          ) },
          { key: 'who', header: 'Quem', render: (e) => <span className="text-ink-2">{e.who}</span> },
          { key: 'value', header: 'Valor', align: 'right', render: value },
        ]}
        rows={data?.rows || []}
        loading={loading && !data}
        onRowClick={(e) => e.sale && setSale(e.sale)}
        empty={<p className="py-8 text-center text-ink-muted">Nada aconteceu neste período.</p>}
      />
      </div>
      {data && data.total > PAGE && <Pagination page={page} pageSize={PAGE} total={data.total} onPage={setPage} />}
      <SaleDrawer sale={sale} onClose={() => setSale(null)} />
    </section>
  );
}

// ------------------------------------------------------------------ diario
function Daily({ day, setDay }) {
  const { data, loading, error } = useApi('/api/owner/reports/daily?date=' + day);
  const g = data?.goal_progress;
  return (
    <>
      <Toolbar className="no-print">
        <Button size="sm" variant="ghost" onClick={() => setDay(shiftDay(day, -1))}>← Dia anterior</Button>
        <Input type="date" aria-label="Dia" value={day} max={isoDay()} onChange={(e) => e.target.value && setDay(e.target.value)} className="w-44" />
        <Button size="sm" variant="ghost" disabled={day >= isoDay()} onClick={() => setDay(shiftDay(day, 1))}>Dia seguinte →</Button>
      </Toolbar>
      <h2 className="mb-3 text-lg font-semibold capitalize text-ink">{dayLabel(day)}</h2>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-40 w-full" /> : (
        <>
          <Kpis r={data} compareLabel={`vs ${dayLabel(data.compare.previous_date)}`} />
          {g ? (
            <Card className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-base text-ink-2">Meta do mês: <span className="num font-medium text-ink">{money(g.target)}</span></p>
                <p className="text-base text-ink-2">
                  Este dia: <span className="num font-semibold text-ink">+{String(g.today_pct).replace('.', ',')}%</span> · acumulado até aqui: <span className="num font-semibold text-ink">{String(g.accumulated_pct).replace('.', ',')}%</span> ({money(g.accumulated)})
                </p>
              </div>
              <ProgressBar className="mt-3" value={g.accumulated_pct} />
            </Card>
          ) : <Alert tone="info" className="mt-4">Sem meta para este mês. Defina-a no Início para ver quanto cada dia vale da meta.</Alert>}
          <Breakdown r={data} />
          <Timeline from={day} to={day} />
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ semanal
function Weekly({ openDay }) {
  const [end, setEnd] = useState(isoDay());
  const start = shiftDay(end, -6);
  const { data, loading, error } = useApi(`/api/owner/reports/weekly?start=${start}&end=${end}`);
  return (
    <>
      <Toolbar className="no-print">
        <span className="text-sm text-ink-muted">Semana a terminar em</span>
        <Input type="date" aria-label="Fim da semana" value={end} max={isoDay()} onChange={(e) => e.target.value && setEnd(e.target.value)} className="w-44" />
      </Toolbar>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-40 w-full" /> : (
        <>
          <Kpis r={data} compareLabel="vs semana anterior" />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Receita por dia" description={`${date(data.start)} a ${date(data.end)}`} />
              <div className="h-60">
                {data.gross_revenue === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.by_day.map((d) => ({ ...d, label: d.date.slice(8, 10) + '/' + d.date.slice(5, 7) }))} margin={{ left: -12, right: 4, top: 4 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis tickFormatter={chartMoney} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--subtle)' }} formatter={(v) => [money(v), 'Receita']} contentStyle={tooltipStyle} />
                      <Bar isAnimationActive={false} dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="Melhor e pior dia" description="Pelo resultado (lucro bruto − perdas)." />
              {data.best_day ? (
                <>
                  <KeyValue label={<span className="capitalize">Melhor · {dayLabel(data.best_day.date)}</span>} value={money(data.best_day.gross_profit - data.best_day.losses)} tone="positive" />
                  {data.worst_day && data.worst_day.date !== data.best_day.date && <KeyValue label={<span className="capitalize">Pior · {dayLabel(data.worst_day.date)}</span>} value={money(data.worst_day.gross_profit - data.worst_day.losses)} tone={data.worst_day.gross_profit - data.worst_day.losses < 0 ? 'danger' : undefined} />}
                </>
              ) : <p className="text-ink-muted">Sem movimento nesta semana.</p>}
            </Card>
          </div>
          <Card padded={false} className="mt-4">
            <div className="p-5 pb-0"><CardHeader title="Dia a dia" description="Clique num dia para abrir o relatório diário completo." /></div>
            <div className="px-5 pb-5">
              <Table
                columns={[
                  { key: 'date', header: 'Dia', render: (d) => <span className="capitalize">{dayLabel(d.date)}</span> },
                  { key: 'sales', header: 'Vendas', align: 'right', render: (d) => int(d.sales) },
                  { key: 'revenue', header: 'Receita', align: 'right', render: (d) => money(d.revenue) },
                  { key: 'gross_profit', header: 'Lucro bruto', align: 'right', render: (d) => money(d.gross_profit) },
                  { key: 'losses', header: 'Perdas', align: 'right', render: (d) => (d.losses ? <span className="text-danger">−{money(d.losses)}</span> : '—') },
                  { key: 'result', header: 'Resultado', align: 'right', render: (d) => <span className={cx('font-medium', d.gross_profit - d.losses < 0 && 'text-danger')}>{money(d.gross_profit - d.losses)}</span> },
                ]}
                rows={data.by_day}
                rowKey="date"
                onRowClick={(d) => openDay(d.date)}
              />
            </div>
          </Card>
          <Breakdown r={data} />
          <Restock data={data.restock} title="O que comprar para a próxima semana" />
          <Timeline from={data.start} to={data.end} />
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ mensal
// O DIFERENCIADOR: lucro liquido real depois de todas as deducoes.
function Monthly() {
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data, loading, error } = useApi(`/api/owner/reports/monthly?year=${period.year}&month=${period.month}`);
  const goals = useApi('/api/owner/goals/history');
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return { year: d.getFullYear(), month: d.getMonth() + 1 }; }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const first = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
  const lastDay = new Date(period.year, period.month, 0).getDate();
  const last = isoDay(new Date(Math.min(new Date(period.year, period.month - 1, lastDay).getTime(), Date.now())));

  const steps = data ? [
    { label: 'Receita bruta', value: data.gross_revenue, kind: 'base' },
    { label: 'Custo dos produtos vendidos', value: -data.cost_of_goods },
    { label: 'Lucro bruto', value: data.gross_profit, kind: 'subtotal' },
    { label: 'Salários', value: -data.deductions.total_salaries },
    { label: 'Renda', value: -data.deductions.total_rent },
    { label: 'Outros custos fixos', value: -data.deductions.total_other_fixed },
    { label: 'Entregas de fornecedores', value: -data.deductions.total_supplier_delivery },
    { label: 'Despesas avulsas', value: -(data.deductions.total_expenses || 0) },
    { label: 'Lucro líquido real', value: data.net_profit, kind: 'result' },
  ] : [];
  const scale = data ? Math.max(1, data.gross_revenue, ...steps.map((s) => Math.abs(s.value))) : 1;

  return (
    <>
      <Toolbar className="no-print">
        <Select aria-label="Mês" value={`${period.year}-${period.month}`} onChange={(e) => { const [y, m] = e.target.value.split('-').map(Number); setPeriod({ year: y, month: m }); }} className="w-48">
          {months.map((m) => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{MONTHS[m.month - 1]} {m.year}</option>)}
        </Select>
      </Toolbar>
      <h2 className="mb-3 text-lg font-semibold text-ink">{MONTHS[period.month - 1]} {period.year}</h2>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-60 w-full" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Receita" value={money(data.gross_revenue)} delta={data.compare.revenue_change_pct ?? undefined} hint={`vs ${money(data.compare.previous_revenue)} no mês anterior`} />
            <Stat label="Lucro bruto" value={money(data.gross_profit)} delta={data.compare.gross_profit_change_pct ?? undefined} hint={`vs ${money(data.compare.previous_gross_profit)}`} />
            <Stat label="Lucro líquido real" value={money(data.net_profit)} tone={data.net_profit < 0 ? 'danger' : 'positive'} hint="Depois de salários, renda, entregas e despesas" />
            <Stat label="Meta" value={data.goal ? `${String(data.goal.pct).replace('.', ',')}%` : '—'} hint={data.goal ? `${money(data.goal.achieved)} de ${money(data.goal.target)}` : 'Sem meta neste mês'} tone={data.goal && data.goal.pct >= 100 ? 'positive' : undefined} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Do que entrou ao que ficou" description="Lucro líquido real depois de todas as despesas do mês." />
              <div className="flex flex-col gap-2.5">
                {steps.map((s) => (
                  <div key={s.label} className={cx('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4', (s.kind === 'subtotal' || s.kind === 'result') && 'border-t border-border pt-2.5')}>
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
              {data.losses_total > 0 && (
                <div className="mt-4 rounded border border-border bg-danger-soft p-3 text-sm text-ink-2">
                  Perdas do mês (quebras e validades): <span className="num font-medium text-danger">−{money(data.losses_total)}</span>. Depois das perdas ficariam <span className="num font-medium text-ink">{money(data.net_profit - data.losses_total)}</span>.
                </div>
              )}
              {data.expenses?.by_category.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-1 text-sm font-medium text-ink">Despesas avulsas por categoria</p>
                  {data.expenses.by_category.map((c) => <KeyValue key={c.category} label={c.category} value={'−' + money(c.amount)} />)}
                </div>
              )}
              {data.deductions.total_rent === 0 && (
                <Alert tone="warning" className="mt-4">Não há renda registada. Se paga renda, registe-a em Definições → Custos e despesas para o lucro ser real.</Alert>
              )}
            </Card>
            <Card>
              <CardHeader title="Últimos 6 meses" description="Receita bruta" />
              <div className="h-56">
                {data.revenue_history.every((m) => m.revenue === 0) ? <NoData /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenue_history.map((m) => ({ ...m, label: MONTHS[Number(m.key.slice(5)) - 1].slice(0, 3) }))} margin={{ left: -12, right: 4, top: 4 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis tickFormatter={chartMoney} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--subtle)' }} formatter={(v) => [money(v), 'Receita']} contentStyle={tooltipStyle} />
                      <Bar isAnimationActive={false} dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card padded={false}>
              <div className="p-5 pb-0"><CardHeader title="Semanas do mês" description={data.best_week ? `Melhor: semana ${data.best_week.week}${data.worst_week ? ` · pior: semana ${data.worst_week.week}` : ''}` : undefined} /></div>
              <div className="px-5 pb-5">
                <Table
                  columns={[
                    { key: 'week', header: 'Semana', render: (w) => <span>{w.week} <span className="text-xs text-ink-muted">({w.from.slice(8)}–{w.to.slice(8)})</span> {data.best_week?.week === w.week && <Badge tone="positive">melhor</Badge>}{data.worst_week?.week === w.week && <Badge tone="warning">pior</Badge>}</span> },
                    { key: 'revenue', header: 'Receita', align: 'right', render: (w) => money(w.revenue) },
                    { key: 'result', header: 'Resultado', align: 'right', render: (w) => money(w.gross_profit - w.losses) },
                  ]}
                  rows={data.weeks}
                  rowKey="week"
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Metas dos últimos 12 meses" />
              {!goals.data ? <Skeleton className="h-32 w-full" /> : goals.data.filter((g) => g.target || g.achieved).length === 0 ? <p className="text-ink-muted">Ainda não há metas registadas.</p> : (
                <div className="flex flex-col gap-2.5">
                  {[...goals.data].reverse().filter((g) => g.target || g.achieved).slice(0, 8).map((g) => (
                    <div key={`${g.year}-${g.month}`}>
                      <div className="flex justify-between text-sm">
                        <span className={cx('text-ink-2', g.current && 'font-medium text-ink')}>{MONTHS[g.month - 1]} {g.year}{g.current ? ' (este mês)' : ''}</span>
                        <span className="num text-ink-2">{g.target ? `${String(g.pct).replace('.', ',')}% de ${money(g.target)}` : `${money(g.achieved)} · sem meta`}</span>
                      </div>
                      {g.target > 0 && <ProgressBar className="mt-1" value={g.pct} />}
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title="A crescer" description="Mais vendidos do que no mês anterior." />
              {data.trends.growing.length === 0 ? <p className="text-ink-muted">Nada a crescer.</p> : data.trends.growing.map((t) => <KeyValue key={t.product_id} label={t.name} value={`${int(t.previous_quantity)} → ${int(t.quantity)}${t.change_pct != null ? ` (+${Math.round(t.change_pct)}%)` : ''}`} tone="positive" />)}
            </Card>
            <Card>
              <CardHeader title="A cair" description="Menos vendidos do que no mês anterior." />
              {data.trends.declining.length === 0 ? <p className="text-ink-muted">Nada a cair.</p> : data.trends.declining.map((t) => <KeyValue key={t.product_id} label={t.name} value={`${int(t.previous_quantity)} → ${int(t.quantity)}${t.change_pct != null ? ` (${Math.round(t.change_pct)}%)` : ''}`} tone="danger" />)}
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Chenecas" description={`Novas ${money(data.debts.new_total)} · recebidas ${money(data.debts.received_total)} · em aberto ${money(data.debts.outstanding_total)}`} />
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="mb-1 text-sm font-medium text-ink-muted">Novas no mês</h3>
                  {data.debts.new.length === 0 ? <p className="text-sm text-ink-muted">Nenhuma.</p> : data.debts.new.map((d) => <KeyValue key={d.id} label={d.debtor} value={money(d.amount)} />)}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-ink-muted">Pagamentos recebidos</h3>
                  {data.debts.received.length === 0 ? <p className="text-sm text-ink-muted">Nenhum.</p> : data.debts.received.map((p) => <KeyValue key={p.id} label={`${p.debtor} · ${date(p.paid_at)}`} value={money(p.amount)} tone="positive" />)}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-ink-muted">Em aberto agora</h3>
                  {data.debts.outstanding.length === 0 ? <p className="text-sm text-ink-muted">Nada em dívida.</p> : data.debts.outstanding.map((d) => <KeyValue key={d.id} label={`${d.debtor}${d.overdue ? ' · vencida' : ''}`} value={money(d.remaining)} tone={d.overdue ? 'danger' : undefined} />)}
                </div>
              </div>
            </Card>
          </div>
          <Restock data={data.restock} title="O que comprar para o próximo mês" />
          <Breakdown r={data} />
          <Timeline from={first} to={last} />
        </>
      )}
    </>
  );
}
