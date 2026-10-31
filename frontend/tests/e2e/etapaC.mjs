// Etapa C num browser real (Chromium com WebGL por software):
//  dono marca o ponto do estabelecimento com um link do Google Maps -> vê a
//  pré-visualização -> uma venda no terminal aparece-lhe como aviso no painel ->
//  o admin abre o «Mapa ao vivo» (globo 3D Mapbox), vê o pino e a bolha +MT.
//   BASE=http://localhost:5180 ADMIN=http://localhost:5175 FIXTURE=f.json ADMIN_FIXTURE=a.json SHOTS=pasta node tests/e2e/etapaC.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const ADMIN = process.env.ADMIN || 'http://localhost:5175';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const ax = JSON.parse(fs.readFileSync(process.env.ADMIN_FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;

let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|GSI_LOGGER|WebGL|GPU stall|Mapbox/i.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}
async function unlockIfNeeded(p) {
  const h = p.getByRole('heading', { name: 'Painel bloqueado' });
  await h.waitFor({ timeout: 4000 }).catch(() => {});
  if (await h.isVisible().catch(() => false)) { await p.keyboard.type(fx.lockPin); await h.waitFor({ state: 'detached', timeout: 60000 }); }
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  console.log('\n=== Dono: localização ===');
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  await unlockIfNeeded(owner);
  await owner.goto(BASE + '/app/definicoes');
  await unlockIfNeeded(owner);
  await owner.getByText('Onde fica o estabelecimento?').waitFor({ timeout: T });
  ok(await owner.getByText('Ainda sem ponto no mapa.').isVisible(), 'sem ponto: o cartão diz que falta e que pode configurar mais tarde');
  await owner.getByLabel('Ou cole um link do Google Maps').fill('https://www.google.com/maps/place/Polana/@-25.9692,32.5995,17z/data=!3m1!4b1!8m2!3d-25.969512!4d32.601144');
  await owner.getByRole('button', { name: 'Usar', exact: true }).click();
  await owner.getByText('-25.96951, 32.60114').waitFor({ timeout: T });
  // 31/10: o ponto so se grava depois de confirmar (antes gravava logo).
  await owner.getByRole('button', { name: 'Guardar este ponto' }).click();
  await owner.getByText('guardado', { exact: true }).waitFor({ timeout: T });
  const img = owner.getByAltText('Mapa com o ponto do estabelecimento');
  await img.waitFor({ timeout: T });
  const loaded = await img.evaluate((el) => new Promise((r) => (el.complete ? r(el.naturalWidth) : el.addEventListener('load', () => r(el.naturalWidth)))));
  ok(loaded > 0, 'link do Google Maps -> ponto guardado e mapa de pré-visualização (Mapbox) carregado', loaded);
  await owner.locator('text=Onde fica o estabelecimento?').scrollIntoViewIfNeeded();
  await shot(owner, 'C-01-localizacao');

  console.log('\n=== Venda -> aviso no painel ===');
  // A venda so depois de o canal ao vivo estar ligado (senao o aviso perde-se).
  const liveOpen = owner.waitForResponse((r) => r.url().includes('/api/owner/live') && r.status() === 200, { timeout: T });
  await owner.goto(BASE + '/app');
  await owner.getByText('Hoje até agora').first().waitFor({ timeout: T });
  await liveOpen;
  await owner.waitForTimeout(1500);
  const sale = await owner.evaluate(async () => {
    const list = await (await fetch('/api/products', { credentials: 'same-origin' })).json();
    const p = list.find((x) => x.name === 'Coca-Cola 500ml');
    const r = await fetch('/api/sales', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: crypto.randomUUID(), items: [{ product_id: p.id, quantity: 1, unit_sell_price: p.sell_price, unit_cost_price: 0 }], total_amount: p.sell_price, payment_method: 'cash', amount_received: p.sell_price }) });
    return r.status;
  });
  ok(sale === 201, 'venda registada (pelo próprio dono, para o teste)', sale);
  await owner.getByText(/Venda n\.º \d+: 45,00\s?MT · lucro 17,00\s?MT/).waitFor({ timeout: 30000 });
  ok(true, 'aviso ao vivo no painel: «Venda n.º …: 45,00 MT · lucro 17,00 MT»');
  await shot(owner, 'C-02-aviso-venda');

  console.log('\n=== Admin: mapa ao vivo ===');
  const admCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const adm = await admCtx.newPage();
  watch(adm, 'admin');
  await adm.goto(ADMIN + '/entrar');
  await adm.getByLabel('Email').fill(ax.admin.email);
  await adm.getByLabel('Senha').fill(ax.admin.password);
  await adm.getByRole('button', { name: 'Entrar' }).click();
  const admLive = adm.waitForResponse((r) => r.url().includes('/api/admin/live') && r.status() === 200, { timeout: T });
  await adm.getByRole('link', { name: 'Mapa ao vivo' }).click();
  await admLive;
  await adm.getByRole('heading', { name: 'Mapa ao vivo' }).waitFor({ timeout: T });
  await adm.locator('canvas.mapboxgl-canvas').waitFor({ timeout: T });
  await adm.waitForTimeout(3000);
  const canvasBox = await adm.locator('canvas.mapboxgl-canvas').boundingBox();
  ok(canvasBox && canvasBox.height > 400 && canvasBox.width > 500, 'mapa 3D (Mapbox GL) abre no painel do admin, com o tamanho todo', canvasBox);
  await adm.locator('.genesis-pin').first().waitFor({ timeout: T });
  ok(await adm.locator('.genesis-pin').count() >= 1, 'pino do estabelecimento no mapa');
  await adm.waitForTimeout(2500);
  await owner.evaluate(async () => {
    const list = await (await fetch('/api/products', { credentials: 'same-origin' })).json();
    const p = list.find((x) => x.name === 'Coca-Cola 500ml');
    await fetch('/api/sales', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: crypto.randomUUID(), items: [{ product_id: p.id, quantity: 2, unit_sell_price: p.sell_price, unit_cost_price: 0 }], total_amount: 2 * p.sell_price, payment_method: 'cash', amount_received: 2 * p.sell_price }) });
  });
  await adm.getByText(/\+90,00\s?MT/).first().waitFor({ timeout: 30000 });
  ok(true, 'venda ao vivo no admin: «+90,00 MT» (lista «Agora» e bolha no pino)');
  await shot(adm, 'C-03-mapa-ao-vivo');
  await adm.getByRole('button', { name: 'Satélite' }).click();
  await adm.waitForTimeout(6000);
  await shot(adm, 'C-04-mapa-satelite');
  ok(await adm.locator('.genesis-pin').count() >= 1, 'satélite: o pino continua no mapa');
} finally {
  await browser.close();
}
if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log('\n' + (failures === 0 && errors.length === 0 ? 'RESULTADO: tudo OK' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`));
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
