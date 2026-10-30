import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BellRing, BookOpen, ChevronsLeft, ChevronsRight, Inbox, LayoutDashboard, Lightbulb, LogOut, PackageSearch, ScrollText, Store } from 'lucide-react';
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmProvider, Dialog, Drawer, Input, KeyValue, LanguageSwitch, MoneyInput, PageHeader,
  IconButton, PRODUCT_ICONS, ProductImage, Segmented, Select, Spinner, Stat, Table, Textarea, ToastProvider, Toolbar, useConfirm, useToast, cx,
  BrandMark,
} from '@ui';
import { I18nProvider, useI18n } from '@i18n/react.jsx';
import { getLang, setLang } from '@i18n/core.js';
import { money, date, dateTime, errorMessage } from '../../frontend/src/utils/format.js';
import './i18n_en.js';
import { shareOrDownloadCard, whatsappLink } from './accountCard.js';

// PAINEL DO SUPER ADMIN (Genesis 2.0) — build separada do produto. Mesmo
// design system. Fala com /api/admin/* (protegido por origem + sessao +
// papel super_admin). O "entrar como dono" passou a MODO SUPORTE so leitura.
// Fase 9.7: PT/EN como no produto (a escolha fica na conta do super admin);
// formatos e erros pelos utilitarios partilhados (frontend/src/utils/format.js).
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/', withCredentials: true });
api.interceptors.request.use((cfg) => { cfg.headers = cfg.headers || {}; cfg.headers['X-Genesis-Lang'] = getLang(); return cfg; });
const saveLanguage = (language) => api.put('/api/auth/language', { language }).catch(() => {});

// label = chave em portugues; o ecra mostra t(label).
const STATUS = {
  pending: { label: 'Pendente', tone: 'info' },
  trial: { label: 'Em teste', tone: 'warning' },
  active: { label: 'Activa', tone: 'positive' },
  suspended: { label: 'Suspensa', tone: 'danger' },
  blocked: { label: 'Bloqueada', tone: 'danger' },
  rejected: { label: 'Rejeitada', tone: 'neutral' },
  deleted: { label: 'Eliminada', tone: 'neutral' },
};
const TYPES = { bottle_store: 'Bottle store', loja_bebidas: 'Loja de bebidas', mercearia: 'Mercearia', supermercado: 'Supermercado', padaria: 'Padaria', pastelaria: 'Pastelaria', cafetaria: 'Cafetaria', talho: 'Talho', restaurante: 'Restaurante', churrascaria: 'Churrascaria', fast_food: 'Fast food', boutique: 'Boutique', salao: 'Salão e barbearia', farmacia: 'Farmácia', clinica: 'Clínica', posto_combustivel: 'Posto de combustível', nhonguista: 'Vendedor por conta própria', importador: 'Importador', hotelaria: 'Hotel e alojamento', arrendamento: 'Arrendamento', outro: 'Outro' };

function useLoad(url) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try { const r = await api.get(url); setState({ data: r.data, loading: false, error: '' }); } catch (err) { setState({ data: null, loading: false, error: errorMessage(err, 'Ocorreu um erro.') }); }
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}

// ---------------------------------------------------------------- entrada
function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/login', { email: email.trim(), password });
      if (res.data.user.role !== 'super_admin') {
        await api.post('/api/auth/logout').catch(() => {});
        setError(t('Esta conta não tem acesso à administração.'));
        return;
      }
      navigate('/', { replace: true });
    } catch (err) { setError(errorMessage(err, 'Credenciais inválidas.')); } finally { setLoading(false); }
  }
  return (
    <div className="flex min-h-screen items-start justify-center bg-bg px-4 pt-24">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-md font-semibold text-ink">Genesis Admin</span>
          {/* Antes de entrar: fica no aparelho; depois manda a lingua da conta. */}
          <LanguageSwitch className="ml-auto" />
        </div>
        <h1 className="mt-8 text-xl font-semibold tracking-tight text-ink">{t('Acesso restrito')}</h1>
        <p className="mt-1 text-base text-ink-muted">{t('Administração da plataforma.')}</p>
        {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <Input label={t('Senha')} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!email || !password}>{t('Entrar')}</Button>
        </form>
      </div>
    </div>
  );
}

function RequireAdmin({ children }) {
  const [state, setState] = useState('loading');
  useEffect(() => {
    api.get('/api/auth/me').then((r) => {
      const u = r.data.user;
      // A lingua da conta manda sobre a do aparelho (como no painel do dono).
      if (u.role === 'super_admin' && u.language) setLang(u.language);
      setState(u.role === 'super_admin' ? 'ok' : 'no');
    }).catch(() => setState('no'));
  }, []);
  if (state === 'loading') return <div className="flex min-h-screen items-center justify-center text-ink-muted"><Spinner /></div>;
  if (state === 'no') return <Navigate to="/entrar" replace />;
  return children;
}

const NAV = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/pedidos', label: 'Pedidos de conta', icon: Inbox },
  { to: '/lojas', label: 'Estabelecimentos', icon: Store },
  { to: '/catalogos', label: 'Catálogos-mestre', icon: BookOpen },
  { to: '/sugestoes', label: 'Sugestões', icon: Lightbulb },
  { to: '/pedidos-clientes', label: 'Pedidos de clientes', icon: PackageSearch },
  { to: '/avise-me', label: 'Avise-me', icon: BellRing },
  { to: '/auditoria', label: 'Auditoria', icon: ScrollText },
];

