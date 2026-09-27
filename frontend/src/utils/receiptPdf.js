/* ==========================================================================
   GENESIS — PDF DO RECIBO (offline, via jsPDF instalado em package.json)
   --------------------------------------------------------------------------
   Nome exacto pedido pelo fundador:  "Recibo_1  26-09-2026  23:58:34.pdf"
   (com os DOIS ESPAÇOS). Construído assim:

   - N: número da venda no dia (`sale.daily_number`, calculado pelo servidor
     e reiniciado a cada dia). Em vendas offline sem número do servidor,
     usa-se o contador local do dia (localStorage com chave pela data:
     à meia-noite a chave muda e o contador recomeça em 1).
   - Data e hora: o momento da IMPRESSÃO, no formato DD-MM-YYYY e HH:mm:ss.

   O PDF é desenhado a partir dos DADOS (texto vectorial nítido), nunca de
   screenshot: o html2canvas corromperia o elemento 3D e o ficheiro ficava
   pesado. O recibo segue a identidade "papel digno de guardar": cabeçalho
   Genesis, serreto, faixas da marca, totais em destaque e selo QR.

   Segurança: todo o texto passa por `clean()` — nomes de produtos maliciosos
   (ex.: "Pão<script>…") saem como texto literal, nunca como instruções.
   ========================================================================== */

import { jsPDF } from 'jspdf';

const LS_DAY_COUNT_KEY = 'genesis.receipt.daycount';

// Retira caracteres de controlo e corta o texto; tudo o que entra no PDF
// passa por aqui (jsPDF interpreta texto literal, mas os nomes no nome do
// ficheiro e no layout não podem ter quebras nem caracteres proibidos).
function clean(value, max = 120) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Contador local do dia (só para vendas offline sem daily_number do servidor).
// A chave inclui a data: à meia-noite muda sozinha e o contador recomeça em 1.
function localDayCount(now) {
  const dayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  let map = {};
  try {
    map = JSON.parse(localStorage.getItem(LS_DAY_COUNT_KEY) || '{}');
  } catch (err) { /* localStorage indisponível: conta só esta vez */ }
  const next = (Number(map[dayKey]) || 0) + 1;
  map[dayKey] = next;
  try {
    localStorage.setItem(LS_DAY_COUNT_KEY, JSON.stringify(map));
  } catch (err) { /* ignorar */ }
  return next;
}

// Formata centavos (Int) para "1 234,56".
function formatMzn(cents) {
  const value = Number(cents || 0) / 100;
  return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Nome exacto: Recibo_<N>⎵⎵<DD-MM-YYYY>⎵⎵<HH:mm:ss>.pdf
export function buildReceiptFileName({ dailyNumber, printedAt = new Date() }) {
  let n = Number(dailyNumber);
  if (!Number.isFinite(n) || n < 1) n = localDayCount(printedAt);
  else n = Math.floor(n);
  const date = `${pad2(printedAt.getDate())}-${pad2(printedAt.getMonth() + 1)}-${printedAt.getFullYear()}`;
  const time = `${pad2(printedAt.getHours())}:${pad2(printedAt.getMinutes())}:${pad2(printedAt.getSeconds())}`;
  return `Recibo_${n}  ${date}  ${time}.pdf`;
}

// Paleta tipográfica do talão (talão térmico: fundo branco, tinta escura).
const INK = [16, 20, 28];
const MUTED = [96, 110, 130];
const BRAND = [229, 9, 20]; // vermelho Genesis (faixas da marca)
const BRAND_DEEP = [140, 10, 17];

// Largura do rolo térmico de 80 mm, em pontos jsPDF.
const PAGE_W = 226.77; // 80mm a 72dpi
const MARGIN = 14;

// Desenha uma faixa de marca com o número da venda em destaque.
function drawBrandBand(doc, y, dailyNumber) {
  doc.setFillColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 24, 4, 4, 'F');
  doc.setFillColor(BRAND_DEEP[0], BRAND_DEEP[1], BRAND_DEEP[2]);
  doc.roundedRect(MARGIN, y + 17, PAGE_W - MARGIN * 2, 7, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12.5);
  doc.text(`VENDA Nº ${String(dailyNumber).padStart(3, '0')}`, PAGE_W / 2, y + 15, { align: 'center' });
}

