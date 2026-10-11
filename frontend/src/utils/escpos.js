// Recibo em ESC/POS para impressoras termicas de 58/80 mm (Fase 8.8). Puro:
// devolve os bytes; quem os envia e utils/devices.js (USB ou Bluetooth).
// Texto SEM acentos ("Agua"): cada marca de impressora usa uma tabela de
// caracteres diferente e um "á" sai como lixo; sem acentos sai sempre legivel.
// Largura de 32 colunas: cabe em 58 mm e em 80 mm.
const ESC = 0x1b;
const GS = 0x1d;
export const WIDTH = 32;

export function fold(text) {
  return String(text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[ºª]/g, 'o').replace(/[×]/g, 'x').replace(/[–—]/g, '-').replace(/[«»“”]/g, '"')
    .replace(/[^\x20-\x7e\n]/g, '?');
}

const mzn = (c) => (Number(c || 0) / 100).toFixed(2).replace('.', ',');

// "Esquerda ....... direita" numa linha de WIDTH colunas.
export function twoCols(left, right, width = WIDTH) {
  const r = fold(right);
  const l = fold(left).slice(0, Math.max(0, width - r.length - 1));
  return l + ' '.repeat(Math.max(1, width - l.length - r.length)) + r;
}

function qrBytes(data) {
  const d = Array.from(new TextEncoder().encode(fold(data)));
  const len = d.length + 3;
  return [
    GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, // modelo 2
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06, // tamanho do modulo 6
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31, // correccao M
    GS, 0x28, 0x6b, len & 0xff, (len >> 8) & 0xff, 0x31, 0x50, 0x30, ...d, // guardar
    GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30, // imprimir
  ];
}

export function buildEscPosReceipt({ shopName, shopLocation, cashierName, sale = {}, items = [], verifyUrl }) {
  const out = [];
  const text = (s) => out.push(...new TextEncoder().encode(fold(s) + '\n'));
  const center = (on) => out.push(ESC, 0x61, on ? 1 : 0);
  const bold = (on) => out.push(ESC, 0x45, on ? 1 : 0);
  const line = () => text('-'.repeat(WIDTH));

  out.push(ESC, 0x40); // inicializar
  center(true); bold(true); text(shopName || 'Genesis'); bold(false);
  if (shopLocation) text(shopLocation);
  center(false);
  text(`Venda n.o ${String(sale.daily_number || 0).padStart(3, '0')}`);
  text(new Date(sale.created_at || Date.now()).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
  if (cashierName) text('Caixista: ' + cashierName);
  if (sale.payment_method) text('Pagamento: ' + sale.payment_method);
  line();
  for (const it of items) {
    const q = Number(it.quantity || 1);
    const unit = Number(it.unit_sell_price ?? it.sell_price ?? 0);
    text(it.product_name || 'Produto');
    text(twoCols(`  ${q} x ${mzn(unit)}`, mzn(q * unit)));
  }
  line();
  const total = Number(sale.total_amount || 0);
  const discount = Number(sale.discount_amount || 0);
  if (discount > 0) { text(twoCols('Subtotal', mzn(total + discount))); text(twoCols('Desconto', '-' + mzn(discount))); }
  bold(true); text(twoCols('TOTAL MT', mzn(total))); bold(false);
  if (sale.amount_received != null) text(twoCols('Recebido', mzn(sale.amount_received)));
  if (sale.change_given != null) text(twoCols('Troco', mzn(sale.change_given)));
  if (verifyUrl) {
    text('');
    center(true);
    out.push(...qrBytes(verifyUrl));
    text('Verifique este recibo');
    center(false);
  }
  center(true); text('Obrigado pela preferencia!'); center(false);
  out.push(ESC, 0x64, 4); // avancar 4 linhas
  out.push(GS, 0x56, 0x42, 0x00); // corte parcial (impressoras sem corte ignoram)
  return new Uint8Array(out);
}
