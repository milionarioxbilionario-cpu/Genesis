// Teste de browser real do terminal (Genesis 2.1, Fase 2): foto do produto,
// leitor de codigo de barras, atalhos de teclado e M-Pesa/e-Mola separados.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/pos.mjs
// Fixture: node scripts/e2e_fixture.js create <f>
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;

let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
};
// PNG 64x64 verde gerado no proprio browser (sem ficheiros externos).
const makePng = (page) => page.evaluate(() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#047857'; g.fillRect(8, 8, 48, 48);
  return c.toDataURL('image/png').split(',')[1];
});

const browser = await chromium.launch();
try {
  console.log('\n=== Dono: foto do produto ===');
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  await owner.goto(BASE + '/app/produtos');
  await owner.getByText('Coca-Cola 500ml').first().click({ timeout: T });
  await owner.getByRole('button', { name: 'Tirar ou carregar foto' }).waitFor();
  await owner.getByLabel('Foto do produto').setInputFiles({ name: 'coca.png', mimeType: 'image/png', buffer: Buffer.from(await makePng(owner), 'base64') });
  await owner.getByRole('button', { name: 'Trocar foto' }).waitFor({ timeout: 10000 });
  ok(true, 'foto escolhida e reduzida no browser');
  await shot(owner, 'p1-produto-foto');
  await owner.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Produto actualizado.').waitFor({ timeout: T });
  const prods = await owner.evaluate(async () => (await fetch('/api/products', { credentials: 'include' })).json());
  const coca = prods.find((p) => p.name === 'Coca-Cola 500ml');
  ok(coca && /^data:image\/(webp|jpeg);base64,/.test(coca.image_url) && coca.image_url.length < 60000, 'foto gravada no produto (data:image, < 60 000 car.)', coca && coca.image_url?.slice(0, 30) + ' ' + coca.image_url?.length);

  // Terminal.
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill('Balcão');
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  const code = (await owner.locator('p.num.text-2xl').textContent({ timeout: T })).trim();

  console.log('\n=== Terminal ===');
  const termCtx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-PT' });
  const term = await termCtx.newPage();
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: /Carlos/ }).click({ timeout: T });
  await term.getByText('Introduza o seu PIN').waitFor();
  await term.keyboard.type(fx.cashier.pin);
  await term.getByText('Venda actual').waitFor({ timeout: T });
  await term.getByText('Laurentina Preta 550ml').first().waitFor({ timeout: T });

  const cocaTile = term.locator('button[data-tile]', { hasText: 'Coca-Cola 500ml' });
  ok(await cocaTile.locator('img').count() === 1, 'cartao com foto mostra a imagem');
  const beerTile = term.locator('button[data-tile]', { hasText: 'Heineken 330ml' });
  ok(await beerTile.locator('img').count() === 0 && await beerTile.locator('svg').count() === 1, 'cartao sem foto mostra o icone da categoria');
  const pay = ['Dinheiro', 'M-Pesa', 'e-Mola', 'Cartão'];
  for (const p of pay) ok(await term.getByRole('radio', { name: p, exact: true }).count() === 1, 'forma de pagamento visivel: ' + p);

  // Leitor: codigo conhecido.
  const search = term.getByLabel('Pesquisar produto');
  await search.fill('6001234000017');
  await search.press('Enter');
  const strip = term.getByRole('status');
  await strip.waitFor({ timeout: 5000 });
  ok(/6001234000017/.test(await strip.textContent()) && /2M 340ml/.test(await strip.textContent()), 'faixa do leitor mostra o codigo lido e o produto', await strip.textContent());
  await shot(term, 'p2-pos-leitura');
  // Leitor: codigo desconhecido.
  await search.fill('6009999999999');
  await search.press('Enter');
  await term.getByText('Este código não existe no catálogo').waitFor({ timeout: 5000 });
  ok(true, 'codigo desconhecido: aviso em vez de silencio');
  await shot(term, 'p3-pos-codigo-desconhecido');

  // Atalhos.
  await term.keyboard.press('F4');
  ok(await term.getByRole('radio', { name: 'M-Pesa', exact: true }).getAttribute('aria-checked') === 'true', 'F4: Dinheiro -> M-Pesa');
  await term.keyboard.press('F4');
  ok(await term.getByRole('radio', { name: 'e-Mola', exact: true }).getAttribute('aria-checked') === 'true', 'F4: M-Pesa -> e-Mola');
  await term.keyboard.press('F2');
  await term.waitForFunction(() => document.activeElement?.id === 'pos-discount', null, { timeout: 5000 });
  ok(true, 'F2: foco no desconto');
  await term.keyboard.press('Escape');
  ok(await term.evaluate(() => document.activeElement?.getAttribute('aria-label')) === 'Pesquisar produto', 'Esc: volta a pesquisa');
  await term.keyboard.press('Alt+2');
  const activeCat = await term.locator('button.bg-ink').first().textContent();
  ok(activeCat && activeCat !== 'Todas', 'Alt+2: muda de categoria', activeCat);
  await term.keyboard.press('Alt+1');
  // Setas: da pesquisa para a grelha; Enter adiciona.
  await search.focus();
  await term.keyboard.press('ArrowDown');
  ok(await term.evaluate(() => document.activeElement?.hasAttribute('data-tile')), 'Seta para baixo: entra na grelha');
  await term.keyboard.press('ArrowRight');
  const second = await term.evaluate(() => document.activeElement?.textContent);
  await term.keyboard.press('Enter');
  ok(second && await term.locator('aside').getByText(second.split(/\d/)[0].trim().slice(0, 12)).count() > 0, 'Seta + Enter adiciona o produto ao cesto', second);

  // Ctrl+Enter cobra com e-Mola.
  await term.keyboard.press('Control+Enter');
  await term.getByText('Venda registada').waitFor({ timeout: T });
  ok(true, 'Ctrl+Enter: venda cobrada');
  await shot(term, 'p4-pos-recibo-emola');
  await term.getByRole('button', { name: 'Nova venda' }).click();
  await shot(term, 'p5-pos');

  // F3 volta a dinheiro e foca o recebido.
  await term.locator('button[data-tile]', { hasText: 'Sumol Laranja 330ml' }).click();
  await term.keyboard.press('F4');
  await term.keyboard.press('F3');
  await term.waitForFunction(() => document.activeElement?.id === 'pos-received', null, { timeout: 5000 });
  ok(await term.getByRole('radio', { name: 'Dinheiro', exact: true }).getAttribute('aria-checked') === 'true', 'F3: volta a Dinheiro e foca o valor recebido');
  await term.keyboard.type('50');
  await term.keyboard.press('Control+Enter');
  await term.getByText('Venda registada').waitFor({ timeout: T });
  await term.getByRole('button', { name: 'Nova venda' }).click();

  console.log('\n=== Dono: vendas por forma de pagamento ===');
  const emola = await owner.evaluate(async () => (await fetch('/api/owner/sales?method=emola', { credentials: 'include' })).json());
  const rows = emola.sales || emola.rows || emola.items || emola;
  ok(Array.isArray(rows) && rows.length === 1 && rows[0].payment_method === 'emola', 'venda gravada como emola (nao mobile_money)', JSON.stringify(rows).slice(0, 120));
  await owner.goto(BASE + '/app/relatorios');
  await owner.getByText('Por forma de pagamento').waitFor({ timeout: T });
  ok(await owner.getByText('e-Mola', { exact: true }).count() > 0 && await owner.getByText('M-Pesa', { exact: true }).count() > 0, 'relatorio diario separa M-Pesa e e-Mola');
  await shot(owner, 'p6-relatorio-pagamentos');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: terminal (fase 2) passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
