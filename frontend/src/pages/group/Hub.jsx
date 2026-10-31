import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LayoutGrid, LogOut, Store } from 'lucide-react';
import useApi from '../../utils/useApi';
import { money, errorMessage } from '../../utils/format';
import { useSession, isManager } from '../../utils/session';
import { enterEstablishment, lastChoice, rememberChoice } from '../../utils/establishments';
import { BUSINESS_TYPES } from '../auth/RequestAccount';
import { useI18n } from '../../i18n/react';
import '../../i18n/en/owner';
import { Alert, Badge, BrandMark, IconButton, LanguageSwitch, Skeleton, cx } from '../../components/ui';

// E2 (31/10/2026): «Em qual estabelecimento deseja entrar?» — o dono com 2 ou
// mais estabelecimentos ve-o ao entrar, como o ecra de perfis do terminal.
// Cada cartao: nome, tipo, cidade, vendas de hoje e aberto/fechado (horario).
const typeIcon = (type) => BUSINESS_TYPES.find((b) => b.value === type)?.icon || Store;

export default function Hub() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const ov = useApi(isManager(user) ? null : '/api/group/overview?light=1');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  if (isManager(user) || user?.scope) return <Navigate to="/app" replace />;
  const last = lastChoice(user?.id);
  const rows = ov.data?.establishments || [];
  if (ov.data && rows.length < 2) return <Navigate to="/app" replace />;

  async function open(e) {
    rememberChoice(user?.id, e.id);
    if (e.is_current) { navigate('/app'); return; }
    setBusy(e.id); setError('');
    try { await enterEstablishment(e.id); } catch (err) { setError(errorMessage(err)); setBusy(''); }
  }
  function openGroup() { rememberChoice(user?.id, 'geral'); navigate('/geral'); }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-5">
        <BrandMark />
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <IconButton label={t('Sair')} icon={LogOut} size="sm" onClick={async () => { await logout(); navigate('/entrar'); }} />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-3xl">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{t('Em qual estabelecimento deseja entrar?')}</h1>
          <p className="mt-1 text-base text-ink-muted">{t('Olá, {name}. Escolha onde quer trabalhar agora, ou veja todos juntos no Painel geral.', { name: (user?.name || '').split(' ')[0] })}</p>
          {(error || ov.error) && <Alert tone="danger" className="mt-5">{error || ov.error}</Alert>}
          {!ov.data ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rows.map((e) => {
                const Icon = typeIcon(e.business_type);
                const blocked = e.status === 'suspended' || e.status === 'blocked';
                return (
                  <button key={e.id} type="button" disabled={Boolean(busy) || blocked} onClick={() => open(e)}
                    className={cx('relative flex flex-col items-center rounded-lg border bg-surface px-4 py-6 text-center transition-colors hover:border-border-strong hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50', last === e.id ? 'border-accent' : 'border-border')}>
                    {last === e.id && <Badge tone="info" className="absolute right-2 top-2">{t('Última escolha')}</Badge>}
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-ink-2"><Icon size={22} strokeWidth={1.8} /></span>
                    <span className="mt-3 line-clamp-2 font-medium text-ink">{e.name}</span>
                    <span className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{e.location}</span>
                    <span className="num mt-2 text-sm text-ink-2">{t('Hoje: {v}', { v: money(e.today.revenue) })}</span>
                    <span className={cx('mt-1 flex items-center gap-1.5 text-xs', e.closed || blocked ? 'text-ink-muted' : e.open_now ? 'text-positive' : 'text-ink-muted')}>
                      <span className={cx('h-2 w-2 rounded-full', e.open_now && !e.closed && !blocked ? 'bg-positive' : 'bg-border-strong')} aria-hidden="true" />
                      {blocked ? t('Suspenso') : e.closed ? t('Encerrado') : e.open_now ? t('Aberto agora') : t('Fechado agora')}
                    </span>
                    {busy === e.id && <span className="mt-1 text-xs text-ink-muted">{t('A abrir…')}</span>}
                  </button>
                );
              })}
              <button type="button" onClick={openGroup}
                className={cx('relative flex flex-col items-center justify-center rounded-lg border bg-accent-soft px-4 py-6 text-center transition-colors hover:border-accent', last === 'geral' ? 'border-accent' : 'border-transparent')}>
                {last === 'geral' && <Badge tone="info" className="absolute right-2 top-2">{t('Última escolha')}</Badge>}
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent"><LayoutGrid size={22} strokeWidth={1.8} /></span>
                <span className="mt-3 font-medium text-accent-text">{t('Painel geral')}</span>
                <span className="mt-0.5 text-xs text-ink-muted">{t('Todos juntos: hoje {v}', { v: money(ov.data.totals.today.revenue) })}</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
