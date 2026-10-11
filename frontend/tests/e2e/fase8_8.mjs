// Fase 8.8 (pedido do fundador 10/10/2026): dispositivos.
//  - pergunta dos dispositivos logo depois do PIN, com "Não tenho" (uma vez);
//  - camara: codigo conhecido entra no carrinho; desconhecido = "Produto não
//    cadastrado"; no formulario do produto preenche o codigo. A camara e
//    falsa: o Chromium mostra um video .y4m com um EAN-13 desenhado aqui;
//  - recibo: SEMPRE em PDF no aparelho + impressora USB (Web Serial) ou
//    Bluetooth (Web Bluetooth) simuladas, que guardam os bytes ESC/POS.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/fase8_8.mjs
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
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, n + '.png') });
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}

// ---------------------------------------------------------------- EAN-13 -> .y4m
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = L.map((c) => c.replace(/./g, (b) => (b === '0' ? '1' : '0')));
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
function ean13(twelve) {
  const d = twelve.split('').map(Number);
  const sum = d.reduce((s, v, i) => s + v * (i % 2 ? 3 : 1), 0);
  return twelve + ((10 - (sum % 10)) % 10);
}
function eanModules(code) {
  const d = code.split('').map(Number);
  let m = '101';
  for (let i = 1; i <= 6; i++) m += (PARITY[d[0]][i - 1] === 'L' ? L : G)[d[i]];
  m += '01010';
  for (let i = 7; i <= 12; i++) m += R[d[i]];
  return m + '101';
}
function writeY4m(file, code) {
  const W = 640; const H = 480; const mod = 5; const mods = eanModules(code);
  const x0 = Math.floor((W - mods.length * mod) / 2);
  const y = Buffer.alloc(W * H, 255);
  for (let row = 90; row < 390; row++) for (let i = 0; i < mods.length; i++) if (mods[i] === '1') y.fill(0, row * W + x0 + i * mod, row * W + x0 + (i + 1) * mod);
  const uv = Buffer.alloc((W / 2) * (H / 2), 128);
  const frame = Buffer.concat([Buffer.from('FRAME\n'), y, uv, uv]);
  fs.writeFileSync(file, Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`), ...Array(10).fill(frame)]));
}
const KNOWN = ean13('560123456789');
const UNKNOWN = ean13('560987654321');
const knownY4m = path.join(SHOTS, 'known.y4m');
const unknownY4m = path.join(SHOTS, 'unknown.y4m');
writeY4m(knownY4m, KNOWN);
writeY4m(unknownY4m, UNKNOWN);
const camArgs = (file) => ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + file];

// ---------------------------------------------------------------- simuladores
const deviceStubs = () => {
  window.__printed = []; window.__portRequests = 0; window.__btWrites = []; window.__shared = [];
  const port = { writable: null, async open() { this.writable = new WritableStream({ write(chunk) { window.__printed.push(Array.from(chunk)); } }); }, async close() {}, getInfo() { return { usbVendorId: 0x0416, usbProductId: 0x5011 }; } };
  let granted = false;
  Object.defineProperty(navigator, 'serial', { configurable: true, value: { async requestPort() { window.__portRequests++; granted = true; return port; }, async getPorts() { return granted ? [port] : []; } } });
  const ch = { properties: { writeWithoutResponse: true, write: true }, async writeValueWithoutResponse(b) { window.__btWrites.push(b.length); }, async writeValue(b) { window.__btWrites.push(b.length); } };
  const server = { async getPrimaryService(uuid) { if (uuid !== '000018f0-0000-1000-8000-00805f9b34fb') throw new Error('nao'); return { async getCharacteristics() { return [ch]; } }; } };
  const device = { id: 'bt-1', name: 'MPT-II', gatt: { connected: false, async connect() { this.connected = true; return server; } } };
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: { async requestDevice() { return device; }, async getDevices() { return [device]; } } });
  navigator.canShare = () => true;
  navigator.share = async (d) => { const f = d.files[0]; window.__shared.push({ name: f.name, type: f.type, size: f.size }); };
};

async function ownerLogin(page) {
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
}
async function pairingCode(owner) {
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill('Balcão ' + Math.random().toString(36).slice(2, 6));
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  return (await owner.locator('p.num.text-2xl').textContent({ timeout: T })).trim();
}
async function terminalLogin(page, code) {
  await page.goto(BASE + '/terminal');
  await page.getByLabel('Código de emparelhamento').fill(code);
  await page.getByRole('button', { name: 'Emparelhar' }).click();
  await page.getByRole('button', { name: /Carlos/ }).click({ timeout: T });
  await page.getByText('Introduza o seu PIN').waitFor();
  await page.keyboard.type(fx.cashier.pin);
}
const api = (page, method, url, body) => page.evaluate(async ([m, u, b]) => { const r = await fetch(u, { method: m, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => null) }; }, [method, url, body]);

let ownerBrowser; let camBrowser; let camBrowser2;
try {
  ownerBrowser = await chromium.launch();
  const ownerCtx = await ownerBrowser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await ownerLogin(owner);
  const prods = (await api(owner, 'GET', '/api/products')).data;
  const coca = prods.find((p) => p.name.startsWith('Coca-Cola'));
  const heineken = prods.find((p) => p.name.startsWith('Heineken'));
  const setCode = await api(owner, 'PATCH', '/api/products/' + coca.id, { barcode: KNOWN });
  ok(setCode.status === 200, 'Coca-Cola com o EAN-13 ' + KNOWN, setCode.status);
  const dup = await api(owner, 'PATCH', '/api/products/' + heineken.id, { barcode: KNOWN });
  ok(dup.status === 409 && dup.data?.code === 'DUPLICATE_BARCODE' && /Coca-Cola/.test(dup.data.error), 'mesmo código noutro produto: 409 com o nome do produto', JSON.stringify(dup));

  console.log('\n=== Terminal (telemóvel Android, câmara falsa com código conhecido) ===');
  camBrowser = await chromium.launch({ args: camArgs(knownY4m) });
  const android = { ...devices['Pixel 7'], locale: 'pt-PT', permissions: ['camera'], acceptDownloads: true };
  const termCtx = await camBrowser.newContext(android);
  await termCtx.addInitScript(deviceStubs);
  const term = await termCtx.newPage();
  watch(term, 'terminal');
  await terminalLogin(term, await pairingCode(owner));
  const dlg = term.getByRole('dialog', { name: 'Dispositivos' });
  await dlg.waitFor({ timeout: T });
  ok(true, 'depois do PIN pergunta pelos dispositivos');
  ok(await dlg.getByRole('radio', { name: 'Bluetooth' }).isVisible() && await dlg.getByRole('radio', { name: 'Câmara' }).isVisible(), 'Android: oferece Bluetooth e câmara');
  await shot(term, 'd1-dispositivos-android');
  await dlg.getByRole('radio', { name: 'Câmara' }).click();
  await dlg.getByRole('radio', { name: 'Bluetooth' }).click();
  await dlg.getByRole('button', { name: 'Procurar impressora Bluetooth' }).click();
  await dlg.getByText('Impressora «MPT-II» ligada.').waitFor({ timeout: T });
  ok(true, 'impressora Bluetooth ligada (simulada)');
  await dlg.getByRole('button', { name: 'Continuar' }).click();
  await term.getByRole('button', { name: 'Ler com a câmara' }).click({ timeout: T });
  const cam = term.getByRole('dialog', { name: 'Ler código de barras' });
  await cam.getByRole('status').filter({ hasText: /Coca-Cola/ }).waitFor({ timeout: 60000 });
  ok(true, 'câmara leu o código e reconheceu a Coca-Cola');
  await shot(term, 'd2-camara-leu');
  await cam.getByRole('button', { name: 'Concluir' }).click();
  const cobrar = term.getByRole('button', { name: /^Cobrar/ });
  await term.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^Cobrar/.test(b.textContent.trim()) && !b.disabled), null, { timeout: 15000 }).catch(() => {});
  ok(await cobrar.isEnabled(), 'Coca-Cola entrou no carrinho («Cobrar» activo)');
  await cobrar.click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  const sold = await term.evaluate(async () => (await fetch('/api/pos/sales/today', { credentials: 'include' }).then((r) => r.json()).catch(() => null)));
  if (sold) console.log('  (info) vendas de hoje no terminal:', Array.isArray(sold) ? sold.length : Object.keys(sold).join(','));
  const [dl] = await Promise.all([term.waitForEvent('download', { timeout: 60000 }), term.getByRole('button', { name: 'Imprimir recibo' }).click()]);
  ok(/^Recibo_\d+ - .+\.pdf$/.test(dl.suggestedFilename()), 'Android: recibo descarregado em PDF (' + dl.suggestedFilename() + ')');
  await term.waitForFunction(() => window.__btWrites.length > 0, null, { timeout: 30000 }).catch(() => {});
  const bt = await term.evaluate(() => window.__btWrites);
  ok(bt.length > 1 && bt.every((n) => n <= 180), 'Bluetooth: recibo enviado em blocos de ≤ 180 bytes (' + bt.length + ' blocos)', JSON.stringify(bt));
  ok(await term.evaluate(() => window.__shared.length) === 0, 'Android: descarga directa, não a folha de partilha');
  await term.getByRole('button', { name: 'Nova venda' }).click();

  console.log('\n=== Só pergunta uma vez ===');
  await term.getByRole('button', { name: 'Bloquear terminal' }).click();
  await term.getByRole('button', { name: /Carlos/ }).click({ timeout: T });
  await term.getByText('Introduza o seu PIN').waitFor();
  await term.keyboard.type(fx.cashier.pin);
  await term.getByText('Venda actual').waitFor({ timeout: T });
  await term.waitForTimeout(1500);
  ok(await term.getByRole('dialog', { name: 'Dispositivos' }).count() === 0, 'segunda entrada do mesmo caixista: não volta a perguntar');
  await term.getByRole('button', { name: 'Dispositivos' }).click();
  ok(await term.getByRole('dialog', { name: 'Dispositivos' }).isVisible(), 'botão «Dispositivos» abre a escolha outra vez');
  await term.getByRole('button', { name: 'Continuar' }).click();

  console.log('\n=== Formulário do produto: ler com a câmara ===');
  const ownerCam = await camBrowser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'pt-PT', permissions: ['camera'] });
  const op = await ownerCam.newPage();
  watch(op, 'dono-camara');
  await ownerLogin(op);
  await op.goto(BASE + '/app/produtos');
  await op.getByText('Sumol Laranja 330ml').first().click({ timeout: T });
  await op.getByRole('button', { name: 'Ler código com a câmara' }).click({ timeout: T });
  await op.getByLabel('Código de barras').and(op.locator(`[value="${KNOWN}"]`)).waitFor({ timeout: 60000 }).catch(() => {});
  ok(await op.getByLabel('Código de barras').inputValue() === KNOWN, 'código lido pela câmara fica no campo', await op.getByLabel('Código de barras').inputValue());
  await shot(op, 'd3-produto-camara');

  console.log('\n=== Câmara com código que não existe ===');
  camBrowser2 = await chromium.launch({ args: camArgs(unknownY4m) });
  const t2ctx = await camBrowser2.newContext({ ...devices['iPhone 13'], locale: 'pt-PT', permissions: ['camera'] });
  await t2ctx.addInitScript(deviceStubs);
  const t2 = await t2ctx.newPage();
  watch(t2, 'iphone');
  await terminalLogin(t2, await pairingCode(owner));
  const d2 = t2.getByRole('dialog', { name: 'Dispositivos' });
  await d2.waitFor({ timeout: T });
  await d2.getByRole('button', { name: 'Não tenho — saltar' }).click();
  await t2.getByRole('button', { name: 'Ler com a câmara' }).click({ timeout: T });
  await t2.getByRole('dialog', { name: 'Ler código de barras' }).getByRole('status').filter({ hasText: 'Produto não cadastrado' }).waitFor({ timeout: 60000 });
  ok(true, 'código desconhecido: «Produto não cadastrado»');
  await shot(t2, 'd4-nao-cadastrado');
  await t2.getByRole('button', { name: 'Concluir' }).click();
  const w = await t2.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(w[0] <= w[1], 'iPhone: terminal cabe nos 390 px com o botão da câmara', w.join(' > '));

  console.log('\n=== Computador: impressora USB + PDF ===');
  const pcCtx = await ownerBrowser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-PT', acceptDownloads: true });
  await pcCtx.addInitScript(deviceStubs);
  const pc = await pcCtx.newPage();
  watch(pc, 'pc');
  await terminalLogin(pc, await pairingCode(owner));
  const d3 = pc.getByRole('dialog', { name: 'Dispositivos' });
  await d3.waitFor({ timeout: T });
  await d3.getByRole('radio', { name: 'USB' }).click();
  await d3.getByRole('button', { name: 'Ligar impressora USB' }).click();
  await d3.getByText('Impressora USB ligada.', { exact: false }).waitFor({ timeout: T });
  await d3.getByRole('button', { name: 'Continuar' }).click();
  await pc.locator('button[data-tile]', { hasText: 'Coca-Cola 500ml' }).waitFor({ timeout: T });
  await pc.getByLabel('Pesquisar produto').fill(KNOWN);
  await pc.getByLabel('Pesquisar produto').press('Enter');
  await pc.getByRole('status').filter({ hasText: 'Coca-Cola 500ml' }).waitFor({ timeout: T });
  ok(true, 'computador: leitor (teclado) com o mesmo código põe a Coca-Cola na venda');
  const cobrarPc = pc.getByRole('button', { name: /^Cobrar/ });
  await pc.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^Cobrar/.test(b.textContent.trim()) && !b.disabled), null, { timeout: 15000 }).catch(() => {});
  await shot(pc, 'd5a-pc-antes-de-cobrar');
  await cobrarPc.click({ timeout: 15000 });
  await pc.getByText('Venda registada').waitFor({ timeout: T });
  const [dl2] = await Promise.all([pc.waitForEvent('download', { timeout: 60000 }), pc.getByRole('button', { name: 'Imprimir recibo' }).click()]);
  ok(/\.pdf$/.test(dl2.suggestedFilename()), 'computador: PDF descarregado');
  await pc.waitForFunction(() => window.__printed.length > 0, null, { timeout: 30000 }).catch(() => {});
  const printed = (await pc.evaluate(() => window.__printed)).flat();
  const head = printed.slice(0, 2);
  const hasQr = Buffer.from(printed).includes(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
  ok(head[0] === 0x1b && head[1] === 0x40 && hasQr && Buffer.from(printed).toString('latin1').includes('Coca-Cola 500ml'), 'USB: bytes ESC/POS (ESC @, produto, QR)', JSON.stringify(head));
  await pc.getByRole('button', { name: 'Imprimir recibo' }).click();
  await pc.waitForTimeout(1500);
  ok(await pc.evaluate(() => window.__portRequests) === 1, '2.º recibo não volta a pedir a impressora');
  await shot(pc, 'd5-pc-recibo');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  for (const b of [ownerBrowser, camBrowser, camBrowser2]) await b?.close().catch(() => {});
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: dispositivos passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
