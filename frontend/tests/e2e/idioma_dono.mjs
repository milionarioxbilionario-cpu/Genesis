// Fase 9.4: o painel do dono inteiro em ingles. Percorre todas as paginas e
// separadores (e as gavetas principais) com a conta em EN e procura palavras
// da interface que tenham ficado em portugues. Os dados da loja (nomes de
// produtos, categorias, clientes) ficam como o dono os escreveu.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/idioma_dono.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const SHOTS = path.resolve(process.env.SHOTS || 'shots');
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const T = 60000;
fs.mkdirSync(SHOTS, { recursive: true });
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const watch = (page, who) => {
  page.on('pageerror', (e) => errors.push(who + ' pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER|frame-ancestors/.test(m.text())) errors.push(who + ' console: ' + m.text()); });
};
const api = (page, method, url, body) => page.evaluate(async ([m, u, b]) => { const r = await fetch(u, { method: m, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => null) }; }, [method, url, body]);

// Palavras da interface em portugues que nao aparecem nos dados da loja de teste.
const PT_WORDS = ['Guardar', 'Cancelar', 'Receita', 'Lucro', 'Definições', 'Fornecedor', 'Validade', 'Relatório', 'Semana', 'Fechar', 'Pesquisar', 'Ainda ', 'Despesa', 'Caixista', 'Vendas', 'Produtos', 'Início', 'Equipa', 'Mês', 'Hoje', 'Em falta', 'Pagamento', 'Novo ', 'Nova ', 'Sem ', 'Diário', 'Mensal', 'Rastreio', 'Quem', 'Estado', 'Auditoria', 'Terminais', 'Descontos', 'Custos', 'Horário', 'Entrada de stock', 'Ajuste', 'Total em', 'vendas', 'dia(s)'];
async function ptLeft(page) {
  const text = await page.evaluate(() => document.body.innerText);
  return PT_WORDS.filter((w) => text.includes(w)).map((w) => { const i = text.indexOf(w); return w + ' «' + text.slice(Math.max(0, i - 25), i + 35).replace(/\s+/g, ' ') + '»'; });
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page, 'dono');
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel(/^(Senha|Password)$/).fill(fx.owner.password);
  await page.getByRole('button', { name: /^(Entrar|Sign in)$/ }).click();
  await page.waitForURL('**/app', { timeout: T });
  const put = await api(page, 'PUT', '/api/auth/language', { language: 'en' });
  ok(put.status === 200, 'conta do dono em EN', put.status);
  await page.reload();
  await page.getByRole('link', { name: 'Home' }).first().waitFor({ timeout: T });

  const visits = [
    ['/app', 'Revenue today', 'd01-home'],
    ['/app/vendas', 'History of all sales', 'd02-sales'],
    ['/app/vendas', 'Shift closes', 'd03-closes', 'tab:Shift closes'],
    ['/app/produtos', 'Catalogue', 'd04-catalogue'],
    ['/app/produtos?tab=stock', 'To restock', 'd05-stock'],
    ['/app/produtos?tab=shopping', 'Generate from recommendation', 'd06-shopping'],
    ['/app/produtos?tab=prices', 'Cost history', 'd07-prices'],
    ['/app/fornecedores', 'New supplier', 'd08-suppliers'],
    ['/app/txenekas', 'Total owed', 'd09-credit'],
    ['/app/equipa', 'New cashier', 'd10-team'],
    ['/app/equipa', 'Monthly payroll', 'd11-workers', 'tab:Workers'],
    ['/app/relatorios', 'By payment method', 'd12-daily'],
    ['/app/relatorios?tab=weekly', 'Day by day', 'd13-weekly'],
    ['/app/relatorios?tab=monthly', 'From money in to what is left', 'd14-monthly'],
    ['/app/definicoes', 'Store details', 'd15-store'],
    ['/app/definicoes?tab=costs', 'Fixed costs', 'd16-costs'],
    ['/app/definicoes?tab=discounts', 'Authorization PIN', 'd17-discounts'],
    ['/app/definicoes?tab=terminals', 'Pair terminal', 'd18-terminals'],
    ['/app/definicoes?tab=audit', 'How long to keep', 'd19-audit'],
  ];
  for (const [url, marker, shot, action] of visits) {
    await page.goto(BASE + url);
    if (action?.startsWith('tab:')) await page.getByRole('tab', { name: action.slice(4) }).click({ timeout: T });
    await page.getByText(marker).first().waitFor({ timeout: T });
    await page.waitForLoadState('networkidle', { timeout: T }).catch(() => {});
    const left = await ptLeft(page);
    ok(left.length === 0, `${url}${action ? ' (' + action.slice(4) + ')' : ''}: em inglês, sem texto da interface em português`, left);
    await page.screenshot({ path: path.join(SHOTS, shot + '.png'), fullPage: true });
  }

  // Gavetas e dialogos principais.
  const drawers = [
    ['/app/produtos', 'New product', 'Purchase price', 'd20-new-product'],
    ['/app/produtos?tab=stock', 'Manual adjustment', 'Quantity', 'd21-adjust'],
    ['/app/txenekas', 'New credit', 'Customer name', 'd22-new-credit'],
    ['/app/equipa', 'New cashier', '4-digit PIN', 'd23-new-cashier'],
    ['/app/fornecedores', 'New supplier', 'Delivery cost per visit', 'd24-new-supplier'],
  ];
  for (const [url, button, marker, shot] of drawers) {
    await page.goto(BASE + url);
    await page.getByRole('button', { name: button }).first().click({ timeout: T });
    const dlg = page.getByRole('dialog');
    await dlg.getByText(marker).first().waitFor({ timeout: T });
    const left = (await ptLeft(page)).filter((w) => !/^Novo |^Nova /.test(w));
    ok(left.length === 0, `«${button}»: gaveta em inglês`, left);
    await page.screenshot({ path: path.join(SHOTS, shot + '.png') });
    await dlg.getByRole('button', { name: 'Close' }).first().click();
  }

  // Rastreio com uma venda real: o texto do movimento vem montado em ingles.
  await page.goto(BASE + '/app/relatorios');
  await page.getByText('Activity trail').waitFor({ timeout: T });
  ok(await page.getByText('Everything that happened in the store').isVisible(), 'relatórios: descrição em inglês');

  // 9.8: pesquisa nas duas linguas nos produtos do dono.
  await page.goto(BASE + '/app/produtos');
  await page.locator('tbody tr', { hasText: 'Água Namaacha' }).first().waitFor({ timeout: T });
  await page.getByLabel('Search', { exact: true }).fill('water');
  await page.waitForFunction(() => [...document.querySelectorAll('tbody tr')].every((r) => r.textContent.includes('Água')), null, { timeout: T });
  ok(await page.locator('tbody tr', { hasText: 'Água Namaacha' }).count() === 1, '9.8: «water» encontra a Água nos produtos do dono');
  await page.goto(BASE + '/app/relatorios');
  await page.getByText('Activity trail').waitFor({ timeout: T });

  // 9.6: PDFs dos relatorios em ingles (nome do ficheiro, titulos, numeros).
  const PDF_PT = ['Resumo', 'Receita', 'Lucro bruto', 'Mais vendidos', 'Por caixista', 'Fechos de turno', 'Rastreio', 'Gerado em', 'página', 'Nada a registar', 'Do que entrou', 'Semanas do m', 'Dia a dia', 'O que comprar'];
  for (const [tab, nameRe, mustHave] of [
    ['Daily', /^Daily report - Bottle Store Central \(.+\)\.pdf$/, ['Summary', 'Revenue', 'Best sellers', 'By cashier', 'Activity trail', 'Generated on', 'page 1 of']],
    ['Weekly', /^Weekly report - Bottle Store Central \(.+\)\.pdf$/, ['Day by day', 'What to buy for next week']],
    ['Monthly', /^Monthly report - Bottle Store Central \(.+\)\.pdf$/, ['From money in to what is left', 'Weeks of the month', 'Real net profit']],
  ]) {
    await page.getByRole('tab', { name: tab }).click();
    await page.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('PDF / print')); return b && !b.disabled; }, null, { timeout: T });
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: T }), page.getByRole('button', { name: 'PDF / print' }).click()]);
    const txt = fs.readFileSync(await dl.path()).toString('latin1');
    const lacking = mustHave.filter((s) => !txt.includes(s));
    const pt = PDF_PT.filter((s) => txt.includes(s));
    ok(nameRe.test(dl.suggestedFilename()) && lacking.length === 0 && pt.length === 0, `9.6: PDF ${tab} em inglês (${dl.suggestedFilename()})`, { lacking, pt });
  }

  // 9.6: WhatsApp ao fornecedor sai na lingua do dono (o ecra manda X-Genesis-Lang).
  const prods = (await api(page, 'GET', '/api/products')).data;
  const two = prods.filter((p) => /2M 340ml|Heineken/.test(p.name)).map((p) => ({ product_id: p.id, quantity: 6, unit_cost: p.cost_price || 0 }));
  ok((await api(page, 'POST', '/api/shopping-lists', { name: 'Weekly order', supplier_id: null, items: two })).status === 201, 'lista de compras de teste');
  await page.goto(BASE + '/app/produtos?tab=shopping');
  await page.locator('tbody tr', { hasText: 'Weekly order' }).click({ timeout: T });
  // O wa.me verdadeiro redirecciona para api.whatsapp.com: o teste so precisa do endereco.
  await ctx.route('https://wa.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
  const waReq = page.waitForRequest((r) => /\/api\/shopping-lists\/[^/]+\/whatsapp/.test(r.url()), { timeout: T });
  const popupP = ctx.waitForEvent('page', { timeout: T });
  await page.getByRole('button', { name: 'Send by WhatsApp' }).click({ timeout: T });
  const popup = await popupP;
  ok((await waReq).headers()['x-genesis-lang'] === 'en', '9.6: o pedido leva a língua do ecrã (X-Genesis-Lang: en)');
  await popup.waitForURL(/wa\.me/, { timeout: T });
  const waText = decodeURIComponent(popup.url());
  ok(/I would like to order:/.test(waText) && /6 × 2M 340ml/.test(waText) && /Can you confirm the price/.test(waText) && !/Gostaria|Obrigado/.test(waText), '9.6: mensagem do WhatsApp ao fornecedor em inglês', waText);
  await popup.close();

  // Telemovel: menu e uma pagina larga.
  const phone = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const m = await phone.newPage();
  watch(m, 'dono-iphone');
  await m.goto(BASE + '/entrar');
  await m.getByLabel('Email').fill(fx.owner.email);
  await m.getByLabel(/^(Senha|Password)$/).fill(fx.owner.password);
  await m.getByRole('button', { name: /^(Entrar|Sign in)$/ }).click();
  await m.waitForURL('**/app', { timeout: T });
  await m.goto(BASE + '/app/relatorios?tab=monthly');
  await m.getByText('From money in to what is left').waitFor({ timeout: T });
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'iPhone: relatório mensal em inglês sem deslocamento lateral');
  await m.screenshot({ path: path.join(SHOTS, 'd25-iphone-monthly.png'), fullPage: true });
  await phone.close();

  ok((await api(page, 'PUT', '/api/auth/language', { language: 'pt' })).status === 200, 'conta do dono de volta a PT');
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors) console.log('  ' + e);
const pass = failures === 0 && errors.length === 0;
console.log('RESULTADO: painel do dono em inglês ' + (pass ? 'passou' : 'FALHOU'));
process.exit(pass ? 0 : 1);
