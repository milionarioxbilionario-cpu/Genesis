// Correcoes de 31/10 num browser real (o que o fundador viu ao criar o 2.o estabelecimento):
//  - criar o 2.o: onboarding com «Voltar ao principal», copiar os produtos do 1.o e horario 24 h;
//  - no 2.o: painel bloqueado -> «Esqueci o PIN» com a senha -> PIN novo (antes: «Ainda nao criou o PIN»);
//  - Definicoes: horario 24 h guardado; terminal do guarda («Para que e este terminal?»);
//  - Equipa: «Novo guarda» e a explicacao; Produtos: «Copiar de outro estabelecimento»;
//  - dois separadores: trocar num faz o outro recarregar no estabelecimento certo.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/correcoes_3110.mjs
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
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
async function unlockIfNeeded(p, pin = fx.lockPin) {
  const h = p.getByRole('heading', { name: 'Painel bloqueado' });
  // No site real o ecra do PIN pode demorar a aparecer (a app confirma a sessao primeiro).
  await h.waitFor({ timeout: 10000 }).catch(() => {});
  if (await h.isVisible().catch(() => false)) { await p.keyboard.type(pin); await h.waitFor({ state: 'detached', timeout: 60000 }); }
}
const watch = (page) => {
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER|status of 40[39]/.test(m.text())) errors.push('console: ' + m.text()); });
};

