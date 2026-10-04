// ===========================================================================
// VERIFICACAO DO SISTEMA (Genesis 2.0) — prova real, nao "acho".
//
// Uso (com um backend a correr):
//   PORT=4100 node src/index.js        # noutro terminal
//   node scripts/verify_system.js      # todas as seccoes
//   node scripts/verify_system.js 2 8  # so algumas
//
// Cria uma LOJA DE TESTE descartavel (dono, caixista com PIN, produto, PIN de
// autorizacao) e um Super Admin de teste, corre pedidos HTTP reais contra
// BASE_URL (por omissao http://127.0.0.1:4100) e no fim APAGA tudo o que criou,
// mesmo que um teste falhe a meio. Sai com codigo 1 se algo falhar.
// A seccao 12 espera TENANT_STATUS_CACHE_MS (30 s por omissao) — arrancar o
// servidor com TENANT_STATUS_CACHE_MS=1000 torna-a rapida.
// ===========================================================================
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');
const { signAccessToken } = require('../src/utils/tokens');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4100';
const ONLY = process.argv.slice(2);
const OWNER_PW = 'Teste-Dono-' + crypto.randomBytes(6).toString('hex');
const PIN = '4321';          // PIN de autorizacao do dono (cancelamentos/descontos)
const CASHIER_PIN = '2468';  // PIN pessoal do caixista no terminal
const ADMIN_ORIGIN = (process.env.ADMIN_ORIGINS || 'http://localhost:5175').split(',')[0].trim();
const STATUS_CACHE_MS = Number(process.env.TENANT_STATUS_CACHE_MS || 30000);

let failures = 0;
const ok = (cond, msg, extra) => {
  if (cond) console.log('  OK    ' + msg);
  else { failures++; console.log('  FALHA ' + msg + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); }
};
const section = (n, t) => console.log('\n=== ' + n + '. ' + t + ' ===');
const wants = (n) => ONLY.length === 0 || ONLY.includes(String(n));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cliente HTTP com "browser" proprio (jar de cookies).
function client(initialCookie, defaultHeaders = {}) {
  const jar = new Map();
  if (initialCookie) jar.set('token', initialCookie);
  return {
    jar,
    async req(method, path, body, headers = {}) {
      const h = { 'Content-Type': 'application/json', ...defaultHeaders, ...headers };
      if (jar.size) h.Cookie = [...jar].map(([k, v]) => k + '=' + v).join('; ');
      const r = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
      for (const c of (r.headers.getSetCookie ? r.headers.getSetCookie() : [])) {
        const [kv] = c.split(';');
        const i = kv.indexOf('=');
        const k = kv.slice(0, i); const v = kv.slice(i + 1);
        if (!v || /Expires=Thu, 01 Jan 1970/i.test(c)) jar.delete(k); else jar.set(k, v);
      }
      let data = null; try { data = await r.json(); } catch { data = null; }
      return { status: r.status, data };
    },
  };
}

const ctx = {};

async function setup() {
  const tag = 'TESTE-SEGURANCA-' + Date.now();
  ctx.tenant = await prisma.tenant.create({ data: {
    name: tag, owner_name: 'Dono Teste', business_type: 'bottle_store', location: 'Teste',
    phone: '840000000', status: 'active', onboarding_completed: true, discount_free_pct: 10,
    cancel_pin_hash: await bcrypt.hash(PIN, 10),
  } });
  ctx.owner = await prisma.user.create({ data: {
    tenant_id: ctx.tenant.id, role: 'owner', name: 'Dono Teste', email: tag.toLowerCase() + '-dono@teste.local',
    password_hash: await bcrypt.hash(OWNER_PW, 12), is_active: true } });
  ctx.cashier = await prisma.user.create({ data: {
    tenant_id: ctx.tenant.id, role: 'cashier', name: 'Caixa Teste', email: tag.toLowerCase() + '-caixa@teste.local',
    password_hash: await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10),
    pin_hash: await bcrypt.hash(CASHIER_PIN, 10), is_active: true } });
  ctx.product = await prisma.product.create({ data: {
    tenant_id: ctx.tenant.id, name: 'Cerveja Teste', category: 'Bebidas', sell_price: 10000, cost_price: 6000, stock_qty: 50, is_active: true } });
  ctx.admin = await prisma.user.create({ data: {
    tenant_id: null, role: 'super_admin', name: 'Admin Teste', email: tag.toLowerCase() + '-admin@teste.local',
    password_hash: await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 12), is_active: true } });
  console.log('loja de teste criada: ' + ctx.tenant.id);
}

