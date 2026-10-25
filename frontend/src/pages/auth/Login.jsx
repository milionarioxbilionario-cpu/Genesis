import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { SESSION_MESSAGES } from '../../utils/api';
import { useSession } from '../../utils/session';
import { errorMessage } from '../../utils/format';
import { Alert, Button, Input } from '../../components/ui';
import AuthLayout from './AuthLayout';
import { useI18n } from '../../i18n/react';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const googleEnabled = GOOGLE_CLIENT_ID.includes('apps.googleusercontent.com');

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const el = document.createElement('script');
    el.src = 'https://accounts.google.com/gsi/client';
    el.async = true;
    el.onload = () => resolve(window.google?.accounts?.id);
    el.onerror = reject;
    document.head.appendChild(el);
  });
}

// Entrada do DONO da loja. Caixistas entram no terminal (PIN); o Super Admin
// no painel proprio.
export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { reload } = useSession();
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const googleRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const reasonPt = SESSION_MESSAGES[params.get('motivo')];
  const reason = reasonPt && t(reasonPt);

  const afterLogin = useCallback(async (user) => {
    if (user.role === 'super_admin') {
      setError(t('A conta de administração entra no painel de administração, não aqui.'));
      await api.post('/api/auth/logout').catch(() => {});
      return;
    }
    // Acabou de entrar com a senha/Google: o painel abre sem pedir o PIN (12.4).
    try { sessionStorage.setItem('genesis.unlocked', '1'); } catch { /* modo privado */ }
    await reload();
    const back = params.get('voltar');
    navigate(user.tenant && user.tenant.onboarding_completed === false ? '/onboarding' : (back && back.startsWith('/app') ? back : '/app'), { replace: true });
  }, [navigate, params, reload, t]);

  const fail = (err) => {
    setErrorCode(err?.response?.data?.code || '');
    setError(errorMessage(err, 'Email ou senha incorrectos.'));
  };

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError(''); setErrorCode('');
    try {
      const res = await api.post('/api/auth/login', { email: email.trim(), password });
      await afterLogin(res.data.user);
    } catch (err) { fail(err); } finally { setLoading(false); }
  }

  // O callback do Google usa sempre a versao mais recente de afterLogin (muda com a lingua).
  const afterLoginRef = useRef(afterLogin);
  afterLoginRef.current = afterLogin;

  // initialize corre UMA vez; so o botao e redesenhado quando a lingua muda.
  const [gsi, setGsi] = useState(null);
  useEffect(() => {
    if (!googleEnabled) return undefined;
    let cancelled = false;
    loadGsi().then((id) => {
      if (cancelled || !id) return;
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError(''); setErrorCode('');
          try {
            const res = await api.post('/api/auth/google', { credential });
            await afterLoginRef.current(res.data.user);
          } catch (err) { fail(err); }
        },
      });
      setGsi(id);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Troca de lingua sem piscar: o botao novo e desenhado por cima, invisivel, e so
  // substitui o antigo quando o iframe do Google acabou de carregar (ou ao fim de 2 s).
  useEffect(() => {
    const host = googleRef.current;
    if (!gsi || !host) return undefined;
    const next = document.createElement('div');
    next.className = 'absolute inset-0 flex justify-center';
    next.style.visibility = 'hidden';
    host.appendChild(next);
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      [...host.children].forEach((c) => { if (c !== next) c.remove(); });
      next.style.visibility = '';
      setGoogleReady(true);
    };
    const timer = setTimeout(show, 2000);
    const watch = new MutationObserver(() => {
      const frame = next.querySelector('iframe');
      if (frame) { watch.disconnect(); frame.addEventListener('load', show, { once: true }); }
    });
    watch.observe(next, { childList: true, subtree: true });
    gsi.renderButton(next, { theme: 'outline', size: 'large', width: 340, text: 'continue_with', locale: lang });
    return () => {
      clearTimeout(timer);
      watch.disconnect();
      if (!done) next.remove();
    };
  }, [gsi, lang]);

  return (
    <AuthLayout
      title={t('Entrar')}
      description={t('Painel de gestão da sua loja.')}
      footer={(
        <div className="flex flex-col gap-2">
          <span>{t('Ainda não tem conta?')} <Link to="/pedir-conta" className="font-medium text-accent hover:text-accent-hover">{t('Pedir uma conta')}</Link></span>
          <span>{t('No balcão?')} <Link to="/terminal" className="font-medium text-accent hover:text-accent-hover">{t('Abrir o terminal de vendas')}</Link></span>
        </div>
      )}
    >
      {reason && !error && <Alert tone="info" className="mb-4">{reason}</Alert>}
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
          {errorCode === 'NOT_REGISTERED' && <> <Link className="font-medium underline" to="/pedir-conta">{t('Pedir conta')}</Link></>}
          {errorCode === 'USE_TERMINAL' && <> <Link className="font-medium underline" to="/terminal">{t('Ir para o terminal')}</Link></>}
        </Alert>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Input label={t('Email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Input label={t('Senha')} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="-mt-1 text-right text-sm">
          <Link to="/recuperar-senha" className="text-ink-muted hover:text-ink">{t('Esqueceu a senha?')}</Link>
        </div>
        <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!email || !password}>{t('Entrar')}</Button>
      </form>
      {googleEnabled && (
        <>
          {/* O separador so aparece quando o botao do Google carregou (sem rede, nada). */}
          {googleReady && <div className="my-5 flex items-center gap-3 text-xs text-ink-faint"><span className="h-px flex-1 bg-border" />{t('ou')}<span className="h-px flex-1 bg-border" /></div>}
          {/* Altura fixa: a troca do botao nao mexe no resto da pagina. */}
          <div ref={googleRef} className={googleReady ? 'relative h-11' : 'relative h-0'} />
        </>
      )}
    </AuthLayout>
  );
}
