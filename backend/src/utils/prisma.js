// Cliente Prisma com escolha de motor feita no arranque (VERSAO 2026-09-26).
//
// O motor e resolvido por src/utils/dbEngine.js ANTES de `new PrismaClient()`,
// porque o Prisma valida a URL no construtor. Como os testes de Prisma exigem
// um schema estatico, o provider do schema.prisma fica fixo em "postgresql"
// e, no caminho SQLite, o URL `file:` e devolvido pelo utilitario de fallback.
//
// Proxy
// em qualquer modulo, e o motor e escolhido na primeira utilisation. Para
// garantir que a escolha acontece antes de qualquer query, src/index.js chama
// `await prisma.ready()` durante o arranque.

// ============================================================================
//  Cliente Prisma com escolha de motor feita no arranque.
//
//  ORDEM CRITICA (ver src/utils/dbEngine.js):
//  1. escolher o motor (Postgres ou SQLite) testando a ligacao real;
//  2. correr `prisma generate` com o schema desse motor;
//  3. só ENTAO carregar o modulo '@prisma/client'.
//
//  Se o require('@prisma/client') acontecer antes do generate, o Node guarda em
//  memoria o cliente do schema anterior e continua a validar contra esse
//  provider. Foi o que aconteceu na primeira versao deste ficheiro: gerava o
//  cliente SQLite mas o erro continuava a citar schema.prisma (postgresql).
//  Por isso este modulo nao faz o require no topo.
//
//  A API e um Proxy preguicoso: `prisma.tenant.findMany()` continua a funcionar
//  em qualquer modulo, sem alterar uma unica linha dos.routes.
// ============================================================================

const { prepareDatabase } = require('./dbEngine2');

let client = null;
let initPromise = null;

async function init() {
  if (client) return client;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { url, engine } = await prepareDatabase();
    // Require tardio e intencional: so depois de o cliente estar gerado.
    const { PrismaClient } = require('@prisma/client');
    client = new PrismaClient();
    console.log(`[db] cliente pronto (${engine})`);
    return client;
  })();

  try {
    return await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

const proxy = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'ready') return init;
    if (prop === 'engineName') {
      return () => (String(process.env.DATABASE_URL || '').startsWith('file:') ? 'sqlite' : 'postgresql');
    }
    // Se o cliente ja existe, repassa tudo directamente.
    if (client) {
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    }
    // Antes de estar pronto, qualquer acesso dispara a inicializacao.
    return (...args) => init().then((c) => {
      const v = c[prop];
      return typeof v === 'function' ? v.apply(c, args) : v;
    });
  },
  has(_target, prop) {
    return client ? prop in client : true;
  },
});

module.exports = proxy;
