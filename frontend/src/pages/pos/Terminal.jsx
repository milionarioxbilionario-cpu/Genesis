import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Monitor } from 'lucide-react';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { clearCatalog } from '../../utils/productCache';
import { BrandMark, Alert, Button, Input, LanguageSwitch, PinPad, Spinner, cx } from '../../components/ui';
import { setLang, storedLang } from '../../i18n/core';
import { useI18n } from '../../i18n/react';
import '../../i18n/en/pos';
import PosScreen from './PosScreen';

// TERMINAL DE VENDAS (Genesis 2.0)
//   nao emparelhado -> codigo de 6 digitos dado pelo dono
//   emparelhado     -> perfis dos caixistas -> PIN pessoal -> POS
// A conta do dono nunca fica neste dispositivo.
// Lingua (9.3): os ecras partilhados (emparelhar, perfis) usam a lingua do
// aparelho; depois do PIN manda a lingua do caixista, sem mudar a do aparelho.
export default function Terminal() {
  const { t } = useI18n();
  const [state, setState] = useState({ status: 'loading' });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/pos/terminal', { silent: true });
      const d = res.data;
      const cashier = d.cashiers.find((c) => c.id === d.session_cashier_id);
      setState(cashier ? { status: 'selling', info: d, cashier } : { status: 'profiles', info: d });
    } catch (err) {
      if (err?.response?.data?.code === 'TERMINAL_NOT_PAIRED') setState({ status: 'pair' });
      else setState({ status: 'error', message: errorMessage(err, 'Não foi possível contactar o servidor.') });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sellingId = state.status === 'selling' ? state.cashier.id : null;
  useEffect(() => {
    if (state.status === 'loading') return;
    if (sellingId) {
      if (state.cashier.language) setLang(state.cashier.language, { remember: false });
    } else {
      setLang(storedLang() || 'pt', { remember: false });
    }
    // So quando entra/sai um caixista: a escolha feita no POS fica no ecra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, sellingId]);

  // Sessao do caixista terminou (expirou, desactivado, PIN mudado): volta aos perfis.
  useEffect(() => {
    const onEnded = () => setState((s) => (s.status === 'selling' ? { status: 'profiles', info: s.info, notice: 'A sessão terminou. Introduza o PIN de novo.' } : s));
    window.addEventListener('genesis:session-ended', onEnded);
    return () => window.removeEventListener('genesis:session-ended', onEnded);
  }, []);

  if (state.status === 'loading') return <Centered><Spinner /></Centered>;
  if (state.status === 'error') {
    return (
      <Centered>
        <Alert tone="danger" title={t('Sem ligação')}>{state.message}</Alert>
        <Button className="mt-4" onClick={load}>{t('Tentar de novo')}</Button>
      </Centered>
    );
  }
  if (state.status === 'pair') return <PairScreen onPaired={load} />;
  if (state.status === 'selling') {
    return (
      <PosScreen
        info={state.info}
        cashier={state.cashier}
        askDevices={Boolean(state.justLoggedIn)}
        onLock={async () => { await api.post('/api/pos/lock').catch(() => {}); load(); }}
      />
    );
  }
  return (
    <ProfilesScreen
      info={state.info}
      notice={state.notice}
      onLoggedIn={(cashier) => setState({ status: 'selling', info: state.info, cashier, justLoggedIn: true })}
    />
  );
}

function Centered({ children }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">{children}</div>;
}

function Brand({ store }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-md font-semibold text-ink">{store || 'Genesis'}</span>
    </div>
  );
}

function PairScreen({ onPaired }) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/pos/pair', { code });
      await clearCatalog();
      onPaired();
    } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
  }
  return (
    <Centered>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <LanguageSwitch />
        </div>
        <div className="mt-10 flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-ink-2"><Monitor size={18} /></div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">{t('Emparelhar este terminal')}</h1>
        <p className="mt-1.5 text-base text-ink-muted">{t('O dono gera o código em Definições → Terminais. Só é preciso fazer isto uma vez neste computador.')}</p>
        {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <Input label={t('Código de emparelhamento')} inputMode="numeric" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} inputClassName="h-12 text-center text-lg num tracking-[0.4em]" />
          <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={code.length !== 6}>{t('Emparelhar')}</Button>
        </form>
        <p className="mt-6 text-sm text-ink-muted">{t('É o dono?')} <Link to="/entrar" className="font-medium text-accent">{t('Entrar no painel')}</Link></p>
      </div>
    </Centered>
  );
}

function ProfilesScreen({ info, notice, onLoggedIn }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function login(value) {
    if (busy || !selected) return;
    setBusy(true); setError('');
    try {
      const res = await api.post('/api/pos/login', { cashier_id: selected.id, pin: value });
      onLoggedIn({ ...selected, language: res.data?.cashier?.language || selected.language });
    } catch (err) {
      setPin('');
      const rem = err?.response?.data?.remaining;
      setError(errorMessage(err, 'PIN incorrecto.') + (typeof rem === 'number' ? ' ' + t('Restam {n} tentativa(s).', { n: rem }) : ''));
    } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-5">
        <Brand store={info.store.name} />
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden truncate text-sm text-ink-muted sm:inline">{info.terminal.name}</span>
          <LanguageSwitch />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {!selected ? (
          <div className="w-full max-w-3xl">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{t('Quem está a vender?')}</h1>
            <p className="mt-1 text-base text-ink-muted">{t('Escolha o seu perfil e introduza o seu PIN.')}</p>
            {notice && <Alert tone="info" className="mt-5">{t(notice)}</Alert>}
            {info.cashiers.length === 0 ? (
              <Alert tone="warning" className="mt-6" title={t('Ainda não há caixistas')}>{t('O dono cria os caixistas e os PINs em Equipa.')}</Alert>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {info.cashiers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!c.has_pin}
                    onClick={() => { setSelected(c); setPin(''); setError(''); }}
                    className="flex flex-col items-center rounded-lg border border-border bg-surface px-4 py-6 text-center transition-colors hover:border-border-strong hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-md font-semibold text-ink-2">{(c.name || '?').slice(0, 1).toUpperCase()}</span>
                    <span className="mt-3 font-medium text-ink">{c.name}</span>
                    <span className={cx('mt-0.5 text-xs', c.locked ? 'text-danger' : c.shift_open === false ? 'text-warning' : 'text-ink-muted')}>
                      {!c.has_pin ? t('Sem PIN definido') : c.locked ? t('Bloqueado no fecho') : c.shift_open === false ? t('Fechado hoje') : t('Turno aberto')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-lg font-semibold text-ink-2">{selected.name.slice(0, 1).toUpperCase()}</span>
            <h1 className="mt-3 text-lg font-semibold text-ink">{selected.name}</h1>
            <p className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted"><Lock size={13} /> {t('Introduza o seu PIN')}</p>
            {error && <Alert tone="danger" className="mb-5 w-full">{error}</Alert>}
            <PinPad value={pin} onChange={setPin} onComplete={login} disabled={busy} length={4} />
            <Button variant="ghost" className="mt-6" onClick={() => setSelected(null)}>{t('Trocar de perfil')}</Button>
          </div>
        )}
      </main>
    </div>
  );
}
