// Fase 9.3: lingua PT/EN — cada pessoa escolhe a sua (decisao do fundador 12/10).
//  - ecras de entrada: PT por defeito; EN fica no aparelho;
//  - dono: escolhe no menu, fica na conta (outro aparelho abre em EN);
//  - terminal: ecras partilhados na lingua do aparelho; depois do PIN manda a
//    lingua do caixista, que a muda no POS sem mexer na do aparelho.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/idioma.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const SHOTS = path.resolve(process.env.SHOTS || 'shots');
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const T = 45000;
fs.mkdirSync(SHOTS, { recursive: true });
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const watch = (page, who) => {
  page.on('pageerror', (e) => errors.push(who + ' pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(who + ' console: ' + m.text()); });
};
const api = (page, method, url, body) => page.evaluate(async ([m, u, b]) => { const r = await fetch(u, { method: m, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => null) }; }, [method, url, body]);
// Espera pela resposta do PUT da lingua (daqui ate a BD pode passar de 1 s).
const saved = (page) => page.waitForResponse((r) => r.url().includes('/api/auth/language') && r.request().method() === 'PUT', { timeout: T });
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function login(page) {
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel(/^(Senha|Password)$/).fill(fx.owner.password);
  await page.getByRole('button', { name: /^(Entrar|Sign in)$/ }).click();
  await page.waitForURL('**/app', { timeout: T });
}

const browser = await chromium.launch();
try {
  console.log('=== Ecrãs de entrada (computador) ===');
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'pt-PT' });
  const a = await ctxA.newPage();
  watch(a, 'entrada');
  await a.goto(BASE + '/entrar');
  await a.getByRole('heading', { name: 'Entrar' }).waitFor({ timeout: T });
  ok(await a.getByRole('radio', { name: 'PT' }).getAttribute('aria-checked') === 'true', 'por defeito: português');
  await a.getByRole('radio', { name: 'EN' }).click();
  await a.getByRole('heading', { name: 'Sign in' }).waitFor();
  ok(await a.getByLabel('Password').isVisible() && await a.getByText('Forgot your password?').isVisible(), 'EN: título, «Password» e «Forgot your password?»');
  await a.reload();
  await a.getByRole('heading', { name: 'Sign in' }).waitFor({ timeout: T });
  ok(true, 'EN fica guardado no aparelho (recarregar a página)');
  await a.getByRole('link', { name: 'Request an account' }).click();
  await a.getByRole('heading', { name: 'Request an account' }).waitFor();
  ok(await a.getByLabel('Business name').isVisible() && await a.getByRole('option', { name: 'Bottle store / Drinks shop' }).count() === 1, 'Pedir conta em inglês (campos e tipos de negócio)');
  await a.screenshot({ path: path.join(SHOTS, 'i1-pedir-conta-en.png') });
  await a.goto(BASE + '/recuperar-senha');
  await a.getByRole('heading', { name: 'Recover password' }).waitFor({ timeout: T });
  ok(true, 'Recuperar senha em inglês');
  await a.goto(BASE + '/entrar');
  await a.getByLabel('Email').fill(fx.owner.email);
  await a.getByLabel('Password').fill('errada-de-proposito');
  await a.getByRole('button', { name: 'Sign in' }).click();
  await a.getByText('Invalid credentials').waitFor({ timeout: T });
  ok(true, 'erro do servidor traduzido («Credenciais inválidas» → «Invalid credentials»)');
  await a.screenshot({ path: path.join(SHOTS, 'i2-entrar-en-erro.png') });
  await a.goto(BASE + '/entrar?motivo=SESSION_EXPIRED');
  await a.getByText('Your session expired. Please sign in again.').waitFor({ timeout: T });
  ok(true, 'motivo do fim de sessão traduzido');

  console.log('\n=== Painel do dono: a língua da conta manda ===');
  await login(a);
  await a.getByRole('link', { name: 'Início' }).first().waitFor({ timeout: T });
  ok(true, 'conta em PT: depois de entrar o painel abre em português (a conta manda sobre o aparelho)');
  const me0 = await api(a, 'GET', '/api/auth/me');
  ok(me0.data?.user?.language === 'pt', '/me: pt', me0.data?.user?.language);
  const putEn = saved(a);
  await a.getByRole('radio', { name: 'EN' }).click();
  await a.getByRole('link', { name: 'Home' }).first().waitFor();
  ok(await a.getByRole('link', { name: 'Reports' }).first().isVisible() && await a.getByRole('link', { name: 'Settings' }).first().isVisible(), 'menu em inglês (Home, Reports, Settings)');
  ok(await a.getByText('Owner', { exact: true }).isVisible() && await a.getByRole('button', { name: 'Sign out' }).isVisible(), '«Owner» e «Sign out»');
  ok((await putEn).status() === 200, 'PUT /api/auth/language: 200');
  const me1 = await api(a, 'GET', '/api/auth/me');
  ok(me1.data?.user?.language === 'en', 'escolha guardada na conta (/me: en)', me1.data?.user?.language);
  await a.screenshot({ path: path.join(SHOTS, 'i3-painel-en.png') });

  // Outro aparelho do dono, em PT: entra e o painel abre em EN (a conta).
  const ctxB = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const b = await ctxB.newPage();
  watch(b, 'dono-iphone');
  await b.goto(BASE + '/entrar');
  await b.getByRole('heading', { name: 'Entrar' }).waitFor({ timeout: T });
  await login(b);
  await b.getByRole('button', { name: 'Open menu' }).click({ timeout: T });
  await b.getByRole('link', { name: 'Home' }).first().waitFor({ timeout: T });
  ok(true, 'outro aparelho (iPhone, ecrã de entrada em PT): o painel abre em EN — a língua é da pessoa');
  ok(await noHScroll(b), 'iPhone 390 px: menu com o seletor sem deslocamento lateral');
  await b.screenshot({ path: path.join(SHOTS, 'i4-iphone-menu-en.png') });
  await ctxB.close();
  const putPt = saved(a);
  await a.getByRole('radio', { name: 'PT' }).click();
  await a.getByRole('link', { name: 'Início' }).first().waitFor();
  await putPt;
  ok((await api(a, 'GET', '/api/auth/me')).data?.user?.language === 'pt', 'voltar a PT também fica na conta');

  console.log('\n=== Terminal (iPhone): língua do aparelho vs. do caixista ===');
  const code = await api(a, 'POST', '/api/owner/terminals/pairing-code', { name: 'Balcão língua' });
  ok(code.status === 201, 'código de emparelhamento', code.status);
  const ctxT = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const term = await ctxT.newPage();
  watch(term, 'terminal');
  await term.goto(BASE + '/terminal');
  await term.getByRole('heading', { name: 'Emparelhar este terminal' }).waitFor({ timeout: T });
  await term.getByRole('radio', { name: 'EN' }).click();
  await term.getByRole('heading', { name: 'Pair this terminal' }).waitFor();
  await term.getByLabel('Pairing code').fill(code.data.code);
  await term.getByRole('button', { name: 'Pair' }).click();
  await term.getByRole('heading', { name: 'Who is selling?' }).waitFor({ timeout: T });
  ok(await term.getByText('Shift open').first().isVisible(), 'perfis em inglês (aparelho em EN)');
  ok(await noHScroll(term), 'perfis: 390 px sem deslocamento lateral');
  await term.screenshot({ path: path.join(SHOTS, 'i5-perfis-en.png') });
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).click();
  await term.getByText('Enter your PIN').waitFor();
  await term.keyboard.type(fx.cashier.pin);
  // 1.º PIN neste aparelho: a pergunta dos dispositivos (8.8), agora com a
  // lingua do caixista (no telemovel o cabecalho nao tem espaco para o botao).
  const dlg = term.getByRole('dialog', { name: 'Dispositivos' });
  await dlg.waitFor({ timeout: T });
  const checked = (scope, l) => scope.getByRole('radio', { name: l }).getAttribute('aria-checked');
  ok(await checked(dlg, 'PT') === 'true' && await dlg.getByRole('button', { name: 'Fechar' }).count() === 1, 'depois do PIN: língua do caixista (PT), não a do aparelho (EN)');
  const putCash = saved(term);
  await dlg.getByRole('radio', { name: 'EN' }).click();
  ok((await putCash).status() === 200, 'caixista escolhe EN no diálogo: PUT (sessão pos) 200');
  // 9.5: o titulo tambem muda («Dispositivos» -> «Devices»).
  ok(await term.getByRole('dialog', { name: 'Devices' }).getByRole('button', { name: 'Close' }).count() === 1, 'o ecrã muda logo para EN');
  const cme = await api(term, 'GET', '/api/auth/me');
  ok(cme.data?.user?.language === 'en' && cme.data?.user?.role === 'cashier', 'gravado na conta do caixista', cme.data?.user);
  // 9.5: o dialogo inteiro passa a ingles (titulo, botoes).
  const dlgEn = term.getByRole('dialog', { name: 'Devices' });
  ok(await dlgEn.isVisible() && await dlgEn.getByRole('button', { name: 'Continue' }).isVisible(), '9.5: diálogo «Devices» em inglês (título e botões)');
  await term.screenshot({ path: path.join(SHOTS, 'i6-dispositivos-en.png') });
  await dlgEn.getByRole('button', { name: /I don't have one/ }).click();
  await dlgEn.waitFor({ state: 'detached', timeout: T });
  ok(await term.getByRole('button', { name: /^(Língua|Language): / }).isHidden(), 'telemóvel: sem botão da língua no cabeçalho');
  ok(await noHScroll(term), 'POS 390 px: sem deslocamento lateral');
  const nameW = await term.locator('header p.truncate').first().evaluate((el) => Math.round(el.getBoundingClientRect().width));
  console.log('        largura do nome da loja no cabeçalho: ' + nameW + ' px');
  ok(nameW >= 40, 'o nome da loja continua visível (≥ 40 px)', nameW);
  await term.screenshot({ path: path.join(SHOTS, 'i7-pos-390.png') });
  ok((await api(a, 'GET', '/api/auth/me')).data?.user?.language === 'pt', 'a língua do dono não mudou');

  await term.getByRole('button', { name: 'Lock terminal' }).click();
  await term.getByRole('heading', { name: 'Who is selling?' }).waitFor({ timeout: T });
  ok(true, 'bloquear: perfis voltam à língua do aparelho (EN)');
  await term.getByRole('radio', { name: 'PT' }).click();
  await term.getByRole('heading', { name: 'Quem está a vender?' }).waitFor();
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).click();
  await term.keyboard.type(fx.cashier.pin);
  await term.getByRole('button', { name: 'Devices' }).click({ timeout: T });
  const dlg2 = term.getByRole('dialog', { name: 'Devices' });
  await dlg2.waitFor({ timeout: T });
  ok(await checked(dlg2, 'EN') === 'true' && await dlg2.getByRole('button', { name: 'Close' }).count() === 1, 'aparelho em PT, caixista entra: fica em EN (a língua dele)');
  await dlg2.getByRole('button', { name: 'Continue' }).click();
  await ctxT.close();

  console.log('\n=== Terminal (computador): botão da língua no cabeçalho ===');
  const code2 = await api(a, 'POST', '/api/owner/terminals/pairing-code', { name: 'Balcão PC' });
  const ctxD = await browser.newContext({ viewport: { width: 1366, height: 800 }, locale: 'pt-PT' });
  const desk = await ctxD.newPage();
  watch(desk, 'terminal-pc');
  await desk.goto(BASE + '/terminal');
  await desk.getByLabel('Código de emparelhamento').fill(code2.data.code);
  await desk.getByRole('button', { name: 'Emparelhar' }).click();
  await desk.getByRole('button', { name: new RegExp(fx.cashier.name) }).click({ timeout: T });
  await desk.keyboard.type(fx.cashier.pin);
  await desk.getByRole('dialog', { name: 'Devices' }).getByRole('button', { name: /I don't have one/ }).click({ timeout: T });
  const langBtn = desk.getByRole('button', { name: /^(Língua|Language): / });
  await langBtn.waitFor({ timeout: T });
  ok((await langBtn.textContent()).trim() === 'EN', 'computador: botão no cabeçalho mostra a língua do caixista (EN)', await langBtn.textContent());
  const putBack = saved(desk);
  await langBtn.click();
  ok((await putBack).status() === 200 && (await langBtn.textContent()).trim() === 'PT', 'um toque alterna para PT e grava');
  ok((await api(desk, 'GET', '/api/auth/me')).data?.user?.language === 'pt', 'caixista de volta a PT na conta');
  await desk.screenshot({ path: path.join(SHOTS, 'i8-pos-pc.png') });
  await ctxD.close();
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors) console.log('  ' + e);
const pass = failures === 0 && errors.length === 0;
console.log('RESULTADO: idioma ' + (pass ? 'passou' : 'FALHOU'));
process.exit(pass ? 0 : 1);
