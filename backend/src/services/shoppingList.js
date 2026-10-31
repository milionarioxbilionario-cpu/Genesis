// Lista de compras (Genesis 2.1, Fase 5.2) — logica pura, sem Prisma.
// Valores em centavos. A mensagem leva so produtos e quantidades: os custos
// sao do dono e o total e combinado com o fornecedor.
// 9.6: a mensagem sai na lingua de quem a gera (lang).
const { tr } = require('../utils/lang');
const { lineAmount, humanQty, qtyText } = require('../utils/units');

// Total do investimento + entrega do fornecedor escolhido.
function listTotals(items = [], supplier = null) {
  // Fase 15.5: it.unit (kg/l/m) -> quantidade em milesimos e custo por kg/l/m.
  const investment = items.reduce((s, it) => s + lineAmount(it.quantity || 0, it.unit_cost || 0, it.unit), 0);
  const delivery = supplier ? (supplier.delivery_cost_per_visit || 0) : 0;
  return { units: Math.round(items.reduce((s, it) => s + humanQty(it.quantity || 0, it.unit), 0) * 1000) / 1000, investment, delivery, total: investment + delivery };
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

function orderMessage({ storeName, supplierName, items, lang = 'pt' }) {
  const lines = items.map((it) => `- ${qtyText(it.quantity, it.unit)} × ${it.product_name}`);
  return [
    tr(lang, 'Olá{name}, daqui fala {store}.', { name: supplierName ? ' ' + supplierName : '', store: storeName || tr(lang, 'o seu cliente') }),
    tr(lang, 'Gostaria de encomendar:'),
    ...lines,
    '',
    tr(lang, 'Pode confirmar o preço e quando entrega? Obrigado.'),
  ].join('\n');
}

// Sem telefone valido, o wa.me abre o WhatsApp para escolher o contacto.
function whatsappLink(phone, text) {
  const p = waPhone(phone);
  return `https://wa.me/${p || ''}?text=${encodeURIComponent(text)}`;
}

module.exports = { listTotals, waPhone, orderMessage, whatsappLink };
