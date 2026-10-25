// Capturas reais da app para o site publico (Fase 11.3), em PT e EN, numa loja
// de demonstracao criada e apagada por script:
//   (cd backend && node scripts/e2e_fixture.js create demo.json demo)
//   BASE=http://localhost:5180 FIXTURE=demo.json node scripts/capturas_site.mjs
//   (cd backend && node scripts/e2e_fixture.js delete demo.json)
// Escreve public/site/shots/<ecra>-<lingua>.webp + shots.json (dimensoes que o
// gerador poe no <img>). Depois: node scripts/gerar_site.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5180';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'site', 'shots');
const T = 120000;
fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
const errors = [];

const browser = await chromium.launch();
const converter = await browser.newPage();

// PNG do Playwright -> WebP pelo canvas do proprio Chromium (sem ferramentas extra).
async function save(png, key) {
  const { data, width, height } = await converter.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return { data: c.toDataURL('image/webp', 0.82).split(',')[1], width: c.width, height: c.height };
  }, png.toString('base64'));
  const file = key + '.webp';
  fs.writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'));
  manifest[key] = { file, width, height };
  console.log(`  ${file} ${width}x${height} ${Math.round(Buffer.from(data, 'base64').length / 1024)} KB`);
}

const watch = (page) => {
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER/.test(m.text())) errors.push(m.text()); });
};

async function ownerContext(lang, opts) {
  const ctx = await browser.newContext({ locale: lang === 'pt' ? 'pt-PT' : 'en-GB', ...opts });
  await ctx.addInitScript((l) => { try { localStorage.setItem('genesis.lang', l); } catch {} }, lang);
  const page = await ctx.newPage();
  watch(page);
  await page.goto(BASE + '/entrar');
  await page.getByLabel(/^(Email)$/).fill(fx.owner.email);
  await page.getByLabel(/^(Senha|Password)$/).fill(fx.owner.password);
  await page.getByRole('button', { name: /^(Entrar|Sign in)$/ }).click();
  await page.waitForURL(/\/app/, { timeout: T });
  // A lingua da conta manda sobre a do aparelho: grava-a e recarrega.
  await page.evaluate((l) => fetch('/api/auth/language', { method: 'PUT', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: l }) }), lang);
  await page.reload();
  await page.waitForLoadState('networkidle', { timeout: T });
  return { ctx, page };
}

try {
  for (const lang of ['pt', 'en']) {
    console.log(`\n=== ${lang} ===`);
    const L = (pt, en) => (lang === 'pt' ? pt : en);

    // Painel do dono (computador).
    const { ctx, page } = await ownerContext(lang, { viewport: { width: 1440, height: 900 } });
    await page.getByText(L('Meta do mês', 'Monthly goal')).first().waitFor({ timeout: T });
    await page.waitForTimeout(800); // o grafico desenha-se depois dos dados
    await save(await page.screenshot(), `inicio-${lang}`);

    await page.getByRole('button', { name: L(/Notificações/, /Notifications/) }).click();
    await page.getByRole('dialog').waitFor({ timeout: T });
    await page.waitForLoadState('networkidle', { timeout: T });
    await page.waitForTimeout(400);
    await save(await page.screenshot(), `alertas-${lang}`);
    await page.keyboard.press('Escape');

    await page.goto(BASE + '/app/relatorios');
    await page.getByRole('tab', { name: L('Mensal', 'Monthly') }).click();
    await page.waitForLoadState('networkidle', { timeout: T });
    await page.waitForTimeout(800);
    await save(await page.screenshot(), `mensal-${lang}`);

    // Codigo para emparelhar o terminal.
    await page.goto(BASE + '/app/definicoes?tab=terminals');
    await page.getByRole('button', { name: L('Emparelhar terminal', 'Pair terminal') }).click();
    await page.getByLabel(L('Nome do terminal', 'Terminal name')).fill(L('Balcão principal', 'Main counter'));
    await page.getByRole('button', { name: L('Gerar código', 'Generate code') }).click();
    const codeEl = page.locator('p.num.text-2xl');
    await codeEl.waitFor({ timeout: T });
    const code = (await codeEl.textContent()).trim();
    await ctx.close();

    // Telemovel: inicio do dono.
    const phone = await ownerContext(lang, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await phone.page.getByText(L('Meta do mês', 'Monthly goal')).first().waitFor({ timeout: T });
    await phone.page.waitForTimeout(800);
    await save(await phone.page.screenshot(), `telemovel-${lang}`);
    await phone.ctx.close();

    // Terminal do balcao com um cesto.
    const tctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: lang === 'pt' ? 'pt-PT' : 'en-GB' });
    await tctx.addInitScript((l) => { try { localStorage.setItem('genesis.lang', l); } catch {} }, lang);
    const term = await tctx.newPage();
    watch(term);
    await term.goto(BASE + '/terminal');
    await term.getByLabel(L('Código de emparelhamento', 'Pairing code')).fill(code);
    await term.getByRole('button', { name: L('Emparelhar', 'Pair') }).click();
    await term.getByRole('button', { name: /Carlos/ }).click({ timeout: T });
    await term.keyboard.type(fx.cashier.pin);
    // Depois do PIN manda a lingua da conta do caixista: troca no proprio terminal.
    await term.getByText(/Venda actual|Current sale/).waitFor({ timeout: T });
    const skip = term.getByRole('button', { name: /Não tenho — saltar|I don't have one — skip/ });
    if (await skip.count()) await skip.click();
    // (a troca fica gravada na conta: a corrida seguinte pode abrir na outra lingua)
    if (!(await term.getByText(L('Venda actual', 'Current sale')).count())) {
      await term.getByRole('button', { name: /^(Língua|Language): / }).click();
      await term.getByText(L('Venda actual', 'Current sale')).waitFor({ timeout: T });
    }
    for (const [name, n] of [['Laurentina Preta 550ml', 2], ['Castle Lager 340ml', 3], ['Coca-Cola 500ml', 1]]) {
      for (let i = 0; i < n; i++) await term.getByRole('button', { name: new RegExp(name) }).first().click();
    }
    await term.waitForTimeout(400);
    await save(await term.screenshot(), `terminal-${lang}`);
    await tctx.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(errors.length ? `\nErros de JS: ${errors.length}\n${errors.join('\n')}` : '\nErros de JS: 0');
process.exit(errors.length ? 1 : 0);