async function cleanup() {
  if (!ctx.tenant) return;
  const t = ctx.tenant.id;
  const userIds = (await prisma.user.findMany({ where: { tenant_id: t }, select: { id: true } })).map((u) => u.id);
  if (ctx.admin) userIds.push(ctx.admin.id);
  const saleIds = (await prisma.sale.findMany({ where: { tenant_id: t }, select: { id: true } })).map((s) => s.id);
  const debtIds = (await prisma.debt.findMany({ where: { tenant_id: t }, select: { id: true } })).map((d) => d.id);
  await prisma.saleItem.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.sale.deleteMany({ where: { tenant_id: t } });
  await prisma.debtPayment.deleteMany({ where: { debt_id: { in: debtIds } } });
  await prisma.debt.deleteMany({ where: { tenant_id: t } });
  for (const model of ['stockLot', 'stockEntry', 'shrinkageRecord', 'demandCapture', 'shiftClosing', 'productPriceHistory', 'fixedCost', 'employee', 'saleGoal', 'posTerminal', 'supplier']) {
    await prisma[model].deleteMany({ where: { tenant_id: t } });
  }
  await prisma.auditLog.deleteMany({ where: { OR: [{ tenant_id: t }, { user_id: { in: userIds } }, { entity_id: t }] } });
  await prisma.product.deleteMany({ where: { tenant_id: t } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.tenant.delete({ where: { id: t } });
  const left = await prisma.tenant.count({ where: { id: t } });
  console.log('\nlimpeza: loja de teste ' + (left === 0 ? 'apagada' : 'NAO apagada'));
}

const saleBody = (overrides = {}) => ({
  items: [{ product_id: ctx.product.id, quantity: 1, unit_sell_price: 10000, unit_cost_price: 6000 }],
  total_amount: 10000, payment_method: 'cash', amount_received: 10000, ...overrides,
});

const ownerClient = () => client(signAccessToken(ctx.owner));
const adminClient = () => client(signAccessToken(ctx.admin), { Origin: ADMIN_ORIGIN });

// Emparelha um "browser de balcao" novo com a loja de teste.
async function pairedTerminal(name = 'Balcao teste') {
  const code = await ownerClient().req('POST', '/api/owner/terminals/pairing-code', { name });
  if (code.status !== 201) throw new Error('codigo de emparelhamento falhou: ' + JSON.stringify(code));
  const term = client();
  const paired = await term.req('POST', '/api/pos/pair', { code: code.data.code });
  if (paired.status !== 201) throw new Error('emparelhamento falhou: ' + JSON.stringify(paired));
  return term;
}

// ---------------------------------------------------------------------------
async function test2() {
  section(2, 'Terminal emparelhado + PIN do caixista (a conta do dono fora do balcao)');
  const owner = ownerClient();
  const code = await owner.req('POST', '/api/owner/terminals/pairing-code', { name: 'Balcao 1' });
  ok(code.status === 201 && /^\d{6}$/.test(code.data?.code || ''), 'dono gera codigo de 6 digitos', code);

  const term = client();
  ok((await term.req('GET', '/api/pos/terminal')).status === 401, 'browser nao emparelhado: terminal = 401');
  ok((await term.req('POST', '/api/pos/pair', { code: '000000' })).status === 400, 'codigo errado: 400');
  const paired = await term.req('POST', '/api/pos/pair', { code: code.data.code });
  ok(paired.status === 201 && term.jar.has('genesis_terminal'), 'codigo certo: terminal emparelhado (cookie httpOnly)', paired);
  ok((await client().req('POST', '/api/pos/pair', { code: code.data.code })).status === 400, 'o mesmo codigo nao serve duas vezes');
  ok(!term.jar.has('token'), 'emparelhar nao deixa nenhuma sessao de dono no balcao');

  const info = await term.req('GET', '/api/pos/terminal');
  ok(info.status === 200 && info.data.cashiers.some((c) => c.id === ctx.cashier.id && c.has_pin), 'terminal lista o perfil do caixista', info.data);
  ok(!JSON.stringify(info.data).includes('pin_hash'), 'a lista de perfis nao expoe hashes');

  const bad = await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: '0000' });
  ok(bad.status === 401 && bad.data?.code === 'INVALID_PIN', 'PIN errado: 401', bad);
  const good = await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok(good.status === 200 && term.jar.has('token'), 'PIN certo: sessao do caixista aberta', good);
  const me = await term.req('GET', '/api/auth/me');
  ok(me.data?.user?.role === 'cashier' && me.data?.user?.scope === 'pos', 'sessao: role=cashier, scope=pos', me.data);

  const sale = await term.req('POST', '/api/sales', saleBody());
  ok(sale.status === 201, 'caixista vende no terminal (201)', sale);
  const saved = sale.data?.id ? await prisma.sale.findUnique({ where: { id: sale.data.id } }) : null;
  ok(saved && saved.cashier_user_id === ctx.cashier.id, 'venda fica em nome do caixista que entrou com o PIN');

  for (const [m, p, b] of [
    ['GET', '/api/owner/reports/monthly'], ['GET', '/api/dashboard/summary'], ['PUT', '/api/settings/discount', { discount_free_pct: 90 }],
    ['PATCH', '/api/products/' + ctx.product.id, { sell_price: 1 }], ['GET', '/api/owner/terminals'], ['GET', '/api/inventory/stock'],
  ]) {
    const r = await term.req(m, p, b);
    ok(r.status === 403, 'terminal NAO chega a ' + m + ' ' + p, r);
  }

  const shift = await term.req('GET', '/api/pos/shift');
  ok(shift.status === 200 && shift.data.hasOpenSales === true && shift.data.expected === undefined, 'estado do turno sem revelar o valor esperado', shift.data);
  const low = await term.req('POST', '/api/pos/shift/close', { declared_amount: 100 });
  ok(low.status === 400 && low.data?.remaining === 2, 'fecho cego abaixo do esperado: tentativa falhada', low.data);
  const close = await term.req('POST', '/api/pos/shift/close', { declared_amount: 10000 });
  ok(close.status === 201 && close.data?.exact === true, 'fecho cego com o valor certo: turno fechado pelo caixista', close.data);
  // Limpa a tentativa falhada para nao contaminar as seccoes seguintes.
  await prisma.auditLog.deleteMany({ where: { tenant_id: ctx.tenant.id, action: 'SHIFT_ATTEMPT_FAIL' } });

  const lock = await term.req('POST', '/api/pos/lock');
  ok(lock.status === 200 && !term.jar.has('token') && term.jar.has('genesis_terminal'), 'bloquear: sai o caixista, o terminal continua emparelhado');
  ok((await term.req('GET', '/api/products')).status === 401, 'depois de bloquear nao ha sessao');

  // Fila offline com a sessao expirada: o cookie do terminal + seller_user_id chega.
  const offline = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID(), seller_user_id: ctx.cashier.id }));
  ok(offline.status === 201, 'sincronizacao offline so com o cookie do terminal (201)', offline);
  const forged = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID(), seller_user_id: ctx.owner.id }));
  ok(forged.status === 403 && forged.data?.code === 'INVALID_SELLER', 'terminal nao vende em nome do dono (403)', forged);

  ok((await client().req('POST', '/api/auth/login', { email: ctx.cashier.email, password: 'x-qualquer' })).data?.code === 'USE_TERMINAL', 'caixista nao entra pelo login de email');

  const list = await owner.req('GET', '/api/owner/terminals');
  const t = list.data?.[0];
  ok(list.status === 200 && t && t.secret_hash === undefined, 'dono ve o terminal (sem o segredo)');
  await owner.req('POST', '/api/owner/terminals/' + t.id + '/revoke');
  ok((await term.req('GET', '/api/pos/terminal')).status === 401, 'terminal revogado deixa de funcionar');

  const term2 = await pairedTerminal('Balcao 2');
  for (let i = 0; i < 5; i++) await term2.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: '1111' });
  const lockedOut = await term2.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok(lockedOut.status === 423, '5 PINs errados: perfil travado 15 min, nem o PIN certo entra (423)', lockedOut);
  await prisma.auditLog.deleteMany({ where: { tenant_id: ctx.tenant.id, action: 'POS_PIN_FAIL' } });
}

