// Fase 15.1b: recibo em imagem para WhatsApp. O desenho e verificado com um
// contexto 2D falso (Node nao tem canvas): o que se escreve e onde.
import test from 'node:test';
import assert from 'node:assert/strict';
import { drawReceipt, wrapText } from '../src/utils/receiptImage.js';
import { setLang } from '../src/i18n/core.js';
import '../src/i18n/en/common.js';

function fakeCtx() {
  const texts = [];
  const rects = [];
  const images = [];
  const ctx = {
    font: '16px x', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: 'left', textBaseline: 'alphabetic',
    measureText(s) { const size = Number(/(\d+(?:\.\d+)?)px/.exec(this.font)[1]); return { width: String(s).length * size * 0.55 }; },
    fillText(s, x, y) { texts.push({ s: String(s), x, y, fill: this.fillStyle }); },
    fillRect(x, y, w, h) { rects.push({ x, y, w, h, fill: this.fillStyle }); },
    drawImage(img, x, y, w, h) { images.push({ img, x, y, w, h }); },
    save() {}, restore() {}, clip() {}, beginPath() {}, moveTo() {}, lineTo() {}, arcTo() {}, closePath() {}, fill() {}, stroke() {}, setLineDash() {},
  };
  return { ctx, texts, rects, images };
}

const input = {
  shopName: 'Bottle Store Central', shopLocation: 'Polana, Maputo', shopPhone: '841234567', shopNuit: '400123456',
  footer: 'Volte sempre!', cashierName: 'Carlos',
  sale: { id: 'abc', daily_number: 7, created_at: '2026-10-27T10:00:00Z', total_amount: 19500, discount_amount: 500, amount_received: 20000, change_given: 500, payment_method: 'Dinheiro' },
  items: [{ product_name: 'Cerveja 2M 550ml garrafa retornável de vidro castanho', quantity: 2, unit_sell_price: 10000 }],
};

test('o recibo em imagem leva loja, NUIT, documento, linhas, total, troco e mensagem', () => {
  setLang('pt');
  const { ctx, texts, rects } = fakeCtx();
  const h = drawReceipt(ctx, input, {});
  const all = texts.map((t) => t.s).join('\n');
  for (const want of ['Bottle Store Central', 'Polana, Maputo', 'Tel. 841234567 · NUIT 400123456', 'RECIBO', 'Caixista: Carlos', 'Desconto', 'Total', 'Dinheiro', 'Troco', 'Volte sempre!', 'Genesis MZ · genesismz.com']) {
    assert.ok(all.includes(want), 'falta ' + want);
  }
  assert.ok(/195,00\s?MT/.test(all), 'total por extenso (moneyExact)');
  assert.ok(texts.some((t) => /^\d{8}-007$/.test(t.s)), 'numero do documento');
  const total = texts.find((t) => /195,00/.test(t.s));
  assert.equal(total.fill, '#0B4D3B', 'o total sai no verde da marca');
  assert.ok(rects.filter((r) => r.fill === '#000000').length > 20, 'codigo de barras desenhado');
  assert.ok(h > 400 && h < 1200, 'altura plausivel: ' + h);
});

test('nome comprido do produto parte em linhas e nada passa da largura', () => {
  const { ctx, texts } = fakeCtx();
  drawReceipt(ctx, input, {});
  const name = texts.filter((t) => /Cerveja|retornável|vidro|castanho/.test(t.s));
  assert.ok(name.length >= 2, 'partido em ' + name.length + ' linhas');
  ctx.font = '500 14px x';
  for (const l of name) assert.ok(ctx.measureText(l.s).width <= 360 - 44 - 110 + 1, l.s);
  assert.deepEqual(wrapText(ctx, '', 100), ['']);
});

test('logotipo e QR entram quando existem; mais conteudo = imagem mais alta', () => {
  const a = fakeCtx();
  const h0 = drawReceipt(a.ctx, input, {});
  const b = fakeCtx();
  const h1 = drawReceipt(b.ctx, input, { logo: { img: 'L', width: 400, height: 200 }, qr: { img: 'Q' } });
  assert.equal(b.images.length, 2);
  const logo = b.images.find((i) => i.img === 'L');
  assert.ok(Math.abs(logo.w / logo.h - 2) < 0.01 && logo.w <= 190, 'logotipo com a proporcao certa');
  assert.ok(h1 > h0 + 150, `${h1} > ${h0} + 150`);
});

test('em ingles', () => {
  setLang('en');
  const { ctx, texts } = fakeCtx();
  drawReceipt(ctx, { ...input, footer: '' }, {});
  const all = texts.map((t) => t.s).join('\n');
  assert.ok(all.includes('RECEIPT') && all.includes('Thank you for your custom!'));
  setLang('pt');
});
