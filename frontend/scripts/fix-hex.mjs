/* ==========================================================================
   GENESIS — SWEEP DE HEX -> TOKENS (script pontual, seguro e re-executavel)
   Substitui classes utilitarias com cores escritas a mao por classes
   semanticas do tema (mapeadas para var(--x) em tokens.css).
   Regra: aplicar os padroes MAIS LONGOS primeiro (senao o curto come o longo).
   Uso: node scripts/fix-hex.mjs
   ========================================================================== */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');

/* Ordem importa: do mais especifico para o mais generico. */
const MAP = [
  // Fundos
  ['bg-[#111c2b]/95', 'bg-elev'],
  ['bg-[#111c2b]/90', 'bg-elev'],
  ['bg-[#0a1220]', 'bg-base'],
  ['bg-[#111c2b]', 'bg-elev'],
  ['bg-[#182332]', 'bg-elev2'],
  ['bg-[#1b2433]', 'bg-elev3'],
  ['bg-[#dfe7ef]', 'bg-brand'],
  ['hover:bg-[#eef4fb]', 'hover:bg-brand-hi'],
  ['hover:bg-[#dbe6f1]', 'hover:bg-brand-hi'],
  // Texto
  ['hover:text-[#edf2f7]', 'hover:text-ink'],
  ['text-[#f4f7fb]', 'text-ink'],
  ['text-[#f2f6fb]', 'text-ink'],
  ['text-[#edf2f7]', 'text-ink'],
  ['text-[#dfe7ef]', 'text-ink'],
  ['text-[#b2bdcb]', 'text-muted'],
  ['text-[#bfd1e6]', 'text-muted'],
  ['text-[#8ca0b8]', 'text-muted'],
  ['placeholder:text-[#8ca0b8]', 'placeholder:text-dim'],
  ['text-[#111c2b]', 'text-white'],
  ['text-[#0f172a]', 'text-base'],
  // Bordas
  ['border-[#30455f]', 'border-line-strong'],
  ['border-[#263548]', 'border-line'],
  ['border-[#1e2b3d]', 'border-line'],
  // Foco / sombras
  ['focus:border-[#7aa5d6]', 'focus:border-brand'],
  ['focus:shadow-[0_0_0_3px_rgba(122,165,214,0.18)]', 'focus:shadow-[0_0_0_3px_rgba(229,9,20,0.15)]'],
  ['shadow-[0_25px_80px_rgba(2,6,23,0.7)]', 'shadow-lg'],
  ['shadow-[0_10px_40px_rgba(2,6,23,0.55)]', 'shadow-md'],
];

/* Hex inline (style={{...}}) da paleta navy antiga -> paleta Genesis.
   Substituicao literal: nao muda estrutura, so a cor. */
const MAP2 = [
  ['#080b14', '#08090c'],
  ['#0b1321', '#08090c'],
  ['#111c2b', '#101219'],
  ['#162436', '#14161e'],
  ['#182332', '#14161e'],
  ['#1b2433', '#1a1d27'],
  ['#edf2f7', '#f2f4f8'],
  ['#f4f7fb', '#f2f4f8'],
  ['#f2f6fb', '#f2f4f8'],
  ['#dfe7ef', '#f2f4f8'],
  ['#cbd5e1', '#f2f4f8'],
  ['#94a3b8', '#9aa3b2'],
  ['#64748b', '#69707d'],
  ['#475569', '#69707d'],
  ['#8ca0b8', '#9aa3b2'],
  ['#7aa5d6', '#e50914'],
  ['#fb7185', '#fda4af'],
  ['#30455f', 'rgba(255,255,255,0.14)'],
  ['#263548', 'rgba(255,255,255,0.08)'],
];

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(jsx?|tsx?)$/.test(entry)) files.push(full);
  }
})(ROOT);

let totalHits = 0;
const report = [];

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  const hits = [];
  for (const [from, to] of [...MAP, ...MAP2]) {
    const parts = after.split(from);
    const n = parts.length - 1;
    if (n > 0) {
      after = parts.join(to);
      hits.push(from + ' -> ' + to + ' (x' + n + ')');
      totalHits += n;
    }
  }
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    report.push(relative(process.cwd(), file) + ':\n  ' + hits.join('\n  '));
  }
}

console.log(report.length ? report.join('\n') : 'Nada a substituir.');
console.log('\nTotal de substituicoes: ' + totalHits);
