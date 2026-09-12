import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const formatMoney = (value) => `MZN ${(Number(value || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Debts() {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/owner/debts');
        setDebts(res.data || []);
      } catch (e) {
        console.error('Failed to load debts', e);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Chenecas / Fiados</h2>
        <p className="text-sm text-slate-600">Acompanhe dívidas, pagamentos e vencimentos da loja.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Total em dívida</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{formatMoney(debts.reduce((sum, debt) => sum + Number(debt.total_amount || 0) - Number(debt.amount_paid || 0), 0))}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Ativas</div>
          <div className="mt-2 text-2xl font-black text-blue-600">{debts.filter((d) => d.status !== 'paid').length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Vencidas</div>
          <div className="mt-2 text-2xl font-black text-red-600">{debts.filter((d) => d.status === 'overdue').length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-2">Devedor</th>
              <th className="p-2">Total</th>
              <th className="p-2">Pago</th>
              <th className="p-2">Saldo</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {debts.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-slate-500">Sem dados de chenecas registadas.</td>
              </tr>
            ) : (
              debts.map((debt) => (
                <tr key={debt.id} className="border-t">
                  <td className="p-2">{debt.debtor_name || '—'}</td>
                  <td className="p-2">{formatMoney(debt.total_amount || 0)}</td>
                  <td className="p-2">{formatMoney(debt.amount_paid || 0)}</td>
                  <td className="p-2 font-bold">{formatMoney((Number(debt.total_amount || 0) - Number(debt.amount_paid || 0)))}</td>
                  <td className="p-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${debt.status === 'overdue' ? 'bg-red-100 text-red-700' : debt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {debt.status || 'active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
