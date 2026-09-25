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
      <div className="flex min-h-screen items-center justify-center bg-base px-4 py-10 text-ink">
        <div className="w-full max-w-lg rounded-[24px] border border-line bg-elev p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="mb-3 text-2xl font-bold text-ink">Pedido enviado</h1>
          <p className="mb-6 text-muted">Pedido recebido. Entraremos em contacto em até 48 horas.</p>
          <a href="/login" className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-hi">
            Voltar ao login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base px-4 py-10 text-ink">
      <div className="mx-auto max-w-3xl rounded-[24px] border border-line bg-elev p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink">Genesis</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink">Solicitar conta</h1>
          <p className="mt-2 text-muted">Abra a sua loja digital em Moçambique em poucos minutos.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-ink">
              Nome do negócio
              <input name="businessName" value={form.businessName} onChange={onChange} required className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]" placeholder="Ex.: Mercado Central" />
            </label>

            <label className="block text-sm font-medium text-ink">
              Nome completo do dono
              <input name="ownerName" value={form.ownerName} onChange={onChange} required className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]" placeholder="Seu nome" />
            </label>

            <label className="block text-sm font-medium text-ink">
              Tipo de negócio
              <select name="businessType" value={form.businessType} onChange={onChange} className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]">
                <option value="bottle_store">Bottle Store</option>
                <option value="mercearia">Mercearia</option>
                <option value="padaria">Padaria</option>
                <option value="talho">Talho</option>
                <option value="supermercado">Supermercado</option>
                <option value="outro">Outro</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-ink">
              Localização
              <input name="location" value={form.location} onChange={onChange} required className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]" placeholder="Maputo, Matola..." />
            </label>

            <label className="block text-sm font-medium text-ink">
              Telefone
              <input name="phone" value={form.phone} onChange={onChange} required className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]" placeholder="84xxxxxxx" />
            </label>

            <label className="block text-sm font-medium text-ink">
              Email (opcional)
              <input type="email" name="email" value={form.email} onChange={onChange} className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]" placeholder="nome@empresa.com" />
            </label>

            <label className="block text-sm font-medium text-ink">
              NUIT (opcional)
              <input name="nuit" value={form.nuit} onChange={onChange} className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]" placeholder="Não tenho" />
            </label>

            <label className="block text-sm font-medium text-ink">
              BI / Passaporte (opcional)
              <input name="idDocument" value={form.idDocument} onChange={onChange} className="mt-2 w-full rounded-xl border border-line-strong bg-elev2 px-3 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]" placeholder="Não tenho" />
            </label>
          </div>

          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/login" className="text-sm font-medium text-muted transition hover:text-ink">Já tenho conta</a>
            <button type="submit" disabled={loading} className="rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-hi disabled:opacity-60">
              {loading ? 'A enviar...' : 'Solicitar acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
