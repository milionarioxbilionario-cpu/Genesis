import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('owner@genesis.local');
  const [password, setPassword] = useState('<password-demo-removida-do-historico>');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role) => {
    if (role === 'super_admin') window.location.href = '/admin';
    else if (role === 'owner') window.location.href = '/owner';
    else window.location.href = '/pos';
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/google', {
        email: 'demo@genesis.app',
        name: 'Gestor Demo'
      }, { withCredentials: true });
      redirectByRole(response.data.user.role);
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível iniciar sessão com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_30%,#111827_100%)] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(59,130,246,0.25)] backdrop-blur-md md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 p-8 md:flex md:flex-col md:justify-between">
            <div className="absolute -left-12 top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-slate-900/10 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/90">Genesis</span>
              <h1 className="mt-8 max-w-md text-4xl font-black leading-tight text-white">O negócio em um único painel.</h1>
              <p className="mt-4 max-w-md text-base text-white/85">
                Vendas, stock, clientes, faturação e controlo de caixa em uma plataforma moderna para lojas de Moçambique.
              </p>
            </div>

            <div className="relative z-10 grid gap-3">
              {[
                'Dashboard em tempo real',
                'POS rápido e seguro',
                'Controle de caixa e relatórios'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-6 text-slate-900 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Bem-vindo</p>
              <h2 className="mt-2 text-3xl font-black">Entrar na conta</h2>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-70"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">G</span>
              Continuar com Google
            </button>

            <div className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              ou
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="seu@email.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Senha</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="••••••••"
                  required
                />
              </label>

              <div className="flex items-center justify-between text-sm">
                <Link to="/request-account" className="font-medium text-sky-700 hover:text-sky-800">Criar conta</Link>
                <Link to="/forgot-password" className="font-medium text-slate-600 hover:text-slate-900">Esqueci-me da senha</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {loading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-sky-50 p-4 text-sm text-sky-700">
              Demo: <strong>owner@genesis.local</strong> / <strong><password-demo-removida-do-historico></strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
