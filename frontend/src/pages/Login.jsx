import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Globe, Lock, ShieldCheck, Sparkles, Store } from 'lucide-react';
import axios from '../utils/api';
import { getAuthSession, getPortalRoute, saveAuthSession } from '../utils/auth';
import { AmbientLayer, SheenBar } from '../components/ui';

// Credenciais de demonstração NUNCA são pré-preenchidas no formulário.
// O email é apenas uma sugestão; a password começa sempre vazia.
const rolePresets = {
  owner: {
    label: 'Gestor da loja',
    email: 'owner@genesis.local'
  },
  cashier: {
    label: 'Caixista',
    email: 'cashier@genesis.local'
  }
};

const Login = ({ mode = 'owner' }) => {
  const activeMode = ['owner', 'cashier'].includes(mode) ? mode : 'owner';
  const preset = rolePresets[activeMode];
  const [email, setEmail] = useState(preset.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role, tenant) => {
    // O Super Admin usa o admin-frontend (porta 5175). Se uma conta
    // super_admin fizer login aqui por engano, recusa-se com mensagem
    // em vez de a enviar para uma rota admin dentro deste bundle.
    if (role === 'super_admin') {
      setError('A conta de Super Admin usa o painel dedicado (admin-frontend).');
      return;
    }
    if (role === 'owner') {
      const onboardingComplete = tenant?.onboarding_completed !== false;
      window.location.href = onboardingComplete ? '/owner' : '/onboarding';
    } else window.location.href = '/cashier';
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
      redirectByRole(response.data.user.role, response.data.user.tenant);
    } catch (err) {
      setError(err?.response?.data?.error || 'Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const modeTitle = activeMode === 'cashier' ? 'Acesso do Caixista' : 'Acesso do Gestor da Loja';
  const modeDescription = activeMode === 'cashier'
      ? 'Operação do caixa e vendas do dia.'
      : 'Gestão de stock, vendas, relatórios e subscrição do negócio.';

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
              <button type="button" className="lang active">PT</button>
              <button type="button" className="lang">EN</button>
            </div>
          </div>

          <div className="auth-content">
            <div className="auth-kicker">
              {activeMode === 'cashier' ? 'Caixa' : 'Gestão'}
            </div>
            <h1 className="auth-title">Entrar no Genesis</h1>
            <p className="auth-subtitle">{modeTitle}</p>
            <p className="auth-subtitle" style={{ marginTop: 0 }}>{modeDescription}</p>

            <form onSubmit={handleLogin} className="auth-form">
              {error && (
                <div className="auth-error" role="alert">{error}</div>
              )}

              <div className="field-group">
                <label htmlFor="email" className="field-label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                  placeholder="email@empresa.com"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="password" className="field-label">Senha</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="g-spinner" role="status" aria-label="A entrar" /> : <Lock size={17} strokeWidth={2.3} aria-hidden="true" />}
                <span>{loading ? 'A entrar...' : 'Entrar'}</span>
                {!loading && <ArrowRight size={17} strokeWidth={2.3} aria-hidden="true" className="auth-submit-arrow" />}
              </button>

              <div className="text-row">
                <Link to="/forgot-password" className="text-link">Esqueci a senha</Link>
                {activeMode === 'owner' && <Link to="/request-account" className="text-link">Pedir conta</Link>}
              </div>

              {activeMode === 'owner' && (
                <Link to="/onboarding" className="company-link">
                  <span className="company-link-label">
                    <Building2 size={16} strokeWidth={2.2} aria-hidden="true" />
                    Configurar nova empresa
                  </span>
                  <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              )}
            </form>
          </div>

          <div className="auth-foot">
            <Globe size={13} strokeWidth={2.2} />
            <span>Moçambique · Valores em MZN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
