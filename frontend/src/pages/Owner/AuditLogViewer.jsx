import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Card, CardHead, Button, Badge, PageHead, Table, EmptyState, Skeleton, useToast } from '../../components/ui';

/* AUDITORIA — ultimos 40 eventos do tenant. Leitura apenas. */
const dt = (v) => (v ? new Date(v).toLocaleString('pt-MZ') : '\u2014');

export default function AuditLogViewer() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const res = await api.get('/api/owner/audit'); setLogs(res.data || []); }
    catch { toast.push('Nao foi possivel carregar a auditoria.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="g-page">
      <PageHead title="Auditoria" sub="Quem fez o que, quando e de onde"
        actions={<Button variant="ghost" onClick={load}>Atualizar</Button>} />
      <Card tight>
        <div style={{ padding: '14px 16px 0' }}><CardHead title="Ultimos eventos" hint="Maximo 40 registos" /></div>
        {loading ? <div style={{ padding: 16 }}><Skeleton height={220} /></div> : (
          <Table rowKey={(r) => r.id} rows={logs}
            empty={<EmptyState icon="\u{1F6E1}" title="Sem eventos" hint="Accoes de vendas, stock e turnos aparecem aqui." />}
            columns={[
              { key: 'action', label: 'Accao', render: (r) => <Badge tone="info">{r.action}</Badge> },
              { key: 'entity', label: 'Entidade', render: (r) => `${r.entity_type || '\u2014'} / ${r.entity_id || '\u2014'}` },
              { key: 'user_name', label: 'Utilizador', render: (r) => r.user_name || '\u2014' },
              { key: 'created_at', label: 'Data', render: (r) => dt(r.created_at) },
              { key: 'ip_address', label: 'IP', render: (r) => r.ip_address || '\u2014' },
            ]} />
        )}
      </Card>
      <div style={{ height: 28 }} />
    </div>
  );
}
