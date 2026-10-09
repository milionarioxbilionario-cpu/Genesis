import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Monitor } from 'lucide-react';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { clearCatalog } from '../../utils/productCache';
import { Alert, Button, Input, PinPad, Spinner, cx } from '../../components/ui';
import PosScreen from './PosScreen';

// TERMINAL DE VENDAS (Genesis 2.0)
//   nao emparelhado -> codigo de 6 digitos dado pelo dono
//   emparelhado     -> perfis dos caixistas -> PIN pessoal -> POS
// A conta do dono nunca fica neste dispositivo.
export default function Terminal() {
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
        <Alert tone="danger" title="Sem ligação">{state.message}</Alert>
        <Button className="mt-4" onClick={load}>Tentar de novo</Button>
      </Centered>
    );
  }
  if (state.status === 'pair') return <PairScreen onPaired={load} />;
  if (state.status === 'selling') {
    return (
      <PosScreen
        info={state.info}
        cashier={state.cashier}
        onLock={async () => { await api.post('/api/pos/lock').catch(() => {}); load(); }}
      />
    );
  }
  return (
    <ProfilesScreen
      info={state.info}
      notice={state.notice}
      onLoggedIn={(cashier) => setState({ status: 'selling', info: state.info, cashier })}
    />
  );
}

function Centered({ children }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">{children}</div>;
}

function Brand({ store }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
      <span className="text-md font-semibold text-ink">{store || 'Genesis'}</span>
    </div>
  );
}

function PairScreen({ onPaired }) {
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
        <Brand />
        <div className="mt-10 flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-ink-2"><Monitor size={18} /></div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">Emparelhar este terminal</h1>
        <p className="mt-1.5 text-base text-ink-muted">O dono gera o código em <span className="text-ink-2">Definições → Terminais</span>. Só é preciso fazer isto uma vez neste computador.</p>
        {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <Input label="Código de emparelhamento" inputMode="numeric" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} inputClassName="h-12 text-center text-lg num tracking-[0.4em]" />
          <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={code.length !== 6}>Emparelhar</Button>
        </form>
        <p className="mt-6 text-sm text-ink-muted">É o dono? <Link to="/entrar" className="font-medium text-accent">Entrar no painel</Link></p>
      </div>
    </Centered>
  );
}

function ProfilesScreen({ info, notice, onLoggedIn }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function login(value) {
    if (busy || !selected) return;
    setBusy(true); setError('');
    try {
      await api.post('/api/pos/login', { cashier_id: selected.id, pin: value });
      onLoggedIn(selected);
    } catch (err) {
      setPin('');
      const rem = err?.response?.data?.remaining;
      setError(errorMessage(err, 'PIN incorrecto.') + (typeof rem === 'number' ? ` Restam ${rem} tentativa(s).` : ''));
    } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-5">
        <Brand store={info.store.name} />
        <span className="text-sm text-ink-muted">{info.terminal.name}</span>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {!selected ? (
          <div className="w-full max-w-3xl">
            <h1 className="text-xl font-semibold tracking-tight text-ink">Quem está a vender?</h1>
            <p className="mt-1 text-base text-ink-muted">Escolha o seu perfil e introduza o seu PIN.</p>
            {notice && <Alert tone="info" className="mt-5">{notice}</Alert>}
            {info.cashiers.length === 0 ? (
              <Alert tone="warning" className="mt-6" title="Ainda não há caixistas">O dono cria os caixistas e os PINs em Equipa.</Alert>
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
                      {!c.has_pin ? 'Sem PIN definido' : c.locked ? 'Bloqueado no fecho' : c.shift_open === false ? 'Turno fechado' : 'Turno aberto'}
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
            <p className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted"><Lock size={13} /> Introduza o seu PIN</p>
            {error && <Alert tone="danger" className="mb-5 w-full">{error}</Alert>}
            <PinPad value={pin} onChange={setPin} onComplete={login} disabled={busy} length={4} />
            <Button variant="ghost" className="mt-6" onClick={() => setSelected(null)}>Trocar de perfil</Button>
          </div>
        )}
      </main>
    </div>
  );
}
