import React, { useState } from 'react';
import api from '../utils/api';

const defaultForm = {
  businessName: '',
  ownerName: '',
  businessType: 'bottle_store',
  location: '',
  phone: '',
  email: '',
  nuit: '',
  idDocument: ''
};

export default function RequestAccount() {
  const [form, setForm] = useState(defaultForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        email: form.email || undefined,
        nuit: form.nuit || undefined,
        idDocument: form.idDocument || undefined
      };

      await api.post('/api/auth/request-account', payload);
      setSubmitted(true);
      setForm(defaultForm);
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Pedido enviado</h1>
          <p className="text-slate-600 mb-6">Pedido recebido. Entraremos em contacto em até 48 horas.</p>
          <a href="/login" className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-700">
            Voltar ao login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Genesis</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Solicitar conta</h1>
          <p className="mt-2 text-slate-600">Abra a sua loja digital em Moçambique em poucos minutos.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Nome do negócio
              <input name="businessName" value={form.businessName} onChange={onChange} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Ex.: Mercado Central" />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Nome completo do dono
              <input name="ownerName" value={form.ownerName} onChange={onChange} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Seu nome" />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Tipo de negócio
              <select name="businessType" value={form.businessType} onChange={onChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="bottle_store">Bottle Store</option>
                <option value="mercearia">Mercearia</option>
                <option value="padaria">Padaria</option>
                <option value="talho">Talho</option>
                <option value="supermercado">Supermercado</option>
                <option value="outro">Outro</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Localização
              <input name="location" value={form.location} onChange={onChange} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Maputo, Matola..." />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Telefone
              <input name="phone" value={form.phone} onChange={onChange} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="84xxxxxxx" />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email (opcional)
              <input type="email" name="email" value={form.email} onChange={onChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="nome@empresa.com" />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              NUIT (opcional)
              <input name="nuit" value={form.nuit} onChange={onChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Não tenho" />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              BI / Passaporte (opcional)
              <input name="idDocument" value={form.idDocument} onChange={onChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Não tenho" />
            </label>
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <a href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Já tenho conta</a>
            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {loading ? 'A enviar...' : 'Solicitar acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
