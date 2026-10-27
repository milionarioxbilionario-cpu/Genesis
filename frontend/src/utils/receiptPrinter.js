import QRCode from 'qrcode';
import { deliverPdf, downloadBlob, prefersShare, sharePdf } from './pdf/deliver';
import { buildEscPosReceipt, ditherToRaster } from './escpos';
import { code128Svg, documentBarcode, documentNumber } from './code128';
import { getDevicePrefs, sendToPrinter } from './devices';
import { getLang, locale, t } from '../i18n/core.js';
import { formatQty, lineAmount } from './units.js';

// 9.5: recibo na lingua de quem o gera; em portugues fica igual.
const formatCurrency = (value) => {
  const s = (Number(value || 0) / 100).toFixed(2);
  return `${getLang() === 'pt' ? s.replace('.', ',') : s} MT`;
};

const LS_KEY = 'genesis_pending_receipts';

function padDailyNumber(n) {
  return String(Number(n || 0) || 0).padStart(3, '0');
}

// Endereco do QR de autenticidade: a pagina publica /verify/<id> da propria
// app. O terminal corre em genesismz.com, por isso a origem actual e a certa
// (antes apontava para genesis.co.mz, um dominio que nao e nosso).
export function saleVerifyUrl(saleId) {
  return window.location.origin + '/verify/' + encodeURIComponent(saleId);
}

async function generateQrDataUrl(saleId, width = 150) {
  if (!saleId) return '';
  try {
    return await QRCode.toDataURL(
      saleVerifyUrl(saleId),
      { width, margin: 1, color: { dark: '#111c2b', light: '#ffffff' }, errorCorrectionLevel: 'M' },
    );
  } catch (e) {
    console.warn('QR generation failed', e);
    return '';
  }
}

// Escape de HTML. O nome de um produto é dado livre pelo dono da loja e ia
//cru para dentro do documento impresso via concatenação de strings: um
// produto chamado `<img onerror=...>` executava no diálogo de impressão.
// Tudo o que for texto passa por aqui antes de entrar no HTML.
const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Fase 15.1: recibo com desenho proprio — logotipo do estabelecimento (se houver),
// NUIT, telefone, numero do documento com codigo de barras, QR de verificacao e a
// mensagem final escolhida pelo dono. Sem logotipo, o nome ocupa o lugar dele.
const SAFE_IMG = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/;

