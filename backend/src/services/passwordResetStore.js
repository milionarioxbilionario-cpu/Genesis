const crypto = require('crypto');

const resetCodes = new Map();

const CODE_TTL_MS = 15 * 60 * 1000;
// Tentativas erradas por codigo antes de o destruir (obriga a pedir outro).
const MAX_ATTEMPTS = 5;

// crypto.randomInt em vez de Math.random: o codigo e uma credencial temporaria
// que permite trocar a password da conta. Math.random e um PRNG previsivel, com
// 900 000 valores possiveis e um estado observavel a partir de codigos emitidos.
function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

// Guarda-se o hash do codigo, nunca o codigo em claro: um dump deste Map (heap,
// log de erro, crash report) nao da acesso a conta nenhuma.
function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function timingSafeEqualHex(a, b) {
  const bufferA = Buffer.from(String(a), 'hex');
  const bufferB = Buffer.from(String(b), 'hex');
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

function saveResetCode(email, code) {
  const normalized = normalizeEmail(email);
  resetCodes.set(normalized, {
    codeHash: hashCode(code),
    attempts: 0,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
}

// Devolve true apenas quando o codigo corresponde. Cada tentativa falhada conta:
// o codigo tem de ser curto para ser escrito por WhatsApp, e 6 digitos a 5
// tentativas por pedido deixam de ser viaveis.
function verifyResetCode(email, code) {
  const normalized = normalizeEmail(email);
  const entry = resetCodes.get(normalized);
  if (!entry) return false;

  if (entry.expiresAt < Date.now()) {
    resetCodes.delete(normalized);
    return false;
  }

  if (!timingSafeEqualHex(entry.codeHash, hashCode(code))) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) {
      resetCodes.delete(normalized);
    }
    return false;
  }

  return true;
}

function clearResetCode(email) {
  resetCodes.delete(normalizeEmail(email));
}

// Divida assumida: os codigos vivem em memoria do processo. Um restart invalida
// os pedidos pendentes e, com varias instancias, o codigo emitido numa nao e
// validado na outra. Resolver exige tabela propria (com TTL) na BD.
module.exports = {
  generateCode,
  saveResetCode,
  verifyResetCode,
  clearResetCode,
  MAX_ATTEMPTS,
};
