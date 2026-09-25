import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { Card, CardHead, Button, PageHead, EmptyState, Skeleton, useToast } from '../../../components/ui';
import { BarChart3 } from 'lucide-react';

/* RELATORIO MENSAL — cascata receita -> custos -> deducoes -> LUCRO REAL.
   Mes/ano escolhidos pelo dono (antes era sempre o mes corrente). */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MONTHS = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function MonthlyReport() {
  const toast = useToast();
  const now = new Date();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  async function load(y = year, m = month) {
    setLoading(true);
    try { const res = await api.get(`/api/owner/reports/monthly?year=${y}&month=${m}`); setReport(res.data); }
    catch { toast.push('Nao foi possivel carregar o relatorio mensal.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(now.getFullYear(), now.getMonth() + 1); }, []);

  const d = report?.deductions || {};
  const rows = [
    ['Salarios', d.total_salaries],
    ['Renda', d.total_rent],
    ['Outros fixos', d.total_other_fixed],
    ['Entregas de fornecedores', d.total_supplier_delivery],
  ];

  return (
    <div className="g-page">
      <PageHead title="Relatorio Mensal" sub={`${MONTHS[month - 1]} ${year} · lucro real liquido`} actions={<Button variant="ghost" onClick={() => load()}>Atualizar</Button>} />
      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label><span className="g-label">Mes</span>
            <select className="g-input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <label><span className="g-label">Ano</span>
            <input className="g-input" type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </label>
          <Button variant="primary" type="submit">Ver mes</Button>
        </form>
      </Card>
      {loading ? <Card><Skeleton height={280} /></Card> : !report ? (
        <Card><EmptyState icon={<BarChart3 size={26} aria-hidden="true" />} title="Sem dados" hint="Escolhe outro mes." /></Card>
      ) : (
        <>
          <div className="g-kpis" style={{ marginBottom: 24 }}>
            <Card tight><div className="g-stat"><span className="g-stat-label">Receita bruta</span><span className="g-stat-value">{MZN(report.gross_revenue)}</span></div></Card>
            <Card tight><div className="g-stat"><span className="g-stat-label">Lucro bruto</span><span className="g-stat-value" style={{ color: 'var(--ok)' }}>{MZN(report.gross_profit)}</span></div></Card>
            <Card tight><div className="g-stat"><span className="g-stat-label">Lucro liquido real</span><span className="g-stat-value" style={{ color: Number(report.net_profit) >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{MZN(report.net_profit)}</span></div></Card>
          </div>
          <Card>
            <CardHead title="Cascata do mes" hint="Receita menos custos e deducoes" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[['Receita bruta', report.gross_revenue, 'var(--text)'], ['Custo dos produtos', report.cost_of_goods, 'var(--warn)'], ['Lucro bruto', report.gross_profit, 'var(--ok)']].map(([label, v, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 2px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <strong className="g-num" style={{ color }}>{MZN(v)}</strong>
                </div>
              ))}
              <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 14, marginBottom: 4 }}>Deducoes</div>
              {rows.map(([label, v]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 2px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="g-num" style={{ color: 'var(--danger)' }}>\u2212 {MZN(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
                <span style={{ fontWeight: 800, color: 'var(--text)' }}>Lucro liquido real</span>
                <span className="g-num" style={{ fontSize: '1.4rem', fontWeight: 800, color: Number(report.net_profit) >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{MZN(report.net_profit)}</span>
              </div>
            </div>
          </Card>
        </>
      )}
      <div style={{ height: 28 }} />
    </div>
  );
}
