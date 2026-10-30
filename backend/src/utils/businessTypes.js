// Tipos de negocio (27/10: separados, sem «A / B» — um restaurante nao e uma churrascaria).
// Fonte unica para o pedido de conta, o catalogo do onboarding e o painel de administracao.
const BUSINESS_TYPES = [
  'bottle_store', 'loja_bebidas', 'mercearia', 'supermercado', 'padaria', 'pastelaria', 'cafetaria', 'talho',
  'restaurante', 'churrascaria', 'fast_food', 'boutique', 'salao', 'farmacia', 'clinica', 'posto_combustivel',
  'nhonguista', 'importador', 'hotelaria', 'arrendamento', 'outro',
];

// Catalogo pre-definido usado enquanto o tipo nao tem o seu (os catalogos proprios
// e verificados chegam na etapa I).
const CATALOG_FALLBACK = {
  loja_bebidas: 'bottle_store',
  pastelaria: 'padaria',
  cafetaria: 'padaria',
  churrascaria: 'restaurante',
  fast_food: 'restaurante',
};

const catalogTypeOf = (type) => CATALOG_FALLBACK[type] || type;

// Decisao do fundador (27/10): primeiro o POS puro, a fundo. Estes tipos precisam de
// um modo proprio (mesas, quartos, receitas, bombas…) que so se constroi DEPOIS do
// plano e do Prompt Mestre: aparecem como «Brevemente» com «Avise-me» (routes/waitlist.js)
// e o pedido de conta recusa-os (um modo superficial decepcionaria o cliente).
const MODE_PENDING = ['restaurante', 'fast_food', 'salao', 'farmacia', 'clinica', 'posto_combustivel', 'nhonguista', 'importador', 'hotelaria', 'arrendamento'];

module.exports = { BUSINESS_TYPES, CATALOG_FALLBACK, catalogTypeOf, MODE_PENDING };
