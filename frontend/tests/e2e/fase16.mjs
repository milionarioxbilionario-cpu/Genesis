// Fase 16: perfil do dono, aniversario e presente de Premium.
//   (cd ../backend && node scripts/e2e_fixture.js create f.json)
//   BASE=http://localhost:5190 FIXTURE=f.json SHOTS=pasta node tests/e2e/fase16.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5190';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = path.resolve(process.env.SHOTS || 'shots-fase16');
fs.mkdirSync(SHOTS, { recursive: true });
const T = 60000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (p, n, full = false) => p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }).catch(() => {});
const watch = (p) => {
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER|status of 4(0[0-9]|1[0-9]|2[0-9])|status of 503/.test(m.text())) errors.push('console: ' + m.text()); });
};
// Dia de hoje em Maputo (UTC+2) e o aniversario «de hoje» ha 30 anos.
const today = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10);
const birthday = String(Number(today.slice(0, 4)) - 30) + today.slice(4);
const NEW_PW = 'Fase16-' + Math.random().toString(36).slice(2, 10);

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ locale: 'pt-PT', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByText('Hoje até agora').waitFor({ timeout: T });

  // O nome do dono no menu abre o Perfil.
  await page.getByRole('link', { name: /Dono · Perfil/ }).click();
  await page.getByRole('heading', { name: 'Perfil' }).waitFor({ timeout: T });
  ok(await page.getByText(fx.owner.email).isVisible(), 'Perfil abre a partir do nome, com o e-mail da conta');
  ok(await page.getByText('Básico').first().isVisible(), 'plano Básico à vista');
  ok(!(await page.getByText('O seu presente de aniversário').isVisible()), 'antes de definir a data, não se fala do presente');
  await shot(page, '16-perfil', true);

  // Senha
  await page.getByLabel('Senha actual').fill(fx.owner.password);
  await page.getByLabel('Senha nova', { exact: true }).fill(NEW_PW);
  await page.getByLabel('Repetir a senha nova').fill(NEW_PW + 'x');
  ok(await page.getByText('Não é igual à senha nova.').isVisible(), 'senha repetida diferente: avisa');
  await page.getByLabel('Repetir a senha nova').fill(NEW_PW);
  await page.getByRole('button', { name: 'Mudar a senha' }).click();
  await page.getByText('Senha mudada. As outras sessões foram fechadas.').waitFor({ timeout: T });
  ok(true, 'senha mudada pelo Perfil (esta sessão continua)');

  // E-mail: com envio de e-mails, pede os 2 códigos; sem ele em produção, explica.
  await page.getByRole('button', { name: 'Mudar o e-mail' }).click();
  const dlg = page.getByRole('dialog', { name: 'Mudar o e-mail' });
  await dlg.getByLabel('E-mail novo').fill('perfil-' + Date.now() + '@teste.local');
  await dlg.getByLabel('A sua senha').fill(NEW_PW);
  await dlg.getByRole('button', { name: 'Enviar os códigos' }).click();
  await page.waitForTimeout(1500);
  const dlgText = await dlg.innerText();
  if (/ainda não está configurado/.test(dlgText)) {
    ok(true, 'sem envio de e-mails (produção): a mensagem explica e não muda nada');
  } else {
    await dlg.getByLabel('Código do e-mail actual').waitFor({ timeout: T });
    const codes = (dlgText.match(/(\d{6}) \/ (\d{6})/) || (await dlg.innerText()).match(/(\d{6}) \/ (\d{6})/));
    ok(Boolean(codes), 'pede um código do e-mail actual e outro do novo');
    if (codes) {
      await dlg.getByLabel('Código do e-mail actual').fill(codes[1]);
      await dlg.getByLabel('Código do e-mail novo').fill(codes[2]);
      await dlg.getByRole('button', { name: 'Confirmar' }).click();
      await page.getByText('E-mail mudado.').waitFor({ timeout: T });
      ok(true, 'e-mail mudado com os dois códigos');
    }
  }
  if (await dlg.isVisible()) await dlg.getByRole('button', { name: 'Cancelar' }).click();

  // Aniversario: uma vez; hoje = dia do aniversario.
  await page.getByLabel('Data de nascimento').fill(birthday);
  await page.getByRole('button', { name: 'Guardar' }).last().click();
  await page.getByText('Data de aniversário guardada.').waitFor({ timeout: T });
  await page.getByRole('button', { name: 'Para que serve' }).waitFor({ timeout: T });
  ok(!(await page.getByLabel('Data de nascimento').isVisible().catch(() => false)), 'depois de guardada, a data já não se edita');
  await page.getByRole('button', { name: 'Para que serve' }).click();
  ok(await page.getByText('Plano mensal: o mês de Premium começa no próximo ciclo').isVisible(), 'o «i» explica o presente (só depois de definida a data)');
  await page.getByRole('button', { name: 'Entendi' }).click();

  // Ao voltar a entrar no painel no dia: janela de parabens.
  await page.goto(BASE + '/app');
  const party = page.getByRole('dialog', { name: /Parabéns/ });
  await party.waitFor({ timeout: T });
  ok(await party.getByText('está à sua espera no Perfil').isVisible(), 'no dia do aniversário: janela de parabéns a apontar para o Perfil');
  await shot(page, '16-parabens');
  await party.getByRole('button', { name: 'Ver o presente' }).click();
  await page.getByRole('button', { name: 'Recolher o presente' }).click();
  await page.getByText(/Premium oferecido de .* \(começa no próximo ciclo/).waitFor({ timeout: T });
  ok(true, 'plano mensal: o mês de Premium fica marcado para o próximo ciclo da subscrição');
  ok(await page.getByLabel('Presente deste ano já recolhido').evaluate((el) => getComputedStyle(el).opacity === '0.3'), 'ícone do presente fica transparente');
  ok(!(await page.getByRole('button', { name: 'Recolher o presente' }).isVisible().catch(() => false)), 'não se recolhe duas vezes');
  await shot(page, '16-presente', true);
  await page.goto(BASE + '/app');
  await page.getByText('Hoje até agora').waitFor({ timeout: T });
  await page.waitForTimeout(2500);
  ok(!(await page.getByRole('dialog', { name: /Parabéns/ }).isVisible().catch(() => false)), 'depois de recolhido, a janela não volta a aparecer');

  // A senha nova serve para entrar.
  const c2 = await browser.newContext({ locale: 'pt-PT' });
  const p2 = await c2.newPage();
  watch(p2);
  const login = await p2.request.post(BASE + '/api/auth/login', { data: { email: (await page.request.get(BASE + '/api/profile').then((r) => r.json())).email, password: NEW_PW } });
  ok(login.status() === 200, 'entrar com a senha nova', login.status());
  await c2.close();
  await ctx.close();
} catch (e) {
  failures++;
  console.log('ERRO: ' + String(e.message).split(/\r?\n/)[0]);
  let i = 0;
  for (const c of browser.contexts()) for (const pg of c.pages()) { await shot(pg, 'erro-' + (++i)); console.log('  pagina ' + i + ': ' + pg.url()); }
} finally {
  await browser.close();
}
ok(errors.length === 0, '0 erros de JS', errors);
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os passos passaram.');
process.exit(failures ? 1 : 0);
