const formatCurrency = (value) => {
  const numeric = Number(value || 0) / 100;
  return `MZN ${numeric.toFixed(2).replace('.', ',')}`;
};

export function buildReceiptHtml({ shopName = 'Genesis', sale = {}, items = [] }) {
  const total = Number(sale.total_amount || 0);
  const received = Number(sale.amount_received || 0);
  const change = Number(sale.change_given || 0);

  const rows = (items || []).map((item) => `
    <tr>
      <td>${(item.product_name || item.name || 'Produto')}</td>
      <td>${item.quantity || 1}</td>
      <td>${formatCurrency(item.unit_sell_price || item.sell_price || 0)}</td>
      <td>${formatCurrency((item.quantity || 1) * (item.unit_sell_price || item.sell_price || 0))}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; width: 80mm; margin: 0 auto; padding: 10px; color: #111; }
          h2 { text-align: center; margin: 0 0 10px; font-size: 18px; }
          .meta { font-size: 12px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td { font-size: 11px; padding: 4px 0; border-bottom: 1px dashed #ddd; }
          .summary { margin-top: 12px; font-size: 12px; }
          .summary div { display: flex; justify-content: space-between; margin: 4px 0; }
          .qr { margin-top: 10px; text-align: center; }
          .qr-box { display: inline-block; width: 70px; height: 70px; border: 1px solid #555; text-align: center; line-height: 70px; font-size: 9px; }
          .footer { margin-top: 12px; text-align: center; font-size: 11px; }
        </style>
      </head>
      <body>
        <h2>${shopName}</h2>
        <div class="meta">
          <div>Data: ${new Date(sale.created_at || Date.now()).toLocaleString('pt-MZ')}</div>
          <div>Pagamento: ${sale.payment_method || 'Dinheiro'}</div>
          <div>Venda: ${sale.id || 'N/A'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <td>Produto</td>
              <td>Qtd</td>
              <td>Preço</td>
              <td>Total</td>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="summary">
          <div><span>Subtotal</span><strong>${formatCurrency(total)}</strong></div>
          <div><span>Recebido</span><strong>${formatCurrency(received)}</strong></div>
          <div><span>Troco</span><strong>${formatCurrency(change)}</strong></div>
        </div>

        <div class="qr">
          <div class="qr-box">QR</div>
        </div>
        <div class="footer">Obrigado pela preferência!</div>
      </body>
    </html>
  `;
}

export async function printReceipt({ shopName = 'Genesis', sale = {}, items = [] }) {
  const html = buildReceiptHtml({ shopName, sale, items });

  if (typeof window === 'undefined') return false;

  const hasSerialApi = 'serial' in navigator;
  if (hasSerialApi) {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      const escPos = `\n${shopName}\n${new Date(sale.created_at || Date.now()).toLocaleString('pt-MZ')}\n${sale.payment_method || 'Dinheiro'}\n${formatCurrency(sale.total_amount || 0)}\n\n`;
      await writer.write(encoder.encode(escPos));
      writer.releaseLock();
      await port.close();
      return true;
    } catch (err) {
      console.warn('Web Serial printer unavailable, falling back to browser print', err);
    }
  }

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}
