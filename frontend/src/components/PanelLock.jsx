import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Fingerprint, Lock, LogOut } from 'lucide-react';
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../utils/api';
import { useSession } from '../utils/session';
import { errorMessage } from '../utils/format';
import { checkOfflinePin, rememberPin } from '../utils/offlinePin';
import { Alert, BrandMark, Button, PinPad } from './ui';
import { useI18n } from '../i18n/react';
import '../i18n/en/lock';

// Bloqueio do painel do dono (Fase 12.4, decisao do fundador 25/10/2026):
//  - PIN pessoal de 4 digitos (diferente do PIN que autoriza cancelamentos);
//  - Face ID / impressao digital quando o aparelho deixa (chave de acesso);
//  - bloqueia ao reabrir a app e depois de 5 minutos sem mexer;
//  - 5 erros: a sessao acaba e volta a pedir o email e a senha.
// O SERVIDOR e que manda (423 PANEL_LOCKED sem o cookie de desbloqueio); este
// ecra so pede o PIN. Sem rede, o PIN e confirmado no aparelho e o painel abre
// so com os dados que ja estavam guardados.
const IDLE_MS = 5 * 60 * 1000;
const OPEN_FLAG = 'genesis.unlocked'; // sessionStorage: morre quando a app/separador fecha
const passkeyFlag = (userId) => 'genesis.passkey.' + userId; // este aparelho tem Face ID registado

const store = {
  get: (s, k) => { try { return s.getItem(k); } catch { return null; } },
  set: (s, k, v) => { try { if (v == null) s.removeItem(k); else s.setItem(k, v); } catch { /* modo privado */ } },
};

export default function PanelLockGate({ children }) {
  const { user, offline, setLock, logout } = useSession();
  const lock = user?.lock;
  // Abrir a app de novo (nada no sessionStorage) bloqueia, mesmo com cookie valido.
  const [locked, setLocked] = useState(() => Boolean(lock?.has_pin) && (!lock.unlocked || !store.get(sessionStorage, OPEN_FLAG)));

  const doLock = useCallback(() => {
    store.set(sessionStorage, OPEN_FLAG, null);
    api.post('/api/lock/lock', null, { silent: true }).catch(() => {});
    setLocked(true);
  }, []);

  useEffect(() => {
    if (locked && lock?.has_pin && lock.unlocked && !store.get(sessionStorage, OPEN_FLAG)) doLock();
  }, [locked, lock, doLock]);

  // O servidor disse 423 (passaram 5 min, ou o cookie desapareceu).
  useEffect(() => {
    const on = () => { if (lock?.has_pin) doLock(); };
    window.addEventListener('genesis:panel-locked', on);
    return () => window.removeEventListener('genesis:panel-locked', on);
  }, [lock?.has_pin, doLock]);

  // 5 minutos sem tocar, ou a app esteve escondida mais de 5 minutos.
  const last = useRef(Date.now());
  useEffect(() => {
    if (!lock?.has_pin || locked) return undefined;
    const touch = () => { last.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const onVisible = () => { if (document.visibilityState === 'visible' && Date.now() - last.current > IDLE_MS) doLock(); };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => { if (Date.now() - last.current > IDLE_MS) doLock(); }, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [lock?.has_pin, locked, doLock]);

  if (!user || user.scope || !lock) return children;
  const unlocked = () => {
    store.set(sessionStorage, OPEN_FLAG, '1');
    last.current = Date.now();
    setLock({ has_pin: true, unlocked: true });
    setLocked(false);
  };
  if (!lock.has_pin) return offline ? children : <CreatePin user={user} onDone={unlocked} onLogout={logout} />;
  if (locked) return <LockScreen user={user} offline={offline} onUnlocked={unlocked} onLogout={logout} />;
  return children;
}

function Shell({ children, onLogout }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <header className="flex h-16 items-center justify-between px-6">
        <span className="flex items-center gap-2.5"><BrandMark /><span className="text-md font-semibold text-ink">Genesis</span></span>
        <Button variant="ghost" size="sm" icon={LogOut} onClick={onLogout}>{t('Sair')}</Button>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:pt-12">
        <div className="flex w-full max-w-sm flex-col items-center text-center">{children}</div>
      </main>
    </div>
  );
}

function LockScreen({ user, offline, onUnlocked, onLogout }) {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hasPasskey = !offline && Boolean(store.get(localStorage, passkeyFlag(user.id))) && browserSupportsWebAuthn();
  const offlineKey = 'owner:' + user.id;

  async function tryOffline(value) {
    const c = await checkOfflinePin(offlineKey, value);
    if (c.result === 'ok') return onUnlocked();
    setPin('');
    if (c.result === 'unknown') setError(t('Sem ligação: este aparelho ainda não tem o seu PIN guardado. Ligue a internet para desbloquear.'));
    else if (c.result === 'locked') setError(t('Demasiados PINs errados. Ligue a internet e entre com o email e a senha.'));
    else setError(t('PIN incorrecto.') + ' ' + t('Restam {n} tentativa(s).', { n: c.remaining }));
  }

  async function submit(value) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (offline) { await tryOffline(value); return; }
      await api.post('/api/lock/unlock', { pin: value }, { silent: true });
      rememberPin(offlineKey, value);
      onUnlocked();
    } catch (err) {
      if (!err?.response) { await tryOffline(value); return; }
      setPin('');
      const d = err.response.data || {};
      if (d.code === 'LOCK_TOO_MANY') { window.dispatchEvent(new CustomEvent('genesis:session-ended', { detail: { code: 'LOCK_TOO_MANY' } })); return; }
      setError(errorMessage(err, 'PIN incorrecto.') + (typeof d.remaining === 'number' ? ' ' + t('Restam {n} tentativa(s).', { n: d.remaining }) : ''));
    } finally { setBusy(false); }
  }

  async function withPasskey() {
    setBusy(true); setError('');
    try {
      const { data: options } = await api.post('/api/lock/passkey/options', null, { silent: true });
      const response = await startAuthentication({ optionsJSON: options });
      await api.post('/api/lock/passkey/unlock', { response }, { silent: true });
      onUnlocked();
    } catch (err) {
      if (err?.response?.data?.code === 'NO_PASSKEY') store.set(localStorage, passkeyFlag(user.id), null);
      if (err?.response?.data?.code === 'LOCK_TOO_MANY') { window.dispatchEvent(new CustomEvent('genesis:session-ended', { detail: { code: 'LOCK_TOO_MANY' } })); return; }
      // Cancelado pela pessoa (NotAllowedError): sem mensagem, fica o PIN.
      if (err?.name !== 'NotAllowedError') setError(err?.response ? errorMessage(err) : t('O Face ID não funcionou. Use o PIN.'));
    } finally { setBusy(false); }
  }

  return (
    <Shell onLogout={onLogout}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent"><Lock size={20} /></span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">{t('Painel bloqueado')}</h1>
      <p className="mb-6 mt-1 text-base text-ink-muted">{t('Olá, {name}. Introduza o seu PIN para continuar.', { name: (user.name || '').split(' ')[0] })}</p>
      {offline && <Alert tone="warning" className="mb-5 w-full text-left">{t('Sem ligação: depois de desbloquear vê os dados guardados neste aparelho, só para consulta.')}</Alert>}
      {error && <Alert tone="danger" className="mb-5 w-full text-left">{error}</Alert>}
      <PinPad value={pin} onChange={setPin} onComplete={submit} disabled={busy} length={4} />
      {hasPasskey && <Button className="mt-6" icon={Fingerprint} onClick={withPasskey} disabled={busy}>{t('Usar Face ID / impressão digital')}</Button>}
    </Shell>
  );
}

