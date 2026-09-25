import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { Card, CardHead, Button, PageHead, EmptyState, Skeleton, useToast } from '../../../components/ui';
import { BarChart3 } from 'lucide-react';

/* RELATORIO DIARIO — receita, vendas e lucro do dia. */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function DailyReport() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today());

  async function load(d = date) {
    setLoading(true);
    try { const res = await api.get('/api/owner/reports/daily?date=' + d); setReport(res.data); }
    catch { toast.push('Nao foi possivel carregar o relatorio diario.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(today()); }, []);

  return (
    <div className="g-page">
      <PageHead title="Relatorio Diario" sub={date.split('-').reverse().join('/')} actions={<Button variant="ghost" onClick={() => load()}>Atualizar</Button>} />
      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label><span className="g-label">Data</span>
            <input className="g-input" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <Button variant="primary" type="submit">Ver dia</Button>
        </form>
      </Card>
      {loading ? <Card><Skeleton height={160} /></Card> : !report ? (
        <Card><EmptyState icon={<BarChart3 size={26} aria-hidden="true" />} title="Sem dados" hint="Escolhe outro dia." /></Card>
      ) : (
        <div className="g-kpis">
          <Card tight><div className="g-stat"><span className="g-stat-label">Receita bruta</span><span className="g-stat-value">{MZN(report.gross_revenue)}</span></div></Card>
          <Card tight><div className="g-stat"><span className="g-stat-label">Vendas</span><span className="g-stat-value">{report.sales_count ?? 0}</span></div></Card>
          <Card tight><div className="g-stat"><span className="g-stat-label">Lucro bruto</span><span className="g-stat-value" style={{ color: 'var(--ok)' }}>{MZN(report.gross_profit)}</span></div></Card>
        </div>
      )}
      <div style={{ height: 28 }} />
    </div>
  );
}
