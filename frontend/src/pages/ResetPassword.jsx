import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, KeyRound, Lock, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { AmbientLayer, SheenBar } from '../components/ui';
import { setLang, useLang } from '../i18n';

// Normaliza os erros: o backend devolve string OU array do Zod.
// Renderizar um objecto faz o React rebentar no meio do ecrã.
const messageOf = (err, fallback) => {
  const raw = err?.response?.data?.error;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (Array.isArray(raw)) {
    const joined = raw.map((e) => e && e.message).filter(Boolean).join(' · ');
    if (joined) return joined;
  }
  return fallback;
};

const inputClass =
  'w-full rounded-xl border border-line-strong bg-elev2 px-3.5 py-3 text-base text-ink ' +
  'outline-none transition-all duration-200 placeholder:text-muted focus:border-brand ' +
  'focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]';

export default function ResetPassword() {
  const { t, lang } = useLang();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [done, setDone] = useState(false);

  // Modo por código: entra só se o servidor não aceitar o reset directo.
  const [codeMode, setCodeMode] = useState(false);
  const [sent, setSent] = useState(false);

  // Troca imediata de senha. Não há servidor de email, por isso não há código
  // nem email: esta é a via que funciona hoje para o owner E para o super
  // admin — o backend procura a conta pelo email e não distingue papel.
  const handleInstantReset = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('reset.mismatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password-instant', { email, password });
      setWarning(response.data.warning || '');
      setDone(true);
    } catch (err) {
      const reason = err?.response?.data?.code;
      if (reason === 'RESET_DISABLED' || err?.response?.status === 404 || err?.response?.status === 503) {
        setCodeMode(true);
      } else {
        setError(messageOf(err, t('reset.invalid')));
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Rota por código (fallback oficial do backend) -----------------------
  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(messageOf(err, t('reset.invalid')));
    } finally {
      setLoading(false);
    }
  };

  const applyCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/reset-password', { email, code, password });
      setDone(true);
    } catch (err) {
      setError(messageOf(err, t('reset.invalid')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen auth-split">
      <AmbientLayer />

      {/* ---------------------- PAINEL DE VALOR (desktop) --------------------- */}
      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-aside-inner">
          <div className="auth-badge">
            <Sparkles size={14} strokeWidth={2.4} />
            <span>Genesis</span>
          </div>
          <h2 className="auth-aside-title">{t('reset.title')}</h2>
          <p className="auth-aside-text">{t('reset.lead')}</p>
          <ul className="auth-aside-list">
            <li><KeyRound size={16} strokeWidth={2.2} /><span>{t('reset.email')}</span></li>
            <li><Lock size={16} strokeWidth={2.2} /><span>{t('reset.newPassword')}</span></li>
            <li><ShieldCheck size={16} strokeWidth={2.2} /><span>{t('reset.goLogin')}</span></li>
          </ul>
        </div>
      </aside>

      {/* ------------------------------ FORMULÁRIO --------------------------- */}
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
              <button type="button" className={`lang ${lang === 'pt' ? 'active' : ''}`} onClick={() => setLang('pt')}>PT</button>
              <button type="button" className={`lang ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>

          <div className="auth-content">
            <div className="auth-kicker">{t('reset.kicker')}</div>
            <h1 className="auth-title">{t('reset.title')}</h1>
            <p className="auth-subtitle" style={{ marginTop: 0 }}>{t('reset.lead')}</p>

            {/* Aviso PERMANENTE enquanto o modo directo estiver ligado. */}
            <div className="auth-warning" role="alert">
              <ShieldAlert size={16} strokeWidth={2.3} aria-hidden="true" />
              <div>
                <strong>{t('reset.warningTitle')}</strong>
                <span>{t('reset.warning')}</span>
              </div>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            {done ? (
              <div className="auth-done">
                <div className="auth-done-icon"><ShieldCheck size={22} strokeWidth={2.4} aria-hidden="true" /></div>
                <h2>{t('reset.doneTitle')}</h2>
                <p>{t('reset.doneLead')}</p>
                {/* O aviso do servidor não é escondido: mostra-se sempre. */}
                {warning && <p className="auth-warning-inline">{warning}</p>}
                <Link to="/login" className="auth-submit">
                  <span>{t('reset.goLogin')}</span>
                  <ArrowRight size={17} strokeWidth={2.3} aria-hidden="true" />
                </Link>
              </div>
            ) : !codeMode ? (
              <form onSubmit={handleInstantReset} className="auth-form">
                <div className="field-group">
                  <label htmlFor="rp-email" className="field-label">{t('reset.email')}</label>
                  <input id="rp-email" type="email" value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass} placeholder={t('reset.emailPlaceholder')}
                    autoComplete="username" required />
                </div>

                <div className="field-group">
                  <label htmlFor="rp-pass" className="field-label">{t('reset.newPassword')}</label>
                  <input id="rp-pass" type="password" value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass} placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password" minLength={8} required />
                </div>

                <div className="field-group">
                  <label htmlFor="rp-confirm" className="field-label">{t('reset.confirmPassword')}</label>
                  <input id="rp-confirm" type="password" value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className={inputClass} placeholder="••••••••"
                    autoComplete="new-password" minLength={8} required />
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading
                    ? <span className="g-spinner" role="status" aria-label={t('reset.submitting')} />
                    : <Lock size={17} strokeWidth={2.3} aria-hidden="true" />}
                  <span>{loading ? t('reset.submitting') : t('reset.submit')}</span>
                </button>
              </form>
            ) : !sent ? (
              <form onSubmit={requestCode} className="auth-form">
                <p className="auth-hint">{t('reset.fallbackLead')}</p>

              <div className="field-group">
                <label htmlFor="rb-email" className="field-label">{t('reset.email')}</label>
                <input
                  id="rb-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder={t('reset.emailPlaceholder')}
                  autoComplete="username"
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <span className="g-spinner" role="status" aria-label={t('reset.submitting')} />
                  : <KeyRound size={17} strokeWidth={2.3} aria-hidden="true" />}
                <span>{loading ? t('reset.submitting') : t('reset.sendCode')}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={applyCode} className="auth-form">
              <div className="field-group">
                <label htmlFor="rb-code" className="field-label">{t('reset.code')}</label>
                <input
                  id="rb-code"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className={inputClass}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="rb-pass" className="field-label">{t('reset.newPassword')}</label>
                <input
                  id="rb-pass"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <span className="g-spinner" role="status" aria-label={t('reset.submitting')} />
                  : <Lock size={17} strokeWidth={2.3} aria-hidden="true" />}
                <span>{loading ? t('reset.submitting') : t('reset.submit')}</span>
              </button>
            </form>
          )}

            <div className="text-row" style={{ marginTop: 18 }}>
              <Link to="/login" className="text-link">{t('reset.back')}</Link>
            </div>
          </div>

          <div className="auth-foot">
            <Globe size={13} strokeWidth={2.2} />
            <span>{t('login.foot')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
