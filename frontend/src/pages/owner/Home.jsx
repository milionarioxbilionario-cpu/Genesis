import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, int, pct, time, date, errorMessage, PAYMENT_LABEL } from '../../utils/format';
import { locale } from '../../i18n/core';
import { useI18n } from '../../i18n/react';
import { Alert, Badge, Button, Card, CardHeader, Dialog, EmptyState, MoneyInput, PageHeader, ProgressBar, Skeleton, Stat, useToast } from '../../components/ui';

const chartMoney = (v) => (v / 100).toLocaleString(locale(), { maximumFractionDigits: 0 });

export default function Home() {
  const toast = useToast();
  const { t } = useI18n();
  const day = useApi('/api/owner/reports/daily');
  const summary = useApi('/api/dashboard/summary');
  const week = useApi('/api/dashboard/reports');
  const goal = useApi('/api/owner/goals/current');
  const goalHistory = useApi('/api/owner/goals/history');
  const lastMonth = goalHistory.data ? goalHistory.data[goalHistory.data.length - 2] : null;
  const alerts = useApi('/api/owner/alerts');
  const debts = useApi('/api/owner/debts');
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalValue, setGoalValue] = useState(0);
  const [saving, setSaving] = useState(false);

  const d = day.data;
  const g = goal.data;
  const dueSoon = (debts.data || []).filter((x) => x.status !== 'paid' && (x.status === 'overdue' || new Date(x.due_date) - Date.now() < 7 * 86400000));
  const lotWhen = (l) => (l.days_left < 0 ? t('expiradas') : l.days_left === 0 ? t('expiram hoje') : t('em {n} dia(s)', { n: l.days_left }));

  async function saveGoal() {
    setSaving(true);
    try {
      await api.post('/api/owner/goals', { target_amount: goalValue });
      toast(t('Meta do mês guardada.'));
      setGoalOpen(false);
      goal.reload();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title={t('Início')} description={new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })} />

      {alerts.data?.expiringLots?.length > 0 && (
        <Alert tone="warning" className="mb-4" title={t('{n} lote(s) perto da validade', { n: alerts.data.expiringLots.length })}>
          {alerts.data.expiringLots.slice(0, 4).map((l) => `${l.name}: ${l.quantity} ${t('un.')} ${lotWhen(l)}`).join(' · ')}
          {' '}<Link to="/app/produtos?tab=stock" className="font-medium text-accent">{t('Ver validades')}</Link>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {d ? (
          <>
            <Stat label={t('Receita de hoje')} value={money(d.gross_revenue)} hint={t('{n} venda(s)', { n: int(d.sales_count) })} />
            <Stat label={t('Lucro bruto de hoje')} value={money(d.gross_profit)} hint={t('Receita − custo dos produtos')} tone={d.gross_profit < 0 ? 'danger' : undefined} />
            <Stat label={t('Ticket médio')} value={money(d.average_ticket)} hint={t('Por venda, hoje')} />
            <Stat label={t('Receita do mês')} value={summary.data ? money(summary.data.revenueMonth) : '—'} hint={summary.data ? t('{n} venda(s)', { n: int(summary.data.salesMonth) }) : ''} />
          </>
        ) : Array.from({ length: 4 }).map((_, i) => <Card key={i}><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-6 w-32" /></Card>)}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('Últimos 7 dias')} description={t('Receita por dia')} />
          <div className="h-56">
            {week.data && week.data.totalRevenue === 0 ? (
              <div className="flex h-full items-center justify-center text-base text-ink-muted">{t('Sem vendas nos últimos 7 dias.')}</div>
            ) : week.data ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week.data.salesByDay} margin={{ left: -12, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tickFormatter={chartMoney} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip cursor={{ fill: 'var(--subtle)' }} formatter={(v) => [money(v), t('Receita')]} contentStyle={{ border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Bar isAnimationActive={false} dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full w-full" />}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t('Meta do mês')}
            action={<Button size="sm" variant="ghost" onClick={() => { setGoalValue(g?.target || 0); setGoalOpen(true); }}>{g?.has_goal ? t('Alterar') : t('Definir')}</Button>}
          />
          {!g ? <Skeleton className="h-16 w-full" /> : !g.has_goal ? (
            <p className="text-base text-ink-muted">{t('Defina quanto quer vender este mês para acompanhar o progresso.')}</p>
          ) : (
            <>
              <p className="num text-xl font-semibold text-ink">{money(g.current)}</p>
              <p className="num text-sm text-ink-muted">{t('de {total} · {pct}', { total: money(g.target), pct: pct(g.pct) })}</p>
              <ProgressBar className="mt-3" value={g.pct} />
              <p className="mt-3 text-sm text-ink-2">
                {g.pct >= 100 ? t('Meta atingida. Bónus: {v} acima.', { v: money(g.current - g.target) })
                  : g.reach_day ? t('Ao ritmo actual, atinge a meta no dia {d}.', { d: g.reach_day })
                    : t('Ao ritmo actual, termina o mês com {v}.', { v: money(g.projected) })}
              </p>
            </>
          )}
          {lastMonth && (lastMonth.target > 0 || lastMonth.achieved > 0) && (
            <p className="mt-3 border-t border-border pt-3 text-sm text-ink-muted">
              {t('Mês passado:')} {lastMonth.target > 0
                ? <><span className="num font-medium text-ink-2">{pct(lastMonth.pct)}</span> {t('da meta ({a} de {b})', { a: money(lastMonth.achieved), b: money(lastMonth.target) })}</>
                : <>{t('{v} vendidos, sem meta', { v: money(lastMonth.achieved) })}</>}.{' '}
              <Link to="/app/relatorios?tab=monthly" className="text-accent">{t('Histórico')}</Link>
            </p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title={t('Stock baixo')} action={<Link to="/app/produtos?tab=stock" className="text-sm text-accent">{t('Ver stock')}</Link>} />
          {!alerts.data ? <Skeleton className="h-20 w-full" /> : alerts.data.lowStockProducts.length === 0 ? (
            <p className="text-base text-ink-muted">{t('Todos os produtos acima do mínimo.')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.data.lowStockProducts.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span className="truncate text-base text-ink">{p.name}</span>
                  <Badge tone={p.level === 'critical' ? 'danger' : p.level === 'severe' ? 'warning' : 'neutral'}>{p.stock_qty} {t('un.')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t('Chenecas a cobrar')} action={<Link to="/app/chenecas" className="text-sm text-accent">{t('Ver todas')}</Link>} />
          {!debts.data ? <Skeleton className="h-20 w-full" /> : dueSoon.length === 0 ? (
            <p className="text-base text-ink-muted">{t('Nada vencido nem a vencer esta semana.')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {dueSoon.slice(0, 6).map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-base text-ink">{x.debtor_name}</p>
                    <p className={x.status === 'overdue' ? 'text-xs text-danger' : 'text-xs text-ink-muted'}>{x.status === 'overdue' ? t('Vencida') : t('Vence')} {date(x.due_date)}</p>
                  </div>
                  <span className="num text-base font-medium text-ink">{money(x.remaining)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t('Últimas vendas')} action={<Link to="/app/vendas" className="text-sm text-accent">{t('Histórico')}</Link>} />
          {!summary.data ? <Skeleton className="h-20 w-full" /> : summary.data.recentSales.length === 0 ? (
            <EmptyState title={t('Ainda sem vendas')} description={t('As vendas do terminal aparecem aqui.')} />
          ) : (
            <ul className="divide-y divide-border">
              {summary.data.recentSales.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-ink-muted">{time(s.created_at)} · {PAYMENT_LABEL[s.payment_method] || s.payment_method}</span>
                  <span className={s.status === 'cancelled' ? 'num text-base text-ink-faint line-through' : 'num text-base font-medium text-ink'}>{money(s.total_amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(day.error || summary.error) && <Alert tone="danger" className="mt-4">{day.error || summary.error}</Alert>}

      <Dialog
        open={goalOpen}
        size="sm"
        title={t('Meta de vendas do mês')}
        onClose={() => setGoalOpen(false)}
        footer={<><Button onClick={() => setGoalOpen(false)}>{t('Cancelar')}</Button><Button variant="primary" loading={saving} disabled={goalValue <= 0} onClick={saveGoal}>{t('Guardar')}</Button></>}
      >
        <MoneyInput label={t('Receita que quer atingir')} valueCents={goalValue} onChangeCents={setGoalValue} autoFocus />
      </Dialog>
    </>
  );
}