function buildReceiptHtml({ shopName, shopLocation, shopPhone, shopNuit, footer, logo, cashierName, sale, items, qrDataUrl }) {
  const total = Number(sale.total_amount || 0);
  const received = Number(sale.amount_received || 0);
  const change = Number(sale.change_given || 0);
  const discount = Number(sale.discount_amount || 0);
  const timestamp = new Date(sale.created_at || Date.now()).toLocaleString(getLang() === 'pt' ? 'pt-MZ' : locale());
  const subtotal = total + discount;
  const doc = documentNumber(sale);
  let barcodeSvg = '';
  try { barcodeSvg = code128Svg(documentBarcode(sale), { module: 1.2, height: 34 }); } catch { barcodeSvg = ''; }

  const rows = (items || []).map((item) => {
    const q = item.quantity || 1;
    const unit = item.unit_sell_price || item.sell_price || 0;
    return `
    <tr>
      <td class="name">${esc(item.product_name || t('Produto'))}<div class="sub">${esc(formatQty(q, item.unit))} × ${formatCurrency(unit)}</div></td>
      <td class="amt">${formatCurrency(lineAmount(q, unit, item.unit))}</td>
    </tr>`;
  }).join('');

  // Imagens so se forem mesmo data URL de imagem (o logotipo vem da BD: nunca HTML cru).
  const safeQr = SAFE_IMG.test(String(qrDataUrl || '')) ? qrDataUrl : '';
  const safeLogo = SAFE_IMG.test(String(logo || '')) ? logo : '';

  return `
    <!DOCTYPE html>
    <html lang="${getLang()}">
      <head>
        <meta charset="utf-8" />
        <title>${esc(t('Recibo'))} ${esc(doc)} - ${esc(shopName)}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; width: 72mm; margin: 0 auto; color: #111; font-size: 11px; line-height: 1.45; }
          .head { text-align: center; padding-bottom: 8px; border-bottom: 1px solid #111; }
          .logo { display: block; max-width: 46mm; max-height: 26mm; margin: 0 auto 6px; object-fit: contain; }
          .shop { font-size: 15px; font-weight: 700; letter-spacing: .3px; margin: 0; }
          .meta { font-size: 10px; color: #444; margin-top: 2px; }
          .doc { display: flex; justify-content: space-between; align-items: baseline; margin: 8px 0 2px; }
          .doc .label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; }
          .doc .num { font-family: 'Courier New', monospace; font-weight: 700; font-size: 12px; }
          .info { font-size: 10px; color: #444; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; border-top: 1px dashed #999; }
          td { padding: 5px 0; border-bottom: 1px dashed #ccc; vertical-align: top; }
          td.name { padding-right: 8px; }
          td.amt { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
          .sub { color: #555; font-size: 10px; font-variant-numeric: tabular-nums; }
          .sum div { display: flex; justify-content: space-between; margin: 2px 0; font-variant-numeric: tabular-nums; }
          .sum .total { font-weight: 800; font-size: 15px; border-top: 1.5px solid #111; padding-top: 5px; margin-top: 5px; }
          .pay { margin-top: 6px; font-size: 10px; color: #444; }
          .codes { text-align: center; margin: 12px 0 6px; }
          .codes svg { display: block; margin: 0 auto; max-width: 100%; }
          .codes .docnum { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 1px; margin-top: 2px; }
          .qr { margin-top: 8px; }
          .qr img { width: 72px; height: 72px; }
          .qr p { font-size: 9px; color: #555; margin: 2px 0 0; }
          .thanks { text-align: center; font-size: 11px; font-weight: 600; margin-top: 8px; }
          .by { text-align: center; font-size: 8.5px; color: #777; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="head">
          ${safeLogo ? `<img class="logo" src="${safeLogo}" alt="" />` : ''}
          <p class="shop">${esc(shopName)}</p>
          ${shopLocation ? `<div class="meta">${esc(shopLocation)}</div>` : ''}
          ${shopPhone || shopNuit ? `<div class="meta">${shopPhone ? esc(t('Tel.')) + ' ' + esc(shopPhone) : ''}${shopPhone && shopNuit ? ' · ' : ''}${shopNuit ? 'NUIT ' + esc(shopNuit) : ''}</div>` : ''}
        </div>
        <div class="doc"><span class="label">${esc(t('RECIBO'))}</span><span class="num">${esc(doc)}</span></div>
        <div class="info"><span>${esc(timestamp)}</span><span>${esc(t('Caixista:'))} ${esc(cashierName || '—')}</span></div>
        <table><tbody>${rows}</tbody></table>
        <div class="sum">
          <div><span>${esc(t('Subtotal'))}</span><span>${formatCurrency(subtotal)}</span></div>
          ${discount > 0 ? `<div><span>${esc(t('Desconto'))}</span><span>−${formatCurrency(discount)}</span></div>` : ''}
          <div class="total"><span>${esc(t('Total'))}</span><span>${formatCurrency(total)}</span></div>
          ${Number(sale.vat_amount) > 0 ? `<div style="font-size:10px;color:#444"><span>${esc(t('IVA incluído'))}</span><span>${formatCurrency(sale.vat_amount)}</span></div>` : ''}
        </div>
        <div class="pay">
          <div style="display:flex;justify-content:space-between"><span>${esc(t('Pagamento:'))}</span><span>${esc(sale.payment_method || t('Dinheiro'))}</span></div>
          ${(sale.payments || []).map((p) => `<div style="display:flex;justify-content:space-between;padding-left:8px"><span>${esc(p.method)}</span><span>${formatCurrency(p.amount)}</span></div>`).join('')}
          <div style="display:flex;justify-content:space-between"><span>${esc(t('Recebido'))}</span><span>${formatCurrency(received)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>${esc(t('Troco'))}</span><span>${formatCurrency(change)}</span></div>
        </div>
        <div class="codes">
          ${barcodeSvg}
          <div class="docnum">${esc(doc)}</div>
          ${safeQr ? `<div class="qr"><img src="${safeQr}" alt="QR" /><p>${esc(t('Leia o código para confirmar o recibo'))}</p></div>` : ''}
        </div>
        <div class="thanks">${esc(footer || t('Obrigado pela preferência!'))}</div>
        <div class="by">Genesis MZ · genesismz.com</div>
      </body>
    </html>
  `;
}

// Moldura escondida na propria pagina: imprime sem abrir janela nova. A janela
// nova (window.open) ficava sem botao de voltar na app do ecra principal do
// iPhone e prendia o utilizador no recibo (teste do fundador, 10/10/2026).
function printHtmlInIframe(html) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const remove = () => { if (frame.isConnected) frame.remove(); };
    const doc = frame.contentDocument;
    doc.open(); doc.write(html); doc.close();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      const win = frame.contentWindow;
      try { win.addEventListener('afterprint', () => setTimeout(remove, 500)); } catch (_) {}
      try { win.focus(); win.print(); } catch (_) {}
      setTimeout(remove, 60000);
      resolve();
    };
    frame.addEventListener('load', go);
    setTimeout(go, 500);
  });
}

// O PDF do recibo e sempre gerado; carrega-se o gerador antes do toque (a
// folha de partilha do iPhone so abre se o toque ainda estiver "fresco").
export function preloadReceiptPdf() {
  import('./pdf/receiptPdf').catch(() => {});
}

const isAndroid = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

