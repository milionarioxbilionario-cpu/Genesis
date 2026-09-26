// Escolha do motor de base de dados — VERSAO LIMPA 2026-09-26.
//
// Substitui dbEngine.js (bloqueado em disco pelo motor do Prisma em execucao).
// Corrige a deteccao do cliente: le "activeProvider" do index.js gerado em vez
// da copia desactualizada schema.prisma.
const path = require('path');
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
const FALLBACK_URL = 'file:' + path.join(BACKEND_ROOT, 'data', 'genesis.db').replace(/\\/g, '/');
const PROBE_TIMEOUT_MS = Number(process.env.DB_PROBE_TIMEOUT_MS || 6000);
const SCHEMA_SQLITE = 'prisma/schema.sqlite.prisma';
const SCHEMA_PG = 'prisma/schema.prisma';

function currentUrl() {
  return String(process.env.DATABASE_URL || '').trim();
}

function isSqliteUrl() {
  return currentUrl().startsWith('file:');
}

function clientAlreadyFor(engine) {
  try {
    const fs = require('fs');
    const p = require('path');
    const indexJs = p.join(process.cwd(), 'node_modules', '.prisma', 'client', 'index.js');
    if (!fs.existsSync(indexJs)) return false;
    const content = fs.readFileSync(indexJs, 'utf8');
    return content.includes('"activeProvider": "' + engine + '"');
  } catch (_) {
    return false;
  }
}

function generateClientFor(engine) {
  const schema = engine === 'sqlite' ? SCHEMA_SQLITE : SCHEMA_PG;
  const isWin = process.platform === 'win32';
  if (clientAlreadyFor(engine)) {
    console.log('[db] cliente ja gerado para ' + engine);
    return;
  }
  const { spawnSync } = require('child_process');
  const res = spawnSync(isWin ? 'npx.cmd' : 'npx',
    ['prisma', 'generate', '--schema', schema],
    { stdio: 'inherit', shell: isWin });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    if (clientAlreadyFor(engine)) {
      console.warn('[db] prisma generate falhou (' + res.status + ') mas o cliente ' + engine + ' esta utilizavel');
      return;
    }
    throw new Error('prisma generate falhou para ' + engine + ' (exit ' + res.status + ')');
  }
}

function probePostgres(host, port, timeoutMs) {
  const net = require('net');
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch (_) {}
      resolve(result);
    };
    const timer = setTimeout(() => done({ reachable: false, reason: 'timeout' }), timeoutMs || PROBE_TIMEOUT_MS);
    socket.once('error', (err) => {
      clearTimeout(timer);
      done({ reachable: false, reason: String((err && err.code) || err) });
    });
    socket.connect(port, host, () => {
      clearTimeout(timer);
      done({ reachable: true });
    });
  });
}

async function canReachPostgres() {
  const url = currentUrl();
  if (!url || isSqliteUrl()) return false;
  let host = 'localhost';
  let port = 5432;
  try {
    const u = new URL(url);
    host = u.hostname || host;
    port = Number(u.port || port);
  } catch (_) {}
  const probe = await probePostgres(host, port, PROBE_TIMEOUT_MS);
  if (!probe.reachable) {
    console.warn('[db] Postgres inacessivel em ' + host + ':' + port + ' - ' + probe.reason);
    return false;
  }
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: url,
      connectionTimeoutMillis: PROBE_TIMEOUT_MS,
      query_timeout: PROBE_TIMEOUT_MS,
      statement_timeout: PROBE_TIMEOUT_MS,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    console.log('[db] Postgres acessivel em ' + host + ':' + port + ' (query de prova OK)');
    return true;
  } catch (err) {
    const msg = String((err && err.message) || err).split('\n')[0];
    console.warn('[db] a ligacao TCP abre mas a query falha - ' + msg.slice(0, 140));
    return false;
  }
}

async function resolveDatabaseUrl() {
  const url = currentUrl();
  const allowFallback = String(process.env.DB_ALLOW_SQLITE_FALLBACK || '').toLowerCase() === 'true';
  if (!url) {
    if (allowFallback) {
      process.env.DATABASE_URL = FALLBACK_URL;
      console.warn('[db] DATABASE_URL ausente -> SQLite de desenvolvimento');
      return process.env.DATABASE_URL;
    }
    throw new Error('DATABASE_URL nao definida e DB_ALLOW_SQLITE_FALLBACK nao esta activo');
  }
  if (isSqliteUrl()) return url;
  if (String(process.env.FORCE_DB || '').toLowerCase() === 'sqlite') {
    process.env.DATABASE_URL = FALLBACK_URL;
    console.warn('[db] FORCE_DB=sqlite -> a usar a base local de desenvolvimento');
    return process.env.DATABASE_URL;
  }
  const reachable = await canReachPostgres();
  if (reachable) return url;
  if (allowFallback) {
    process.env.DATABASE_URL = FALLBACK_URL;
    console.warn('[db] a cair para SQLite de desenvolvimento (' + FALLBACK_URL + ')');
    console.warn('[db] ATENCAO: os dados ficam so nesta maquina e o RLS do Postgres nao se aplica.');
    return process.env.DATABASE_URL;
  }
  throw new Error(
    'Postgres inacessivel e DB_ALLOW_SQLITE_FALLBACK nao esta activo. ' +
    'Para desenvolvimento local, defina DB_ALLOW_SQLITE_FALLBACK=true no .env.'
  );
}

async function prepareDatabase() {
  const url = await resolveDatabaseUrl();
  const engine = url.startsWith('file:') ? 'sqlite' : 'postgresql';
  generateClientFor(engine);
  console.log('[db] motor preparado: ' + engine);
  return { url, engine };
}

module.exports = { prepareDatabase, resolveDatabaseUrl, isSqliteUrl, generateClientFor, FALLBACK_URL };
