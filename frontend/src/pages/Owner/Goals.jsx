import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { mznToCents } from '../../utils/money';
import { Card, CardHead, Button, Input, PageHead, GoalBar, EmptyState, Skeleton, useToast } from '../../components/ui';

/* METAS DO MES — le a meta REAL de /api/owner/goals/current (antes era um
   valor fixo falso de 200000). Permite definir/actualizar a meta do mes. */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Goals() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetInput, setTargetInput] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const safe = (p) => p.then((r) => r.data).catch(() => null);
    const [s, g] = await Promise.all([safe(api.get('/api/dashboard/summary')), safe(api.get('/api/owner/goals/current'))]);
    setSummary(s || {});
    setGoal(g || null);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const current = Number(summary?.revenueMonth || 0);
  const target = Number(goal?.target_amount || 0);
  const pct = target > 0 ? (current / target) * 100 : 0;
  const daysLeft = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - n.getDate(); }, []);
  const projected = useMemo(() => { const n = new Date(); const elapsed = Math.max(1, n.getDate()); return (current / elapsed) * new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate(); }, [current]);

  async function save(e) {
    e.preventDefault();
    const cents = mznToCents(targetInput);
    if (!cents || cents <= 0) { toast.push('Indica um valor de meta valido em MZN.', 'warn'); return; }
    setSaving(true);
    try {
      await api.post('/api/owner/goals', { target_amount: cents });
      toast.push('Meta do mes guardada.', 'ok');
      setTargetInput('');
      await load();
    } catch (err) { toast.push(err?.response?.data?.error || 'Nao foi possivel guardar a meta.', 'err'); }
    finally { setSaving(false); }
  }

  return (
    <div className="g-page">
      <PageHead title="Metas do mes" sub="Progresso da loja e projeccao de fecho"
        actions={<Button variant="ghost" onClick={load}>Atualizar</Button>} />
      {loading ? <Card><Skeleton height={180} /></Card> : !target ? (
        <Card>
          <CardHead title="Sem meta definida" hint="Define a meta de receita deste mes" />
          <form onSubmit={save} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 220, flex: 1 }}><Input label="Meta do mes (MZN)" type="number" step="0.01" min="0" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="Ex: 150000" required /></div>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'A guardar...' : 'Definir meta'}</Button>
          </form>
        </Card>
      ) : (
        <>
          <div className="g-kpis" style={{ marginBottom: 24 }}>
            <Card tight><div className="g-stat"><span className="g-stat-label">Meta</span><span className="g-stat-value">{MZN(target)}</span></div></Card>
            <Card tight><div className="g-stat"><span className="g-stat-label">Receita actual</span><span className="g-stat-value" style={{ color: 'var(--ok)' }}>{MZN(current)}</span></div></Card>
            <Card tight><div className="g-stat"><span className="g-stat-label">Projeccao</span><span className="g-stat-value" style={{ color: 'var(--info)' }}>{MZN(Math.round(projected))}</span></div></Card>
            <Card tight><div className="g-stat"><span className="g-stat-label">Estado</span><span className="g-stat-value" style={{ color: pct >= 100 ? 'var(--ok)' : 'var(--warn)' }}>{pct >= 100 ? 'ATINGIDA' : 'EM PROGRESSO'}</span></div></Card>
          </div>
          <Card style={{ marginBottom: 24 }}>
            <CardHead title="Progresso" hint={daysLeft > 0 ? `Faltam ${daysLeft} dias para o fim do mes` : 'Ultimo dia do mes'} />
            <GoalBar pct={pct} label="Receita vs meta" caption={`Actual ${MZN(current)} de ${MZN(target)} · falta ${MZN(Math.max(target - current, 0))}`} />
          </Card>
          <Card>
            <CardHead title="Actualizar meta" hint="Substitui a meta do mes corrente" />
            <form onSubmit={save} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 220, flex: 1 }}><Input label="Nova meta (MZN)" type="number" step="0.01" min="0" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder={String((target / 100).toFixed(2))} required /></div>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? 'A guardar...' : 'Actualizar meta'}</Button>
            </form>
          </Card>
        </>
      )}
      <div style={{ height: 28 }} />
    </div>
  );
}
