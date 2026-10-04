// Teste de browser real (Chromium/Playwright) dos fluxos principais.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/flows.mjs
// A fixture e criada por backend/scripts/e2e_fixture.js. Grava capturas de
// ecra (desktop 1440 e telemovel 390) para revisao visual.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000; // a BD de desenvolvimento esta a ~1-3 s por query

let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra ? '  -> ' + extra : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}

const browser = await chromium.launch();
try {
  // ------------------------------------------------------------- dono
  console.log('\n=== Painel do dono ===');
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByRole('heading', { name: 'Entrar' }).waitFor();
  await shot(owner, '01-entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  await owner.getByText('Receita de hoje').waitFor({ timeout: T });
  await owner.getByText('Bottle Store Central').first().waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  ok(true, 'login do dono -> Inicio');
  await shot(owner, '02-inicio');

  const pages = [
    ['/app/vendas', 'Histórico de todas as vendas', '03-vendas'],
    ['/app/produtos', 'Laurentina Preta 550ml', '04-produtos'],
    ['/app/produtos?tab=stock', 'A repor', '05-stock'],
    ['/app/fornecedores', 'Fornecedores', '06-fornecedores'],
    ['/app/chenecas', 'Sr. Mabunda', '07-chenecas'],
    ['/app/equipa', 'Carlos', '08-equipa'],
    ['/app/relatorios', 'Por forma de pagamento', '09-relatorio-diario'],
    ['/app/definicoes?tab=costs', 'Renda do contentor', '11-custos-fixos'],
    ['/app/definicoes?tab=discounts', 'PIN de autorização', '12-descontos'],
  ];
  for (const [url, text, name] of pages) {
    await owner.goto(BASE + url);
    await owner.getByText(text).first().waitFor({ timeout: T });
    await owner.waitForLoadState('networkidle', { timeout: T });
    ok(true, 'abre ' + url);
    await shot(owner, name);
  }
  await owner.goto(BASE + '/app/relatorios');
  await owner.getByRole('tab', { name: 'Mensal' }).click();
  await owner.getByText('Do que entrou ao que ficou').waitFor({ timeout: T });
  await owner.waitForLoadState('networkidle', { timeout: T });
  ok(await owner.getByText('Renda', { exact: true }).isVisible(), 'relatorio mensal mostra a renda na cascata');
  await shot(owner, '10-relatorio-mensal');

  // Emparelhar um terminal: o dono gera o codigo.
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill('Balcão principal');
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  const codeEl = owner.locator('p.num.text-2xl');
  await codeEl.waitFor({ timeout: T });
  const code = (await codeEl.textContent()).trim();
  ok(/^\d{6}$/.test(code), 'codigo de emparelhamento gerado', code);
  await shot(owner, '13-codigo-terminal');

  // ------------------------------------------------------------- terminal
  console.log('\n=== Terminal POS ===');
  const termCtx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-PT' });
  const term = await termCtx.newPage();
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByText('Emparelhar este terminal').waitFor({ timeout: T });
  await shot(term, '20-terminal-emparelhar');
  await term.getByLabel('Código de emparelhamento').fill(code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByText('Quem está a vender?').waitFor({ timeout: T });
  ok(true, 'terminal emparelhado -> perfis');
  await shot(term, '21-terminal-perfis');
  await term.getByRole('button', { name: /Carlos/ }).click();
  await term.getByText('Introduza o seu PIN').waitFor();
  await shot(term, '22-terminal-pin');
  await term.keyboard.type('2468');
  await term.getByText('Venda actual').waitFor({ timeout: T });
  await term.getByText('Laurentina Preta 550ml').first().waitFor({ timeout: T });
  ok(true, 'PIN -> ecra de vendas');

  // Leitor de codigo de barras: escreve o codigo e Enter.
  const search = term.getByLabel('Pesquisar produto');
  await search.fill('6001234000017');
  await search.press('Enter');
  await term.getByRole('button', { name: /Coca-Cola 500ml/ }).click();
  ok(await term.getByRole('button', { name: /Cobrar 105,00 MT/ }).isVisible(), 'cesto: 2M + Coca-Cola = 105,00 MT');
  await shot(term, '23-pos-cesto');
  await term.getByRole('button', { name: /Cobrar/ }).click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  ok(true, 'venda registada no servidor');
  await shot(term, '24-pos-recibo');
  await term.getByRole('button', { name: 'Nova venda' }).click();

  // Desconto acima do limite (10%): pede o PIN do dono.
  await term.getByRole('button', { name: /Laurentina Preta 550ml/ }).click();
  await term.getByRole('button', { name: 'Aplicar desconto' }).click();
  await term.getByLabel('Desconto').fill('20');
  await term.getByRole('button', { name: /Cobrar 75,00 MT/ }).click();
  await term.getByText('Autorizar desconto').waitFor({ timeout: T });
  ok(true, 'desconto de 21% pede o PIN de autorizacao');
  await shot(term, '25-pos-autorizar-desconto');
  await term.getByLabel('PIN do dono').fill(fx.authPin);
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  ok(true, 'PIN certo: venda com desconto registada');
  await term.getByRole('button', { name: 'Nova venda' }).click();

  // Sem rede: a venda fica no terminal e sincroniza ao voltar.
  await termCtx.setOffline(true);
  await term.getByRole('button', { name: /Sumol Laranja 330ml/ }).click();
  await term.getByRole('button', { name: /Cobrar 35,00 MT/ }).click();
  await term.getByText('Sem ligação: venda guardada neste terminal').waitFor({ timeout: T });
  await term.getByText('1 por enviar').waitFor({ timeout: T });
  ok(true, 'offline: venda guardada no terminal (1 por enviar)');
  await shot(term, '26-pos-offline');
  await termCtx.setOffline(false);
  await term.getByText('1 por enviar').waitFor({ state: 'detached', timeout: T });
  ok(true, 'rede de volta: venda offline sincronizada');

  // O caixista nao chega ao painel do dono.
  await term.goto(BASE + '/app');
  await term.waitForURL('**/terminal', { timeout: T });
  ok(true, '/app na sessao do caixista -> volta ao terminal');
  await term.getByText('Venda actual').waitFor({ timeout: T });

  // Fecho de turno (cego).
  await term.getByRole('button', { name: 'Fechar turno' }).click();
  await term.getByLabel('Dinheiro contado na gaveta').fill('10');
  await term.getByRole('button', { name: 'Confirmar contagem' }).click();
  await term.getByText(/menor do que o dinheiro/).waitFor({ timeout: T });
  ok(true, 'fecho cego: contagem abaixo do esperado e recusada');
  await shot(term, '27-pos-fecho-cego');
  await term.keyboard.press('Escape');

  // ------------------------------------------------------------- telemovel
  console.log('\n=== Telemovel (390 px) ===');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-PT', storageState: await ownerCtx.storageState() });
  const m = await mobile.newPage();
  watch(m, 'telemovel');
  await m.goto(BASE + '/app');
  await m.getByText('Receita de hoje').waitFor({ timeout: T });
  await m.waitForLoadState('networkidle', { timeout: T });
  await shot(m, '30-mobile-inicio');
  await m.getByRole('button', { name: 'Abrir menu' }).click();
  await shot(m, '31-mobile-menu');
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(!overflow, 'telemovel: sem deslocamento horizontal da pagina');
  const mt = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-PT', storageState: await termCtx.storageState() });
  const mp = await mt.newPage();
  await mp.goto(BASE + '/terminal');
  await mp.getByText('Venda actual').waitFor({ timeout: T });
  await shot(mp, '32-mobile-pos');

  console.log('\n=== Vendas no painel do dono ===');
  await owner.goto(BASE + '/app/vendas');
  await owner.getByText('Carlos').first().waitFor({ timeout: T });
  const rows = await owner.locator('tbody tr').count();
  ok(rows >= 3, 'dono ve as vendas do terminal no historico (' + rows + ')');
  await shot(owner, '14-vendas-com-dados');
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: todos os fluxos passaram' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
