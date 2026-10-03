// Cliente Prisma com escolha de motor feita no arranque (VERSAO 2026-09-26).
//
// O motor e resolvido por src/utils/dbEngine2.js ANTES de `new PrismaClient()`,
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
//  ORDEM CRITICA (ver src/utils/dbEngine2.js):
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

const { AsyncLocalStorage } = require('async_hooks');
const { prepareDatabase } = require('./dbEngine2');

// ============================================================================
//  RLS A SERIO (Genesis 2.0) — dois clientes:
//   - SISTEMA (DATABASE_URL, papel postgres, BYPASSRLS): login, sessao, painel
//     admin, emparelhamento de terminais, scripts. Usado quando NAO ha loja no
//     contexto do pedido.
//   - APLICACAO (APP_DATABASE_URL, papel genesis_app, SEM bypassrls): usado
//     automaticamente quando o pedido tem uma loja no contexto. Cada operacao
//     corre numa transaccao com set_config('app.tenant_id', ...), por isso as
//     politicas do Postgres (prisma/rls_v2.sql) isolam as lojas MESMO que uma
//     rota se esqueca do filtro tenant_id.
//  O contexto e posto por middleware/auth.js e middleware/terminalAuth.js
//  (runWithTenant). Transaccoes em LOTE ($transaction([...])) nao sao
//  suportadas em contexto de loja: usar transaccoes interactivas.
// ============================================================================
const tenantContext = new AsyncLocalStorage();

let client = null;
let appClient = null;
let initPromise = null;

const txOptions = () => ({
  // Transacoes interativas: o Prisma desiste aos 5 s por omissao. Com o
  // Supabase (Frankfurt) medimos ~1,2 s por query a partir de Maputo, e uma
  // venda faz ~12 queries — TODAS as vendas falhavam com 500 "Transaction not
  // found" (verificado 2026-10-03). Limites configuraveis por env.
  maxWait: Number(process.env.DB_TX_MAX_WAIT_MS || 15000),
  timeout: Number(process.env.DB_TX_TIMEOUT_MS || 45000),
});

// Abrir uma ligacao nova ao Supabase a partir de Maputo (TCP + TLS + auth)
// passa muitas vezes dos 5 s que o Prisma da por omissao -> P1001 "Can't reach
// database server" -> 500 numa venda -> o POS diz "servidor indisponivel".
// A espera por uma ligacao livre do pool (10 s por omissao) tambem esgota: com
// ~1-2,5 s por query, 6 pedidos em paralelo do Inicio (ou venda + catalogo +
// sync no POS) davam P2024 -> 500. O NUMERO de ligacoes nao sobe: o Postgres do
// Supabase so tem 60 (max_connections) para todos os processos.
// Valores so acrescentados se o URL nao os trouxer.
function withConnectTimeout(url) {
  if (!url || url.startsWith('file:')) return url;
  try {
    const u = new URL(url);
    const defaults = {
      connect_timeout: process.env.DB_CONNECT_TIMEOUT_S || 30,
      pool_timeout: process.env.DB_POOL_TIMEOUT_S || 30,
    };
    for (const [k, v] of Object.entries(defaults)) if (!u.searchParams.has(k)) u.searchParams.set(k, String(Number(v)));
    return u.toString();
  } catch (_) { return url; }
}

async function init() {
  if (client) return client;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { engine } = await prepareDatabase();
    // Require tardio e intencional: so depois de o cliente estar gerado.
    const { PrismaClient } = require('@prisma/client');
    client = new PrismaClient({ transactionOptions: txOptions(), datasources: { db: { url: withConnectTimeout(process.env.DATABASE_URL) } } });
    const rlsWanted = engine === 'postgresql' && process.env.APP_DATABASE_URL && String(process.env.DB_RLS_ENFORCE).toLowerCase() !== 'false';
    if (rlsWanted) {
      appClient = new PrismaClient({ transactionOptions: txOptions(), datasources: { db: { url: withConnectTimeout(process.env.APP_DATABASE_URL) } } });
      console.log('[db] RLS activo: pedidos de loja usam o papel sem bypassrls');
    } else if (engine === 'postgresql') {
      const msg = '[db] AVISO: RLS NAO aplicado (APP_DATABASE_URL em falta ou DB_RLS_ENFORCE=false). O isolamento depende so dos filtros da aplicacao.';
      if (process.env.NODE_ENV === 'production') throw new Error(msg);
      console.warn(msg);
    }
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

const setTenant = (c, tenantId) => c.$executeRaw`SELECT set_config('app.tenant_id', ${String(tenantId)}, true)`;

// Operacao isolada: [set_config, operacao] na mesma transaccao (mesma ligacao).
const scoped = (tenantId, makeOp) => appClient.$transaction([setTenant(appClient, tenantId), makeOp()]).then((r) => r[1]);

function tenantModel(model, tenantId) {
  return new Proxy({}, {
    get(_t, op) {
      if (op === 'then' || typeof op === 'symbol') return undefined;
      return (...args) => scoped(tenantId, () => appClient[model][op](...args));
    },
  });
}

function tenantClientProp(prop, tenantId) {
  if (prop === '$transaction') {
    return (arg, opts) => {
      if (typeof arg !== 'function') {
        throw new Error('$transaction em lote nao suportado em contexto de loja (RLS): use uma transaccao interactiva');
      }
      return appClient.$transaction(async (tx) => {
        await setTenant(tx, tenantId);
        return arg(tx);
      }, opts);
    };
  }
  if (prop === '$queryRaw' || prop === '$executeRaw' || prop === '$queryRawUnsafe' || prop === '$executeRawUnsafe') {
    return (...args) => scoped(tenantId, () => appClient[prop](...args));
  }
  const value = appClient[prop];
  if (value && typeof value === 'object' && typeof value.findMany === 'function') return tenantModel(prop, tenantId);
  return typeof value === 'function' ? value.bind(appClient) : value;
}

function runWithTenant(tenantId, fn) {
  if (!tenantId) return fn();
  return tenantContext.run({ tenantId: String(tenantId) }, fn);
}

const proxy = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'ready') return init;
    if (prop === 'runWithTenant') return runWithTenant;
    if (prop === 'rlsActive') return () => Boolean(appClient);
    if (prop === 'system') return client;
    if (prop === 'engineName') {
      return () => (String(process.env.DATABASE_URL || '').startsWith('file:') ? 'sqlite' : 'postgresql');
    }
    if (client) {
      const store = tenantContext.getStore();
      if (store && appClient) return tenantClientProp(prop, store.tenantId);
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    }
    // Antes de `ready()` resolver: cada acesso e ADIADO (cliente de sistema).
    const lazy = (resolver) => new Proxy(function () {}, {
      get(_t, sub) {
        // `then` nao e uma propriedade do delegate: devolvemos undefined para
        // o objecto NAO ser considerado thenable (senao o await entra em laco).
        if (sub === 'then' || typeof sub === 'symbol') return undefined;
        return lazy(() => resolver().then((v) => (v == null ? v : v[sub])));
      },
      apply(_t, _this, args) {
        return resolver().then((v) => (typeof v === 'function' ? v.apply(v, args) : v));
      }
    });

    return lazy(() => init().then((c) => c[prop]));
  },
  has(_target, prop) {
    return client ? prop in client : true;
  },
});

module.exports = proxy;
