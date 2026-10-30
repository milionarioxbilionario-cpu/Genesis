// Correccoes pedidas pelo fundador a 30/10/2026, num browser real (Chromium):
//  1. venda sem rede: o recibo aparece logo (provisorio), com Imprimir e Imagem;
//  2. o ultimo produto vendido sem rede fica «Esgotado» e continua esgotado
//     quando a rede volta (antes voltava a aparecer com 1 ate mudar de pagina);
//  3. a fila envia sozinha e o caixista ve «N ... enviado(s)»;
//  4. «Vendas» abre SEM rede com o PIN do dono (ja usado com rede neste terminal)
//     e cada venda tem «Reimprimir» (2.a via), com e sem rede;
//  5. auditoria do dono: nomes em vez de codigos e o que se vendeu.
//   BASE=http://localhost:5180 FIXTURE=fixture.json SHOTS=pasta node tests/e2e/correcoes_3010.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false });
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}
async function unlockIfNeeded(p) {
  const h = p.getByRole('heading', { name: 'Painel bloqueado' });
  await h.waitFor({ timeout: 4000 }).catch(() => {});
  if (await h.isVisible().catch(() => false)) { await p.keyboard.type(fx.lockPin); await h.waitFor({ state: 'detached', timeout: 60000 }); }
}
const tile = (p, name) => p.locator('button[data-tile]', { hasText: name });

