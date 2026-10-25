// Fase 12 (25/10/2026): os defeitos que o fundador viu no iPhone.
//   12.1 botao Google nao pisca ao mudar de lingua
//   12.2 terminal arranca SEM rede (perfis guardados + PIN confirmado no aparelho)
//   12.3 painel do dono sem rede = dados guardados, so consulta
//   12.4 bloqueio do painel: PIN ao reabrir, 5 min parado, Face ID (autenticador virtual)
//   12.5 telemovel / tablet / computador no terminal
// So com o build real (service worker):
//   npm run build && GENESIS_API_URL=http://127.0.0.1:4100 npx vite preview --port 5190 --strictPort
//   (cd ../backend && node scripts/e2e_fixture.js create f.json) ; idem com "sempin" para g.json
//   BASE=http://localhost:5190 FIXTURE=f.json FIXTURE_SEMPIN=g.json SHOTS=pasta node tests/e2e/fase12.mjs
//   (ENGINE=webkit para correr no motor do Safari, sem a parte do Face ID)
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5190';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const fxNoPin = process.env.FIXTURE_SEMPIN ? JSON.parse(fs.readFileSync(process.env.FIXTURE_SEMPIN, 'utf8')) : null;
const SHOTS = path.resolve(process.env.SHOTS || 'shots-fase12');
const ENGINE = process.env.ENGINE === 'webkit' ? webkit : chromium;
const IS_WEBKIT = process.env.ENGINE === 'webkit';
fs.mkdirSync(SHOTS, { recursive: true });
const T = 30000; // BD em Frankfurt a partir de Maputo: pedidos de varios segundos
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (p, n) => p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: false }).catch(() => {});
const watch = (p) => {
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => {
    // Sem rede o browser queixa-se de cada pedido que falha: e o que se esta a testar.
    if (m.type() === 'error' && !/Failed to load resource|net::ERR|GSI_LOGGER|status of 4(01|03|23)|Failed to fetch|NetworkError|Load failed|WebKitBlobResource/.test(m.text())) errors.push('console: ' + m.text());
  });
};

// GSI falso: desenha um iframe por lingua, que so "carrega" 400 ms depois (como o verdadeiro).
const FAKE_GSI = `window.google={accounts:{id:{
  initialize(){ window.__gsiInits=(window.__gsiInits||0)+1; },
  renderButton(el,o){ const f=document.createElement('iframe'); f.style.width='340px'; f.style.height='40px'; f.style.border='0';
    f.dataset.locale=o.locale; el.appendChild(f);
    setTimeout(()=>{ f.srcdoc='<button>'+(o.locale==='en'?'Continue with Google':'Continuar com a Google')+'</button>'; }, 400); }
}}};`;

