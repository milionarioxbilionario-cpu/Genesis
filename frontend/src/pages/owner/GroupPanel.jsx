import React, { useState } from 'react';
import { Store } from 'lucide-react';
import api, { announceEstablishmentChange } from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, errorMessage } from '../../utils/format';
import { forgetOwnerData } from '../../utils/session';
import { useI18n } from '../../i18n/react';
import { Alert, Badge, Button, Card, PageHeader, Skeleton, Table } from '../../components/ui';

// Etapa D: painel geral do dono com varios estabelecimentos — somas de hoje,
// 7 dias e do mes (vendas, lucro bruto), por estabelecimento e no total, e
// quantos produtos estao esgotados em cada um. «Abrir» passa a trabalhar nele.
export default function GroupPanel() {
  const { t } = useI18n();
  const sum = useApi('/api/establishments/summary');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function open(id) {
    setBusy(id); setError('');
    try {
      await api.post('/api/establishments/switch', { tenant_id: id });
      announceEstablishmentChange(id);
      await forgetOwnerData();
      window.location.assign('/app');
    } catch (err) { setError(errorMessage(err)); setBusy(''); }
  }

  const d = sum.data;
  const Tot = ({ label, v }) => (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="num mt-1 text-2xl font-semibold text-ink">{money(v.total)}</p>
      <p className="mt-1 text-sm text-ink-muted">{t('Lucro bruto {p} · {n} venda(s)', { p: money(v.profit), n: v.count })}</p>
    </Card>
  );
  return (
    <>
      <PageHeader title={t('Painel geral')} description={t('Todos os seus estabelecimentos juntos. Cada um continua com os seus produtos, caixistas e vendas.')} />
      {(error || sum.error) && <Alert tone="danger" className="mb-4">{error || sum.error}</Alert>}
      {!d ? <Skeleton className="h-40 w-full" /> : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Tot label={t('Hoje')} v={d.totals.today} />
            <Tot label={t('Últimos 7 dias')} v={d.totals.week} />
            <Tot label={t('Este mês')} v={d.totals.month} />
          </div>
          <Table
            columns={[
              { key: 'name', header: t('Estabelecimento'), render: (e) => <span className="flex items-center gap-2"><Store size={16} className="text-ink-muted" /><span className="font-medium text-ink">{e.name}</span>{e.is_current && <Badge tone="info">{t('Aberto agora')}</Badge>}</span> },
              { key: 'today', header: t('Hoje'), align: 'right', render: (e) => money(e.today.total) },
              { key: 'week', header: t('7 dias'), align: 'right', render: (e) => money(e.week.total) },
              { key: 'month', header: t('Mês'), align: 'right', render: (e) => money(e.month.total) },
              { key: 'profit', header: t('Lucro do mês'), align: 'right', render: (e) => money(e.month.profit) },
              { key: 'out', header: t('Esgotados'), align: 'right', render: (e) => (e.out_of_stock ? <Badge tone="warning">{e.out_of_stock}</Badge> : '0') },
              { key: 'go', header: '', align: 'right', render: (e) => (e.is_current ? null : <Button size="sm" loading={busy === e.id} onClick={() => open(e.id)}>{t('Abrir')}</Button>) },
            ]}
            rows={d.establishments}
          />
        </div>
      )}
    </>
  );
}
