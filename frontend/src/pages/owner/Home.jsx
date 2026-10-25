import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Target } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { useSession } from '../../utils/session';
import { money, pct, time, errorMessage, PAYMENT_LABEL, isMoneyHidden } from '../../utils/format';
import { locale } from '../../i18n/core';
import { useI18n } from '../../i18n/react';
import { Alert, Button, Card, CardHeader, CountUpInt, CountUpMoney, Dialog, EmptyState, MoneyInput, PageHeader, Skeleton, cx, useCountUp, useToast } from '../../components/ui';

// INICIO (Fase 13, pedido do fundador 25/10/2026): visao rapida e curta, sem
// repetir o que vive noutras paginas. So quatro coisas:
//   1. quanto temos hoje (comparado com ontem a mesma hora);
//   2. como vai a meta do mes;
//   3. quem esta a trabalhar agora (turno de cada caixista);
//   4. as ultimas vendas.
// Stock baixo, validades e chenecas estao no sino e nas suas paginas.
// Um so pedido: GET /api/owner/overview. Os numeros sobem ao aparecer (CountUp)
// e respeitam prefers-reduced-motion.
const REDUCED = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Cores do turno decididas pelo fundador: verde = abriu, cinzento = fechou,
// laranja = ainda nao abriu, vermelho so para problemas.
const SHIFT = {
  working: { dot: 'bg-positive', text: 'text-positive', label: 'A trabalhar' },
  closed: { dot: 'bg-ink-faint', text: 'text-ink-muted', label: 'Turno fechado' },
  not_started: { dot: 'bg-warning', text: 'text-warning', label: 'Ainda não abriu' },
  locked: { dot: 'bg-danger', text: 'text-danger', label: 'Bloqueado no fecho' },
  short: { dot: 'bg-danger', text: 'text-danger', label: 'Fechou com dinheiro a menos' },
};

function greeting(t) {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? t('Bom dia') : h >= 12 && h < 18 ? t('Boa tarde') : t('Boa noite');
}