// Recibo guardado SEMPRE no aparelho, haja ou nao impressora (decisao do
// fundador 11/10/2026): Android e computador descarregam o ficheiro; iPhone/
// iPad usa a folha de partilha («Guardar em Ficheiros») — a descarga na app do
// ecra principal do iPhone abre o PDF por cima e prende o utilizador (8.1).
async function saveReceiptPdf(blob, filename) {
  if (isAndroid()) { downloadBlob(blob, filename); return { ok: true, via: 'download' }; }
  return deliverPdf(blob, filename);
}

// Imprimir recibo (Fase 8.8): 1) PDF no aparelho, ainda dentro do toque;
// 2) a impressora escolhida em «Dispositivos»: USB (Web Serial) ou Bluetooth
// em ESC/POS, ou a janela de impressao do computador.
// Devolve { ok, via, printed, printError } ou { needsTap, file } (iPhone).
// Logotipo (data URL) -> pontos pretos/brancos para a impressora termica.
async function logoRaster(dataUrl) {
  if (!dataUrl || typeof document === 'undefined') return null;
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ditherToRaster(ctx.getImageData(0, 0, c.width, c.height), 384);
  } catch { return null; }
}

export async function printReceipt({ shopName = 'Genesis', shopLocation, shopPhone, shopNuit, footer, logo, cashierName, sale = {}, items = [] }) {
  if (typeof window === 'undefined') return { ok: false, reason: 'não é ambiente browser' };
  const qrDataUrl = await generateQrDataUrl(sale.id);
  const { printer } = getDevicePrefs();

  let pdf = { ok: false };
  try {
    const { buildReceiptPdf } = await import('./pdf/receiptPdf');
    const { blob, filename } = buildReceiptPdf({ shopName, shopLocation, shopPhone, shopNuit, footer, logo, cashierName, sale, items, qrDataUrl });
    pdf = await saveReceiptPdf(blob, filename);
  } catch (err) {
    console.error('PDF do recibo falhou', err);
    pdf = { ok: false, reason: err?.message || 'erro no PDF' };
  }

  let printed = null;
  let printError = '';
  try {
    if (printer === 'usb' || printer === 'bluetooth') {
      printed = await sendToPrinter(buildEscPosReceipt({
        shopName, shopLocation, shopPhone, shopNuit, footer, cashierName, sale, items,
        verifyUrl: sale.id ? saleVerifyUrl(sale.id) : null, logo: await logoRaster(logo),
        docNumber: documentNumber(sale), barcode: documentBarcode(sale),
      }), printer);
    } else if (printer === 'system' && !prefersShare()) {
      await printHtmlInIframe(buildReceiptHtml({ shopName, shopLocation, shopPhone, shopNuit, footer, logo, cashierName, sale, items, qrDataUrl }));
      printed = 'system';
    }
  } catch (err) {
    console.warn('Impressora falhou; o recibo ficou em PDF', err);
    printError = err?.message || t('A impressora não respondeu.');
  }

  if (!pdf.ok && !pdf.needsTap && !printed) {
    try {
      const pending = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      pending.push({ shopName, shopLocation, shopPhone, shopNuit, footer, cashierName, sale: JSON.parse(JSON.stringify(sale)), items: JSON.parse(JSON.stringify(items)), qrDataUrl, failedAt: new Date().toISOString() });
      if (pending.length > 50) pending.splice(0, pending.length - 50);
      localStorage.setItem(LS_KEY, JSON.stringify(pending));
    } catch (e) { console.warn('Could not queue receipt for retry', e); }
  }
  return { ...pdf, ok: Boolean(pdf.ok || printed), printed, printError };
}

export function getPendingReceipts() {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

export function clearPendingReceipts() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LS_KEY);
}

// Fase 15.1b: recibo em imagem (PNG) para o cliente, por WhatsApp. Telemovel/tablet:
// folha de partilha (escolhe-se o WhatsApp); computador: descarrega a imagem.
// Devolve como printReceipt: { ok, via } ou { needsTap, file } (iPhone).
export async function shareReceiptImage({ shopName = 'Genesis', shopLocation, shopPhone, shopNuit, footer, logo, cashierName, sale = {}, items = [] }) {
  const qrDataUrl = await generateQrDataUrl(sale.id);
  const { buildReceiptImage } = await import('./receiptImage');
  const { blob, filename } = await buildReceiptImage({ shopName, shopLocation, shopPhone, shopNuit, footer, logo, cashierName, sale, items, qrDataUrl });
  const file = new File([blob], filename, { type: 'image/png' });
  if (prefersShare() && navigator.canShare?.({ files: [file] })) return sharePdf(file);
  downloadBlob(blob, filename);
  return { ok: true, via: 'download' };
}

// Pre-visualizacao nas Definicoes (e testes): o HTML do recibo sem o imprimir.
export const receiptPreviewHtml = buildReceiptHtml;
