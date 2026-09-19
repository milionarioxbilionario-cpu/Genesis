import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { Card, CardHead, Button, Badge, PageHead, Table, EmptyState, Skeleton, useToast } from '../../components/ui';

/* CHENECAS / FIADOS — leitura de dividas, pagamentos e vencimentos.
   Logica intacta; so o visual passou ao padrao Genesis. */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TONE = { overdue: 'danger', paid: 'ok' };
const LABEL = { overdue: 'VENCIDA', paid: 'PAGA', partially_paid: 'PARCIAL', active: 'ACTIVA' };

export default function Debts() {
  const toast = useToast();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const res = await api.get('/api/owner/debts'); setDebts(res.data || []); }
    catch { toast.push('Nao foi possivel carregar as chenecas.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => ({
    open: debts.reduce((s, d) => s + Number(d.total_amount || 0) - Number(d.amount_paid || 0), 0),
    active: debts.filter((d) => d.status !== 'paid').length,
    overdue: debts.filter((d) => d.status === 'overdue').length,
  }), [debts]);

  return (
    <div className="g-page">
      <PageHead title="Chenecas / Fiados" sub="Dividas, pagamentos e vencimentos da loja"
        actions={<Button variant="ghost" onClick={load}>Atualizar</Button>} />
      <div className="g-kpis" style={{ marginBottom: 24 }}>
        <Card tight><div className="g-stat"><span className="g-stat-label">Total em divida</span><span className="g-stat-value" style={{ color: 'var(--danger)' }}>{MZN(totals.open)}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Activas</span><span className="g-stat-value">{totals.active}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Vencidas</span><span className="g-stat-value" style={{ color: 'var(--warn)' }}>{totals.overdue}</span></div></Card>
      </div>
      <Card tight>
        <div style={{ padding: '14px 16px 0' }}><CardHead title="Dividas registadas" /></div>
        {loading ? <div style={{ padding: 16 }}><Skeleton height={180} /></div> : (
          <Table rowKey={(r) => r.id} rows={debts}
            empty={<EmptyState icon="📒" title="Sem chenecas" hint="Quando houver fiados, aparecem aqui." />}
            columns={[
              { key: 'debtor_name', label: 'Devedor', render: (r) => r.debtor_name || '—' },
              { key: 'total_amount', label: 'Total', align: 'right', numeric: true, render: (r) => MZN(r.total_amount) },
              { key: 'amount_paid', label: 'Pago', align: 'right', numeric: true, render: (r) => MZN(r.amount_paid) },
              { key: 'saldo', label: 'Saldo', align: 'right', numeric: true, render: (r) => (<strong>{MZN(Number(r.total_amount || 0) - Number(r.amount_paid || 0))}</strong>) },
              { key: 'status', label: 'Estado', render: (r) => <Badge tone={TONE[r.status] || 'info'}>{LABEL[r.status] || (r.status || 'ACTIVA').toUpperCase()}</Badge> },
            ]} />
        )}
      </Card>
      <div style={{ height: 28 }} />
    </div>
  );
}