async function newSale(c) {
  const r = await c.req('POST', '/api/sales', saleBody());
  if (r.status !== 201) throw new Error('nao consegui criar venda de teste: ' + JSON.stringify(r));
  return r.data.id;
}

async function test3() {
  section(3, 'PIN de cancelamento: falhas ficam gravadas e bloqueiam');
  const owner = client(signAccessToken(ctx.owner));
  const stock0 = (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
  const saleA = await newSale(owner);

  for (let i = 1; i <= 3; i++) {
    const r = await owner.req('POST', '/api/sales/' + saleA + '/cancel', { pin: '0000', reason: 'teste' });
    ok(r.status === 403 && r.data?.code === 'INVALID_PIN', 'PIN errado #' + i + ' = 403', r);
  }
  const persisted = await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'CANCEL_ATTEMPT', entity_id: saleA } });
  ok(persisted === 3, 'as 3 falhas ficaram gravadas na BD (antes: 0, desfeitas pelo rollback)', persisted);

  const locked = await owner.req('POST', '/api/sales/' + saleA + '/cancel', { pin: PIN, reason: 'teste' });
  ok(locked.status === 423, 'venda bloqueada: nem o PIN certo a cancela (423)', locked);
  const stA = await prisma.sale.findUnique({ where: { id: saleA }, select: { status: true } });
  ok(stA.status === 'completed', 'a venda bloqueada continua concluida');

  const saleB = await newSale(owner);
  const okCancel = await owner.req('POST', '/api/sales/' + saleB + '/cancel', { pin: PIN, reason: 'cliente desistiu' });
  ok(okCancel.status === 200, 'PIN certo noutra venda = cancela (200)', okCancel);
  const stB = await prisma.sale.findUnique({ where: { id: saleB }, select: { status: true, cancel_reason: true } });
  ok(stB.status === 'cancelled' && stB.cancel_reason === 'cliente desistiu', 'venda B cancelada com motivo gravado');
  const again = await owner.req('POST', '/api/sales/' + saleB + '/cancel', { pin: PIN });
  ok(again.status === 409, 'cancelar duas vezes = 409', again);
  const stock1 = (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
  ok(stock1 === stock0 - 1, 'stock: A vendida (-1), B vendida e reposta (0) => ' + stock0 + ' -> ' + stock1);

  // Bloqueio da loja: 3 falhas ja feitas + 2 noutra venda = 5 em 15 min.
  const saleC = await newSale(owner);
  for (let i = 0; i < 2; i++) await owner.req('POST', '/api/sales/' + saleC + '/cancel', { pin: '9999' });
  const saleD = await newSale(owner);
  const tenantLock = await owner.req('POST', '/api/sales/' + saleD + '/cancel', { pin: PIN });
  ok(tenantLock.status === 429 && tenantLock.data?.code === 'TENANT_CANCEL_LOCKED', '5 PINs errados na loja: cancelamentos travados 15 min (429)', tenantLock);
}

