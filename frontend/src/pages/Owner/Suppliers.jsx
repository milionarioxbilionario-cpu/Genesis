import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { mznToCents } from '../../utils/money';
import { Card, CardHead, Button, Input, PageHead, Table, EmptyState, Skeleton, useToast } from '../../components/ui';
import { Truck } from 'lucide-react';

/* FORNECEDORES — registo movido do antigo Dashboard monolitico (Lote D2).
   O custo de entrega entra automaticamente no relatorio mensal (lucro real). */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const EMPTY = { name: '', phone: '', products_supplied: '', delivery_cost_per_visit: '' };

export default function Suppliers() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/inventory/suppliers');
      setSuppliers(res.data || []);
    } catch { toast.push('Nao foi possivel carregar os fornecedores.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/inventory/suppliers', {
        ...form,
        delivery_cost_per_visit: mznToCents(form.delivery_cost_per_visit),
      });
      toast.push('Fornecedor registado.', 'ok');
      setForm(EMPTY);
      await load();
    } catch (err) {
      toast.push(err?.response?.data?.error || 'Erro ao guardar o fornecedor.', 'err');
    } finally { setSaving(false); }
  }

  const totalDelivery = suppliers.reduce((s, x) => s + Number(x.delivery_cost_per_visit || 0), 0);

  return (
    <div className="g-page">
      <PageHead title="Fornecedores" sub="Quem te entrega o stock e quanto custa cada entrega"
        actions={<Button variant="ghost" onClick={load}>Atualizar</Button>} />

      <div className="g-kpis" style={{ marginBottom: 24 }}>
        <Card tight><div className="g-stat"><span className="g-stat-label">Fornecedores</span><span className="g-stat-value">{suppliers.length}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Custo de entrega (somatorio)</span><span className="g-stat-value" style={{ color: 'var(--warn)' }}>{MZN(totalDelivery)}</span></div></Card>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <CardHead title="Registar fornecedor" hint="O custo de entrega e deduzido no relatorio mensal" />
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Distribuidora Maputo" />
            <Input label="Telefone / WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ex: 84 000 0000" />
            <Input label="Produtos que fornece" value={form.products_supplied} onChange={(e) => setForm({ ...form, products_supplied: e.target.value })} placeholder="Ex: Bebidas, mercearia" />
            <Input label="Custo de entrega por visita (MZN)" type="number" step="0.01" min="0" value={form.delivery_cost_per_visit} onChange={(e) => setForm({ ...form, delivery_cost_per_visit: e.target.value })} />
          </div>
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'A guardar...' : 'Registar fornecedor'}</Button>
          </div>
        </form>
      </Card>

      <Card tight>
        <div style={{ padding: '14px 16px 0' }}><CardHead title="Fornecedores registados" /></div>
        {loading ? <div style={{ padding: 16 }}><Skeleton height={160} /></div> : (
          <Table
            rowKey={(r) => r.id}
            rows={suppliers}
            empty={<EmptyState icon={<Truck size={26} aria-hidden="true" />} title="Sem fornecedores" hint="Regista o primeiro fornecedor acima." />}
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'phone', label: 'Telefone', render: (r) => r.phone || '—' },
              { key: 'products_supplied', label: 'Produtos', render: (r) => r.products_supplied || '—' },
              { key: 'delivery_cost_per_visit', label: 'Custo de entrega', align: 'right', numeric: true, render: (r) => MZN(r.delivery_cost_per_visit) },
            ]}
          />
        )}
      </Card>
      <div style={{ height: 28 }} />
    </div>
  );
}
