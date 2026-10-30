// errorHandler: regra violada (4xx) e 5xx criado de proposito mostram a mensagem;
// falha inesperada fica com a mensagem generica (29/10: o 503 «e-mails nao
// configurados» do Perfil saia como «Erro interno do servidor» em producao).
const test = require('node:test');
const assert = require('node:assert');
const { httpError, errorHandler } = require('../src/utils/http');

function run(err) {
  const out = {};
  const res = { headersSent: false, status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } };
  const quiet = console.error; console.error = () => {};
  try { errorHandler(err, { method: 'POST', originalUrl: '/x' }, res, () => {}); } finally { console.error = quiet; }
  return out;
}

test('4xx de regra: estado, mensagem e codigo', () => {
  const r = run(httpError(409, 'Esse e-mail já pertence a outra conta.', 'EMAIL_IN_USE'));
  assert.deepStrictEqual(r, { status: 409, body: { error: 'Esse e-mail já pertence a outra conta.', code: 'EMAIL_IN_USE' } });
});

test('5xx criado de proposito: mantem o estado e mostra a mensagem', () => {
  const r = run(httpError(503, 'O envio de e-mails ainda não está configurado.', 'EMAIL_NOT_CONFIGURED'));
  assert.strictEqual(r.status, 503);
  assert.strictEqual(r.body.code, 'EMAIL_NOT_CONFIGURED');
  assert.match(r.body.error, /não está configurado/);
});

test('falha inesperada: 500 com a mensagem generica (nada do erro sai)', () => {
  const e = new Error('connect ECONNREFUSED 10.0.0.1:5432');
  e.statusCode = 503;
  const r = run(e);
  assert.deepStrictEqual(r, { status: 500, body: { error: 'Erro interno do servidor' } });
});