async function test4() {
  section(4, 'Preco unitario tem de ser o do catalogo');
  const cashier = client(signAccessToken(ctx.cashier));
  const stock0 = (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
  const sales0 = await prisma.sale.count({ where: { tenant_id: ctx.tenant.id } });

  const cheap = await cashier.req('POST', '/api/sales', saleBody({
    items: [{ product_id: ctx.product.id, quantity: 1, unit_sell_price: 1, unit_cost_price: 6000 }], total_amount: 1, amount_received: 1 }));
  ok(cheap.status === 409 && cheap.data?.code === 'PRICE_MISMATCH', 'caixista regista cerveja a 1 centavo: recusado (409)', cheap);
  const dear = await cashier.req('POST', '/api/sales', saleBody({
    items: [{ product_id: ctx.product.id, quantity: 1, unit_sell_price: 15000, unit_cost_price: 6000 }], total_amount: 15000, amount_received: 15000 }));
  ok(dear.status === 409, 'acima do catalogo: recusado (409)', dear);

  const exact = await cashier.req('POST', '/api/sales', saleBody());
  ok(exact.status === 201, 'preco de catalogo: aceite (201)', exact);
  const disc = await cashier.req('POST', '/api/sales', saleBody({ discount_amount: 1000, total_amount: 9000, amount_received: 9000 }));
  ok(disc.status === 201, 'reducao pelo campo desconto: aceite (201)', disc);
  const saved = disc.data?.id ? await prisma.sale.findUnique({ where: { id: disc.data.id } }) : null;
  ok(saved && saved.discount_amount === 1000 && saved.total_amount === 9000, 'desconto fica visivel na venda gravada', saved && { d: saved.discount_amount, t: saved.total_amount });

  const sales1 = await prisma.sale.count({ where: { tenant_id: ctx.tenant.id } });
  const stock1 = (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
  ok(sales1 - sales0 === 2 && stock0 - stock1 === 2, 'so as 2 vendas validas foram gravadas e baixaram stock', { vendas: sales1 - sales0, stock: stock0 - stock1 });
}

async function test5() {
  section(5, 'Ajuste de stock: so o dono, atomico e auditado');
  const cashier = client(signAccessToken(ctx.cashier));
  const owner = client(signAccessToken(ctx.owner));
  const stock = async () => (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
  const s0 = await stock();

  const c1 = await cashier.req('PATCH', '/api/products/' + ctx.product.id + '/stock', { delta: -20 });
  ok(c1.status === 403, 'caixista tenta abater 20 unidades: recusado (403)', c1);
  ok((await stock()) === s0, 'stock intacto (' + s0 + ')');

  const o1 = await owner.req('PATCH', '/api/products/' + ctx.product.id + '/stock', { delta: -3, reason: 'contagem fisica' });
  ok(o1.status === 200 && o1.data?.stock_qty === s0 - 3, 'dono ajusta -3: aceite e devolve o stock novo', o1.data && o1.data.stock_qty);
  const audit = await prisma.auditLog.findFirst({ where: { tenant_id: ctx.tenant.id, action: 'STOCK_ADJUSTMENT', entity_id: ctx.product.id }, orderBy: { created_at: 'desc' } });
  ok(audit && JSON.parse(audit.new_value).reason === 'contagem fisica', 'ajuste gravado na auditoria com motivo e valores', audit && audit.new_value);

  const tooMuch = await owner.req('PATCH', '/api/products/' + ctx.product.id + '/stock', { delta: -100000 });
  ok(tooMuch.status === 400 && (await stock()) === s0 - 3, 'abater mais do que existe: recusado e stock nao fica negativo');

  // Concorrencia: 5 ajustes de +1 em paralelo tem de dar +5 (antes perdia actualizacoes).
  const before = await stock();
  const rs = await Promise.all(Array.from({ length: 5 }, () => owner.req('PATCH', '/api/products/' + ctx.product.id + '/stock', { delta: 1, reason: 'paralelo' })));
  ok(rs.every((r) => r.status === 200), '5 ajustes em paralelo responderam 200', rs.map((r) => r.status));
  ok((await stock()) === before + 5, '5 ajustes em paralelo: nenhum perdido (' + before + ' -> ' + (await stock()) + ')');
}

async function test6() {
  section(6, 'Fila offline: id fixo, sem duplicados, recusas visiveis (ponta-a-ponta)');
  const path = require('path');
  const { pathToFileURL } = require('url');
  const { createRequire } = require('module');
  const FE = path.resolve(__dirname, '..', '..', 'frontend');
  const feRequire = createRequire(path.join(FE, 'package.json'));
  feRequire('fake-indexeddb/auto');
  const Dexie = feRequire('dexie');
  const { runSync, countQueue } = await import(pathToFileURL(path.join(FE, 'src', 'utils', 'offlineQueue.js')).href);

  const cashier = client(signAccessToken(ctx.cashier));
  const post = (p, body) => cashier.req('POST', p, body).catch(() => ({ status: 0, data: null }));
  const stock = async () => (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
  const salesCount = () => prisma.sale.count({ where: { tenant_id: ctx.tenant.id } });

  // a) O servidor e idempotente pelo id.
  const fixedId = crypto.randomUUID();
  const s0 = await stock(); const n0 = await salesCount();
  const r1 = await cashier.req('POST', '/api/sales', saleBody({ id: fixedId }));
  const r2 = await cashier.req('POST', '/api/sales', saleBody({ id: fixedId }));
  ok(r1.status === 201 && r2.data?.id === fixedId, 'mesma venda enviada 2x: mesmo id devolvido', [r1.status, r2.status]);
  ok((await salesCount()) === n0 + 1 && (await stock()) === s0 - 1, 'so 1 venda gravada e stock baixou 1 (sem duplicado)');

  // b) Fila real -> servidor real.
  const idb = new Dexie('GenesisVerify' + Date.now());
  idb.version(6).stores({
    sales: 'id, created_at, sync_state',
    demand_captures: 'id, requested_at, sync_state',
    shrinkage_records: 'id, recorded_at, sync_state',
  });
  const saleId = crypto.randomUUID();
  const dcId = crypto.randomUUID();
  const shId = crypto.randomUUID();
  const now = new Date().toISOString();
  // Venda guardada SEM id no payload (como as filas antigas): o id local e a chave.
  await idb.sales.put({ id: saleId, created_at: now, sync_state: 'pending', payload: saleBody() });
  await idb.demand_captures.put({ id: dcId, product_id: ctx.product.id, requested_at: now, sync_state: 'pending', tenant_id: 'local-tenant', recorded_by: null });
  await idb.shrinkage_records.put({ id: shId, product_id: ctx.product.id, quantity: 2, reason: 'broken', recorded_at: now, sync_state: 'pending', tenant_id: 'local-tenant', recorded_by: null });

  const sA = await stock(); const nA = await salesCount();
  const pass1 = await runSync(idb, post);
  ok(pass1.synced === 3 && pass1.rejected === 0, 'fila: venda + pedido + quebra enviados (3 sincronizados)', pass1);
  ok(Boolean(await prisma.sale.findUnique({ where: { id: saleId } })), 'venda offline existe na BD com o id local');
  ok(Boolean(await prisma.demandCapture.findUnique({ where: { id: dcId } })), 'pedido de reposicao chegou a BD (antes nunca saia do browser)');
  ok(Boolean(await prisma.shrinkageRecord.findUnique({ where: { id: shId } })), 'quebra chegou a BD (antes nunca saia do browser)');
  ok((await stock()) === sA - 3, 'stock: -1 venda -2 quebra = ' + sA + ' -> ' + (await stock()));

  // Resposta "perdida": tudo volta a pendente e e reenviado.
  for (const t of ['sales', 'demand_captures', 'shrinkage_records']) await idb.table(t).toCollection().modify({ sync_state: 'pending' });
  const pass2 = await runSync(idb, post);
  ok(pass2.synced === 3, 'reenvio dos mesmos 3 registos aceite', pass2);
  ok((await salesCount()) === nA + 1, 'reenvio NAO duplicou a venda');
  ok((await prisma.shrinkageRecord.count({ where: { id: shId } })) === 1 && (await stock()) === sA - 3, 'reenvio NAO duplicou a quebra nem baixou stock outra vez');

  // c) Recusa de regra: fica marcada com motivo, nao e reenviada para sempre.
  const badId = crypto.randomUUID();
  await idb.sales.put({ id: badId, created_at: now, sync_state: 'pending', payload: saleBody({
    items: [{ product_id: ctx.product.id, quantity: 1, unit_sell_price: 1, unit_cost_price: 6000 }], total_amount: 1, amount_received: 1 }) });
  const pass3 = await runSync(idb, post);
  const bad = await idb.sales.get(badId);
  ok(pass3.rejected === 1 && bad.sync_state === 'rejected' && /catálogo|catalogo/.test(bad.reject_reason), 'venda com preco errado: marcada RECUSADA com o motivo do servidor', bad && bad.reject_reason);
  ok((await countQueue(idb)).rejected === 1 && (await countQueue(idb)).pending === 0, 'contadores: 0 pendentes, 1 recusada (visivel no POS)');
  ok(!(await prisma.sale.findUnique({ where: { id: badId } })), 'venda recusada nao existe na BD');

  // d) Caixista bloqueado no fecho cego: o servidor recusa com 4xx -> o POS
  //    ja NAO a mete na fila como "servidor indisponivel".
  for (let i = 0; i < 3; i++) {
    await prisma.auditLog.create({ data: { tenant_id: ctx.tenant.id, user_id: ctx.owner.id, action: 'SHIFT_ATTEMPT_FAIL', entity_type: 'user', entity_id: ctx.cashier.id, ip_address: '127.0.0.1' } });
  }
  const lockedSale = await cashier.req('POST', '/api/sales', saleBody());
  const { shouldQueueOffline } = await import(pathToFileURL(path.join(FE, 'src', 'utils', 'syncPolicy.js')).href);
  ok(lockedSale.status === 403, 'caixista bloqueado: servidor recusa a venda (403)', lockedSale);
  ok(shouldQueueOffline({ response: { status: lockedSale.status } }) === false, '... e a politica do POS NAO a guarda na fila');
  idb.close();
}

// A seccao 6 deixa o caixista bloqueado (3 falhas no fecho). O dono desbloqueia
// pelo proprio painel — e esta chamada e ela propria uma verificacao.
async function unlockCashier() {
  const r = await ownerClient().req('POST', '/api/owner/cashiers/' + ctx.cashier.id + '/unlock');
  if (r.status !== 200) throw new Error('desbloqueio falhou: ' + JSON.stringify(r));
}

async function test7() {
  section(7, 'Caixista desactivado / PIN mudado perde a sessao (tambem no refresh)');
  const jwt = require('jsonwebtoken');
  await unlockCashier();
  const owner = ownerClient();
  const caixa = await pairedTerminal('Balcao 7');
  const login = await caixa.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok(login.status === 200 && caixa.jar.has('token') && caixa.jar.has('refreshToken'), 'PIN no terminal: access + refresh', login);
  ok((await caixa.req('GET', '/api/products')).status === 200, 'sessao valida: produtos = 200');

  const legacy = client(jwt.sign({ userId: ctx.cashier.id, tenantId: ctx.tenant.id, role: 'cashier', name: 'x' }, process.env.JWT_SECRET, { expiresIn: '1h' }));
  ok((await legacy.req('GET', '/api/products')).status === 401, 'token antigo sem versao de senha: 401');

  ok((await owner.req('PUT', '/api/owner/cashiers/' + ctx.cashier.id + '/deactivate')).status === 200, 'dono desactiva o caixista');
  const after = await caixa.req('GET', '/api/products');
  ok(after.status === 401 && after.data?.code === 'ACCOUNT_INACTIVE', 'mesma sessao logo a seguir: 401 ACCOUNT_INACTIVE', after);
  ok((await caixa.req('POST', '/api/refresh')).status === 401, 'refresh de conta desactivada: 401');
  ok((await owner.req('PUT', '/api/owner/cashiers/' + ctx.cashier.id + '/reactivate')).status === 200, 'dono reactiva');

  const caixa2 = await pairedTerminal('Balcao 7b');
  await caixa2.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok((await caixa2.req('GET', '/api/products')).status === 200, 'reactivado entra de novo');
  ok((await owner.req('PUT', '/api/owner/cashiers/' + ctx.cashier.id + '/pin', { pin: '1357' })).status === 200, 'dono define PIN novo');
  const stale = await caixa2.req('GET', '/api/products');
  ok(stale.status === 401 && stale.data?.code === 'PASSWORD_CHANGED', 'sessao aberta com o PIN antigo: 401', stale);
  ok((await caixa2.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN })).status === 401, 'PIN antigo ja nao entra');
  ok((await caixa2.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: '1357' })).status === 200, 'PIN novo entra');
  // Repor o PIN e recarregar o caixista (a password_hash rodou com o PIN novo).
  await prisma.user.update({ where: { id: ctx.cashier.id }, data: { pin_hash: await bcrypt.hash(CASHIER_PIN, 10) } });
  ctx.cashier = await prisma.user.findUnique({ where: { id: ctx.cashier.id } });
  await prisma.auditLog.deleteMany({ where: { tenant_id: ctx.tenant.id, action: 'POS_PIN_FAIL' } });

  const o2 = client();
  ok((await o2.req('POST', '/api/auth/login', { email: ctx.owner.email, password: OWNER_PW })).status === 200, 'login real do dono: 200');
  ok((await o2.req('POST', '/api/refresh')).status === 200, 'refresh antes do logout: 200');
  const out = await o2.req('POST', '/api/auth/logout');
  ok(out.status === 200 && !o2.jar.has('refreshToken') && !o2.jar.has('token'), 'logout apaga access E refresh');
  ok((await o2.req('POST', '/api/refresh')).status === 401, 'depois do logout o refresh nao devolve a sessao');
}

