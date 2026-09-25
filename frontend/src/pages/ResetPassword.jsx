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
      // O codigo nunca vem na resposta HTTP: quem o tivesse trocava a password
      // de outra pessoa. O ecra auto-preenchia-se com o que o servidor vazava.
      setMessage(response.data.message || 'Pedido registado. Introduza o código de recuperação.');
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
    <div className="min-h-screen bg-base px-4 py-10 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[520px] items-center justify-center">
        <div className="w-full rounded-[24px] border border-line bg-elev p-7 shadow-lg backdrop-blur-sm">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Acesso</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-ink">Recuperar senha</h2>
            </div>
            <Link to="/login" className="text-sm font-medium text-muted transition hover:text-ink">Voltar</Link>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {!sent ? (
            <form onSubmit={sendCode} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-line-strong bg-elev2 px-3.5 py-3 text-base text-ink outline-none transition-all duration-200 placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]"
                  placeholder="gerente@loja.com"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-brand-hi disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading ? 'A enviar...' : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Código de verificação</span>
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="w-full rounded-xl border border-line-strong bg-elev2 px-3.5 py-3 text-base text-ink outline-none transition-all duration-200 placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Nova palavra-passe</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-line-strong bg-elev2 px-3.5 py-3 text-base text-ink outline-none transition-all duration-200 placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-brand-hi disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading ? 'A redefinir...' : 'Redefinir password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
