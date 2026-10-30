// Fase 9.1 (decisao do fundador 12/10/2026): email obrigatorio no «Pedir conta».
// So o formulario: o pedido e interceptado (nada e gravado na BD). O servidor
// esta provado em backend/scripts/verify_system.js, seccao 11.
//   BASE=http://localhost:5180 SHOTS=pasta node tests/e2e/pedir_conta.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const SHOTS = path.resolve(process.env.SHOTS || 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push('console: ' + m.text()); });
  const sent = [];
  await page.route('**/api/auth/request-account', async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'Pedido recebido.' }) });
  });

  await page.goto(BASE + '/pedir-conta');
  await page.getByRole('heading', { name: 'Pedir uma conta' }).waitFor();
  const email = page.getByLabel('Email');
  ok(await email.evaluate((el) => el.required), 'campo Email é obrigatório');
  ok(await page.getByText('Para entrar e recuperar a senha').isVisible(), 'explica para que serve o email');
  const optional = await page.getByText('Opcional', { exact: true }).count();
  ok(optional === 2, '«Opcional» só no NUIT e no BI (antes também no Email)', optional);

  await page.getByLabel('Nome do negócio').fill('Mercearia Boa Esperança');
  await page.getByLabel('O seu nome').fill('Fátima Nhantumbo');
  await page.getByLabel('Localização').fill('Xipamanine, Maputo');
  await page.getByLabel('Telefone (WhatsApp)').fill('847778899');
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await page.waitForTimeout(800);
  ok(sent.length === 0 && await email.evaluate((el) => !el.validity.valid), 'sem email: o browser não envia o pedido', sent);
  await page.screenshot({ path: path.join(SHOTS, 'p1-sem-email.png') });

  await email.fill('  fatima.nhantumbo@gmail.com ');
  // 30/10/2026: so maiores de 18 anos, com Termos e Privacidade aceites.
  const terms = page.getByRole('checkbox', { name: /Tenho 18 anos ou mais/ });
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await page.waitForTimeout(800);
  ok(sent.length === 0 && await terms.evaluate((el) => !el.validity.valid), 'sem a caixa dos 18 anos: o browser não envia o pedido', sent);
  ok(await page.getByRole('link', { name: 'Termos e condições' }).getAttribute('href') === '/termos' && await page.getByRole('link', { name: 'Política de privacidade' }).getAttribute('href') === '/privacidade', 'ligações para os Termos e a Política de privacidade');
  await terms.check();
  await page.screenshot({ path: path.join(SHOTS, 'p1b-18-anos.png') });
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await page.getByRole('heading', { name: 'Pedido recebido' }).waitFor({ timeout: 30000 });
  ok(sent.length === 1 && sent[0].email === 'fatima.nhantumbo@gmail.com', 'com email: pedido enviado com o email sem espaços', sent);
  ok(sent[0].acceptTerms === true, 'pedido leva a confirmação dos 18 anos e dos Termos', sent[0]);
  ok(!('nuit' in sent[0]) && !('idDocument' in sent[0]), 'NUIT e BI vazios continuam opcionais (não são enviados)', sent[0]);
  await page.screenshot({ path: path.join(SHOTS, 'p2-recebido.png') });
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors) console.log('  ' + e);
const pass = failures === 0 && errors.length === 0;
console.log('RESULTADO: pedir conta ' + (pass ? 'passou' : 'FALHOU'));
process.exit(pass ? 0 : 1);