async function test8() {
  section(8, 'Descontos: ate X% livre, acima exige PIN do dono');
  await unlockCashier();
  // A seccao 3 deixa 5 PINs errados: o bloqueio de 15 min da loja dispara (correcto).
  // Simula a janela a passar para testar os descontos de forma independente.
  await prisma.auditLog.deleteMany({ where: { tenant_id: ctx.tenant.id, action: { in: ['CANCEL_ATTEMPT', 'DISCOUNT_PIN_FAIL'] } } });
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  const owner = ownerClient();
  const withDisc = (d, extra = {}) => saleBody({ discount_amount: d, total_amount: 10000 - d, amount_received: 10000 - d, ...extra });
  const free = await caixa.req('POST', '/api/sales', withDisc(1000));
  ok(free.status === 201, 'desconto de 10% (limite): livre', free);
  const need = await caixa.req('POST', '/api/sales', withDisc(2000));
  ok(need.status === 403 && need.data?.code === 'DISCOUNT_NEEDS_PIN', 'desconto de 20% sem PIN: recusado', need);
  const before = await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'DISCOUNT_PIN_FAIL' } });
  const wrong = await caixa.req('POST', '/api/sales', withDisc(2000, { authorization_pin: '0000' }));
  ok(wrong.status === 403 && wrong.data?.code === 'INVALID_AUTH_PIN', 'PIN errado: recusado', wrong);
  ok((await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'DISCOUNT_PIN_FAIL' } })) === before + 1, 'falha do PIN gravada (fora da transaccao)');
  const right = await caixa.req('POST', '/api/sales', withDisc(2000, { authorization_pin: PIN }));
  ok(right.status === 201, 'PIN certo: desconto autorizado (201)', right);
  ok(Boolean(await prisma.auditLog.findFirst({ where: { tenant_id: ctx.tenant.id, action: 'DISCOUNT_AUTHORIZED', entity_id: right.data?.id } })), 'autorizacao registada na auditoria');
  ok((await owner.req('PUT', '/api/settings/discount', { discount_free_pct: 25 })).status === 200, 'dono muda o limite para 25%');
  ok((await caixa.req('POST', '/api/sales', withDisc(2000))).status === 201, 'agora 20% e livre');
  await owner.req('PUT', '/api/settings/discount', { discount_free_pct: 10 });
}

