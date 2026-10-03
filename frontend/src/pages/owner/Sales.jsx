import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import useApi from '../../utils/useApi';
import { printReceipt } from '../../utils/receiptPrinter';
import { money, dateTime, isoDay, PAYMENT_LABEL } from '../../utils/format';
import { Badge, Button, Drawer, Input, KeyValue, PageHeader, Pagination, Select, Table, Tabs, Toolbar } from '../../components/ui';
import { useOutletContext } from 'react-router-dom';

const PAGE_SIZE = 25;

export default function Sales() {
  const [tab, setTab] = useState('sales');
  return (
    <>
      <PageHeader title="Vendas" description="Histórico de todas as vendas, cancelamentos e fechos de turno." />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[{ value: 'sales', label: 'Vendas' }, { value: 'closings', label: 'Fechos de turno' }]} />
      {tab === 'sales' ? <SalesTable /> : <Closings />}
    </>
  );
}

function SalesTable() {
  const { tenant } = useOutletContext();
  const [filters, setFilters] = useState({ from: isoDay(new Date(Date.now() - 6 * 86400000)), to: isoDay(), cashier_id: '', method: '', status: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const cashiers = useApi('/api/owner/cashiers');
  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    return '/api/owner/sales?' + p.toString();
  }, [filters, page]);
  const { data, loading } = useApi(query);
  const set = (k) => (e) => { setPage(1); setFilters((f) => ({ ...f, [k]: e.target.value })); };

  const columns = [
    { key: 'n', header: 'N.º', render: (s) => <span className="num text-ink-muted">{String(s.daily_number || '').padStart(3, '0')}</span> },
    { key: 'created_at', header: 'Data', render: (s) => dateTime(s.created_at) },
    { key: 'cashier', header: 'Caixista', render: (s) => s.cashier?.name || '—' },
    { key: 'method', header: 'Pagamento', render: (s) => PAYMENT_LABEL[s.payment_method] || s.payment_method },
    { key: 'status', header: 'Estado', render: (s) => (s.status === 'cancelled' ? <Badge tone="danger">Cancelada</Badge> : <Badge tone="positive">Concluída</Badge>) },
    { key: 'total', header: 'Total', align: 'right', render: (s) => <span className={s.status === 'cancelled' ? 'text-ink-faint line-through' : 'font-medium'}>{money(s.total_amount)}</span> },
  ];

  return (
    <>
      <Toolbar>
        <Input type="date" aria-label="De" value={filters.from} onChange={set('from')} className="w-40" />
        <Input type="date" aria-label="Até" value={filters.to} onChange={set('to')} className="w-40" />
        <Select aria-label="Caixista" value={filters.cashier_id} onChange={set('cashier_id')} className="w-44">
          <option value="">Todos os caixistas</option>
          {(cashiers.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label="Pagamento" value={filters.method} onChange={set('method')} className="w-44">
          <option value="">Todos os pagamentos</option>
          {Object.entries(PAYMENT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Select aria-label="Estado" value={filters.status} onChange={set('status')} className="w-36">
          <option value="">Todos</option><option value="completed">Concluídas</option><option value="cancelled">Canceladas</option>
        </Select>
      </Toolbar>
      <Table columns={columns} rows={data?.rows || []} loading={loading && !data} onRowClick={setSelected} empty={<p className="py-10 text-center text-ink-muted">Sem vendas neste período.</p>} />
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Venda n.º ${String(selected.daily_number || '').padStart(3, '0')}` : ''}
        description={selected ? dateTime(selected.created_at) + ' · ' + (selected.cashier?.name || '') : ''}
        footer={selected && selected.status !== 'cancelled' && (
          <Button icon={Printer} onClick={() => printReceipt({
            shopName: tenant?.name, shopLocation: tenant?.location, cashierName: selected.cashier?.name,
            sale: { ...selected, payment_method: PAYMENT_LABEL[selected.payment_method] }, items: selected.items,
          })}>Reimprimir recibo</Button>
        )}
      >
        {selected && (
          <>
            {selected.status === 'cancelled' && (
              <div className="mb-4 rounded border border-border bg-danger-soft p-3 text-sm text-ink-2">
                <p className="font-medium text-danger">Venda cancelada</p>
                <p>Motivo: {selected.cancel_reason || '—'}</p>
              </div>
            )}
            {selected.items.map((it) => <KeyValue key={it.id} label={`${it.quantity} × ${it.product_name}`} value={money(it.quantity * it.unit_sell_price)} />)}
            <div className="my-2 border-t border-border" />
            {selected.discount_amount > 0 && <KeyValue label="Desconto" value={'−' + money(selected.discount_amount)} />}
            <KeyValue label="Total" value={money(selected.total_amount)} strong />
            <KeyValue label="Custo dos produtos" value={money(selected.total_cost)} />
            <KeyValue label="Margem" value={money(selected.total_amount - selected.total_cost)} tone="positive" />
            <KeyValue label={PAYMENT_LABEL[selected.payment_method]} value={money(selected.amount_received)} />
            {selected.change_given > 0 && <KeyValue label="Troco" value={money(selected.change_given)} />}
          </>
        )}
      </Drawer>
    </>
  );
}

function Closings() {
  const { data, loading } = useApi('/api/owner/shift-closings');
  const columns = [
    { key: 'closed_at', header: 'Fecho', render: (r) => dateTime(r.closed_at) },
    { key: 'cashier', header: 'Caixista', render: (r) => r.cashier_name },
    { key: 'expected', header: 'Esperado', align: 'right', render: (r) => money(r.expected_amount) },
    { key: 'counted', header: 'Contado', align: 'right', render: (r) => money(r.counted_amount) },
    { key: 'diff', header: 'Diferença', align: 'right', render: (r) => <span className={r.difference === 0 ? 'text-ink-muted' : 'font-medium text-warning'}>{money(r.difference, { sign: true })}</span> },
  ];
  return <Table columns={columns} rows={data || []} loading={loading} empty={<p className="py-10 text-center text-ink-muted">Ainda não houve fechos de turno.</p>} />;
}
