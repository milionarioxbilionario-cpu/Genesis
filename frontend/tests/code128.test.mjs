// Fase 15.1: codigo de barras do recibo. O que se gera e LIDO pelo zxing (o
// mesmo leitor que a camara do terminal usa): prova que a tabela esta certa.
// Correr: node --test tests/code128.test.mjs   (dentro de frontend/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, Code128Reader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { PATTERNS, code128B, code128Bars, code128Svg, documentNumber, documentBarcode } from '../src/utils/code128.js';

function decode(text) {
  const { bars, modules } = code128Bars(text);
  const q = 12; const scale = 3; const h = 20;
  const width = (modules + 2 * q) * scale;
  const row = new Uint8ClampedArray(width).fill(255);
  for (const b of bars) for (let x = (b.x + q) * scale; x < (b.x + q + b.w) * scale; x++) row[x] = 0;
  const lum = new Uint8ClampedArray(width * h);
  for (let y = 0; y < h; y++) lum.set(row, y * width);
  const source = new RGBLuminanceSource(lum, width, h);
  const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]]]);
  return new Code128Reader().decodeRow(10, new HybridBinarizer(source).getBlackRow(10, null), hints).getText();
}

test('tabela: 107 padroes, cada um com 11 modulos (o stop com 13)', () => {
  assert.equal(PATTERNS.length, 107);
  PATTERNS.forEach((p, i) => assert.equal([...p].reduce((s, c) => s + Number(c), 0), i === 106 ? 13 : 11, 'padrao ' + i));
  assert.equal(new Set(PATTERNS).size, 107, 'sem repetidos');
});

test('o leitor zxing le de volta o que se gerou', () => {
  for (const txt of ['20261025-007', 'GENESIS', 'Venda 123', '0', '~!@#$%^&*()']) assert.equal(decode(txt), txt);
  // Conjunto C (algarismos aos pares): o do recibo.
  for (const txt of ['202610250007', '00', '9876543210']) assert.equal(decode(txt), txt);
  assert.ok(code128Bars('202610250007').modules < code128Bars('20261025-007').modules, 'C e mais estreito do que B');
});

test('numero do documento: AAAAMMDD-NNN', () => {
  assert.equal(documentNumber({ created_at: '2026-10-25T10:00:00', daily_number: 7 }), '20261025-007');
  assert.equal(documentBarcode({ created_at: '2026-10-25T10:00:00', daily_number: 7 }), '202610250007');
});

test('SVG com o texto e sem caracteres perigosos', () => {
  const svg = code128Svg('20261025-007');
  assert.match(svg, /^<svg /);
  assert.ok(svg.includes('aria-label="20261025-007"'));
  assert.throws(() => code128B('Água'), /ASCII/);
});