export default function Home() {
  const toast = useToast();
  const { t } = useI18n();
  const { user } = useSession();
  const ov = useApi('/api/owner/overview');
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalValue, setGoalValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const o = ov.data;

  async function saveGoal() {
    setSaving(true);
    try {
      await api.post('/api/owner/goals', { target_amount: goalValue });
      toast(t('Meta do mês guardada.'));
      setGoalOpen(false);
      ov.reload();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setSaving(false); }
  }
  const openGoal = () => { setGoalValue(o?.month?.target || 0); setGoalOpen(true); };
  const first = (user?.name || '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={first ? t('{greeting}, {name}', { greeting: greeting(t), name: first }) : t('Início')}
        description={new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}
      />
      {ov.error && <Alert tone="danger" className="mb-4">{ov.error}</Alert>}
      {!o ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 lg:col-span-2" />
          <Skeleton className="h-56" />
          <Skeleton className="h-48 lg:col-span-3" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TodayCard today={o.today} />
            <GoalCard month={o.month} onEdit={openGoal} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CashiersCard cashiers={o.cashiers} />
            <RecentSalesCard sales={o.recent_sales} />
          </div>
        </>
      )}

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

// 1. Hoje: cartao verde da marca, numero grande, comparacao e grafico por hora.
function TodayCard({ today }) {
  const { t } = useI18n();
  const delta = today.change_pct;
  const up = delta !== null && delta >= 0;
  return (
    <section className="reveal relative overflow-hidden rounded-lg bg-accent p-5 text-white sm:p-6 lg:col-span-2" aria-label={t('Hoje até agora')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#CFE3DB]">{t('Hoje até agora')}</p>
          <p className="mt-1 text-[34px] font-semibold leading-[40px] tracking-tight sm:text-[40px] sm:leading-[48px]">
            <CountUpMoney cents={today.revenue} />
          </p>
        </div>
        <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium', delta === null ? 'bg-[#0F5A46] text-[#CFE3DB]' : up ? 'bg-[#E7F5EE] text-positive' : 'bg-[#FBEAEA] text-danger')}>
          {delta === null ? t('Ontem a esta hora: sem vendas') : (
            <>
              {up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              <span className="num">{pct(Math.abs(delta), 1)}</span> {t('vs ontem à mesma hora')}
            </>
          )}
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[#2B6A57] pt-4">
        <div><dt className="text-xs text-[#CFE3DB]">{t('Vendas')}</dt><dd className="mt-0.5 text-lg font-semibold"><CountUpInt value={today.sales_count} /></dd></div>
        <div><dt className="text-xs text-[#CFE3DB]">{t('Ticket médio')}</dt><dd className="mt-0.5 text-lg font-semibold"><CountUpMoney cents={today.average_ticket} /></dd></div>
        <div><dt className="text-xs text-[#CFE3DB]">{t('Lucro bruto')}</dt><dd className="mt-0.5 text-lg font-semibold"><CountUpMoney cents={today.gross_profit} /></dd></div>
      </dl>
      {today.sales_count > 0 && (
        <div className="-mx-2 mt-3 h-20" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={today.by_hour} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="hojeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" hide />
              <Tooltip
                cursor={{ stroke: '#CFE3DB', strokeDasharray: '3 3' }}
                formatter={(v) => [money(v), t('Receita')]}
                labelFormatter={(h) => t('{h}h', { h })}
                contentStyle={{ border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#FFFFFF" strokeWidth={2} fill="url(#hojeFill)" isAnimationActive={!REDUCED} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// Barra que cresce de 0 ate ao valor quando aparece.
function GrowBar({ value }) {
  const [w, setW] = useState(REDUCED ? value : 0);
  useEffect(() => { const id = requestAnimationFrame(() => setW(value)); return () => cancelAnimationFrame(id); }, [value]);
  const tone = value >= 100 ? 'bg-positive' : 'bg-accent';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted-bg" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full', tone)} style={{ width: Math.min(w, 100) + '%', transition: REDUCED ? 'none' : 'width 900ms cubic-bezier(0.2, 0, 0, 1)' }} />
    </div>
  );
}

// 2. Meta do mes.
function GoalCard({ month, onEdit }) {
  const { t } = useI18n();
  const shownPct = useCountUp(Math.round(month.pct));
  const monthName = new Date().toLocaleDateString(locale(), { month: 'long' });
  return (
    <Card className="reveal" style={{ animationDelay: '60ms' }}>
      <CardHeader
        title={t('Meta de {month}', { month: monthName })}
        action={<Button size="sm" variant="ghost" onClick={onEdit}>{month.has_goal ? t('Alterar') : t('Definir')}</Button>}
      />
      {!month.has_goal ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-base text-ink-muted">{t('Já vendeu {v} este mês. Defina quanto quer vender para ver o progresso e quando lá chega.', { v: money(month.revenue) })}</p>
          <Button variant="primary" icon={Target} onClick={onEdit}>{t('Definir a meta')}</Button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="num text-2xl font-semibold tracking-tight text-ink">{shownPct}%</p>
            <p className="num text-right text-sm text-ink-muted">{money(month.revenue)} {t('de')} {money(month.target)}</p>
          </div>
          <GrowBar value={month.pct} />
          <p className="mt-3 text-sm text-ink-2">
            {month.pct >= 100 ? t('Meta atingida. Já vai {v} acima.', { v: money(month.revenue - month.target) })
              : month.reach_day ? t('Faltam {v}. Ao ritmo actual chega lá no dia {d}.', { v: money(month.remaining), d: month.reach_day })
                : t('Faltam {v}. Ao ritmo actual termina o mês com {p}.', { v: money(month.remaining), p: money(month.projected) })}
          </p>
          {month.by_day.length > 1 && (
            <div className="-mx-1 mt-3 h-16" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={month.by_day} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <XAxis dataKey="day" hide />
                  <ReferenceLine y={month.target} stroke="var(--border-strong)" strokeDasharray="4 4" ifOverflow="extendDomain" />
                  <Tooltip formatter={(v) => [money(v), t('Acumulado')]} labelFormatter={(d) => t('Dia {d}', { d })} contentStyle={{ border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Area type="monotone" dataKey="accumulated" stroke="var(--accent)" strokeWidth={2} fill="var(--accent-soft)" isAnimationActive={!REDUCED} animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// 3. Caixistas: quem esta a trabalhar agora.
function CashiersCard({ cashiers }) {
  const { t } = useI18n();
  const working = cashiers.filter((c) => c.state === 'working').length;
  return (
    <Card className="reveal" style={{ animationDelay: '120ms' }}>
      <CardHeader
        title={t('Caixistas agora')}
        description={cashiers.length ? t('{n} de {total} a trabalhar', { n: working, total: cashiers.length }) : undefined}
        action={<Link to="/app/equipa" className="text-sm text-accent">{t('Equipa')}</Link>}
      />
      {cashiers.length === 0 ? (
        <EmptyState title={t('Ainda sem caixistas')} description={t('Crie os caixistas e os PINs em Equipa.')} />
      ) : (
        <ul className="divide-y divide-border">
          {cashiers.map((c) => {
            const s = SHIFT[c.state] || SHIFT.not_started;
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5" data-shift={c.state}>
                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', s.dot)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-ink">{c.name}</p>
                  <p className={cx('text-xs', s.text)}>
                    {t(s.label)}
                    {c.state === 'working' && c.since ? ' · ' + t('desde as {h}', { h: time(c.since) }) : ''}
                    {c.state === 'short' && c.last_closing_difference !== null ? ' · ' + money(c.last_closing_difference) : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-base font-medium text-ink">{money(c.today_revenue)}</p>
                  <p className="num text-xs text-ink-muted">{t('{n} venda(s)', { n: c.today_sales })}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// 4. Ultimas vendas.
function RecentSalesCard({ sales }) {
  const { t } = useI18n();
  return (
    <Card className="reveal" style={{ animationDelay: '180ms' }}>
      <CardHeader title={t('Últimas vendas')} action={<Link to="/app/vendas" className="text-sm text-accent">{t('Ver todas')}</Link>} />
      {sales.length === 0 ? (
        <EmptyState title={t('Ainda sem vendas')} description={t('As vendas do terminal aparecem aqui.')} />
      ) : (
        <ul className="divide-y divide-border">
          {sales.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-base text-ink">
                  {s.daily_number ? <span className="num text-ink-muted">#{s.daily_number} · </span> : null}{s.cashier || '—'}
                </p>
                <p className="text-xs text-ink-muted">{time(s.created_at)} · {t(PAYMENT_LABEL[s.payment_method] || s.payment_method)}{s.status === 'cancelled' ? ' · ' + t('Cancelada') : ''}</p>
              </div>
              <span className={s.status === 'cancelled' ? 'num text-base text-ink-faint line-through' : 'num text-base font-medium text-ink'}>{money(s.total_amount)}</span>
            </li>
          ))}
        </ul>
      )}
      {isMoneyHidden() && <p className="mt-3 text-xs text-ink-muted">{t('Modo privado: os valores estão escondidos. Toque no olho, em cima, para os ver.')}</p>}
    </Card>
  );
}
