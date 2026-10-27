// Fase 15.1b: recibo em IMAGEM (PNG) para enviar ao cliente por WhatsApp.
// O mesmo conteudo do talao (logotipo, NUIT, n.º do documento com codigo de
// barras, QR, mensagem do dono), desenhado num canvas sem bibliotecas novas.
// `drawReceipt` recebe o contexto 2D (o teste usa um falso, em Node) e devolve a
// altura usada; `buildReceiptImage` (so no browser) desenha e corta a imagem.
// Valores sempre por extenso (moneyExact), mesmo no modo privado.
import { moneyExact as money } from './format.js';
import { code128Bars, documentBarcode, documentNumber } from './code128.js';
import { safeFileName, dmy, hms } from './pdf/text.js';
import { getLang, locale, t } from '../i18n/core.js';
import { formatQty, lineAmount } from './units.js';

export const CARD_W = 360; // largura do talao em px de desenho
const PAD = 22; // margem interior do talao
const OUT = 16; // margem cinzenta a volta
const SCALE = 3; // nitidez: imagem final com 1176 px de largura
const FONT = '"Inter Variable", Inter, "Segoe UI", Roboto, Arial, sans-serif';
const MONO = '"Courier New", Courier, monospace';
const INK = '#1C1917';
const MUTED = '#57534E';
const LINE = '#D6D3D1';
const BRAND = '#0B4D3B';

const receiptLocale = () => (getLang() === 'pt' ? 'pt-MZ' : locale());

// Parte o texto em linhas que cabem em `max` px.
export function wrapText(ctx, text, max) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(next).width > max) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// images: { logo: { img, width, height } | null, qr: { img } | null }
// cardHeight: altura do talao (na 1.a passagem pode ser grande: so mede).
export function drawReceipt(ctx, input, images = {}, cardHeight = 4000) {
  const { shopName, shopLocation, shopPhone, shopNuit, footer, cashierName, sale = {}, items = [] } = input;
  const total = Number(sale.total_amount || 0);
  const discount = Number(sale.discount_amount || 0);
  const L = OUT + PAD;
  const R = OUT + CARD_W - PAD;
  const inner = CARD_W - 2 * PAD;
  const mid = OUT + CARD_W / 2;

  ctx.fillStyle = '#F5F5F4';
  ctx.fillRect(0, 0, CARD_W + 2 * OUT, cardHeight + 2 * OUT);
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, OUT, OUT, CARD_W, cardHeight, 12);
  ctx.fill();
  ctx.save(); // faixa fina com a cor da marca no topo, dentro dos cantos redondos
  roundedRect(ctx, OUT, OUT, CARD_W, cardHeight, 12);
  ctx.clip();
  ctx.fillStyle = BRAND;
  ctx.fillRect(OUT, OUT, CARD_W, 5);
  ctx.restore();

  const text = (s, x, y, { size = 13, weight = 400, color = INK, align = 'left', font = FONT } = {}) => {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(s), x, y);
  };
  const rule = (y, { dashed = false, color = LINE, width = 1 } = {}) => {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.setLineDash(dashed ? [4, 4] : []);
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
    ctx.setLineDash([]);
  };
  const row = (label, value, y, opts = {}) => {
    text(label, L, y, opts);
    text(value, R, y, { ...opts, align: 'right' });
  };

  let y = OUT + 30;
  // Logotipo (ate 190 x 90), centrado e com a proporcao certa.
  if (images.logo?.img) {
    const s = Math.min(190 / images.logo.width, 90 / images.logo.height, 1.5);
    const w = images.logo.width * s; const h = images.logo.height * s;
    ctx.drawImage(images.logo.img, mid - w / 2, y - 8, w, h);
    y += h + 14;
  }
  ctx.font = `700 21px ${FONT}`;
  for (const ln of wrapText(ctx, shopName || 'Genesis', inner)) { text(ln, mid, y, { size: 21, weight: 700, align: 'center' }); y += 26; }
  const contact = [shopPhone ? `${t('Tel.')} ${shopPhone}` : '', shopNuit ? `NUIT ${shopNuit}` : ''].filter(Boolean).join(' · ');
  for (const m of [shopLocation, contact].filter(Boolean)) { text(m, mid, y - 4, { size: 12, color: MUTED, align: 'center' }); y += 17; }
  y += 6;
  rule(y, { color: INK, width: 1.5 }); y += 24;

  text(t('RECIBO'), L, y, { size: 12, weight: 700 });
  text(documentNumber(sale), R, y, { size: 14, weight: 700, align: 'right', font: MONO }); y += 18;
  const when = new Date(sale.created_at || Date.now()).toLocaleString(receiptLocale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  text(when, L, y, { size: 11.5, color: MUTED });
  text(`${t('Caixista:')} ${cashierName || '—'}`, R, y, { size: 11.5, color: MUTED, align: 'right' }); y += 14;
  rule(y, { dashed: true }); y += 22;

  for (const it of items) {
    const q = Number(it.quantity || 1);
    const unit = Number(it.unit_sell_price || it.sell_price || 0);
    ctx.font = `500 14px ${FONT}`;
    const lines = wrapText(ctx, it.product_name || t('Produto'), inner - 110);
    text(money(lineAmount(q, unit, it.unit)), R, y, { size: 14, weight: 700, align: 'right' });
    for (const ln of lines) { text(ln, L, y, { size: 14, weight: 500 }); y += 18; }
    text(`${formatQty(q, it.unit)} × ${money(unit)}`, L, y - 2, { size: 12, color: MUTED }); y += 12;
    rule(y, { dashed: true }); y += 22;
  }

  row(t('Subtotal'), money(total + discount), y, { size: 13 }); y += 20;
  if (discount > 0) { row(t('Desconto'), '−' + money(discount), y, { size: 13 }); y += 20; }
  rule(y - 6, { color: INK, width: 1.5 }); y += 22;
  text(t('Total'), L, y, { size: 22, weight: 800 });
  text(money(total), R, y, { size: 22, weight: 800, align: 'right', color: BRAND }); y += 26;
  if (Number(sale.vat_amount) > 0) { row(t('IVA incluído'), money(sale.vat_amount), y, { size: 12, color: MUTED }); y += 17; }
  row(t('Pagamento:'), sale.payment_method || t('Dinheiro'), y, { size: 12, color: MUTED }); y += 17;
  for (const p of sale.payments || []) { row('   ' + p.method, money(p.amount), y, { size: 12, color: MUTED }); y += 17; }
  row(t('Recebido'), money(sale.amount_received), y, { size: 12, color: MUTED }); y += 17;
  row(t('Troco'), money(sale.change_given), y, { size: 12, color: MUTED }); y += 22;

  // Codigo de barras do documento (Code 128): o mesmo do talao impresso.
  try {
    const { bars, modules } = code128Bars(documentBarcode(sale));
    const mod = Math.min(2, (inner - 20) / modules);
    const x0 = mid - (modules * mod) / 2;
    ctx.fillStyle = '#000000';
    for (const b of bars) ctx.fillRect(x0 + b.x * mod, y, b.w * mod, 50);
    y += 66;
    text(documentNumber(sale), mid, y, { size: 12, align: 'center', font: MONO }); y += 18;
  } catch { /* sem codigo de barras */ }

  if (images.qr?.img) {
    y += 4;
    ctx.drawImage(images.qr.img, mid - 55, y, 110, 110); y += 126;
    text(t('Leia o código para confirmar o recibo'), mid, y, { size: 11, color: MUTED, align: 'center' }); y += 22;
  }
  ctx.font = `700 15px ${FONT}`;
  for (const ln of wrapText(ctx, footer || t('Obrigado pela preferência!'), inner)) { text(ln, mid, y, { size: 15, weight: 700, align: 'center' }); y += 20; }
  y += 6;
  text('Genesis MZ · genesismz.com', mid, y, { size: 10.5, color: '#78716C', align: 'center' });
  return y + 18 - OUT; // altura do talao
}

