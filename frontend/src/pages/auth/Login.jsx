import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { SESSION_MESSAGES } from '../../utils/api';
import { useSession } from '../../utils/session';
import { errorMessage } from '../../utils/format';
import { Alert, Button, Input } from '../../components/ui';
import AuthLayout from './AuthLayout';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const googleRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const reason = SESSION_MESSAGES[params.get('motivo')];

  const afterLogin = useCallback(async (user) => {
    if (user.role === 'super_admin') {
      setError('A conta de administração entra no painel de administração, não aqui.');
      await api.post('/api/auth/logout').catch(() => {});
      return;
    }
    await reload();
    const back = params.get('voltar');
    navigate(user.tenant && user.tenant.onboarding_completed === false ? '/onboarding' : (back && back.startsWith('/app') ? back : '/app'), { replace: true });
  }, [navigate, params, reload]);

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

  useEffect(() => {
    if (!googleEnabled) return undefined;
    let cancelled = false;
    loadGsi().then((gsi) => {
      if (cancelled || !gsi || !googleRef.current) return;
      gsi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError(''); setErrorCode('');
          try {
            const res = await api.post('/api/auth/google', { credential });
            await afterLogin(res.data.user);
          } catch (err) { fail(err); }
        },
      });
      gsi.renderButton(googleRef.current, { theme: 'outline', size: 'large', width: 340, text: 'continue_with', locale: 'pt' });
      setGoogleReady(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [afterLogin]);

  return (
    <AuthLayout
      title="Entrar"
      description="Painel de gestão da sua loja."
      footer={(
        <div className="flex flex-col gap-2">
          <span>Ainda não tem conta? <Link to="/pedir-conta" className="font-medium text-accent hover:text-accent-hover">Pedir uma conta</Link></span>
          <span>No balcão? <Link to="/terminal" className="font-medium text-accent hover:text-accent-hover">Abrir o terminal de vendas</Link></span>
        </div>
      )}
    >
      {reason && !error && <Alert tone="info" className="mb-4">{reason}</Alert>}
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
          {errorCode === 'NOT_REGISTERED' && <> <Link className="font-medium underline" to="/pedir-conta">Pedir conta</Link></>}
          {errorCode === 'USE_TERMINAL' && <> <Link className="font-medium underline" to="/terminal">Ir para o terminal</Link></>}
        </Alert>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Input label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="-mt-1 text-right text-sm">
          <Link to="/recuperar-senha" className="text-ink-muted hover:text-ink">Esqueceu a senha?</Link>
        </div>
        <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!email || !password}>Entrar</Button>
      </form>
      {googleEnabled && (
        <>
          {/* O separador so aparece quando o botao do Google carregou (sem rede, nada). */}
          {googleReady && <div className="my-5 flex items-center gap-3 text-xs text-ink-faint"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>}
          <div ref={googleRef} className="flex justify-center" />
        </>
      )}
    </AuthLayout>
  );
}
