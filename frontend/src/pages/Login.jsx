import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Globe, Lock, ShieldCheck, Sparkles, Store } from 'lucide-react';
import axios from '../utils/api';
import { AmbientLayer, SheenBar } from '../components/ui';
import { setLang, useLang } from '../i18n';

// Client ID do Google Identity Services. Fica em frontend/.env como
// VITE_GOOGLE_CLIENT_ID e tem de ter formato XXXX.apps.googleusercontent.com.
// Uma API Key (AIza...) NÃO serve para autenticar — só para ativar APIs.
// Sem isto o botão continua visível mas explica-se, em vez de falhar em silêncio.
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const googleClientIdValid = GOOGLE_CLIENT_ID.includes('apps.googleusercontent.com');

// Email de demonstração apenas como placeholder do formulário — nunca
// pre-preenchido. Campo vem VAZIO.
const rolePresets = {
  owner: { label: 'Gestor da loja', email: '' },
  cashier: { label: 'Caixista', email: '' }
};

// Os erros do backend voltam em formatos distintos: string directa, ou array
// do Zod [{path, message}]. Sem normalizar, React rebenta ao tentar renderizar
// um objecto como texto — que é como uma falha no meio da página.
const messageOf = (err, fallback) => {
  const raw = err?.response?.data?.error;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (Array.isArray(raw)) {
    const joined = raw.map((e) => e && e.message).filter(Boolean).join(' · ');
    if (joined) return joined;
  }
  if (raw && typeof raw === 'object' && typeof raw.message === 'string') return raw.message;
  return fallback;
};

// Carrega o script do Google Identity Services uma única vez.
const loadGsi = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
  const existing = document.getElementById('gsi-script');
  if (existing) {
    existing.addEventListener('load', () => resolve(window.google?.accounts?.id));
    existing.addEventListener('error', reject);
    return;
  }
  const el = document.createElement('script');
  el.id = 'gsi-script';
  el.src = 'https://accounts.google.com/gsi/client';
  el.async = true;
  el.defer = true;
  el.onload = () => resolve(window.google?.accounts?.id);
  el.onerror = () => reject(new Error('Não foi possível carregar o script do Google.'));
  document.head.appendChild(el);
});