async function test9() {
  section(9, 'Definicoes: custos fixos (renda) entram no lucro liquido; horario persistido; PIN exige senha');
  const owner = ownerClient();
  const rent = await owner.req('POST', '/api/settings/fixed-costs', { description: 'Renda da loja', amount: 500000, type: 'rent' });
  ok(rent.status === 201, 'renda registada (antes nao havia como)', rent);
  await owner.req('POST', '/api/settings/fixed-costs', { description: 'Luz', amount: 120000, type: 'utilities' });
  const now = new Date();
  const rep = await owner.req('GET', '/api/owner/reports/monthly?year=' + now.getFullYear() + '&month=' + (now.getMonth() + 1));
  const ded = rep.data?.deductions || {};
  ok(rep.status === 200 && ded.total_rent === 500000 && ded.total_other_fixed === 120000, 'relatorio mensal deduz renda 5000 MZN + outros 1200 MZN', ded);
  ok(rep.data?.net_profit === rep.data?.gross_profit - ded.operating_expenses, 'lucro liquido = bruto - despesas');
  ok(Array.isArray(rep.data?.revenue_history) && rep.data.revenue_history.length === 6, 'historico de 6 meses para o grafico');
  ok((await owner.req('PUT', '/api/settings/hours', { opening_time: '07:30', closing_time: '21:00' })).status === 200, 'horario gravado');
  const s = await owner.req('GET', '/api/settings');
  ok(s.data?.hours?.opening_time === '07:30' && s.data?.fixed_costs_monthly_total === 620000, 'definicoes persistidas na BD', s.data && s.data.hours);
  ok((await owner.req('PUT', '/api/settings/authorization-pin', { pin: '9999', owner_password: 'errada' })).status === 401, 'trocar o PIN com senha errada: 401');
  ok((await owner.req('PUT', '/api/settings/authorization-pin', { pin: PIN, owner_password: OWNER_PW })).status === 200, 'trocar o PIN com a senha do dono: 200');
  ok((await owner.req('POST', '/api/settings/fixed-costs', { description: 'x', amount: -5, type: 'rent' })).status === 400, 'valor negativo recusado (400)');
}

async function test10() {
  section(10, 'Caixista nao ve custos nem vendas de outros; relatorio diario completo');
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  const owner = ownerClient();
  await owner.req('POST', '/api/sales', saleBody()); // venda do dono (nao do caixista)
  const prods = await caixa.req('GET', '/api/products');
  ok(prods.status === 200 && prods.data.every((p) => p.cost_price === undefined), 'produtos para o caixista: sem cost_price');
  const sales = await caixa.req('GET', '/api/sales');
  ok(sales.status === 200 && sales.data.every((s) => s.cashier_user_id === ctx.cashier.id && s.total_cost === undefined), 'vendas: so as dele e sem custos');
  ok((await client(signAccessToken(ctx.cashier)).req('GET', '/api/dashboard/summary')).status === 403, 'dashboard financeiro: 403 para caixista');
  ok((await client(signAccessToken(ctx.cashier)).req('GET', '/api/inventory/stock')).status === 403, 'entradas de stock (custos): 403 para caixista');
  const hist = await owner.req('GET', '/api/owner/sales?page=1&page_size=5');
  ok(hist.status === 200 && hist.data.total >= 1 && hist.data.rows.length <= 5, 'dono: historico de vendas paginado', hist.data && hist.data.total);
  const day = await owner.req('GET', '/api/owner/reports/daily');
  const d = day.data || {};
  ok(day.status === 200 && d.by_payment && Array.isArray(d.top_products) && Array.isArray(d.cancellations) && Array.isArray(d.shift_closings) && 'discounts_total' in d, 'relatorio diario: pagamentos, top, descontos, cancelamentos, fechos', Object.keys(d));
  const sum = await owner.req('GET', '/api/dashboard/summary');
  const completed = await prisma.sale.aggregate({ where: { tenant_id: ctx.tenant.id, status: 'completed' }, _sum: { total_amount: true } });
  ok(sum.data.revenueToday === Number(completed._sum.total_amount || 0), 'dashboard: receita de hoje so com vendas concluidas', [sum.data.revenueToday, completed._sum.total_amount]);
}

async function test11() {
  section(11, 'Painel admin: erros nao derrubam o servidor; aprovacoes so em pendentes; modo suporte so leitura');
  const admin = adminClient();
  const ghost = await admin.req('POST', '/api/admin/requests/00000000-0000-0000-0000-000000000000/reject', { reason: 'teste' });
  ok(ghost.status === 404, 'rejeitar loja inexistente: 404 (antes derrubava o processo)', ghost);
  ok((await fetch(BASE + '/').then((r) => r.status)) === 200, 'servidor continua vivo');
  ok((await admin.req('POST', '/api/admin/requests/' + ctx.tenant.id + '/approve')).status === 409, 'aprovar loja que nao esta pendente: 409');
  await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { status: 'trial', trial_ends_at: new Date(Date.now() + 5 * 86400000) } });
  const susp = await admin.req('POST', '/api/admin/tenants/' + ctx.tenant.id + '/suspend');
  ok(susp.status === 200, 'admin suspende a loja', susp);
  ok((await ownerClient().req('GET', '/api/owner/tenant')).status === 403, 'loja suspensa: dono bloqueado logo');
  const un = await admin.req('POST', '/api/admin/tenants/' + ctx.tenant.id + '/unsuspend');
  ok(un.data?.status === 'trial', 'reactivar repoe o estado anterior (trial, nao active gratis)', un.data);
  ok((await admin.req('GET', '/api/admin/overview')).status === 200, 'metricas globais: 200');

  const sup = await admin.req('POST', '/api/admin/tenants/' + ctx.tenant.id + '/support');
  const code = (sup.data?.url || '').split('#')[1];
  ok(sup.status === 200 && Boolean(code), 'codigo de suporte emitido', sup);
  const viewer = client();
  ok((await viewer.req('POST', '/api/auth/support', { code })).status === 200, 'codigo trocado por sessao de suporte');
  ok((await client().req('POST', '/api/auth/support', { code })).status === 400, 'codigo de suporte e de uso unico');
  ok((await viewer.req('GET', '/api/owner/reports/daily')).status === 200, 'suporte pode LER relatorios');
  const w = await viewer.req('POST', '/api/owner/debts', { debtor_name: 'X Y', debtor_phone: '840000001', total_amount: 100, due_date: '2030-01-01' });
  ok(w.status === 403 && w.data?.code === 'SCOPE_RESTRICTED', 'suporte NAO pode escrever (403)', w);
  ok((await client(signAccessToken(ctx.owner)).req('GET', '/api/admin/tenants', undefined, { Origin: ADMIN_ORIGIN })).status === 403, 'dono nao entra no /api/admin');
  await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { status: 'active', trial_ends_at: null } });
}

