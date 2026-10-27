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

  // 15.2: impostos — IVA e INSS escolhidos nas Definicoes; o produto mostra o IVA.
  const taxCard = owner.locator('div').filter({ hasText: 'Escolha como o seu negócio paga impostos' }).filter({ has: owner.getByRole('button', { name: 'Guardar' }) }).last();
  await taxCard.getByRole('radio', { name: 'IVA' }).click();
  ok(await taxCard.getByText('Os preços já incluem o IVA de 16%').isVisible(), 'impostos: explicação do IVA em linguagem simples');
  await taxCard.getByLabel(/inscritos no INSS/).check();
  await taxCard.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Alterações guardadas.').last().waitFor({ timeout: T });
  await owner.goto(BASE + '/app/produtos');
  await owner.getByText('Coca-Cola 500ml').first().click();
  const vatSel = owner.getByLabel('IVA', { exact: true });
  await vatSel.waitFor({ timeout: T });
  ok(await vatSel.isVisible() && (await vatSel.inputValue()) === '16', 'produto: campo do IVA (taxa normal 16%) aparece com a loja no IVA');
  await shot(owner, '15-produto-iva');
  await owner.keyboard.press('Escape');

  // 15.3: taxa anual do municipio e multa, pelo ecra das Definicoes.
  await owner.goto(BASE + '/app/definicoes?tab=costs');
  await owner.getByRole('button', { name: 'Novo custo' }).click();
  const costDlg = owner.getByRole('dialog');
  await costDlg.getByLabel('Tipo').selectOption('municipal');
  await costDlg.getByLabel('Descrição').fill('Licença de actividade');
  await costDlg.getByRole('radio', { name: 'Paga por ano' }).click();
  await costDlg.getByLabel('Valor por ano').fill('12000');
  ok(await costDlg.getByText(/Conta 1.000,00.MT em cada mês do relatório/).isVisible(), 'taxa anual: mostra quanto conta em cada mês (1/12)');
  await costDlg.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Custo fixo guardado.').waitFor({ timeout: T });
  await owner.getByText(/12.000,00.MT por ano/).waitFor({ timeout: T }).catch(() => {});
  ok(await owner.getByText(/12.000,00.MT por ano/).isVisible(), 'lista dos custos: valor mensal e o anual por baixo');
  await owner.getByRole('button', { name: 'Nova despesa' }).click();
  const expDlg = owner.getByRole('dialog');
  await expDlg.getByRole('radio', { name: 'Multa' }).click();
  await expDlg.getByLabel('Quem passou a multa').fill('Conselho Municipal');
  await expDlg.getByLabel('Motivo (opcional)').fill('Licença fora do prazo');
  await expDlg.getByLabel('Valor', { exact: true }).fill('2500');
  await expDlg.getByRole('button', { name: 'Guardar' }).click();
  await owner.getByText('Despesa guardada.').waitFor({ timeout: T });
  await owner.getByText('Conselho Municipal · Licença fora do prazo').waitFor({ timeout: T }).catch(() => {});
  ok(await owner.getByText('Conselho Municipal · Licença fora do prazo').isVisible(), 'multa na lista com quem a passou e o motivo');
  await shot(owner, '15-custos-multa');

  // Terminal: a venda imprime o recibo novo (PDF guardado no aparelho).
  await owner.request.post(BASE + '/api/lock/unlock', { data: { pin: fx.lockPin } });
  // 15.5: produto ao kg (antes de o terminal carregar o catálogo).
  const kg = await owner.request.post(BASE + '/api/products', { data: { name: 'Carne de vaca', category: 'Talho', unit: 'kg', sell_price: 35000, cost_price: 25000, min_stock: 2000, lots: [{ quantity: 10000, expiry_date: null }] } });
  ok(kg.status() === 201, 'produto ao kg criado (10 kg)', kg.status());
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
  await skip.waitFor({ timeout: 25000 }).catch(() => {});
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
    ok(pdf.toString('latin1').includes('IVA inclu') && pdf.toString('latin1').includes('6,21 MT'), 'recibo com «IVA incluído 6,21 MT» (45 MT a 16%)');
  }
  await shot(term, '15-terminal-recibo');
  // 15.1b: imagem do recibo para o WhatsApp (no computador descarrega o PNG).
  const dlImg = term.waitForEvent('download', { timeout: T }).catch(() => null);
  await term.getByRole('button', { name: /Imagem \(WhatsApp\)/ }).click();
  const img = await dlImg;
  ok(Boolean(img) && /^Recibo_\d{3} - Bottle Store Central .*\.png$/.test(img.suggestedFilename()), 'imagem do recibo (PNG) com o nome do recibo', img?.suggestedFilename());
  if (img) {
    const out = path.join(SHOTS, 'recibo.png');
    await img.saveAs(out);
    const buf = fs.readFileSync(out);
    const w = buf.readUInt32BE(16); const h = buf.readUInt32BE(20);
    ok(buf.slice(1, 4).toString() === 'PNG' && w === 1176 && h > 1500, 'PNG nítido (1176 px de largura) e com altura do talão', { w, h });
  }
  ok(await term.getByText('Imagem do recibo guardada').isVisible().catch(() => false), 'aviso: enviar a imagem ao cliente pelo WhatsApp');

  // 15.5: venda ao peso — 1,25 kg de carne a 350 MT/kg = 437,50 MT.
  await term.getByRole('button', { name: 'Nova venda' }).click();
  const meat = term.getByRole('button', { name: /Carne de vaca/ });
  ok(/10 kg/.test(await meat.innerText()), 'cartão do produto mostra o stock em kg', await meat.innerText());
  await meat.click();
  const wd = term.getByRole('dialog');
  await wd.getByLabel('Peso (kg)').fill('1,25');
  ok(/437,50/.test(await wd.innerText()), 'teclado de peso: mostra o valor (437,50 MT) antes de confirmar');
  await shot(term, '15-terminal-peso');
  await wd.getByRole('button', { name: 'Confirmar' }).click();
  ok(await term.getByRole('button', { name: /Mudar o peso de Carne de vaca/ }).innerText() === '1,25 kg', 'cesto: linha com 1,25 kg');
  await term.getByRole('button', { name: /Cobrar 437,50 MT/ }).click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  ok(/1,25 kg × Carne de vaca\s+437,50/.test(await term.getByRole('dialog').innerText()), 'recibo no ecrã: «1,25 kg × Carne de vaca 437,50 MT»');

  // 15.4: pagamento dividido — 20 MT por M-Pesa, o resto (25 MT) em dinheiro, cliente da 50.
  await term.getByRole('button', { name: 'Nova venda' }).click();
  await term.getByRole('button', { name: /Coca-Cola 500ml/ }).click();
  await term.getByRole('button', { name: /Dividir o pagamento/ }).click();
  await term.getByLabel('Forma de pagamento 1').selectOption('mpesa');
  await term.getByLabel('Valor 1').fill('20');
  ok(/25,00/.test(await term.getByText('Resto em dinheiro').locator('..').innerText()), 'dividir: o resto em dinheiro é calculado (25 MT)');
  await term.locator('#pos-received').fill('50');
  ok(/25,00/.test(await term.getByText('Troco', { exact: true }).locator('..').innerText()), 'dividir: troco só da parte em dinheiro (25 MT)');
  await shot(term, '15-terminal-dividir');
  await term.getByRole('button', { name: /Cobrar 45,00 MT/ }).click();
  await term.getByText('Venda registada').waitFor({ timeout: T });
  const rd = await term.getByRole('dialog').innerText();
  ok(/M-Pesa\s+20,00/.test(rd) && /Dinheiro\s+25,00/.test(rd), 'recibo no ecrã com as duas partes (M-Pesa 20, Dinheiro 25)', rd.slice(0, 300));
  await shot(term, '15-terminal-recibo-dividido');
  await tctx.close();
  // 15.2: o mensal desconta o IVA a entregar e o INSS do patrao.
  await owner.goto(BASE + '/app/relatorios');
  await owner.getByRole('tab', { name: 'Mensal' }).click();
  await owner.getByText('IVA a entregar ao Estado').first().waitFor({ timeout: T });
  ok(await owner.getByText('IVA a entregar ao Estado').first().isVisible() && await owner.getByText('INSS do patrão (4% dos salários)').first().isVisible() && await owner.getByText('IVA do mês').isVisible(), 'mensal: IVA a entregar, INSS do patrão e o quadro do IVA');
  ok(await owner.getByText('Multas do mês').isVisible() && await owner.getByText('Conselho Municipal · Licença fora do prazo').isVisible(), 'mensal: linha «Multas» e a lista das multas do mês');
  await owner.getByText('IVA do mês').scrollIntoViewIfNeeded();
  await shot(owner, '15-mensal-impostos');
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