function CreatePin({ user, onDone, onLogout }) {
  const { t } = useI18n();
  const [step, setStep] = useState('first'); // first -> confirm -> passkey
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [canPasskey, setCanPasskey] = useState(false);

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    platformAuthenticatorIsAvailable().then(setCanPasskey).catch(() => {});
  }, []);

  async function onComplete(value) {
    if (step === 'first') { setFirst(value); setPin(''); setStep('confirm'); return; }
    if (value !== first) { setError(t('Os PINs não coincidem. Comece de novo.')); setFirst(''); setPin(''); setStep('first'); return; }
    setBusy(true); setError('');
    try {
      await api.put('/api/lock/pin', { pin: value }, { silent: true });
      rememberPin('owner:' + user.id, value);
      if (canPasskey) setStep('passkey'); else onDone();
    } catch (err) {
      setPin(''); setError(errorMessage(err));
    } finally { setBusy(false); }
  }

  async function addPasskey() {
    setBusy(true); setError('');
    try {
      const { data: options } = await api.post('/api/lock/passkey/register-options', null, { silent: true });
      const response = await startRegistration({ optionsJSON: options });
      await api.post('/api/lock/passkey/register', { response, name: navigator.platform || null }, { silent: true });
      store.set(localStorage, passkeyFlag(user.id), '1');
      onDone();
    } catch (err) {
      if (err?.name === 'NotAllowedError') { onDone(); return; }
      setError(err?.response ? errorMessage(err) : t('Não foi possível activar o Face ID neste aparelho. Pode usar só o PIN.'));
    } finally { setBusy(false); }
  }

  if (step === 'passkey') {
    return (
      <Shell onLogout={onLogout}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent"><Fingerprint size={22} /></span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">{t('Usar Face ID / impressão digital?')}</h1>
        <p className="mb-6 mt-1 text-base text-ink-muted">{t('Desbloqueia o painel com a cara ou o dedo, sem escrever o PIN. O PIN continua a funcionar.')}</p>
        {error && <Alert tone="danger" className="mb-5 w-full text-left">{error}</Alert>}
        <Button variant="primary" size="lg" block icon={Fingerprint} loading={busy} onClick={addPasskey}>{t('Activar neste aparelho')}</Button>
        <Button variant="ghost" className="mt-3" onClick={onDone} disabled={busy}>{t('Agora não')}</Button>
      </Shell>
    );
  }
  return (
    <Shell onLogout={onLogout}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent"><Lock size={20} /></span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">{step === 'first' ? t('Crie o PIN do seu painel') : t('Confirme o PIN')}</h1>
      <p className="mb-6 mt-1 text-base text-ink-muted">
        {step === 'first'
          ? t('4 dígitos, só seus. O Genesis pede-o sempre que abre a app e depois de 5 minutos sem mexer, para ninguém ver os números da loja no seu telemóvel.')
          : t('Escreva o mesmo PIN outra vez.')}
      </p>
      {error && <Alert tone="danger" className="mb-5 w-full text-left">{error}</Alert>}
      <PinPad value={pin} onChange={setPin} onComplete={onComplete} disabled={busy} length={4} />
    </Shell>
  );
}

export { passkeyFlag };
