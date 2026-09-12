import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';

export default function WeeklyReport(){
  const [report, setReport] = useState(null);
  useEffect(()=>{ load(); }, []);
  async function load(){
    try{ const start = new Date(); const res = await api.get('/api/owner/reports/weekly?start=' + start.toISOString().slice(0,10) + '&end=' + start.toISOString().slice(0,10)); setReport(res.data); }catch(e){console.error(e)}
  }
  if(!report) return <div>Carregando relatório semanal...</div>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Relatório Semanal</h2>
      <div className="rounded-xl border bg-white p-4">
        <div>Receita Bruta: MZN {(report.gross_revenue/100).toFixed(2)}</div>
        <div>Lucro Bruto: MZN {(report.gross_profit/100).toFixed(2)}</div>
      </div>
    </div>
  );
}
