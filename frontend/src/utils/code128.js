// Codigo de barras Code 128 (conjunto B) do numero do documento no recibo
// (Fase 15.1). Puro: devolve as larguras alternadas barra/espaco em modulos;
// quem desenha e o recibo (HTML: SVG; PDF: rectangulos). A impressora termica
// usa o comando nativo (escpos.js). Verificado com o leitor zxing nos testes.
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
const START_B = 104;
const START_C = 105;
const STOP = 106;

export { PATTERNS };

// Texto ASCII imprimivel (32-126) -> larguras dos modulos, com margem de 10 modulos.
export function code128B(text) {
  const s = String(text || '');
  if (!s || /[^\x20-\x7e]/.test(s)) throw new Error('Code 128 B: só ASCII imprimível');
  const codes = [START_B, ...[...s].map((c) => c.charCodeAt(0) - 32)];
  const check = codes.reduce((sum, c, i) => sum + c * (i === 0 ? 1 : i), 0) % 103;
  const all = [...codes, check, STOP];
  return all.flatMap((c) => [...PATTERNS[c]].map(Number));
}

// Conjunto C: so algarismos, em pares (metade da largura). Cabe em 58 mm.
export function code128C(digits) {
  const s = String(digits || '');
  if (!/^(\d\d)+$/.test(s)) throw new Error('Code 128 C: número par de algarismos');
  const codes = [START_C, ...s.match(/\d\d/g).map(Number)];
  const check = codes.reduce((sum, c, i) => sum + c * (i === 0 ? 1 : i), 0) % 103;
  return [...codes, check, STOP].flatMap((c) => [...PATTERNS[c]].map(Number));
}

// O conjunto mais estreito que serve: C para algarismos aos pares, senao B.
export function code128(text) {
  return /^(\d\d)+$/.test(String(text || '')) ? code128C(text) : code128B(text);
}

// Barras como rectangulos (x, largura) em modulos, sem os espacos.
export function code128Bars(text) {
  const widths = code128(text);
  const bars = [];
  let x = 0;
  widths.forEach((w, i) => { if (i % 2 === 0) bars.push({ x, w }); x += w; });
  return { bars, modules: x };
}

// SVG pronto para o recibo HTML (altura em px, modulo em px).
export function code128Svg(text, { module = 1.4, height = 40 } = {}) {
  const { bars, modules } = code128Bars(text);
  const q = 10; // zona livre
  const w = (modules + 2 * q) * module;
  const rects = bars.map((b) => `<rect x="${((b.x + q) * module).toFixed(2)}" y="0" width="${(b.w * module).toFixed(2)}" height="${height}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(1)}" height="${height}" viewBox="0 0 ${w.toFixed(2)} ${height}" fill="#000" role="img" aria-label="${String(text).replace(/[<>"&]/g, '')}">${rects}</svg>`;
}

// Valor do codigo de barras: AAAAMMDD + numero do dia com 4 algarismos (so algarismos -> conjunto C).
export function documentBarcode(sale) {
  return documentNumber(sale).replace('-', '').slice(0, 8) + String(Number(sale?.daily_number || 0)).padStart(4, '0');
}

// Numero do documento: AAAAMMDD-NNN (dia da venda + numero do dia).
export function documentNumber(sale) {
  const d = new Date(sale?.created_at || Date.now());
  const day = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  return day + '-' + String(Number(sale?.daily_number || 0)).padStart(3, '0');
}
