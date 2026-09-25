import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { Card, Button, PageHead, EmptyState, Skeleton, useToast } from '../../../components/ui';
import { BarChart3 } from 'lucide-react';

/* RELATORIO SEMANAL — intervalo [start, end] escolhido pelo dono.
   CORRECCAO: antes pedia start=end=hoje (sempre 1 dia). Agora ha 2 datas. */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const iso = (d) => d.toISOString().slice(0, 10);
const weekAgo = () => { const d = new Date(); d.setDate(d.getDate() - 6); return iso(d); };
const today = () => iso(new Date());

export default function WeeklyReport() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(weekAgo());
  const [end, setEnd] = useState(today());

  async function load(s = start, e = end) {
    if (s > e) { toast.push('A data inicial nao pode ser posterior a final.', 'warn'); return; }
    setLoading(true);
    try { const res = await api.get(`/api/owner/reports/weekly?start=${s}&end=${e}`); setReport(res.data); }
    catch { toast.push('Nao foi possivel carregar o relatorio semanal.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(weekAgo(), today()); }, []);

  const label = `${start.split('-').reverse().join('/')} — ${end.split('-').reverse().join('/')}`;

  return (
    <div className="g-page">
      <PageHead title="Relatorio Semanal" sub={label} actions={<Button variant="ghost" onClick={() => load()}>Atualizar</Button>} />
      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label><span className="g-label">Inicio</span>
            <input className="g-input" type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label><span className="g-label">Fim</span>
            <input className="g-input" type="date" value={end} max={today()} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <Button variant="primary" type="submit">Ver periodo</Button>
        </form>
      </Card>
      {loading ? <Card><Skeleton height={160} /></Card> : !report ? (
        <Card><EmptyState icon={<BarChart3 size={26} aria-hidden="true" />} title="Sem dados" hint="Escolhe outro periodo." /></Card>
      ) : (
        <div className="g-kpis">
          <Card tight><div className="g-stat"><span className="g-stat-label">Receita bruta</span><span className="g-stat-value">{MZN(report.gross_revenue)}</span></div></Card>
          <Card tight><div className="g-stat"><span className="g-stat-label">Lucro bruto</span><span className="g-stat-value" style={{ color: 'var(--ok)' }}>{MZN(report.gross_profit)}</span></div></Card>
          {(report.sales_count != null) && <Card tight><div className="g-stat"><span className="g-stat-label">Vendas</span><span className="g-stat-value">{report.sales_count}</span></div></Card>}
        </div>
      )}
      <div style={{ height: 28 }} />
    </div>
  );
}
