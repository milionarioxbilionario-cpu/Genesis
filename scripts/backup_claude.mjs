// Copia as instrucoes e a memoria do Claude Code para "Para o Claude/" (versionada no git),
// para nao se perder nada ao mudar de PC. Corre antes de cada commit:
//   node scripts/backup_claude.mjs
// Repor num PC novo: node "Para o Claude/restaurar.mjs"
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'Para o Claude');
// O Claude Code guarda a memoria em ~/.claude/projects/<caminho do projecto com tudo o que
// nao e letra ou numero trocado por "-">/memory
const slug = ROOT.replace(/[^a-zA-Z0-9]/g, '-');
const MEMORY = path.join(os.homedir(), '.claude', 'projects', slug, 'memory');
const PLANS = path.join(os.homedir(), '.claude', 'plans');

function copyDir(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) n += copyDir(s, d);
    else { fs.copyFileSync(s, d); n++; }
  }
  return n;
}

fs.mkdirSync(DEST, { recursive: true });
const out = [];
fs.copyFileSync(path.join(ROOT, 'CLAUDE.md'), path.join(DEST, 'CLAUDE.md'));
out.push('CLAUDE.md');
out.push(`skills: ${copyDir(path.join(ROOT, '.claude', 'skills'), path.join(DEST, 'skills'))} ficheiro(s)`);
if (fs.existsSync(MEMORY)) out.push(`memoria: ${copyDir(MEMORY, path.join(DEST, 'memoria'))} ficheiro(s)`);
else out.push(`memoria: nao encontrada em ${MEMORY}`);
if (fs.existsSync(PLANS)) {
  // So os planos deste projecto (os outros podem ser de outras pastas).
  const dst = path.join(DEST, 'planos');
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(PLANS)) {
    const s = path.join(PLANS, f);
    if (f.endsWith('.md') && /genesis/i.test(fs.readFileSync(s, 'utf8'))) { fs.copyFileSync(s, path.join(dst, f)); n++; }
  }
  out.push(`planos: ${n} ficheiro(s)`);
}
console.log('Para o Claude/ actualizada: ' + out.join(' | '));
