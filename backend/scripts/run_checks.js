#!/usr/bin/env node
/* ==========================================================================
   GENESIS - HARNESS DE VERIFICACAO
   --------------------------------------------------------------------------
   Sobe o backend num porto livre (4020 por omissão), com SQLite forçado,
   corre os testes E2E e DEPOIS mata o servidor. Serve para validar a backend
   sem deixar processos a correr atrás.

   Uso:  node scripts/run_checks.js
         node scripts/run_checks.js --port=4021
   ========================================================================== */

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const BACKEND = path.join(__dirname, '..');
const arg = (flag, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(flag + '='));
  return hit ? hit.split('=')[1] : fallback;
};
const PORT = Number(arg('--port', 4020));

function freePort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitUp(port, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    const ok = await new Promise((resolve) => {
      const req = require('http').get({ host: '127.0.0.1', port, path: '/', timeout: 700 }, (res) => { res.resume(); resolve(true); });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });
    if (ok) return true;
    await wait(400);
  }
  return false;
}

function run(cmd, args, env) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: BACKEND, env: { ...process.env, ...env }, stdio: 'inherit', shell: false });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function main() {
  if (!(await freePort(PORT))) {
    console.error('[checks] porta ' + PORT + ' ocupada - fecha o servidor que esta ai primeiro.');
    process.exitCode = 1;
    return;
  }

  console.log('[checks] a subir o backend na porta ' + PORT + ' (SQLite)...');
  const server = spawn(process.execPath, ['src/index.js'], {
    cwd: BACKEND,
    env: { ...process.env, FORCE_DB: 'sqlite', PORT: String(PORT), NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = [];
  const cap = (chunk) => { const s = String(chunk); log.push(s); if (log.length > 200) log.shift(); process.stdout.write(s); };
  server.stdout.on('data', cap);
  server.stderr.on('data', cap);

  const up = await waitUp(PORT);
  if (!up) {
    console.error('[checks] o backend nao subiu. Ultimo log:');
    console.error(log.join('').slice(-3000));
    server.kill('SIGKILL');
    process.exitCode = 1;
    return;
  }

  const results = [];
  const env = {
    API_BASE: 'http://127.0.0.1:' + PORT,
    BASE_URL: 'http://127.0.0.1:' + PORT,
    FORCE_DB: 'sqlite',
  };
  results.push(['test_auth', await run(process.execPath, ['scripts/test_auth.js'], env), true]);
  results.push(['shift_closing_e2e', await run(process.execPath, ['scripts/shift_closing_e2e.js'], env), true]);
  // O check_mail é uma verificação de CONFIGURAÇÃO, não um teste: só falha
  // quando o SMTP ainda não tem credenciais (ver backend/.env). Por isso
  // entra no relatório como aviso e não conta como falha.
  results.push(['check_mail (configuracao SMTP)', await run(process.execPath, ['scripts/check_mail.js'], {}), false]);

  server.kill('SIGTERM');
  await wait(700);
  if (!server.killed) server.kill('SIGKILL');

  console.log('\n================ RESUMO ================');
  let failed = 0;
  let warned = 0;
  for (const [name, ok, counts] of results) {
    if (!ok && !counts) warned += 1;
    if (!ok && counts) failed += 1;
    const tag = ok ? 'PASS' : (counts ? 'FAIL' : 'AVISO');
    console.log('  ' + tag.padEnd(5) + name);
  }
  if (warned) {
    console.log('\n' + warned + ' aviso(s): configuração por fazer (ver backend/.env).');
  }
  console.log(failed ? '\n' + failed + ' verificacao(oes) falharam.' : '\nTestes: tudo verde.');
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error('[checks] erro:', err && err.message ? err.message : err);
  process.exitCode = 1;
});
