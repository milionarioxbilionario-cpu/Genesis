// Repoe as instrucoes e a memoria do Claude Code num PC novo, a partir desta pasta.
//   node "Para o Claude/restaurar.mjs"
// O que faz:
//   1) copia CLAUDE.md para a raiz do projecto (o Claude Code so o le la);
//   2) copia skills/ para .claude/skills/ na raiz;
//   3) copia memoria/ para ~/.claude/projects/<pasta do projecto>/memory/;
//   4) copia planos/ para ~/.claude/plans/.
// Nao apaga nada: se um ficheiro ja existir, so e substituido pela versao desta pasta.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const slug = ROOT.replace(/[^a-zA-Z0-9]/g, '-');
const MEMORY = path.join(os.homedir(), '.claude', 'projects', slug, 'memory');
const PLANS = path.join(os.homedir(), '.claude', 'plans');

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return 0;
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

fs.copyFileSync(path.join(HERE, 'CLAUDE.md'), path.join(ROOT, 'CLAUDE.md'));
console.log('1) CLAUDE.md -> ' + path.join(ROOT, 'CLAUDE.md'));
console.log(`2) skills: ${copyDir(path.join(HERE, 'skills'), path.join(ROOT, '.claude', 'skills'))} ficheiro(s) -> ${path.join(ROOT, '.claude', 'skills')}`);
console.log(`3) memoria: ${copyDir(path.join(HERE, 'memoria'), MEMORY)} ficheiro(s) -> ${MEMORY}`);
console.log(`4) planos: ${copyDir(path.join(HERE, 'planos'), PLANS)} ficheiro(s) -> ${PLANS}`);
console.log('\nPronto. Abre o Claude Code nesta pasta do projecto e diz "continua de onde paramos".');
