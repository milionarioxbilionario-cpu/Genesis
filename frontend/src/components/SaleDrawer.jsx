import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { preloadReceiptPdf, printReceipt } from '../utils/receiptPrinter';
import PdfReadyDialog from './PdfReadyDialog';
import { money, dateTime, timeSec, PAYMENT_LABEL } from '../utils/format';
import { useI18n } from '../i18n/react';
import { Button, Drawer, KeyValue, useToast } from './ui';

// Detalhe de uma venda no painel do dono (Vendas e Relatorios): itens,
// desconto, pagamento, margem e reimpressao do recibo.
export default function SaleDrawer({ sale, onClose }) {
  const { tenant } = useOutletContext() || {};
  const { t } = useI18n();
  const [pdfFile, setPdfFile] = useState(null);
  const toast = useToast();
  useEffect(() => { if (sale) preloadReceiptPdf(); }, [sale]);
  async function reprint() {
    const res = await printReceipt({
      shopName: tenant?.name, shopLocation: tenant?.location, cashierName: sale.cashier?.name,
      sale: { ...sale, payment_method: PAYMENT_LABEL[sale.payment_method] }, items: sale.items,
    });
    if (res?.needsTap) setPdfFile(res.file);
    if (res?.printError) toast(t('Recibo guardado em PDF. A impressora falhou: {e}', { e: res.printError }), 'danger');
  }
  return (
    <Drawer
      open={Boolean(sale)}
      onClose={onClose}
      title={sale ? t('Venda n.º {n}', { n: String(sale.daily_number || '').padStart(3, '0') }) : ''}
      description={sale ? `${dateTime(sale.created_at)} (${timeSec(sale.created_at)}) · ${sale.cashier?.name || ''}` : ''}
      footer={sale && sale.status !== 'cancelled' && (
        <Button icon={Printer} onClick={reprint}>{t('Reimprimir recibo')}</Button>
      )}
    >
      {sale && (
        <>
          {sale.status === 'cancelled' && (
            <div className="mb-4 rounded border border-border bg-danger-soft p-3 text-sm text-ink-2">
              <p className="font-medium text-danger">{t('Venda cancelada')}</p>
              <p>{t('Motivo:')} {sale.cancel_reason || '—'}</p>
            </div>
          )}
          {sale.items.map((it) => <KeyValue key={it.id} label={`${it.quantity} × ${it.product_name}`} value={money(it.quantity * it.unit_sell_price)} />)}
          <div className="my-2 border-t border-border" />
          {sale.discount_amount > 0 && <KeyValue label={t('Desconto')} value={'−' + money(sale.discount_amount)} />}
          <KeyValue label={t('Total')} value={money(sale.total_amount)} strong />
          <KeyValue label={t('Custo dos produtos')} value={money(sale.total_cost)} />
          <KeyValue label={t('Margem')} value={money(sale.total_amount - sale.total_cost)} tone="positive" />
          <KeyValue label={PAYMENT_LABEL[sale.payment_method] || sale.payment_method} value={money(sale.amount_received)} />
          {sale.change_given > 0 && <KeyValue label={t('Troco')} value={money(sale.change_given)} />}
        </>
      )}
      <PdfReadyDialog file={pdfFile} onClose={() => setPdfFile(null)} />
    </Drawer>
  );
}
