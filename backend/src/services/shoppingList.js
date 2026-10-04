// Lista de compras (Genesis 2.1, Fase 5.2) — logica pura, sem Prisma.
// Valores em centavos. A mensagem leva so produtos e quantidades: os custos
// sao do dono e o total e combinado com o fornecedor.

// Total do investimento + entrega do fornecedor escolhido.
function listTotals(items = [], supplier = null) {
  const investment = items.reduce((s, it) => s + (it.quantity || 0) * (it.unit_cost || 0), 0);
  const delivery = supplier ? (supplier.delivery_cost_per_visit || 0) : 0;
  return { units: items.reduce((s, it) => s + (it.quantity || 0), 0), investment, delivery, total: investment + delivery };
}

// Telefone para o wa.me: so digitos, com o indicativo de Mocambique (258)
// quando vem o numero local de 9 digitos (84/85/86/87/82/83...).
// Devolve null se nao parecer um numero valido.
function waPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^00/, '');
  if (/^8\d{8}$/.test(digits)) return '258' + digits;
  if (/^258 ?8\d{8}$/.test(digits)) return digits;
  if (digits.length >= 10 && digits.length <= 15) return digits; // outro pais, ja com indicativo
  return null;
}

function orderMessage({ storeName, supplierName, items }) {
  const lines = items.map((it) => `- ${it.quantity} × ${it.product_name}`);
  return [
    `Olá${supplierName ? ' ' + supplierName : ''}, daqui fala ${storeName || 'a loja'}.`,
    'Gostaria de encomendar:',
    ...lines,
    '',
    'Pode confirmar o preço e quando entrega? Obrigado.',
  ].join('\n');
}

// Sem telefone valido, o wa.me abre o WhatsApp para escolher o contacto.
function whatsappLink(phone, text) {
  const p = waPhone(phone);
  return `https://wa.me/${p || ''}?text=${encodeURIComponent(text)}`;
}

module.exports = { listTotals, waPhone, orderMessage, whatsappLink };
