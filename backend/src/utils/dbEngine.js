// Escolha do motor de base de dados ANTES de o Prisma Client ser construido.
//
// Porquê: o Prisma valida a URL na altura de `new PrismaClient()`. Um schema
// so pode declarar um provider, portanto o URL tem de estar coerente com ele
// antes desse momento. Nao ha forma de "cair" para outro motor depois.
//
// Regras (por ordem, primeira que resolve):
//   1. FORCE_DB=sqlite            -> forca o fallback local (diagnostico).
//   2. DATABASE_URL beginsWith file: -> SQLite explicito.
//   3. DB_ALLOW_SQLITE_FALLBACK=true e o Postgres NAO responder -> SQLite.
//   4. caso contrario              -> Postgres (producao). Sem fallback: em
//      producao e preferivel falhar de forma visivel a servir dados noutro sitio.
//
// A sondagem e feita uma unica vez, com timeout curto, e o resultado fica
// tambem em process.env para que tenantRls.js veja o motor realmente usado.

// URL de fallback para a base local de desenvolvimento.
//
// ATENCAO AO CAMINHO: o Prisma resolve um URL `file:` RELATIVO AO FICHEIRO DE
// SCHEMA, nao a pasta onde se corre o comando. Como o schema SQLite vive em
// prisma/schema.sqlite.prisma, o mesmo URL produz pastas diferentes conforme o
// ponto de partida. Para nao haver ambiguidade usa-se um caminho ABSOLUTO,
// calculado a partir da raiz do projecto.
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

// O Prisma so aceita o protocolo do provider do schema. Um cliente gerado com
// provider "postgresql" RECUSA um URL file: (verificado), por isso cada motor
// precisa do seu schema e do seu `prisma generate`.
function generateClientFor(engine) {
  const schema = engine === 'sqlite' ? SCHEMA_SQLITE : SCHEMA_PG;
  // No Windows o npx e um ficheiro .cmd: sem `shell: true` o spawnSync
  // falha com EINVAL. Em Linux/macOS usa-se o binario directamente.
  const isWin = process.platform === 'win32';

  // Gerar o cliente em cada arranque e lento e, no Windows, pode falhar com
  // EPERM quando a query engine esta bloqueada por outro processo. Se ja
  // existe um cliente gerado para ESTE motor, usa-se: e o mesmo resultado.
  if (clientAlreadyFor(engine)) {
    console.log(`[db] cliente ja gerado para ${engine}`);
    return;
  }

  const { spawnSync } = require('child_process');
  const res = spawnSync(isWin ? 'npx.cmd' : 'npx',
    ['prisma', 'generate', '--schema', schema],
    { stdio: 'inherit', shell: isWin });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    // Ultimo recurso: se falhou o generate mas o cliente esta utilizavel,
    // continua. Um EPERM nao significa cliente corrompido.
    if (clientAlreadyFor(engine)) {
      console.warn(`[db] prisma generate falhou (${res.status}) mas o cliente ${engine} esta utilizavel`);
      return;
    }
    throw new Error('prisma generate falhou para ' + engine + ' (exit ' + res.status + ')');
  }
}

// O cliente gerado regista qual era o schema. Se coincidir com o motor pedido,
// nao ha nada a regenerar.
function clientAlreadyFor(engine) {
  try {
    const fs = require('fs');
    const path = require('path');
    const meta = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'schema.prisma');
    if (!fs.existsSync(meta)) return false;
    const content = fs.readFileSync(meta, 'utf8');
    return content.includes('provider = "' + engine + '"');
  } catch {
    return false;
  }
}

// A sondagem NAO pode depender de um cliente Postgres especifico (o modulo
// 'pg' nao e dependencia deste projecto, e '@prisma/client/runtime/library'
// varia entre versoes). O que precisamos saber e apenas: o host/porta do
// Postgres esta acessivel a partir desta maquina?
//
// Postgresql responde a um StartupMessage malformado com um packet de ERRO
// legivel (em vez de fechar a ligacao em silencio). Isso serve de prova:
//  - se chega 'E...'  -> servidor Postgres vivo e a falar;
//  - se a ligacao morre sem dados -> firewall/proxy a absorver.
function probePostgres(host, port, timeoutMs) {
  const net = require('net');
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let received = Buffer.alloc(0);
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; clearTimeout(timer); socket.destroy(); resolve(v); } };
    const timer = setTimeout(() => done({ reachable: false, reason: 'sem resposta do servidor Postgres' }), timeoutMs);

    socket.on('data', (chunk) => {
      received = Buffer.concat([received, chunk]);
      // Primeiro byte 'E' (0x45) = ErrorResponse do Postgres.
      if (received.length >= 1 && received[0] === 0x45) {
        done({ reachable: true, reason: 'servidor Postgres respondeu' });
      }
    });
    socket.on('error', (e) => done({ reachable: false, reason: e.message }));
    socket.on('close', () => done({ reachable: false, reason: 'ligacao fechada sem resposta' }));
    socket.on('connect', () => {
      // StartupMessage deliberadamente invalido para provocar um erro.
      // Nao envia credenciais: e so para confirmar que ha um Postgres la.
      const payload = Buffer.from('user\0probe\0', 'utf8');
      const len = Buffer.alloc(4);
      len.writeInt32BE(payload.length + 8, 0);
      try { socket.write(Buffer.concat([len, payload])); } catch { /* socket ja fechado */ }
    });
  });
}

