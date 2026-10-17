// Fase 9.5: terminal em ingles (venda, dialogos, dispositivos, recibo PDF e
// ESC/POS) e o X de «Dispositivos» que ja nao apaga a impressora (decisao do
// fundador 17/10). O caixista escolhe EN; o aparelho fica em PT.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/idioma_pos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = path.resolve(process.env.SHOTS || 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, n + '.png') });
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}
const api = (page, method, url, body) => page.evaluate(async ([m, u, b]) => { const r = await fetch(u, { method: m, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => null) }; }, [method, url, body]);
const prefs = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('genesis_devices') || '{}'));
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// Palavras do terminal em portugues que nao podem ficar no ecra em ingles
// (nomes de produtos, loja e caixista da loja de teste nao as contem).
const PT_WORDS = ['Cobrar', 'Venda actual', 'Pesquisar', 'Dispositivos', 'Fechar turno', 'Quebra', 'Produto em falta', 'Recebido', 'Troco', 'Desconto', 'Limpar', 'Adicione', 'Esgotado', 'Cancelar', 'Registar', 'Motivo', 'Quantidade', 'Vendas', 'Turno', 'turno', 'Caixista', 'Imprimir', 'Nova venda', 'gaveta', 'Dinheiro', 'Cartão', 'Leitor', 'Impressora', 'Continuar', 'saltar', 'Autorizar', 'PIN do dono', 'Contou', 'Confirma', 'Ainda ', 'Sem ', 'un.'];
async function ptResidue(scope) {
  const text = await scope.evaluate((el) => (el.innerText || ''), await scope.elementHandle());
  return PT_WORDS.filter((w) => text.includes(w));
}
const body = (page) => page.locator('body');

// Impressora USB simulada (como no fase8_8): guarda os bytes ESC/POS.
const deviceStubs = () => {
  window.__printed = [];
  const port = { writable: null, async open() { this.writable = new WritableStream({ write(chunk) { window.__printed.push(Array.from(chunk)); } }); }, async close() {}, getInfo() { return { usbVendorId: 0x0416, usbProductId: 0x5011 }; } };
  let granted = false;
  Object.defineProperty(navigator, 'serial', { configurable: true, value: { async requestPort() { granted = true; return port; }, async getPorts() { return granted ? [port] : []; } } });
};

