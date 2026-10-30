// Pagina 404 (scripts/gerar_404.mjs -> public/404.html): em dia com o gerador e
// sem nunca escrever o endereco pedido na pagina (nada a injectar).
//   node --test tests/notfound.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'public', '404.html'), 'utf8');

test('public/404.html e exactamente a saida do gerador', () => {
  execFileSync(process.execPath, ['scripts/gerar_404.mjs', '--check'], { cwd: ROOT, stdio: 'pipe' });
});

test('o endereco pedido nunca entra na pagina', () => {
  for (const bad of ['location.href', 'location.pathname', 'location.search', 'location.hash', 'document.URL', 'document.referrer', 'innerHTML', 'outerHTML', 'document.write', 'insertAdjacentHTML', 'eval(']) {
    assert.ok(!html.includes(bad), 'a 404 nao pode usar ' + bad);
  }
  const scripts = html.match(/<script[\s\S]*?<\/script>/g) || [];
  assert.equal(scripts.length, 1, 'um unico script (a lingua)');
  assert.ok(!/src=/.test(scripts[0]), 'sem scripts externos');
  assert.ok(!/https?:\/\//.test(html.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')), 'sem pedidos a outros sites');
});

test('PT e EN, noindex, botoes para o inicio e para entrar, sem movimento para quem o desliga', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /No princípio, esta página não existia\./);
  assert.match(html, /data-en="In the beginning, this page did not exist\."/);
  assert.match(html, /href="\/" target="_top"/);
  assert.match(html, /href="\/inicio" target="_top"/);
  assert.match(html, /@media \(prefers-reduced-motion:reduce\)/);
  // Loop sem costura: quem atravessa o ecra entra e sai fora de vista.
  assert.match(html, /@keyframes walkLeft\{from\{transform:translateX\(1900px\)\}to\{transform:translateX\(-420px\)\}\}/);
  assert.match(html, /@keyframes drift\{from\{transform:translateX\(0\)\}to\{transform:translateX\(-1600px\)\}\}/);
});