function parseUrl(url) {
  try {
    const u = new URL(url);
    return { host: u.hostname, port: Number(u.port) || 5432 };
  } catch {
    return { host: null, port: 5432 };
  }
}

// SONDAGEM HONESTA: nao chega a porta estar aberta. Executa-se uma query
// real e so se considera "acessivel" se vier uma resposta.
//
// Porquê o cuidado: o pgbouncer aceita a ligacao TCP e responde ao
// StartupMessage, mas pode morrer ANTES de a primeira query (limite de
// conexoes do pooler, firewall que so deixa passar o SYN, etc). Um teste
// baseado so em "a porta abriu" daria falso positivo e o servidor arrancaria
// a believing que ha base de dados quando nao ha.
//
// Descarta o resultado anterior do probePostgres: so interessa o round-trip
// completo de uma query.
async function canReachPostgres() {
  const url = currentUrl();
  const { host, port } = parseUrl(url);
  if (!host) {
    console.warn('[db] nao foi possivel ler o host de DATABASE_URL');
    return false;
  }

  // 1) A porta responde de facto?
  const probe = await probePostgres(host, port, PROBE_TIMEOUT_MS);
  if (!probe.reachable) {
    console.warn(`[db] Postgres inacessivel em ${host}:${port} - ${probe.reason}`);
    return false;
  }

  // 2) Uma query real funciona? Usa o cliente "pg" e NAO o @prisma/client.
  //
  //    PORQUÊ o "pg" e obrigatório: o @prisma/client carregado aqui e o
  //    cliente JA GERADO, cujo provider pode ser "sqlite". Nesse caso
  //    `new PrismaClient({ url: 'postgresql://...' })` e rejeitado de
  //    imediato ("the URL must start with the protocol 'file:'") — o Postgres
  //   ismissivel seria classificado como inacessivel so por causa do motor do
  //    cliente, que e precisamente o que estamos a tentar decidir. O "pg" nao
  //    depende do Prisma: fala o protocolo nativo e prova a cadeia completa
  //    (ligacao + TLS + autenticacao + query).
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
    console.log(`[db] Postgres acessivel em ${host}:${port} (query de prova OK)`);
    return true;
  } catch (err) {
    const msg = String(err && err.message ? err.message : err).split('\n')[0];
    console.warn(`[db] a ligacao TCP abre mas a query falha - ${msg.slice(0, 140)}`);
    return false;
  }
}

// Devolve o motor escolhido e deixa process.env.DATABASE_URL coerente com ele,
// para que tenantRls.js e o resto do codigo vejam a base em uso.
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
    console.warn(`[db] a cair para SQLite de desenvolvimento (${FALLBACK_URL})`);
    console.warn('[db] ATENCAO: os dados ficam so nesta maquina e o RLS do Postgres nao se aplica.');
    return process.env.DATABASE_URL;
  }

  throw new Error(
    'Postgres inacessivel e DB_ALLOW_SQLITE_FALLBACK nao esta activo. ' +
    'Para desenvolvimento local, defina DB_ALLOW_SQLITE_FALLBACK=true no .env.'
  );
}

// Escolhe o motor, gera o cliente correspondente e devolve o URL final.
async function prepareDatabase() {
  const url = await resolveDatabaseUrl();
  const engine = url.startsWith('file:') ? 'sqlite' : 'postgresql';
  generateClientFor(engine);
  console.log(`[db] motor preparado: ${engine}`);
  return { url, engine };
}

module.exports = { prepareDatabase, resolveDatabaseUrl, isSqliteUrl, generateClientFor, FALLBACK_URL };