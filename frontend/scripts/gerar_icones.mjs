// Gera o favicon e os icones da app a partir do simbolo (src/ui/marca.js),
// desenhados pelo Chromium do Playwright (o mesmo dos testes e2e).
//   cd frontend && node scripts/gerar_icones.mjs
// Escreve em public/: favicon.svg, favicon.ico (16/32/48), favicon-48.png,
// apple-touch-icon.png (180, sem cantos: o iOS arredonda), icons/icon-192.png,
// icons/icon-512.png e icons/icon-maskable-512.png (simbolo dentro da zona
// segura de 80%). Os ficheiros gerados ficam no git.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { markSvg } from '../src/ui/marca.js';

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
fs.mkdirSync(path.join(PUBLIC, 'icons'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function png(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg style="display:block;width:${size}px;height:${size}px" `)}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// Icone com cantos arredondados (separador do browser, Android «any").
const rounded = (size) => markSvg({ size, radius: 0.19, scale: 0.62 });
// Fundo inteiro: o sistema recorta (iOS, Android maskable).
const full = (size, scale) => markSvg({ size, radius: 0, scale });

fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), rounded(512) + '\n');
const out = {
  'favicon-48.png': await png(rounded(48), 48),
  'apple-touch-icon.png': await png(full(180, 0.6), 180),
  'icons/icon-192.png': await png(rounded(192), 192),
  'icons/icon-512.png': await png(rounded(512), 512),
  'icons/icon-maskable-512.png': await png(full(512, 0.5), 512),
};
for (const [name, buf] of Object.entries(out)) fs.writeFileSync(path.join(PUBLIC, name), buf);

// favicon.ico: contentor ICO com PNGs dentro (aceite por todos os browsers e
// pelo Google desde o Vista). Cabecalho 6 bytes + 16 por imagem + dados.
const sizes = [16, 32, 48];
const images = [];
for (const s of sizes) images.push(await png(rounded(s), s));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), Buffer.concat([header, ...images]));

// Imagem de partilha (Open Graph, 1200x630): o que aparece no WhatsApp,
// Facebook e LinkedIn ao colar o link. Uma por lingua.
const font = fs.readFileSync(path.join(PUBLIC, '..', 'node_modules', '@fontsource-variable', 'inter', 'files', 'inter-latin-wght-normal.woff2')).toString('base64');
const OG = {
  pt: { tag: 'VENDAS · STOCK · CAIXA', line: 'Para lojas em Moçambique. Vende mesmo sem internet.' },
  en: { tag: 'SALES · STOCK · CASH', line: 'For shops in Mozambique. Keeps selling offline.' },
};
fs.mkdirSync(path.join(PUBLIC, 'site'), { recursive: true });
await page.setViewportSize({ width: 1200, height: 630 });
for (const [lang, o] of Object.entries(OG)) {
  await page.setContent(`<html><head><style>
    @font-face { font-family: Inter; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
    body { margin: 0; width: 1200px; height: 630px; background: #F5F4EF; font-family: Inter; color: #13201B;
      display: flex; flex-direction: column; justify-content: center; padding: 0 96px; box-sizing: border-box; }
    .row { display: flex; align-items: center; gap: 40px; }
    .name { font-size: 112px; font-weight: 850; letter-spacing: -5px; line-height: 1; }
    .name span { color: #0B4D3B; font-weight: 700; letter-spacing: -2px; margin-left: 18px; }
    .tag { margin-top: 22px; font-size: 26px; font-weight: 600; letter-spacing: 7px; color: #3F4A45; }
    .line { margin-top: 64px; font-size: 34px; font-weight: 500; color: #13201B; }
    .url { margin-top: 14px; font-size: 26px; font-weight: 600; color: #0B4D3B; }
  </style></head><body>
    <div class="row">${markSvg({ size: 180, radius: 0.19, scale: 0.62 })}
      <div><div class="name">Genesis<span>MZ</span></div><div class="tag">${o.tag}</div></div></div>
    <div class="line">${o.line}</div><div class="url">genesismz.com</div>
  </body></html>`);
  await page.evaluate(() => document.fonts.ready);
  fs.writeFileSync(path.join(PUBLIC, 'site', `og-${lang}.png`), await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } }));
}

await browser.close();
console.log('icones gerados em', PUBLIC);
