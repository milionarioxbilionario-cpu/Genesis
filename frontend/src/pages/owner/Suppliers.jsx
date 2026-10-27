import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, dateTime, errorMessage } from '../../utils/format';
import { useI18n } from '../../i18n/react';
import { Alert, Button, Drawer, Input, MoneyInput, PageHeader, Table, useToast } from '../../components/ui';
import { formatQty, lineAmount } from '../../utils/units';

// Especificacao 6.6: fornecedores, custo de entrega por visita (entra no
// relatorio mensal) e historico de compras.
export default function Suppliers() {
  const toast = useToast();
  const { t } = useI18n();
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
      toast(t('Fornecedor guardado.'));
      setEditing(null); suppliers.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }
  async function deactivate() {
    try { await api.put('/api/inventory/suppliers/' + editing.id, { is_active: false }); toast(t('Fornecedor desactivado.')); setEditing(null); suppliers.reload(); } catch (err) { setError(errorMessage(err)); }
  }

  return (
    <>
      <PageHeader title={t('Fornecedores')} description={t('O custo de entrega por visita é deduzido no relatório mensal.')} actions={<Button variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ name: '', phone: '', delivery_cost_per_visit: 0 }); }}>{t('Novo fornecedor')}</Button>} />
      <Table
        columns={[
          { key: 'name', header: t('Fornecedor') },
          { key: 'phone', header: t('Contacto'), render: (s) => <span className="num text-ink-2">{s.phone || '—'}</span> },
          { key: 'delivery', header: t('Entrega por visita'), align: 'right', render: (s) => money(s.delivery_cost_per_visit) },
          { key: 'actions', header: '', align: 'right', render: (s) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setViewing(s); }}>{t('Compras')}</Button> },
        ]}
        rows={suppliers.data || []}
        loading={suppliers.loading && !suppliers.data}
        onRowClick={(s) => { setError(''); setEditing({ ...s, phone: s.phone || '' }); }}
        empty={<p className="py-10 text-center text-ink-muted">{t('Ainda não há fornecedores.')}</p>}
      />

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? t('Editar fornecedor') : t('Novo fornecedor')}
        footer={<>{editing?.id && <Button variant="danger-ghost" className="mr-auto" onClick={deactivate}>{t('Desactivar')}</Button>}<Button onClick={() => setEditing(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={saving} disabled={!editing?.name?.trim()} onClick={save}>{t('Guardar')}</Button></>}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Input label={t('Nome')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            <Input label={t('Telefone')} inputMode="tel" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            <MoneyInput label={t('Custo de entrega por visita')} valueCents={editing.delivery_cost_per_visit} onChangeCents={(v) => setEditing({ ...editing, delivery_cost_per_visit: v })} />
          </div>
        )}
      </Drawer>

      <Drawer open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? t('Compras — {name}', { name: viewing.name }) : ''}>
        {!entries.data ? <p className="text-ink-muted">{t('A carregar…')}</p> : entries.data.length === 0 ? <p className="text-ink-muted">{t('Sem compras registadas. Registe entradas de stock com este fornecedor em Produtos → Stock.')}</p> : (
          <ul className="divide-y divide-border">
            {entries.data.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div><p className="text-ink">{formatQty(e.quantity, e.product?.unit)} × {e.product?.name}</p><p className="text-xs text-ink-muted">{dateTime(e.created_at)}</p></div>
                <span className="num font-medium">{money(lineAmount(e.quantity, e.unit_cost, e.product?.unit))}</span>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  );
}
