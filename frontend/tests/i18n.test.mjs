// Lingua da interface (Fase 9.3). Correr: node --test tests/i18n.test.mjs  (dentro de frontend/)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { t, setLang, getLang, locale, hasTranslation, knownKeys } from '../src/i18n/core.js';
import '../src/i18n/en/common.js';
import '../src/i18n/en/auth.js';
import '../src/i18n/en/owner.js';
import '../src/i18n/en/pos.js';
import { money, pct, errorMessage, PAYMENT_LABEL } from '../src/utils/format.js';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

test('portugues por defeito: o texto sai tal como esta', () => {
  setLang('pt');
  assert.equal(getLang(), 'pt');
  assert.equal(t('Entrar'), 'Entrar');
  assert.equal(t('Restam {n} tentativa(s).', { n: 2 }), 'Restam 2 tentativa(s).');
});

test('ingles: traduz, interpola e, sem traducao, fica o portugues', () => {
  setLang('en');
  assert.equal(t('Entrar'), 'Sign in');
  assert.equal(t('Restam {n} tentativa(s).', { n: 0 }), '0 attempt(s) left.');
  assert.equal(t('Texto que ninguem traduziu'), 'Texto que ninguem traduziu');
  assert.equal(t('{a} e {b}', { a: 1 }), '1 e {b}', 'variavel em falta fica visivel, nao rebenta');
  setLang('pt');
});

test('lingua invalida e ignorada', () => {
  setLang('pt');
  setLang('fr');
  assert.equal(getLang(), 'pt');
});

test('dinheiro, percentagem e pagamentos seguem a lingua (centavos inteiros)', () => {
  setLang('pt');
  assert.equal(locale(), 'pt-PT');
  assert.equal(money(123450).replace(/\s/g, ' '), '1 234,50 MT');
  assert.equal(pct(12.5, 1), '12,5%');
  assert.equal(PAYMENT_LABEL.cash, 'Dinheiro');
  setLang('en');
  assert.equal(locale(), 'en-GB');
  assert.equal(money(123450), '1,234.50 MT');
  assert.equal(money(-5), '−0.05 MT');
  assert.equal(pct(12.5, 1), '12.5%');
  assert.equal(PAYMENT_LABEL.cash, 'Cash');
  assert.deepEqual(Object.entries(PAYMENT_LABEL).map(([, l]) => l), ['Cash', 'M-Pesa', 'e-Mola', 'Card / POS', 'M-Pesa/e-Mola (old)']);
  setLang('pt');
});

test('erros do servidor: pelo texto exacto ou pelo code; sem rede; fallback', () => {
  setLang('en');
  assert.equal(errorMessage({ response: { data: { error: 'Conta suspensa. Contacte o suporte.' } } }), 'Account suspended. Contact support.');
  assert.equal(errorMessage({ response: { data: { error: 'A conta x@y.mz não está registada no Genesis.', code: 'NOT_REGISTERED' } } }), t('code:NOT_REGISTERED'));
  assert.equal(errorMessage({}), 'No connection to the server.');
  assert.equal(errorMessage({ response: { data: {} } }, 'Email ou senha incorrectos.'), 'Wrong email or password.');
  assert.equal(hasTranslation('code:NOT_REGISTERED'), true);
  setLang('pt');
  assert.equal(hasTranslation('code:NOT_REGISTERED'), false, 'em portugues nunca se troca a mensagem do servidor');
  assert.equal(errorMessage({ response: { data: { error: 'Conta suspensa. Contacte o suporte.' } } }), 'Conta suspensa. Contacte o suporte.');
});

// Cobertura: cada texto que o codigo passa a t('...') (ou como fallback de
// errorMessage) tem traducao inglesa. Apanha o texto novo esquecido.
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'i18n' ? [] : walk(p);
    return /\.(jsx?|mjs)$/.test(e.name) ? [p] : [];
  });
}
const unq = (s) => s.replace(/\\'/g, "'");

test('todas as chaves usadas no codigo tem ingles', () => {
  const en = new Set(knownKeys('en'));
  const missing = [];
  let count = 0;
  for (const file of walk(SRC)) {
    const src = fs.readFileSync(file, 'utf8');
    const keys = [];
    // So literais inteiros: t('code:' + x) e dinamico e nao conta.
    for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)+)'\s*[,)]/g)) keys.push(unq(m[1]));
    for (const m of src.matchAll(/errorMessage\([^,()]+,\s*'((?:[^'\\]|\\.)+)'/g)) keys.push(unq(m[1]));
    // Listas cujo label e chave (t(label) no ecra).
    if (/layouts[\\/]AppShell\.jsx$|auth[\\/]RequestAccount\.jsx$/.test(file)) {
      for (const m of src.matchAll(/label: '((?:[^'\\]|\\.)+)'/g)) keys.push(unq(m[1]));
    }
    for (const k of keys) { count++; if (!en.has(k)) missing.push(path.relative(SRC, file) + ': ' + k); }
  }
  assert.ok(count > 50, 'o scanner encontrou chaves (' + count + ')');
  assert.deepEqual(missing, []);
});
