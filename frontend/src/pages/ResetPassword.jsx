import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, KeyRound, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { AmbientLayer, SheenBar } from '../components/ui';
import SecurityGateIcon from '../components/SecurityGateIcon';
import ThemeToggle from '../theme/ThemeToggle';
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

// Este ecrã tem duas fases, sem atalhos:
//   1. `!verified` — o utilizador pede o código e confirma-o. Só aqui é que
//      o botão/inputs da nova senha existem sequer no DOM.
//   2. `verified`  — com o código do email validado, escolhe a nova senha.
//
// O servidor continua a exigir o código em /api/auth/reset-password; o
// browser apenas não mostra a nova senha antes disso.
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
  const [done, setDone] = useState(false);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);

  // Verificar o código de 6 dígitos recebido por email.
  // Solicitar envio de codigo de 6 digitos (email com fallback whatsapp)
  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
      setVerified(false);
    } catch (err) {
      setError(messageOf(err, t('reset.invalid') || 'Erro ao solicitar código de recuperação.'));
    } finally {
      setLoading(false);
    }
  };

  // 1ª fase: confirmar o código do email, SEM trocar a senha.
  // (legado — mantido para referência; o fluxo usa confirmCode/applyPassword)
  const applyCode = async (event) => {
    event.preventDefault();
    confirmCode();
  };

  // 2ª fase: confirmar o código do email, SEM pedir a senha ainda.
  const confirmCode = () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t('reset.invalid') || 'Código inválido ou expirado.');
      return;
    }
    setVerified(true);
  };

  // 3ª fase: só corre com o código já confirmado pelo utilizador.
  // O servidor volta a exigir { email, code, password } e conta tentativas;
  // um código errado aqui não troca nada e mostra o erro do backend.
  const applyPassword = async (event) => {
    event.preventDefault();
    setError('');
    if (!verified) return;
    if (password.length < 6) {
      setError(t('reset.invalid') || 'A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError(t('reset.mismatch') || 'As palavras-passe não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email, code: code.trim(), password });
      setDone(true);
    } catch (err) {
      // Código errado/expirado ou conta alterada: volta à fase do código.
      setVerified(false);
      setError(messageOf(err, t('reset.invalid') || 'Código inválido ou expirado.'));
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

            {/* O cadeado só "abre" depois do código do email confirmado. */}
            <SecurityGateIcon unlocked={verified} />

            {error && <div className="auth-error" role="alert">{error}</div>}

            {done ? (
              <div className="auth-done">
                <div className="auth-done-icon"><ShieldCheck size={22} strokeWidth={2.4} aria-hidden="true" /></div>
                <h2>{t('reset.doneTitle')}</h2>
                <p>{t('reset.doneLead')}</p>
                <Link to="/login" className="auth-submit">
                  <span>{t('reset.goLogin')}</span>
                  <ArrowRight size={17} strokeWidth={2.3} aria-hidden="true" />
                </Link>
              </div>
            ) : !sent ? (
              <div className="auth-done">
                <div className="auth-done-icon"><ShieldCheck size={22} strokeWidth={2.4} aria-hidden="true" /></div>
                <h2>{t('reset.doneTitle')}</h2>
                <p>{t('reset.doneLead')}</p>
                <Link to="/login" className="auth-submit">
                  <span>{t('reset.goLogin')}</span>
                  <ArrowRight size={17} strokeWidth={2.3} aria-hidden="true" />
                </Link>
              </div>
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
          ) : !verified ? (
            // 2ª FASE — só código. A nova senha ainda não existe neste ecrã:
            // o utilizador tem MESMO de ir ao email buscar o código.
            <form onSubmit={(event) => { event.preventDefault(); confirmCode(); }} className="auth-form">
              <p className="auth-hint">{t('reset.codeSent')}</p>
              <div className="field-group">
                <label htmlFor="rb-code" className="field-label">{t('reset.code')}</label>
                <input
                  id="rb-code"
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={inputClass}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <span className="g-spinner" role="status" aria-label={t('reset.submitting')} />
                  : <ShieldCheck size={17} strokeWidth={2.3} aria-hidden="true" />}
                <span>{loading ? t('reset.submitting') : (t('reset.verifyCode') || 'Confirmar código')}</span>
              </button>

              <button
                type="button"
                onClick={requestCode}
                disabled={loading}
                style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-text)', fontSize: '0.85rem', fontWeight: 600 }}
              >
                {t('reset.resendCode') || 'Não recebi o código — enviar de novo'}
              </button>
            </form>
          ) : (
            // 3ª FASE — só aparece com o código confirmado.
            <form onSubmit={applyPassword} className="auth-form">
              <p className="auth-hint">{t('reset.codeVerified') || 'Código confirmado. Escolhe agora a nova palavra-passe.'}</p>
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
                  minLength={6}
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="rb-pass2" className="field-label">{t('reset.confirmPassword') || 'Repetir palavra-passe'}</label>
                <input
                  id="rb-pass2"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
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

            <div className="text-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
              <Link to="/login" className="text-link">{t('reset.back')}</Link>
              <ThemeToggle compact />
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
