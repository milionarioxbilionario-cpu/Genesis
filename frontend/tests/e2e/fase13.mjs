// Fase 13: Inicio novo (hoje, meta, caixistas, ultimas vendas), numeros
// animados e modo privado. Loja "demo" (vendas do mes, meta, caixista):
//   (cd ../backend && node scripts/e2e_fixture.js create d.json demo)
//   BASE=http://localhost:5190 FIXTURE=d.json SHOTS=pasta node tests/e2e/fase13.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5190';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = path.resolve(process.env.SHOTS || 'shots-fase13');
fs.mkdirSync(SHOTS, { recursive: true });
const T = 90000; // daqui a BD responde em ~3 s por consulta
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }).catch(() => {});
const watch = (p) => {
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER|status of 4(01|03|23)/.test(m.text())) errors.push('console: ' + m.text()); });
};
const MONEY = /\d[\d\s.,]*,\d{2}\sMT|\d[\d\s.,]*\.\d{2}\sMT/;

async function login(page) {
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByText('Hoje até agora').waitFor({ timeout: T });
}

const browser = await chromium.launch();
try {
  // Computador.
  const ctx = await browser.newContext({ locale: 'pt-PT', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page);
  await login(page);
  ok(await page.getByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite), Ana$/ }).isVisible(), 'Início saúda pelo nome e pela hora («Boa tarde, Ana»)');
  for (const title of ['Hoje até agora', 'Caixistas agora', 'Últimas vendas']) ok(await page.getByText(title, { exact: true }).first().isVisible(), `Início tem «${title}»`);
  ok(await page.getByText(/^Meta de /).first().isVisible(), 'Início tem a meta do mês');
  // Nada repetido de outras paginas: stock baixo, chenecas e validades vivem no sino.
  for (const gone of ['Stock baixo', 'Chenecas a cobrar', 'Últimos 7 dias']) ok(!(await page.getByText(gone, { exact: true }).count()), `sem «${gone}» no Início (sem repetir informação)`);
  // Contador: comeca em baixo e termina no valor certo.
  const hero = page.locator('section[aria-label="Hoje até agora"] [data-value]').first();
  await page.waitForTimeout(1500);
  const final = await hero.evaluate((el) => ({ shown: el.textContent, cents: Number(el.dataset.value) }));
  const expected = (final.cents / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' }) + ' MT';
  ok(final.shown === expected, 'número de hoje acaba no valor certo depois de subir', final);
  const states = await page.locator('[data-shift]').evaluateAll((els) => els.map((e) => e.dataset.shift));
  ok(states.length >= 1 && states.every((s) => ['working', 'closed', 'not_started', 'locked', 'short'].includes(s)), 'cada caixista com um estado do turno', states);
  await shot(page, '13-inicio-pc');

  // Modo privado.
  await page.getByRole('button', { name: 'Esconder valores' }).click();
  await page.getByText('Modo privado: os valores estão escondidos').waitFor({ timeout: T });
  const mainText = await page.locator('main').innerText();
  ok(!MONEY.test(mainText) && mainText.includes('•••• MT'), 'modo privado: nenhum valor em MT à vista no Início', mainText.match(MONEY)?.[0]);
  await shot(page, '13-inicio-privado');
  await page.goto(BASE + '/app/relatorios');
  await page.waitForTimeout(2500);
  ok(!MONEY.test(await page.locator('main').innerText()), 'modo privado continua nos Relatórios');
  await page.goto(BASE + '/app/produtos');
  await page.waitForTimeout(2500);
  ok(!MONEY.test(await page.locator('main').innerText()), 'modo privado continua nos Produtos (preços e custos)');
  await page.reload();
  const still = await page.getByRole('button', { name: 'Mostrar valores' }).waitFor({ timeout: T }).then(() => true, () => false);
  ok(still, 'modo privado fica ligado depois de recarregar');
  await page.getByRole('button', { name: 'Mostrar valores' }).click();
  await page.waitForFunction((re) => new RegExp(re).test(document.querySelector('main')?.innerText || ''), MONEY.source, { timeout: T }).catch(() => {});
  ok(MONEY.test(await page.locator('main').innerText()), 'desligar o modo privado: os valores voltam');
  await ctx.close();

  // Sem animacao para quem pediu menos movimento.
  const rm = await browser.newContext({ locale: 'pt-PT', reducedMotion: 'reduce' });
  const rp = await rm.newPage();
  watch(rp);
  await login(rp);
  const anim = await rp.locator('.reveal').first().evaluate((el) => getComputedStyle(el).animationName);
  ok(anim === 'none', 'prefers-reduced-motion: os cartões não animam', anim);
  const v0 = await rp.locator('section[aria-label="Hoje até agora"] [data-value]').first().evaluate((el) => ({ shown: el.textContent, cents: Number(el.dataset.value) }));
  ok(v0.shown === (v0.cents / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' }) + ' MT', 'prefers-reduced-motion: o número aparece logo certo (sem contar)', v0);
  await rm.close();

  // Telemovel.
  const mob = await browser.newContext({ locale: 'pt-PT', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const mp = await mob.newPage();
  watch(mp);
  await login(mp);
  await mp.waitForTimeout(1500);
  ok(!(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), 'telemóvel: Início sem deslocamento horizontal');
  await shot(mp, '13-inicio-telemovel');
  await mob.close();
} catch (e) {
  failures++;
  console.log('ERRO: ' + String(e.message).split(/\r?\n/)[0]);
  let i = 0;
  for (const c of browser.contexts()) {
    for (const pg of c.pages()) {
      await shot(pg, 'erro-' + (++i));
      console.log('  pagina ' + i + ': ' + pg.url() + ' | ' + (await pg.locator('body').innerText().catch(() => '')).slice(0, 300).replace(/\s+/g, ' '));
    }
  }
} finally {
  await browser.close();
}
ok(errors.length === 0, '0 erros de JS', errors);
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os passos passaram.');
process.exit(failures ? 1 : 0);