async function login(page, who) {
  await page.goto(BASE + '/entrar');
  await page.getByLabel('Email').fill(who.owner.email);
  await page.getByLabel('Senha').fill(who.owner.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
// 1.a entrada do caixista: pergunta pela impressora/leitor. O teste salta.
async function skipDevices(p) {
  const b = p.getByRole('button', { name: 'Não tenho — saltar' });
  await b.waitFor({ timeout: 5000 }).catch(() => {});
  if (await b.count()) await b.click();
}
// No WebKit do Playwright (Windows) o reload sem rede da erro interno; navegar para o mesmo endereco e equivalente.
const reopen = (p) => (IS_WEBKIT ? p.goto(p.url()) : p.reload());
const typePin = async (page, pin) => { for (const d of pin) await page.getByRole('button', { name: d, exact: true }).click(); };

const browser = await ENGINE.launch();
try {
  // ------------------------------------------------------------ 12.1 Google
  {
    const ctx = await browser.newContext({ locale: 'pt-PT' });
    await ctx.route('https://accounts.google.com/gsi/client', (r) => r.fulfill({ contentType: 'text/javascript', body: FAKE_GSI }));
    const page = await ctx.newPage();
    watch(page);
    await page.goto(BASE + '/entrar');
    await page.waitForFunction(() => document.querySelectorAll('iframe').length === 1, null, { timeout: T });
    await page.waitForTimeout(600);
    // Conta, a cada frame, quantos botoes do Google estao VISIVEIS ao mesmo tempo.
    await page.evaluate(() => {
      window.__max = 0;
      const tick = () => {
        const n = [...document.querySelectorAll('iframe')].filter((f) => {
          const r = f.getBoundingClientRect();
          return r.width > 0 && getComputedStyle(f).visibility !== 'hidden' && getComputedStyle(f.parentElement).visibility !== 'hidden';
        }).length;
        window.__max = Math.max(window.__max, n);
        requestAnimationFrame(tick);
      };
      tick();
    });
    for (let i = 0; i < 5; i++) {
      await page.getByRole('radio', { name: i % 2 === 0 ? 'EN' : 'PT', exact: true }).first().click();
      await page.waitForTimeout(700);
    }
    const r = await page.evaluate(() => ({ max: window.__max, frames: document.querySelectorAll('iframe').length, locale: document.querySelector('iframe')?.dataset.locale, inits: window.__gsiInits }));
    ok(r.max === 1, '5 trocas PT↔EN: nunca aparecem 2 botões do Google ao mesmo tempo', r);
    ok(r.frames === 1 && r.locale === 'en', 'no fim fica 1 só botão, na língua escolhida (EN)', r);
    ok(r.inits === 1, 'o Google é inicializado uma só vez', r);
    await ctx.close();
  }

  // ------------------------------------------------- 12.4 criar PIN + Face ID
  if (fxNoPin) {
    const ctx = await browser.newContext({ locale: 'pt-PT' });
    const page = await ctx.newPage();
    watch(page);
    let cdp = null;
    if (!IS_WEBKIT) {
      cdp = await ctx.newCDPSession(page);
      await cdp.send('WebAuthn.enable');
      await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
    }
    await login(page, fxNoPin);
    await page.getByRole('heading', { name: 'Crie o PIN do seu painel' }).waitFor({ timeout: T });
    ok(true, 'dono sem PIN: depois do login o painel obriga a criar o PIN');
    await shot(page, '12-4-criar-pin');
    await typePin(page, '2580');
    await page.getByRole('heading', { name: 'Confirme o PIN' }).waitFor({ timeout: T });
    await typePin(page, '2589');
    await page.getByText('Os PINs não coincidem').waitFor({ timeout: T });
    ok(true, 'confirmação diferente: recusa e recomeça');
    await typePin(page, '2580');
    await typePin(page, '2580');
    if (!IS_WEBKIT) {
      await page.getByRole('heading', { name: 'Usar Face ID / impressão digital?' }).waitFor({ timeout: T });
      ok(true, 'aparelho com Face ID/impressão digital: oferece activar');
      await shot(page, '12-4-face-id');
      await page.getByRole('button', { name: 'Activar neste aparelho' }).click();
      await page.waitForTimeout(3000);
      const alertText = await page.locator('[role=alert], .text-danger').allInnerTexts().catch(() => []);
      if (alertText.length) console.log('  (aviso no ecra: ' + alertText.join(' | ') + ')');
      await shot(page, '12-4-face-id-depois');
    }
    await page.getByRole('heading', { name: 'Início' }).first().waitFor({ timeout: T });
    ok(true, 'PIN criado: entra no Início');
    if (!IS_WEBKIT) {
      // Reabrir a app = sessionStorage vazio (no mesmo separador: o autenticador virtual e por separador).
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      await page.getByRole('heading', { name: 'Painel bloqueado' }).waitFor({ timeout: T });
      ok(await page.getByRole('button', { name: 'Usar Face ID / impressão digital' }).isVisible(), 'reabrir: painel bloqueado com o botão do Face ID');
      await page.getByRole('button', { name: 'Usar Face ID / impressão digital' }).click();
      await page.getByRole('heading', { name: 'Início' }).first().waitFor({ timeout: T });
      ok(true, 'Face ID (autenticador virtual): desbloqueia');
    }
    await ctx.close();
  }

  // ------------------------------------------------------- 12.4 bloqueio
  const ownerCtx = await browser.newContext({ locale: 'pt-PT' });
  const owner = await ownerCtx.newPage();
  watch(owner);
  await login(owner, fx);
  await owner.getByRole('heading', { name: 'Início' }).first().waitFor({ timeout: T });
  ok(true, 'login com email e senha: o painel abre sem pedir o PIN');
  // Separador novo = app reaberta: o cookie da sessao continua la, mas o painel pede o PIN.
  const again = await ownerCtx.newPage();
  watch(again);
  await again.goto(BASE + '/app');
  await again.getByRole('heading', { name: 'Painel bloqueado' }).waitFor({ timeout: T });
  ok(!(await again.getByText('Hoje até agora').isVisible().catch(() => false)), 'app reaberta com os mesmos cookies: painel bloqueado, nenhum número à vista');
  await shot(again, '12-4-bloqueado');
  await typePin(again, '0000');
  await again.getByText(/Restam 4 tentativa/).waitFor({ timeout: T });
  ok(true, 'PIN errado: «Restam 4 tentativa(s)»');
  await typePin(again, fx.lockPin);
  await again.getByRole('heading', { name: 'Início' }).first().waitFor({ timeout: T });
  ok(true, 'PIN certo: desbloqueia');
  await again.close();

  // 5 minutos sem mexer.
  const idleCtx = await browser.newContext({ locale: 'pt-PT' });
  const idle = await idleCtx.newPage();
  watch(idle);
  await idle.clock.install();
  await login(idle, fx);
  await idle.getByRole('heading', { name: 'Início' }).first().waitFor({ timeout: T });
  await idle.clock.fastForward('05:30');
  await idle.getByRole('heading', { name: 'Painel bloqueado' }).waitFor({ timeout: T });
  ok(true, '5 minutos sem tocar: o painel volta a bloquear');
  await idleCtx.close();

  // ------------------------------------------------------- 12.2 terminal
  // Passaram minutos desde o login: o painel pode ter voltado a bloquear (e o que se quer).
  await ownerCtx.request.post(BASE + '/api/lock/unlock', { data: { pin: fx.lockPin } });
  const code = await ownerCtx.request.post(BASE + '/api/owner/terminals/pairing-code', { data: { name: 'Balcão Fase 12' } });
  ok(code.status() === 201, 'dono gera o código de emparelhamento', code.status());
  const termCtx = await browser.newContext({ locale: 'pt-PT', viewport: { width: 390, height: 844 }, isMobile: !IS_WEBKIT, hasTouch: true });
  const term = await termCtx.newPage();
  watch(term);
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill((await code.json()).code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByText('Quem está a vender?').waitFor({ timeout: T });
  await term.evaluate(() => navigator.serviceWorker.ready);
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).click();
  await typePin(term, fx.cashier.pin);
  await term.getByPlaceholder('Pesquisar ou ler código de barras').waitFor({ timeout: T });
  await skipDevices(term);
  ok(true, 'caixista entra com rede (o PIN fica guardado para sem rede)');

  // 12.5 telemovel: barra em baixo, cesto por cima, Cobrar visivel.
  const vh = 844;
  ok(!(await term.getByRole('heading', { name: 'Venda actual' }).isVisible()), 'telemóvel: o cesto não ocupa o ecrã dos produtos');
  await term.getByRole('button', { name: /2M 340ml/ }).click();
  await term.getByRole('button', { name: /2M 340ml/ }).click();
  const bar = term.getByRole('button', { name: /2 artigo\(s\)/ });
  await bar.waitFor({ timeout: T });
  const bb = await bar.boundingBox();
  ok(bb && bb.y + bb.height <= vh, 'telemóvel: barra «2 artigo(s) · 120,00 MT» dentro do ecrã', bb);
  await shot(term, '12-5-telemovel-produtos');
  await bar.click();
  const charge = term.getByRole('button', { name: /Cobrar 120,00 MT/ });
  await charge.waitFor({ timeout: T });
  const cb = await charge.boundingBox();
  ok(cb && cb.y + cb.height <= vh, 'telemóvel: o botão Cobrar fica dentro do ecrã (não atrás da barra do Safari)', cb);
  await shot(term, '12-5-telemovel-cesto');
  await charge.click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  await term.getByRole('button', { name: 'Nova venda' }).click();
  ok(true, 'telemóvel: venda feita com rede');
  await term.getByRole('button', { name: 'Bloquear terminal' }).click();
  await term.getByText('Quem está a vender?').waitFor({ timeout: T });

  // Sem rede, a frio: recarregar a pagina.
  await termCtx.setOffline(true);
  await reopen(term);
  await term.getByText('Sem ligação à internet').waitFor({ timeout: T });
  ok(await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).isVisible(), 'sem rede e a frio: o terminal abre com os perfis guardados');
  await shot(term, '12-2-offline-perfis');
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).click();
  await typePin(term, '1111');
  await term.getByText(/Restam 4 tentativa/).waitFor({ timeout: T });
  ok(true, 'sem rede: PIN errado recusado no aparelho');
  await typePin(term, fx.cashier.pin);
  await term.getByPlaceholder('Pesquisar ou ler código de barras').waitFor({ timeout: T });
  await skipDevices(term);
  ok(true, 'sem rede: PIN certo abre o ecrã de vendas');
  await term.getByRole('button', { name: /Coca-Cola 500ml/ }).click();
  await term.getByRole('button', { name: /1 artigo\(s\)/ }).click();
  await term.getByRole('button', { name: /Cobrar 45,00 MT/ }).click();
  await term.getByText('Sem ligação: venda guardada neste terminal').waitFor({ timeout: T });
  ok(true, 'sem rede: venda guardada no aparelho');
  await shot(term, '12-2-offline-venda');
  await term.getByRole('button', { name: 'Nova venda' }).click().catch(() => {});
  await termCtx.setOffline(false);
  // A fila envia pelo cookie do terminal (sem sessao do caixista).
  let synced = false;
  for (let i = 0; i < 30 && !synced; i++) {
    const r = await ownerCtx.request.get(BASE + '/api/sales?limit=50');
    const list = r.ok() ? await r.json() : null;
    const rows = Array.isArray(list) ? list : (list?.sales || list?.items || []);
    synced = rows.some((s) => s.total_amount === 4500);
    if (!synced) await term.waitForTimeout(2000);
  }
  ok(synced, 'rede de volta: a venda feita sem rede chega ao servidor');

  // 12.5 tablet: as duas colunas lado a lado.
  const tab = await browser.newContext({ locale: 'pt-PT', viewport: { width: 820, height: 1180 }, storageState: await termCtx.storageState() });
  const tp = await tab.newPage();
  watch(tp);
  await tp.goto(BASE + '/terminal');
  await tp.getByRole('button', { name: new RegExp(fx.cashier.name) }).click();
  await typePin(tp, fx.cashier.pin);
  await skipDevices(tp);
  await tp.getByRole('heading', { name: 'Venda actual' }).waitFor({ timeout: T });
  const aside = await tp.getByRole('heading', { name: 'Venda actual' }).boundingBox();
  const grid = await tp.getByRole('button', { name: /2M 340ml/ }).boundingBox();
  ok(aside && grid && aside.x > grid.x + grid.width, 'tablet (820 px): produtos e cesto lado a lado', { aside, grid });
  await shot(tp, '12-5-tablet');
  await tab.close();
  await termCtx.close();

  // ------------------------------------------------------- 12.3 dono sem rede
  await owner.goto(BASE + '/app');
  await owner.getByRole('heading', { name: /^(Início|Painel bloqueado)$/ }).first().waitFor({ timeout: T });
  if (await owner.getByRole('heading', { name: 'Painel bloqueado' }).isVisible()) await typePin(owner, fx.lockPin);
  await owner.getByRole('heading', { name: 'Início' }).first().waitFor({ timeout: T });
  await owner.goto(BASE + '/app/produtos');
  await owner.getByText('2M 340ml').first().waitFor({ timeout: T });
  await ownerCtx.setOffline(true);
  await reopen(owner);
  await owner.getByRole('heading', { name: 'Painel bloqueado' }).waitFor({ timeout: T });
  ok(await owner.getByText('depois de desbloquear vê os dados guardados').isVisible(), 'dono sem rede: pede o PIN e avisa que é só consulta');
  await typePin(owner, fx.lockPin);
  await owner.getByText('2M 340ml').first().waitFor({ timeout: T });
  ok(await owner.getByText('Só consulta').isVisible(), 'dono sem rede: PIN confirmado no aparelho, produtos guardados à vista com o aviso «Só consulta»');
  await shot(owner, '12-3-dono-offline');
  await ownerCtx.setOffline(false);
  await ownerCtx.close();
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