const browser = await chromium.launch();
try {
  console.log('\n=== Dono: Heineken com 1 unidade + codigo do terminal ===');
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner, 'dono');
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar' }).click();
  await owner.waitForURL('**/app', { timeout: T });
  await unlockIfNeeded(owner);
  const heineken = await owner.evaluate(async () => {
    const list = await (await fetch('/api/products', { credentials: 'same-origin' })).json();
    const p = list.find((x) => x.name === 'Heineken 330ml');
    const r = await fetch('/api/products/' + p.id + '/stock', { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta: 1 - p.stock_qty, reason: 'e2e: so resta 1' }) });
    return { id: p.id, status: r.status };
  });
  ok(heineken.status === 200, 'Heineken 330ml fica com 1 unidade (como o atum do fundador)', heineken);
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await unlockIfNeeded(owner);
  await owner.getByRole('button', { name: 'Emparelhar terminal' }).click();
  await owner.getByLabel('Nome do terminal').fill('Balcão 30/10');
  await owner.getByRole('button', { name: 'Gerar código' }).click();
  const codeEl = owner.locator('p.num.text-2xl');
  await codeEl.waitFor({ timeout: T });
  const code = (await codeEl.textContent()).trim();

  console.log('\n=== Terminal ===');
  const termCtx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-PT' });
  const term = await termCtx.newPage();
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: /Carlos/ }).click();
  await term.getByText('Introduza o seu PIN').waitFor({ timeout: T });
  await term.keyboard.type(fx.cashier.pin);
  await term.getByText('Venda actual').waitFor({ timeout: T });
  const skip = term.getByRole('button', { name: 'Não tenho — saltar' });
  if (await skip.count()) await skip.click();
  await tile(term, 'Heineken 330ml').waitFor({ timeout: T });
  ok(/1 un\./.test(await tile(term, 'Heineken 330ml').innerText()), 'terminal: Heineken com 1 un.');

  // Com rede: abrir «Vendas» com o PIN do dono (o terminal guarda so a verificacao).
  await term.getByRole('button', { name: 'Vendas', exact: true }).click();
  await term.getByLabel('PIN do dono').fill(fx.authPin);
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText('As minhas últimas vendas').waitFor({ timeout: T });
  ok(true, 'com rede: lista de vendas aberta com o PIN do dono');
  await term.keyboard.press('Escape');

  // 1 + 2: venda sem rede do ultimo Heineken.
  await termCtx.setOffline(true);
  await tile(term, 'Heineken 330ml').click();
  await term.getByRole('button', { name: /Cobrar 85,00 MT/ }).click();
  await term.getByText('Venda guardada neste terminal').waitFor({ timeout: T });
  ok(await term.getByText(/O recibo é provisório \(\d{8}-P[0-9A-F]{4}\)/).isVisible(), 'sem rede: recibo provisorio com numero P…');
  ok(await term.getByRole('button', { name: 'Imprimir recibo' }).isVisible() && await term.getByRole('button', { name: 'Imagem (WhatsApp)' }).isVisible(), 'sem rede: Imprimir recibo e Imagem (WhatsApp) disponiveis');
  ok(await term.getByAltText('QR de verificação da venda').isVisible(), 'sem rede: recibo com o QR (o mesmo id da venda)');
  await shot(term, '3010-01-recibo-sem-rede');
  await term.getByRole('button', { name: 'Nova venda' }).click();
  await term.getByText('1 por enviar').waitFor({ timeout: T });
  ok(/Esgotado/.test(await tile(term, 'Heineken 330ml').innerText()) && await tile(term, 'Heineken 330ml').isDisabled(), 'sem rede: o ultimo Heineken fica «Esgotado» logo');

  // 4: «Vendas» SEM rede, com o PIN conferido no terminal; 2.a via da venda por enviar.
  await term.getByRole('button', { name: 'Vendas', exact: true }).click();
  await term.getByLabel('PIN do dono').fill('9999');
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText(/PIN incorrecto. Restam 4 tentativa/).waitFor({ timeout: T });
  ok(true, 'sem rede: PIN errado recusado no proprio terminal (restam 4)');
  await term.getByLabel('PIN do dono').fill(fx.authPin);
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText('As minhas últimas vendas').waitFor({ timeout: T });
  ok(await term.getByText('Sem ligação: vendas guardadas neste terminal').isVisible() && await term.getByText('Por enviar').first().isVisible(), 'sem rede: lista aberta, com a venda «Por enviar» em cima');
  await shot(term, '3010-02-vendas-sem-rede');
  await term.getByRole('button', { name: 'Reimprimir' }).first().click();
  await term.getByRole('button', { name: 'Imprimir recibo' }).waitFor({ timeout: T });
  ok(await term.getByText(/Heineken 330ml/).first().isVisible(), 'sem rede: 2.a via mostra o recibo com o Heineken');
  await term.getByRole('button', { name: 'Nova venda' }).click();
  await term.keyboard.press('Escape');

  // 2 + 3: a rede volta; a fila envia sozinha, aviso visivel, Heineken continua esgotado.
  await termCtx.setOffline(false);
  await term.evaluate(() => window.dispatchEvent(new Event('online')));
  await term.getByText(/1 registo\(s\) feito\(s\) sem ligação já enviado\(s\)/).waitFor({ timeout: T });
  ok(true, 'rede de volta: «1 registo(s) feito(s) sem ligação já enviado(s)» aparece sozinho');
  await term.getByText('1 por enviar').waitFor({ state: 'detached', timeout: T });
  await term.waitForTimeout(1500);
  ok(/Esgotado/.test(await tile(term, 'Heineken 330ml').innerText()), 'rede de volta: Heineken continua «Esgotado» sem mudar de pagina');
  await shot(term, '3010-03-rede-de-volta');

  // 4 com rede: 2.a via de uma venda ja enviada fica registada.
  await term.getByRole('button', { name: 'Vendas', exact: true }).click();
  await term.getByLabel('PIN do dono').fill(fx.authPin);
  await term.getByRole('button', { name: 'Autorizar' }).click();
  await term.getByText('As minhas últimas vendas').waitFor({ timeout: T });
  ok(!(await term.getByText('Por enviar').count()), 'com rede: ja nao ha vendas por enviar');
  const reprint = term.waitForResponse((r) => /\/api\/pos\/sales\/[^/]+\/reprint$/.test(r.url()), { timeout: T });
  await term.getByRole('button', { name: 'Reimprimir' }).first().click();
  ok((await reprint).status() === 201, 'com rede: 2.a via registada (201)');
  await term.getByRole('button', { name: 'Imprimir recibo' }).waitFor({ timeout: T });
  await shot(term, '3010-04-segunda-via');
  await term.getByRole('button', { name: 'Nova venda' }).click();
  await term.keyboard.press('Escape');

  // 5: auditoria do dono legivel.
  console.log('\n=== Dono: auditoria ===');
  await owner.goto(BASE + '/app/definicoes?tab=audit');
  await unlockIfNeeded(owner);
  await owner.getByText('Quanto tempo guardar').waitFor({ timeout: T });
  ok(await owner.getByText('2.ª via de recibo impressa').first().isVisible({ timeout: T }).catch(() => false) || await owner.getByText('2.ª via de recibo impressa').first().waitFor({ timeout: T }).then(() => true), 'auditoria: «2.ª via de recibo impressa» aparece');
  await owner.locator('li button', { hasText: /^Venda/ }).filter({ hasText: '85,00 MT' }).first().click();
  await owner.getByText('O que mudou').waitFor({ timeout: T });
  await owner.getByText('Heineken 330ml').first().waitFor({ timeout: T });
  const drawer = await owner.locator('[role="dialog"]').last().innerText();
  ok(!UUID.test(drawer), 'detalhe da venda: nenhum codigo (id) a vista', drawer.match(UUID)?.[0]);
  ok(/Caixista/.test(drawer) && /Carlos/.test(drawer), 'detalhe: caixista pelo nome (Carlos)');
  ok(/Heineken 330ml/.test(drawer) && /85,00\s?MT/.test(drawer), 'detalhe: o que se vendeu (Heineken 330ml, 85,00 MT)');
  ok(!/\boperated by\b|\bcashier user id\b|\bitem count\b|\btotal cost\b/i.test(drawer), 'detalhe: sem nomes tecnicos em ingles');
  ok(/Custo da mercadoria/.test(drawer) && /Dinheiro|Pagamento/.test(drawer), 'detalhe: custo em MT e pagamento em portugues');
  await shot(owner, '3010-05-auditoria-venda');
} finally {
  await browser.close();
}
if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log('\n' + (failures === 0 && errors.length === 0 ? 'RESULTADO: tudo OK' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`));
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
