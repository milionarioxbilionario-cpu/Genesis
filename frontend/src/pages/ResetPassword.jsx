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
    <div className="min-h-screen bg-[#0a1220] px-4 py-10 text-[#edf2f7]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[520px] items-center justify-center">
        <div className="w-full rounded-[24px] border border-[#263548] bg-[#111c2b]/95 p-7 shadow-[0_25px_80px_rgba(2,6,23,0.7)] backdrop-blur-sm">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#dfe7ef]">Acesso</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#f2f6fb]">Recuperar senha</h2>
            </div>
            <Link to="/login" className="text-sm font-medium text-[#bfd1e6] transition hover:text-[#edf2f7]">Voltar</Link>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {!sent ? (
            <form onSubmit={sendCode} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#dfe7ef]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-[#30455f] bg-[#182332] px-3.5 py-3 text-base text-[#f4f7fb] outline-none transition-all duration-200 placeholder:text-[#8ca0b8] focus:border-[#7aa5d6] focus:shadow-[0_0_0_3px_rgba(122,165,214,0.18)]"
                  placeholder="gerente@loja.com"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#dfe7ef] px-4 py-3 text-base font-semibold text-[#111c2b] transition-all duration-200 hover:bg-[#eef4fb] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading ? 'A enviar...' : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#dfe7ef]">Código de verificação</span>
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="w-full rounded-xl border border-[#30455f] bg-[#182332] px-3.5 py-3 text-base text-[#f4f7fb] outline-none transition-all duration-200 placeholder:text-[#8ca0b8] focus:border-[#7aa5d6] focus:shadow-[0_0_0_3px_rgba(122,165,214,0.18)]"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#dfe7ef]">Nova palavra-passe</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-[#30455f] bg-[#182332] px-3.5 py-3 text-base text-[#f4f7fb] outline-none transition-all duration-200 placeholder:text-[#8ca0b8] focus:border-[#7aa5d6] focus:shadow-[0_0_0_3px_rgba(122,165,214,0.18)]"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#dfe7ef] px-4 py-3 text-base font-semibold text-[#111c2b] transition-all duration-200 hover:bg-[#eef4fb] disabled:cursor-not-allowed disabled:opacity-80"
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
