import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useApi from '../../utils/useApi';
import { money, int, isoDay, dateTime, PAYMENT_LABEL } from '../../utils/format';
import { Alert, Badge, Button, Card, CardHeader, Input, KeyValue, PageHeader, Select, Skeleton, Stat, Table, Tabs, Toolbar, cx } from '../../components/ui';

// Grafico sem dados: mensagem em vez de um eixo "0, 0, 0".
const NoData = () => <div className="flex h-full items-center justify-center text-base text-ink-muted">Sem vendas neste período.</div>;

const chartMoney = (v) => (v / 100).toLocaleString('pt-PT', { maximumFractionDigits: 0 });
const tooltipStyle = { border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 };
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Reports() {
  const [tab, setTab] = useState('daily');
  return (
    <>
      <PageHeader title="Relatórios" actions={<Button className="no-print" icon={Printer} onClick={() => window.print()}>Imprimir / PDF</Button>} />
      <Tabs className="no-print mb-5" value={tab} onChange={setTab} items={[{ value: 'daily', label: 'Diário' }, { value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensal' }]} />
      {tab === 'daily' && <Daily />}
      {tab === 'weekly' && <Weekly />}
      {tab === 'monthly' && <Monthly />}
    </>
  );
}

function Kpis({ r, extra }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Receita" value={money(r.gross_revenue)} hint={`${int(r.sales_count)} venda(s)`} />
      <Stat label="Custo dos produtos" value={money(r.cost_of_goods)} />
      <Stat label="Lucro bruto" value={money(r.gross_profit)} tone={r.gross_profit < 0 ? 'danger' : undefined} hint={r.gross_revenue ? `${Math.round((r.gross_profit / r.gross_revenue) * 100)}% da receita` : ''} />
      {extra || <Stat label="Ticket médio" value={money(r.average_ticket)} />}
    </div>
  );
}

function Breakdown({ r }) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Por forma de pagamento" />
        {Object.entries(r.by_payment).map(([k, v]) => <KeyValue key={k} label={PAYMENT_LABEL[k] || k} value={money(v)} />)}
        {r.discounts_total > 0 && <KeyValue label="Descontos concedidos" value={'−' + money(r.discounts_total)} tone="danger" />}
      </Card>
      <Card>
        <CardHeader title="Por caixista" />
        {r.by_cashier.length === 0 ? <p className="text-ink-muted">Sem vendas.</p> : r.by_cashier.map((c) => <KeyValue key={c.cashier_id} label={`${c.name} · ${c.sales} venda(s)`} value={money(c.revenue)} />)}
      </Card>
      <Card padded={false} className="lg:col-span-2">
        <div className="p-5 pb-0"><CardHeader title="Produtos mais vendidos" description={r.most_profitable ? `Mais rentável: ${r.most_profitable.name} (${money(r.most_profitable.profit)} de lucro)` : undefined} /></div>
        <div className="px-5 pb-5">
          <Table
            columns={[
              { key: 'name', header: 'Produto' },
              { key: 'quantity', header: 'Quantidade', align: 'right' },
              { key: 'revenue', header: 'Receita', align: 'right', render: (p) => money(p.revenue) },
              { key: 'profit', header: 'Lucro', align: 'right', render: (p) => money(p.profit) },
            ]}
            rows={r.top_products}
            rowKey="product_id"
            empty={<p className="py-6 text-center text-ink-muted">Sem vendas.</p>}
          />
        </div>
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

function Daily() {
  const [day, setDay] = useState(isoDay());
  const { data, loading, error } = useApi('/api/owner/reports/daily?date=' + day);
  return (
    <>
      <Toolbar className="no-print"><Input type="date" aria-label="Dia" value={day} max={isoDay()} onChange={(e) => setDay(e.target.value)} className="w-44" /></Toolbar>
      <h2 className="mb-3 hidden text-lg font-semibold print:block">Relatório diário — {day}</h2>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-40 w-full" /> : <><Kpis r={data} /><Breakdown r={data} /></>}
    </>
  );
}

function Weekly() {
  const [end, setEnd] = useState(isoDay());
  const start = isoDay(new Date(new Date(end).getTime() - 6 * 86400000));
  const { data, loading, error } = useApi(`/api/owner/reports/weekly?start=${start}&end=${end}`);
  return (
    <>
      <Toolbar className="no-print">
        <span className="text-sm text-ink-muted">Semana a terminar em</span>
        <Input type="date" aria-label="Fim da semana" value={end} max={isoDay()} onChange={(e) => setEnd(e.target.value)} className="w-44" />
      </Toolbar>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-40 w-full" /> : (
        <>
          <Kpis r={data} />
          <Card className="mt-4">
            <CardHeader title="Receita por dia" description={`${data.start} a ${data.end}`} />
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
          <Breakdown r={data} />
        </>
      )}
    </>
  );
}

// O DIFERENCIADOR: lucro liquido real depois de todas as deducoes.
function Monthly() {
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data, loading, error } = useApi(`/api/owner/reports/monthly?year=${period.year}&month=${period.month}`);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return { year: d.getFullYear(), month: d.getMonth() + 1 }; }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = data ? [
    { label: 'Receita bruta', value: data.gross_revenue, kind: 'base' },
    { label: 'Custo dos produtos vendidos', value: -data.cost_of_goods },
    { label: 'Lucro bruto', value: data.gross_profit, kind: 'subtotal' },
    { label: 'Salários', value: -data.deductions.total_salaries },
    { label: 'Renda', value: -data.deductions.total_rent },
    { label: 'Outros custos fixos', value: -data.deductions.total_other_fixed },
    { label: 'Entregas de fornecedores', value: -data.deductions.total_supplier_delivery },
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
      <h2 className="mb-3 hidden text-lg font-semibold print:block">Relatório mensal — {MONTHS[period.month - 1]} {period.year}</h2>
      {error && <Alert tone="danger">{error}</Alert>}
      {loading || !data ? <Skeleton className="h-60 w-full" /> : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
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
              {data.deductions.total_rent === 0 && (
                <Alert tone="warning" className="mt-4">Não há renda registada. Se paga renda, registe-a em Definições → Custos fixos para o lucro ser real.</Alert>
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
          <Breakdown r={data} />
        </>
      )}
    </>
  );
}
