// Gera as paginas do site publico a partir de site/textos.*.js + site/template.js:
// index.html, planos.html, en/index.html, en/pricing.html e public/sitemap.xml.
//   node scripts/gerar_site.mjs           escreve os ficheiros
//   node scripts/gerar_site.mjs --check   so confirma que estao actualizados
// Os HTML gerados ficam no repositorio (o Vite e o Google leem-nos tal como estao).
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, SITE_ROOT } from '../site/build.js';

const check = process.argv.includes('--check');
let stale = 0;
for (const [rel, html] of Object.entries(buildSite())) {
  const file = path.join(SITE_ROOT, rel);
  const now = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (now === html) continue;
  if (check) { stale++; console.log('desactualizado: ' + rel); continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('escrito: ' + rel);
}
if (check && stale) process.exit(1);
console.log(check ? 'site actualizado' : 'site gerado');
