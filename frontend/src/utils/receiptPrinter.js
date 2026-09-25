import QRCode from 'qrcode';

const formatCurrency = (value) => {
  const numeric = Number(value || 0) / 100;
  return `MZN ${numeric.toFixed(2).replace('.', ',')}`;
};

const LS_KEY = 'genesis_pending_receipts';

function padDailyNumber(n) {
  return String(Number(n || 0) || 0).padStart(3, '0');
}

async function generateQrDataUrl(saleId, width = 150) {
  if (!saleId) return '';
  try {
    return await QRCode.toDataURL(
      `https://genesis.co.mz/verify/${saleId}`,
      { width, margin: 1, color: { dark: '#111c2b', light: '#ffffff' }, errorCorrectionLevel: 'M' },
    );
  } catch (e) {
    console.warn('QR generation failed', e);
    return '';
  }
}

function buildReceiptHtml({ shopName, shopLocation, cashierName, sale, items, qrDataUrl }) {
  const total = Number(sale.total_amount || 0);
  const received = Number(sale.amount_received || 0);
  const change = Number(sale.change_given || 0);
  const discount = Number(sale.discount_amount || 0);
  const dailyNumber = padDailyNumber(sale.daily_number);
  const timestamp = new Date(sale.created_at || Date.now()).toLocaleString('pt-MZ');
  const subtotal = total + discount;

  const rows = (items || []).map((item) => `
    <tr>
      <td style="text-align:left; padding-right:8px; max-width:55%;">${item.product_name || 'Produto'}</td>
      <td style="text-align:center; width:8%;">${item.quantity || 1}</td>
      <td style="text-align:right; width:18%;">${formatCurrency(item.unit_sell_price || item.sell_price || 0)}</td>
      <td style="text-align:right; width:19%;">${formatCurrency((item.quantity || 1) * (item.unit_sell_price || item.sell_price || 0))}</td>
    </tr>
  `).join('');

  const qrHtml = qrDataUrl
    ? `<div class="qr-box"><img src="${qrDataUrl}" width="70" height="70" alt="QR Code" /></div>`
    : `<div class="qr-box qr-empty"><div style="line-height:70px; color:#999; font-size:9px;">Sem código</div></div>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Recibo - ${shopName}</title>
        <style>
          @page { size: 80mm auto; margin: 10mm; }
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 8mm; color: #111c2b; font-size: 11px; line-height: 1.55; }
          h1 { text-align: center; font-size: 15px; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 1px; }
          .shop-location { text-align: center; font-size: 10px; color: #666; margin-bottom: 8px; }
          .sale-meta { border-bottom: 1px solid #111c2b; padding-bottom: 5px; margin-bottom: 7px; font-size: 10px; }
          .sale-meta div { margin: 1px 0; }
          table { width: 100%; border-collapse: collapse; margin: 6px 0; }
          th { background: #111c2b; color: #fff; padding: 3px 4px; font-size: 10px; text-align: left; }
          td { padding: 2px 4px; border-bottom: 1px dotted #bbb; font-size: 10px; }
          td:nth-child(3), td:nth-child(4) { text-align: right; }
          .summary { margin-top: 8px; font-size: 11px; }
          .summary div { display: flex; justify-content: space-between; margin: 2px 0; }
          .summary .total { font-weight: bold; font-size: 12px; border-top: 1px solid #111c2b; padding-top: 3px; margin-top: 3px; }
          .qr-section { text-align: center; margin: 10px 0; }
          .qr-box { display: inline-block; border: 1px solid #999; padding: 3px; background: #fff; line-height: 0; }
          .qr-empty { color: #999; }
          .footer { text-align: center; font-size: 10px; color: #666; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>${shopName}</h1>
        ${shopLocation ? `<div class="shop-location">${shopLocation}</div>` : ''}
        <div class="sale-meta">
          <div><strong>Nº de venda:</strong> ${dailyNumber}</div>
          <div><strong>Data:</strong> ${timestamp}</div>
          <div><strong>Caixista:</strong> ${cashierName || '—'}</div>
          <div><strong>Pagamento:</strong> ${sale.payment_method || 'Dinheiro'}</div>
        </div>
        <table>
          <thead>
            <tr><th style="text-align:left;">Produto</th><th style="text-align:center; width:8%;">Qtd</th><th style="text-align:right; width:18%;">Preço</th><th style="text-align:right; width:19%;">Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="summary">
          <div><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
          ${discount > 0 ? `<div><span>Desconto</span><span>-${formatCurrency(discount)}</span></div>` : ''}
          <div><span>Recebido</span><span>${formatCurrency(received)}</span></div>
          <div><span>Troco</span><span>${formatCurrency(change)}</span></div>
          <div class="total"><span>Total</span><span>${formatCurrency(total)}</span></div>
        </div>
        <div class="qr-section">
          ${qrHtml}
          <div style="font-size:9px; margin-top:3px; color:#666;">Escaneie para ver detalhes</div>
        </div>
        <div class="footer">Obrigado pela preferência! ${shopName}</div>
      </body>
    </html>
  `;
}

