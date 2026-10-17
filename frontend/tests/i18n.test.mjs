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
import { LOSS_REASON, lossReason, timelineTitle, timelineWho } from '../src/utils/timelineText.js';
import { ACTION_LABEL, FIELD_LABEL, WEEKDAY, actionLabel, fieldValue } from '../src/utils/auditLabels.js';

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
  // Codigo com valores: monta com os params; sem params fica a mensagem do servidor.
  const dup = { response: { data: { error: 'O código 123 já é do produto «Coca».', code: 'DUPLICATE_BARCODE', params: { barcode: '123', name: 'Coca' } } } };
  assert.equal(errorMessage(dup), 'The code 123 already belongs to the product «Coca».');
  const dupOld = { response: { data: { error: 'Produto não encontrado', code: 'DUPLICATE_BARCODE' } } };
  assert.equal(errorMessage(dupOld), 'Product not found', 'sem params: traduz o texto do servidor');
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
const LABEL_FILES = /(layouts[\\/]AppShell|pos[\\/]PosScreen|auth[\\/]RequestAccount|owner[\\/](Debts|ShoppingLists|Reports|Settings|AuditLogPage)|ui[\\/]productIcons)\.jsx?$/;

// Mensagens fixas que o servidor devolve em `error` nas areas ja traduzidas:
// o ecra mostra-as pelo texto exacto (utils/format.js errorMessage).
const SERVER_FILES = ['routes/auth.js', 'routes/pos.js', 'routes/owner.js', 'routes/products.js', 'routes/inventory.js', 'routes/settings.js',
  'routes/shoppingLists.js', 'routes/catalogs.js', 'routes/dashboard.js', 'middleware/auth.js', 'utils/sessionUser.js',
  // 9.5: venda, turno e terminal.
  'routes/sales.js', 'utils/shift.js', 'middleware/terminalAuth.js', 'middleware/posWriteAuth.js'];
test('mensagens de erro do servidor (dono, conta, terminal) tem ingles', () => {
  const en = new Set(knownKeys('en'));
  const BACK = path.join(SRC, '..', '..', 'backend', 'src');
  const missing = new Set();
  for (const f of SERVER_FILES) {
    const src = fs.readFileSync(path.join(BACK, f), 'utf8');
    for (const m of src.matchAll(/(?:httpError\(\d+,\s*|error:\s*)'((?:[^'\\]|\\.)+)'/g)) if (!en.has(unq(m[1]))) missing.add(f + ': ' + unq(m[1]));
  }
  // Mensagens em ingles de origem (tokens do refresh) nao precisam de traducao.
  assert.deepEqual([...missing].filter((x) => !/Refresh token|Invalid refresh token/.test(x)), []);
});

test('auditoria: cada accao, campo e dia da semana tem ingles', () => {
  const en = new Set(knownKeys('en'));
  const missing = [...Object.values(ACTION_LABEL), ...Object.values(FIELD_LABEL), ...WEEKDAY].filter((pt) => !en.has(pt));
  assert.deepEqual(missing, []);
  setLang('en');
  assert.equal(actionLabel('CREATE_SALE'), 'Sale');
  assert.equal(fieldValue('has_expiry', true), 'Yes');
  assert.equal(actionLabel('ACCAO_NOVA'), 'ACCAO_NOVA', 'accao desconhecida: o codigo, sem rebentar');
  setLang('pt');
  assert.equal(actionLabel('CREATE_SALE'), 'Venda');
});

test('motivos das perdas e rastreio montados na lingua de quem ve', () => {
  for (const pt of Object.values(LOSS_REASON)) assert.ok(knownKeys('en').includes(pt), 'motivo sem ingles: ' + pt);
  setLang('en');
  assert.equal(lossReason('expired'), 'Expiry date passed');
  assert.equal(timelineTitle({ type: 'stock', quantity: 12, product_name: 'Coca-Cola' }), 'Stock entry: +12 × Coca-Cola');
  assert.equal(timelineTitle({ type: 'demand', product_name: 'Gelo', quantity: 3, in_catalog: false }), 'Customer asked for: Gelo ×3 (not in catalogue)');
  assert.equal(timelineWho({ type: 'loss', auto: true, who: 'Genesis (automático)' }), 'Genesis (automatic)');
  assert.equal(timelineTitle({ type: 'loss', title: 'Perda: 1 × X' }), 'Perda: 1 × X', 'servidor antigo sem dados: fica o titulo dele');
  setLang('pt');
  assert.equal(timelineTitle({ type: 'stock', quantity: -2, product_name: 'Gelo' }), 'Ajuste de stock: -2 × Gelo');
});

