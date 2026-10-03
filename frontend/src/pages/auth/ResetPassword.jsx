import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { Alert, Button, Input } from '../../components/ui';
import AuthLayout from './AuthLayout';

// Recuperacao por codigo de 6 digitos (email; WhatsApp como alternativa).
export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email -> code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/forgot-password', { email: email.trim() });
      if (res.data?.devCode) setDevCode(res.data.devCode);
      setStep('code');
    } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
  }

  async function reset(e) {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { email: email.trim(), code: code.trim(), password });
      navigate('/entrar?motivo=PASSWORD_CHANGED', { replace: true });
    } catch (err) { setError(errorMessage(err, 'Código inválido ou expirado.')); } finally { setLoading(false); }
  }

  return (
    <AuthLayout
      title={step === 'email' ? 'Recuperar senha' : 'Definir nova senha'}
      description={step === 'email' ? 'Enviamos um código de 6 dígitos para o email da conta.' : `Introduza o código enviado para ${email}. É válido 15 minutos.`}
      footer={<Link to="/entrar" className="font-medium text-accent">Voltar a entrar</Link>}
    >
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      {step === 'email' ? (
        <form onSubmit={requestCode} className="flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!email}>Enviar código</Button>
        </form>
      ) : (
        <form onSubmit={reset} className="flex flex-col gap-4">
          {devCode && <Alert tone="warning" title="Modo de desenvolvimento">O email não está configurado. Código: <span className="num font-medium">{devCode}</span></Alert>}
          <Input label="Código" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus inputClassName="num tracking-[0.3em]" />
          <Input label="Nova senha" type="password" autoComplete="new-password" hint="Pelo menos 8 caracteres." value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Input label="Repetir a nova senha" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={code.length !== 6 || password.length < 8}>Guardar nova senha</Button>
          <button type="button" className="text-sm text-ink-muted hover:text-ink" onClick={() => { setStep('email'); setCode(''); }}>Pedir outro código</button>
        </form>
      )}
    </AuthLayout>
  );
}
