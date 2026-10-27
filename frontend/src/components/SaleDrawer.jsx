import React, { useEffect, useState } from 'react';
import { ImageDown, Printer } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { preloadReceiptPdf, printReceipt, shareReceiptImage } from '../utils/receiptPrinter';
import PdfReadyDialog from './PdfReadyDialog';
import { money, dateTime, timeSec, PAYMENT_LABEL } from '../utils/format';
import { formatQty, lineAmount } from '../utils/units';
import { useI18n } from '../i18n/react';
import api from '../utils/api';

// Dados do recibo (logotipo, NUIT, telefone, mensagem): pedidos uma vez por sessao.
let receiptInfo = null;
const loadReceiptInfo = () => {
  if (!receiptInfo) receiptInfo = api.get('/api/settings/receipt', { silent: true }).then((r) => r.data).catch(() => { receiptInfo = null; return null; });
  return receiptInfo;
};
export const forgetReceiptInfo = () => { receiptInfo = null; };
import { Button, Drawer, KeyValue, useToast } from './ui';

// Detalhe de uma venda no painel do dono (Vendas e Relatorios): itens,
// desconto, pagamento, margem e reimpressao do recibo.
export default function SaleDrawer({ sale, onClose }) {
  const { tenant } = useOutletContext() || {};
  const { t } = useI18n();
  const [pdfFile, setPdfFile] = useState(null);
  const toast = useToast();
  useEffect(() => { if (sale) preloadReceiptPdf(); }, [sale]);
  async function receiptInput() {
    const r = (await loadReceiptInfo()) || {};
    return {
      shopName: r.name || tenant?.name, shopLocation: r.location || tenant?.location, shopPhone: r.phone, shopNuit: r.nuit, footer: r.receipt_footer, logo: r.logo,
      cashierName: sale.cashier?.name,
      sale: { ...sale, payment_method: PAYMENT_LABEL[sale.payment_method], payments: (sale.payments || []).map((p) => ({ method: PAYMENT_LABEL[p.method] || p.method, amount: p.amount })) }, items: sale.items,
    };
  }
  async function reprint() {
    const res = await printReceipt(await receiptInput());
    if (res?.needsTap) setPdfFile(res.file);
    if (res?.printError) toast(t('Recibo guardado em PDF. A impressora falhou: {e}', { e: res.printError }), 'danger');
  }
  // Fase 15.1b: imagem do recibo para enviar ao cliente por WhatsApp.
  async function sendImage() {
    try {
      const res = await shareReceiptImage(await receiptInput());
      if (res?.needsTap) setPdfFile(res.file);
      else if (res?.via === 'download') toast(t('Imagem do recibo guardada. Envie-a ao cliente pelo WhatsApp.'));
    } catch { toast(t('Não foi possível criar a imagem do recibo.'), 'danger'); }
  }
  return (
    <Drawer
      open={Boolean(sale)}
      onClose={onClose}
      title={sale ? t('Venda n.º {n}', { n: String(sale.daily_number || '').padStart(3, '0') }) : ''}
      description={sale ? `${dateTime(sale.created_at)} (${timeSec(sale.created_at)}) · ${sale.cashier?.name || ''}` : ''}
      footer={sale && sale.status !== 'cancelled' && (
        <div className="flex flex-wrap justify-end gap-2"><Button icon={ImageDown} onClick={sendImage}>{t('Imagem (WhatsApp)')}</Button><Button icon={Printer} onClick={reprint}>{t('Reimprimir recibo')}</Button></div>
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
          {sale.items.map((it) => <KeyValue key={it.id} label={`${formatQty(it.quantity, it.unit)} × ${it.product_name}`} value={money(lineAmount(it.quantity, it.unit_sell_price, it.unit))} />)}
          <div className="my-2 border-t border-border" />
          {sale.discount_amount > 0 && <KeyValue label={t('Desconto')} value={'−' + money(sale.discount_amount)} />}
          <KeyValue label={t('Total')} value={money(sale.total_amount)} strong />
          <KeyValue label={t('Custo dos produtos')} value={money(sale.total_cost)} />
          <KeyValue label={t('Margem')} value={money(sale.total_amount - sale.total_cost)} tone="positive" />
          {sale.payments?.length ? sale.payments.map((p) => <KeyValue key={p.method} label={PAYMENT_LABEL[p.method] || p.method} value={money(p.amount)} />) : <KeyValue label={PAYMENT_LABEL[sale.payment_method] || sale.payment_method} value={money(sale.amount_received)} />}
          {sale.change_given > 0 && <KeyValue label={t('Troco')} value={money(sale.change_given)} />}
        </>
      )}
      <PdfReadyDialog file={pdfFile} onClose={() => setPdfFile(null)} />
    </Drawer>
  );
}
