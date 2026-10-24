// Simbolo da marca Genesis MZ (o «G» com o quadrado dourado), medido ao pixel
// na arte original (Genesis_Imagens/Perfil (redes sociais)@1x.png, 1080 px):
// anel com centro 540,540, raio exterior 182,5 e interior 117,5, aberto a 40
// graus acima da horizontal; barra 555–722,5 x 507,5–572,5; quadrado dourado
// 665–720 x 360–415. Fonte unica: componente React (BrandMark), site publico,
// favicon e icones da app (scripts/gerar_icones.mjs).
export const BRAND_GREEN = '#0B4D3B';
export const BRAND_GOLD = '#F2B300';

// Caixa do simbolo no sistema de coordenadas da arte original.
export const MARK_VIEWBOX = '357.5 357.5 365 365';
export const MARK_G_PATH =
  'M679.803 422.693A182.5 182.5 0 1 0 722.5 540H657.5A117.5 117.5 0 1 1 630.01 464.472Z' +
  'M555 507.5V572.5H722.5V507.5Z'; // barra no mesmo sentido do anel (senao a sobreposicao fica vazia)
export const MARK_SQUARE = { x: 665, y: 360, width: 55, height: 55 };

// SVG completo do simbolo. bg: cor do fundo (null = transparente); radius:
// arredondamento do fundo em fraccao do lado; scale: tamanho do simbolo em
// fraccao do lado (0,62 = como no letreiro).
export function markSvg({ size = 512, bg = BRAND_GREEN, radius = 0.19, scale = 0.62, fg = '#FFFFFF' } = {}) {
  const k = (size * scale) / 365;
  const t = size / 2 - 540 * k;
  const rect = bg ? `<rect width="${size}" height="${size}" rx="${(size * radius).toFixed(1)}" fill="${bg}"/>` : '';
  const s = MARK_SQUARE;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${rect}` +
    `<g transform="translate(${t.toFixed(3)} ${t.toFixed(3)}) scale(${k.toFixed(5)})">` +
    `<path fill="${fg}" d="${MARK_G_PATH}"/>` +
    `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${BRAND_GOLD}"/></g></svg>`;
}
