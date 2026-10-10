// Fase 8.1 (teste do fundador no iPhone, 10/10/2026): ranking por niveis,
// PDF dos relatorios e recibo sem janela nova.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/fase8_1.mjs
//
// Telemovel/tablet: o Chromium emula toque (pointer: coarse) e a partilha do
// sistema e substituida por um registo (window.__shared) — o iPhone real abre a
// folha de partilha nesse ponto.
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
// Captura de pagina inteira desfaz por momentos a emulacao de toque do
// Playwright (o recibo seguia depois o caminho do computador): no telemovel
// so se captura o ecra visivel.
const shot = (page, name, fullPage = true) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage });
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
};
const shareStub = () => {
  window.__shared = [];
  navigator.canShare = (d) => Boolean(d && d.files && d.files.length);
  navigator.share = async (d) => {
    const f = d.files[0];
    const head = new TextDecoder().decode(new Uint8Array(await f.slice(0, 5).arrayBuffer()));
    window.__shared.push({ name: f.name, type: f.type, size: f.size, head });
  };
};
const RECIBO = /^Recibo_\d{3} - Bottle Store Central \(\d{2}-\d{2}-\d{4} - \d{2}-\d{2}-\d{2}\)\.pdf$/;
const pdfAscii = (buf) => buf.toString('latin1');

