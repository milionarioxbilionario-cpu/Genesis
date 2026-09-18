import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { getAuthSession, getPortalRoute, saveAuthSession } from '../utils/auth';

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
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-lock" aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 48V38C32 20.3269 46.3269 6 64 6C81.6731 6 96 20.3269 96 38V48" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
            <rect x="18" y="48" width="84" height="60" rx="14" stroke="currentColor" strokeWidth="8"/>
            <rect x="52" y="70" width="24" height="18" rx="6" stroke="currentColor" strokeWidth="8"/>
          </svg>
        </div>

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
          <h1 className="auth-title">Entrar no Genesis</h1>
          <p className="auth-subtitle">{modeTitle}</p>
          <p className="auth-subtitle" style={{ marginTop: 0 }}>{modeDescription}</p>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="auth-error">{error}</div>
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
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              <span>{loading ? 'A entrar...' : 'Entrar'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </button>

            <div className="text-row">
              <Link to="/forgot-password" className="text-link">Esqueci a senha</Link>
              {activeMode === 'owner' && <Link to="/request-account" className="text-link">Pedir conta</Link>}
            </div>

            {activeMode === 'owner' && (
              <Link to="/onboarding" className="company-link">
                <span>Configurar nova empresa</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