// O terminal so carrega en/common.js + en/pos.js (nao o dicionario do dono):
// cada texto dos ficheiros do terminal tem de estar num desses dois. O recibo
// tambem sai do painel do dono (SaleDrawer): o dele fica em common.js.
const dictKeys = (f) => new Set([...fs.readFileSync(path.join(SRC, 'i18n', 'en', f), 'utf8').matchAll(/^\s*'((?:[^'\\]|\\.)+)':/gm)].map((m) => unq(m[1])));
function keysOf(rel) {
  const src = fs.readFileSync(path.join(SRC, rel), 'utf8');
  const keys = [...src.matchAll(/\btr?\(\s*'((?:[^'\\]|\\.)+)'\s*[,)]/g)].map((m) => unq(m[1]));
  if (LABEL_FILES.test(rel)) keys.push(...[...src.matchAll(/label: '((?:[^'\\]|\\.)+)'/g)].map((m) => unq(m[1])));
  return keys;
}
const RECEIPT_FILES = ['utils/escpos.js', 'utils/devices.js', 'utils/receiptPrinter.js', 'utils/pdf/receiptPdf.js', 'components/PdfReadyDialog.jsx'];
const TERMINAL_FILES = ['pages/pos/Terminal.jsx', 'pages/pos/PosScreen.jsx', 'pages/pos/PosDialogs.jsx', 'pages/pos/DevicesDialog.jsx', 'components/BarcodeScanner.jsx', ...RECEIPT_FILES];
test('terminal: os textos estao nos dicionarios que ele carrega (common + pos)', () => {
  const common = dictKeys('common.js');
  const pos = dictKeys('pos.js');
  const outside = TERMINAL_FILES.flatMap((f) => keysOf(f).filter((k) => !common.has(k) && !pos.has(k)).map((k) => f + ': ' + k));
  assert.deepEqual(outside, []);
  const receiptNotCommon = RECEIPT_FILES.flatMap((f) => keysOf(f).filter((k) => !common.has(k)).map((k) => f + ': ' + k));
  assert.deepEqual(receiptNotCommon, [], 'recibo/impressoras: tambem usados no painel do dono');
});

test('recibo na lingua de quem o gera (ESC/POS); em portugues fica igual', async () => {
  const { buildEscPosReceipt } = await import('../src/utils/escpos.js');
  const input = { shopName: 'Loja', cashierName: 'Carlos', sale: { daily_number: 7, created_at: '2026-10-11T10:00:00Z', payment_method: 'x', total_amount: 19500, amount_received: 20000, change_given: 500 }, items: [{ product_name: 'Gelo', quantity: 3, unit_sell_price: 6500 }] };
  const txt = () => Buffer.from(buildEscPosReceipt(input)).toString('latin1');
  setLang('pt');
  const pt = txt();
  assert.ok(pt.includes('Venda n.o 007') && pt.includes('Caixista: Carlos') && pt.includes('195,00') && pt.includes('Obrigado pela preferencia!'));
  setLang('en');
  const en = txt();
  assert.ok(en.includes('Sale no. 007') && en.includes('Cashier: Carlos') && en.includes('195.00') && en.includes('Change') && en.includes('Thank you'), en);
  assert.ok(!/Caixista|Troco|Obrigado/.test(en));
  setLang('pt');
});

// 9.7: o painel super admin (build separada) so carrega en/common.js + o seu
// admin-frontend/src/i18n_en.js. Os label das listas (estados, tipos, menu,
// icones) tambem passam por t().
test('admin: cada texto esta no comum ou no dicionario do admin', () => {
  const ADMIN = path.join(SRC, '..', '..', 'admin-frontend', 'src');
  const common = dictKeys('common.js');
  const admin = new Set([...fs.readFileSync(path.join(ADMIN, 'i18n_en.js'), 'utf8').matchAll(/^\s*'((?:[^'\\]|\\.)+)':/gm)].map((m) => unq(m[1])));
  const src = fs.readFileSync(path.join(ADMIN, 'App.jsx'), 'utf8');
  const keys = [
    ...[...src.matchAll(/\btr?\(\s*'((?:[^'\\]|\\.)+)'\s*[,)]/g)].map((m) => unq(m[1])),
    ...[...src.matchAll(/label: '((?:[^'\\]|\\.)+)'/g)].map((m) => unq(m[1])),
    ...[...src.matchAll(/const TYPES = \{([^}]+)\}/g)].flatMap((m) => [...m[1].matchAll(/: '((?:[^'\\]|\\.)+)'/g)].map((x) => unq(x[1]))),
    ...[...fs.readFileSync(path.join(SRC, 'components', 'ui', 'productIcons.js'), 'utf8').matchAll(/label: '((?:[^'\\]|\\.)+)'/g)].map((m) => unq(m[1])),
  ];
  assert.ok(keys.length > 100, 'o scanner encontrou ' + keys.length + ' textos');
  assert.deepEqual([...new Set(keys.filter((k) => !common.has(k) && !admin.has(k)))], []);
});

test('todas as chaves usadas no codigo tem ingles', () => {
  const en = new Set(knownKeys('en'));
  const missing = [];
  let count = 0;
  for (const file of walk(SRC)) {
    const src = fs.readFileSync(file, 'utf8');
    const keys = [];
    // So literais inteiros: t('code:' + x) e dinamico e nao conta.
    // t(...) e tr(...) (o t do core importado com outro nome).
    for (const m of src.matchAll(/\btr?\(\s*'((?:[^'\\]|\\.)+)'\s*[,)]/g)) keys.push(unq(m[1]));
    for (const m of src.matchAll(/errorMessage\([^,()]+,\s*'((?:[^'\\]|\\.)+)'/g)) keys.push(unq(m[1]));
    // Listas constantes cujo label e a chave (o ecra faz t(label)).
    if (LABEL_FILES.test(file)) {
      for (const m of src.matchAll(/label: '((?:[^'\\]|\\.)+)'/g)) keys.push(unq(m[1]));
    }
    for (const k of keys) { count++; if (!en.has(k)) missing.push(path.relative(SRC, file) + ': ' + k); }
  }
  assert.ok(count > 50, 'o scanner encontrou chaves (' + count + ')');
  assert.deepEqual(missing, []);
});
