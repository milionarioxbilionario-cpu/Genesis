import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';

const formatMZN = v => `MZN ${(Number(v||0)/100).toFixed(2)}`;

export default function MonthlyReport(){
  const [report, setReport] = useState(null);
  useEffect(()=>{ load(); }, []);
  async function load(){
    try{ const now = new Date(); const res = await api.get('/api/owner/reports/monthly?year=' + now.getFullYear() + '&month=' + (now.getMonth()+1)); setReport(res.data); }catch(e){console.error(e)}
  }
  if(!report) return <div>Carregando relatório mensal...</div>;

  const { gross_revenue, cost_of_goods, gross_profit, deductions, net_profit } = report;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Relatório Mensal</h2>
      <div className="rounded-xl border bg-white p-4 max-w-2xl">
        <div className="mb-4">
          <div className="flex justify-between py-2 border-b"><div>Receita Bruta</div><div className="font-bold">{formatMZN(gross_revenue)}</div></div>
          <div className="flex justify-between py-2 border-b"><div>Custo dos Produtos</div><div className="font-bold">{formatMZN(cost_of_goods)}</div></div>
          <div className="flex justify-between py-2 border-b"><div>Lucro Bruto</div><div className="font-bold">{formatMZN(gross_profit)}</div></div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Deduções</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>Salários</div><div className="font-bold">{formatMZN(deductions.total_salaries)}</div>
            <div>Renda</div><div className="font-bold">{formatMZN(deductions.total_rent)}</div>
            <div>Outros Fixos</div><div className="font-bold">{formatMZN(deductions.total_other_fixed)}</div>
            <div>Custo Fornecedores</div><div className="font-bold">{formatMZN(deductions.total_supplier_delivery)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-lg font-medium">Lucro Líquido Real</div>
          <div className="text-2xl font-extrabold">{formatMZN(net_profit)}</div>
        </div>
      </div>
    </div>
  );
}
