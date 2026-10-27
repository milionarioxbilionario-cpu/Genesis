// Recibo em ESC/POS para impressoras termicas de 58/80 mm (Fase 8.8). Puro:
// devolve os bytes; quem os envia e utils/devices.js (USB ou Bluetooth).
// Texto SEM acentos ("Agua"): cada marca de impressora usa uma tabela de
// caracteres diferente e um "á" sai como lixo; sem acentos sai sempre legivel.
// Largura de 32 colunas: cabe em 58 mm e em 80 mm.
// 9.5: na lingua de quem imprime (t do i18n); em portugues fica igual.
import { getLang, locale, t } from '../i18n/core.js';

const ESC = 0x1b;
const GS = 0x1d;
export const WIDTH = 32;

export function fold(text) {
  return String(text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[ºª]/g, 'o').replace(/[×]/g, 'x').replace(/[–—]/g, '-').replace(/[«»“”]/g, '"')
    .replace(/[^\x20-\x7e\n]/g, '?');
}

const mzn = (c) => { const s = (Number(c || 0) / 100).toFixed(2); return getLang() === 'pt' ? s.replace('.', ',') : s; };

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

// ------------------------------------------------------------ Fase 15.1
// Logotipo: imagem a preto e branco com difusao de erro (Floyd-Steinberg),
// no maximo 384 pontos de largura (cabe no papel de 58 e de 80 mm).
// `img` = { data: RGBA, width, height } (ImageData do canvas). Branco/transparente = papel.
export function ditherToRaster(img, maxWidth = 384) {
  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.max(8, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, Math.floor(x / scale));
      const sy = Math.min(img.height - 1, Math.floor(y / scale));
      const i = (sy * img.width + sx) * 4;
      const a = img.data[i + 3] / 255;
      // Transparente conta como branco (papel).
      gray[y * w + x] = 255 - a * (255 - (0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]));
    }
  }
  const widthBytes = Math.ceil(w / 8);
  const bytes = new Uint8Array(widthBytes * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = gray[i];
      const black = old < 128;
      if (black) bytes[y * widthBytes + (x >> 3)] |= 0x80 >> (x & 7);
      const err = old - (black ? 0 : 255);
      if (x + 1 < w) gray[i + 1] += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0) gray[i + w - 1] += err * 3 / 16;
        gray[i + w] += err * 5 / 16;
        if (x + 1 < w) gray[i + w + 1] += err * 1 / 16;
      }
    }
  }
  return { width: w, height: h, widthBytes, bytes };
}

// GS v 0: imagem raster (todas as impressoras ESC/POS modernas).
export function rasterBytes(r) {
  return [GS, 0x76, 0x30, 0x00, r.widthBytes & 0xff, (r.widthBytes >> 8) & 0xff, r.height & 0xff, (r.height >> 8) & 0xff, ...r.bytes];
}

// Codigo de barras CODE128 conjunto C (so algarismos aos pares), com o numero por baixo.
export function barcodeBytes(digits) {
  const s = String(digits || '');
  if (!/^(\d\d)+$/.test(s)) return [];
  const pairs = s.match(/\d\d/g).map(Number);
  const data = [0x7b, 0x43, ...pairs]; // "{C"
  return [GS, 0x68, 60, GS, 0x77, 2, GS, 0x48, 2, GS, 0x66, 0, GS, 0x6b, 73, data.length, ...data];
}

// Impulso para abrir a gaveta ligada a impressora (pino 2).
export const DRAWER_PULSE = [ESC, 0x70, 0x00, 25, 250];

export function buildEscPosReceipt({ shopName, shopLocation, shopPhone, shopNuit, footer, cashierName, sale = {}, items = [], verifyUrl, logo, barcode, docNumber, openDrawer = false }) {
  const out = [];
  const text = (s) => out.push(...new TextEncoder().encode(fold(s) + '\n'));
  const center = (on) => out.push(ESC, 0x61, on ? 1 : 0);
  const bold = (on) => out.push(ESC, 0x45, on ? 1 : 0);
  const line = () => text('-'.repeat(WIDTH));

  out.push(ESC, 0x40); // inicializar
  if (openDrawer) out.push(...DRAWER_PULSE);
  center(true);
  if (logo && logo.bytes) { out.push(...rasterBytes(logo)); text(''); }
  bold(true); text(shopName || 'Genesis'); bold(false);
  if (shopLocation) text(shopLocation);
  if (shopPhone) text(t('Tel.') + ' ' + shopPhone);
  if (shopNuit) text('NUIT ' + shopNuit);
  center(false);
  line();
  bold(true); text(twoCols(t('RECIBO'), docNumber || String(sale.daily_number || 0).padStart(3, '0'))); bold(false);
  text(new Date(sale.created_at || Date.now()).toLocaleString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
  if (cashierName) text(t('Caixista:') + ' ' + cashierName);
  line();
  for (const it of items) {
    const q = Number(it.quantity || 1);
    const unit = Number(it.unit_sell_price ?? it.sell_price ?? 0);
    text(it.product_name || t('Produto'));
    text(twoCols(`  ${q} x ${mzn(unit)}`, mzn(q * unit)));
  }
  line();
  const total = Number(sale.total_amount || 0);
  const discount = Number(sale.discount_amount || 0);
  if (discount > 0) { text(twoCols(t('Subtotal'), mzn(total + discount))); text(twoCols(t('Desconto'), '-' + mzn(discount))); }
  bold(true); text(twoCols(t('TOTAL MT'), mzn(total))); bold(false);
  if (Number(sale.vat_amount) > 0) text(twoCols(t('IVA incluído'), mzn(sale.vat_amount)));
  if (sale.payment_method) text(twoCols(t('Pagamento:'), sale.payment_method));
  if (sale.amount_received != null) text(twoCols(t('Recebido'), mzn(sale.amount_received)));
  if (sale.change_given != null) text(twoCols(t('Troco'), mzn(sale.change_given)));
  line();
  center(true);
  if (barcode) { out.push(...barcodeBytes(barcode)); text(''); }
  if (verifyUrl) {
    out.push(...qrBytes(verifyUrl));
    text(t('Verifique este recibo'));
  }
  text(footer || t('Obrigado pela preferência!'));
  text('Genesis MZ - genesismz.com');
  center(false);
  out.push(ESC, 0x64, 4); // avancar 4 linhas
  out.push(GS, 0x56, 0x42, 0x00); // corte parcial (impressoras sem corte ignoram)
  return new Uint8Array(out);
}
