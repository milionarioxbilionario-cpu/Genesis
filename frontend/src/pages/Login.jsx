import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/api';

const rolePresets = {
  owner: {
    label: 'Dono',
    email: 'sergio@genesis.co.mz',
    password: 'genesis123'
  },
  cashier: {
    label: 'Caixa',
    email: 'caixa@genesis.co.mz',
    password: 'genesis123'
  },
  super_admin: {
    label: 'Super Admin',
    email: 'admin@genesis.co.mz',
    password: 'genesis123'
  }
};

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('owner');
  const [email, setEmail] = useState(rolePresets.owner.email);
  const [password, setPassword] = useState(rolePresets.owner.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role) => {
    if (role === 'super_admin') window.location.href = '/admin';
    else if (role === 'owner') window.location.href = '/owner';
    else window.location.href = '/pos';
  };

  const handleRoleChange = (role) => {
    const preset = rolePresets[role];
    setSelectedRole(role);
    setEmail(preset.email);
    setPassword(preset.password);
    setError('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
      redirectByRole(response.data.user.role);
    } catch (err) {
      setError(err?.response?.data?.error || 'Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="auth-subtitle">Gestão de retalho multi-empresa, do caixa ao painel do dono.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="field-group">
              <p className="field-caption">Entrar como</p>
              <div className="role-switcher">
                {Object.entries(rolePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRoleChange(key)}
                    className={`role-tab ${selectedRole === key ? 'selected' : ''}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <div className="field-group">
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="auth-input"
                placeholder="sergio@genesis.co.mz"
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
              <Link to="/request-account" className="text-link">Pedir conta</Link>
            </div>

            <Link to="/onboarding" className="company-link">
              <span>Configurar nova empresa</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
