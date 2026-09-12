import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Settings() {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [hours, setHours] = useState({ opening: '08:00', closing: '18:00' });

  useEffect(() => {
    const loadHours = async () => {
      try {
        const res = await api.get('/api/owner/settings/hours');
        setHours({
          opening: res.data?.opening || '08:00',
          closing: res.data?.closing || '18:00',
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadHours();
  }, []);

  const savePin = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setMessage('O PIN deve ter 4 a 6 dígitos.');
      return;
    }

    try {
      await api.post('/api/sales/cancel-pin', { pin });
      setMessage('PIN guardado com sucesso.');
      setPin('');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Não foi possível guardar o PIN.');
    }
  };

  const saveHours = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/owner/settings/hours', hours);
      setMessage('Horário guardado com sucesso.');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Não foi possível guardar o horário.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Definições</h2>
        <p className="text-sm text-slate-600">Configure PIN, horário de funcionamento e ajustes gerais da loja.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">PIN de cancelamento</h3>
          <form onSubmit={savePin} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Digite 4 a 6 dígitos"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"
            />
            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white">
              Guardar PIN
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Horário</h3>
          <form onSubmit={saveHours} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="time"
                value={hours.opening}
                onChange={(e) => setHours((prev) => ({ ...prev, opening: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"
              />
              <input
                type="time"
                value={hours.closing}
                onChange={(e) => setHours((prev) => ({ ...prev, closing: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3"
              />
            </div>
            <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white">
              Guardar horário
            </button>
          </form>
        </div>
      </div>

      {message && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{message}</div>}
    </div>
  );
}