// Etapa A (27/10): barra recolhivel (so icones), lembrada no aparelho.
const SIDEBAR_KEY = 'genesis.admin.sidebar.collapsed';

function Shell() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; } });
  const toggle = () => setCollapsed((v) => { try { localStorage.setItem(SIDEBAR_KEY, v ? '0' : '1'); } catch { /* sem armazenamento */ } return !v; });
  const logout = async () => { await api.post('/api/auth/logout').catch(() => {}); navigate('/entrar'); };
  return (
    <div className="min-h-screen bg-bg">
      <aside className={cx('fixed inset-y-0 left-0 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex', collapsed ? 'w-16' : 'w-56')}>
        <div className={cx('flex h-14 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'gap-2.5 px-5')}>
          {!collapsed && <BrandMark />}
          {!collapsed && <span className="flex-1 font-semibold text-ink">Admin</span>}
          <IconButton label={collapsed ? t('Mostrar o menu') : t('Esconder o menu')} icon={collapsed ? ChevronsRight : ChevronsLeft} size="sm" onClick={toggle} />
        </div>
        <nav className={cx('flex-1 py-3', collapsed ? 'px-2' : 'px-3')}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} title={collapsed ? t(label) : undefined} aria-label={collapsed ? t(label) : undefined} className={({ isActive }) => cx('mb-0.5 flex h-9 items-center rounded text-base', collapsed ? 'justify-center' : 'gap-3 px-3', isActive ? 'bg-accent-soft font-medium text-accent-text' : 'text-ink-2 hover:bg-subtle')}>
              <Icon size={17} strokeWidth={1.8} />{!collapsed && t(label)}
            </NavLink>
          ))}
        </nav>
        <div className={cx('flex flex-col gap-2 border-t border-border', collapsed ? 'items-center p-2' : 'p-3')}>
          {!collapsed && <LanguageSwitch className="px-2" onChange={saveLanguage} />}
          {collapsed
            ? <IconButton label={t('Sair')} icon={LogOut} size="sm" onClick={logout} />
            : <Button variant="ghost" icon={LogOut} block onClick={logout}>{t('Sair')}</Button>}
        </div>
      </aside>
      <main className={cx('mx-auto max-w-content px-4 py-6 transition-[padding] duration-200 md:pr-8 lg:py-8', collapsed ? 'md:pl-24' : 'md:pl-64')}>
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {NAV.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('shrink-0 rounded px-3 py-1.5 text-sm', isActive ? 'bg-accent-soft text-accent-text' : 'text-ink-2')}>{t(label)}</NavLink>)}
          </nav>
          <LanguageSwitch compact onChange={saveLanguage} />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- visao geral
