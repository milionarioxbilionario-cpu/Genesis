// Monta as paginas do site publico (so Node: le ficheiros). Usado por
// scripts/gerar_site.mjs (escreve) e por tests/site.test.mjs (compara com o
// que esta gravado no repositorio).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pt from './textos.pt.js';
import en from './textos.en.js';
import { renderHome, renderPricing, renderSitemap } from './template.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LUCIDE = path.join(ROOT, 'node_modules', 'lucide-react', 'dist', 'esm', 'icons');

// Icones lucide (os mesmos da app) como SVG em linha: sem React nem pedidos extra.
const cache = new Map();
export function icon(name, cls = '') {
  if (!cache.has(name)) {
    const src = fs.readFileSync(path.join(LUCIDE, name + '.mjs'), 'utf8');
    const m = src.match(/const __iconData = (\{[\s\S]*?\n\});/);
    if (!m) throw new Error('icone sem desenho: ' + name);
    const nodes = Function('return ' + m[1])().node;
    cache.set(name, nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join(''));
  }
  return `<svg aria-hidden="true" focusable="false" class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${cache.get(name)}</svg>`;
}

export function buildSite() {
  const shotsFile = path.join(ROOT, 'public', 'site', 'shots', 'shots.json');
  if (!fs.existsSync(shotsFile)) throw new Error('falta public/site/shots/shots.json: correr scripts/capturas_site.mjs');
  const ctx = { icon, shots: JSON.parse(fs.readFileSync(shotsFile, 'utf8')) };
  return {
    'index.html': renderHome(pt, ctx),
    'planos.html': renderPricing(pt, ctx),
    'en/index.html': renderHome(en, ctx),
    'en/pricing.html': renderPricing(en, ctx),
    'public/sitemap.xml': renderSitemap(),
  };
}

export const SITE_ROOT = ROOT;
