// Fase 15.1: recibo profissional — logotipo, NUIT, mensagem, codigo de barras, QR.
//   (cd ../backend && node scripts/e2e_fixture.js create f.json)
//   BASE=http://localhost:5190 FIXTURE=f.json SHOTS=pasta node tests/e2e/fase15.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5190';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = path.resolve(process.env.SHOTS || 'shots-fase15');
fs.mkdirSync(SHOTS, { recursive: true });
const T = 60000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (p, n, full = false) => p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }).catch(() => {});
const watch = (p) => {
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER|status of 4(01|03|23)/.test(m.text())) errors.push('console: ' + m.text()); });
};
const typePin = async (p, pin) => { for (const d of pin) await p.getByRole('button', { name: d, exact: true }).click(); };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ locale: 'pt-PT', viewport: { width: 1440, height: 900 } });
  const owner = await ctx.newPage();
  watch(owner);
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar', exact: true }).click();
  await owner.getByText('Hoje até agora').waitFor({ timeout: T });

  // Logotipo desenhado no proprio browser (um «G» verde num quadrado), como PNG.
  const png = await owner.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 200;
    const g = c.getContext('2d');
    g.fillStyle = '#0B4D3B'; g.fillRect(0, 0, 200, 200);
    g.fillStyle = '#FFFFFF'; g.font = 'bold 140px sans-serif'; g.fillText('G', 52, 150);
    g.fillStyle = '#111'; g.font = 'bold 60px sans-serif'; g.fillText('Bar', 220, 120);
    return c.toDataURL('image/png').split(',')[1];
  });
  await owner.goto(BASE + '/app/definicoes?tab=store');
  await owner.getByText('Logótipo e recibo').waitFor({ timeout: T });
  ok(await owner.getByText('não uma fotografia sua').isVisible(), 'aviso: usar o logótipo do estabelecimento, não uma foto pessoal');
  await owner.getByLabel('NUIT (opcional)').fill('400123456');
  await owner.getByLabel('Mensagem no fim do recibo').fill('Volte sempre! Aberto todos os dias.');
  await owner.getByRole('button', { name: 'Guardar' }).first().click();
  await owner.getByText('Alterações guardadas.').waitFor({ timeout: T });
  await owner.locator('input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await owner.getByText('Logótipo guardado').waitFor({ timeout: T });
  ok(await owner.getByRole('img', { name: 'Logótipo do estabelecimento' }).isVisible(), 'logótipo carregado e mostrado');
  const frame = owner.frameLocator('iframe[title="Pré-visualização do recibo"]');
  await frame.locator('.shop').waitFor({ timeout: T });
  const prev = await frame.locator('body').innerText();
  ok(prev.includes('NUIT 400123456') && prev.includes('Volte sempre! Aberto todos os dias.') && prev.includes('RECIBO'), 'pré-visualização com NUIT, mensagem e «RECIBO»', prev.slice(0, 200));
  ok(await frame.locator('img.logo').count() === 1 && await frame.locator('.codes svg rect').count() > 20, 'pré-visualização com o logótipo e o código de barras');
  await owner.locator('iframe[title="Pré-visualização do recibo"]').scrollIntoViewIfNeeded();
  await shot(owner, '15-definicoes-recibo');

  // Terminal: a venda imprime o recibo novo (PDF guardado no aparelho).
  await owner.request.post(BASE + '/api/lock/unlock', { data: { pin: fx.lockPin } });
  const code = await (await owner.request.post(BASE + '/api/owner/terminals/pairing-code', { data: { name: 'Balcão recibo' } })).json();
  const tctx = await browser.newContext({ locale: 'pt-PT', viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  const term = await tctx.newPage();
  watch(term);
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code.code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).click();
  await typePin(term, fx.cashier.pin);
  const skip = term.getByRole('button', { name: 'Não tenho — saltar' });
  await skip.waitFor({ timeout: 8000 }).catch(() => {});
  if (await skip.count()) await skip.click();
  await term.getByRole('button', { name: /Coca-Cola 500ml/ }).click();
  await term.getByRole('button', { name: /Cobrar 45,00 MT/ }).click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  const dl = term.waitForEvent('download', { timeout: T }).catch(() => null);
  await term.getByRole('button', { name: /Imprimir/ }).first().click();
  const file = await dl;
  ok(Boolean(file) && /^Recibo_\d{3} - Bottle Store Central .*\.pdf$/.test(file.suggestedFilename()), 'recibo em PDF guardado no aparelho', file?.suggestedFilename());
  if (file) {
    const out = path.join(SHOTS, 'recibo.pdf');
    await file.saveAs(out);
    const pdf = fs.readFileSync(out);
    ok(pdf.length > 3000 && pdf.toString('latin1').includes('/Subtype /Image'), 'o PDF leva imagens (logótipo e QR)', pdf.length);
  }
  await shot(term, '15-terminal-recibo');
  await tctx.close();
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
