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
  for (const model of ['stockLot', 'stockEntry', 'shrinkageRecord', 'demandCapture', 'shiftClosing', 'productPriceHistory', 'fixedCost', 'employee', 'saleGoal', 'posTerminal', 'supplier', 'expense', 'shoppingListItem', 'shoppingList']) {
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
  // Perto da BD a seccao seguinte comecava antes de a cache expirar e ainda via o trial expirado.
  await sleep(STATUS_CACHE_MS + 500);
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

// ---------------------------------------------------------------------------
async function test15() {
  section(15, 'Relatorios com rastreio, perdas, metas e chenecas (Genesis 2.1)');
  const owner = ownerClient();
  const today = new Date(); const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const day = iso(today);
  const ym = `year=${today.getFullYear()}&month=${today.getMonth() + 1}`;
  const get = async (p) => { const r = await owner.req('GET', p); if (r.status !== 200) throw new Error(p + ' -> ' + r.status + ' ' + JSON.stringify(r.data)); return r.data; };

  ok((await owner.req('POST', '/api/owner/goals', { target_amount: 1000000 })).status < 300, 'meta do mes: 10 000 MT');
  const d0 = await get('/api/owner/reports/daily?date=' + day);
  const m0 = await get('/api/owner/reports/monthly?' + ym);

  const term = await pairedTerminal('Balcao relatorios');
  await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  const sale = await term.req('POST', '/api/sales', saleBody({ items: [{ product_id: ctx.product.id, quantity: 2, unit_sell_price: 10000, unit_cost_price: 0 }], total_amount: 20000, amount_received: 20000 }));
  ok(sale.status === 201, 'venda de 2 x 100 MT', sale);
  const sh = await term.req('POST', '/api/shrinkage_records', { id: crypto.randomUUID(), product_id: ctx.product.id, quantity: 1, reason: 'broken' });
  ok(sh.status < 300, 'quebra de 1 (custo 60 MT)', sh);
  const debt = await owner.req('POST', '/api/owner/debts', { debtor_name: 'Cliente Relatorio', debtor_phone: '841234000', total_amount: 50000, due_date: iso(new Date(Date.now() + 10 * 86400000)) });
  ok(debt.status === 201, 'cheneca de 500 MT', debt);
  ok((await owner.req('POST', '/api/owner/debts/' + debt.data.id + '/payment', { amount: 20000 })).status < 300, 'pagamento de 200 MT');

  const d1 = await get('/api/owner/reports/daily?date=' + day);
  ok(d1.gross_revenue - d0.gross_revenue === 20000 && d1.gross_profit - d0.gross_profit === 8000, 'diario: +200 MT de receita e +80 MT de lucro bruto', [d1.gross_revenue - d0.gross_revenue, d1.gross_profit - d0.gross_profit]);
  ok(d1.losses_total - d0.losses_total === 6000 && d1.losses.some((l) => l.reason === 'broken' && l.reason_label === 'Partido'), 'diario: perda de 60 MT com motivo "Partido"', d1.losses_total - d0.losses_total);
  ok(d1.result_after_losses === d1.gross_profit - d1.losses_total, 'diario: resultado = lucro bruto - perdas');
  ok(d1.goal_progress && Math.abs((d1.goal_progress.today_pct - d0.goal_progress.today_pct) - 2) < 0.05, 'diario: a venda vale +2% da meta do mes', d1.goal_progress);
  ok(d1.goal_progress.accumulated_pct >= d1.goal_progress.today_pct, 'diario: % acumulado do mes >= % do dia');
  ok(d1.compare && 'previous_revenue' in d1.compare, 'diario: comparacao com o dia anterior');
  ok(d1.most_sold && d1.most_profitable && Array.isArray(d1.top_profitable), 'diario: mais vendido e mais rentavel separados');

  const tl = await get(`/api/owner/reports/timeline?from=${day}&to=${day}&page_size=200`);
  const saleEv = tl.rows.find((e) => e.type === 'sale' && e.sale?.id === sale.data.id);
  ok(saleEv && saleEv.amount === 20000 && saleEv.profit === 8000 && saleEv.effect === 'gain' && saleEv.who === ctx.cashier.name && saleEv.sale.items.length === 1, 'rastreio: a venda com valor, lucro, caixista e itens (para o recibo)', saleEv);
  ok(/2 × Cerveja Teste/.test(saleEv?.detail || ''), 'rastreio: produto e quantidade descritos');
  const lossEv = tl.rows.find((e) => e.type === 'loss' && e.reason === 'broken');
  ok(lossEv && lossEv.amount === -6000 && lossEv.effect === 'loss' && lossEv.unit_cost === 6000, 'rastreio: a perda com -60 MT e o custo unitario', lossEv);
  ok(tl.rows.some((e) => e.type === 'debt' && e.amount === 50000) && tl.rows.some((e) => e.type === 'debt_payment' && e.amount === 20000), 'rastreio: cheneca nova e pagamento');
  ok(!tl.rows.some((e) => /\d{3,} por unidade|desconto \d/.test(e.detail || '')), 'rastreio: nenhum valor em centavos no texto');
  ok(tl.rows.every((e, i, a) => i === 0 || new Date(a[i - 1].at) >= new Date(e.at)), 'rastreio: por ordem (mais recente primeiro)');
  const onlyLoss = await get(`/api/owner/reports/timeline?from=${day}&to=${day}&types=loss`);
  ok(onlyLoss.rows.length > 0 && onlyLoss.rows.every((e) => e.type === 'loss'), 'rastreio: filtro por tipo (so perdas)');
  const pageOne = await get(`/api/owner/reports/timeline?from=${day}&to=${day}&page_size=1`);
  ok(pageOne.rows.length === 1 && pageOne.total === tl.total, 'rastreio: paginado', [pageOne.rows.length, pageOne.total, tl.total]);
  ok((await owner.req('GET', `/api/owner/reports/timeline?from=${day}&to=2020-01-01`)).status === 400, 'rastreio: intervalo invertido = 400');
  ok((await owner.req('GET', '/api/owner/reports/timeline?from=2025-01-01&to=2026-01-01')).status === 400, 'rastreio: mais de 3 meses = 400');
  ok(tl.rows.filter((e) => e.sale).every((e) => e.sale.tenant_id === ctx.tenant.id), 'rastreio: so vendas desta loja');
  ok((await term.req('GET', `/api/owner/reports/timeline?from=${day}&to=${day}`)).status === 403, 'caixista nao chega ao rastreio (403)');

  const w = await get(`/api/owner/reports/weekly?end=${day}`);
  const wToday = w.by_day.find((x) => x.date === day);
  ok(w.by_day.length === 7 && wToday && wToday.losses >= 6000, 'semanal: 7 dias, com perdas por dia', wToday);
  ok(w.best_day && w.worst_day !== undefined && w.compare && w.restock && Array.isArray(w.restock.items), 'semanal: melhor/pior dia, comparacao e recomendacao de restock');

  const m1 = await get('/api/owner/reports/monthly?' + ym);
  ok(m1.debts.new_total - m0.debts.new_total === 50000 && m1.debts.received_total - m0.debts.received_total === 20000, 'mensal: chenecas novas +500 MT e recebidas +200 MT');
  ok(m1.debts.outstanding.some((x) => x.debtor === 'Cliente Relatorio' && x.remaining === 30000), 'mensal: em aberto 300 MT do cliente');
  ok(m1.losses_total - m0.losses_total === 6000, 'mensal: perdas +60 MT');
  ok(m1.goal && m1.goal.target === 1000000 && Array.isArray(m1.weeks) && m1.weeks.length >= 4, 'mensal: meta e semanas do mes');
  ok(m1.trends && m1.trends.growing.some((t) => t.product_id === ctx.product.id), 'mensal: produto em crescimento vs mes anterior');
  ok(m1.compare && 'previous_revenue' in m1.compare && m1.restock && m1.restock.cover_days === 30, 'mensal: comparacao com o mes anterior e restock para 30 dias');
  ok(m1.net_profit === m1.gross_profit - m1.deductions.total_salaries - m1.deductions.total_rent - m1.deductions.total_other_fixed - m1.deductions.total_supplier_delivery - m1.deductions.total_expenses, 'mensal: formula do lucro liquido (especificacao 6.3 + despesas avulsas)');

  const gh = await get('/api/owner/goals/history');
  const cur = gh[gh.length - 1];
  ok(gh.length === 12 && cur.current && cur.target === 1000000 && cur.achieved >= 20000, 'metas: 12 meses, o actual com meta e atingido', cur);
}

// ---------------------------------------------------------------------------
async function test16() {
  section(16, 'Despesas avulsas no lucro liquido (Genesis 2.1, Fase 5)');
  const owner = ownerClient();
  const now = new Date(); const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const day = iso(now);
  const ym = `year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
  const get = async (p) => { const r = await owner.req('GET', p); if (r.status !== 200) throw new Error(p + ' -> ' + r.status + ' ' + JSON.stringify(r.data)); return r.data; };

  const m0 = await get('/api/owner/reports/monthly?' + ym);
  const a = await owner.req('POST', '/api/settings/expenses', { date: day, category: 'Limpeza', description: 'Detergente', amount: 35050 });
  ok(a.status === 201 && a.data.amount === 35050 && a.data.tenant_id === ctx.tenant.id, 'despesa de 350,50 MT gravada em centavos', a);
  const b = await owner.req('POST', '/api/settings/expenses', { date: day, category: 'Gerador', amount: 100000 });
  ok(b.status === 201 && b.data.category === 'Gerador', 'categoria escrita pelo dono (fora da lista) aceite', b);
  ok((await owner.req('POST', '/api/settings/expenses', { date: day, category: 'Luz', amount: 0 })).status === 400, 'valor 0 = 400');
  ok((await owner.req('POST', '/api/settings/expenses', { date: day, category: 'Luz', amount: 10.5 })).status === 400, 'valor nao inteiro (nao centavos) = 400');
  const fut = await owner.req('POST', '/api/settings/expenses', { date: iso(new Date(Date.now() + 3 * 86400000)), category: 'Luz', amount: 1000 });
  ok(fut.status === 400 && fut.data.code === 'FUTURE_DATE', 'data no futuro = 400 FUTURE_DATE', fut);
  ok((await owner.req('POST', '/api/settings/expenses', { date: '2026-02-31', category: 'Luz', amount: 1000 })).status === 400, 'data inexistente (31/02) = 400');

  const list = await get('/api/settings/expenses?' + ym);
  ok(list.total === 135050 && list.rows.length === 2 && list.by_category[0].category === 'Gerador', 'lista do mes: total 1 350,50 MT, por categoria', list.total);
  ok(list.categories.includes('Transporte do stock'), 'categorias sugeridas devolvidas');

  const upd = await owner.req('PUT', '/api/settings/expenses/' + b.data.id, { date: day, category: 'Gerador', description: 'Gasoleo', amount: 80000 });
  ok(upd.status === 200 && upd.data.amount === 80000, 'editar despesa', upd);

  const m1 = await get('/api/owner/reports/monthly?' + ym);
  ok(m1.deductions.total_expenses - m0.deductions.total_expenses === 115050, 'mensal: total_expenses +1 150,50 MT', m1.deductions.total_expenses);
  ok(m0.net_profit - m1.net_profit === 115050, 'mensal: lucro liquido desce exactamente 1 150,50 MT', [m0.net_profit, m1.net_profit]);
  ok(m1.deductions.operating_expenses === m1.deductions.total_salaries + m1.deductions.total_fixed + m1.deductions.total_supplier_delivery + m1.deductions.total_expenses, 'mensal: despesas operacionais incluem as avulsas');
  ok(m1.expenses.by_category.some((c) => c.category === 'Limpeza' && c.amount === 35050), 'mensal: despesas linha a linha por categoria');

  const tl = await get(`/api/owner/reports/timeline?from=${day}&to=${day}&types=expense`);
  ok(tl.rows.length === 2 && tl.rows.every((e) => e.type === 'expense' && e.effect === 'expense' && e.amount < 0 && e.profit === 0), 'rastreio: 2 despesas, negativas, sem mexer no lucro bruto do dia', tl.rows);
  ok(tl.rows.some((e) => e.who === ctx.owner.name), 'rastreio: quem registou a despesa');

  // Isolamento: caixista nao chega; outra loja nao ve nem apaga.
  const term = await pairedTerminal('Balcao despesas');
  await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok((await term.req('GET', '/api/settings/expenses')).status === 403, 'caixista nao ve despesas (403)');
  ok((await term.req('POST', '/api/settings/expenses', { date: day, category: 'Luz', amount: 1000 })).status === 403, 'caixista nao cria despesas (403)');
  const foreign = await prisma.runWithTenant(crypto.randomUUID(), () => prisma.expense.count({ where: { tenant_id: ctx.tenant.id } }));
  ok(foreign === 0, 'despesas invisiveis no contexto de outra loja (RLS)');
  const foreignDel = await prisma.runWithTenant(crypto.randomUUID(), () => prisma.expense.deleteMany({ where: { id: a.data.id } }));
  ok(foreignDel.count === 0, 'outra loja nao consegue apagar a despesa (RLS)');
  const auditN = await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: { in: ['CREATE_EXPENSE', 'UPDATE_EXPENSE'] } } });
  ok(auditN === 3, 'auditoria: 2 criadas + 1 editada', auditN);

  ok((await owner.req('DELETE', '/api/settings/expenses/' + a.data.id)).status === 200, 'apagar despesa');
  ok((await owner.req('DELETE', '/api/settings/expenses/' + a.data.id)).status === 404, 'apagar outra vez = 404');
  const m2 = await get('/api/owner/reports/monthly?' + ym);
  ok(m2.deductions.total_expenses - m0.deductions.total_expenses === 80000, 'mensal: depois de apagar, so fica a de 800 MT');
}

// ---------------------------------------------------------------------------
async function test17() {
  section(17, 'Lista de compras e WhatsApp ao fornecedor (Genesis 2.1, Fase 5)');
  const owner = ownerClient();
  const supplier = await prisma.supplier.create({ data: { tenant_id: ctx.tenant.id, name: 'CDM Teste', phone: '84 123 4567', delivery_cost_per_visit: 50000 } });
  const p2 = await prisma.product.create({ data: { tenant_id: ctx.tenant.id, name: 'Agua Teste 1,5L', category: 'Bebidas', sell_price: 5000, cost_price: 3050, stock_qty: 0, is_active: true } });
  await prisma.demandCapture.create({ data: { id: crypto.randomUUID(), tenant_id: ctx.tenant.id, product_id: p2.id, recorded_by: ctx.owner.id } }).catch(() => null);

  const sug = await owner.req('GET', '/api/shopping-lists/suggestion?days=30');
  ok(sug.status === 200 && sug.data.cover_days === 30 && Array.isArray(sug.data.items), 'sugestao para 30 dias (recomendacao de restock)', sug.status);
  ok((await owner.req('GET', '/api/shopping-lists/suggestion?days=5')).status === 400, 'dias fora de 7/14/30 = 400');

  const body = { name: 'Compra semanal', supplier_id: supplier.id, items: [{ product_id: ctx.product.id, quantity: 24 }, { product_id: p2.id, quantity: 12, unit_cost: 2900 }] };
  const c = await owner.req('POST', '/api/shopping-lists', body);
  ok(c.status === 201 && c.data.items.length === 2 && c.data.status === 'draft', 'lista criada em rascunho com 2 produtos', c);
  const cerveja = c.data.items.find((i) => i.product_id === ctx.product.id);
  ok(cerveja && cerveja.unit_cost === 6000 && cerveja.product_name === 'Cerveja Teste', 'sem custo indicado usa o custo actual do produto (60 MT)', cerveja);
  ok(c.data.totals.investment === 24 * 6000 + 12 * 2900 && c.data.totals.delivery === 50000 && c.data.totals.total === 24 * 6000 + 12 * 2900 + 50000, 'total = investimento 1 788 MT + entrega 500 MT', c.data.totals);

  ok((await owner.req('POST', '/api/shopping-lists', { ...body, items: [{ product_id: ctx.product.id, quantity: 1 }, { product_id: ctx.product.id, quantity: 2 }] })).status === 400, 'produto repetido = 400');
  ok((await owner.req('POST', '/api/shopping-lists', { ...body, items: [] })).status === 400, 'lista vazia = 400');
  ok((await owner.req('POST', '/api/shopping-lists', { ...body, items: [{ product_id: ctx.product.id, quantity: 0 }] })).status === 400, 'quantidade 0 = 400');
  const foreignProduct = await prisma.product.findFirst({ where: { tenant_id: { not: ctx.tenant.id } }, select: { id: true } });
  if (foreignProduct) ok((await owner.req('POST', '/api/shopping-lists', { ...body, items: [{ product_id: foreignProduct.id, quantity: 1 }] })).status === 400, 'produto de outra loja = 400 (nao entra na lista)');
  ok((await owner.req('POST', '/api/shopping-lists', { ...body, supplier_id: crypto.randomUUID() })).status === 400, 'fornecedor inexistente = 400');

  const wa = await owner.req('GET', '/api/shopping-lists/' + c.data.id + '/whatsapp');
  ok(wa.status === 200 && wa.data.url.startsWith('https://wa.me/258841234567?text=') && wa.data.has_phone, 'link wa.me com o numero do fornecedor em formato internacional', wa.data?.url);
  ok(/- 24 × Cerveja Teste/.test(wa.data.text) && /- 12 × Agua Teste/.test(wa.data.text) && !/MT|6000|60,00/.test(wa.data.text), 'mensagem com produtos e quantidades, sem custos', wa.data.text);

  const upd = await owner.req('PUT', '/api/shopping-lists/' + c.data.id, { name: 'Compra semanal (rev)', supplier_id: null, items: [{ product_id: ctx.product.id, quantity: 10 }] });
  ok(upd.status === 200 && upd.data.items.length === 1 && upd.data.totals.total === 60000 && upd.data.totals.delivery === 0, 'editar: 1 produto, sem fornecedor = sem entrega', upd.data?.totals);
  const list = await owner.req('GET', '/api/shopping-lists');
  ok(list.status === 200 && list.data.some((l) => l.id === c.data.id && l.item_count === 1 && l.totals.total === 60000), 'listas guardadas com totais');

  ok((await owner.req('PUT', '/api/shopping-lists/' + c.data.id + '/status', { status: 'sent' })).status === 200, 'marcar como enviada');
  ok((await owner.req('PUT', '/api/shopping-lists/' + c.data.id + '/status', { status: 'paga' })).status === 400, 'estado invalido = 400');
  const stockBefore = (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
  ok((await owner.req('PUT', '/api/shopping-lists/' + c.data.id + '/status', { status: 'received' })).status === 200, 'marcar como recebida');
  ok((await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty === stockBefore, 'recebida NAO mexe no stock (entrada continua em Produtos -> Stock)');
  const locked = await owner.req('PUT', '/api/shopping-lists/' + c.data.id, body);
  ok(locked.status === 409 && locked.data.code === 'LIST_RECEIVED', 'lista recebida nao se edita (409)', locked);

  // Isolamento.
  const term = await pairedTerminal('Balcao compras');
  await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok((await term.req('GET', '/api/shopping-lists')).status === 403, 'caixista nao ve listas de compras (403)');
  const other = crypto.randomUUID();
  ok((await prisma.runWithTenant(other, () => prisma.shoppingList.count({ where: { tenant_id: ctx.tenant.id } }))) === 0, 'listas invisiveis noutra loja (RLS)');
  ok((await prisma.runWithTenant(other, () => prisma.shoppingListItem.count({ where: { tenant_id: ctx.tenant.id } }))) === 0, 'itens invisiveis noutra loja (RLS)');
  const audits = await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: { in: ['CREATE_SHOPPING_LIST', 'UPDATE_SHOPPING_LIST', 'SHOPPING_LIST_STATUS'] } } });
  ok(audits === 4, 'auditoria: criada, editada, 2 mudancas de estado', audits);

  ok((await owner.req('DELETE', '/api/shopping-lists/' + c.data.id)).status === 200, 'apagar lista');
  ok((await owner.req('GET', '/api/shopping-lists/' + c.data.id)).status === 404 && (await prisma.shoppingListItem.count({ where: { list_id: c.data.id } })) === 0, 'apagada com os itens (404)');
}

// ---------------------------------------------------------------------------
async function test18() {
  section(18, 'Fecho do mes (Genesis 2.1, Fase 5)');
  const owner = ownerClient();
  const get = async (p) => { const r = await owner.req('GET', p); if (r.status !== 200) throw new Error(p + ' -> ' + r.status + ' ' + JSON.stringify(r.data)); return r.data; };
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let st = await get('/api/owner/month-close');
  ok(st.due === false && st.year === prev.getFullYear() && st.month === prev.getMonth() + 1, 'loja criada este mes: sem fecho do mes anterior', st);

  // A loja passa a existir desde ha 2 meses.
  await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { created_at: new Date(now.getFullYear(), now.getMonth() - 2, 10) } });
  ok((await owner.req('PUT', '/api/settings/month-close', { month_close_day: 29 })).status === 400, 'dia 29 = 400 (so 1 a 28)');
  ok((await owner.req('PUT', '/api/settings/month-close', { month_close_day: 0 })).status === 400, 'dia 0 = 400');
  if (now.getDate() < 28) {
    ok((await owner.req('PUT', '/api/settings/month-close', { month_close_day: 28 })).status === 200, 'dia do fecho = 28');
    st = await get('/api/owner/month-close');
    ok(st.due === false && st.close_day === 28, 'antes do dia do fecho: nada a mostrar', st);
  }
  ok((await owner.req('PUT', '/api/settings/month-close', { month_close_day: 1 })).status === 200, 'dia do fecho = 1');
  ok((await get('/api/settings')).month_close_day === 1, 'definicoes devolvem o dia do fecho');
  st = await get('/api/owner/month-close');
  ok(st.due === true, 'a partir do dia do fecho: fecho do mes anterior por ver', st);

  const term = await pairedTerminal('Balcao fecho');
  await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok((await term.req('GET', '/api/owner/month-close')).status === 403, 'caixista nao ve o fecho do mes (403)');
  ok((await term.req('PUT', '/api/settings/month-close', { month_close_day: 5 })).status === 403, 'caixista nao muda o dia do fecho (403)');

  const body = { year: st.year, month: st.month, choice: 'later' };
  ok((await owner.req('POST', '/api/owner/month-close/seen', { ...body, choice: 'talvez' })).status === 400, 'escolha invalida = 400');
  ok((await owner.req('POST', '/api/owner/month-close/seen', body)).status === 200, 'marcar como visto ("agora nao")');
  ok((await owner.req('POST', '/api/owner/month-close/seen', body)).status === 200, 'marcar outra vez nao da erro');
  const seenN = await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'MONTH_CLOSE_SEEN', entity_id: st.key } });
  ok(seenN === 1, 'auditoria: um unico MONTH_CLOSE_SEEN por mes', seenN);
  st = await get('/api/owner/month-close');
  ok(st.due === false && st.seen === true, 'depois de visto nao volta a aparecer', st);
}

const TESTS = { 2: test2, 3: test3, 4: test4, 5: test5, 6: test6, 7: test7, 8: test8, 9: test9, 10: test10, 11: test11, 12: test12, 13: test13, 14: test14, 15: test15, 16: test16, 17: test17, 18: test18 };

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
