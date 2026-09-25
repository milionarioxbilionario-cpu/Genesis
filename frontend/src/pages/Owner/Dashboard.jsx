import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertTriangle, BarChart3, Boxes, CheckCircle2, CreditCard, Package,
  RefreshCw, Send, TrendingUp, Wallet,
} from 'lucide-react';
import api from '../../utils/api';
import {
  Card, CardHead, StatCard, Button, Badge, PageHead, Alert,
  GoalBar, Table, EmptyState, Skeleton, useToast, GlowCard,
} from '../../components/ui';

/* ==========================================================================
   VISAO GERAL — so KPIs, graficos e alertas.
   A gestao de produtos/stock/fornecedores vive nas paginas proprias
   (Products.jsx, Stock.jsx, Suppliers.jsx). Este ecra era um monolito de
   696 linhas com tudo misturado — foi dividido no Lote D2.
   ========================================================================== */
const MZN = (cents) => `MZN ${(Number(cents || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MZNk = (cents) => {
  const v = Number(cents || 0) / 100;
  if (Math.abs(v) >= 1000000) return `MZN ${(v / 1000000).toFixed(2)}M`;
  if (Math.abs(v) >= 1000) return `MZN ${(v / 1000).toFixed(1)}k`;
  return `MZN ${v.toFixed(2)}`;
};

const PAYMENT_LABEL = { cash: 'Dinheiro', card: 'Cartao', mobile_money: 'M-Pesa', mpesa: 'M-Pesa', emola: 'E-Mola', pos_bank: 'POS' };
// Paleta da grafica: sao os mesmos tokens usados na interface.
const PIE_COLORS = ['var(--brand)', 'var(--ok)', 'var(--info)', 'var(--warn)', 'var(--goal)'];

// 3 niveis de stock definidos no plano do produto.
function stockLevel(qty) {
  const q = Number(qty || 0);
  if (q <= 10) return { tone: 'danger', label: 'CRITICO' };
  if (q <= 20) return { tone: 'warn', label: 'SEVERO' };
  return { tone: 'ok', label: 'NORMAL' };
}

export default function OwnerDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState(null);
  const [goal, setGoal] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [sales, setSales] = useState([]);
  const [sending, setSending] = useState(false);

  async function loadAll(silent = false) {
    if (!silent) setLoading(true);
    const safe = (p) => p.then((r) => r.data).catch(() => null);
    const [s, r, g, a, sl] = await Promise.all([
      safe(api.get('/api/dashboard/summary')),
      safe(api.get('/api/dashboard/reports')),
      safe(api.get('/api/owner/goals/current')),
      safe(api.get('/api/owner/alerts')),
      safe(api.get('/api/sales')),
    ]);
    setSummary(s);
    setReports(r);
    setGoal(g);
    setAlerts(a);
    setSales(Array.isArray(sl) ? sl : []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function sendAlerts() {
    setSending(true);
    try {
      const res = await api.post('/api/owner/alerts/send');
      toast.push(res.data?.message || 'Alertas enviados.', 'ok');
    } catch (e) {
      toast.push(e?.response?.data?.error || 'Nao foi possivel enviar os alertas.', 'err');
    } finally { setSending(false); }
  }

  const paymentMix = useMemo(() => {
    const map = new Map();
    for (const s of sales) {
      if (s.status && s.status !== 'completed') continue;
      const k = PAYMENT_LABEL[s.payment_method] || s.payment_method || 'Outro';
      map.set(k, (map.get(k) || 0) + Number(s.total_amount || 0));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const lowStock = alerts?.lowStockProducts?.length ? alerts.lowStockProducts : (summary?.lowStockProducts || []);
  const goalPct = goal?.target ? (Number(goal.current || 0) / Number(goal.target)) * 100 : 0;
  const bestDay = (reports?.salesByDay || []).reduce((best, d) => (Number(d.revenue || 0) > Number(best?.revenue || -1) ? d : best), null);

  const todayLabel = new Date().toLocaleDateString('pt-MZ', { weekday: 'long', day: '2-digit', month: 'long' });

  if (loading) {
    return (
      <div className="g-page">
        <Skeleton height={34} width="38%" />
        <div style={{ height: 24 }} />
        <div className="g-kpis">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={104} />)}
        </div>
        <div style={{ height: 24 }} />
        <div className="g-cols-2">
          <Skeleton height={260} />
          <Skeleton height={260} />
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    background: 'var(--bg-elev2)', border: '1px solid var(--border-strong)',
    borderRadius: 12, color: 'var(--text)', fontSize: 12,
  };
  const axisTick = { fill: 'var(--text-dim)', fontSize: 11 };
  // Tokens resolvidos pelo browser: o recharts aceita string de cor em SVG.
  const CHART = {
    brand: 'var(--brand)',
    info: 'var(--info)',
    grid: 'var(--border)',
    cursor: 'var(--surface-hover)',
  };

  return (
    <div className="g-page">
      <PageHead
        title="Visao Geral"
        sub={`Resumo de ${todayLabel}`}
        actions={(
          <>
            <Button variant="ghost" icon={<RefreshCw size={16} aria-hidden="true" />} onClick={() => loadAll(true)}>Atualizar</Button>
            <Link to="/owner/reports"><Button variant="ghost" icon={<BarChart3 size={16} aria-hidden="true" />}>Relatorios</Button></Link>
            <Button variant="primary" icon={<Send size={16} aria-hidden="true" />} onClick={sendAlerts} disabled={sending || !alerts?.totalAlerts}>
              {sending ? 'A enviar...' : 'Enviar alertas'}
            </Button>
          </>
        )}
      />

      {alerts?.totalAlerts > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Alert tone={lowStock.some((p) => Number(p.stock_qty || 0) <= 10) ? 'danger' : 'warn'} icon={<AlertTriangle size={17} aria-hidden="true" />}>
            <strong>{alerts.totalAlerts} alerta(s)</strong> a precisar de atencao
            {alerts.lowStockProducts?.length ? ` · ${alerts.lowStockProducts.length} produto(s) com stock baixo` : ''}
            {alerts.expiredProducts?.length ? ` · ${alerts.expiredProducts.length} produto(s) vencido(s)` : ''}
          </Alert>
        </div>
      )}

      <div className="g-section-title">Dinheiro</div>
      <div className="g-kpis">
        <StatCard label="Receita hoje" value={MZN(summary?.revenueToday)} icon={<Wallet size={19} aria-hidden="true" />} tone="ok" hint={`${summary?.salesToday || 0} venda(s)`} />
        <StatCard label="Receita do mes" value={MZN(summary?.revenueMonth)} icon={<TrendingUp size={19} aria-hidden="true" />} tone="ok" hint={`${summary?.salesMonth || 0} venda(s)`} />
        <StatCard label="Ultimos 7 dias" value={MZN(reports?.totalRevenue)} icon={<BarChart3 size={19} aria-hidden="true" />} hint={`${reports?.totalOrders || 0} encomenda(s)`} />
        <StatCard label="Ticket medio" value={MZN(reports?.averageTicket)} icon={<CreditCard size={19} aria-hidden="true" />} hint="Media por venda (7 dias)" />
      </div>

      <div style={{ height: 24 }} />

      <div className="g-cols-2">
        <Card>
          <CardHead title="Meta do mes" hint={`Objectivo: ${MZN(goal?.target)}`} />
          <GoalBar pct={goalPct} label="Progresso" caption={`${MZN(goal?.current)} de ${MZN(goal?.target)}`} />
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/owner/goals"><Button variant="ghost" small>Definir meta</Button></Link>
          </div>
        </Card>

        <Card>
          <CardHead title="Leitura rapida" hint="O que precisa de decisao hoje" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Produtos com stock baixo</span>
              <Badge tone={lowStock.length === 0 ? 'ok' : 'warn'}>{lowStock.length}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Produtos vencidos</span>
              <Badge tone={alerts?.expiredProducts?.length ? 'danger' : 'ok'}>{alerts?.expiredProducts?.length || 0}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Melhor dia (7 dias)</span>
              <span className="g-num" style={{ color: 'var(--ok)' }}>{bestDay ? `${bestDay.label} · ${MZNk(bestDay.revenue)}` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Valor imobilizado em stock</span>
              <span className="g-num" style={{ color: 'var(--text)' }}>{MZN(summary?.stockValue)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="g-section-title">Stock</div>
      <div className="g-kpis">
        <StatCard label="Produtos activos" value={summary?.productsCount || 0} icon={<Package size={19} aria-hidden="true" />} />
        <StatCard label="Unidades em stock" value={summary?.stockTotal || 0} icon={<Boxes size={19} aria-hidden="true" />} />
        <StatCard label="Valor em stock" value={MZN(summary?.stockValue)} icon={<Wallet size={19} aria-hidden="true" />} hint="Ao preco de custo" />
        <StatCard label="Baixo stock" value={summary?.lowStockCount || 0} icon={<AlertTriangle size={19} aria-hidden="true" />} tone={lowStock.length ? 'warn' : 'ok'} hint="No minimo configurado" />
      </div>

      <div className="g-section-title">Graficos</div>
      <div className="g-cols-2">
        <GlowCard className="g-scanline">
          <CardHead title="Receita dos ultimos 7 dias" hint="Valores em MZN" />
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reports?.salesByDay || []}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={CHART.brand} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => MZNk(v)} width={78} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => MZN(v)} />
                <Area type="monotone" dataKey="revenue" stroke={CHART.brand} strokeWidth={2.5} fill="url(#gRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <CardHead title="Produtos mais vendidos" hint="Quantidade (7 dias)" />
          {reports?.topProducts?.length ? (
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports.topProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={132} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: CHART.cursor }} />
                  <Bar dataKey="qty" fill={CHART.info} radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<BarChart3 size={26} aria-hidden="true" />} title="Sem vendas nos ultimos 7 dias" hint="Os produtos mais vendidos aparecem aqui." />
          )}
        </GlowCard>
      </div>

      <div style={{ height: 24 }} />

      <div className="g-cols-2">
        <Card>
          <CardHead title="Formas de pagamento" hint="Peso nas ultimas 20 vendas" />
          {paymentMix.length ? (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ height: 190, width: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} stroke="none">
                      {paymentMix.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => MZN(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 150 }}>
                {paymentMix.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ color: 'var(--text-muted)', flex: 1, fontSize: '0.86rem' }}>{p.name}</span>
                    <span className="g-num" style={{ color: 'var(--text)' }}>{MZNk(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={<CreditCard size={26} aria-hidden="true" />} title="Sem pagamentos registados" />
          )}
        </Card>

        <Card>
          <CardHead title="Stock a repor" hint="Niveis: normal > 20 · severo <= 20 · critico <= 10"
            action={<Link to="/owner/stock"><Button variant="ghost" small>Ver stock</Button></Link>} />
          {lowStock.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {lowStock.slice(0, 8).map((p) => {
                const lvl = stockLevel(p.stock_qty);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem' }}>minimo {p.min_stock ?? 0} · actual {p.stock_qty ?? 0}</div>
                    </div>
                    <Badge tone={lvl.tone}>{lvl.label}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<CheckCircle2 size={26} aria-hidden="true" />} title="Stock em ordem" hint="Nenhum produto abaixo do minimo." />
          )}
        </Card>
      </div>

      <div className="g-section-title">Actividade recente</div>
      <Card tight>
        <Table
          rowKey={(r) => r.id}
          rows={summary?.recentSales || []}
          empty={<EmptyState icon={<CreditCard size={26} aria-hidden="true" />} title="Ainda sem vendas" hint="As ultimas vendas aparecem aqui." />}
          columns={[
            { key: 'created_at', label: 'Data', render: (r) => new Date(r.created_at).toLocaleString('pt-MZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) },
            { key: 'payment_method', label: 'Pagamento', render: (r) => PAYMENT_LABEL[r.payment_method] || r.payment_method },
            { key: 'itemCount', label: 'Itens', numeric: true },
            { key: 'total_amount', label: 'Total', align: 'right', numeric: true, render: (r) => MZN(r.total_amount) },
          ]}
        />
      </Card>

      <div style={{ height: 28 }} />
    </div>
  );
}