async function test12() {
  section(12, 'Trial expirado: so leitura');
  await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { status: 'trial', trial_ends_at: new Date(Date.now() - 86400000) } });
  await sleep(STATUS_CACHE_MS + 500); // a cache do estado da loja no servidor
  const owner = ownerClient();
  ok((await owner.req('GET', '/api/owner/reports/daily')).status === 200, 'trial expirado: relatorios continuam visiveis');
  const w = await owner.req('POST', '/api/sales', saleBody());
  ok(w.status === 402 && w.data?.code === 'TRIAL_EXPIRED', 'trial expirado: nao regista vendas (402)', w);
  await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { status: 'active', trial_ends_at: null } });
}

async function test13() {
  section(13, 'RLS no Postgres: o papel da aplicacao nao ve outras lojas nem sem contexto');
  ok(prisma.rlsActive(), 'cliente da aplicacao (papel sem bypassrls) activo neste processo');
  const { PrismaClient } = require('@prisma/client');
  const app = new PrismaClient({ datasources: { db: { url: process.env.APP_DATABASE_URL } } });
  try {
    const role = await app.$queryRaw`SELECT current_user AS u, (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS b`;
    ok(role[0] && role[0].b === false, 'papel ' + (role[0] && role[0].u) + ' sem BYPASSRLS');
    ok((await app.product.count()) === 0, 'sem contexto de loja: 0 produtos visiveis (falha fechada)');
    ok((await app.user.count()) === 0, 'sem contexto de loja: 0 utilizadores visiveis');
  } finally { await app.$disconnect(); }
  const mine = await prisma.runWithTenant(ctx.tenant.id, () => prisma.product.count());
  ok(mine === 1, 'com o contexto da loja de teste: ve so o seu produto (1)', mine);
  const other = await prisma.product.findFirst({ where: { tenant_id: { not: ctx.tenant.id } }, select: { id: true, tenant_id: true } });
  if (other) {
    const leak = await prisma.runWithTenant(ctx.tenant.id, () => prisma.product.findUnique({ where: { id: other.id } }));
    ok(leak === null, 'pedir por id um produto de OUTRA loja devolve nada (mesmo sem filtro tenant_id na query)');
    const upd = await prisma.runWithTenant(ctx.tenant.id, () => prisma.product.updateMany({ where: { id: other.id }, data: { name: 'invasao' } }));
    ok(upd.count === 0, 'actualizar produto de outra loja: 0 linhas');
    let blocked = false;
    try { await prisma.runWithTenant(ctx.tenant.id, () => prisma.product.create({ data: { tenant_id: other.tenant_id, name: 'x', category: 'x' } })); } catch { blocked = true; }
    ok(blocked, 'inserir na loja errada: recusado pela politica (WITH CHECK)');
  }
  const admins = await prisma.runWithTenant(ctx.tenant.id, () => prisma.user.count({ where: { tenant_id: null } }));
  ok(admins === 0, 'contas super_admin invisiveis para a loja');
}