let browser;
try {
  browser = await chromium.launch();
  const ownerCtx = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  const coca = (await api(owner, 'GET', '/api/products')).data.find((p) => p.name.startsWith('Coca-Cola'));

  console.log('=== Terminal (computador): caixista em inglês ===');
  const code = await api(owner, 'POST', '/api/owner/terminals/pairing-code', { name: 'Balcão EN' });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 }, locale: 'pt-PT', acceptDownloads: true });
  await ctx.addInitScript(deviceStubs);
  const term = await ctx.newPage();
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code.data.code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).click({ timeout: T });
  await term.getByText('Introduza o seu PIN').waitFor();
  await term.keyboard.type(fx.cashier.pin);
  const dlgPt = term.getByRole('dialog', { name: 'Dispositivos' });
  await dlgPt.waitFor({ timeout: T });
  const putEn = term.waitForResponse((r) => r.url().includes('/api/auth/language') && r.request().method() === 'PUT', { timeout: T });
  await dlgPt.getByRole('radio', { name: 'EN' }).click();
  ok((await putEn).status() === 200, 'caixista escolhe EN em «Dispositivos» (grava na conta)');
  const dlg = term.getByRole('dialog', { name: 'Devices' });
  await dlg.waitFor({ timeout: T });
  ok(await dlg.getByText('Barcode scanner', { exact: true }).isVisible() && await dlg.getByText('Receipt printer', { exact: true }).isVisible(), '«Devices» em inglês (leitor e impressora)');
  ok((await ptResidue(dlg)).length === 0, '«Devices»: sem português', await ptResidue(dlg));
  await dlg.getByRole('radio', { name: 'USB' }).click();
  await dlg.getByRole('button', { name: 'Connect USB printer' }).click();
  await dlg.getByText('USB printer connected.', { exact: false }).waitFor({ timeout: T });
  ok(true, 'impressora USB ligada (simulada), mensagem em inglês');
  await shot(term, 'p1-devices-en');
  await dlg.getByRole('button', { name: 'Continue' }).click();
  await term.getByText('Current sale').waitFor({ timeout: T });
  ok((await prefs(term)).printer === 'usb', 'escolha guardada: impressora USB', await prefs(term));

  console.log('\n=== X de «Devices»: fecha sem mudar nada (9.5) ===');
  await term.getByRole('button', { name: 'Devices' }).click();
  await dlg.waitFor({ timeout: T });
  await dlg.getByRole('radio', { name: 'PDF only' }).click();
  await dlg.getByRole('button', { name: 'Close' }).click();
  await dlg.waitFor({ state: 'detached', timeout: T });
  ok((await prefs(term)).printer === 'usb', 'X: a impressora continua USB (antes ficava «Só PDF»)', await prefs(term));

  console.log('\n=== Ecrã de venda e recibo em inglês ===');
  await term.locator('button[data-tile]', { hasText: coca.name }).click({ timeout: T });
  const charge = term.getByRole('button', { name: /^Charge / });
  await charge.waitFor({ timeout: T });
  ok(await term.getByText('Subtotal').isVisible() && await term.getByRole('radio', { name: 'Cash' }).isVisible() && await term.getByText('Change', { exact: true }).isVisible(), 'cesto: Subtotal, Cash, Change');
  ok(await term.getByRole('button', { name: 'Breakage' }).isVisible() && await term.getByRole('button', { name: 'Close shift' }).isVisible(), 'cabeçalho: Breakage, Close shift');
  const residuePos = await ptResidue(body(term));
  ok(residuePos.length === 0, 'ecrã de venda: sem português', residuePos);
  await shot(term, 'p2-pos-en');
  await charge.click();
  const rec = term.getByRole('dialog', { name: 'Sale recorded' });
  await rec.waitFor({ timeout: T });
  ok(await rec.getByText(/^Sale no\. \d{3}$/).isVisible(), 'recibo no ecrã: «Sale no. 00N»');
  ok((await ptResidue(rec)).length === 0, '«Sale recorded»: sem português', await ptResidue(rec));
  const [dl] = await Promise.all([term.waitForEvent('download', { timeout: 60000 }), rec.getByRole('button', { name: 'Print receipt' }).click()]);
  ok(/^Receipt_\d+ - .+\.pdf$/.test(dl.suggestedFilename()), 'PDF do recibo: ' + dl.suggestedFilename());
  const pdf = fs.readFileSync(await dl.path()).toString('latin1');
  ok(/Sale no\.:/.test(pdf) && /Cashier:/.test(pdf) && /Received/.test(pdf) && /Thank you/.test(pdf) && !/Caixista|Troco|Obrigado/.test(pdf), 'PDF do recibo em inglês (Sale no., Cashier, Received, Thank you)');
  await term.waitForFunction(() => window.__printed.length > 0, null, { timeout: 30000 }).catch(() => {});
  const esc = Buffer.from((await term.evaluate(() => window.__printed)).flat()).toString('latin1');
  ok(esc.includes('Sale no. ') && esc.includes('Cashier: ' + fx.cashier.name) && esc.includes('Thank you') && !/Caixista|Troco|Obrigado/.test(esc), 'impressora térmica (ESC/POS) em inglês');
  await shot(term, 'p3-recibo-en');
  await rec.getByRole('button', { name: 'New sale' }).click();

  console.log('\n=== Diálogos ===');
  // Desconto acima do limite: pede o PIN do dono; PIN errado -> mensagem em ingles.
  await term.locator('button[data-tile]', { hasText: coca.name }).click();
  await term.getByRole('button', { name: 'Apply discount' }).click();
  await term.getByLabel('Discount').fill(String(Math.ceil(coca.sell_price / 100 / 2)));
  await term.getByRole('button', { name: /^Charge / }).click();
  const pinDlg = term.getByRole('dialog', { name: 'Authorise discount' });
  await pinDlg.waitFor({ timeout: T });
  ok(await pinDlg.getByText(/above the 10% limit/).isVisible(), 'desconto: «Authorise discount» com o limite');
  await pinDlg.getByLabel('Owner PIN').fill('0000');
  await pinDlg.getByRole('button', { name: 'Authorise' }).click();
  await term.getByRole('dialog', { name: 'Authorise discount' }).getByText('Wrong PIN.').waitFor({ timeout: T });
  ok(true, 'PIN errado: «Wrong PIN.»');
  await term.getByRole('dialog', { name: 'Authorise discount' }).getByRole('button', { name: 'Cancel' }).click();
  await term.getByRole('button', { name: 'Clear' }).click();

  await term.getByRole('button', { name: 'Breakage' }).click();
  const shrink = term.getByRole('dialog', { name: 'Record breakage or own use' });
  await shrink.waitFor({ timeout: T });
  ok(await shrink.getByRole('option', { name: 'Broken' }).count() === 1 && (await ptResidue(shrink)).length === 0, 'quebra: diálogo em inglês', await ptResidue(shrink));
  await shrink.getByRole('button', { name: 'Cancel' }).click();

  await term.getByRole('button', { name: 'Product not available' }).click();
  const demand = term.getByRole('dialog', { name: 'Product not available' });
  await demand.waitFor({ timeout: T });
  await demand.getByRole('radio', { name: 'Not in the catalogue' }).click();
  ok(await demand.getByLabel('What the customer asked for').isVisible() && (await ptResidue(demand)).length === 0, 'produto em falta: diálogo em inglês', await ptResidue(demand));
  await demand.getByRole('button', { name: 'Cancel' }).click();

  await term.getByRole('button', { name: 'Sales' }).click();
  const pinSales = term.getByRole('dialog', { name: 'View sales' });
  await pinSales.waitFor({ timeout: T });
  await pinSales.getByLabel('Owner PIN').fill(fx.authPin);
  await pinSales.getByRole('button', { name: 'Authorise' }).click();
  const list = term.getByRole('dialog', { name: 'My latest sales' });
  await list.waitFor({ timeout: T });
  ok(await list.getByText(/1 item\(s\)/).first().isVisible() && (await ptResidue(list)).length === 0, 'últimas vendas: em inglês', await ptResidue(list));
  await list.getByRole('button', { name: 'Close' }).click();

  // Fecho cego: contagem abaixo -> mensagem do servidor montada em ingles (params).
  await term.getByRole('button', { name: 'Close shift' }).click();
  const close = term.getByRole('dialog', { name: 'Close shift' });
  await close.waitFor({ timeout: T });
  ok((await ptResidue(close)).length === 0, 'fechar turno: em inglês', await ptResidue(close));
  await close.getByLabel('Cash counted in the drawer').fill('1');
  await close.getByRole('button', { name: 'Confirm count' }).click();
  await close.getByText('You counted in the drawer').waitFor();
  await close.getByRole('button', { name: 'Yes, close the shift' }).click();
  await close.getByText(/Count again\. 2 attempt\(s\) left\./).waitFor({ timeout: T });
  ok(true, 'contagem abaixo: «… Count again. 2 attempt(s) left.» (servidor com params)');
  await shot(term, 'p4-fecho-en');
  await close.getByLabel('Cash counted in the drawer').fill(String(coca.sell_price / 100));
  await close.getByRole('button', { name: 'Confirm count' }).click();
  await close.getByRole('button', { name: 'Yes, close the shift' }).click();
  await close.getByText('Correct amount.', { exact: false }).waitFor({ timeout: T });
  ok(await close.getByText('Expected in cash').isVisible() && (await ptResidue(close)).length === 0, 'turno fechado: resumo em inglês', await ptResidue(close));
  await close.getByRole('button', { name: 'Done' }).click();
  await term.getByText("Today's shift closed").first().waitFor({ timeout: T });
  ok(true, 'aviso «Today\'s shift closed» no ecrã de venda');

  console.log('\n=== «I don\'t have one — skip» continua a pôr «Só PDF» ===');
  await term.getByRole('button', { name: 'Devices' }).click();
  await dlg.waitFor({ timeout: T });
  await dlg.getByRole('button', { name: /I don't have one/ }).click();
  await dlg.waitFor({ state: 'detached', timeout: T });
  ok((await prefs(term)).printer === 'none', 'saltar: impressora «Só PDF»', await prefs(term));
  await ctx.close();

  console.log('\n=== Telemóvel (iPhone): o ecrã de venda em inglês cabe ===');
  const code2 = await api(owner, 'POST', '/api/owner/terminals/pairing-code', { name: 'Balcão EN telemóvel' });
  const ctxP = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const phone = await ctxP.newPage();
  watch(phone, 'iphone');
  await phone.goto(BASE + '/terminal');
  await phone.getByLabel('Código de emparelhamento').fill(code2.data.code);
  await phone.getByRole('button', { name: 'Emparelhar' }).click();
  await phone.getByRole('button', { name: new RegExp(fx.cashier.name) }).click({ timeout: T });
  await phone.keyboard.type(fx.cashier.pin);
  const dlgPhone = phone.getByRole('dialog', { name: 'Devices' });
  await dlgPhone.waitFor({ timeout: T });
  ok(true, 'outro aparelho: o caixista entra e o terminal abre em inglês (a língua é dele)');
  await dlgPhone.getByRole('button', { name: 'Close' }).click();
  await phone.getByText('Current sale').waitFor({ timeout: T });
  await phone.locator('button[data-tile]').first().waitFor({ timeout: T });
  ok(await phone.getByText("Today's shift closed").first().waitFor({ timeout: T }).then(() => true, () => false), 'iPhone: aviso do turno fechado em inglês (o mesmo caixista)');
  ok(await noHScroll(phone), 'iPhone 390 px: sem deslocamento lateral');
  ok((await ptResidue(body(phone))).length === 0, 'iPhone: sem português', await ptResidue(body(phone)));
  await shot(phone, 'p5-iphone-en');
  await ctxP.close();
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser?.close().catch(() => {});
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: terminal em inglês passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
