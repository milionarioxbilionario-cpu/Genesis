import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const formatMoney = (value) => `MZN ${(Number(value || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Goals() {
  const [summary, setSummary] = useState(null);
  const [goal, setGoal] = useState({ target: 200000, current: 0, projected: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/dashboard/summary');
        setSummary(res.data || {});
      } catch (e) {
        console.error('Failed to load dashboard summary', e);
      }
    };

    load();
  }, []);

  const currentMonthRevenue = Number(summary?.revenueMonth || 0);
  const target = Number(goal.target || 0);
  const current = currentMonthRevenue;
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const projected = current + Number(goal.projected || 0);

  const indicator = useMemo(() => {
    if (percent < 20) return 'from-red-500 to-red-600';
    if (percent < 50) return 'from-orange-500 to-orange-600';
    if (percent < 80) return 'from-yellow-400 to-yellow-500';
    if (percent < 100) return 'from-lime-500 to-green-500';
    return 'from-green-500 to-emerald-600';
  }, [percent]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Metas do mês</h2>
        <p className="text-sm text-slate-600">Acompanhe o progresso da loja e a projeção final do mês.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Meta atual</div>
            <div className="text-2xl font-black text-slate-900">{formatMoney(target)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Projeção</div>
            <div className="text-xl font-bold text-sky-600">{formatMoney(projected)}</div>
          </div>
        </div>

        <div className="relative h-8 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full bg-gradient-to-r ${indicator} transition-all duration-700`} style={{ width: `${percent}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-sm">
            {percent.toFixed(1)}%
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>Atual: {formatMoney(current)}</span>
          <span>Falta: {formatMoney(Math.max(target - current, 0))}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Meta</div>
          <div className="mt-2 text-xl font-bold">{formatMoney(target)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Receita atual</div>
          <div className="mt-2 text-xl font-bold text-emerald-600">{formatMoney(current)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Status</div>
          <div className="mt-2 text-xl font-bold text-sky-600">{percent >= 100 ? 'Atingida' : 'Em progresso'}</div>
        </div>
      </div>
    </div>
  );
}
