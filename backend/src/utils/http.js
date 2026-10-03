// Utilitarios HTTP partilhados (Genesis 2.0).
//
// httpError: erro de REGRA DE NEGOCIO com codigo HTTP 4xx. O POS offline trata
// 4xx como recusa definitiva e 5xx/rede como "tentar de novo" — por isso uma
// regra violada NUNCA pode sair como 500, e uma falha inesperada nunca como 4xx.
//
// asyncHandler: no Express 4 uma promessa rejeitada num handler async nao e
// apanhada. No Node 24 uma rejeicao nao tratada TERMINA O PROCESSO — um clique
// errado no painel admin derrubava o servidor de todas as lojas.
const { ZodError } = require('zod');

function httpError(statusCode, message, code) {
  const e = new Error(message);
  e.statusCode = statusCode;
  if (code) e.code = code;
  return e;
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Handler de erros final (montado em index.js).
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.errors[0]?.message || 'Dados inválidos', details: err.errors });
  }
  if (err && err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
  }
  // Prisma "registo nao encontrado" num update/delete por id.
  if (err && err.code === 'P2025') return res.status(404).json({ error: 'Registo não encontrado' });
  console.error(`[erro] ${req.method} ${req.originalUrl}`, err && (err.stack || err));
  return res.status(500).json({ error: 'Erro interno do servidor' });
}

module.exports = { httpError, asyncHandler, errorHandler };