// Serreto (zig-zag) na ponta do papel.
function drawKnife(doc, y) {
  const teeth = Math.max(8, Math.floor((PAGE_W - MARGIN * 2) / 9));
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  const step = (PAGE_W - MARGIN * 2) / teeth;
  for (let i = 0; i < teeth; i += 1) {
    const x0 = MARGIN + i * step;
    doc.triangle(x0, y, x0 + step / 2, y + 7, x0 + step, y, 'F');
  }
}

// Linha tracejada de separação.
function dashedLine(doc, y) {
  doc.setDrawColor(170, 180, 195);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2.2, 2.2], 0);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setLineDashPattern([], 0);
}

// Quebra um texto longo em linhas que cabem na largura útil.
function wrap(doc, text, maxWidth) {
  const words = clean(text, 240).split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const trial = current ? `${current} ${word}` : word;
    if (doc.getTextWidth(trial) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : ['—'];
}



// Gera o PDF do recibo e devolve { blob, fileName }.
// NÃO faz download sozinho: quem chama decide (download automático + print).
export function generateReceiptPdf({
  shopName = 'Genesis',
  shopLocation = '',
  cashierName = 'Caixa',
  sale = {},
  items = [],
  qrDataUrl = '',
  termsText = '',
}) {
  const printedAt = new Date();
  const cleanDaily = Number(sale.daily_number);
  const hasServerNumber = Number.isFinite(cleanDaily) && cleanDaily >= 1;
  // Sem número do servidor (venda offline): o contador local do dia corre
  // dentro de buildReceiptFileName.
  const fileName = buildReceiptFileName({
    dailyNumber: hasServerNumber ? Math.floor(cleanDaily) : undefined,
    printedAt,
  });
  const bandNumber = hasServerNumber ? Math.floor(cleanDaily) : fileName.match(/Recibo_(\d+)  /)?.[1] ?? 0;

  const total = Number(sale.total_amount || 0);
  const discount = Number(sale.discount_amount || 0);
  const received = Number(sale.amount_received || 0);
  const change = Number(sale.change_given || 0);
  const subtotal = total + (discount > 0 ? discount : 0);

  const paymentLabels = { cash: 'Dinheiro', card: 'Cartão', mobile: 'M-Pesa / Móvel', transfer: 'Transferência', credit: 'Fiado' };
  const payment = paymentLabels[sale.payment_method] || clean(sale.payment_method || 'Dinheiro', 24);
  const createdAt = sale.created_at ? new Date(sale.created_at) : printedAt;
  const createdLabel = Number.isNaN(createdAt.getTime())
    ? printedAt.toLocaleString('pt-MZ')
    : createdAt.toLocaleString('pt-MZ');
  const printedLabel = printedAt.toLocaleString('pt-MZ');

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, 600], compress: true });
  doc.setFont('courier', 'normal');

  let y = 30;

  // ——— Cabeçalho Genesis ———
  doc.setTextColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.setFont('courier', 'bold');
  doc.setFontSize(17);
  doc.text('★ GENESIS ★', PAGE_W / 2, y, { align: 'center' });
  y += 11;
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFontSize(11.5);
  doc.text(clean(shopName, 42).toUpperCase() || 'LOJA', PAGE_W / 2, y, { align: 'center' });
  y += 10;
  if (shopLocation) {
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    wrap(doc, shopLocation, PAGE_W - MARGIN * 2 - 10).slice(0, 2).forEach((line) => {
      doc.text(line, PAGE_W / 2, y, { align: 'center' });
      y += 9;
    });
  }
  y += 2;
  drawBrandBand(doc, y, bandNumber);
  y += 34;

  // ——— Meta ———
  doc.setFontSize(8.6);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const meta = [
    ['Caixista', clean(cashierName, 26)],
    ['Pagamento', payment],
    ['Registada', createdLabel],
    ['Impressa', printedLabel],
  ];
  meta.forEach(([label, value]) => {
    doc.setFont('courier', 'normal');
    doc.text(label, MARGIN + 2, y);
    doc.setFont('courier', 'bold');
    doc.setTextColor(INK[0], INK[1], INK[2]);
    const lines = wrap(doc, value, PAGE_W - MARGIN * 2 - 74).slice(0, 2);
    doc.text(lines[0] || '—', PAGE_W - MARGIN - 2, y, { align: 'right' });
    y += 10;
    lines.slice(1).forEach((extra) => {
      doc.text(extra, PAGE_W - MARGIN - 2, y, { align: 'right' });
      y += 10;
    });
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  });
  y += 2;
  dashedLine(doc, y);
  y += 12;

  // ——— Itens ———
  doc.setFontSize(8.8);
  doc.setFont('courier', 'bold');
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text('QTD  ARTIGO', MARGIN + 2, y);
  doc.text('TOTAL', PAGE_W - MARGIN - 2, y, { align: 'right' });
  y += 10;
  doc.setFont('courier', 'normal');

  const safeItems = (Array.isArray(items) ? items : []).slice(0, 120);
  safeItems.forEach((item) => {
    const qty = Number(item.quantity || 1);
    const unit = Number(item.unit_sell_price ?? item.sell_price ?? 0);
    const lineTotal = qty * unit;
    const nameLines = wrap(doc, item.product_name || 'Produto', PAGE_W - MARGIN * 2 - 76);
    const rowH = 10 + (nameLines.length - 1) * 9;
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(`${qty}x`, MARGIN + 2, y);
    nameLines.forEach((line, idx) => {
      doc.text(line, MARGIN + 26, y + idx * 9);
    });
    doc.setFont('courier', 'bold');
    doc.text(`${formatMzn(lineTotal)}`, PAGE_W - MARGIN - 2, y, { align: 'right' });
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${formatMzn(unit)} c/u`, PAGE_W - MARGIN - 2, y + 9, { align: 'right' });
    doc.setFontSize(8.8);
    y += rowH + 9;
  });
  dashedLine(doc, y - 3);
  y += 9;


  // ——— Totais ———
  doc.setFontSize(9.2);
  const totals = [['Subtotal', formatMzn(subtotal)]];
  if (discount > 0) totals.push(['Desconto', `-${formatMzn(discount)}`]);
  totals.forEach(([label, value]) => {
    doc.setFont('courier', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(label, MARGIN + 2, y);
    doc.setFont('courier', 'bold');
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(value, PAGE_W - MARGIN - 2, y, { align: 'right' });
    y += 11;
  });
  doc.setFillColor(16, 20, 28);
  doc.roundedRect(MARGIN, y - 3, PAGE_W - MARGIN * 2, 22, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL', MARGIN + 8, y + 12);
  doc.text(`${formatMzn(total)} MZN`, PAGE_W - MARGIN - 8, y + 12, { align: 'right' });
  y += 28;

  if (String(sale.payment_method || 'cash') === 'cash') {
    doc.setFontSize(8.8);
    doc.setFont('courier', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('Recebido', MARGIN + 2, y);
    doc.setFont('courier', 'bold');
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(formatMzn(received), PAGE_W - MARGIN - 2, y, { align: 'right' });
    y += 10;
    doc.setFont('courier', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('Troco', MARGIN + 2, y);
    doc.setFont('courier', 'bold');
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(formatMzn(change), PAGE_W - MARGIN - 2, y, { align: 'right' });
    y += 12;
  }

  dashedLine(doc, y);
  y += 12;

  // ——— QR ———
  if (qrDataUrl) {
    try {
      const qrSize = 84;
      doc.addImage(qrDataUrl, 'PNG', (PAGE_W - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 8;
      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text('Escaneia para verificar esta venda', PAGE_W / 2, y, { align: 'center' });
      y += 12;
    } catch (err) { /* QR opcional: sem ele o recibo continua válido */ }
  }

  // ——— Rodapé Genesis ———
  doc.setTextColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.6);
  doc.text('Obrigado pela preferência!', PAGE_W / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('Este recibo foi gerado pelo sistema Genesis.', PAGE_W / 2, y, { align: 'center' });
  y += 9;
  const terms = clean(termsText || 'Vendas e gestão com Genesis.', 140);
  wrap(doc, terms, PAGE_W - MARGIN * 2 - 20).slice(0, 2).forEach((line) => {
    doc.text(line, PAGE_W / 2, y, { align: 'center' });
    y += 9;
  });
  y += 4;

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFontSize(7.4);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`pág. ${p}/${totalPages} · ${fileName.replace(/\.pdf$/i, '')}`, PAGE_W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  drawKnife(doc, y + 2);
  const blob = doc.output('blob');
  return { blob, fileName, dailyNumber: bandNumber, printedAt };
}

// Força o download do blob com o nome pedido.
export function downloadReceiptPdf({ blob, fileName }) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return fileName;
}

