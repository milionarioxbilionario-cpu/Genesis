// Recibo em PDF no formato de talao (80 mm de largura), para telemovel/tablet:
// sai pela folha de partilha (imprimir, guardar, WhatsApp). O computador
// continua a imprimir pelo dialogo de impressao (receiptPrinter.js).
// Fase 15.1: logotipo do estabelecimento, NUIT, telefone, numero do documento
// com codigo de barras, QR e mensagem final do dono.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// PDF sai sempre com os valores, mesmo no modo privado.
import { moneyExact as money } from '../format';
import { code128Bars, documentBarcode, documentNumber } from '../code128';
import { pdfText, safeFileName, dmy, hms } from './text';
import { getLang, locale, t } from '../../i18n/core.js';

// 9.5: na lingua de quem gera o recibo; em portugues fica igual (data pt-MZ).
const receiptLocale = () => (getLang() === 'pt' ? 'pt-MZ' : locale());

const W = 80;
const M = 4;
const INK = [17, 17, 17];
const MUTED = [85, 85, 85];
const IMG = /^data:image\/(png|jpe?g|webp);base64,/;

function imageType(dataUrl) {
  const m = String(dataUrl).match(/^data:image\/(png|jpe?g|webp)/);
  return m ? ({ png: 'PNG', jpg: 'JPEG', jpeg: 'JPEG', webp: 'WEBP' })[m[1]] : null;
}

function render(doc, { shopName, shopLocation, shopPhone, shopNuit, footer, logo, cashierName, sale, items, qrDataUrl }) {
  const total = Number(sale.total_amount || 0);
  const discount = Number(sale.discount_amount || 0);
  const when = new Date(sale.created_at || Date.now());
  let y = 6;
  doc.setTextColor(...INK);

  // Logotipo (se houver): ate 46 x 24 mm, centrado, proporcao mantida.
  if (logo && IMG.test(logo)) {
    try {
      const p = doc.getImageProperties(logo);
      const scale = Math.min(46 / p.width, 24 / p.height);
      const w = p.width * scale; const h = p.height * scale;
      doc.addImage(logo, imageType(logo) || 'PNG', (W - w) / 2, y, w, h, 'logo', 'FAST');
      y += h + 3;
    } catch { /* imagem invalida: fica so o nome */ }
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5);
  const name = doc.splitTextToSize(pdfText(shopName || 'Genesis'), W - 2 * M);
  doc.text(name, W / 2, y + 2, { align: 'center' }); y += name.length * 5 + 1;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  const meta = [shopLocation, [shopPhone ? `${t('Tel.')} ${shopPhone}` : '', shopNuit ? `NUIT ${shopNuit}` : ''].filter(Boolean).join(' · ')].filter(Boolean);
  for (const m of meta) { doc.text(pdfText(m), W / 2, y, { align: 'center', maxWidth: W - 2 * M }); y += 3.6; }
  doc.setTextColor(...INK);
  y += 1;
  doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 5;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.text(pdfText(t('RECIBO')), M, y);
  doc.setFont('courier', 'bold'); doc.setFontSize(9.5);
  doc.text(documentNumber(sale), W - M, y, { align: 'right' }); y += 4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  doc.text(pdfText(when.toLocaleString(receiptLocale())), M, y);
  doc.text(pdfText(`${t('Caixista:')} ${cashierName || '-'}`), W - M, y, { align: 'right' }); y += 2;
  doc.setTextColor(...INK);

  autoTable(doc, {
    startY: y + 1,
    margin: { left: M, right: M },
    body: (items || []).map((i) => {
      const unit = Number(i.unit_sell_price || i.sell_price || 0);
      const q = Number(i.quantity || 1);
      return [`${pdfText(i.product_name || t('Produto'))}\n${q} x ${pdfText(money(unit))}`, pdfText(money(q * unit))];
    }),
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 }, textColor: INK, lineColor: [200, 200, 200], lineWidth: { bottom: 0.15 } },
    columnStyles: { 1: { halign: 'right', cellWidth: 24, fontStyle: 'bold' } },
  });
  y = doc.lastAutoTable.finalY + 4;

  const row = (label, value, { bold = false, size = 8.5, color = INK } = {}) => {
    doc.setTextColor(...color);
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size);
    doc.text(pdfText(label), M, y); doc.text(pdfText(value), W - M, y, { align: 'right' }); y += size >= 11 ? 6 : 4;
  };
  row(t('Subtotal'), money(total + discount));
  if (discount > 0) row(t('Desconto'), '-' + money(discount));
  doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M, y - 2, W - M, y - 2); y += 2.5;
  row(t('Total'), money(total), { bold: true, size: 12 });
  if (Number(sale.vat_amount) > 0) row(t('IVA incluído'), money(sale.vat_amount), { size: 7.5, color: MUTED });
  row(t('Pagamento:'), sale.payment_method || t('Dinheiro'), { size: 7.5, color: MUTED });
  for (const p of sale.payments || []) row('  ' + p.method, money(p.amount), { size: 7.5, color: MUTED });
  row(t('Recebido'), money(sale.amount_received), { size: 7.5, color: MUTED });
  row(t('Troco'), money(sale.change_given), { size: 7.5, color: MUTED });
  doc.setTextColor(...INK);

  // Codigo de barras do documento (Code 128, desenhado com rectangulos).
  try {
    const { bars, modules } = code128Bars(documentBarcode(sale));
    const mod = Math.min(0.42, (W - 2 * M - 8) / modules);
    const x0 = (W - modules * mod) / 2;
    y += 2;
    doc.setFillColor(0, 0, 0);
    for (const b of bars) doc.rect(x0 + b.x * mod, y, b.w * mod, 10, 'F');
    y += 13;
    doc.setFont('courier', 'normal'); doc.setFontSize(7.5);
    doc.text(documentNumber(sale), W / 2, y, { align: 'center' }); y += 3;
  } catch { /* sem codigo de barras */ }

  if (/^data:image\/png;base64,/.test(String(qrDataUrl || ''))) {
    y += 2;
    doc.addImage(qrDataUrl, 'PNG', (W - 24) / 2, y, 24, 24, 'qr', 'FAST'); y += 27;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...MUTED);
    doc.text(pdfText(t('Leia o código para confirmar o recibo')), W / 2, y, { align: 'center' }); y += 4;
    doc.setTextColor(...INK);
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  const thanks = doc.splitTextToSize(pdfText(footer || t('Obrigado pela preferência!')), W - 2 * M);
  doc.text(thanks, W / 2, y + 2, { align: 'center' }); y += thanks.length * 4 + 3;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(120, 120, 120);
  doc.text('Genesis MZ · genesismz.com', W / 2, y + 1, { align: 'center' });
  return y + 6;
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
  const filename = `${t('Recibo')}_${n} - ${safeFileName(input.shopName)} (${dmy(when)} - ${hms(when)}).pdf`;
  return { blob: doc.output('blob'), filename };
}