async function loadImage(src) {
  if (!src) return null;
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return { img, width: img.naturalWidth, height: img.naturalHeight };
  } catch { return null; }
}

// Browser: devolve { blob, filename } com o PNG do recibo.
export async function buildReceiptImage(input) {
  try { await document.fonts?.load(`700 16px ${FONT}`); } catch { /* fica a letra do sistema */ }
  const images = { logo: await loadImage(input.logo), qr: await loadImage(input.qrDataUrl) };
  const width = CARD_W + 2 * OUT;
  const probe = document.createElement('canvas');
  probe.width = 1; probe.height = 1;
  const pctx = probe.getContext('2d');
  // 1.a passagem: so mede a altura (desenha num contexto de 1 px).
  const cardHeight = Math.ceil(drawReceipt(pctx, input, images));
  const c = document.createElement('canvas');
  c.width = width * SCALE; c.height = (cardHeight + 2 * OUT) * SCALE;
  const ctx = c.getContext('2d');
  ctx.scale(SCALE, SCALE);
  drawReceipt(ctx, input, images, cardHeight);
  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  // Mesmo nome do PDF, com .png: Recibo_<n> - <Loja> (DD-MM-AAAA - HH-MM-SS).png
  const when = new Date(input.sale?.created_at || Date.now());
  const n = String(Number(input.sale?.daily_number || 0)).padStart(3, '0');
  return { blob, filename: `${t('Recibo')}_${n} - ${safeFileName(input.shopName)} (${dmy(when)} - ${hms(when)}).png` };
}