const browser = await chromium.launch();
try {
  // ---------------------------------------------------------------- dono (PC)
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT', acceptDownloads: true });
  let ownerPopups = 0;
  ownerCtx.on('page', () => { ownerPopups++; });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  ownerPopups = 0;

  // ------------------------------------------------- terminal (tablet de toque)
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill('Balcão');
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  const code = (await owner.locator('p.num.text-2xl').textContent({ timeout: T })).trim();
  const termCtx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: 'pt-PT' });
  await termCtx.addInitScript(shareStub);
  let termPopups = 0;
  termCtx.on('page', () => { termPopups++; });
  const term = await termCtx.newPage();
  termPopups = 0;
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: /Carlos/ }).click({ timeout: T });
  await term.getByText('Introduza o seu PIN').waitFor();
  await term.keyboard.type(fx.cashier.pin);
  await term.getByText('Venda actual').waitFor({ timeout: T });
  ok(await term.evaluate(() => matchMedia('(pointer: coarse)').matches), 'terminal emulado como ecrã de toque');

  console.log('\n=== Venda: 3 × 2M, 2 × Coca-Cola, 1 × Heineken, 1 × Sumol ===');
  const tile = (name) => term.locator('button[data-tile]', { hasText: name });
  for (let i = 0; i < 3; i++) await tile('2M 340ml').click({ timeout: T });
  for (let i = 0; i < 2; i++) await tile('Coca-Cola 500ml').click();
  await tile('Heineken 330ml').click();
  await tile('Sumol Laranja 330ml').click();
  await term.keyboard.press('Control+Enter');
  await term.getByText('Venda registada').waitFor({ timeout: T });

  console.log('\n=== Recibo no telemóvel/tablet: PDF pela partilha, sem janela nova ===');
  await term.getByRole('button', { name: 'Imprimir recibo' }).click();
  await term.waitForFunction(() => window.__shared.length > 0, null, { timeout: 30000 }).catch(() => {});
  const shared = await term.evaluate(() => window.__shared);
  ok(shared.length === 1 && shared[0].type === 'application/pdf' && shared[0].head === '%PDF-' && shared[0].size > 2000, 'recibo partilhado como PDF', JSON.stringify(shared));
  ok(shared[0] && RECIBO.test(shared[0].name), 'nome do ficheiro: Recibo_<n> - <Loja> (DD-MM-AAAA - HH-MM-SS).pdf', shared[0]?.name);
  ok(termPopups === 0, 'nenhuma janela nova aberta (antes prendia o utilizador)', termPopups);
  await shot(term, '81-recibo-tablet', false);
  await term.getByRole('button', { name: 'Nova venda' }).click();
  ok(await term.getByText('Venda registada').count() === 0, '"Nova venda" volta ao ecrã de venda');

  console.log('\n=== Ranking por níveis (relatório diário) ===');
  await owner.goto(BASE + '/app/relatorios');
  await owner.getByRole('heading', { name: 'Rastreio' }).waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  const api = await owner.evaluate(async () => (await fetch('/api/owner/reports/daily?date=' + new Date().toLocaleDateString('sv-SE'), { credentials: 'include' })).json());
  const apiSold = api.top_products.map((p) => `${p.rank}:${p.name}`);
  const apiProfit = api.top_profitable.map((p) => `${p.rank}:${p.name}`);
  ok(JSON.stringify(apiSold) === JSON.stringify(['1:2M 340ml', '2:Coca-Cola 500ml']), 'API mais vendidos: 3 e 2 (os de 1 unidade ficam de fora)', JSON.stringify(apiSold));
  ok(JSON.stringify(apiProfit) === JSON.stringify(['1:2M 340ml', '2:Coca-Cola 500ml', '3:Heineken 330ml']), 'API mais rentáveis: lucros 66, 34, 30 MT (Sumol, 15 MT, fica de fora)', JSON.stringify(apiProfit));
  const card = (title) => owner.locator('div.rounded-lg, section, div').filter({ has: owner.getByText(title, { exact: true }) }).filter({ has: owner.locator('table') }).last();
  const soldRows = await card('Mais vendidos').locator('tbody tr').allTextContents();
  const profitRows = await card('Mais rentáveis').locator('tbody tr').allTextContents();
  ok(soldRows.length === 2 && /^1\.º2M 340ml3/.test(soldRows[0]) && /^2\.ºCoca-Cola 500ml2/.test(soldRows[1]), 'ecrã: "Mais vendidos" com 1.º e 2.º', JSON.stringify(soldRows));
  ok(profitRows.length === 3 && !profitRows.join('').includes('Sumol'), 'ecrã: "Mais rentáveis" com 3 lugares e sem Sumol', JSON.stringify(profitRows));
  await shot(owner, '82-ranking');

  console.log('\n=== PDF dos relatórios no computador (descarga) ===');
  const today = new Date();
  const dmy = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  for (const [tab, label, nameRe, mustHave] of [
    ['Diário', 'diário', new RegExp(`^Relatório diário - Bottle Store Central \\(${dmy}\\)\\.pdf$`), ['Mais vendidos', 'Rastreio', '2M 340ml', 'Fechos de turno']],
    ['Semanal', 'semanal', /^Relatório semanal - Bottle Store Central \(\d{2}-\d{2}-\d{4} a \d{2}-\d{2}-\d{4}\)\.pdf$/, ['Dia a dia', 'O que comprar para a', 'Rastreio']],
    ['Mensal', 'mensal', /^Relatório mensal - Bottle Store Central \([A-Za-zçÇ]+ \d{4}\)\.pdf$/, ['Do que entrou ao que ficou', 'Semanas do m', 'Chenecas']],
  ]) {
    await owner.getByRole('tab', { name: tab }).click();
    const btn = owner.getByRole('button', { name: 'PDF / imprimir' });
    await owner.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('PDF / imprimir')); return b && !b.disabled; }, null, { timeout: T });
    const [dl] = await Promise.all([owner.waitForEvent('download', { timeout: 60000 }), btn.click()]);
    const file = path.join(SHOTS, `8-${label}.pdf`);
    await dl.saveAs(file);
    const buf = fs.readFileSync(file);
    const txt = pdfAscii(buf);
    ok(nameRe.test(dl.suggestedFilename()), `${label}: nome do ficheiro`, dl.suggestedFilename());
    ok(txt.startsWith('%PDF-') && buf.length > 3000, `${label}: é um PDF (${buf.length} bytes)`);
    const missing = mustHave.filter((s) => !txt.includes(s));
    ok(missing.length === 0, `${label}: contém ${mustHave.join(', ')}`, missing.join(' | '));
    ok(!txt.includes('−') && !/Ã|â€/.test(txt), `${label}: sem caracteres partidos`);
  }
  ok(ownerPopups === 0, 'dono (PC): nenhuma janela nova aberta', ownerPopups);

  console.log('\n=== Reimprimir recibo no computador: imprime na própria página ===');
  await owner.getByRole('tab', { name: 'Diário' }).click();
  await owner.locator('tbody tr', { hasText: 'Venda n.º' }).first().click({ timeout: T });
  await owner.getByRole('button', { name: 'Reimprimir recibo' }).click({ timeout: 10000 });
  const framed = await owner.waitForFunction(() => document.querySelector('iframe[aria-hidden="true"]'), null, { timeout: 10000 }).then(() => true).catch(() => false);
  ok(framed, 'recibo vai para uma moldura escondida (sem window.open)');
  ok(ownerPopups === 0, 'nenhuma janela nova aberta', ownerPopups);
  await owner.keyboard.press('Escape');

  console.log('\n=== Dono no iPhone (390 px, toque) ===');
  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  await phoneCtx.addInitScript(shareStub);
  let phonePopups = 0;
  phoneCtx.on('page', () => { phonePopups++; });
  const phone = await phoneCtx.newPage();
  phonePopups = 0;
  watch(phone, 'iphone');
  await phone.goto(BASE + '/entrar');
  await phone.getByLabel('Email').fill(fx.owner.email);
  await phone.getByLabel('Senha').fill(fx.owner.password);
  await phone.getByRole('button', { name: 'Entrar' }).click();
  await phone.waitForURL('**/app', { timeout: T });
  phonePopups = 0;
  await phone.goto(BASE + '/app/relatorios');
  await phone.getByRole('heading', { name: 'Rastreio' }).waitFor({ timeout: T });
  await phone.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('PDF / imprimir')); return b && !b.disabled; }, null, { timeout: T });
  for (const tab of ['Diário', 'Semanal', 'Mensal']) {
    await phone.getByRole('tab', { name: tab }).click();
    await phone.waitForLoadState('networkidle', { timeout: T });
    const w = await phone.evaluate(() => [document.documentElement.scrollWidth, window.visualViewport.width]);
    ok(w[0] <= w[1], `iPhone: ${tab} cabe nos ${w[1]} px (sem página mais larga que o ecrã)`, w.join(' > '));
  }
  await phone.getByRole('tab', { name: 'Diário' }).click();
  await phone.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('PDF / imprimir')); return b && !b.disabled; }, null, { timeout: T });
  await phone.getByRole('button', { name: 'PDF / imprimir' }).click();
  await phone.waitForFunction(() => window.__shared.length > 0, null, { timeout: 60000 }).catch(() => {});
  let ps = await phone.evaluate(() => window.__shared);
  ok(ps.length === 1 && ps[0].head === '%PDF-' && /^Relatório diário - Bottle Store Central/.test(ps[0].name), 'iPhone: relatório diário vai para a folha de partilha', JSON.stringify(ps));
  await shot(phone, '83-iphone-relatorio', false);
  await phone.locator('tbody tr', { hasText: 'Venda n.º' }).first().click({ timeout: T });
  await phone.getByRole('button', { name: 'Reimprimir recibo' }).click({ timeout: 10000 }).catch(async (e) => { await shot(phone, '84-falha-reimprimir', false); console.log('DIAG', JSON.stringify(await phone.evaluate(() => { const btn=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Reimprimir')); const r=btn.getBoundingClientRect(); const el=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return { r:[r.left,r.top,r.width,r.height], vw: innerWidth, vh: innerHeight, vv: visualViewport && [visualViewport.width, visualViewport.height, visualViewport.offsetTop, visualViewport.scale], sy: scrollY, at: el && (el.tagName+'.'+el.className).slice(0,80) }; }))); throw e; });
  await phone.waitForFunction(() => window.__shared.length > 1, null, { timeout: 30000 }).catch(() => {});
  ps = await phone.evaluate(() => window.__shared);
  ok(ps.length === 2 && RECIBO.test(ps[1].name) && ps[1].head === '%PDF-', 'iPhone: reimprimir recibo vai para a folha de partilha', JSON.stringify(ps) + ' url=' + phone.url() + ' pdfPronto=' + (await phone.getByText('PDF pronto').count()));
  ok(phonePopups === 0, 'iPhone: nenhuma janela nova aberta', phonePopups);
  const inView = await phone.evaluate(() => { const r = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Reimprimir')).getBoundingClientRect(); const v = window.visualViewport; return r.bottom <= v.height && r.right <= v.width; });
  ok(inView, 'iPhone: botões do recibo dentro do ecrã visível');
  ok(await phone.getByRole('button', { name: 'Reimprimir recibo' }).isVisible(), 'iPhone: continua no recibo, com saída (fechar)');
  await shot(phone, '84-iphone-recibo', false);
} finally {
  await browser.close();
}

if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log(`\n${failures === 0 && errors.length === 0 ? 'TODOS OS PASSOS PASSARAM' : `FALHAS: ${failures}, erros JS: ${errors.length}`}`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