function Overview() {
  const { t } = useI18n();
  const { data, error } = useLoad('/api/admin/overview');
  const max = data ? Math.max(1, ...data.growth.map((g) => g.total)) : 1;
  return (
    <>
      <PageHeader title={t('Visão geral')} description={t('Estado da plataforma.')} />
      {error && <Alert tone="danger">{error}</Alert>}
      {!data ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t('Receita mensal recorrente')} value={money(data.mrr)} hint={t('{n} loja(s) activa(s)', { n: data.active })} />
            <Stat label={t('Em teste')} value={String(data.trial)} hint={t('{n} a terminar em 7 dias', { n: data.trials_ending_soon })} />
            <Stat label={t('Pedidos pendentes')} value={String(data.pending)} />
            <Stat label={t('Suspensas / bloqueadas')} value={String(data.suspended + data.blocked)} tone={data.suspended + data.blocked ? 'danger' : undefined} />
          </div>
          {data.catalog_suggestions > 0 && (
            <Alert tone="info" className="mt-4" title={t('{n} produto(s) novo(s) nas lojas', { n: data.catalog_suggestions })}>
              {t('As lojas acrescentaram produtos que não estão no catálogo-mestre.')} <NavLink to="/sugestoes" className="font-medium text-accent-text underline">{t('Ver sugestões')}</NavLink>
            </Alert>
          )}
          {data.lost_requests_30d > 0 && (
            <Alert tone="info" className="mt-4" title={t('{n} pedido(s) de clientes fora do catálogo (30 dias)', { n: data.lost_requests_30d })}>
              {t('Produtos que os clientes pediram nas lojas e que elas não têm.')} <NavLink to="/pedidos-clientes" className="font-medium text-accent-text underline">{t('Ver pedidos')}</NavLink>
            </Alert>
          )}
          <Card className="mt-4">
            <CardHeader title={t('Lojas na plataforma')} description={t('Últimos 6 meses (activas, em teste e suspensas).')} />
            <div className="flex h-40 items-end gap-3">
              {data.growth.map((g) => (
                <div key={g.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="num text-xs text-ink-2">{g.total}</span>
                  <div className="w-full max-w-[48px] rounded-t bg-accent" style={{ height: `${(g.total / max) * 100}%`, minHeight: 2 }} />
                  <span className="text-xs text-ink-muted">{g.month.slice(5)}/{g.month.slice(2, 4)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- pedidos
function Requests() {
  const toast = useToast();
  const { t } = useI18n();
  const { data, loading, error, reload } = useLoad('/api/admin/requests');
  const [approved, setApproved] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  async function approve(x) {
    setBusy(x.id);
    try { const r = await api.post(`/api/admin/requests/${x.id}/approve`); setApproved({ ...r.data, name: x.name, phone: x.phone, owner_name: x.owner_name }); reload(); } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  async function reject() {
    setBusy(rejecting.id);
    try { await api.post(`/api/admin/requests/${rejecting.id}/reject`, { reason }); toast(t('Pedido rejeitado.')); setRejecting(null); setReason(''); reload(); } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  return (
    <>
      <PageHeader title={t('Pedidos de conta')} description={t('Aprovar cria a conta do dono com 30 dias de teste.')} />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: t('Negócio'), render: (x) => <div><p className="text-ink">{x.name}</p><p className="text-xs text-ink-muted">{t(TYPES[x.business_type] || x.business_type)} · {x.location}</p></div> },
          { key: 'owner', header: t('Dono'), render: (x) => <div><p className="text-ink">{x.owner_name}</p><p className="num text-xs text-ink-muted">{x.phone}{x.email ? ' · ' + x.email : ''}</p></div> },
          { key: 'created', header: t('Pedido'), render: (x) => dateTime(x.created_at) },
          { key: 'actions', header: '', align: 'right', render: (x) => (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setReason(''); setRejecting(x); }}>{t('Rejeitar')}</Button>
              <Button size="sm" variant="primary" loading={busy === x.id} onClick={() => approve(x)}>{t('Aprovar')}</Button>
            </div>
          ) },
        ]}
        rows={data || []}
        loading={loading && !data}
        empty={<p className="py-10 text-center text-ink-muted">{t('Sem pedidos pendentes.')}</p>}
      />
      <Dialog open={Boolean(approved)} size="sm" title={t('Conta criada')} description={approved ? approved.name : ''} onClose={() => setApproved(null)} footer={<Button variant="primary" onClick={() => setApproved(null)}>{t('Concluído')}</Button>}>
        {approved && (
          <>
            <p className="mb-3 text-base text-ink-2">{t('Envie estes dados ao dono ({phone}). A senha temporária só é mostrada agora.', { phone: approved.phone })}</p>
            <KeyValue label="Email" value={approved.email} />
            <KeyValue label={t('Senha temporária')} value={<span className="font-medium">{approved.temporaryPassword}</span>} />
            <KeyValue label={t('Teste até')} value={date(approved.trial_ends_at)} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => shareOrDownloadCard(approved).catch((err) => toast(errorMessage(err), 'danger'))}>{t('Imagem da conta')}</Button>
              <Button variant="primary" onClick={() => window.open(whatsappLink(approved), '_blank', 'noopener')}>{t('Enviar pelo WhatsApp')}</Button>
            </div>
            <p className="mt-2 text-xs text-ink-muted">{t('O WhatsApp abre com a mensagem de boas-vindas e os dados de entrada; a imagem pode ser anexada à mesma conversa.')}</p>
          </>
        )}
      </Dialog>
      <Dialog open={Boolean(rejecting)} size="sm" title={t('Rejeitar pedido')} description={rejecting?.name} onClose={() => setRejecting(null)}
        footer={<><Button onClick={() => setRejecting(null)}>{t('Cancelar')}</Button><Button variant="danger" loading={busy === rejecting?.id} disabled={reason.trim().length < 3} onClick={reject}>{t('Rejeitar')}</Button></>}>
        <Textarea label={t('Motivo')} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------- lojas
function Tenants() {
  const { t } = useI18n();
  const { data, loading, error, reload } = useLoad('/api/admin/tenants');
  const [filter, setFilter] = useState('live');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const rows = useMemo(() => (data || []).filter((x) => {
    if (filter === 'live' && !['active', 'trial'].includes(x.status)) return false;
    if (filter === 'problem' && !['suspended', 'blocked'].includes(x.status)) return false;
    const s = q.trim().toLowerCase();
    return !s || x.name.toLowerCase().includes(s) || (x.owner_name || '').toLowerCase().includes(s) || (x.phone || '').includes(s);
  }), [data, filter, q]);
  return (
    <>
      <PageHeader title={t('Estabelecimentos')} />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Toolbar>
        <Segmented value={filter} onChange={setFilter} options={[{ value: 'live', label: t('Activas e em teste') }, { value: 'problem', label: t('Suspensas') }, { value: 'all', label: t('Todas') }]} />
        <Input aria-label={t('Pesquisar')} placeholder={t('Pesquisar loja, dono ou telefone')} value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto w-72" />
      </Toolbar>
      <Table
        columns={[
          { key: 'name', header: t('Loja'), render: (x) => <div><p className="text-ink">{x.name}</p><p className="text-xs text-ink-muted">{t(TYPES[x.business_type] || x.business_type)} · {x.location}</p></div> },
          { key: 'status', header: t('Estado'), render: (x) => <Badge tone={STATUS[x.status]?.tone}>{STATUS[x.status] ? t(STATUS[x.status].label) : x.status}</Badge> },
          { key: 'trial', header: t('Teste / activa até'), render: (x) => {
            const until = x.status === 'trial' ? x.trial_ends_at : x.status === 'active' ? x.subscription_until : null;
            return until ? <span className={new Date(until) < new Date() ? 'text-danger' : 'text-ink-2'}>{date(until)}</span> : '—';
          } },
          { key: 'sales', header: t('Vendas 30 dias'), align: 'right', render: (x) => x.sales_30d },
          { key: 'revenue', header: t('Receita 30 dias'), align: 'right', render: (x) => money(x.revenue_30d) },
        ]}
        rows={rows}
        loading={loading && !data}
        onRowClick={(x) => setSelected(x.id)}
        empty={<p className="py-10 text-center text-ink-muted">{t('Nenhuma loja.')}</p>}
      />
      {selected && <TenantDrawer id={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}

function TenantDrawer({ id, onClose, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useI18n();
  const { data: s, reload } = useLoad('/api/admin/tenants/' + id);
  const [busy, setBusy] = useState('');
  const [supportUrl, setSupportUrl] = useState('');
  const [plan, setPlan] = useState('');
  async function act(path, label, opts = {}) {
    if (opts.confirm && !(await confirm({ title: label, message: opts.confirm, confirmLabel: label, danger: opts.danger }))) return;
    // O Safari (iPhone) so deixa abrir um separador no proprio toque: um
    // window.open depois do await era bloqueado em silencio. O separador abre
    // ja, vazio, e recebe o link quando o codigo chegar. Se mesmo assim for
    // bloqueado, aparece um link para tocar.
    const tab = path === 'support' ? window.open('', '_blank') : null;
    setBusy(path);
    try {
      const r = await api.post(`/api/admin/tenants/${id}/${path}`, opts.body);
      if (path === 'support') {
        if (tab) { tab.opener = null; tab.location.replace(r.data.url); toast(t('Modo suporte aberto noutro separador (só leitura, 60 s para abrir).')); }
        else setSupportUrl(r.data.url);
      } else { toast(t('Feito.')); reload(); onChanged(); }
    } catch (err) { if (tab) tab.close(); toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  return (
    <Drawer open onClose={onClose} title={s?.name || t('Loja')} description={s ? `${t(TYPES[s.business_type] || s.business_type)} · ${s.location}` : ''}>
      {!s ? <Spinner /> : (
        <div className="flex flex-col gap-5">
          <div>
            <KeyValue label={t('Estado')} value={<Badge tone={STATUS[s.status]?.tone}>{STATUS[s.status] ? t(STATUS[s.status].label) : s.status}</Badge>} />
            {s.status === 'trial' && <KeyValue label={t('Teste até')} value={date(s.trial_ends_at)} />}
            {s.status === 'active' && <KeyValue label={t('Activa até')} value={s.subscription_until ? <span className={new Date(s.subscription_until) < new Date() ? 'text-danger' : undefined}>{date(s.subscription_until)}{new Date(s.subscription_until) < new Date() ? ' · ' + t('em atraso (só leitura)') : ''}</span> : t('sem data')} />}
            <KeyValue label={t('Dono')} value={s.owner_name} />
            <KeyValue label={t('Telefone')} value={s.phone} />
            <KeyValue label={t('Subscrição')} value={t('{value} / mês', { value: money(s.subscription_price) })} />
            <KeyValue label={t('Plano')} value={<span>{s.plan === 'premium' ? t('Premium') : t('Básico')} · {s.plan_period === 'annual' ? t('anual') : t('mensal')}{s.plan_effective === 'premium' && s.plan !== 'premium' && s.premium_until ? ' · ' + t('Premium oferecido até {d}', { d: date(new Date(new Date(s.premium_until).getTime() - 1)) }) : ''}</span>} />
            <KeyValue label={t('Produtos')} value={s.products_count} />
            <KeyValue label={t('Vendas (total)')} value={`${s.sales_count} · ${money(s.revenue_total)}`} />
            <KeyValue label={t('Cliente desde')} value={date(s.created_at)} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink-muted">{t('Contas')}</h3>
            {s.users.map((u) => <KeyValue key={u.id} label={`${u.name} · ${u.role === 'owner' ? t('dono') : t('caixista')}`} value={u.is_active ? t('activa') : t('inactiva')} />)}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink-muted">{t('Acções')}</h3>
            <Button loading={busy === 'support'} onClick={() => act('support', t('Abrir modo suporte'))}>{t('Abrir modo suporte (só leitura)')}</Button>
            {supportUrl && (
              <Alert tone="warning" title={t('O browser bloqueou o separador novo')}>
                <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline" onClick={() => setSupportUrl('')}>{t('Tocar aqui para abrir o modo suporte')}</a> {t('(válido 60 s).')}
              </Alert>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <Select label={t('Mudar o plano')} value={plan || `${s.plan}:${s.plan_period}`} onChange={(e) => setPlan(e.target.value)} className="w-56">
                <option value="basic:monthly">{t('Básico mensal (8 000 MT)')}</option>
                <option value="basic:annual">{t('Básico anual')}</option>
                <option value="premium:monthly">{t('Premium mensal (14 000 MT)')}</option>
                <option value="premium:annual">{t('Premium anual')}</option>
              </Select>
              <Button loading={busy === 'plan'} disabled={!plan || plan === `${s.plan}:${s.plan_period}`} onClick={() => { const [p, per] = plan.split(':'); act('plan', t('Mudar o plano'), { body: { plan: p, period: per } }).then(() => setPlan('')); }}>{t('Guardar plano')}</Button>
            </div>
            {s.status === 'trial' && <Button loading={busy === 'extend-trial'} onClick={() => act('extend-trial', t('Prolongar teste'), { body: { days: 14 } })}>{t('Prolongar teste 14 dias')}</Button>}
            {['trial', 'suspended', 'active'].includes(s.status) && (
              <Button variant="primary" loading={busy === 'activate'} onClick={() => act('activate', s.status === 'active' ? t('Renovar subscrição') : t('Activar subscrição'), { confirm: s.plan_period === 'annual' ? t('Pagamento recebido: fica activa mais 12 meses.') : t('Pagamento recebido: fica activa mais 1 mês.') })}>
                {s.status === 'active' ? t('Renovar (pagamento recebido)') : t('Activar subscrição (pagamento recebido)')}
              </Button>
            )}
            {['active', 'trial'].includes(s.status) && <Button variant="danger-ghost" loading={busy === 'suspend'} onClick={() => act('suspend', t('Suspender'), { confirm: t('Todas as sessões e terminais da loja deixam de funcionar de imediato.'), danger: true })}>{t('Suspender (pagamento em atraso)')}</Button>}
            {s.status === 'suspended' && <Button loading={busy === 'unsuspend'} onClick={() => act('unsuspend', t('Reactivar'))}>{t('Reactivar')}</Button>}
            {s.status === 'blocked' ? <Button loading={busy === 'unblock'} onClick={() => act('unblock', t('Desbloquear'))}>{t('Desbloquear')}</Button>
              : s.status !== 'deleted' && <Button variant="danger-ghost" loading={busy === 'block'} onClick={() => act('block', t('Bloquear'), { confirm: t('Bloqueio por abuso ou fraude.'), danger: true, body: { reason: 'Bloqueio administrativo' } })}>{t('Bloquear')}</Button>}
            {s.status === 'deleted' ? <Button loading={busy === 'restore'} onClick={() => act('restore', t('Recuperar'))}>{t('Recuperar loja')}</Button>
              : <Button variant="danger-ghost" loading={busy === 'delete'} onClick={() => act('delete', t('Eliminar'), { confirm: t('Desactiva todas as contas da loja. Os dados ficam guardados e a loja pode ser recuperada.'), danger: true })}>{t('Eliminar')}</Button>}
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ---------------------------------------------------------------- catalogos
// Catalogo-mestre (Fase 8.6, pedido do fundador 10/10): ver, procurar,
// acrescentar e EDITAR (nome, categoria, precos em centavos, codigo, icone).
// So as lojas novas recebem as alteracoes; as que ja existem mantem os seus.
// 9.7: nome em ingles (pesquisa nas duas linguas; vale logo para todas as lojas
// que tem o produto com o mesmo nome, porque e juntado na leitura).
const EMPTY_MASTER = { id: null, product_name: '', product_name_en: '', category: '', suggested_cost: 0, suggested_sell: 0, barcode: '', icon: null };
function Catalogs() {
  const toast = useToast();
  const { t } = useI18n();
  const [type, setType] = useState('bottle_store');
  const [q, setQ] = useState('');
  const { data, error, loading, reload } = useLoad('/api/admin/master-catalog?type=' + type);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const rows = (data?.products || []).filter((p) => !q.trim() || fold(p.product_name + ' ' + (p.product_name_en || '') + ' ' + p.category + ' ' + (p.barcode || '')).includes(fold(q.trim())));
  async function save() {
    setBusy(true);
    const body = {
      product_name: open.product_name.trim(), product_name_en: open.product_name_en?.trim() || null, category: open.category.trim() || 'Geral',
      suggested_cost: open.suggested_cost || 0, suggested_sell: open.suggested_sell || 0,
      barcode: open.barcode?.trim() || null, icon: open.icon || null,
    };
    try {
      if (open.id) await api.put('/api/admin/master-catalog/' + open.id, body);
      else await api.post('/api/admin/master-catalog', { ...body, business_type: type });
      toast(open.id ? t('Produto actualizado. As lojas novas já o recebem assim.') : t('Produto acrescentado ao catálogo-mestre.'));
      setOpen(null); reload();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(false); }
  }
  return (
    <>
      <PageHeader title={t('Catálogos-mestre')} description={t('Produtos sugeridos às lojas novas no onboarding, por tipo de negócio. Toque num produto para o editar.')} />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Toolbar>
        <Select aria-label={t('Tipo de negócio')} value={type} onChange={(e) => setType(e.target.value)} className="w-56">
          {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{t(l)}{data?.counts?.[v] != null ? ` (${data.counts[v]})` : ''}</option>)}
        </Select>
        <Input aria-label={t('Procurar no catálogo')} placeholder={t('Procurar…')} value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-64" />
        <Button variant="primary" className="ml-auto" onClick={() => setOpen({ ...EMPTY_MASTER })}>{t('Novo produto')}</Button>
      </Toolbar>
      <Alert tone="info" className="mb-4">{t('As alterações valem para as lojas novas. As lojas que já existem mantêm os seus produtos e preços.')}</Alert>
      <Table
        columns={[
          { key: 'name', header: t('Produto'), render: (p) => <div className="flex items-center gap-3"><ProductImage product={{ name: p.product_name, category: p.category, icon: p.icon }} size={32} /><div><p className="text-ink">{p.product_name}</p><p className="text-xs text-ink-muted">{p.product_name_en || <span className="italic">{t('sem nome em inglês')}</span>} · {p.category}{p.barcode ? ' · ' + p.barcode : ''}</p></div></div> },
          { key: 'cost', header: t('Compra sugerida'), align: 'right', render: (p) => money(p.suggested_cost) },
          { key: 'sell', header: t('Venda sugerida'), align: 'right', render: (p) => money(p.suggested_sell) },
        ]}
        rows={rows}
        rowKey="id"
        loading={loading && !data}
        onRowClick={(p) => setOpen({ ...p, product_name_en: p.product_name_en || '', barcode: p.barcode || '' })}
        empty={<p className="py-10 text-center text-ink-muted">{q ? t('Nenhum produto encontrado.') : t('Sem produtos neste tipo.')}</p>}
      />
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.id ? t('Editar produto') : t('Novo produto')}
        description={t(TYPES[type])}
        footer={open && (
          <>
            <Button onClick={() => setOpen(null)}>{t('Cancelar')}</Button>
            <Button variant="primary" loading={busy} disabled={!open.product_name.trim() || !(open.suggested_sell > 0)} onClick={save}>{t('Guardar')}</Button>
          </>
        )}
      >
        {open && (
          <div className="flex flex-col gap-4">
            <Input label={t('Nome')} value={open.product_name} onChange={(e) => setOpen({ ...open, product_name: e.target.value })} />
            <Input label={t('Nome em inglês')} hint={t('Para a pesquisa nas duas línguas («water» encontra «Água»). Os produtos que o dono cria ficam só com o nome dele.')} value={open.product_name_en || ''} maxLength={120} onChange={(e) => setOpen({ ...open, product_name_en: e.target.value })} />
            <Input label={t('Categoria')} value={open.category} onChange={(e) => setOpen({ ...open, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label={t('Preço de compra sugerido')} valueCents={open.suggested_cost} onChangeCents={(v) => setOpen({ ...open, suggested_cost: v })} />
              <MoneyInput label={t('Preço de venda sugerido')} valueCents={open.suggested_sell} onChangeCents={(v) => setOpen({ ...open, suggested_sell: v })} />
            </div>
            <Input label={t('Código de barras')} value={open.barcode || ''} onChange={(e) => setOpen({ ...open, barcode: e.target.value })} inputClassName="num" hint={open.barcode ? t('Veio do estabelecimento que criou o produto. Corrija se estiver errado.') : undefined} />
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">{t('Acrescentar também a')}</legend>
              <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded border border-border p-2 sm:grid-cols-2">
                {Object.entries(TYPES).filter(([k]) => k !== open.business_type).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-ink-2">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={(open.also_types || []).includes(k)}
                      onChange={(e) => setOpen({ ...open, also_types: e.target.checked ? [...(open.also_types || []), k] : (open.also_types || []).filter((x) => x !== k) })} />
                    {t(label)}
                  </label>
                ))}
              </div>
            </fieldset>
            <Select label={t('Ícone')} value={open.icon || ''} onChange={(e) => setOpen({ ...open, icon: e.target.value || null })}>
              <option value="">{t('Automático (pela categoria)')}</option>
              {PRODUCT_ICONS.map((i) => <option key={i.key} value={i.key}>{t(i.label)}</option>)}
            </Select>
          </div>
        )}
      </Drawer>
    </>
  );
}

// --------------------------------------------------------- pedidos de clientes
// Vendas perdidas FORA do catalogo (Fase 8.4): o que os clientes pediram nas
// lojas e elas nao tinham. Todas as lojas juntas; sem nomes de lojas (decisao
// do fundador, 10/10) — so quantas pediram.
function LostRequests() {
  const { t } = useI18n();
  const [days, setDays] = useState('30');
  const { data, error, loading } = useLoad('/api/admin/lost-requests?days=' + days);
  return (
    <>
      <PageHeader title={t('Pedidos de clientes')} description={t('O que os clientes pediram nas lojas e não havia, escrito pelos caixistas fora do catálogo da loja. Ajuda a decidir o que pôr no catálogo-mestre.')} />
      <Toolbar>
        <Segmented value={days} onChange={setDays} options={[{ value: '30', label: t('30 dias') }, { value: '90', label: t('90 dias') }, { value: '365', label: t('1 ano') }]} />
        {data && <span className="text-sm text-ink-muted">{t('{n} pedido(s)', { n: data.total_requests })}</span>}
      </Toolbar>
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: t('Produto pedido'), render: (g) => <span className="text-ink">{g.product_name}</span> },
          { key: 'type', header: t('Tipo de negócio'), render: (g) => t(TYPES[g.business_type] || g.business_type) },
          { key: 'stores', header: t('Estabelecimentos'), align: 'right', render: (g) => g.stores },
          { key: 'requests', header: t('Pedidos'), align: 'right', render: (g) => g.requests },
          { key: 'units', header: t('Unidades'), align: 'right', render: (g) => g.units },
          { key: 'price', header: t('Preço indicado'), align: 'right', render: (g) => g.avg_price == null ? <span className="text-ink-muted">—</span> : <span>{money(g.avg_price)}{g.min_price !== g.max_price && <span className="block text-xs text-ink-muted">{money(g.min_price)} – {money(g.max_price)}</span>}</span> },
          { key: 'when', header: t('Último'), render: (g) => <span className="whitespace-nowrap text-ink-2">{date(g.last_at)}</span> },
        ]}
        rows={data?.groups || []}
        rowKey={(g) => g.key}
        loading={loading && !data}
        empty={<p className="py-10 text-center text-ink-muted">{t('Nenhum pedido fora do catálogo neste período.')}</p>}
      />
    </>
  );
}

// ---------------------------------------------------------------- avise-me
// Etapa A: quem deixou o contacto para os modos ainda por construir (restaurante,
// hotel, farmacia…). Ninguem e avisado sozinho: o fundador avisa e marca aqui.
const CHANNEL = { whatsapp: 'WhatsApp', email: 'E-mail', both: 'WhatsApp e e-mail' };
function Waitlist() {
  const toast = useToast();
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoad('/api/admin/waitlist');
  const [busy, setBusy] = useState('');
  async function notified(r) {
    setBusy(r.id);
    try { await api.post('/api/admin/waitlist/' + r.id + '/notified'); toast(t('Marcado como avisado.')); reload(); } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  const wa = (r) => 'https://wa.me/' + (r.phone.length === 9 && r.phone.startsWith('8') ? '258' + r.phone : r.phone);
  return (
    <>
      <PageHeader title={t('Avise-me')} description={t('Quem pediu para ser avisado quando o Genesis tiver o modo do seu negócio. Ninguém é avisado automaticamente: avise e marque aqui.')} />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      {data && Object.keys(data.by_type).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(data.by_type).sort((a, b) => b[1] - a[1]).map(([k, n]) => <Badge key={k}>{t(TYPES[k] || k)} · {n}</Badge>)}
        </div>
      )}
      <Table
        columns={[
          { key: 'name', header: t('Nome'), render: (r) => <div><p className="text-ink">{r.name}</p><p className="num text-xs text-ink-muted">{r.phone}{r.email ? ' · ' + r.email : ''}</p></div> },
          { key: 'type', header: t('Tipo de negócio'), render: (r) => t(TYPES[r.business_type] || r.business_type) },
          { key: 'channel', header: t('Avisar por'), render: (r) => t(CHANNEL[r.channel] || r.channel) },
          { key: 'when', header: t('Pedido'), render: (r) => <span className="whitespace-nowrap text-ink-2">{date(r.created_at)}</span> },
          { key: 'state', header: t('Estado'), render: (r) => (r.notified_at ? <Badge tone="positive">{t('Avisado')}</Badge> : <Badge tone="warning">{t('À espera')}</Badge>) },
          { key: 'actions', header: '', align: 'right', render: (r) => (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => window.open(wa(r), '_blank', 'noopener')}>WhatsApp</Button>
              {!r.notified_at && <Button size="sm" loading={busy === r.id} onClick={() => notified(r)}>{t('Marcar avisado')}</Button>}
            </div>
          ) },
        ]}
        rows={data?.rows || []}
        loading={loading && !data}
        empty={<p className="py-10 text-center text-ink-muted">{t('Ainda ninguém pediu para ser avisado.')}</p>}
      />
    </>
  );
}

// ---------------------------------------------------------------- sugestoes
// Produtos que as lojas criaram e que nao estao no catalogo-mestre (Fase 8.2).
// Sem nomes de lojas: so quantas lojas e os precos que usam.
function Suggestions() {
  const toast = useToast();
  const { t } = useI18n();
  const { data, error, loading, reload } = useLoad('/api/admin/catalog-suggestions');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState('');
  async function accept() {
    setBusy('accept');
    try {
      await api.post('/api/admin/catalog-suggestions/accept', {
        business_type: open.business_type, name_key: open.name_key, product_name: open.product_name.trim(), product_name_en: open.product_name_en?.trim() || null, category: open.category.trim() || 'Geral',
        suggested_cost: open.cost, suggested_sell: open.sell, barcode: open.barcode?.trim() || null, icon: open.icon || null,
        also_types: open.also_types || [],
      });
      toast((open.also_types || []).length ? t('Acrescentado a {n} tipos de negócio.', { n: 1 + open.also_types.length }) : t('Acrescentado ao catálogo-mestre. As lojas novas deste tipo já o recebem.'));
      setOpen(null); reload();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  async function dismiss(g) {
    setBusy('dismiss');
    try { await api.post('/api/admin/catalog-suggestions/dismiss', { business_type: g.business_type, name_key: g.name_key }); toast(t('Sugestão ignorada.')); setOpen(null); reload(); } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  return (
    <>
      <PageHeader title={t('Sugestões do catálogo')} description={t('Produtos que as lojas acrescentaram e que não estão no catálogo-mestre. Ao acrescentar, as lojas novas desse tipo passam a recebê-los no início.')} />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: t('Produto'), render: (g) => <div className="flex items-center gap-3"><ProductImage product={{ name: g.product_name, category: g.category, icon: g.icon }} size={32} /><div><p className="text-ink">{g.product_name}</p><p className="text-xs text-ink-muted">{g.category}{g.barcode ? ' · ' + g.barcode : ''}</p></div></div> },
          { key: 'type', header: t('Tipo de negócio'), render: (g) => t(TYPES[g.business_type] || g.business_type) },
          { key: 'stores', header: t('Estabelecimentos'), align: 'right', render: (g) => g.stores },
          { key: 'cost', header: t('Compra (média)'), align: 'right', render: (g) => money(g.avg_cost) },
          { key: 'sell', header: t('Venda (média)'), align: 'right', render: (g) => <span>{money(g.avg_sell)}{g.min_sell !== g.max_sell && <span className="block text-xs text-ink-muted">{money(g.min_sell)} – {money(g.max_sell)}</span>}</span> },
          { key: 'when', header: t('Último'), render: (g) => <span className="whitespace-nowrap text-ink-2">{date(g.last_at)}</span> },
        ]}
        rows={data?.groups || []}
        rowKey={(g) => g.business_type + '|' + g.name_key}
        loading={loading && !data}
        onRowClick={(g) => setOpen({ ...g, product_name_en: '', cost: g.avg_cost, sell: g.avg_sell })}
        empty={<p className="py-10 text-center text-ink-muted">{t('Nenhuma sugestão por tratar.')}</p>}
      />
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={t('Acrescentar ao catálogo-mestre')}
        description={open ? t('{type} · pedido por {n} loja(s)', { type: t(TYPES[open.business_type] || open.business_type), n: open.stores }) : ''}
        footer={open && (
          <>
            <Button variant="danger-ghost" className="mr-auto" loading={busy === 'dismiss'} onClick={() => dismiss(open)}>{t('Ignorar')}</Button>
            <Button onClick={() => setOpen(null)}>{t('Cancelar')}</Button>
            <Button variant="primary" loading={busy === 'accept'} disabled={!open.product_name.trim() || !(open.sell > 0)} onClick={accept}>{t('Acrescentar')}</Button>
          </>
        )}
      >
        {open && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-2">{t('Pode corrigir o nome e os preços antes de acrescentar (ficam como sugestão para as lojas novas).')}</p>
            <Input label={t('Nome')} value={open.product_name} onChange={(e) => setOpen({ ...open, product_name: e.target.value })} />
            <Input label={t('Nome em inglês')} value={open.product_name_en || ''} maxLength={120} onChange={(e) => setOpen({ ...open, product_name_en: e.target.value })} />
            <Input label={t('Categoria')} value={open.category} onChange={(e) => setOpen({ ...open, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label={t('Preço de compra sugerido')} valueCents={open.cost} onChangeCents={(v) => setOpen({ ...open, cost: v })} />
              <MoneyInput label={t('Preço de venda sugerido')} valueCents={open.sell} onChangeCents={(v) => setOpen({ ...open, sell: v })} />
            </div>
            <KeyValue label={t('Preços de venda nas lojas')} value={open.min_sell === open.max_sell ? money(open.min_sell) : `${money(open.min_sell)} – ${money(open.max_sell)}`} />
            <Input label={t('Código de barras')} value={open.barcode || ''} onChange={(e) => setOpen({ ...open, barcode: e.target.value })} inputClassName="num" hint={open.barcode ? t('Veio do estabelecimento que criou o produto. Corrija se estiver errado.') : undefined} />
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">{t('Acrescentar também a')}</legend>
              <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded border border-border p-2 sm:grid-cols-2">
                {Object.entries(TYPES).filter(([k]) => k !== open.business_type).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-ink-2">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={(open.also_types || []).includes(k)}
                      onChange={(e) => setOpen({ ...open, also_types: e.target.checked ? [...(open.also_types || []), k] : (open.also_types || []).filter((x) => x !== k) })} />
                    {t(label)}
                  </label>
                ))}
              </div>
            </fieldset>
            <Select label={t('Ícone')} value={open.icon || ''} onChange={(e) => setOpen({ ...open, icon: e.target.value || null })}>
              <option value="">{t('Automático (pela categoria)')}</option>
              {PRODUCT_ICONS.map((i) => <option key={i.key} value={i.key}>{t(i.label)}</option>)}
            </Select>
          </div>
        )}
      </Drawer>
    </>
  );
}

// ---------------------------------------------------------------- auditoria
function Audit() {
  const { t } = useI18n();
  const { data, loading } = useLoad('/api/admin/audit');
  return (
    <>
      <PageHeader title={t('Auditoria')} description={t('Últimas 200 acções na plataforma.')} />
      <Table
        columns={[
          { key: 'when', header: t('Quando'), render: (a) => <span className="whitespace-nowrap">{dateTime(a.created_at)}</span> },
          { key: 'action', header: t('Acção'), render: (a) => <span className="font-medium text-ink">{a.action}</span> },
          { key: 'tenant', header: t('Loja'), render: (a) => a.tenant_name || '—' },
          { key: 'user', header: t('Por'), render: (a) => <span className="text-ink-2">{a.user_name}</span> },
        ]}
        rows={data || []}
        loading={loading}
      />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <Routes>
              <Route path="/entrar" element={<Login />} />
              <Route element={<RequireAdmin><Shell /></RequireAdmin>}>
                <Route index element={<Overview />} />
                <Route path="pedidos" element={<Requests />} />
                <Route path="lojas" element={<Tenants />} />
                <Route path="catalogos" element={<Catalogs />} />
                <Route path="sugestoes" element={<Suggestions />} />
                <Route path="pedidos-clientes" element={<LostRequests />} />
                <Route path="avise-me" element={<Waitlist />} />
                <Route path="auditoria" element={<Audit />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}
