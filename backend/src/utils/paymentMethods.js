// Valores canonicos de payment_method.
//
// O POS oferece cash/card/mobile_money, o dashboard do dono rotula variantes
// ('M-Pesa', 'EMOLA', 'Cartao'), o recibo impresso mostra o valor cru e a BD
// aceita qualquer string (payment_method TEXT NOT NULL, sem enum). Sem
// normalizacao no servidor, a mesma forma de pagamento aparece como metodos
// diferentes nos relatorios e os filtros (ex.: payment_method: 'cash') falham
// em silencio.

const CANONICAL_PAYMENT_METHODS = ['cash', 'card', 'mobile_money'];

const ALIASES = {
  cash: 'cash',
  dinheiro: 'cash',
  numerario: 'cash',
  card: 'card',
  cartao: 'card',
  'cartão': 'card',
  pos: 'card',
  pos_bank: 'card',
  transfer: 'card',
  transferencia: 'card',
  'transferência': 'card',
  mobile_money: 'mobile_money',
  mpesa: 'mobile_money',
  'm-pesa': 'mobile_money',
  emola: 'mobile_money',
  e_mola: 'mobile_money'
};

function normalizePaymentMethod(value) {
  const raw = String(value || '').trim().toLowerCase();
  const normalized = ALIASES[raw];
  if (!normalized) {
    const error = new Error(`Método de pagamento inválido (aceites: ${CANONICAL_PAYMENT_METHODS.join(', ')})`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

module.exports = { normalizePaymentMethod, CANONICAL_PAYMENT_METHODS };
