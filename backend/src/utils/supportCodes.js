// Codigos de uso unico para o Super Admin abrir uma loja em MODO SUPORTE
// (so leitura). O painel admin gera o codigo; o frontend principal troca-o por
// uma sessao 'support' NO SEU PROPRIO browser/origem. Antes, a "impersonacao"
// emitia uma sessao COMPLETA de dono (com escrita) e sobrescrevia o cookie do
// proprio Super Admin. Vida curta (60 s) e em memoria, como os outros codigos.
const crypto = require('crypto');

const TTL_MS = 60 * 1000;
const codes = new Map(); // code -> { ownerUserId, tenantId, adminUserId, expiresAt }

function createSupportCode({ ownerUserId, tenantId, adminUserId }) {
  const now = Date.now();
  for (const [k, v] of codes) if (v.expiresAt < now) codes.delete(k);
  const code = crypto.randomBytes(24).toString('base64url');
  codes.set(code, { ownerUserId, tenantId, adminUserId, expiresAt: now + TTL_MS });
  return code;
}

function consumeSupportCode(code) {
  const entry = codes.get(String(code || ''));
  if (!entry) return null;
  codes.delete(String(code));
  return entry.expiresAt < Date.now() ? null : entry;
}

module.exports = { createSupportCode, consumeSupportCode };
