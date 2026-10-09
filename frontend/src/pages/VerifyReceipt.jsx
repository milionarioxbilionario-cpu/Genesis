import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { money, dateTime, errorMessage, PAYMENT_LABEL } from '../utils/format';
import { Alert, KeyValue } from '../components/ui';
import { FullPageSpinner } from '../utils/session';
import AuthLayout from './auth/AuthLayout';

// Pagina publica aberta pelo QR do recibo (especificacao 6.9): confirma que a
// venda existe e se continua valida. Sem sessao; so o que ja esta no recibo.
export default function VerifyReceipt() {
  const { saleId } = useParams();
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let alive = true;
    api.get('/api/verify/' + encodeURIComponent(saleId), { silent: true })
      .then((res) => { if (alive) setState({ loading: false, data: res.data }); })
      .catch((err) => { if (alive) setState({ loading: false, error: err, status: err?.response?.status }); });
    return () => { alive = false; };
  }, [saleId]);

  if (state.loading) return <FullPageSpinner />;
  if (state.error) {
    const notFound = state.status === 404 || state.status === 400;
    return (
      <AuthLayout title="Verificação de recibo">
        <Alert tone={notFound ? 'warning' : 'danger'} title={notFound ? 'Recibo não encontrado' : 'Não foi possível verificar'}>
          {notFound
            ? 'Este código não corresponde a nenhuma venda registada no Genesis. Se a venda foi feita sem ligação há pouco tempo, pode ainda não ter chegado ao sistema — tente mais tarde.'
            : errorMessage(state.error)}
        </Alert>
      </AuthLayout>
    );
  }

  const { store, sale } = state.data;
  const cancelled = sale.status !== 'completed';
  const subtotal = sale.items.reduce((s, l) => s + l.quantity * l.unit_sell_price, 0);
  return (
    <AuthLayout title="Verificação de recibo" description={store.name + (store.location ? ' · ' + store.location : '')}>
      {cancelled
        ? <Alert tone="danger" title="Venda cancelada">Este recibo foi emitido pela loja, mas a venda foi cancelada depois. Já não é válido.</Alert>
        : <Alert tone="positive" title="Recibo autêntico">Esta venda está registada no Genesis e continua válida.</Alert>}
      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <KeyValue label="Venda n.º" value={String(sale.daily_number || '').padStart(3, '0')} />
        <KeyValue label="Data" value={dateTime(sale.created_at)} />
        <div className="my-1 border-t border-border" />
        {sale.items.map((l, i) => <KeyValue key={i} label={`${l.quantity} × ${l.product_name}`} value={money(l.quantity * l.unit_sell_price)} />)}
        <div className="my-1 border-t border-border" />
        {sale.discount_amount > 0 && <><KeyValue label="Subtotal" value={money(subtotal)} /><KeyValue label="Desconto" value={'−' + money(sale.discount_amount)} /></>}
        <KeyValue label="Total" value={money(sale.total_amount)} strong />
        <KeyValue label="Pagamento" value={PAYMENT_LABEL[sale.payment_method] || sale.payment_method} />
      </div>
    </AuthLayout>
  );
}
