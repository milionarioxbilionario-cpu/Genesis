// Recibo em PDF no formato de talao (80 mm de largura), para telemovel/tablet:
// sai pela folha de partilha (imprimir, guardar, WhatsApp). O computador
// continua a imprimir pelo dialogo de impressao (receiptPrinter.js).
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { money } from '../format';
import { pdfText as t, safeFileName, dmy, hms } from './text';

const W = 80;
const M = 4;
const INK = [17, 28, 43];

function render(doc, { shopName, shopLocation, cashierName, sale, items, qrDataUrl }) {
  const total = Number(sale.total_amount || 0);
  const discount = Number(sale.discount_amount || 0);
  const when = new Date(sale.created_at || Date.now());
  let y = 8;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  const name = doc.splitTextToSize(t(shopName || 'Genesis').toUpperCase(), W - 2 * M);
  doc.text(name, W / 2, y, { align: 'center' }); y += name.length * 5;
  if (shopLocation) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(t(shopLocation), W / 2, y, { align: 'center', maxWidth: W - 2 * M }); y += 4;
  }
  y += 1;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  for (const line of [
    `N.º de venda: ${String(Number(sale.daily_number || 0)).padStart(3, '0')}`,
    `Data: ${when.toLocaleString('pt-MZ')}`,
    `Caixista: ${cashierName || '-'}`,
    `Pagamento: ${sale.payment_method || 'Dinheiro'}`,
  ]) { doc.text(t(line), M, y); y += 3.8; }
  doc.setDrawColor(...INK); doc.line(M, y, W - M, y); y += 1;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Produto', 'Qtd', 'Preço', 'Total'].map(t)],
    body: (items || []).map((i) => {
      const unit = Number(i.unit_sell_price || i.sell_price || 0);
      const q = Number(i.quantity || 1);
      return [t(i.product_name || 'Produto'), String(q), t(money(unit)), t(money(q * unit))];
    }),
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 0.8, textColor: INK },
    headStyles: { fontStyle: 'bold', fillColor: INK, textColor: 255 },
    columnStyles: { 1: { halign: 'center', cellWidth: 7 }, 2: { halign: 'right', cellWidth: 18 }, 3: { halign: 'right', cellWidth: 19 } },
    didParseCell: (d) => { if (d.section === 'head' && d.column.index > 0) d.cell.styles.halign = d.column.index === 1 ? 'center' : 'right'; },
  });
  y = doc.lastAutoTable.finalY + 4;

  const row = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 9.5 : 8.5);
    doc.text(t(label), M, y); doc.text(t(value), W - M, y, { align: 'right' }); y += bold ? 5 : 4;
  };
  row('Subtotal', money(total + discount));
  if (discount > 0) row('Desconto', '-' + money(discount));
  row('Recebido', money(sale.amount_received));
  row('Troco', money(sale.change_given));
  doc.line(M, y - 2.5, W - M, y - 2.5); y += 1;
  row('Total', money(total), true);

  if (/^data:image\/png;base64,/.test(String(qrDataUrl || ''))) {
    y += 2;
    doc.addImage(qrDataUrl, 'PNG', (W - 26) / 2, y, 26, 26); y += 29;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(t('Leia o código para confirmar o recibo'), W / 2, y, { align: 'center' }); y += 4;
  }
  doc.setFontSize(8);
  doc.text(t(`Obrigado pela preferência! ${shopName || ''}`), W / 2, y + 2, { align: 'center', maxWidth: W - 2 * M });
  return y + 8;
}

// Duas passagens: a primeira mede a altura, a segunda desenha numa folha do
// tamanho exacto (talao continuo, sem espaco branco no fim).
export function buildReceiptPdf(input) {
  const probe = new jsPDF({ unit: 'mm', format: [W, 1000] });
  const height = Math.max(90, Math.ceil(render(probe, input)));
  const doc = new jsPDF({ unit: 'mm', format: [W, height] });
  render(doc, input);
  const when = new Date(input.sale.created_at || Date.now());
  const n = String(Number(input.sale.daily_number || 0)).padStart(3, '0');
  const filename = `Recibo_${n} - ${safeFileName(input.shopName)} (${dmy(when)} - ${hms(when)}).pdf`;
  return { blob: doc.output('blob'), filename };
}
