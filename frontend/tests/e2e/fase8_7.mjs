// Fase 8.7 (pedido do fundador 10/10/2026): Definicoes > Loja > «Relatórios
// por WhatsApp» — hora do diario, dia + hora do semanal, hora do mensal; a
// ajuda diz que periodo cada hora cobre; envio automatico ainda desligado.
//   BASE=http://localhost:5180 FIXTURE=f.json SHOTS=pasta node tests/e2e/fase8_7.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = process.env.SHOTS || 'shots';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 120000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + extra : '')); } };
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(`[${label}] console: ${m.text()}`); });
}
async function login(page) {
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(fx.owner.email);
  await page.getByLabel('Senha').fill(fx.owner.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/app', { timeout: T });
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  const page = await ctx.newPage();
  watch(page, 'dono');
  await login(page);
  await page.goto(BASE + '/app/definicoes?tab=store');
  await page.getByText('Relatórios por WhatsApp').waitFor({ timeout: T });
  ok(await page.getByText('O envio automático ainda não está ligado.', { exact: false }).isVisible(), 'avisa que o envio automático ainda não está ligado');
  ok(await page.getByLabel('Diário — hora').inputValue() === '21:00' && await page.getByLabel('Semanal — dia').inputValue() === '1', 'por defeito: diário 21:00, semanal à segunda');
  ok(await page.getByText('Às 21:00 recebe o relatório de hoje, até essa hora.').isVisible(), 'ajuda: 21:00 = hoje até essa hora');
  await page.getByLabel('Diário — hora').fill('00:00');
  ok(await page.getByText('Às 00:00 recebe o relatório de ontem, completo.').isVisible(), 'ajuda: 00:00 = ontem completo (exemplo do fundador)');
  await page.getByLabel('Semanal — dia').selectOption('5');
  await page.getByLabel('Semanal — hora').fill('18:30');
  await page.getByLabel('Mensal — hora').fill('07:15');
  await page.screenshot({ path: path.join(SHOTS, 'r1-relatorios-whatsapp.png') });
  await page.getByRole('button', { name: 'Guardar horários' }).click();
  await page.getByText('Horários dos relatórios guardados.').waitFor({ timeout: T });
  await page.reload();
  await page.getByText('Relatórios por WhatsApp').waitFor({ timeout: T });
  ok(await page.getByLabel('Diário — hora').inputValue() === '00:00' && await page.getByLabel('Semanal — dia').inputValue() === '5' && await page.getByLabel('Semanal — hora').inputValue() === '18:30' && await page.getByLabel('Mensal — hora').inputValue() === '07:15', 'depois de recarregar: 00:00, sexta 18:30, mensal 07:15');
  const st = await page.evaluate(async () => (await fetch('/api/settings', { credentials: 'include' })).json());
  ok(st.report_schedule.weekly_report_day === 5 && st.report_schedule.daily_report_time === '00:00', 'servidor gravou (sexta = 5)');

  const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT' });
  const phone = await phoneCtx.newPage();
  watch(phone, 'iphone');
  await login(phone);
  await phone.goto(BASE + '/app/definicoes?tab=store');
  await phone.getByText('Relatórios por WhatsApp').waitFor({ timeout: T });
  await phone.getByText('Relatórios por WhatsApp').scrollIntoViewIfNeeded();
  const w = await phone.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(w[0] <= w[1], 'cabe nos 390 px', w.join(' > '));
  await phone.screenshot({ path: path.join(SHOTS, 'r2-iphone.png') });
} catch (e) {
  failures++;
  console.log('ERRO: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('\nErros de JavaScript no browser: ' + errors.length);
for (const e of errors.slice(0, 20)) console.log('  ' + e);
console.log(failures === 0 && errors.length === 0 ? 'RESULTADO: horarios dos relatorios passou' : `RESULTADO: ${failures} falha(s), ${errors.length} erro(s) de JS`);
process.exit(failures === 0 && errors.length === 0 ? 0 : 1);
