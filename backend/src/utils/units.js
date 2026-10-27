// Fase 15.5: venda ao peso / medida. Puro.
// Produto 'un' conta unidades inteiras (como sempre). Produto 'kg', 'l' ou 'm'
// guarda TODAS as quantidades (stock, lotes, vendas, perdas, entradas, listas)
// em milesimos inteiros: gramas, mililitros, milimetros. O preco (venda e custo)
// e por kg / litro / metro, em centavos. Nunca ha floats na BD.
const UNITS = ['un', 'kg', 'l', 'm'];
const SCALE = { un: 1, kg: 1000, l: 1000, m: 1000 };

const scaleOf = (unit) => SCALE[unit] || 1;

// Valor em centavos de `qty` (na escala do produto) ao preco `price` (por unidade inteira).
// Arredonda ao centavo (metade para cima) so nos produtos a peso/medida.
function lineAmount(qty, price, unit = 'un') {
  const q = Math.trunc(Number(qty || 0));
  const p = Math.trunc(Number(price || 0));
  const s = scaleOf(unit);
  if (s === 1) return q * p;
  const raw = q * p;
  return raw >= 0 ? Math.floor((raw * 2 + s) / (2 * s)) : -Math.floor((-raw * 2 + s) / (2 * s));
}

// Quantidade "humana" (unidades, kg, litros, metros) para rankings e textos.
const humanQty = (qty, unit = 'un') => Math.round((Number(qty || 0) / scaleOf(unit)) * 1000) / 1000;

// Texto curto em portugues: 3 | 1,25 kg | 0,5 l (titulos do rastreio; o ecra monta o seu).
function qtyText(qty, unit = 'un') {
  if (scaleOf(unit) === 1) return String(qty);
  return String(humanQty(qty, unit)).replace('.', ',') + ' ' + unit;
}

module.exports = { UNITS, scaleOf, lineAmount, humanQty, qtyText };
