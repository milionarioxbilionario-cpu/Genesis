import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';

export default function DailyReport() {
  const [report, setReport] = useState(null);
  useEffect(() => { load(); }, []);
  async function load() {
    try { const res = await api.get('/api/owner/reports/daily?date=' + new Date().toISOString().slice(0,10)); setReport(res.data); } catch (e) { console.error(e); }
  }
  if (!report) return <div>Carregando relatório diário...</div>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Relatório Diário</h2>
      <div className="rounded-xl border bg-white p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>Total Vendas</div>
          <div className="font-bold">MZN {(report.gross_revenue/100).toFixed(2)}</div>
          <div>Vendas (count)</div>
          <div className="font-bold">{report.sales_count}</div>
          <div>Lucro Bruto</div>
          <div className="font-bold">MZN {(report.gross_profit/100).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