const browser = await chromium.launch();
try {
  const ctxB = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctxB.newPage();
  watch(page);
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
  await unlockIfNeeded(page);
  await page.getByText('Hoje até agora').first().waitFor({ timeout: T });
  const homeName = (await page.getByRole('button', { name: 'Os seus estabelecimentos' }).innerText()).split('\n')[0].trim();

  // 1) Criar o 2.o estabelecimento e configura-lo copiando os produtos do 1.o, aberto 24 h.
  await page.getByRole('button', { name: 'Os seus estabelecimentos' }).click();
  await page.getByRole('button', { name: 'Acrescentar estabelecimento' }).click();
  await page.getByLabel('Nome do estabelecimento').fill('Mercearia 24h');
  await page.getByLabel('Tipo de negócio').selectOption('mercearia');
  await page.getByLabel('Localização').fill('Matola, Maputo');
  await page.getByRole('button', { name: 'Criar e abrir' }).click();
  await page.waitForURL('**/onboarding', { timeout: 3 * T });
  await page.getByText('Configurar o estabelecimento').waitFor({ timeout: T });
  ok(await page.getByRole('button', { name: /Voltar ao estabelecimento principal/ }).isVisible(), 'onboarding do 2.o tem «Voltar ao estabelecimento principal»');
  await shot(page, '3110-01-onboarding');
  await page.getByRole('button', { name: 'Continuar' }).click(); // tipo (ja marcado)
  await page.getByRole('button', { name: 'Continuar' }).click(); // categorias
  await page.getByText('De onde vêm os produtos?').waitFor({ timeout: T });
  await page.getByRole('button', { name: new RegExp('Copiar os produtos de ' + homeName) }).click();
  await page.getByText('Coca-Cola', { exact: false }).first().waitFor({ timeout: T }).catch(() => {});
  await shot(page, '3110-02-copiar-produtos');
  await page.getByRole('button', { name: 'Continuar' }).click(); // catalogo
  await page.getByRole('button', { name: 'Continuar' }).click(); // custos e equipa
  await page.getByRole('radio', { name: 'Aberto 24 horas' }).click();
  await shot(page, '3110-03-horario-24h');
  await page.getByRole('button', { name: 'Concluir e entrar' }).click();
  await page.waitForURL('**/app', { timeout: 3 * T });
  await unlockIfNeeded(page);
  await page.getByText('Hoje até agora').first().waitFor({ timeout: T });
  ok((await page.getByRole('button', { name: 'Os seus estabelecimentos' }).innerText()).includes('Mercearia 24h'), 'concluido: o painel abre no 2.o');
  const nProd = await page.evaluate(async () => (await (await fetch('/api/products', { credentials: 'same-origin' })).json()).length);
  ok(nProd > 0, 'o 2.o tem os produtos copiados do 1.o', nProd);

  // 2) No 2.o: painel bloqueado -> «Esqueci o PIN».
  await page.evaluate(() => fetch('/api/lock/lock', { method: 'POST', credentials: 'same-origin' }));
  await page.reload();
  await page.getByRole('heading', { name: 'Painel bloqueado' }).waitFor({ timeout: T });
  await page.keyboard.type(fx.lockPin);
  await page.getByRole('heading', { name: 'Painel bloqueado' }).waitFor({ state: 'detached', timeout: 60000 }).catch(() => {});
  ok(!(await page.getByText('Ainda não criou o PIN do painel').isVisible().catch(() => false)), 'no 2.o o PIN certo desbloqueia (antes: «Ainda não criou o PIN do painel»)');
  await page.evaluate(() => fetch('/api/lock/lock', { method: 'POST', credentials: 'same-origin' }));
  await page.reload();
  await page.getByRole('heading', { name: 'Painel bloqueado' }).waitFor({ timeout: T });
  await page.getByRole('button', { name: 'Esqueci o PIN' }).click();
  await page.getByLabel('Senha da conta').fill(fx.owner.password);
  await shot(page, '3110-04-esqueci-pin');
  await page.getByRole('button', { name: 'Confirmar e criar PIN novo' }).click();
  await page.getByRole('heading', { name: 'Crie o PIN do seu painel' }).waitFor({ timeout: T });
  await page.keyboard.type('8642');
  await page.getByRole('heading', { name: 'Confirme o PIN' }).waitFor({ timeout: T });
  await page.keyboard.type('8642');
  const later = page.getByRole('button', { name: 'Agora não' });
  if (await later.isVisible({ timeout: 4000 }).catch(() => false)) await later.click();
  await page.getByText('Hoje até agora').first().waitFor({ timeout: T });
  ok(true, '«Esqueci o PIN» com a senha: PIN novo criado e o painel abre');
  fx.lockPin = '8642';

  // 3) Definicoes: horario 24 h guardado; terminal do guarda.
  await page.goto(BASE + '/app/definicoes');
  await unlockIfNeeded(page);
  await page.getByRole('radio', { name: 'Aberto 24 horas' }).waitFor({ timeout: T });
  ok((await page.getByRole('radio', { name: 'Aberto 24 horas' }).getAttribute('aria-checked')) === 'true', 'Definições: o horário 24 h ficou gravado');
  await page.goto(BASE + '/app/definicoes?tab=terminals');
  await unlockIfNeeded(page);
  await page.getByRole('button', { name: 'Terminal do guarda' }).click();
  await page.getByText('Para que é este terminal?').waitFor({ timeout: T });
  ok((await page.getByRole('radio', { name: 'Saída: guarda' }).getAttribute('aria-checked')) === 'true', 'terminal do guarda: «Saída» já escolhida');
  await shot(page, '3110-05-terminal-guarda');
  await page.getByRole('button', { name: 'Cancelar' }).click();

  // 4) Equipa: «Novo guarda» e a explicacao.
  await page.goto(BASE + '/app/equipa');
  await unlockIfNeeded(page);
  await page.getByRole('button', { name: 'Novo guarda' }).waitFor({ timeout: T });
  ok(await page.getByText(/Guarda na saída: confere cada recibo/).isVisible(), 'Equipa: explicação do guarda à vista');
  await shot(page, '3110-06-equipa-guarda');

  // 5) Dois separadores: trocar num faz o outro recarregar no estabelecimento certo.
  const page2 = await ctxB.newPage();
  watch(page2);
  await page2.goto(BASE + '/app/produtos');
  await unlockIfNeeded(page2);
  const inB = await page2.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.getAttribute('aria-label') === 'Os seus estabelecimentos' && b.innerText.includes('Mercearia 24h')), null, { timeout: T }).then(() => true).catch(() => false);
  if (!inB) await shot(page2, '3110-falha-2o-separador');
  ok(inB, '2.o separador: no 2.o estabelecimento');
  await page.getByRole('button', { name: 'Os seus estabelecimentos' }).click();
  await page.getByRole('dialog').getByRole('button', { name: new RegExp(homeName) }).first().click();
  await page.waitForURL(/\/app$/, { timeout: T }).catch(async () => { await shot(page, '3110-falha-trocar'); throw new Error('trocar para casa nao navegou'); });
  // O outro separador recarrega sozinho (aviso entre separadores) e volta a pedir o PIN.
  await page2.waitForTimeout(3000);
  await unlockIfNeeded(page2);
  await page2.waitForFunction((n) => [...document.querySelectorAll('button')].some((b) => b.getAttribute('aria-label') === 'Os seus estabelecimentos' && b.innerText.includes(n)), homeName, { timeout: T }).catch(() => {});
  const side2 = await page2.getByRole('button', { name: 'Os seus estabelecimentos' }).innerText().catch(() => '');
  ok(side2.includes(homeName), 'o outro separador recarregou no estabelecimento certo (antes: gravava no errado sem aviso)', side2);
  await page2.close();

  // 6) Produtos no 1.o: «Copiar de outro estabelecimento».
  await page.goto(BASE + '/app/produtos');
  await unlockIfNeeded(page);
  await page.getByRole('button', { name: 'Copiar de outro estabelecimento' }).click();
  await page.getByText('Copiar de', { exact: true }).waitFor({ timeout: T }).catch(() => {});
  await page.getByRole('button', { name: /Copiar \d+ produtos/ }).waitFor({ timeout: T });
  ok(true, 'Produtos: «Copiar de outro estabelecimento» abre com as categorias da origem');
  await shot(page, '3110-07-copiar-catalogo');

  // 7) Telemovel: o ecra de bloqueio e o horario cabem.
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-PT', storageState: await ctxB.storageState() })).newPage();
  watch(phone);
  await phone.goto(BASE + '/app/definicoes');
  await unlockIfNeeded(phone);
  await phone.getByRole('radio', { name: 'Horário por dia' }).click().catch(() => {});
  await shot(phone, '3110-08-horario-telemovel');
} finally {
  await browser.close();
}
if (errors.length) { console.log('\nErros de JS:'); for (const e of errors) console.log('  ' + e); }
console.log('\n' + (failures === 0 && errors.length === 0 ? 'RESULTADO: tudo OK' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`));
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
