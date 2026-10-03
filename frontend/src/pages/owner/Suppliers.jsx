import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, dateTime, errorMessage } from '../../utils/format';
import { Alert, Button, Drawer, Input, MoneyInput, PageHeader, Table, Toolbar, useToast } from '../../components/ui';

// Especificacao 6.6: fornecedores, custo de entrega por visita (entra no
// relatorio mensal) e historico de compras.
export default function Suppliers() {
  const toast = useToast();
  const suppliers = useApi('/api/inventory/suppliers');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const entries = useApi(viewing ? `/api/inventory/suppliers/${viewing.id}/entries` : null);

  async function save() {
    setSaving(true); setError('');
    const body = { name: editing.name.trim(), phone: editing.phone.trim() || null, delivery_cost_per_visit: editing.delivery_cost_per_visit };
    try {
      if (editing.id) await api.put('/api/inventory/suppliers/' + editing.id, body);
      else await api.post('/api/inventory/suppliers', body);
      toast('Fornecedor guardado.');
      setEditing(null); suppliers.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }
  async function deactivate() {
    try { await api.put('/api/inventory/suppliers/' + editing.id, { is_active: false }); toast('Fornecedor desactivado.'); setEditing(null); suppliers.reload(); } catch (err) { setError(errorMessage(err)); }
  }

  return (
    <>
      <PageHeader title="Fornecedores" description="O custo de entrega por visita é deduzido no relatório mensal." actions={<Button variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ name: '', phone: '', delivery_cost_per_visit: 0 }); }}>Novo fornecedor</Button>} />
      <Table
        columns={[
          { key: 'name', header: 'Fornecedor' },
          { key: 'phone', header: 'Contacto', render: (s) => <span className="num text-ink-2">{s.phone || '—'}</span> },
          { key: 'delivery', header: 'Entrega por visita', align: 'right', render: (s) => money(s.delivery_cost_per_visit) },
          { key: 'actions', header: '', align: 'right', render: (s) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setViewing(s); }}>Compras</Button> },
        ]}
        rows={suppliers.data || []}
        loading={suppliers.loading && !suppliers.data}
        onRowClick={(s) => { setError(''); setEditing({ ...s, phone: s.phone || '' }); }}
        empty={<p className="py-10 text-center text-ink-muted">Ainda não há fornecedores.</p>}
      />

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Editar fornecedor' : 'Novo fornecedor'}
        footer={<>{editing?.id && <Button variant="danger-ghost" className="mr-auto" onClick={deactivate}>Desactivar</Button>}<Button onClick={() => setEditing(null)}>Cancelar</Button><Button variant="primary" loading={saving} disabled={!editing?.name?.trim()} onClick={save}>Guardar</Button></>}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Input label="Nome" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            <Input label="Telefone" inputMode="tel" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            <MoneyInput label="Custo de entrega por visita" valueCents={editing.delivery_cost_per_visit} onChangeCents={(v) => setEditing({ ...editing, delivery_cost_per_visit: v })} />
          </div>
        )}
      </Drawer>

      <Drawer open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? 'Compras — ' + viewing.name : ''}>
        {!entries.data ? <p className="text-ink-muted">A carregar…</p> : entries.data.length === 0 ? <p className="text-ink-muted">Sem compras registadas. Registe entradas de stock com este fornecedor em Produtos → Stock.</p> : (
          <ul className="divide-y divide-border">
            {entries.data.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div><p className="text-ink">{e.quantity} × {e.product?.name}</p><p className="text-xs text-ink-muted">{dateTime(e.created_at)}</p></div>
                <span className="num font-medium">{money(e.quantity * e.unit_cost)}</span>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  );
}
