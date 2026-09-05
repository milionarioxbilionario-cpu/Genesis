import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const sendCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setSent(true);
      setMessage(response.data.message || 'Código enviado para o seu email.');
      if (response.data.demoCode) {
        setCode(response.data.demoCode);
      }
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Não foi possível enviar o código.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await api.post('/api/auth/reset-password', { email, code, password });
      setMessage(response.data.message || 'Senha redefinida com sucesso.');
      setSent(false);
      setCode('');
      setPassword('');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(15,23,42,0.45)] backdrop-blur md:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 p-10 md:flex md:flex-col md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">Genesis</div>
              <h1 className="mt-8 text-4xl font-black leading-tight">Recupere o acesso da sua conta em segundos.</h1>
            </div>
            <div className="rounded-2xl border border-white/20 bg-slate-900/10 p-5 text-sm leading-6 text-white/90">
              Segurança em 3 passos: pedir código, confirmar e redefinir a password. Tudo em menos de um minuto.
            </div>
          </div>

          <div className="bg-slate-50 p-6 text-slate-900 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Acesso</p>
                <h2 className="mt-2 text-2xl font-black">Recuperar senha</h2>
              </div>
              <Link to="/login" className="text-sm font-medium text-slate-600 underline">Voltar</Link>
            </div>

            {message && (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {!sent ? (
              <form onSubmit={sendCode} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="gerente@loja.com"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {loading ? 'A enviar...' : 'Enviar código'}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Código de verificação</span>
                  <input
                    type="text"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Nova palavra-passe</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-500 disabled:opacity-70"
                >
                  {loading ? 'A redefinir...' : 'Redefinir password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
