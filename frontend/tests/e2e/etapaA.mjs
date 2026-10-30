// Etapa A: barra recolhivel, IVA/INSS escritos, terminais (novo codigo, perfis,
// reactivar, eliminar), pedido personalizado no terminal, fecho recusado no sino
// e no rastreio, caixistas no relatorio.
//   (cd ../backend && node scripts/e2e_fixture.js create f.json)
//   BASE=http://localhost:5190 FIXTURE=f.json SHOTS=pasta node tests/e2e/etapaA.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5190';
const fx = JSON.parse(fs.readFileSync(process.env.FIXTURE, 'utf8'));
const SHOTS = path.resolve(process.env.SHOTS || 'shots-etapaA');
fs.mkdirSync(SHOTS, { recursive: true });
const T = 60000;
let failures = 0;
const errors = [];
const ok = (c, m, extra) => { if (c) console.log('  OK    ' + m); else { failures++; console.log('  FALHA ' + m + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const shot = (p, n, full = false) => p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }).catch(() => {});
const watch = (p) => {
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GSI_LOGGER|status of 4(0[0-9]|1[0-9]|2[0-9])/.test(m.text())) errors.push('console: ' + m.text()); });
};
const typePin = async (p, pin) => { for (const d of pin) await p.getByRole('button', { name: d, exact: true }).click(); };

