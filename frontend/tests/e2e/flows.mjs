// Teste de browser real (Chromium/Playwright) dos fluxos principais.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/flows.mjs
// A fixture e criada por backend/scripts/e2e_fixture.js. Grava capturas de
// ecra (desktop 1440 e telemovel 390) para revisao visual.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import QRCode from 'qrcode';

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
  const saleResp = term.waitForResponse((r) => r.url().endsWith('/api/sales') && r.request().method() === 'POST', { timeout: T });
  await term.getByRole('button', { name: /Cobrar/ }).click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  ok(true, 'venda registada no servidor');
  await shot(term, '24-pos-recibo');

  // QR do recibo (Fase 7.2): aponta para /verify/<id> desta app e a pagina
  // publica, sem sessao, confirma a venda.
  const saleId = (await saleResp).request().postDataJSON().id;
  const qrImg = term.getByAltText('QR de verificação da venda');
  await qrImg.waitFor({ timeout: T });
  const qrSrc = await qrImg.getAttribute('src');
  const expectedQr = await QRCode.toDataURL(BASE + '/verify/' + saleId, { width: 120, margin: 1 });
  // O PNG do browser (canvas) e o do Node tem bytes diferentes: compara pixels.
  const samePixels = (x, y) => term.evaluate(async ([a, b]) => {
    const px = async (src) => { const i = new Image(); i.src = src; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data; };
    const [x, y] = await Promise.all([px(a), px(b)]);
    return x.length === y.length && x.every((v, k) => v === y[k]);
  }, [x, y]);
  const oldDomainQr = await QRCode.toDataURL('https://genesis.co.mz/verify/' + saleId, { width: 120, margin: 1 });
  ok(!(await samePixels(qrSrc, oldDomainQr)), 'contraprova: o QR ja nao e o do dominio antigo');
  ok(await samePixels(qrSrc, expectedQr), 'QR do recibo = ' + BASE + '/verify/<id da venda>');
  const anonCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-PT' });
  const anon = await anonCtx.newPage();
  watch(anon, 'verificar');
  await anon.goto(BASE + '/verify/' + saleId);
  await anon.getByText('Recibo autêntico').waitFor({ timeout: T });
  ok(await anon.getByText('105,00').first().isVisible() && await anon.getByText(/2M 340ml/).isVisible() && await anon.getByText(/Coca-Cola 500ml/).isVisible(), 'pagina /verify sem sessao: recibo autentico, artigos e total 105,00');
  await shot(anon, '24b-verificar-recibo');
  await anon.goto(BASE + '/verify/00000000-0000-4000-8000-000000000000');
  await anon.getByText('Recibo não encontrado').waitFor({ timeout: T });
  ok(true, 'codigo inexistente: "Recibo nao encontrado"');
  await anonCtx.close();
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

  // Lista de vendas: so abre com o PIN do dono.
  await term.getByRole('button', { name: 'Vendas', exact: true }).click();
  await term.getByText('A lista de vendas só abre com o PIN').waitFor({ timeout: T });
  ok(!(await term.getByText('As minhas últimas vendas').isVisible()), 'Vendas: pede o PIN do dono antes de mostrar a lista');
  await term.getByLabel('PIN do dono').fill('0000');
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText(/PIN do dono incorrecto/).waitFor({ timeout: T });
  ok(!(await term.getByText('As minhas últimas vendas').isVisible()), 'PIN errado: a lista continua fechada');
  await term.getByLabel('PIN do dono').fill(fx.authPin);
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText('As minhas últimas vendas').waitFor({ timeout: T });
  ok(true, 'PIN certo: lista de vendas aberta');
  await shot(term, '28-pos-vendas-pin');
  await term.keyboard.press('Escape');

  // Venda offline ainda por enviar: o fecho NAO conta (o servidor nao a tem e
  // o turno seguinte daria um falso 'abaixo do esperado').
  await termCtx.setOffline(true);
  await term.getByRole('button', { name: /Sumol Laranja 330ml/ }).click();
  await term.getByRole('button', { name: /Cobrar 35,00 MT/ }).click();
  await term.getByText('1 por enviar').waitFor({ timeout: T });
  await term.getByRole('button', { name: 'Fechar turno' }).click();
  await term.getByLabel('Dinheiro contado na gaveta').fill('250');
  await term.getByRole('button', { name: 'Confirmar contagem' }).click();
  await term.getByText(/ainda não chegaram ao servidor/).waitFor({ timeout: T });
  ok(true, 'fecho com venda offline por enviar: recusado com explicacao');
  await shot(term, '28b-pos-fecho-com-pendentes');
  await term.keyboard.press('Escape');
  await termCtx.setOffline(false);
  await term.getByText('1 por enviar').waitFor({ state: 'detached', timeout: T });

  // Fecho certo (105 + 75 + 35 + 35 = 250 MT em dinheiro): o turno fica FECHADO.
  await term.getByRole('button', { name: 'Fechar turno' }).click();
  await term.getByLabel('Dinheiro contado na gaveta').fill('250');
  await term.getByRole('button', { name: 'Confirmar contagem' }).click();
  await term.getByText('Este perfil só volta a vender').waitFor({ timeout: T });
  await term.getByRole('button', { name: 'Concluir' }).click();
  await term.getByText('Este perfil não vende até o dono abrir um turno novo.').waitFor({ timeout: T });
  ok(await term.getByRole('button', { name: /Laurentina Preta 550ml/ }).isDisabled(), 'turno fechado: produtos desactivados');
  await shot(term, '29-pos-turno-fechado');
  // O cadeado e uma pausa: voltar a entrar com o PIN NAO reabre o turno.
  await term.getByRole('button', { name: 'Bloquear terminal' }).click();
  await term.getByText('Quem está a vender?').waitFor({ timeout: T });
  ok(await term.getByText('Turno fechado').isVisible(), 'perfis: o caixista aparece com o turno fechado');
  await term.getByRole('button', { name: /Carlos/ }).click();
  await term.getByText('Introduza o seu PIN').waitFor();
  await term.keyboard.type('2468');
  await term.getByText('Este perfil não vende até o dono abrir um turno novo.').waitFor({ timeout: T });
  ok(true, 'voltar a entrar com o PIN do caixista nao reabre o turno');
  await term.getByRole('button', { name: 'Abrir turno novo' }).click();
  await term.getByLabel('PIN do dono').fill(fx.authPin);
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText('Este perfil não vende até o dono abrir um turno novo.').waitFor({ state: 'detached', timeout: T });
  ok(await term.getByRole('button', { name: /Laurentina Preta 550ml/ }).isEnabled(), 'PIN do dono: turno novo aberto, volta a vender');

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
  await owner.locator('tbody tr', { hasText: 'Carlos' }).first().waitFor({ timeout: T });
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