// Marca do Google em SVG (multicolor). Evita depender de imagem externa e
// mantém o botão de fallback alinhado com o resto do design.
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.4-4.6 7.1l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.5z" />
    <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.9-6.2z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.9l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const Login = ({ mode = 'owner' }) => {
  const activeMode = ['owner', 'cashier'].includes(mode) ? mode : 'owner';
  const preset = rolePresets[activeMode];

  // Email VAZIO — nunca pré-preencher emails de demonstração.
  const [email, setEmail] = useState(preset.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState(null); // 'request-account' | null
  const [loading, setLoading] = useState(false);
  const [googleState, setGoogleState] = useState('idle'); // idle | checking | blocked
  const googleBtnRef = useRef(null);

  const { t, lang } = useLang();

  const redirectByRole = useCallback((role, tenant) => {
    // O Super Admin usa o admin-frontend (porta 5175). Se uma conta
    // super_admin fizer login aqui por engano, recusa-se com mensagem
    // em vez de a enviar para uma rota admin dentro deste bundle.
    if (role === 'super_admin') {
      setError(t('login.superAdminBlocked'));
      return;
    }
    if (role === 'owner') {
      const onboardingComplete = tenant?.onboarding_completed !== false;
      window.location.href = onboardingComplete ? '/owner' : '/onboarding';
    } else {
      window.location.href = '/cashier';
    }
  }, [t]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setHint(null);

    try {
      const response = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
      redirectByRole(response.data.user.role, response.data.user.tenant);
    } catch (err) {
      setError(messageOf(err, t('login.invalid')));
    } finally {
      setLoading(false);
    }
  };

  // O Google devolve um ID token; só o backend o valida. Nada de confiar
  // no email que o browser diz — é o servidor que decide se a conta existe.
  const handleGoogleCredential = useCallback(async (credential) => {
    setGoogleState('checking');
    setError('');
    setHint(null);
    try {
      const response = await axios.post('/api/auth/google', { credential }, { withCredentials: true });
      redirectByRole(response.data.user.role, response.data.user.tenant);
    } catch (err) {
      const code = err?.response?.data?.code;
      setGoogleState('idle');
      if (code === 'GOOGLE_NOT_CONFIGURED') {
        setError(t('login.googleNotConfigured'));
      } else if (code === 'NOT_REGISTERED' || err?.response?.status === 404) {
        // Pedido do fundador: dizer que NÃO está registado e apontar para
        // "pedir conta". Nenhuma conta é criada em silêncio.
        setError(messageOf(err, t('login.googleNotRegistered')));
        setHint('request-account');
      } else {
        setError(messageOf(err, t('login.googleNotRegistered')));
      }
    }
  }, [redirectByRole, t]);

  // Carrega o SDK do Google e desenha o botão oficial dentro do nosso wrapper.
  useEffect(() => {
    if (!googleClientIdValid) return undefined;
    let cancelled = false;

    loadGsi()
      .then((id) => {
        if (cancelled || !id) return;
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => handleGoogleCredential(response.credential)
        });
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 300,
            text: 'continue_with',
            locale: lang === 'en' ? 'en' : 'pt'
          });
        }
      })
      .catch(() => { /* sem rede, o botão de fallback continua utilizável */ });

    return () => { cancelled = true; };
  }, [handleGoogleCredential, lang]);

  const modeTitle = activeMode === 'cashier' ? t('login.titleCashier') : t('login.titleOwner');
  const modeDescription = activeMode === 'cashier' ? t('login.descCashier') : t('login.descOwner');

  return (
    <div className="auth-screen auth-split">
      <AmbientLayer />

      {/* ---------------------- PAINEL DE VALOR (desktop) --------------------- */}
      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-aside-inner">
          <div className="auth-badge">
            <Sparkles size={14} strokeWidth={2.4} />
            Plataforma de gestão da sua loja
          </div>
          <h2 className="auth-aside-title">
            Do stock ao caixa,<br />
            num só sistema.
          </h2>
          <p className="auth-aside-text">
            Vendas, stock, fornecedores, fiados e resultados — com os dados
            da sua empresa isolados e seguros.
          </p>
          <ul className="auth-points">
            <li>
              <span className="auth-point-icon"><Store size={16} /></span>
              Operação do dia em segundos
            </li>
            <li>
              <span className="auth-point-icon"><ShieldCheck size={16} /></span>
              Isolamento por empresa e por função
            </li>
            <li>
              <span className="auth-point-icon"><Building2 size={16} /></span>
              Gestão multi-loja desde o início
            </li>
          </ul>
          <div className="auth-trust">
            <Lock size={13} strokeWidth={2.2} />
            Sessão protegida e auditada
          </div>
        </div>
      </aside>

      {/* ---------------------------- FORMULÁRIO ------------------------------ */}
      <div className="auth-main">
        <div className="auth-shell g-track g-track-soft">
          <span className="g-track-glow" aria-hidden="true" />
          <SheenBar />

          <div className="auth-header">
            <div className="brand-wrap">
              <div className="brand-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 9V7a4 4 0 118 0v2" />
                  <rect x="5" y="9" width="14" height="10" rx="2" />
                </svg>
              </div>
              <span className="brand-name">Genesis</span>
            </div>

            <div className="language-switcher" aria-label="Idioma">
              <button
                type="button"
                className={`lang ${lang === 'pt' ? 'active' : ''}`}
                onClick={() => setLang('pt')}
                aria-pressed={lang === 'pt'}
              >PT</button>
              <button
                type="button"
                className={`lang ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >EN</button>
            </div>
          </div>

          <div className="auth-content">
            <div className="auth-kicker">
              {activeMode === 'cashier' ? t('login.kickerCashier') : t('login.kickerOwner')}
            </div>
            <h1 className="auth-title">{t('login.title')}</h1>
            <p className="auth-subtitle">{modeTitle}</p>
            <p className="auth-subtitle" style={{ marginTop: 0 }}>{modeDescription}</p>

            <form onSubmit={handleLogin} className="auth-form">
              {error && (
                <div className="auth-error" role="alert">{error}</div>
              )}

              <div className="field-group">
                <label htmlFor="email" className="field-label">{t('login.email')}</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                  placeholder={t('login.emailPlaceholder')}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="password" className="field-label">{t('login.password')}</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input"
                  placeholder={t('login.passwordPlaceholder')}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="g-spinner" role="status" aria-label={t('login.submitting')} /> : <Lock size={17} strokeWidth={2.3} aria-hidden="true" />}
                <span>{loading ? t('login.submitting') : t('login.submit')}</span>
                {!loading && <ArrowRight size={17} strokeWidth={2.3} aria-hidden="true" className="auth-submit-arrow" />}
              </button>

              <div className="text-row">
                <Link to="/forgot-password" className="text-link">{t('login.forgot')}</Link>
                {activeMode === 'owner' && <Link to="/request-account" className="text-link">{t('login.requestAccount')}</Link>}
              </div>

              {/* "Configurar nova empresa" foi REMOVIDO a pedido do fundador:
                  não deve existir no painel de login do dono. No mesmo lugar
                  passa a estar o login com Google. */}
              {activeMode === 'owner' && (
                <div className="auth-divider" aria-hidden="true"><span /></div>
              )}

              {activeMode === 'owner' && (
                <div className="auth-google">
                  <div
                    ref={googleBtnRef}
                    className="auth-google-btn"
                    key={googleClientIdValid ? 'real' : 'fallback'}
                  />

                  {!googleClientIdValid && (
                    <button
                      type="button"
                      className="auth-google-fallback"
                      onClick={() => {
                        setGoogleState('blocked');
                        setError(t('login.googleNotConfigured'));
                      }}
                    >
                      <GoogleMark />
                      <span>{t('login.google')}</span>
                    </button>
                  )}

                  {googleState === 'blocked' && hint === 'request-account' && (
                    <p className="auth-hint" role="status">
                      <Link to="/request-account" className="text-link">{t('login.requestAccount')}</Link>
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="auth-foot">
            <Globe size={13} strokeWidth={2.2} />
            <span>{t('login.foot')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
