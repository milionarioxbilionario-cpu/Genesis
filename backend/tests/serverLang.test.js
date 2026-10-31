// Fase 9.6: mensagens que o servidor escreve para fora (WhatsApp, email) na
// lingua de quem as gera. Em portugues ficam exactamente como antes.
// Correr: node --test tests/serverLang.test.js  (dentro de backend/)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { tr, reqLang, pickLang, EN } = require('../src/utils/lang');
const { orderMessage } = require('../src/services/shoppingList');
const { buildAlertSummary } = require('../src/services/tenantAlerts');
const { buildReportMessage } = require('../src/services/reportSchedule');
const { buildPasswordResetEmail } = require('../src/utils/mailer');

const fakeReq = (h) => ({ get: (k) => (k.toLowerCase() === 'x-genesis-lang' ? h : undefined) });

test('lingua do pedido: so pt/en; o resto e pt', () => {
  assert.strictEqual(reqLang(fakeReq('en')), 'en');
  assert.strictEqual(reqLang(fakeReq('EN')), 'en');
  assert.strictEqual(reqLang(fakeReq('fr')), 'pt');
  assert.strictEqual(reqLang(fakeReq(undefined)), 'pt');
  assert.strictEqual(reqLang({}), 'pt');
  assert.strictEqual(pickLang('<script>'), 'pt');
  assert.strictEqual(tr('en', 'Texto sem traducao'), 'Texto sem traducao');
  assert.strictEqual(tr('pt', 'Gostaria de encomendar:'), 'Gostaria de encomendar:');
});

test('encomenda ao fornecedor: PT igual ao de antes; EN', () => {
  const items = [{ quantity: 24, product_name: '2M 340ml' }];
  assert.strictEqual(orderMessage({ storeName: 'Loja', supplierName: 'Zé', items }),
    'Olá Zé, daqui fala Loja.\nGostaria de encomendar:\n- 24 × 2M 340ml\n\nPode confirmar o preço e quando entrega? Obrigado.');
  assert.strictEqual(orderMessage({ storeName: '', items }).split('\n')[0], 'Olá, daqui fala o seu cliente.');
  const en = orderMessage({ storeName: 'Loja', supplierName: 'Zé', items, lang: 'en' });
  assert.strictEqual(en, 'Hello Zé, this is Loja.\nI would like to order:\n- 24 × 2M 340ml\n\nCan you confirm the price and when you deliver? Thank you.');
  assert.strictEqual(orderMessage({ items, lang: 'en' }).split('\n')[0], 'Hello, this is your customer.');
});

test('alertas: PT igual; EN', () => {
  const snap = { lowStockProducts: [{ name: 'Gelo', stock_qty: 2, min_stock: 5 }], expiringLots: [{ name: 'Leite', quantity: 4, days_left: 0 }] };
  assert.strictEqual(buildAlertSummary({ name: 'Loja' }, snap), 'Olá Loja, Genesis reportou alertas operacionais: Stock baixo: Gelo (2/5) | Validades: Leite — 4 un. expiram hoje');
  assert.strictEqual(buildAlertSummary({ name: 'Loja' }, snap, 'en'), 'Hello Loja, Genesis reported operational alerts: Low stock: Gelo (2/5) | Expiry dates: Leite — 4 units expire today');
  assert.strictEqual(buildAlertSummary(null, { lowStockProducts: [], expiringLots: [] }, 'en'), 'Hello manager, all products are within normal levels.');
});

test('relatorio por WhatsApp em ingles (numeros en-GB)', () => {
  const msg = buildReportMessage({
    due: { kind: 'monthly', year: 2026, month: 9 },
    report: { gross_revenue: 127950, sales_count: 3, gross_profit: 40000, net_profit: -500, losses_total: 1000, most_sold: { name: '2M', quantity: 5 }, lost_demand: [{ units: 3 }] },
    storeName: 'Loja', lang: 'en',
  });
  assert.match(msg, /Monthly report 09\/2026/);
  assert.match(msg, /Revenue: 1,279\.50 MT \(3 sale\(s\)\)/);
  assert.match(msg, /Real net profit: -5\.00 MT/);
  assert.match(msg, /Losses: 10\.00 MT/);
  assert.match(msg, /Best seller: 2M \(5 units\)/);
  assert.match(msg, /See everything: https:\/\/genesismz\.com\/app\/relatorios/);
  assert.ok(!/Receita|Lucro|Perdas|Ver tudo/.test(msg));
});

test('email do codigo de recuperacao: PT igual; EN; o codigo esta la', () => {
  const pt = buildPasswordResetEmail('123456');
  assert.strictEqual(pt.subject, '123456 é o seu código de recuperação Genesis');
  assert.match(pt.html, /Recuperação de Palavra-passe/);
  const en = buildPasswordResetEmail('123456', 'en');
  assert.strictEqual(en.subject, '123456 is your Genesis recovery code');
  assert.match(en.text, /Your recovery code is: 123456/);
  assert.match(en.html, /lang="en"/);
  assert.ok(!/código|palavra-passe/i.test(en.text + en.html));
});

test('cada texto passado a tr() no servidor tem ingles', () => {
  const SRC = path.join(__dirname, '..', 'src');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
  const missing = [];
  let count = 0;
  for (const f of walk(SRC)) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/\btr\(\s*[\w.()]+\s*,\s*'((?:[^'\\]|\\.)+)'/g)) {
      count++;
      const k = m[1].replace(/\\'/g, "'");
      if (!Object.prototype.hasOwnProperty.call(EN, k)) missing.push(path.relative(SRC, f) + ': ' + k);
    }
  }
  assert.ok(count >= 25, 'o scanner encontrou ' + count + ' textos');
  assert.deepStrictEqual(missing, []);
});
