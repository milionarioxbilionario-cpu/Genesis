import React, { useMemo, useState } from 'react';
import useApi from '../../utils/useApi';
import SaleDrawer from '../../components/SaleDrawer';
import { money, dateTime, isoDay, PAYMENT_LABEL } from '../../utils/format';
import { useI18n } from '../../i18n/react';
import { Badge, Input, PageHeader, Pagination, Select, Table, Tabs, Toolbar } from '../../components/ui';

const PAGE_SIZE = 25;

export default function Sales() {
  const { t } = useI18n();
  const [tab, setTab] = useState('sales');
  return (
    <>
      <PageHeader title={t('Vendas')} description={t('Histórico de todas as vendas, cancelamentos e fechos de turno.')} />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[{ value: 'sales', label: t('Vendas') }, { value: 'closings', label: t('Fechos de turno') }]} />
      {tab === 'sales' ? <SalesTable /> : <Closings />}
    </>
  );
}

function SalesTable() {
  const { t } = useI18n();
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
    { key: 'n', header: t('N.º'), render: (s) => <span className="num text-ink-muted">{String(s.daily_number || '').padStart(3, '0')}</span> },
    { key: 'created_at', header: t('Data'), render: (s) => dateTime(s.created_at) },
    { key: 'cashier', header: t('Caixista'), render: (s) => s.cashier?.name || '—' },
    { key: 'method', header: t('Pagamento'), render: (s) => PAYMENT_LABEL[s.payment_method] || s.payment_method },
    { key: 'status', header: t('Estado'), render: (s) => (s.status === 'cancelled' ? <Badge tone="danger">{t('Cancelada')}</Badge> : <Badge tone="positive">{t('Concluída')}</Badge>) },
    { key: 'total', header: t('Total'), align: 'right', render: (s) => <span className={s.status === 'cancelled' ? 'text-ink-faint line-through' : 'font-medium'}>{money(s.total_amount)}</span> },
  ];

  return (
    <>
      <Toolbar>
        <Input type="date" aria-label={t('De')} value={filters.from} onChange={set('from')} className="w-40" />
        <Input type="date" aria-label={t('Até')} value={filters.to} onChange={set('to')} className="w-40" />
        <Select aria-label={t('Caixista')} value={filters.cashier_id} onChange={set('cashier_id')} className="w-44">
          <option value="">{t('Todos os caixistas')}</option>
          {(cashiers.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label={t('Pagamento')} value={filters.method} onChange={set('method')} className="w-44">
          <option value="">{t('Todos os pagamentos')}</option>
          {Object.entries(PAYMENT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Select aria-label={t('Estado')} value={filters.status} onChange={set('status')} className="w-36">
          <option value="">{t('Todos')}</option><option value="completed">{t('Concluídas')}</option><option value="cancelled">{t('Canceladas')}</option>
        </Select>
      </Toolbar>
      <Table columns={columns} rows={data?.rows || []} loading={loading && !data} onRowClick={setSelected} empty={<p className="py-10 text-center text-ink-muted">{t('Sem vendas neste período.')}</p>} />
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />}

      <SaleDrawer sale={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function Closings() {
  const { t } = useI18n();
  const { data, loading } = useApi('/api/owner/shift-closings');
  const columns = [
    { key: 'closed_at', header: t('Fecho'), render: (r) => dateTime(r.closed_at) },
    { key: 'cashier', header: t('Caixista'), render: (r) => r.cashier_name },
    { key: 'expected', header: t('Esperado'), align: 'right', render: (r) => money(r.expected_amount) },
    { key: 'counted', header: t('Contado'), align: 'right', render: (r) => money(r.counted_amount) },
    { key: 'diff', header: t('Diferença'), align: 'right', render: (r) => <span className={r.difference === 0 ? 'text-ink-muted' : 'font-medium text-warning'}>{money(r.difference, { sign: true })}</span> },
  ];
  return <Table columns={columns} rows={data || []} loading={loading} empty={<p className="py-10 text-center text-ink-muted">{t('Ainda não houve fechos de turno.')}</p>} />;
}