const browser = await chromium.launch();
try {
  // Contra o backend local (Maputo -> Supabase em Frankfurt) as paginas podem levar >30 s.
  const ctx = await browser.newContext({ locale: 'pt-PT', viewport: { width: 1280, height: 860 } });
  ctx.setDefaultTimeout(T);
  const owner = await ctx.newPage();
  watch(owner);
  await owner.goto(BASE + '/entrar');
  await owner.getByLabel('Email').fill(fx.owner.email);
  await owner.getByLabel('Senha').fill(fx.owner.password);
  await owner.getByRole('button', { name: 'Entrar', exact: true }).click();
  await owner.getByText('Hoje até agora').waitFor({ timeout: T });

  // A4: barra lateral recolhivel, lembrada no aparelho.
  const aside = owner.locator('aside').first();
  const wide = (await aside.boundingBox())?.width || 0;
  await owner.getByRole('button', { name: 'Esconder o menu' }).click();
  await owner.waitForTimeout(400);
  const narrow = (await aside.boundingBox())?.width || 0;
  ok(wide > 200 && narrow < 80, 'barra lateral recolhe para só os ícones', { wide, narrow });
  await shot(owner, 'A4-barra-recolhida');
  await owner.reload();
  await owner.getByText('Hoje até agora').waitFor({ timeout: T });
  ok(((await owner.locator('aside').first().boundingBox())?.width || 0) < 80, 'continua recolhida depois de recarregar');
  await owner.getByRole('button', { name: 'Mostrar o menu' }).click();

  // A5: IVA 15% e INSS 2% escritos pelo dono (cartao «Impostos», separador Loja).
  await owner.goto(BASE + '/app/definicoes?tab=store');
  await owner.getByRole('radio', { name: 'IVA' }).click();
  await owner.getByLabel('Taxa normal do IVA (%)').fill('31');
  ok(await owner.getByText('Escreva um número de 0 a 30.').first().isVisible(), 'IVA 31%: avisa e não deixa guardar');
  await owner.getByLabel('Taxa normal do IVA (%)').fill('15');
  const inssBox = owner.getByText('Os trabalhadores estão inscritos no INSS.', { exact: false });
  await inssBox.click();
  await owner.getByLabel('INSS pago pelo patrão (%)').fill('2');
  const taxCard = owner.locator('div.rounded-lg', { has: owner.getByRole('heading', { name: 'Impostos' }) }).last();
  await taxCard.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Alterações guardadas.').waitFor({ timeout: T });
  const st = await (await owner.request.get(BASE + '/api/settings')).json();
  ok(st.taxes.vat_mode === 'iva' && st.taxes.vat_rate_std === 15 && st.taxes.inss_employer_pct === 2, 'guardado: IVA 15% e INSS 2%', st.taxes);
  await shot(owner, 'A5-taxas', true);
  await owner.request.put(BASE + '/api/settings/taxes', { data: { vat_mode: 'none', vat_rate_std: 16, inss_employer_pct: 0 } });

  // A11: pedido personalizado ligado (por omissao) nas Definicoes.
  await owner.goto(BASE + '/app/definicoes?tab=discounts');
  await owner.getByText('Pedido personalizado').first().waitFor({ timeout: T });
  ok(await owner.getByText('Ligado', { exact: true }).isVisible(), 'Definições: pedido personalizado ligado');

  // A6: terminal novo; o dono escolhe os perfis; novo codigo para o MESMO terminal.
  await owner.request.post(BASE + '/api/lock/unlock', { data: { pin: fx.lockPin } });
  const code = await (await owner.request.post(BASE + '/api/owner/terminals/pairing-code', { data: { name: 'Balcão A' } })).json();
  const tctx = await browser.newContext({ locale: 'pt-PT', viewport: { width: 1280, height: 800 } });
  tctx.setDefaultTimeout(T);
  const term = await tctx.newPage();
  watch(term);
  await term.goto(BASE + '/terminal');
  await term.getByLabel('Código de emparelhamento').fill(code.code);
  await term.getByRole('button', { name: 'Emparelhar' }).click();
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).waitFor({ timeout: T });

  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  const row = owner.getByRole('row', { name: /Balcão A/ });
  await row.waitFor({ timeout: T });
  ok(await row.getByText('Todos (balcão geral)').isVisible(), 'terminal novo: todos os perfis');
  await row.getByRole('button', { name: 'Perfis' }).click();
  const pd = owner.getByRole('dialog', { name: /Perfis de Balcão A/ });
  await pd.getByLabel(fx.cashier.name).check();
  await shot(owner, 'A6-perfis');
  await pd.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Perfis do terminal guardados.').waitFor({ timeout: T });
  ok(await row.getByText('1 perfil(is)').waitFor({ timeout: T }).then(() => true, () => false), 'lista do terminal: 1 perfil');
  await row.getByRole('button', { name: 'Novo código' }).click();
  await owner.getByText('Use este código no aparelho que perdeu a ligação.', { exact: false }).waitFor({ timeout: T });
  ok(true, 'novo código para o mesmo terminal, com a explicação');
  await shot(owner, 'A6-novo-codigo');
  await owner.keyboard.press('Escape');
  const terms = await (await owner.request.get(BASE + '/api/owner/terminals')).json();
  ok(terms.filter((x) => x.name === 'Balcão A').length === 1, 'continua UM terminal «Balcão A»');

  // A11: pedido personalizado no terminal (entra no cesto e na venda).
  await term.reload();
  await term.getByRole('button', { name: new RegExp(fx.cashier.name) }).click();
  await typePin(term, fx.cashier.pin);
  const skip = term.getByRole('button', { name: 'Não tenho — saltar' });
  await skip.waitFor({ timeout: 25000 }).catch(() => {});
  if (await skip.count()) await skip.click();
  await term.getByRole('button', { name: 'Pedido personalizado' }).click();
  const cd = term.getByRole('dialog', { name: 'Pedido personalizado' });
  await cd.getByLabel('Descrição').fill('Gelo avulso');
  await cd.getByLabel('Quantidade').fill('2');
  await cd.getByLabel('Preço unitário').fill('25');
  await shot(term, 'A11-dialogo');
  await cd.getByRole('button', { name: 'Pôr no cesto' }).click();
  ok(await term.getByText('Gelo avulso').isVisible() && await term.getByText('Personalizado', { exact: true }).isVisible(), 'cesto: «Gelo avulso» marcado como personalizado');
  await term.getByRole('button', { name: /Cobrar 50,00 MT/ }).click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  ok(true, 'venda com o pedido personalizado registada (50 MT)');
  await shot(term, 'A11-venda');
  await term.keyboard.press('Escape');

  // A8: fecho recusado -> o caixista nao ve o esperado; o dono ve no sino e no rastreio.
  await term.getByRole('button', { name: 'Fechar turno' }).click();
  const close = term.getByRole('dialog');
  await close.getByLabel('Dinheiro contado na gaveta').fill('10');
  await close.getByRole('button', { name: 'Confirmar contagem' }).click();
  await close.getByRole('button', { name: 'Sim, fechar o turno' }).click();
  await close.getByRole('alert').first().waitFor({ timeout: T }).catch(() => {});
  await term.waitForTimeout(800);
  ok(!(await close.innerText()).includes('50,00'), 'caixista: recusado sem ver o valor esperado');
  await shot(term, 'A8-fecho-recusado');
  await tctx.close();

  await owner.goto(BASE + '/app');
  await owner.getByText('Hoje até agora').waitFor({ timeout: T });
  await owner.getByRole('button', { name: /^Notificações/ }).first().click();
  await owner.getByText('Fecho de turno recusado').first().waitFor({ timeout: T });
  ok(await owner.getByText(/escreveu 10,00.MT, esperado 50,00.MT \(tentativa 1\/3\)/).first().isVisible(), 'sino: «escreveu 10,00 MT, esperado 50,00 MT (tentativa 1/3)»');
  await shot(owner, 'A8-sino');
  await owner.keyboard.press('Escape');

  // A7: caixistas no relatorio do dia e rastreio filtrado.
  await owner.goto(BASE + '/app/relatorios');
  await owner.getByText('Por caixista').waitFor({ timeout: T });
  const cashierRow = owner.getByRole('row', { name: new RegExp(fx.cashier.name) }).first();
  ok(await cashierRow.isVisible(), 'relatório do dia: tabela por caixista');
  await owner.getByLabel('Caixista', { exact: true }).selectOption({ label: fx.cashier.name });
  await owner.getByText(/Fecho recusado: tentativa 1\/3/).first().waitFor({ timeout: T });
  ok(await owner.getByText(/escreveu 10,00.MT, esperado 50,00.MT/).first().isVisible(), 'rastreio filtrado pelo caixista: tentativa recusada com o escrito e o esperado');
  await owner.getByText('Por caixista').scrollIntoViewIfNeeded();
  await shot(owner, 'A7-caixistas', true);

  // Tablet (768) com a barra recolhida.
  await owner.setViewportSize({ width: 1024, height: 768 });
  await owner.goto(BASE + '/app');
  await owner.getByText('Hoje até agora').waitFor({ timeout: T });
  await shot(owner, 'A-tablet-1024');
  await owner.setViewportSize({ width: 390, height: 844 });
  await owner.goto(BASE + '/app/definicoes?tab=terminals');
  await owner.getByText('Balcão A').first().waitFor({ timeout: T });
  await shot(owner, 'A-telemovel-terminais', true);
  ok(await owner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'telemóvel: sem deslocamento horizontal');
  await ctx.close();
} catch (e) {
  failures++;
  console.log('ERRO: ' + String(e.message).split(/\r?\n/)[0]);
} finally {
  await browser.close();
}
if (errors.length) { failures += errors.length; console.log('Erros na consola:\n  ' + errors.join('\n  ')); }
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os passos passaram.');
process.exit(failures ? 1 : 0);