async function tryWebSerialPrint(shopName, sale, items) {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    return { ok: false, reason: 'Web Serial não disponível neste navegador' };
  }
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    const lines = [
      shopName,
      new Date(sale.created_at || Date.now()).toLocaleString('pt-MZ'),
      `Pagamento: ${sale.payment_method || 'Dinheiro'}`,
      `Total: ${formatCurrency(sale.total_amount || 0)}`,
      '',
      ...((items || []).map((i) => `${i.product_name || 'Produto'} x${(i.quantity || 1)} ${formatCurrency(i.unit_sell_price || 0)}`)),
    ];
    await writer.write(encoder.encode(lines.join('\n')));
    writer.releaseLock();
    await port.close();
    return { ok: true, reason: 'impressa via Web Serial' };
  } catch (err) {
    console.warn('Web Serial print failed, falling back to browser print', err);
    return { ok: false, reason: err?.message || 'erro na serial' };
  }
}

export async function printReceipt({ shopName = 'Genesis', shopLocation, cashierName, sale = {}, items = [] }) {
  const qrDataUrl = await generateQrDataUrl(sale.id);
  const html = buildReceiptHtml({ shopName, shopLocation, cashierName, sale, items, qrDataUrl });

  if (typeof window === 'undefined') return { ok: false, reason: 'não é ambiente browser' };

  const webSerialResult = await tryWebSerialPrint(shopName, sale, items);
  if (webSerialResult.ok) return webSerialResult;

  try {
    const printWindow = window.open('', '_blank', 'width=440,height=620,print-background=true');
    if (!printWindow) throw new Error('Não foi possível abrir janela de impressão');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    await new Promise((resolve) => {
      const onLoad = () => { try { printWindow.focus(); } catch (_) {} try { printWindow.print(); } catch (_) {} resolve(); };
      printWindow.addEventListener('load', onLoad);
      setTimeout(onLoad, 400);
    });
    return { ok: true, reason: 'impressa via browser print' };
  } catch (err) {
    console.error('Receipt printing failed entirely', err);
    try {
      const pending = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      pending.push({ shopName, shopLocation, cashierName, sale: JSON.parse(JSON.stringify(sale)), items: JSON.parse(JSON.stringify(items)), qrDataUrl, failedAt: new Date().toISOString() });
      if (pending.length > 50) pending.splice(0, pending.length - 50);
      localStorage.setItem(LS_KEY, JSON.stringify(pending));
    } catch (e) { console.warn('Could not queue receipt for retry', e); }
    return { ok: false, reason: err?.message || 'erro ao imprimir' };
  }
}

export function getPendingReceipts() {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

export function clearPendingReceipts() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LS_KEY);
}
