import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { Alert, Button, Input, Select } from '../../components/ui';
import AuthLayout from './AuthLayout';

export const BUSINESS_TYPES = [
  { value: 'bottle_store', label: 'Bottle store / Loja de bebidas' },
  { value: 'mercearia', label: 'Mercearia / Contentor' },
  { value: 'padaria', label: 'Padaria / Café' },
  { value: 'talho', label: 'Talho' },
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'restaurante', label: 'Restaurante / Churrasqueira' },
  { value: 'boutique', label: 'Boutique / Loja de roupa' },
  { value: 'outro', label: 'Outro tipo de negócio' },
];

// Especificacao 6.1, passo 1. NUIT e documento sao opcionais.
export default function RequestAccount() {
  const [form, setForm] = useState({ businessName: '', ownerName: '', businessType: 'bottle_store', location: '', phone: '', email: '', nuit: '', idDocument: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const body = { ...form };
    for (const k of ['email', 'nuit', 'idDocument']) if (!body[k].trim()) delete body[k];
    try {
      await api.post('/api/auth/request-account', body);
      setDone(true);
    } catch (err) {
      const raw = err?.response?.data?.error;
      setError(Array.isArray(raw) ? 'Verifique os campos: nomes com pelo menos 3 letras, telefone com 8 ou mais dígitos.' : errorMessage(err));
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <AuthLayout title="Pedido recebido" footer={<Link to="/entrar" className="font-medium text-accent">Voltar a entrar</Link>}>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-5">
          <CheckCircle2 className="mt-0.5 shrink-0 text-positive" size={20} />
          <p className="text-base text-ink-2">Entraremos em contacto em até 48 horas pelo telefone indicado. Depois da aprovação recebe os dados de acesso e tem 30 dias de teste gratuito.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide title="Pedir uma conta" description="30 dias de teste gratuito. Sem compromisso." footer={<>Já tem conta? <Link to="/entrar" className="font-medium text-accent">Entrar</Link></>}>
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nome do negócio" value={form.businessName} onChange={set('businessName')} required minLength={3} className="sm:col-span-2" />
        <Input label="O seu nome" value={form.ownerName} onChange={set('ownerName')} required minLength={3} />
        <Select label="Tipo de negócio" value={form.businessType} onChange={set('businessType')}>
          {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Input label="Localização" placeholder="Bairro, cidade" value={form.location} onChange={set('location')} required minLength={3} />
        <Input label="Telefone (WhatsApp)" inputMode="tel" placeholder="84 000 0000" value={form.phone} onChange={set('phone')} required minLength={8} />
        <Input label="Email" hint="Opcional" type="email" value={form.email} onChange={set('email')} />
        <Input label="NUIT" hint="Opcional" value={form.nuit} onChange={set('nuit')} />
        <Input label="BI ou passaporte" hint="Opcional" value={form.idDocument} onChange={set('idDocument')} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" size="lg" block loading={loading}>Enviar pedido</Button>
        </div>
      </form>
    </AuthLayout>
  );
}