// ---------------------------------------------------------------------------
async function test14() {
  section(14, 'Stock por lote: FEFO, validades, perda automatica e RLS (Genesis 2.1)');
  const owner = ownerClient();
  const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const lotsOf = (pid) => prisma.stockLot.findMany({ where: { product_id: pid }, orderBy: [{ expiry_date: 'asc' }, { created_at: 'asc' }] });
  const stockOf = async (pid) => (await prisma.product.findUnique({ where: { id: pid } })).stock_qty;
  const sumLots = async (pid) => (await lotsOf(pid)).reduce((s, l) => s + l.quantity_remaining, 0);

  const created = await owner.req('POST', '/api/products', { name: 'Iogurte Teste', category: 'Frescos', sell_price: 5000, cost_price: 3000, stock_qty: 0, has_expiry: true });
  ok(created.status === 201, 'produto com validade criado', created);
  const pid = created.data.id;
  const entry = (quantity, expiry, unit_cost) => owner.req('POST', '/api/inventory/stock', { product_id: pid, quantity, unit_cost, expiry_date: expiry });
  const eA = await entry(5, day(3), 3000); const eB = await entry(6, day(20), 3200); const eC = await entry(4, null, 3100);
  ok([eA, eB, eC].every((r) => r.status === 201), 'tres compras (validade 3 d, 20 d, sem validade)', [eA.status, eB.status, eC.status]);
  ok((await entry(1, '12/10/2026', 3000)).status === 400, 'data de validade em formato errado: 400');
  ok((await lotsOf(pid)).length === 3 && (await stockOf(pid)) === 15 && (await sumLots(pid)) === 15, 'tres lotes; stock 15 = soma dos lotes');

  const term = await pairedTerminal('Balcao lotes');
  await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  const sale = await term.req('POST', '/api/sales', { items: [{ product_id: pid, quantity: 7, unit_sell_price: 5000, unit_cost_price: 0 }], total_amount: 35000, payment_method: 'cash', amount_received: 35000 });
  ok(sale.status === 201, 'venda de 7 (201)', sale);
  let lots = await lotsOf(pid);
  ok(lots.map((l) => l.quantity_remaining).join(',') === '0,4,4', 'FEFO: sai primeiro o lote de 3 dias (5) e depois o de 20 dias (2); o sem validade fica', lots.map((l) => l.quantity_remaining));
  ok((await stockOf(pid)) === 8 && (await sumLots(pid)) === 8, 'stock 8 = soma dos lotes');

  // Alertas: o lote de 20 dias so aparece se o aviso for de >= 20 dias.
  let al = await owner.req('GET', '/api/owner/alerts');
  ok(!al.data.expiringLots.some((l) => l.product_id === pid), 'aviso de 7 dias: lote de 20 dias ainda nao aparece');
  ok((await owner.req('PUT', '/api/settings/expiry-alert', { expiry_alert_days: 30 })).status === 200, 'dono muda o aviso para 30 dias');
  ok((await owner.req('PUT', '/api/settings/expiry-alert', { expiry_alert_days: 0 })).status === 400, 'aviso de 0 dias recusado (400)');
  al = await owner.req('GET', '/api/owner/alerts');
  const alerted = al.data.expiringLots.find((l) => l.product_id === pid);
  ok(alerted && alerted.quantity === 4 && alerted.days_left === require('../src/utils/fefo').daysUntilExpiry(day(20) + 'T00:00:00.000Z') && alerted.product_stock === 8 && alerted.value === 4 * 3200, 'alerta diz: 4 de 8 un. expiram em 20 dias, valor ao custo', alerted);
  await owner.req('PUT', '/api/settings/expiry-alert', { expiry_alert_days: 7 });

  // Quebra no balcao: tambem por FEFO, com lote e custo gravados.
  const sh = await term.req('POST', '/api/shrinkage_records', { id: crypto.randomUUID(), product_id: pid, quantity: 2, reason: 'broken' });
  ok(sh.status === 201 || sh.status === 200, 'quebra de 2 registada', sh);
  const rec = await prisma.shrinkageRecord.findFirst({ where: { product_id: pid, reason: 'broken' } });
  const lotB = (await lotsOf(pid)).find((l) => l.unit_cost === 3200);
  ok(rec && rec.lot_id === lotB.id && rec.unit_cost === 3200 && lotB.quantity_remaining === 2, 'quebra saiu do lote de 20 dias, com o custo desse lote', rec);

  // Perda automatica: compra com validade ja passada.
  const eD = await entry(3, day(-2), 2900);
  ok(eD.status === 201, 'compra com validade de ha 2 dias (lote ja vencido)');
  const { runExpiryJob } = require('../src/services/expiryJob');
  const n1 = await runExpiryJob({ tenantId: ctx.tenant.id });
  const exp = await prisma.shrinkageRecord.findMany({ where: { product_id: pid, reason: 'expired' } });
  ok(n1 === 1 && exp.length === 1 && exp[0].quantity === 3 && exp[0].unit_cost === 2900 && exp[0].recorded_by === ctx.owner.id, 'job: 1 lote vencido virou quebra "expired" (3 un. a 29 MT, em nome do dono)', { n1, exp });
  const audit = await prisma.auditLog.findFirst({ where: { tenant_id: ctx.tenant.id, action: 'AUTO_EXPIRY_LOSS' } });
  ok(Boolean(audit), 'auditoria AUTO_EXPIRY_LOSS gravada');
  ok((await stockOf(pid)) === 6 && (await sumLots(pid)) === 6, 'stock 6 = soma dos lotes (o vencido saiu)');
  const n2 = await runExpiryJob({ tenantId: ctx.tenant.id });
  ok(n2 === 0 && (await prisma.shrinkageRecord.count({ where: { product_id: pid, reason: 'expired' } })) === 1, 'job outra vez: nenhuma perda duplicada (idempotente)');
  al = await owner.req('GET', '/api/owner/alerts');
  ok(!al.data.expiringLots.some((l) => l.product_id === pid && l.days_left < 0), 'depois do job o lote vencido sai dos alertas');

  // Cancelamento: a mercadoria volta como lote.
  const cancel = await owner.req('POST', '/api/sales/' + sale.data.id + '/cancel', { pin: PIN, reason: 'teste lotes' });
  ok(cancel.status === 200, 'venda cancelada com o PIN', cancel);
  ok((await stockOf(pid)) === 13 && (await sumLots(pid)) === 13, 'cancelamento repoe 7: stock 13 = soma dos lotes');

  // Ajustes do dono passam pelos lotes; PATCH directo do stock deixou de existir.
  ok((await owner.req('PATCH', '/api/products/' + pid + '/stock', { delta: -5, reason: 'contagem fisica' })).status === 200, 'ajuste -5');
  ok((await owner.req('PATCH', '/api/products/' + pid + '/stock', { delta: 2, reason: 'achado no armazem', expiry_date: day(10) })).status === 200, 'ajuste +2 com validade');
  ok((await stockOf(pid)) === 10 && (await sumLots(pid)) === 10, 'stock 10 = soma dos lotes depois dos ajustes');
  await owner.req('PATCH', '/api/products/' + pid, { stock_qty: 999, name: 'Iogurte Teste' });
  ok((await stockOf(pid)) === 10, 'PATCH com stock_qty ignorado (so ajuste auditado mexe no stock)');

  // RLS: outra loja nao ve os lotes desta.
  const foreign = await prisma.runWithTenant(crypto.randomUUID(), () => prisma.stockLot.count({ where: { tenant_id: ctx.tenant.id } }));
  ok(foreign === 0, 'lotes invisiveis no contexto de outra loja (RLS)');
  const own = await prisma.runWithTenant(ctx.tenant.id, () => prisma.stockLot.count({ where: { product_id: pid } }));
  ok(own >= 4, 'com o contexto da propria loja ve os seus lotes', own);
}

const TESTS = { 2: test2, 3: test3, 4: test4, 5: test5, 6: test6, 7: test7, 8: test8, 9: test9, 10: test10, 11: test11, 12: test12, 13: test13, 14: test14 };

(async () => {
  await prisma.ready();
  const health = await fetch(BASE + '/').then((r) => r.status).catch(() => 0);
  if (health !== 200) { console.log('Backend nao responde em ' + BASE + ' — arranca-o primeiro.'); process.exit(1); }
  try {
    await setup();
    for (const [n, fn] of Object.entries(TESTS)) if (wants(n)) await fn();
  } catch (e) {
    failures++;
    console.log('ERRO inesperado: ' + (e.stack || e.message));
  } finally {
    await cleanup().catch((e) => { failures++; console.log('ERRO na limpeza: ' + e.message); });
  }
  console.log('\n' + (failures === 0 ? 'RESULTADO: todas as verificacoes passaram' : 'RESULTADO: ' + failures + ' verificacao(oes) falharam'));
  process.exit(failures === 0 ? 0 : 1);
})();
