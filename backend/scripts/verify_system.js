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
  await prisma.salePayment.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.saleItem.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.sale.deleteMany({ where: { tenant_id: t } });
  await prisma.debtPayment.deleteMany({ where: { debt_id: { in: debtIds } } });
  await prisma.debt.deleteMany({ where: { tenant_id: t } });
  for (const model of ['stockLot', 'stockEntry', 'shrinkageRecord', 'demandCapture', 'shiftClosing', 'productPriceHistory', 'fixedCost', 'employee', 'saleGoal', 'posTerminalMember', 'posTerminal', 'supplier', 'expense', 'shoppingListItem', 'shoppingList', 'catalogSuggestion', 'webAuthnCredential']) {
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

// Terminal com o caixista com sessao, partilhado pelas seccoes 15-18: o
// emparelhamento tem limite de 10 por IP em 15 min (pos.js) e, perto da BD, a
// bateria inteira corre em segundos.
async function cashierTerminal() {
  if (!ctx.cashierTerm) {
    const term = await pairedTerminal('Balcao partilhado');
    await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
    ctx.cashierTerm = term;
  }
  return ctx.cashierTerm;
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

  // Turno fechado (06/10/2026): nao vende ate o dono abrir outro com o PIN.
  const closedSale = await term.req('POST', '/api/sales', saleBody());
  ok(closedSale.status === 409 && closedSale.data?.code === 'SHIFT_CLOSED', 'turno fechado: o caixista NAO vende (409 SHIFT_CLOSED)', closedSale);
  ok((await term.req('GET', '/api/pos/shift')).data?.open === false, 'estado do turno: fechado');
  ok((await term.req('POST', '/api/pos/shift/close', { declared_amount: 0 })).data?.code === 'NO_OPEN_SHIFT', 'fechar outra vez: 409 NO_OPEN_SHIFT');
  const profs = await term.req('GET', '/api/pos/terminal');
  ok(profs.data?.cashiers.find((c) => c.id === ctx.cashier.id)?.shift_open === false, 'ecra de perfis mostra o turno fechado', profs.data?.cashiers);
  const before = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID(), created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() }));
  ok(before.status === 201, 'venda offline feita ANTES do fecho ainda sincroniza (201)', before);
  const wrongOpen = await term.req('POST', '/api/pos/shift/open', { pin: '0000' });
  ok(wrongOpen.status === 403 && wrongOpen.data?.code === 'INVALID_AUTH_PIN', 'abrir turno com PIN errado: 403', wrongOpen);
  ok((await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'SHIFT_OPEN_PIN_FAIL' } })) === 1, '... e a falha fica gravada');
  const reopen = await term.req('POST', '/api/pos/shift/open', { pin: PIN });
  ok(reopen.status === 201 && reopen.data?.open === true && reopen.data?.expected === undefined, 'PIN do dono certo: turno novo aberto (sem revelar o esperado)', reopen);
  ok((await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'SHIFT_OPENED', entity_id: ctx.cashier.id } })) === 1, 'auditoria: SHIFT_OPENED');
  ok((await term.req('POST', '/api/pos/shift/open', { pin: PIN })).data?.code === 'SHIFT_ALREADY_OPEN', 'abrir um turno ja aberto: 409');
  ok((await term.req('POST', '/api/sales', saleBody())).status === 201, 'turno novo: volta a vender (201)');
  await prisma.auditLog.deleteMany({ where: { tenant_id: ctx.tenant.id, action: 'SHIFT_OPEN_PIN_FAIL' } });

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
  ok(cheap.data?.params?.name === ctx.product.name, '9.5: o 409 traz o nome do produto em params (o terminal monta a frase na lingua do caixista)', cheap.data);
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
  ok(lockedSale.data?.code === 'SELLER_LOCKED' && lockedSale.data?.params?.name === ctx.cashier.name, '9.5: recusa com code SELLER_LOCKED e o nome em params', lockedSale.data);
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
  ok(need.data?.params?.pct === 10, '9.5: o 403 traz o limite em params (pct: 10)', need.data);
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
  const plain = await caixa.req('GET', '/api/sales');
  ok(plain.status === 403, 'GET /api/sales: 403 para caixista (a lista exige o PIN do dono)', plain);
  const noPin = await caixa.req('POST', '/api/pos/sales', { pin: '0000' });
  ok(noPin.status === 403 && noPin.data?.code === 'INVALID_AUTH_PIN', 'lista de vendas com PIN errado: 403', noPin);
  const sales = await caixa.req('POST', '/api/pos/sales', { pin: PIN });
  ok(sales.status === 200 && sales.data.length > 0 && sales.data.every((s) => s.cashier_user_id === ctx.cashier.id && s.total_cost === undefined && s.items.every((i) => i.unit_cost_price === undefined)), 'lista com o PIN do dono: so as dele e sem custos', sales.status);
  ok((await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'SALES_VIEWED' } })) >= 1, 'auditoria: SALES_VIEWED');
  await prisma.auditLog.deleteMany({ where: { tenant_id: ctx.tenant.id, action: 'SALES_VIEW_PIN_FAIL' } });
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
  // Fase 7.3: pedido com um email que ja tem conta -> 409, sem inventar email.
  const dup = await prisma.tenant.create({ data: { name: ctx.tenant.name + '-DUP', owner_name: 'Dup', business_type: 'bottle_store', location: 'Teste', phone: '840000002', email: ctx.owner.email, status: 'pending' } });
  try {
    const r = await admin.req('POST', '/api/admin/requests/' + dup.id + '/approve');
    ok(r.status === 409 && r.data?.code === 'EMAIL_IS_OWNER', 'aprovar pedido com o email de um dono: 409 EMAIL_IS_OWNER (o admin pode juntar a conta dele)', r);
    const after = await prisma.tenant.findUnique({ where: { id: dup.id }, select: { status: true } });
    const owners = await prisma.user.count({ where: { tenant_id: dup.id } });
    ok(after.status === 'pending' && owners === 0, 'o pedido continua pendente e nenhuma conta foi criada', { after, owners });
  } finally {
    await prisma.auditLog.deleteMany({ where: { entity_id: dup.id } });
    await prisma.user.deleteMany({ where: { tenant_id: dup.id } });
    await prisma.tenant.delete({ where: { id: dup.id } });
  }
  // Fase 9.1: email obrigatorio no pedido de conta; pedido antigo sem email nao
  // e aprovado com um email inventado.
  const reqBody = { businessName: ctx.tenant.name + '-PEDIDO', ownerName: 'Dono Pedido', businessType: 'bottle_store', location: 'Teste', phone: '840000004', acceptTerms: true };
  const noEmail = await client().req('POST', '/api/auth/request-account', reqBody);
  ok(noEmail.status === 400, 'pedido de conta sem email: 400', noEmail);
  ok((await prisma.tenant.count({ where: { name: reqBody.businessName } })) === 0, 'pedido sem email nao foi gravado');
  const mixed = ' Pedido.' + ctx.tenant.id.slice(0, 8) + '@Teste.Local ';
  // 30/10/2026: sem a confirmacao de 18+ e dos Termos, nada e gravado.
  const { acceptTerms: _a, ...noTerms } = reqBody;
  const minor = await client().req('POST', '/api/auth/request-account', { ...noTerms, email: mixed });
  ok(minor.status === 400 && minor.data?.code === 'TERMS_REQUIRED', 'pedido sem confirmar 18+ e Termos: 400 TERMS_REQUIRED', minor);
  ok((await prisma.tenant.count({ where: { name: reqBody.businessName } })) === 0, 'pedido sem confirmar 18+ nao foi gravado');
  const withEmail = await client().req('POST', '/api/auth/request-account', { ...reqBody, email: mixed });
  const saved = await prisma.tenant.findFirst({ where: { name: reqBody.businessName }, select: { id: true, email: true, status: true, terms_accepted_at: true, terms_version: true, subscription_price: true } });
  try {
    ok(withEmail.status === 201 && saved?.status === 'pending' && saved?.email === mixed.trim().toLowerCase(), 'pedido com email: 201, gravado sem espacos e em minusculas', { withEmail, saved });
    ok(Boolean(saved?.terms_accepted_at) && saved?.terms_version === '2026-10-30', 'aceitacao dos Termos (18+) guardada com a data e a versao', saved);
    ok(saved?.subscription_price === 800000, 'conta nova: preco por omissao 8 000 MT', saved);
  } finally {
    if (saved) await prisma.tenant.delete({ where: { id: saved.id } });
  }
  const legacy = await prisma.tenant.create({ data: { name: ctx.tenant.name + '-SEMEMAIL', owner_name: 'Antigo', business_type: 'bottle_store', location: 'Teste', phone: '840000005', status: 'pending' } });
  try {
    const r = await admin.req('POST', '/api/admin/requests/' + legacy.id + '/approve');
    ok(r.status === 409 && r.data?.code === 'EMAIL_REQUIRED', 'aprovar pedido antigo sem email: 409 EMAIL_REQUIRED', r);
    const after = await prisma.tenant.findUnique({ where: { id: legacy.id }, select: { status: true } });
    const owners = await prisma.user.count({ where: { tenant_id: legacy.id } });
    ok(after.status === 'pending' && owners === 0, 'sem email: o pedido continua pendente e nenhuma conta @genesis.co.mz foi criada', { after, owners });
  } finally {
    await prisma.auditLog.deleteMany({ where: { entity_id: legacy.id } });
    await prisma.user.deleteMany({ where: { tenant_id: legacy.id } });
    await prisma.tenant.delete({ where: { id: legacy.id } });
  }
  await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { status: 'trial', trial_ends_at: new Date(Date.now() + 5 * 86400000) } });
  const susp =await admin.req('POST', '/api/admin/tenants/' + ctx.tenant.id + '/suspend');
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
  section(15, 'Relatorios com rastreio, perdas, metas e txenekas (Genesis 2.1)');
  const owner = ownerClient();
  const today = new Date(); const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const day = iso(today);
  const ym = `year=${today.getFullYear()}&month=${today.getMonth() + 1}`;
  const get = async (p) => { const r = await owner.req('GET', p); if (r.status !== 200) throw new Error(p + ' -> ' + r.status + ' ' + JSON.stringify(r.data)); return r.data; };

  ok((await owner.req('POST', '/api/owner/goals', { target_amount: 1000000 })).status < 300, 'meta do mes: 10 000 MT');
  const d0 = await get('/api/owner/reports/daily?date=' + day);
  const m0 = await get('/api/owner/reports/monthly?' + ym);

  const term = await cashierTerminal();
  const sale = await term.req('POST', '/api/sales', saleBody({ items: [{ product_id: ctx.product.id, quantity: 2, unit_sell_price: 10000, unit_cost_price: 0 }], total_amount: 20000, amount_received: 20000 }));
  ok(sale.status === 201, 'venda de 2 x 100 MT', sale);
  const sh = await term.req('POST', '/api/shrinkage_records', { id: crypto.randomUUID(), product_id: ctx.product.id, quantity: 1, reason: 'broken' });
  ok(sh.status < 300, 'quebra de 1 (custo 60 MT)', sh);
  const debt = await owner.req('POST', '/api/owner/debts', { debtor_name: 'Cliente Relatorio', debtor_phone: '841234000', total_amount: 50000, due_date: iso(new Date(Date.now() + 10 * 86400000)) });
  ok(debt.status === 201, 'txeneka de 500 MT', debt);
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
  ok(tl.rows.some((e) => e.type === 'debt' && e.amount === 50000) && tl.rows.some((e) => e.type === 'debt_payment' && e.amount === 20000), 'rastreio: txeneka nova e pagamento');
  // 9.4: dados para o ecra montar o texto na lingua de quem ve.
  ok(lossEv?.product_name === 'Cerveja Teste' && lossEv.quantity > 0 && lossEv.auto === false, '9.4: a perda traz produto, quantidade e se foi automatica', lossEv);
  ok(tl.rows.filter((e) => e.type === 'debt' || e.type === 'debt_payment').every((e) => typeof e.debtor === 'string' && e.debtor.length > 0), '9.4: txenekas trazem o nome do cliente');
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
  ok(m1.debts.new_total - m0.debts.new_total === 50000 && m1.debts.received_total - m0.debts.received_total === 20000, 'mensal: txenekas novas +500 MT e recebidas +200 MT');
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
  const term = await cashierTerminal();
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
  const term = await cashierTerminal();
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

  const term = await cashierTerminal();
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

async function test19() {
  section(19, 'QR do recibo: verificacao publica sem sessao (Fase 7.2)');
  const saleId = await newSale(ownerClient());
  const anon = client();
  const r = await anon.req('GET', '/api/verify/' + saleId);
  ok(r.status === 200 && r.data?.store?.name === ctx.tenant.name, 'sem sessao: recibo encontrado com o nome da loja (200)', r);
  ok(r.data?.sale?.status === 'completed' && r.data?.sale?.total_amount === 10000, 'estado concluida e total em centavos (10000)', r.data?.sale);
  ok(r.data?.sale?.items?.length === 1 && r.data.sale.items[0].product_name === 'Cerveja Teste', 'artigos do recibo (nome, quantidade, preco)', r.data?.sale?.items);
  const raw = JSON.stringify(r.data || {});
  ok(!/cost|cashier|tenant_id|user_id/i.test(raw), 'nao expoe custos, caixista nem ids internos', raw);
  const head = await fetch(BASE + '/api/verify/' + saleId);
  ok(/no-store/.test(head.headers.get('cache-control') || ''), 'Cache-Control: no-store');
  ok((await anon.req('GET', '/api/verify/nao-e-um-uuid')).status === 400, 'codigo invalido = 400');
  ok((await anon.req('GET', '/api/verify/' + crypto.randomUUID())).status === 404, 'uuid inexistente = 404');
  await prisma.sale.update({ where: { id: saleId }, data: { status: 'cancelled' } });
  const c = await anon.req('GET', '/api/verify/' + saleId);
  ok(c.status === 200 && c.data?.sale?.status === 'cancelled', 'venda cancelada aparece como cancelada', c.data?.sale);
}

async function test20() {
  section(20, 'Produto: icone, varias validades, fornecedor, lotes e sugestoes ao catalogo-mestre (Fase 8.2)');
  const owner = ownerClient();
  const tag = ctx.tenant.id.slice(0, 8);
  const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const supplier = await prisma.supplier.create({ data: { tenant_id: ctx.tenant.id, name: 'Fornecedor 8.2', phone: '84 000 0000', delivery_cost_per_visit: 30000 } });
  const base = { name: 'Cotonetes ' + tag, category: 'Higiene', sell_price: 6000, cost_price: 3500, min_stock: 5 };

  ok((await owner.req('POST', '/api/products', { ...base, icon: 'foguete' })).status === 400, 'icone desconhecido = 400');
  ok((await owner.req('POST', '/api/products', { ...base, lots: [{ quantity: 5, expiry_date: '2026-02-31' }] })).status === 400, 'validade inexistente (31/02) = 400');
  ok((await owner.req('POST', '/api/products', { ...base, lots: [{ quantity: 0 }] })).status === 400, 'lote com 0 unidades = 400');
  ok((await owner.req('POST', '/api/products', { ...base, supplier_id: crypto.randomUUID(), lots: [{ quantity: 5 }] })).status === 400, 'fornecedor de outra loja / inexistente = 400');

  const c = await owner.req('POST', '/api/products', { ...base, icon: 'bath', supplier_id: supplier.id, lots: [{ quantity: 50, expiry_date: day(20) }, { quantity: 50, expiry_date: day(10) }] });
  ok(c.status === 201 && c.data?.stock_qty === 100 && c.data?.icon === 'bath' && c.data?.has_expiry === true, 'criado com icone, 100 un. e validade', c.data);
  const pid = c.data?.id;
  const entries = await prisma.stockEntry.findMany({ where: { product_id: pid } });
  ok(entries.length === 2 && entries.every((e) => e.supplier_id === supplier.id && e.unit_cost === 3500), 'com fornecedor: 2 entradas de stock (contam no custo de entrega)', entries);
  let lots = (await owner.req('GET', `/api/products/${pid}/lots`)).data;
  ok(lots?.stock_qty === 100 && lots.lots.length === 2 && lots.lots[0].expiry_date === day(10) && lots.lots[1].expiry_date === day(20), 'lotes: 50 a ' + day(10) + ' e 50 a ' + day(20) + ' (o que expira primeiro em cima)', lots);

  const noSup = await owner.req('POST', '/api/products', { name: 'Agulhas ' + tag, category: 'Costura', sell_price: 1000, cost_price: 500, lots: [{ quantity: 10 }] });
  ok(noSup.status === 201 && (await prisma.stockEntry.count({ where: { product_id: noSup.data?.id } })) === 0 && (await prisma.stockLot.count({ where: { product_id: noSup.data?.id } })) === 1, 'sem fornecedor: so o lote (sem entrada de compra)');

  // Sugestoes ao catalogo-mestre: produto conhecido nao conta, o novo sim.
  const known = await prisma.masterCatalog.findFirst({ select: { product_name: true } });
  const k = await owner.req('POST', '/api/products', { name: '  ' + known.product_name.toUpperCase() + ' ', category: 'Geral', sell_price: 9900, cost_price: 5000 });
  ok(k.status === 201 && (await prisma.catalogSuggestion.count({ where: { product_id: k.data?.id } })) === 0, 'produto do catalogo-mestre (outra escrita) nao vira sugestao');
  const sug = await prisma.catalogSuggestion.findFirst({ where: { product_id: pid } });
  ok(sug && sug.status === 'pending' && sug.business_type === 'bottle_store' && sug.cost_price === 3500 && sug.sell_price === 6000 && sug.icon === 'bath', 'produto novo: sugestao pendente com custo, preco e icone', sug);
  ok((await owner.req('PATCH', '/api/products/' + pid, { sell_price: 6500 })).status === 200 && (await prisma.catalogSuggestion.findFirst({ where: { product_id: pid } })).sell_price === 6500, 'mudar o preco actualiza a sugestao pendente');
  ok((await prisma.runWithTenant(crypto.randomUUID(), () => prisma.catalogSuggestion.count({ where: { tenant_id: ctx.tenant.id } }))) === 0, 'sugestoes invisiveis noutra loja (RLS)');

  // Validade ali mesmo: dividir um lote e mudar outro.
  const first = lots.lots[0];
  ok((await owner.req('PATCH', `/api/products/${pid}/lots/${first.id}`, { expiry_date: day(5), quantity: 51 })).status === 400, 'dividir mais do que o lote tem = 400');
  ok((await owner.req('PATCH', `/api/products/${noSup.data.id}/lots/${first.id}`, { expiry_date: day(5) })).status === 404, 'lote de outro produto = 404');
  const split = await owner.req('PATCH', `/api/products/${pid}/lots/${first.id}`, { expiry_date: day(3), quantity: 20 });
  ok(split.status === 200 && split.data?.quantity === 20, '20 das 50 passam a validade ' + day(3), split);
  lots = (await owner.req('GET', `/api/products/${pid}/lots`)).data;
  ok(lots.lots.length === 3 && lots.lots.reduce((s, l) => s + l.quantity, 0) === 100 && lots.lots[0].expiry_date === day(3) && lots.lots[0].quantity === 20, 'agora 3 lotes, total continua 100', lots.lots);
  const nolot = (await owner.req('GET', `/api/products/${noSup.data.id}/lots`)).data.lots[0];
  const set = await owner.req('PATCH', `/api/products/${noSup.data.id}/lots/${nolot.id}`, { expiry_date: day(30) });
  ok(set.status === 200 && (await prisma.product.findUnique({ where: { id: noSup.data.id } })).has_expiry === true, 'lote sem data recebe validade; produto passa a "com validade"');
  ok((await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'LOT_EXPIRY_CHANGED' } })) === 2, 'auditoria: LOT_EXPIRY_CHANGED (2)');
  ok((await prisma.auditLog.count({ where: { tenant_id: ctx.tenant.id, action: 'CREATE_PRODUCT', entity_id: pid } })) === 1, 'auditoria: CREATE_PRODUCT');

  const term = await cashierTerminal();
  ok((await term.req('GET', `/api/products/${pid}/lots`)).status === 403, 'caixista nao ve lotes (403)');
  ok((await term.req('POST', '/api/products', { ...base, name: 'X ' + tag })).status === 403, 'caixista nao cria produtos (403)');

  // Painel do super admin.
  const admin = adminClient();
  const list = await admin.req('GET', '/api/admin/catalog-suggestions');
  const group = list.data?.groups?.find((g) => g.name_key === 'cotonetes ' + tag);
  ok(list.status === 200 && group && group.stores === 1 && group.avg_cost === 3500 && group.avg_sell === 6500 && group.category === 'Higiene', 'admin ve a sugestao com custo e preco', group);
  ok(!JSON.stringify(list.data).includes(ctx.tenant.id) && !JSON.stringify(list.data).includes(ctx.tenant.name), 'admin: sem id nem nome da loja');
  ok((await admin.req('GET', '/api/admin/overview')).data?.catalog_suggestions >= 2, 'visao geral conta as sugestoes pendentes');
  ok((await owner.req('GET', '/api/admin/catalog-suggestions')).status === 403, 'dono nao chega as sugestoes (403)');
  const acc = { business_type: 'bottle_store', name_key: group.name_key, product_name: 'Cotonetes ' + tag, category: 'Higiene', suggested_cost: 3500, suggested_sell: 6500, icon: 'bath' };
  ok((await admin.req('POST', '/api/admin/catalog-suggestions/accept', { ...acc, suggested_sell: 0 })).status === 400, 'aceitar com preco 0 = 400');
  const a = await admin.req('POST', '/api/admin/catalog-suggestions/accept', acc);
  const row = a.data?.id ? await prisma.masterCatalog.findUnique({ where: { id: a.data.id } }) : null;
  try {
    ok(a.status === 201 && row && row.icon === 'bath' && row.suggested_sell === 6500 && row.business_type === 'bottle_store', 'aceite: entra no catalogo-mestre (com icone)', a);
    ok((await prisma.catalogSuggestion.findFirst({ where: { product_id: pid } })).status === 'added', 'sugestao marcada como acrescentada');
    ok((await admin.req('POST', '/api/admin/catalog-suggestions/accept', acc)).status === 404, 'aceitar outra vez = 404');
    const cat = await fetch(BASE + '/api/catalogs/bottle_store').then((r) => r.json());
    ok(cat.template.sampleProducts.some((p) => p.name === 'Cotonetes ' + tag), 'lojas novas (onboarding) ja recebem o produto');
    const d = await admin.req('POST', '/api/admin/catalog-suggestions/dismiss', { business_type: 'bottle_store', name_key: 'agulhas ' + tag });
    ok(d.status === 200 && (await prisma.catalogSuggestion.findFirst({ where: { product_id: noSup.data.id } })).status === 'dismissed', 'ignorar sugestao');
    ok((await prisma.auditLog.count({ where: { action: { in: ['CATALOG_SUGGESTION_ADDED', 'CATALOG_SUGGESTION_DISMISSED'] }, user_id: ctx.admin.id } })) === 2, 'auditoria do admin (2)');
  } finally {
    if (row) await prisma.masterCatalog.delete({ where: { id: row.id } });
  }
}

async function test21() {
  section(21, 'Turno por dia: um fecho por dia de Maputo, abre sozinho no dia seguinte, turno 24/24 (10/10/2026)');
  const term = await cashierTerminal();
  const cid = ctx.cashier.id;
  const t = ctx.tenant.id;
  const day = (offsetDays) => new Date(Date.now() + 2 * 3600 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10);
  const reset = async () => {
    await prisma.shiftClosing.deleteMany({ where: { tenant_id: t, cashier_user_id: cid } });
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, entity_id: cid, action: { in: ['SHIFT_OPENED', 'SHIFT_ATTEMPT_FAIL', 'CASHIER_LOCKED', 'CASHIER_UNLOCKED', 'POS_LOGIN'] } } });
    await prisma.sale.updateMany({ where: { tenant_id: t, cashier_user_id: cid }, data: { status: 'cancelled' } });
  };
  const shift = async () => (await term.req('GET', '/api/pos/shift')).data;
  const close = (v) => term.req('POST', '/api/pos/shift/close', { declared_amount: v });
  const lastClosing = () => prisma.shiftClosing.findFirst({ where: { tenant_id: t, cashier_user_id: cid }, orderBy: { closed_at: 'desc' } });

  await reset();
  ok((await shift()).open === true, 'sem fecho nenhum: turno aberto');
  ok((await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID() }))).status === 201, 'venda em dinheiro de 100 MT');
  ok((await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID(), payment_method: 'emola' }))).status === 201, 'venda em e-Mola de 100 MT');
  const c1 = await close(10000);
  ok(c1.status === 201 && c1.data?.summary?.expected_cash === 10000 && c1.data?.summary?.other?.emola === 10000, 'fecho: esperado so o dinheiro (100); e-Mola 100 a parte no resumo', c1.data);
  ok(c1.data?.shift_day === day(0) && c1.data?.open_again === false, 'fecho gasta o dia de hoje (' + day(0) + ')', c1.data);
  ok((await lastClosing()).shift_day === day(0), 'shift_day gravado no fecho');
  ok((await shift()).open === false, 'mesmo dia: turno fechado');
  ok((await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID() }))).data?.code === 'SHIFT_CLOSED', 'mesmo dia: nao vende sem o PIN do dono (409)');

  // Dia seguinte: o fecho passa a ser de ontem -> abre sozinho, sem PIN.
  const c = await lastClosing();
  await prisma.shiftClosing.update({ where: { id: c.id }, data: { closed_at: new Date(c.closed_at.getTime() - 86400000), shift_day: day(-1) } });
  const next = await shift();
  ok(next.open === true && next.auto === true, 'dia novo: o perfil abre sozinho', next);
  ok((await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID() }))).status === 201, 'dia novo: vende sem PIN (201)');
  const below = await close(9000);
  ok(below.data?.code === 'COUNT_BELOW_EXPECTED', 'esperado do dia novo = so as vendas deste turno (90 < 100 recusado)');
  ok(below.data?.params?.n === below.data?.remaining && below.data?.params?.max === below.data?.maxAttempts, '9.5: fecho recusado traz as tentativas em params', below.data);
  await prisma.auditLog.deleteMany({ where: { tenant_id: t, entity_id: cid, action: 'SHIFT_ATTEMPT_FAIL' } });

  // 24/24: turno que comecou ontem as 15h e fecha hoje de madrugada = fecho de ONTEM.
  await reset();
  const anteontem = await prisma.shiftClosing.create({ data: { tenant_id: t, cashier_user_id: cid, counted_amount: 0, expected_amount: 0, difference: 0, closed_at: new Date(Date.now() - 2 * 86400000), shift_day: day(-2) } });
  const ontem15h = new Date(Date.parse(day(-1) + 'T15:00:00+02:00'));
  await prisma.auditLog.create({ data: { tenant_id: t, user_id: cid, action: 'POS_LOGIN', entity_type: 'user', entity_id: cid, created_at: ontem15h, ip_address: '0.0.0.0' } });
  const late = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID() }));
  ok(late.status === 201, 'vende no turno que vem de ontem');
  const c2 = await close(10000);
  ok(c2.status === 201 && c2.data?.shift_day === day(-1) && c2.data?.open_again === true, 'fecho conta como turno de ONTEM e o de hoje ja pode comecar', c2.data);
  ok((await shift()).open === true, 'depois de fechar o turno de ontem: aberto sem PIN');
  ok((await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID() }))).status === 201, 'turno de hoje: vende sem PIN');
  const c3 = await close(10000);
  ok(c3.status === 201 && c3.data?.shift_day === day(0) && c3.data?.open_again === false, 'segundo fecho gasta o dia de hoje', c3.data);
  ok((await shift()).open === false, 'agora fechado ate amanha (ou PIN do dono)');
  ok(anteontem.id && (await prisma.shiftClosing.count({ where: { tenant_id: t, cashier_user_id: cid } })) === 3, 'tres fechos registados');

  // Caso real do Kleyton: venda solta entre o fecho e a reabertura nao conta.
  await prisma.sale.create({ data: {
    tenant_id: t, cashier_user_id: cid, total_amount: 16000, total_cost: 9000, payment_method: 'cash', amount_received: 16000, change_given: 0, status: 'completed', daily_number: 99,
    items: { create: [{ product_id: ctx.product.id, product_name: ctx.product.name, quantity: 1, unit_sell_price: 16000, unit_cost_price: 9000 }] },
  } });
  const reopen = await term.req('POST', '/api/pos/shift/open', { pin: PIN });
  ok(reopen.status === 201 && reopen.data?.open === true, 'dono reabre hoje com o PIN');
  const c4 = await close(0);
  ok(c4.status === 201 && c4.data?.summary?.expected_cash === 0, 'reaberto sem vendas: fecha com 0 (a venda solta de 160 MT antes da reabertura nao entra)', c4.data);
  ok(c4.data?.shift_day === day(0), 'turno reaberto pelo dono conta no dia da reabertura');

  // Estado limpo para quem vier depois.
  await reset();
}

// ---------------------------------------------------------------------------
async function test22() {
  section(22, 'Compra de produto que ja existe com varias validades (Ajuste manual > Adicionar, Fase 8.3)');
  const owner = ownerClient();
  const t = ctx.tenant.id;
  const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const now = new Date();
  const ym = `year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
  const created = await owner.req('POST', '/api/products', { name: 'Sumo Lotes Teste', category: 'Bebidas', sell_price: 6000, cost_price: 4000, has_expiry: false });
  ok(created.status === 201, 'produto sem validade, sem stock', created);
  const pid = created.data.id;
  const sup = await owner.req('POST', '/api/inventory/suppliers', { name: 'Fornecedor Lotes Teste', delivery_cost_per_visit: 15000 });
  ok(sup.status === 201, 'fornecedor com entrega de 150 MT', sup);
  const delivery = async () => (await owner.req('GET', '/api/owner/reports/monthly?' + ym)).data?.deductions?.total_supplier_delivery;
  const d0 = await delivery();

  const buy = (body) => owner.req('POST', '/api/inventory/stock', { product_id: pid, unit_cost: 4200, supplier_id: sup.data.id, ...body });
  const r = await buy({ lots: [{ quantity: 50, expiry_date: day(7) }, { quantity: 50, expiry_date: day(10) }] });
  ok(r.status === 201 && r.data?.entries?.length === 2 && r.data?.lots?.length === 2, 'uma compra com 2 validades (50 a 7 dias + 50 a 10 dias): 201, 2 entradas, 2 lotes', r.data);
  const p = await prisma.product.findUnique({ where: { id: pid } });
  const lots = await prisma.stockLot.findMany({ where: { product_id: pid }, orderBy: { expiry_date: 'asc' } });
  ok(p.stock_qty === 100 && lots.map((l) => l.quantity_remaining).join(',') === '50,50' && lots.map((l) => l.expiry_date.toISOString().slice(0, 10)).join(',') === day(7) + ',' + day(10), 'stock 100 = 50 + 50, cada lote com a sua validade');
  ok(p.has_expiry === true && p.cost_price === 4200, 'produto passa a "com validade" e custo actualizado para 42 MT');
  ok((await prisma.productPriceHistory.count({ where: { product_id: pid, new_cost: 4200 } })) === 1, 'mudanca de custo no historico (uma vez)');
  const audit = await prisma.auditLog.findFirst({ where: { tenant_id: t, action: 'STOCK_ENTRY', entity_id: pid } });
  ok(audit && JSON.parse(audit.new_value).added === 100 && JSON.parse(audit.old_value).stock_qty === 0, 'auditoria STOCK_ENTRY: +100 (de 0 para 100)', audit?.new_value);
  const d1 = await delivery();
  ok(d1 - d0 === 15000, 'custo de entrega conta UMA visita do fornecedor (150 MT), nao uma por validade', [d0, d1]);

  ok((await buy({ lots: [{ quantity: 0, expiry_date: null }] })).status === 400, 'linha com 0 unidades: 400');
  ok((await buy({ lots: [{ quantity: 5, expiry_date: '17/10/2026' }] })).status === 400, 'validade em formato errado: 400');
  ok((await buy({ quantity: 0 })).status === 400, 'sem quantidade: 400');
  ok((await buy({ lots: Array.from({ length: 21 }, () => ({ quantity: 1 })) })).status === 400, 'mais de 20 validades: 400');
  const single = await buy({ quantity: 3, supplier_id: null });
  ok(single.status === 201 && (await prisma.product.findUnique({ where: { id: pid } })).stock_qty === 103, 'formato antigo (quantity sem lotes) continua a funcionar: 103');
  const term = await cashierTerminal();
  ok((await term.req('POST', '/api/inventory/stock', { product_id: pid, unit_cost: 1, quantity: 5 })).status === 403, 'caixista nao regista compras (403)');
  const other = await prisma.product.findFirst({ where: { tenant_id: { not: t } }, select: { id: true } });
  if (other) ok((await owner.req('POST', '/api/inventory/stock', { product_id: other.id, unit_cost: 1, quantity: 5 })).status === 404, 'produto de outra loja: 404');

  // Retirar (quantidade positiva no ecra = delta negativo): sai por FEFO.
  const out = await owner.req('PATCH', '/api/products/' + pid + '/stock', { delta: -60, reason: 'contagem fisica' });
  ok(out.status === 200, 'retirar 60 com motivo (200)', out);
  const after = await prisma.stockLot.findMany({ where: { product_id: pid }, orderBy: [{ expiry_date: 'asc' }, { created_at: 'asc' }] });
  ok(after.reduce((s, l) => s + l.quantity_remaining, 0) === 43 && after[0].quantity_remaining === 0 && after[1].quantity_remaining === 40, 'saem primeiro as 50 que expiram antes, depois 10 das outras; ficam 43', after.map((l) => l.quantity_remaining));
  ok((await owner.req('PATCH', '/api/products/' + pid + '/stock', { delta: -44, reason: 'contagem fisica' })).status === 400, 'retirar mais do que ha: 400');
}

// Fase 8.4: vendas perdidas fora do catalogo (caixista) + agregado no admin.
async function test23() {
  section(23, 'Vendas perdidas: do catalogo e fora dele, quantidade e preco; admin sem nomes de lojas');
  const cashier = await cashierTerminal();
  const tag = 'Cotonete Verif ' + Date.now().toString().slice(-6);
  const ids = [];
  const post = async (c, body) => { const id = crypto.randomUUID(); ids.push(id); return c.req('POST', '/api/demand_captures', { id, ...body }); };
  // Na bateria completa a seccao 6 ja registou pedidos deste produto hoje: compara-se com o ponto de partida.
  const base = ((await ownerClient().req('GET', '/api/owner/reports/daily')).data?.lost_demand || []).find((d) => d.product_id === ctx.product.id) || { units: 0, requests: 0 };

  const a = await post(cashier, { product_id: ctx.product.id, quantity: 3 });
  ok(a.status === 201, 'do catalogo com 3 un.: 201', a);
  const b = await post(cashier, { product_name: '  ' + tag + '  ', quantity: 4, unit_price: 2500 });
  ok(b.status === 201 && b.data.product_id === null, 'fora do catalogo (4 un. a 25 MT): 201', b);
  const row = await prisma.demandCapture.findUnique({ where: { id: ids[1] } });
  ok(row && row.product_id === null && row.product_name === tag && row.quantity === 4 && row.unit_price === 2500 && row.recorded_by === ctx.cashier.id && row.name_key === tag.toLowerCase(), 'gravado: nome limpo, quantidade, preco em centavos, caixista real', row);
  const c = await post(cashier, { product_name: 'CERVEJA  teste' });
  ok(c.status === 201 && c.data.product_id === ctx.product.id, 'nome escrito igual a um produto da loja conta como esse produto', c.data);

  for (const [body, why] of [[{}, 'sem produto nem nome'], [{ product_name: tag, quantity: 0 }, 'quantidade 0'], [{ product_name: tag, quantity: 1.5 }, 'quantidade decimal'], [{ product_name: tag, unit_price: -1 }, 'preco negativo'], [{ product_name: 'x' }, 'nome com 1 letra'], [{ product_name: tag, quantity: 1001 }, 'quantidade acima de 1000'], [{ product_id: crypto.randomUUID() }, 'produto de outra loja/inexistente']]) {
    const r = await cashier.req('POST', '/api/demand_captures', { id: crypto.randomUUID(), ...body });
    ok(r.status === 400, why + ': 400', r.status);
  }
  const again = await cashier.req('POST', '/api/demand_captures', { id: ids[1], product_name: tag, quantity: 4 });
  ok(again.status === 200 && (await prisma.demandCapture.count({ where: { id: ids[1] } })) === 1, 'mesmo id 2x: idempotente (200, 1 registo)');

  // Fila offline com a sessao do caixista expirada: cookie do terminal + seller_user_id.
  const term = await pairedTerminal('Balcao vendas perdidas');
  const off = await post(term, { product_name: tag, quantity: 2, seller_user_id: ctx.cashier.id });
  ok(off.status === 201, 'offline: cookie do terminal + seller_user_id = 201 (antes a fila nao o mandava)', off);
  const noSeller = await term.req('POST', '/api/demand_captures', { id: crypto.randomUUID(), product_name: tag });
  ok(noSeller.status === 401, 'offline sem seller_user_id: 401 NO_SESSION', noSeller.status);
  const forged = await term.req('POST', '/api/demand_captures', { id: crypto.randomUUID(), product_name: tag, seller_user_id: ctx.owner.id });
  ok(forged.status === 403, 'offline com o dono como vendedor: 403', forged.status);
  const sh = await term.req('POST', '/api/shrinkage_records', { id: crypto.randomUUID(), product_id: ctx.product.id, quantity: 1, reason: 'broken', seller_user_id: ctx.cashier.id });
  ok(sh.status === 201, 'quebra offline com seller_user_id: 201', sh);

  // Relatorio do dono.
  const owner = ownerClient();
  const day = await owner.req('GET', '/api/owner/reports/daily');
  const lost = day.data?.lost_demand || [];
  const out = lost.find((d) => d.outside && d.name === tag);
  const cat = lost.find((d) => d.product_id === ctx.product.id);
  ok(out && out.units === 6 && out.requests === 2 && out.unit_price === 2500 && out.estimated_value === 15000, 'relatorio: fora do catalogo 6 un., 2 pedidos, ~150 MT', out);
  ok(cat && cat.units - base.units === 4 && cat.requests - base.requests === 2 && cat.estimated_value === cat.units * 10000, 'relatorio: do catalogo +4 un. (3+1) a 100 MT cada', { cat, base });
  const dd = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const tl = await owner.req('GET', `/api/owner/reports/timeline?types=demand&from=${dd(-1)}&to=${dd(1)}`);
  ok(tl.status === 200 && JSON.stringify(tl.data).includes(tag + ' ×4 (fora do catálogo)'), 'cronologia: "Cliente pediu: ' + tag + ' ×4 (fora do catalogo)"', tl.status);

  // Outra loja: o admin agrega 2 lojas; RLS nao mistura.
  const other = await prisma.tenant.create({ data: { name: 'TESTE-SEGURANCA-B-' + Date.now(), owner_name: 'B', business_type: 'bottle_store', location: 'T', phone: '840000001', status: 'active', onboarding_completed: true } });
  const otherOwner = await prisma.user.create({ data: { tenant_id: other.id, role: 'owner', name: 'Dono B', email: 'verif-b-' + Date.now() + '@teste.local', password_hash: 'x', is_active: true } });
  try {
    await prisma.demandCapture.create({ data: { tenant_id: other.id, product_name: tag.toUpperCase(), name_key: tag.toLowerCase(), quantity: 1, unit_price: 3500, recorded_by: otherOwner.id } });
    const bReport = await client(signAccessToken(otherOwner)).req('GET', '/api/owner/reports/daily');
    const bLost = bReport.data?.lost_demand || [];
    ok(bReport.status === 200 && bLost.length === 1 && bLost[0].units === 1, 'loja B so ve o seu pedido (1 un.), nao os da loja A', bLost);
    const adm = await adminClient().req('GET', '/api/admin/lost-requests?days=30');
    const g = (adm.data?.groups || []).find((x) => x.name_key === tag.toLowerCase());
    ok(adm.status === 200 && g && g.stores === 2 && g.requests === 3 && g.units === 7 && g.avg_price === 3000, 'admin: 2 lojas, 3 pedidos, 7 un., preco medio 30 MT', g);
    const txt = JSON.stringify(adm.data);
    ok(!txt.includes(ctx.tenant.name) && !txt.includes(other.name) && !txt.includes(ctx.tenant.id) && !txt.includes(other.id), 'admin: sem nomes nem ids de lojas');
    const ov = await adminClient().req('GET', '/api/admin/overview');
    ok(ov.status === 200 && ov.data.lost_requests_30d >= 3, 'visao geral conta os pedidos fora do catalogo (30 dias)', ov.data?.lost_requests_30d);
    ok((await owner.req('GET', '/api/admin/lost-requests', undefined, { Origin: ADMIN_ORIGIN })).status === 403, 'dono no /api/admin/lost-requests: 403');
    ok((await client(signAccessToken(ctx.admin)).req('GET', '/api/admin/lost-requests')).status === 403, 'admin sem a origem do painel: 403');
  } finally {
    await prisma.demandCapture.deleteMany({ where: { tenant_id: other.id } });
    await prisma.auditLog.deleteMany({ where: { tenant_id: other.id } });
    await prisma.user.delete({ where: { id: otherOwner.id } });
    await prisma.tenant.delete({ where: { id: other.id } });
  }
}

// Fase 8.5: auditoria do dono (filtros, paginacao, detalhe) + retencao.
async function test24() {
  section(24, 'Auditoria do dono: periodo, tipo, paginas, detalhe, retencao (minimo 2 meses)');
  const { runAuditRetention } = require('../src/services/auditRetention');
  const { retentionCutoff } = require('../src/utils/auditGroups');
  const owner = ownerClient();
  const t = ctx.tenant.id;
  const mk = (action, created_at, extra = {}) => prisma.auditLog.create({ data: { tenant_id: t, user_id: ctx.owner.id, action, entity_type: 'teste', entity_id: extra.entity_id || null, new_value: JSON.stringify(extra.new_value || { name: 'Reg ' + action }), old_value: extra.old_value ? JSON.stringify(extra.old_value) : null, ip_address: '127.0.0.1', created_at } });
  const DAY = 86400000;
  const now = Date.now();
  // Entrada de stock real (rota) + mudanca de PIN real (rota) + registos datados.
  const entry = await owner.req('POST', '/api/inventory/stock', { product_id: ctx.product.id, unit_cost: 6000, lots: [{ quantity: 7, expiry_date: null }] });
  ok(entry.status === 201, 'entrada de stock (7 un.) feita', entry.status);
  const pin = await owner.req('PUT', '/api/settings/authorization-pin', { owner_password: OWNER_PW, pin: '975310' });
  ok(pin.status === 200, 'PIN de autorizacao mudado', pin);
  await owner.req('PUT', '/api/settings/authorization-pin', { owner_password: OWNER_PW, pin: PIN });
  const old40 = await mk('UPDATE_PRODUCT', new Date(now - 40 * DAY), { old_value: { sell_price: 10000 }, new_value: { name: 'Cerveja Teste', sell_price: 12000 } });
  const old100 = await mk('CREATE_SALE', new Date(now - 100 * DAY));
  const oldUnlock = await mk('CASHIER_UNLOCKED', new Date(now - 200 * DAY), { entity_id: ctx.cashier.id });
  const oldFail = await mk('SHIFT_ATTEMPT_FAIL', new Date(now - 190 * DAY), { entity_id: ctx.cashier.id });
  const oldPin = await mk('POS_PIN_FAIL', new Date(now - 150 * DAY));

  const list = async (q) => owner.req('GET', '/api/owner/audit?' + q);
  const today = await list('period=today&group=all&limit=50');
  ok(today.status === 200 && Array.isArray(today.data.items) && today.data.items.length > 0 && today.data.items.every((a) => new Date(a.created_at) >= new Date(now - 2 * DAY)), 'hoje: so registos recentes', today.status);
  const stockG = await list('period=today&group=stock');
  const se = stockG.data.items.find((a) => a.action === 'STOCK_ENTRY');
  ok(se && stockG.data.items.every((a) => a.group === 'stock') && se.new_value.added === 7 && se.user_name === 'Dono Teste', 'tipo Stock: entrada +7 com quem fez', se && se.new_value);
  // Acesso de suporte do super admin (utilizador que a RLS da loja nao ve):
  // antes fazia a auditoria inteira dar 500.
  await prisma.auditLog.create({ data: { tenant_id: t, user_id: ctx.admin.id, action: 'SUPPORT_SESSION_OPENED', entity_type: 'tenant', entity_id: t, ip_address: '127.0.0.1' } });
  const sec = await list('period=today&group=security');
  const sup = (sec.data?.items || []).find((a) => a.action === 'SUPPORT_SESSION_OPENED');
  ok(sec.status === 200 && sup && sup.user_name === 'Equipa Genesis (suporte)', 'registo do acesso de suporte: 200 e aparece como «Equipa Genesis (suporte)»', sec.status);
  if (!Array.isArray(sec.data?.items)) console.log('  (diagnostico) tipo PINs devolveu', sec.status, JSON.stringify(sec.data).slice(0, 300));
  ok(Array.isArray(sec.data?.items) && sec.data.items.some((a) => a.action === 'AUTH_PIN_CHANGED') && !JSON.stringify(sec.data).includes('975310'), 'tipo PINs: mudanca de PIN aparece, sem o PIN', (sec.data?.items || []).map((a) => a.action));
  const month = await list('period=month&group=products');
  ok(month.status === 200 && !month.data.items.some((a) => a.id === old40.id), 'mes: registo de ha 40 dias nao aparece');
  const all = await list('period=all&group=products');
  const p40 = all.data.items.find((a) => a.id === old40.id);
  ok(p40 && p40.old_value.sell_price === 10000 && p40.new_value.sell_price === 12000, 'tudo: produto alterado ha 40 dias com antes/depois', p40);
  ok(Array.isArray(all.data.groups) && all.data.groups.some((g) => g.key === 'stock' && g.label === 'Stock') && all.data.retention_months === 2 && all.data.kept_since && all.data.cutoffs && all.data.cutoffs['6'], 'resposta traz os tipos, a retencao (2), desde quando guarda e os cortes', { r: all.data.retention_months, k: all.data.kept_since });

  // Paginacao sem repetidos.
  for (let i = 0; i < 7; i++) await mk('CREATE_EXPENSE', new Date(now - (i + 1) * 60000));
  const seen = new Set(); let cursor = null; let pages = 0; let dup = false;
  do {
    const r = await list('period=all&group=settings&limit=3' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
    for (const a of r.data.items) { if (seen.has(a.id)) dup = true; seen.add(a.id); }
    cursor = r.data.next_cursor; pages++;
  } while (cursor && pages < 10);
  ok(!dup && seen.size >= 7 && pages >= 3, 'paginas de 3: ' + seen.size + ' registos em ' + pages + ' paginas, sem repetidos');

  const det = await owner.req('GET', '/api/owner/audit/' + old40.id);
  ok(det.status === 200 && det.data.new_value.sell_price === 12000 && det.data.group === 'products', 'detalhe de um registo: 200');
  const other = await prisma.auditLog.findFirst({ where: { tenant_id: { not: t }, NOT: { tenant_id: null } }, select: { id: true } });
  if (other) ok((await owner.req('GET', '/api/owner/audit/' + other.id)).status === 404, 'registo de outra loja: 404');
  ok((await list('period=ontem')).status === 400 && (await list('group=xpto')).status === 400, 'periodo/tipo invalidos: 400');
  const cashier = await cashierTerminal();
  ok((await cashier.req('GET', '/api/owner/audit?period=today')).status === 403, 'caixista: 403');

  // Retencao.
  ok((await owner.req('PUT', '/api/settings/audit-retention', { months: 1 })).status === 400, 'retencao de 1 mes: 400 (minimo 2)');
  ok((await owner.req('PUT', '/api/settings/audit-retention', { months: 5 })).status === 400, 'retencao fora das opcoes: 400');
  const r6 = await owner.req('PUT', '/api/settings/audit-retention', { months: 6 });
  ok(r6.status === 200 && (await prisma.tenant.findUnique({ where: { id: t } })).audit_retention_months === 6, 'retencao 6 meses guardada');
  ok(await prisma.auditLog.count({ where: { tenant_id: t, action: 'UPDATE_AUDIT_RETENTION' } }) === 1, 'mudanca da retencao auditada');
  ok((await cashier.req('PUT', '/api/settings/audit-retention', { months: 2 })).status === 403, 'caixista nao muda a retencao: 403');
  // Outra loja com um registo antigo e um registo antigo do admin: intactos.
  const otherTenant = await prisma.tenant.create({ data: { name: 'TESTE-SEGURANCA-C-' + Date.now(), owner_name: 'C', business_type: 'bottle_store', location: 'T', phone: '840000002', status: 'active', audit_retention_months: 2 } });
  const otherOwner = await prisma.user.create({ data: { tenant_id: otherTenant.id, role: 'owner', name: 'Dono C', email: 'verif-c-' + Date.now() + '@teste.local', password_hash: 'x', is_active: true } });
  const adminOld = await prisma.auditLog.create({ data: { tenant_id: null, user_id: ctx.admin.id, action: 'APPROVE_TENANT', entity_type: 'tenant', ip_address: '127.0.0.1', created_at: new Date(now - 400 * DAY) } });
  try {
    const otherOld = await prisma.auditLog.create({ data: { tenant_id: otherTenant.id, user_id: otherOwner.id, action: 'CREATE_SALE', entity_type: 'teste', ip_address: '127.0.0.1', created_at: new Date(now - 100 * DAY) } });
    const exists = async (row) => Boolean(await prisma.auditLog.findUnique({ where: { id: row.id } }));
    await runAuditRetention({ tenantId: t });
    ok((await exists(old100)) && (await exists(old40)) && (await exists(oldPin)), 'retencao 6 meses: registos de 40, 100 e 150 dias ficam');
    await owner.req('PUT', '/api/settings/audit-retention', { months: 2 });
    const { getShiftLock } = require('../src/utils/shiftLock');
    const lockBefore = await getShiftLock(prisma, t, ctx.cashier.id);
    const removed = await runAuditRetention({ tenantId: t });
    ok(!(await exists(old100)) && !(await exists(oldPin)) && removed >= 2, 'retencao 2 meses: venda de ha 100 dias e PIN errado de ha 150 apagados (' + removed + ')');
    ok((await exists(old40)) === (new Date(now - 40 * DAY) >= retentionCutoff({ months: 2 })), 'registo de ha 40 dias segue a regra do mes corrente + anterior');
    ok((await exists(oldUnlock)) && (await exists(oldFail)), 'protegidos ficam: desbloqueio e contagem errada antigos');
    ok((await exists(otherOld)) && (await exists(adminOld)), 'outra loja e registos do admin intactos');
    const lockAfter = await getShiftLock(prisma, t, ctx.cashier.id);
    ok(JSON.stringify(lockAfter) === JSON.stringify(lockBefore), 'a limpeza nao muda o estado do bloqueio do caixista', { lockBefore, lockAfter });
  } finally {
    await prisma.auditLog.deleteMany({ where: { OR: [{ tenant_id: otherTenant.id }, { id: adminOld.id }] } });
    await prisma.user.delete({ where: { id: otherOwner.id } });
    await prisma.tenant.delete({ where: { id: otherTenant.id } });
  }
}

// Fase 8.6: o super admin edita o catalogo-mestre (centavos, origem do painel).
async function test25() {
  section(25, 'Catalogo-mestre: listar, acrescentar e editar no admin; lojas novas recebem a alteracao');
  const admin = adminClient();
  const tag = 'Sumo Verif ' + Date.now().toString().slice(-6);
  const ids = [];
  try {
    const list = await admin.req('GET', '/api/admin/master-catalog?type=bottle_store');
    ok(list.status === 200 && Array.isArray(list.data.products) && list.data.products.every((p) => p.id && Number.isInteger(p.suggested_sell)) && list.data.counts.bottle_store === list.data.products.length, 'lista com id e precos em centavos (' + (list.data?.products?.length) + ' produtos)', list.status);
    ok((await admin.req('GET', '/api/admin/master-catalog?type=xpto')).status === 400, 'tipo invalido: 400');
    const add = await admin.req('POST', '/api/admin/master-catalog', { business_type: 'bottle_store', product_name: tag, category: 'Sumos', suggested_cost: 3000, suggested_sell: 4500, icon: 'droplet', barcode: null });
    ok(add.status === 201 && add.data.suggested_sell === 4500, 'acrescentar: 201 (45,00 MT em centavos)', add);
    if (add.data?.id) ids.push(add.data.id);
    const id = add.data.id;
    ok((await admin.req('POST', '/api/admin/master-catalog', { business_type: 'bottle_store', product_name: tag.toUpperCase(), category: 'Sumos', suggested_cost: 1, suggested_sell: 2 })).status === 409, 'mesmo nome (maiusculas) no mesmo tipo: 409');
    const ed = await admin.req('PUT', '/api/admin/master-catalog/' + id, { product_name: tag + ' 1L', category: 'Sumos', suggested_cost: 3200, suggested_sell: 5000, icon: 'droplet', barcode: '6001234999999' });
    ok(ed.status === 200 && ed.data.product_name === tag + ' 1L' && ed.data.suggested_sell === 5000 && ed.data.barcode === '6001234999999', 'editar nome, preco e codigo: 200', ed);
    for (const [body, why] of [[{ product_name: tag, category: 'S', suggested_cost: 0, suggested_sell: 0 }, 'venda 0'], [{ product_name: tag, category: 'S', suggested_cost: 1, suggested_sell: 10.5 }, 'preco nao inteiro (centavos)'], [{ product_name: tag, category: 'S', suggested_cost: 1, suggested_sell: 100, icon: 'nao-existe' }, 'icone invalido'], [{ product_name: tag, category: 'S', suggested_cost: 1, suggested_sell: 100, barcode: 'a b' }, 'codigo invalido'], [{ product_name: '', category: 'S', suggested_cost: 1, suggested_sell: 100 }, 'sem nome']]) {
      ok((await admin.req('PUT', '/api/admin/master-catalog/' + id, body)).status === 400, why + ': 400');
    }
    const other = list.data.products[0];
    if (other) ok((await admin.req('PUT', '/api/admin/master-catalog/' + id, { product_name: other.product_name, category: 'S', suggested_cost: 1, suggested_sell: 100 })).status === 409, 'renomear para um nome que ja existe: 409');
    ok((await admin.req('PUT', '/api/admin/master-catalog/00000000-0000-0000-0000-000000000000', { product_name: 'x', category: 'S', suggested_cost: 1, suggested_sell: 100 })).status === 404, 'produto inexistente: 404');
    const pub = await fetch(BASE + '/api/catalogs/bottle_store').then((r) => r.json());
    const seen = pub.template.sampleProducts.find((p) => p.name === tag + ' 1L');
    ok(seen && seen.price_mzn === 50 && seen.cost_mzn === 32 && seen.icon === 'droplet', 'onboarding (lojas novas) ja recebe o produto editado (50 MT)', seen);
    const aud = await prisma.auditLog.findMany({ where: { entity_id: id, action: { in: ['MASTER_CATALOG_CREATED', 'MASTER_CATALOG_UPDATED'] } } });
    const upd = aud.find((x) => x.action === 'MASTER_CATALOG_UPDATED');
    ok(aud.length === 2 && upd && JSON.parse(upd.old_value).suggested_sell === 4500 && JSON.parse(upd.new_value).suggested_sell === 5000 && upd.tenant_id === null, 'auditado (criado + alterado 45 -> 50 MT, sem loja)');
    ok((await ownerClient().req('PUT', '/api/admin/master-catalog/' + id, { product_name: 'x', category: 'S', suggested_cost: 1, suggested_sell: 100 }, { Origin: ADMIN_ORIGIN })).status === 403, 'dono: 403');
    ok((await client(signAccessToken(ctx.admin)).req('GET', '/api/admin/master-catalog')).status === 403, 'admin sem a origem do painel: 403');
    ok((await admin.req('GET', '/api/master_catalogs')).status === 404, 'rota antiga /api/master_catalogs: 404');
  } finally {
    await prisma.auditLog.deleteMany({ where: { entity_id: { in: ids } } });
    await prisma.masterCatalog.deleteMany({ where: { id: { in: ids } } });
  }
}

// Fase 8.7: horarios dos relatorios + envio programado (desligado) + dia de Maputo.
async function test26() {
  section(26, 'Horarios dos relatorios por WhatsApp; envio programado sem repetir; dia do relatorio = dia de Maputo');
  const { runReportJob } = require('../src/services/reportJob');
  const owner = ownerClient();
  const t = ctx.tenant.id;
  const g0 = await owner.req('GET', '/api/settings');
  ok(g0.status === 200 && g0.data.report_schedule && g0.data.report_schedule.daily_report_time === '21:00' && g0.data.report_schedule.weekly_report_day === 1 && g0.data.reports_whatsapp_enabled === false, 'por defeito: diario 21:00, semanal a segunda; envio automatico desligado', g0.data && g0.data.report_schedule);
  const body = { daily_report_time: '00:00', weekly_report_day: 5, weekly_report_time: '18:30', monthly_report_time: '07:15' };
  const put = await owner.req('PUT', '/api/settings/report-schedule', body);
  ok(put.status === 200, 'guardar horarios: 200', put);
  const g1 = await owner.req('GET', '/api/settings');
  ok(JSON.stringify(g1.data.report_schedule) === JSON.stringify(body), 'gravado e devolvido igual', g1.data.report_schedule);
  ok(await prisma.auditLog.count({ where: { tenant_id: t, action: 'UPDATE_REPORT_SCHEDULE' } }) === 1, 'mudanca auditada');
  for (const [b, why] of [[{ ...body, daily_report_time: '24:00' }, 'hora 24:00'], [{ ...body, weekly_report_day: 7 }, 'dia 7'], [{ ...body, monthly_report_time: '7:15' }, 'hora sem zero'], [{ daily_report_time: '20:00' }, 'campos em falta']]) {
    ok((await owner.req('PUT', '/api/settings/report-schedule', b)).status === 400, why + ': 400');
  }
  const cashier = await cashierTerminal();
  ok((await cashier.req('PUT', '/api/settings/report-schedule', body)).status === 403, 'caixista: 403');

  // Envio programado com um enviador falso (nada sai para o WhatsApp).
  const maputoNow = new Date(Date.now() + 2 * 3600000);
  const today = maputoNow.toISOString().slice(0, 10);
  const dow = maputoNow.getUTCDay();
  const dom = maputoNow.getUTCDate();
  await prisma.tenant.update({ where: { id: t }, data: { daily_report_time: '00:00', weekly_report_day: dow, weekly_report_time: '00:00', monthly_report_time: '00:00', month_close_day: dom <= 28 ? dom : 1, opening_time: '08:00' } });
  const sent = [];
  const fake = async (m) => { sent.push(m); return { ok: true, sid: 'teste' }; };
  const n1 = await runReportJob({ tenantId: t, send: fake });
  const kindsSent = sent.map((m) => (/Relatório (diário|semanal|mensal)/.exec(m.message) || [])[1]).sort();
  const expected = dom <= 28 ? ['diário', 'mensal', 'semanal'] : ['diário', 'semanal'];
  ok(n1 === expected.length && JSON.stringify(kindsSent) === JSON.stringify(expected), 'diario (ontem, completo), semanal e mensal enviados: ' + n1, kindsSent);
  ok(sent.every((m) => m.to === '+258840000000' && /Receita: .* MT/.test(m.message) && /genesismz\.com\/app\/relatorios|\/app\/relatorios/.test(m.message)), 'para o WhatsApp da loja, com receita em MT e o link', sent[0] && sent[0].message);
  const yday = new Date(Date.parse(today + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
  ok(await prisma.auditLog.count({ where: { tenant_id: t, action: 'REPORT_SENT', entity_id: 'daily:' + yday } }) === 1, 'auditado com a chave do periodo (daily:' + yday + ')');
  const n2 = await runReportJob({ tenantId: t, send: fake });
  ok(n2 === 0 && sent.length === expected.length, 'segunda corrida (ex.: reinicio): nada repetido');
  // Falha do envio: fica registada e nao insiste de 5 em 5 minutos.
  await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'REPORT_SENT', entity_id: 'daily:' + yday } });
  const n3 = await runReportJob({ tenantId: t, send: async () => { throw new Error('modelo nao aprovado'); } });
  const fail = await prisma.auditLog.findFirst({ where: { tenant_id: t, action: 'REPORT_SEND_FAILED', entity_id: 'daily:' + yday } });
  ok(n3 === 0 && fail && JSON.parse(fail.new_value).reason === 'modelo nao aprovado', 'falha registada com o motivo');
  ok((await runReportJob({ tenantId: t, send: fake })) === 0, 'depois da falha nao repete');

  // Dia do relatorio = dia de Maputo, mesmo com o servidor em UTC (producao).
  // Venda as 00:30 de hoje em Maputo (= 22:30 UTC de ontem).
  const saleAt = new Date(Date.parse(today + 'T00:30:00Z') - 2 * 3600000);
  const sale = await prisma.sale.create({ data: {
    tenant_id: t, cashier_user_id: ctx.cashier.id, total_amount: 77700, total_cost: 1000, payment_method: 'cash', amount_received: 77700, change_given: 0, status: 'completed', daily_number: 98, created_at: saleAt,
    items: { create: [{ product_id: ctx.product.id, product_name: ctx.product.name, quantity: 1, unit_sell_price: 77700, unit_cost_price: 1000 }] },
  } });
  try {
    const dToday = await owner.req('GET', '/api/owner/reports/daily?date=' + today);
    const dYday = await owner.req('GET', '/api/owner/reports/daily?date=' + yday);
    const inToday = (dToday.data.gross_revenue || 0) >= 77700;
    const inYday = (dYday.data.gross_revenue || 0) >= 77700 && (dYday.data.gross_revenue % 77700 === 0);
    ok(inToday && !inYday, 'venda as 00:30 de Maputo conta HOJE, nao ontem (servidor de teste com TZ=' + (process.env.SERVER_TZ_NOTE || '?') + ')', { hoje: dToday.data.gross_revenue, ontem: dYday.data.gross_revenue });
  } finally {
    await prisma.saleItem.deleteMany({ where: { sale_id: sale.id } });
    await prisma.sale.delete({ where: { id: sale.id } });
  }
}

// Fase 8.8: codigo de barras unico por loja (a camara poe no carrinho o produto do codigo lido).
async function test27() {
  section(27, 'Codigo de barras unico por loja (camara e leitor sem ambiguidade)');
  const owner = ownerClient();
  const code = '560' + Date.now().toString().slice(-10);
  const a = await owner.req('POST', '/api/products', { name: 'Codigo A ' + code, category: 'Teste', sell_price: 1000, cost_price: 500, stock_qty: 0, barcode: code });
  ok(a.status === 201, 'produto A com o codigo: 201', a.status);
  const b = await owner.req('POST', '/api/products', { name: 'Codigo B ' + code, category: 'Teste', sell_price: 1000, cost_price: 500, stock_qty: 0, barcode: ' ' + code + ' ' });
  ok(b.status === 409 && b.data?.code === 'DUPLICATE_BARCODE' && /Codigo A/.test(b.data.error), 'criar outro com o mesmo codigo (com espacos): 409 com o nome do produto', b);
  ok(b.data?.params?.barcode === code && /Codigo A/.test(b.data?.params?.name || ''), '9.4: o 409 traz params (codigo e produto) para o ecra traduzir', b.data?.params);
  const c = await owner.req('POST', '/api/products', { name: 'Codigo C ' + code, category: 'Teste', sell_price: 1000, cost_price: 500, stock_qty: 0 });
  ok(c.status === 201, 'produto C sem codigo: 201');
  const ed = await owner.req('PATCH', '/api/products/' + c.data.id, { barcode: code });
  ok(ed.status === 409 && ed.data?.code === 'DUPLICATE_BARCODE', 'editar C para o codigo de A: 409', ed.status);
  const same = await owner.req('PATCH', '/api/products/' + a.data.id, { barcode: code, sell_price: 1100 });
  ok(same.status === 200 && same.data.sell_price === 1100, 'editar A sem mudar o codigo: 200');
  // Outra loja pode usar o mesmo codigo (o EAN do fabricante e igual em todo o lado).
  const other = await prisma.tenant.create({ data: { name: 'TESTE-SEGURANCA-D-' + Date.now(), owner_name: 'D', business_type: 'bottle_store', location: 'T', phone: '840000003', status: 'active', onboarding_completed: true } });
  const otherOwner = await prisma.user.create({ data: { tenant_id: other.id, role: 'owner', name: 'Dono D', email: 'verif-d-' + Date.now() + '@teste.local', password_hash: 'x', is_active: true } });
  try {
    const d = await client(signAccessToken(otherOwner)).req('POST', '/api/products', { name: 'Codigo D ' + code, category: 'Teste', sell_price: 1000, cost_price: 500, stock_qty: 0, barcode: code });
    ok(d.status === 201, 'outra loja com o mesmo codigo: 201', d.status);
  } finally {
    const pids = (await prisma.product.findMany({ where: { tenant_id: other.id }, select: { id: true } })).map((p) => p.id);
    await prisma.catalogSuggestion.deleteMany({ where: { tenant_id: other.id } });
    await prisma.auditLog.deleteMany({ where: { tenant_id: other.id } });
    await prisma.product.deleteMany({ where: { id: { in: pids } } });
    await prisma.user.delete({ where: { id: otherOwner.id } });
    await prisma.tenant.delete({ where: { id: other.id } });
  }
  // Desactivar A liberta o codigo.
  await owner.req('DELETE', '/api/products/' + a.data.id);
  const again = await owner.req('PATCH', '/api/products/' + c.data.id, { barcode: code });
  ok(again.status === 200, 'depois de remover A, C pode usar o codigo: 200', again.status);
}

// Fase 9.2 (decisao do fundador 12/10): o limite do login conta so as
// tentativas erradas (5 por IP + email, 20 por IP, em 15 min). Deixa este IP
// sem login durante 15 min: corre-a em ultimo e reinicia o backend de teste
// antes dos testes de browser.
async function test28() {
  section(28, 'Limite do login: so as tentativas erradas contam');
  const login = (email, password) => client().req('POST', '/api/auth/login', { email, password });
  const okLogins = [];
  for (let i = 0; i < 7; i++) okLogins.push((await login(ctx.owner.email, OWNER_PW)).status);
  ok(okLogins.every((s) => s === 200), '7 logins certos seguidos do mesmo IP: todos 200 (antes o 6.º dava 429)', okLogins);
  const wrong = [];
  for (let i = 0; i < 5; i++) wrong.push((await login(ctx.owner.email, 'errada-' + i)).status);
  ok(wrong.every((s) => s === 401), '5 senhas erradas: 401', wrong);
  const sixth = await login(ctx.owner.email, 'errada-6');
  ok(sixth.status === 429 && sixth.data?.code === 'TOO_MANY_LOGINS', '6.ª senha errada da mesma conta: 429 TOO_MANY_LOGINS', sixth);
  ok((await login(ctx.owner.email.toUpperCase(), OWNER_PW)).status === 429, 'conta travada mesmo com a senha certa e o email em maiusculas');
  const other = await login('outra-conta-' + Date.now() + '@teste.local', 'x-qualquer');
  ok(other.status === 401, 'outra conta do mesmo IP nao fica travada: 401', other.status);
  let capAt = 0;
  for (let i = 1; i <= 21 && !capAt; i++) if ((await login('spray-' + i + '-' + Date.now() + '@teste.local', 'x')).status === 429) capAt = i;
  ok(capAt > 0, 'muitas contas diferentes do mesmo IP: chega ao limite de 20 erradas e da 429', capAt);
}

// Fase 9.3: cada pessoa escolhe a sua lingua (PT/EN). Nao faz login por senha
// (tokens assinados), por isso pode correr depois da 28.
async function test29() {
  section(29, 'Lingua da conta (PT/EN): cada pessoa escolhe a sua');
  const owner = ownerClient();
  const langOf = async (id) => (await prisma.user.findUnique({ where: { id }, select: { language: true } })).language;
  const me0 = await owner.req('GET', '/api/auth/me');
  ok(me0.status === 200 && me0.data.user.language === 'pt', 'conta nova: /me devolve pt', me0.data?.user?.language);
  const put = await owner.req('PUT', '/api/auth/language', { language: 'en' });
  ok(put.status === 200 && put.data.language === 'en', 'dono escolhe en: 200', put);
  ok((await owner.req('GET', '/api/auth/me')).data.user.language === 'en', 'dono: /me passa a devolver en');
  const bad = await owner.req('PUT', '/api/auth/language', { language: 'fr' });
  ok(bad.status === 400 && bad.data?.code === 'INVALID_LANGUAGE', 'lingua fora de pt/en: 400 INVALID_LANGUAGE', bad);
  ok((await owner.req('PUT', '/api/auth/language', {})).status === 400, 'sem lingua: 400');
  ok((await client().req('PUT', '/api/auth/language', { language: 'en' })).status === 401, 'sem sessao: 401');
  ok(await langOf(ctx.cashier.id) === 'pt', 'a escolha do dono nao muda a do caixista');

  // Caixista no terminal: o perfil e o login trazem a lingua dele; muda-a com a sessao pos.
  const term = await pairedTerminal('Balcao lingua');
  const prof = await term.req('GET', '/api/pos/terminal');
  ok(prof.data?.cashiers?.find((c) => c.id === ctx.cashier.id)?.language === 'pt', 'perfil do caixista no terminal traz a lingua (pt)');
  const login = await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
  ok(login.status === 200 && login.data.cashier.language === 'pt', 'login no terminal devolve a lingua do caixista', login.data);
  const cput = await term.req('PUT', '/api/auth/language', { language: 'en' });
  ok(cput.status === 200 && await langOf(ctx.cashier.id) === 'en', 'caixista (sessao pos) escolhe en: 200 e gravado', cput);
  ok(await langOf(ctx.owner.id) === 'en' && (await term.req('GET', '/api/pos/terminal')).data.cashiers.find((c) => c.id === ctx.cashier.id).language === 'en', 'perfil do terminal passa a en; o dono fica com a dele');
  await term.req('PUT', '/api/auth/language', { language: 'pt' });

  // Super admin (sem loja) e modo suporte (so leitura).
  const admin = adminClient();
  const aput = await admin.req('PUT', '/api/auth/language', { language: 'en' });
  ok(aput.status === 200 && await langOf(ctx.admin.id) === 'en', 'super admin escolhe en: 200 e gravado', aput);
  const sup = await client(signAccessToken(ctx.owner, { scope: 'support' })).req('PUT', '/api/auth/language', { language: 'pt' });
  ok(sup.status === 403 && sup.data?.code === 'SCOPE_RESTRICTED' && await langOf(ctx.owner.id) === 'en', 'modo suporte nao muda a lingua do dono (403)', sup);

  // Trial expirado: so leitura, mas a lingua da propria conta continua a mudar.
  await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { status: 'trial', trial_ends_at: new Date(Date.now() - 86400000) } });
  await sleep(STATUS_CACHE_MS + 500);
  try {
    const w = await owner.req('POST', '/api/sales', saleBody());
    ok(w.status === 402, 'trial expirado: vender continua bloqueado (402)', w.status);
    const tl = await owner.req('PUT', '/api/auth/language', { language: 'pt' });
    ok(tl.status === 200 && await langOf(ctx.owner.id) === 'pt', 'trial expirado: mudar a lingua passa (200)', tl);
  } finally {
    await prisma.tenant.update({ where: { id: ctx.tenant.id }, data: { status: 'active', trial_ends_at: null } });
    await sleep(STATUS_CACHE_MS + 500);
  }
}

// Fase 9.7 + 9.8: nome em ingles do catalogo-mestre (so o super admin o edita)
// e pesquisa bilingue: a loja ve name_en nos produtos com o mesmo nome.
async function test30() {
  section(30, 'Nome em ingles do catalogo-mestre e name_en nos produtos da loja');
  const admin = adminClient();
  const tag = 'Agua Verif ' + Date.now().toString().slice(-6);
  const ids = [];
  const prods = [];
  try {
    const add = await admin.req('POST', '/api/admin/master-catalog', { business_type: 'bottle_store', product_name: tag, product_name_en: 'Check Water', category: 'Águas', suggested_cost: 1000, suggested_sell: 2000 });
    ok(add.status === 201 && add.data.product_name_en === 'Check Water', 'admin acrescenta com nome em ingles: 201', add);
    if (add.data?.id) ids.push(add.data.id);
    const same = await prisma.product.create({ data: { tenant_id: ctx.tenant.id, name: tag.toUpperCase(), category: 'Águas', sell_price: 2000, cost_price: 1000, stock_qty: 5, is_active: true } });
    const renamed = await prisma.product.create({ data: { tenant_id: ctx.tenant.id, name: tag + ' da casa', category: 'Águas', sell_price: 2000, cost_price: 1000, stock_qty: 5, is_active: true } });
    prods.push(same.id, renamed.id);
    const owner = ownerClient();
    const list = (await owner.req('GET', '/api/products')).data;
    ok(list.find((p) => p.id === same.id)?.name_en === 'Check Water', 'produto da loja com o mesmo nome (maiusculas): name_en do catalogo');
    ok(list.find((p) => p.id === renamed.id)?.name_en === null, 'produto com outro nome (do dono): sem name_en');
    ok(list.find((p) => p.id === same.id)?.name === tag.toUpperCase(), 'o nome da loja fica como estava');
    const cash = (await client(signAccessToken(ctx.cashier)).req('GET', '/api/products')).data;
    const c = cash.find((p) => p.id === same.id);
    ok(c?.name_en === 'Check Water' && c.cost_price === undefined, 'caixista tambem recebe name_en (e continua sem custos)');
    const ed = await admin.req('PUT', '/api/admin/master-catalog/' + add.data.id, { product_name: tag, product_name_en: '', category: 'Águas', suggested_cost: 1000, suggested_sell: 2000 });
    ok(ed.status === 200 && ed.data.product_name_en === null, 'apagar o nome em ingles: fica sem (null)', ed);
    ok((await owner.req('GET', '/api/products')).data.find((p) => p.id === same.id)?.name_en === null, 'a loja deixa logo de ter name_en (junta na leitura)');
    ok((await admin.req('PUT', '/api/admin/master-catalog/' + add.data.id, { product_name: tag, product_name_en: 'x'.repeat(121), category: 'Águas', suggested_cost: 1000, suggested_sell: 2000 })).status === 400, 'nome em ingles com mais de 120: 400');
    ok((await ownerClient().req('PUT', '/api/admin/master-catalog/' + add.data.id, { product_name: tag, product_name_en: 'Hack', category: 'S', suggested_cost: 1, suggested_sell: 100 }, { Origin: ADMIN_ORIGIN })).status === 403, 'dono nao edita o nome em ingles: 403');
  } finally {
    await prisma.product.deleteMany({ where: { id: { in: prods } } });
    await prisma.auditLog.deleteMany({ where: { entity_id: { in: ids } } });
    await prisma.masterCatalog.deleteMany({ where: { id: { in: ids } } });
  }
}

// Fase 10.1: sino do dono. Calculado na leitura: cada alerta existe enquanto a
// situacao existe. Usa tokens assinados (pode correr depois da 28).
async function test31() {
  section(31, 'Sino do dono: stock, validades, txenekas, fecho de turno, bloqueio, meta, fecho do dia');
  const { loadOwnerNotifications } = require('../src/services/notifications');
  const t = ctx.tenant.id;
  const day = (offset) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Maputo' }).format(new Date(Date.now() + offset * 86400000));
  const owner = ownerClient();
  const find = (data, id) => data?.items?.find((i) => i.id === id);
  const fails = [];
  try {
    const crit = await prisma.product.create({ data: { tenant_id: t, name: 'Sino Critico', category: 'Teste', sell_price: 1000, cost_price: 500, stock_qty: 8, min_stock: 12, is_active: true } });
    const sev = await prisma.product.create({ data: { tenant_id: t, name: 'Sino Severo', category: 'Teste', sell_price: 1000, cost_price: 500, stock_qty: 15, min_stock: 20, is_active: true } });
    const exp = await prisma.product.create({ data: { tenant_id: t, name: 'Sino Iogurte', category: 'Teste', sell_price: 1000, cost_price: 500, stock_qty: 30, min_stock: 2, has_expiry: true, is_active: true } });
    const lot = await prisma.stockLot.create({ data: { tenant_id: t, product_id: exp.id, quantity_remaining: 4, expiry_date: new Date(day(0) + 'T00:00:00Z'), unit_cost: 500 } });
    const mk = (name, offset, paid = 0) => prisma.debt.create({ data: { tenant_id: t, debtor_name: name, debtor_phone: '840000001', total_amount: 100000, amount_paid: paid, due_date: new Date(day(offset) + 'T00:00:00Z'), status: paid >= 100000 ? 'paid' : 'active', created_by: ctx.owner.id } });
    const venc = await mk('Sino Vencida', -2);
    const amanha = await mk('Sino Amanha', 1);
    const dez = await mk('Sino Dez', 10);
    const paga = await mk('Sino Paga', 0, 100000);
    const closing = await prisma.shiftClosing.create({ data: { tenant_id: t, cashier_user_id: ctx.cashier.id, counted_amount: 10000, expected_amount: 15000, difference: -5000, shift_day: day(-1), closed_at: new Date(Date.now() - 86400000) } });
    for (let i = 0; i < 3; i++) fails.push((await prisma.auditLog.create({ data: { tenant_id: t, user_id: ctx.cashier.id, action: 'SHIFT_ATTEMPT_FAIL', entity_type: 'user', entity_id: ctx.cashier.id, ip_address: '127.0.0.1' } })).id);
    await prisma.saleGoal.create({ data: { tenant_id: t, month: new Date().getMonth() + 1, year: new Date().getFullYear(), target_amount: 100 } });
    await prisma.tenant.update({ where: { id: t }, data: { closing_time: '00:00' } });
    await newSale(owner);

    const r = await owner.req('GET', '/api/owner/notifications');
    ok(r.status === 200 && Array.isArray(r.data?.items) && r.data.count === r.data.items.length, 'dono: 200 com items e count', r.status);
    const d = r.data || { items: [] };
    ok(find(d, 'stock_low:' + crit.id)?.level === 'critical' && find(d, 'stock_low:' + crit.id).params.stock_level === 'critical', 'stock 8 (minimo 12): critico');
    ok(find(d, 'stock_low:' + sev.id)?.level === 'warning' && find(d, 'stock_low:' + sev.id).params.stock_level === 'severe', 'stock 15 (minimo 20): severo = aviso');
    ok(!find(d, 'stock_low:' + exp.id), 'produto acima do minimo: sem alerta de stock');
    ok(find(d, 'lot_expiring:' + lot.id)?.level === 'critical' && find(d, 'lot_expiring:' + lot.id).params.days_left === 0, 'lote que expira hoje: critico');
    ok(find(d, 'debt_due:' + venc.id)?.level === 'critical' && find(d, 'debt_due:' + venc.id).params.days_left === -2, 'txeneka vencida ha 2 dias: critica');
    ok(find(d, 'debt_due:' + amanha.id)?.level === 'warning', 'txeneka que vence amanha: aviso');
    ok(!find(d, 'debt_due:' + dez.id) && !find(d, 'debt_due:' + paga.id), 'txeneka a 10 dias e txeneka paga: fora do sino');
    const sd = find(d, 'shift_difference:' + closing.id);
    ok(sd?.level === 'warning' && sd.params.difference === -5000 && sd.params.cashier === ctx.cashier.name && sd.link.endsWith('date=' + day(-1)), 'fecho com 50 MT a menos ontem: aviso com caixista e link do dia', sd);
    ok(find(d, 'cashier_locked:' + ctx.cashier.id)?.level === 'critical', 'caixista bloqueado (3 contagens erradas): critico');
    ok(d.items.some((i) => i.type === 'goal_reached' && i.level === 'success'), 'meta de 1 MT com uma venda: meta atingida');
    const dc = d.items.find((i) => i.type === 'day_closed');
    ok(dc && dc.params.sales >= 1 && dc.params.revenue >= 10000, 'depois da hora de fecho (00:00) com vendas: dia fechado', dc);
    const lastCrit = d.items.map((i) => i.level).lastIndexOf('critical');
    ok(d.items.slice(0, lastCrit + 1).every((i) => i.level === 'critical'), 'criticos primeiro');

    // Isolamento e papeis.
    ok((await client(signAccessToken(ctx.cashier)).req('GET', '/api/owner/notifications')).status === 403, 'caixista: 403');
    ok((await client(signAccessToken(ctx.cashier, { scope: 'pos' })).req('GET', '/api/owner/notifications')).status === 403, 'caixista no terminal (pos): 403');
    ok((await client().req('GET', '/api/owner/notifications')).status === 401, 'sem sessao: 401');
    const sup = await client(signAccessToken(ctx.owner, { scope: 'support' })).req('GET', '/api/owner/notifications');
    ok(sup.status === 200 && sup.data.count === d.count, 'modo suporte (so leitura) ve o mesmo sino', sup.status);
    const own = await prisma.runWithTenant(t, () => loadOwnerNotifications(t));
    ok(own.length === d.count, 'contraprova: no contexto desta loja o mesmo calculo ve tudo', [own.length, d.count]);
    const foreign = await prisma.runWithTenant(crypto.randomUUID(), () => loadOwnerNotifications(t));
    ok(foreign.length === 0, 'no contexto de outra loja nao aparece nada desta (RLS)', foreign.length);

    // Resolver a situacao tira o alerta.
    await prisma.product.update({ where: { id: crit.id }, data: { stock_qty: 50 } });
    const pay = await owner.req('POST', '/api/owner/debts/' + amanha.id + '/payment', { amount: 100000 });
    ok(pay.status === 200, 'pagar a txeneka toda: 200', pay.status);
    ok((await owner.req('POST', '/api/owner/cashiers/' + ctx.cashier.id + '/unlock')).status === 200, 'dono desbloqueia o caixista');
    const after = (await owner.req('GET', '/api/owner/notifications')).data;
    ok(!find(after, 'stock_low:' + crit.id) && !find(after, 'debt_due:' + amanha.id) && !find(after, 'cashier_locked:' + ctx.cashier.id), 'stock reposto, txeneka paga e caixista desbloqueado saem do sino');
    ok(after.count === d.count - 3, 'o total desce 3', [d.count, after.count]);
  } finally {
    await prisma.auditLog.deleteMany({ where: { id: { in: fails } } });
    await prisma.tenant.update({ where: { id: t }, data: { closing_time: null } });
  }
}

// ---------------------------------------------------------------------------
async function test32() {
  section(32, 'Bloqueio do painel do dono: PIN pessoal, 423 sem desbloqueio, 5 erros = sessao terminada (Fase 12.4)');
  const jwt = require('jsonwebtoken');
  const t = ctx.tenant.id;
  const LOCK_PIN = '1357';
  const withUnlock = (c) => c.jar.has('genesis_unlock');
  // Terminal emparelhado ANTES do PIN: com o painel bloqueado nem o codigo se gera.
  const term = await cashierTerminal();
  try {
    const before = ownerClient();
    ok((await before.req('GET', '/api/owner/notifications')).status === 200, 'sem PIN criado: o painel nao bloqueia (contas antigas continuam a funcionar)');
    const me0 = await before.req('GET', '/api/auth/me');
    ok(me0.data?.user?.lock?.has_pin === false && me0.data.user.lock.unlocked === true, '/me diz has_pin=false', me0.data?.user?.lock);
    ok(!JSON.stringify(me0.data).includes('lock_pin_hash') && !JSON.stringify(me0.data).includes('password_hash'), '/me nao devolve hashes');

    const set = await before.req('PUT', '/api/lock/pin', { pin: LOCK_PIN });
    ok(set.status === 200 && withUnlock(before), 'criar o PIN: 200 e o painel fica desbloqueado neste browser', set);
    ok((await before.req('GET', '/api/owner/notifications')).status === 200, 'com o cookie de desbloqueio: 200');
    const raw = await fetch(BASE + '/api/lock/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'token=' + signAccessToken(ctx.owner) }, body: JSON.stringify({ pin: LOCK_PIN }) });
    const sc = (raw.headers.getSetCookie ? raw.headers.getSetCookie() : []).find((c) => c.startsWith('genesis_unlock='));
    ok(raw.status === 200 && sc && /HttpOnly/i.test(sc) && !/Max-Age|Expires/i.test(sc), 'cookie de desbloqueio: httpOnly e de SESSAO (morre ao fechar a app)', sc);

    const other = ownerClient();
    const locked = await other.req('GET', '/api/owner/notifications');
    ok(locked.status === 423 && locked.data?.code === 'PANEL_LOCKED', 'outro browser com a sessao (cookie roubado/telemovel reaberto): 423 PANEL_LOCKED', locked);
    ok((await other.req('GET', '/api/products')).status === 423, 'produtos tambem bloqueados');
    ok((await other.req('GET', '/api/sales')).status === 423, 'vendas tambem bloqueadas');
    const me1 = await other.req('GET', '/api/auth/me');
    ok(me1.status === 200 && me1.data.user.lock.has_pin === true && me1.data.user.lock.unlocked === false, '/me (sempre aberto) diz que esta bloqueado', me1.data?.user?.lock);
    const wrong = await other.req('POST', '/api/lock/unlock', { pin: '0000' });
    ok(wrong.status === 403 && wrong.data?.code === 'INVALID_LOCK_PIN' && wrong.data.remaining === 4, 'PIN errado: 403 com 4 tentativas restantes', wrong);
    const right = await other.req('POST', '/api/lock/unlock', { pin: LOCK_PIN });
    ok(right.status === 200 && (await other.req('GET', '/api/owner/notifications')).status === 200, 'PIN certo: desbloqueia');

    // 5 minutos sem pedidos: o token expira. Cookie forjado: recusado.
    const { passwordVersion } = require('../src/utils/tokens');
    const expired = jwt.sign({ u: ctx.owner.id, pv: passwordVersion(ctx.owner.password_hash), lk: 'x', exp: Math.floor(Date.now() / 1000) - 5 }, process.env.JWT_SECRET + ':unlock');
    const exp = client(signAccessToken(ctx.owner)); exp.jar.set('genesis_unlock', expired);
    ok((await exp.req('GET', '/api/owner/notifications')).status === 423, 'desbloqueio expirado (5 min parado): 423');
    const forged = client(signAccessToken(ctx.owner)); forged.jar.set('genesis_unlock', jwt.sign({ u: ctx.owner.id }, 'outro-segredo'));
    ok((await forged.req('GET', '/api/owner/notifications')).status === 423, 'cookie de desbloqueio forjado: 423');

    // Mudar o PIN pede a senha e invalida os desbloqueios antigos.
    ok((await other.req('PUT', '/api/lock/pin', { pin: '2468' })).data?.code === 'INVALID_PASSWORD', 'mudar o PIN sem a senha: recusado');
    const change = await other.req('PUT', '/api/lock/pin', { pin: '2468', password: OWNER_PW });
    ok(change.status === 200, 'mudar o PIN com a senha: 200', change);
    ok((await before.req('GET', '/api/owner/notifications')).status === 423, 'o desbloqueio do PIN antigo deixa de valer');

    // Caixista e modo suporte nao sao afectados.
    ok((await term.req('GET', '/api/pos/shift')).status === 200, 'caixista no terminal: nao afectado');
    ok((await client(signAccessToken(ctx.owner, { scope: 'support' })).req('GET', '/api/owner/notifications')).status === 200, 'modo suporte (so leitura): nao afectado');

    // Entrar com a senha desbloqueia logo.
    const login = client();
    const li = await login.req('POST', '/api/auth/login', { email: ctx.owner.email, password: OWNER_PW });
    ok(li.status === 200 && withUnlock(login) && (await login.req('GET', '/api/owner/notifications')).status === 200, 'login com email e senha: painel aberto sem pedir o PIN', li.status);

    // Face ID: so de origens da lista; sem chave registada, 404.
    const fid = await login.req('POST', '/api/lock/passkey/options', undefined, { Origin: 'http://localhost:5180' });
    ok(fid.status === 404 && fid.data?.code === 'NO_PASSKEY', 'Face ID sem chave registada: 404 NO_PASSKEY', fid);
    const reg = await login.req('POST', '/api/lock/passkey/register-options', undefined, { Origin: 'http://localhost:5180' });
    ok(reg.status === 200 && reg.data?.rp?.id === 'localhost' && reg.data.challenge, 'registar Face ID (desbloqueado): opcoes com rp.id = dominio', reg.data?.rp);
    const bad = await login.req('POST', '/api/lock/passkey/register-options', undefined, { Origin: 'https://site-falso.example' });
    ok(bad.status === 400 && bad.data?.code === 'WEBAUTHN_ORIGIN', 'origem fora da lista: 400', bad);
    ok((await before.req('POST', '/api/lock/passkey/register-options', undefined, { Origin: 'http://localhost:5180' })).status === 423, 'registar Face ID com o painel bloqueado: 423');

    // RLS da tabela nova.
    await prisma.webAuthnCredential.create({ data: { id: 'teste-' + crypto.randomUUID(), user_id: ctx.owner.id, tenant_id: t, public_key: 'x' } });
    const mine = await prisma.runWithTenant(t, () => prisma.webAuthnCredential.count({ where: { user_id: ctx.owner.id } }));
    const theirs = await prisma.runWithTenant(crypto.randomUUID(), () => prisma.webAuthnCredential.count({ where: { user_id: ctx.owner.id } }));
    ok(mine === 1 && theirs === 0, 'RLS: a chave so se ve no contexto desta loja', [mine, theirs]);

    // 5 erros terminam a sessao.
    const att = ownerClient();
    let last;
    // Ja houve 1 erro acima: o 5.o erro na janela de 15 min termina a sessao.
    for (let i = 0; i < 5; i++) { last = await att.req('POST', '/api/lock/unlock', { pin: '9999' }); if (last.status === 401) break; }
    ok(last.status === 401 && last.data?.code === 'LOCK_TOO_MANY' && !att.jar.has('token') && !att.jar.has('refreshToken'), '5 PINs errados: 401 LOCK_TOO_MANY e os cookies da sessao sao apagados', last);
    const again = await ownerClient().req('POST', '/api/lock/unlock', { pin: '2468' });
    ok(again.status === 401 && again.data?.code === 'LOCK_TOO_MANY', 'durante 15 min nem o PIN certo desbloqueia (so email e senha)', again);
    const audits = await prisma.auditLog.count({ where: { tenant_id: t, action: 'PANEL_UNLOCK_FAIL' } });
    ok(audits === 5, 'as 5 falhas ficam gravadas na auditoria', audits);
  } finally {
    await prisma.user.update({ where: { id: ctx.owner.id }, data: { lock_pin_hash: null } });
    await prisma.webAuthnCredential.deleteMany({ where: { tenant_id: t } });
    require('../src/utils/sessionUser').invalidateSessionUser();
    // O servidor guarda a conta em memoria uns segundos: esperar que esqueca o PIN apagado aqui.
    await sleep(Number(process.env.SESSION_USER_CACHE_MS || 5000) + 1500);
  }
}

// ---------------------------------------------------------------------------
async function test33() {
  section(33, 'Visao geral do dono: hoje vs ontem a mesma hora, meta, turno de cada caixista, ultimas vendas (Fase 13)');
  const { ownerOverview } = require('../src/services/overview');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  const extra = await prisma.user.create({ data: {
    tenant_id: t, role: 'cashier', name: 'Zara Teste', email: 'zara-' + crypto.randomUUID() + '@teste.local',
    password_hash: await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10), pin_hash: await bcrypt.hash('1111', 10), is_active: true } });
  const made = [];
  try {
    const before = await owner.req('GET', '/api/owner/overview');
    ok(before.status === 200 && before.data?.today && before.data.month && Array.isArray(before.data.cashiers) && Array.isArray(before.data.recent_sales), 'dono: 200 com hoje, mes, caixistas e ultimas vendas', before.status);
    const zara0 = before.data.cashiers.find((c) => c.id === extra.id);
    ok(zara0?.state === 'not_started', 'caixista sem actividade hoje: «ainda nao abriu» (laranja)', zara0);

    // Venda de hoje: entra no total, no numero de vendas e nas ultimas vendas.
    const term = await cashierTerminal();
    const sale = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID() }));
    ok(sale.status === 201, 'venda de 100 MT no terminal', sale.status);
    if (sale.data?.id) made.push(sale.data.id);
    const after = (await owner.req('GET', '/api/owner/overview')).data;
    ok(after.today.revenue === before.data.today.revenue + 10000 && after.today.sales_count === before.data.today.sales_count + 1, 'hoje: +100 MT e +1 venda', [before.data.today.revenue, after.today.revenue]);
    ok(after.today.gross_profit === before.data.today.gross_profit + 4000, 'lucro bruto de hoje: +40 MT (100 - 60 de custo)', [before.data.today.gross_profit, after.today.gross_profit]);
    // O servidor trabalha na hora de Maputo (index.js: TZ); este processo pode estar noutra.
    ok(after.today.by_hour.length === ((new Date().getUTCHours() + 2) % 24) + 1 && after.today.by_hour.reduce((s, h) => s + h.revenue, 0) === after.today.revenue, 'grafico por hora soma o total de hoje', { horas: after.today.by_hour.length, agora: new Date().getHours(), soma: after.today.by_hour.reduce((s, h) => s + h.revenue, 0), hoje: after.today.revenue });
    ok(after.recent_sales[0]?.id === sale.data?.id && after.recent_sales.length <= 5 && after.recent_sales[0].cashier === ctx.cashier.name, 'a venda e a 1.a das ultimas vendas, com o nome do caixista', after.recent_sales[0]);
    const carlos = after.cashiers.find((c) => c.id === ctx.cashier.id);
    ok(carlos?.state === 'working' && carlos.today_sales >= 1, 'caixista que entrou e vendeu hoje: «a trabalhar» (verde)', carlos);
    ok(after.month.revenue >= after.today.revenue && after.month.by_day.length === new Date().getDate(), 'mes: acumulado inclui hoje e tem um ponto por dia');
    const acc = after.month.by_day[after.month.by_day.length - 1].accumulated;
    ok(acc === after.month.revenue, 'acumulado do ultimo dia = receita do mes', [acc, after.month.revenue]);

    // Ontem a mesma hora: uma venda de ontem 1 h antes desta hora conta; depois desta hora nao.
    const y1 = new Date(Date.now() - 86400000 - 3600000);
    const y2 = new Date(Date.now() - 86400000 + 3600000);
    for (const [when, amount] of [[y1, 5000], [y2, 70000]]) {
      // Noutro caixista: no turno aberto do Carlos, uma venda de ontem fazia o fecho contar como de ontem (turno 24/24).
      const s = await prisma.sale.create({ data: { tenant_id: t, cashier_user_id: extra.id, total_amount: amount, total_cost: 0, payment_method: 'cash', amount_received: amount, change_given: 0, status: 'completed', daily_number: 900 + made.length, created_at: when } });
      made.push(s.id);
    }
    const cmp = (await owner.req('GET', '/api/owner/overview')).data;
    const sameDay = y1.getDate() === new Date(Date.now() - 86400000).getDate() && y2.getDate() === y1.getDate();
    if (sameDay) ok(cmp.today.yesterday_same_time - after.today.yesterday_same_time === 5000, 'ontem «a mesma hora» conta so ate esta hora (5 000 sim, 70 000 depois nao)', [after.today.yesterday_same_time, cmp.today.yesterday_same_time]);
    else ok(true, 'ontem a mesma hora: perto da meia-noite, verificacao saltada');

    // Meta: percentagem, quanto falta, projeccao.
    const g = await owner.req('POST', '/api/owner/goals', { target_amount: cmp.month.revenue * 4 || 100000 });
    ok(g.status === 200 || g.status === 201, 'meta definida', g.status);
    const m = (await owner.req('GET', '/api/owner/overview')).data.month;
    ok(m.has_goal && Math.abs(m.pct - 25) <= 0.1 && m.remaining === m.target - m.revenue, 'meta: 25% e quanto falta certo', m);

    // Fecho de turno: cinzento; com dinheiro a menos: vermelho.
    const close = await term.req('POST', '/api/pos/shift/close', { declared_amount: 999999 });
    ok(close.status === 200 || close.status === 201, 'caixista fecha o turno (contou a mais)', close);
    const closed = (await owner.req('GET', '/api/owner/overview')).data.cashiers.find((c) => c.id === ctx.cashier.id);
    ok(closed?.state === 'closed', 'turno fechado hoje: «turno fechado» (cinzento)', closed);
    const short = await prisma.shiftClosing.findFirst({ where: { tenant_id: t, cashier_user_id: ctx.cashier.id }, orderBy: { closed_at: 'desc' } });
    await prisma.shiftClosing.update({ where: { id: short.id }, data: { difference: -2500 } });
    const red = (await owner.req('GET', '/api/owner/overview')).data.cashiers.find((c) => c.id === ctx.cashier.id);
    ok(red?.state === 'short' && red.last_closing_difference === -2500, 'fechou hoje com 25 MT a menos: vermelho (problema)', red);
    await prisma.shiftClosing.update({ where: { id: short.id }, data: { difference: short.difference } });

    // Papeis e isolamento.
    ok((await client(signAccessToken(ctx.cashier)).req('GET', '/api/owner/overview')).status === 403, 'caixista: 403');
    ok((await client(signAccessToken(ctx.cashier, { scope: 'pos' })).req('GET', '/api/owner/overview')).status === 403, 'caixista no terminal: 403');
    ok((await client(signAccessToken(ctx.owner, { scope: 'support' })).req('GET', '/api/owner/overview')).status === 200, 'modo suporte (so leitura): 200');
    const foreign = await prisma.runWithTenant(crypto.randomUUID(), () => ownerOverview(t));
    ok(foreign.today.sales_count === 0 && foreign.cashiers.length === 0 && foreign.recent_sales.length === 0, 'no contexto de outra loja nao se ve nada desta (RLS)', foreign.today);
    const mine = await prisma.runWithTenant(t, () => ownerOverview(t));
    ok(mine.today.sales_count >= 1 && mine.cashiers.length >= 2, 'contraprova: no contexto desta loja ve-se tudo');
  } finally {
    await prisma.saleItem.deleteMany({ where: { sale_id: { in: made } } });
    await prisma.sale.deleteMany({ where: { id: { in: made } } });
    await prisma.auditLog.deleteMany({ where: { user_id: extra.id } });
    await prisma.user.delete({ where: { id: extra.id } });
  }
}

// ---------------------------------------------------------------------------
async function test34() {
  section(34, 'Recibo: logotipo, NUIT, mensagem final; o terminal recebe-os (Fase 15.1)');
  const owner = ownerClient();
  const t = ctx.tenant.id;
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  try {
    const st = await owner.req('PUT', '/api/settings/store', { nuit: '400123456', receipt_footer: 'Volte sempre!' });
    ok(st.status === 200, 'NUIT e mensagem do recibo guardados', st);
    ok((await owner.req('PUT', '/api/settings/store', { nuit: '1234' })).status === 400, 'NUIT com menos de 9 dígitos: 400');
    ok((await owner.req('PUT', '/api/settings/store', { receipt_footer: 'x'.repeat(161) })).status === 400, 'mensagem com mais de 160 caracteres: 400');
    const lg = await owner.req('PUT', '/api/settings/logo', { logo: PNG });
    ok(lg.status === 200 && lg.data.has_logo === true, 'logotipo PNG guardado', lg);
    ok((await owner.req('PUT', '/api/settings/logo', { logo: 'data:text/html;base64,PHNjcmlwdD4=' })).data?.code === 'INVALID_LOGO', 'HTML disfarçado de imagem: recusado');
    ok((await owner.req('PUT', '/api/settings/logo', { logo: 'javascript:alert(1)' })).status === 400, 'endereço javascript: recusado');
    const big = 'data:image/png;base64,' + 'A'.repeat(450 * 1024);
    ok((await owner.req('PUT', '/api/settings/logo', { logo: big })).data?.code === 'LOGO_TOO_LARGE', 'logotipo acima de 300 KB: 413');
    const g = (await owner.req('GET', '/api/settings')).data;
    ok(g.store.nuit === '400123456' && g.store.receipt_footer === 'Volte sempre!' && g.store.has_logo === true && !JSON.stringify(g).includes('iVBORw0'), 'Definições: NUIT, mensagem e has_logo, sem a imagem (não pesa)');
    const r = (await owner.req('GET', '/api/settings/receipt')).data;
    ok(r.logo === PNG && r.nuit === '400123456', 'dados do recibo para reimprimir: com o logotipo');
    const term = await cashierTerminal();
    const info = (await term.req('GET', '/api/pos/terminal')).data;
    ok(info.store.logo === PNG && info.store.nuit === '400123456' && info.store.receipt_footer === 'Volte sempre!' && 'phone' in info.store, 'o terminal recebe logotipo, NUIT, telefone e mensagem (ficam para usar sem rede)', info.store && { ...info.store, logo: Boolean(info.store.logo) });
    ok((await client(signAccessToken(ctx.cashier, { scope: 'pos' })).req('PUT', '/api/settings/logo', { logo: PNG })).status === 403, 'caixista não muda o logotipo');
    ok((await client(signAccessToken(ctx.owner, { scope: 'support' })).req('PUT', '/api/settings/logo', { logo: null })).status === 403, 'modo suporte não muda o logotipo');
    ok((await owner.req('PUT', '/api/settings/logo', { logo: null })).data?.has_logo === false, 'remover o logotipo');
    const audits = await prisma.auditLog.count({ where: { tenant_id: t, action: { in: ['UPDATE_LOGO', 'REMOVE_LOGO'] } } });
    ok(audits >= 2, 'trocas de logotipo ficam na auditoria', audits);
  } finally {
    await prisma.tenant.update({ where: { id: t }, data: { logo_data: null, nuit: null, receipt_footer: null } });
  }
}

// ---------------------------------------------------------------------------
async function test35() {
  section(35, 'Impostos: IVA 16% incluido (isentos a 0), ISPC por escalao e INSS do patrao no lucro (Fase 15.2)');
  await unlockCashier();
  const owner = ownerClient();
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  const t = ctx.tenant.id;
  const now = new Date();
  const ym = 'year=' + now.getFullYear() + '&month=' + (now.getMonth() + 1);
  try {
    ok((await owner.req('PUT', '/api/settings/taxes', { vat_mode: 'xyz' })).status === 400, 'regime inventado: 400');
    ok((await owner.req('PUT', '/api/settings/taxes', { inss_employer_pct: 31 })).status === 400, 'INSS acima de 30%: 400');
    ok((await caixa.req('PUT', '/api/settings/taxes', { vat_mode: 'iva' })).status === 403, 'caixista nao muda os impostos');
    ok((await owner.req('PUT', '/api/settings/taxes', { vat_mode: 'iva' })).status === 200, 'dono escolhe o IVA');
    ok((await owner.req('GET', '/api/settings')).data?.taxes?.vat_mode === 'iva', 'definicoes mostram o regime');
    const arroz = await prisma.product.create({ data: { tenant_id: t, name: 'Arroz Teste', category: 'Mercearia', sell_price: 5000, cost_price: 4000, stock_qty: 20, is_active: true } });
    const pa = await owner.req('PATCH', '/api/products/' + arroz.id, { vat_rate: 0 });
    ok(pa.status === 200 && (await prisma.product.findUnique({ where: { id: arroz.id } })).vat_rate === 0, 'produto marcado como isento (0%)', pa);
    ok((await owner.req('PATCH', '/api/products/' + arroz.id, { vat_rate: 5 })).status === 400, 'taxa inventada (5%): 400');
    const term = await cashierTerminal();
    ok((await term.req('GET', '/api/pos/terminal')).data?.store?.vat_mode === 'iva', 'o terminal sabe que a loja cobra IVA');
    // 100 MT (16%) + 50 MT (isento), desconto de 15 MT repartido 10/5: IVA = 90 x 16/116 = 12,41 MT.
    const sale = await caixa.req('POST', '/api/sales', {
      items: [{ product_id: ctx.product.id, quantity: 1, unit_sell_price: 10000, unit_cost_price: 6000 }, { product_id: arroz.id, quantity: 1, unit_sell_price: 5000, unit_cost_price: 4000 }],
      discount_amount: 1500, total_amount: 13500, payment_method: 'cash', amount_received: 13500 });
    ok(sale.status === 201 && sale.data.vat_amount === 1241, 'venda com IVA: 12,41 MT incluidos (depois do desconto, arroz isento)', sale);
    const items = await prisma.saleItem.findMany({ where: { sale_id: sale.data.id } });
    ok(items.find((i) => i.product_id === ctx.product.id)?.vat_rate === 16 && items.find((i) => i.product_id === arroz.id)?.vat_rate === 0, 'cada linha guarda a taxa do momento (16 e 0)');
    const m = (await owner.req('GET', '/api/owner/reports/monthly?' + ym)).data;
    ok(m.taxes?.vat_mode === 'iva' && m.vat.collected >= 1241 && m.deductions.total_vat_due === m.vat.due && m.vat.due === Math.max(0, m.vat.collected - m.vat.on_cost), 'mensal: IVA cobrado, no custo e a entregar', m.vat);
    ok(m.net_profit === m.gross_profit - m.deductions.operating_expenses && m.deductions.operating_expenses >= m.deductions.total_taxes, 'o IVA a entregar desconta no lucro liquido', m.deductions);
    ok((await owner.req('PUT', '/api/settings/taxes', { vat_mode: 'ispc' })).status === 200, 'dono muda para ISPC');
    const s2 = await caixa.req('POST', '/api/sales', saleBody());
    ok(s2.status === 201 && s2.data.vat_amount === 0, 'com ISPC a venda nao leva IVA', s2.data);
    const m2 = (await owner.req('GET', '/api/owner/reports/monthly?' + ym)).data;
    ok([3, 4, 5].includes(m2.taxes?.ispc?.pct) && m2.deductions.total_ispc === Math.round((m2.gross_revenue * m2.taxes.ispc.pct) / 100) && m2.deductions.total_vat_due === 0, 'mensal: ISPC estimado pelo escalao e sem IVA', m2.taxes);
    await prisma.employee.create({ data: { tenant_id: t, name: 'Trabalhador INSS', role: 'Ajudante', monthly_salary: 1000000, is_active: true } });
    const salaries = (await prisma.employee.findMany({ where: { tenant_id: t, is_active: true } })).reduce((a, e) => a + e.monthly_salary, 0);
    await owner.req('PUT', '/api/settings/taxes', { inss_employer_pct: 4 });
    const m3 = (await owner.req('GET', '/api/owner/reports/monthly?' + ym)).data;
    ok(salaries >= 1000000 && m3.deductions.total_inss === Math.round((salaries * 4) / 100) && m3.taxes.inss_employer_pct === 4, 'INSS do patrao: 4% dos salarios no lucro', { salaries, inss: m3.deductions.total_inss });
    ok((await prisma.auditLog.count({ where: { tenant_id: t, action: 'UPDATE_TAXES' } })) >= 3, 'mudancas de impostos na auditoria');
  } finally {
    await prisma.tenant.update({ where: { id: t }, data: { vat_mode: 'none', inss_employer_pct: 0 } });
  }
}

// ---------------------------------------------------------------------------
async function test36() {
  section(36, 'Multas (com quem as passou) e taxas anuais do municipio (1/12 por mes) no lucro (Fase 15.3)');
  const owner = ownerClient();
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  const now = new Date();
  const day = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const ym = 'year=' + now.getFullYear() + '&month=' + (now.getMonth() + 1);
  const m0 = (await owner.req('GET', '/api/owner/reports/monthly?' + ym)).data;
  const noEntity = await owner.req('POST', '/api/settings/expenses', { date: day, kind: 'fine', amount: 250000 });
  ok(noEntity.status === 400, 'multa sem quem a passou: 400', noEntity);
  const fine = await owner.req('POST', '/api/settings/expenses', { date: day, kind: 'fine', entity: 'Conselho Municipal', description: 'Licença fora do prazo', amount: 250000 });
  ok(fine.status === 201 && fine.data.kind === 'fine' && fine.data.category === 'Multa' && fine.data.entity === 'Conselho Municipal', 'multa gravada: tipo, categoria «Multa» e entidade', fine.data);
  ok((await caixa.req('POST', '/api/settings/expenses', { date: day, kind: 'fine', entity: 'X', amount: 1 })).status === 403, 'caixista nao regista multas');
  const tax = await owner.req('POST', '/api/settings/fixed-costs', { description: 'Licença de actividade', amount: 1200000, type: 'municipal', period: 'annual' });
  ok(tax.status === 201 && tax.data.period === 'annual', 'taxa anual do municipio registada', tax.data);
  ok((await owner.req('POST', '/api/settings/fixed-costs', { description: 'X', amount: 100, type: 'rent', period: 'semanal' })).status === 400, 'periodo inventado: 400');
  const m1 = (await owner.req('GET', '/api/owner/reports/monthly?' + ym)).data;
  ok(m1.deductions.total_fines === (m0.deductions.total_fines || 0) + 250000 && m1.fines.some((f) => f.entity === 'Conselho Municipal'), 'mensal: linha «Multas» com a multa e quem a passou', m1.deductions);
  ok(m1.deductions.total_other_fixed === m0.deductions.total_other_fixed + 100000, 'taxa anual de 12 000 MT conta 1 000 MT no mes', { antes: m0.deductions.total_other_fixed, depois: m1.deductions.total_other_fixed });
  ok(m1.net_profit === m0.net_profit - 250000 - 100000, 'lucro liquido desce exactamente multa + 1/12 da taxa', { antes: m0.net_profit, depois: m1.net_profit });
  ok(!m1.expenses.by_category.some((c) => c.category === 'Multa'), 'multas nao se misturam com as despesas avulsas por categoria');
  const tl = (await owner.req('GET', '/api/owner/reports/timeline?from=' + day + '&to=' + day + '&types=expense')).data;
  const ev = (tl.events || tl.rows || tl.items || []).find((e) => e.kind === 'fine');
  ok(ev && ev.entity === 'Conselho Municipal' && ev.amount === -250000, 'rastreio: a multa aparece com a entidade', ev || tl);
  await owner.req('DELETE', '/api/settings/expenses/' + fine.data.id);
  await owner.req('DELETE', '/api/settings/fixed-costs/' + tax.data.id);
}

// ---------------------------------------------------------------------------
async function test37() {
  section(37, 'Pagamento misto (partes + troco so do dinheiro), transferencia propria, fecho e relatorios por metodo (Fase 15.4)');
  await unlockCashier();
  const { shiftWindow } = require('../src/utils/shift');
  const owner = ownerClient();
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  const t = ctx.tenant.id;
  const now = new Date();
  const day = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const w0 = await prisma.runWithTenant(t, () => shiftWindow(t, ctx.cashier.id));
  const d0 = (await owner.req('GET', '/api/owner/reports/daily?date=' + day)).data;
  // 100 MT: 60 por M-Pesa + 40 em dinheiro; o cliente da 50 em dinheiro -> troco 10.
  const mixed = await caixa.req('POST', '/api/sales', saleBody({ payment_method: 'mixed', payments: [{ method: 'mpesa', amount: 6000 }, { method: 'cash', amount: 4000 }], amount_received: 5000 }));
  ok(mixed.status === 201, 'venda com pagamento dividido: 201', mixed);
  const sale = await prisma.sale.findUnique({ where: { id: mixed.data.id }, include: { payments: true } });
  ok(sale.payment_method === 'mixed' && sale.change_given === 1000 && sale.payments.length === 2 && sale.payments.every((x) => x.tenant_id === t), 'gravada como «mixed», troco 10 MT so do dinheiro, 2 partes da loja', { pm: sale.payment_method, troco: sale.change_given, partes: sale.payments.length });
  ok((await caixa.req('POST', '/api/sales', saleBody({ payment_method: 'mixed', payments: [{ method: 'mpesa', amount: 6000 }, { method: 'cash', amount: 3000 }] }))).data?.code === 'PAYMENTS_MISMATCH', 'partes que nao somam o total: recusado');
  ok((await caixa.req('POST', '/api/sales', saleBody({ payment_method: 'mixed', payments: [{ method: 'card', amount: 6000 }, { method: 'cash', amount: 4000 }], amount_received: 3000 }))).data?.code === 'CASH_SHORT', 'dinheiro recebido abaixo da parte em dinheiro: recusado');
  ok((await caixa.req('POST', '/api/sales', saleBody({ payment_method: 'mixed' }))).status === 400, '«mixed» sem partes: 400');
  const tr = await caixa.req('POST', '/api/sales', saleBody({ payment_method: 'transferencia' }));
  ok(tr.status === 201 && (await prisma.sale.findUnique({ where: { id: tr.data.id } })).payment_method === 'transfer', 'transferencia e um metodo proprio (antes contava como cartao)');
  const again = await caixa.req('POST', '/api/sales', saleBody({ id: mixed.data.id, payment_method: 'mixed', payments: [{ method: 'mpesa', amount: 6000 }, { method: 'cash', amount: 4000 }], amount_received: 5000 }));
  ok(again.status === 201 && again.data.id === mixed.data.id && (await prisma.salePayment.count({ where: { sale_id: mixed.data.id } })) === 2, 'repetir a mesma venda (fila sem rede): nao duplica as partes');
  const w1 = await prisma.runWithTenant(t, () => shiftWindow(t, ctx.cashier.id));
  ok(w1.expectedCash === w0.expectedCash + 4000 && (w1.totals.mpesa || 0) === (w0.totals.mpesa || 0) + 6000 && (w1.totals.transfer || 0) === (w0.totals.transfer || 0) + 10000 && !('mixed' in w1.totals), 'fecho do turno: so os 40 MT em dinheiro entram no esperado; M-Pesa e transferencia a parte', { antes: w0.totals, depois: w1.totals });
  const d1 = (await owner.req('GET', '/api/owner/reports/daily?date=' + day)).data;
  ok(d1.by_payment.mpesa === d0.by_payment.mpesa + 6000 && d1.by_payment.cash === d0.by_payment.cash + 4000 && d1.by_payment.transfer === (d0.by_payment.transfer || 0) + 10000, 'relatorio diario: cada parte no seu metodo', d1.by_payment);
  const list = (await owner.req('GET', '/api/owner/sales?method=mpesa')).data;
  ok(list.rows.some((r) => r.id === mixed.data.id && r.payments?.length === 2), 'lista de vendas filtrada por M-Pesa inclui a venda dividida, com as partes');
  // RLS: o papel da aplicacao sem loja no contexto nao ve partes nenhumas.
  const leak = await prisma.runWithTenant(crypto.randomUUID(), () => prisma.salePayment.count({ where: { sale_id: mixed.data.id } }));
  ok(leak === 0, 'RLS: outra loja nao ve as partes do pagamento', leak);
}

// ---------------------------------------------------------------------------
async function test38() {
  section(38, 'Venda ao peso: gramas inteiras, preco por kg, stock, perdas, relatorios e recibo publico (Fase 15.5)');
  await unlockCashier();
  const owner = ownerClient();
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  const t = ctx.tenant.id;
  const now = new Date();
  const day = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const created = await owner.req('POST', '/api/products', { name: 'Carne de vaca Teste', category: 'Talho', unit: 'kg', sell_price: 35000, cost_price: 25000, min_stock: 2000, lots: [{ quantity: 10000, expiry_date: null }] });
  ok(created.status === 201, 'produto ao kg criado com 10 kg (10 000 g) de stock', created);
  const pid = created.data.id;
  const p0 = await prisma.product.findUnique({ where: { id: pid } });
  ok(p0.unit === 'kg' && p0.stock_qty === 10000 && p0.min_stock === 2000, 'gravado: unidade kg, stock em gramas, minimo 2 kg', { unit: p0.unit, stock: p0.stock_qty });
  ok((await owner.req('POST', '/api/products', { name: 'X', unit: 'saco', sell_price: 1 })).status === 400, 'unidade inventada: 400');
  // 1,250 kg a 350 MT/kg = 437,50 MT.
  const sale = await caixa.req('POST', '/api/sales', { items: [{ product_id: pid, quantity: 1250, unit_sell_price: 35000, unit_cost_price: 0 }], total_amount: 43750, payment_method: 'cash', amount_received: 50000 });
  ok(sale.status === 201, 'venda de 1,250 kg por 437,50 MT: 201', sale);
  ok((await caixa.req('POST', '/api/sales', { items: [{ product_id: pid, quantity: 1250, unit_sell_price: 35000, unit_cost_price: 0 }], total_amount: 43750000, payment_method: 'cash' })).status === 400, 'total calculado como unidades (x1000): recusado');
  const row = await prisma.sale.findUnique({ where: { id: sale.data.id }, include: { items: true } });
  ok(row.total_amount === 43750 && row.total_cost === 31250 && row.change_given === 6250 && row.items[0].unit === 'kg' && row.items[0].quantity === 1250, 'venda gravada: total 437,50, custo 312,50, troco 62,50, linha em kg', { total: row.total_amount, custo: row.total_cost });
  ok((await prisma.product.findUnique({ where: { id: pid } })).stock_qty === 8750, 'stock desce 1 250 g (fica 8,75 kg)');
  ok((await caixa.req('POST', '/api/sales', { items: [{ product_id: pid, quantity: 9000, unit_sell_price: 35000, unit_cost_price: 0 }], total_amount: 315000, payment_method: 'cash' })).status === 409, 'mais peso do que ha em stock: 409');
  const term = await cashierTerminal();
  const sh = await term.req('POST', '/api/shrinkage_records', { id: crypto.randomUUID(), product_id: pid, quantity: 250, reason: 'broken' });
  ok(sh.status === 201 || sh.status === 200, 'perda de 250 g registada', sh);
  const d = (await owner.req('GET', '/api/owner/reports/daily?date=' + day)).data;
  const top = (d.top_products || []).flatMap((x) => x.items || [x]).find((x) => x.product_id === pid);
  const loss = (d.losses || []).find((l) => l.product_id === pid);
  ok(d.gross_revenue >= 43750 && loss && loss.value === 6250 && loss.unit === 'kg', 'diario: receita conta 437,50 e a perda vale 62,50 (250 g a 250 MT/kg)', { loss });
  ok(!top || (top.unit === 'kg' && top.quantity === 1.25), 'ranking: 1,25 kg (nao 1 250 unidades)', top);
  const v = (await client(null).req('GET', '/api/verify/' + sale.data.id)).data;
  ok(v.sale?.items?.[0]?.unit === 'kg' && v.sale.items[0].quantity === 1250, 'pagina publica do recibo leva a unidade (o cliente ve 1,25 kg)', v);
  const lock = await owner.req('PATCH', '/api/products/' + pid, { unit: 'un' });
  ok(lock.status === 409 && lock.data.code === 'UNIT_LOCKED', 'mudar a unidade com stock/vendas: 409 UNIT_LOCKED', lock);
  const fresh = await owner.req('POST', '/api/products', { name: 'Acucar granel Teste', category: 'Mercearia', sell_price: 9000, cost_price: 7000 });
  ok((await owner.req('PATCH', '/api/products/' + fresh.data.id, { unit: 'kg' })).status === 200 && (await prisma.product.findUnique({ where: { id: fresh.data.id } })).unit === 'kg', 'produto sem stock nem vendas: pode passar a kg');
}

// ---------------------------------------------------------------------------
async function test39() {
  section(39, 'Perfil do dono: senha, e-mail com 2 codigos, aniversario uma vez, presente de Premium e plano no admin (Fase 16)');
  const t = ctx.tenant.id;
  const original = await prisma.user.findUnique({ where: { id: ctx.owner.id }, select: { email: true, password_hash: true } });
  const owner = ownerClient();
  try {
    const p0 = await owner.req('GET', '/api/profile');
    ok(p0.status === 200 && p0.data.email === original.email && p0.data.birthday === null && p0.data.plan.plan === 'basic' && p0.data.plan.effective === 'basic', 'perfil: e-mail, sem aniversario, plano Basico', p0.data);
    ok((await client(signAccessToken(ctx.cashier, { scope: 'pos' })).req('GET', '/api/profile')).status === 403, 'caixista nao abre o perfil do dono');
    // Senha
    ok((await owner.req('PUT', '/api/profile/password', { current_password: 'errada-123', new_password: 'NovaSenha#2026' })).data?.code === 'WRONG_PASSWORD', 'senha actual errada: recusado');
    ok((await owner.req('PUT', '/api/profile/password', { current_password: OWNER_PW, new_password: 'curta' })).status === 400, 'senha nova curta: 400');
    const ch = await owner.req('PUT', '/api/profile/password', { current_password: OWNER_PW, new_password: 'NovaSenha#2026' });
    ok(ch.status === 200, 'senha mudada', ch);
    const after = await prisma.user.findUnique({ where: { id: ctx.owner.id } });
    ok(await bcrypt.compare('NovaSenha#2026', after.password_hash), 'a BD guarda a senha nova (bcrypt)');
    ok((await owner.req('GET', '/api/profile')).status === 200, 'esta sessao continua (cookies novos)');
    ok((await client(signAccessToken(ctx.owner)).req('GET', '/api/profile')).status === 401, 'sessoes antigas (senha anterior) deixam de valer');
    const me = client(signAccessToken(after));
    // E-mail: sem SMTP neste servidor de teste os codigos vem na resposta (fora de producao).
    // Conta de outra pessoa com e-mail valido (o admin de teste desta corrida).
    const other = { email: ctx.admin.email };
    const inUse = await me.req('POST', '/api/profile/email/start', { new_email: other.email, password: 'NovaSenha#2026' });
    ok(inUse.data?.code === 'EMAIL_IN_USE', 'e-mail de outra conta: 409', inUse);
    const novo = 'novo-' + crypto.randomBytes(4).toString('hex') + '@teste.local';
    const st = await me.req('POST', '/api/profile/email/start', { new_email: novo, password: 'NovaSenha#2026' });
    ok(st.status === 200 && st.data.devCodes?.current && st.data.devCodes?.next && st.data.devCodes.current !== st.data.devCodes.next, 'pedido de mudanca: um codigo para o e-mail actual e outro para o novo', st.data);
    ok((await me.req('POST', '/api/profile/email/confirm', { code_current: st.data.devCodes.next, code_new: st.data.devCodes.current })).data?.code === 'BAD_EMAIL_CODES', 'codigos trocados: recusado');
    const cf = await me.req('POST', '/api/profile/email/confirm', { code_current: st.data.devCodes.current, code_new: st.data.devCodes.next });
    ok(cf.status === 200 && (await prisma.user.findUnique({ where: { id: ctx.owner.id } })).email === novo, 'com os dois codigos: e-mail mudado', cf);
    ok((await me.req('POST', '/api/profile/email/confirm', { code_current: st.data.devCodes.current, code_new: st.data.devCodes.next })).data?.code === 'EMAIL_CHANGE_EXPIRED', 'os codigos so servem uma vez');
    // WhatsApp dos alertas
    ok((await me.req('PUT', '/api/profile/alerts-phone', { phone: '84 123 4567' })).status === 200 && (await prisma.tenant.findUnique({ where: { id: t } })).phone === '84 123 4567', 'numero do WhatsApp dos alertas guardado');
    // Aniversario: uma vez
    ok((await me.req('PUT', '/api/profile/birthday', { birthday: '2030-01-01' })).status === 400, 'data no futuro: 400');
    const bd = await me.req('PUT', '/api/profile/birthday', { birthday: '1990-03-15' });
    ok(bd.status === 200, 'aniversario definido', bd);
    ok((await me.req('PUT', '/api/profile/birthday', { birthday: '1991-04-16' })).data?.code === 'BIRTHDAY_LOCKED', 'segunda vez: bloqueado (409)');
    const today = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10); // dia de Maputo
    const notToday = today.slice(5) === '03-15' ? '1990-03-16' : '1990-03-15';
    await prisma.user.update({ where: { id: ctx.owner.id }, data: { birthday: notToday } });
    ok((await me.req('POST', '/api/profile/birthday/gift')).data?.code === 'GIFT_NOT_AVAILABLE', 'fora do dia: o presente nao se recolhe');
    // Simula o dia do aniversario (o servidor verifica o dia de Maputo).
    await prisma.user.update({ where: { id: ctx.owner.id }, data: { birthday: '1990-' + today.slice(5) } });
    await prisma.tenant.update({ where: { id: t }, data: { plan_period: 'annual' } });
    const p1 = (await me.req('GET', '/api/profile')).data;
    ok(p1.gift.available === true && p1.plan.effective === 'basic', 'no dia: presente disponivel, ainda Basico', p1.gift);
    const g = await me.req('POST', '/api/profile/birthday/gift');
    ok(g.status === 200 && g.data.rule === 'annual_now', 'anual Basico: Premium comeca hoje', g.data);
    const p2 = (await me.req('GET', '/api/profile')).data;
    const until = new Date(p2.plan.premium_until);
    ok(p2.plan.effective === 'premium' && p2.gift.claimed_this_year === true && p2.gift.available === false && until > new Date(Date.now() + 27 * 86400000) && until < new Date(Date.now() + 32 * 86400000), 'Premium ate ao mesmo dia do mes seguinte; presente recolhido', p2.plan);
    ok((await me.req('POST', '/api/profile/birthday/gift')).data?.code === 'GIFT_NOT_AVAILABLE', 'segunda recolha no mesmo ano: recusada');
    ok((await prisma.auditLog.count({ where: { tenant_id: t, action: { in: ['PASSWORD_CHANGED', 'EMAIL_CHANGED', 'BIRTHDAY_SET', 'BIRTHDAY_GIFT_CLAIMED'] } } })) >= 4, 'senha, e-mail, aniversario e presente na auditoria');
    // Plano no admin
    const admin = adminClient();
    const list = (await admin.req('GET', '/api/admin/tenants')).data;
    const row = list.find((x) => x.id === t);
    ok(row && row.plan === 'basic' && row.plan_effective === 'premium' && !('logo_data' in row), 'admin: ve o plano e o Premium em curso; a lista ja nao leva o logotipo', row && { plan: row.plan, eff: row.plan_effective });
    const pl = await admin.req('POST', '/api/admin/tenants/' + t + '/plan', { plan: 'premium', period: 'monthly' });
    ok(pl.status === 200 && (await prisma.tenant.findUnique({ where: { id: t } })).subscription_price === 1400000, 'admin muda para Premium mensal (14 000 MT)', pl);
    ok((await admin.req('POST', '/api/admin/tenants/' + t + '/plan', { plan: 'gold', period: 'monthly' })).status === 400, 'plano inventado: 400');
  } finally {
    await prisma.user.update({ where: { id: ctx.owner.id }, data: { email: original.email, password_hash: original.password_hash, birthday: null, birthday_gift_year: null } });
    await prisma.tenant.update({ where: { id: t }, data: { plan: 'basic', plan_period: 'monthly', premium_from: null, premium_until: null, subscription_price: 300000 } });
  }
}

async function test40() {
  section(40, 'Etapa A: terminais (mesmo terminal, perfis, reactivar, eliminar), taxas livres, subscricao ate, fecho recusado com detalhe, caixistas, venda personalizada, sugestoes em varios tipos');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  const admin = adminClient();
  await unlockCashier().catch(() => {});
  const other = await prisma.user.create({ data: {
    tenant_id: t, role: 'cashier', name: 'Caixa Cafetaria', email: 'cafe-' + crypto.randomBytes(4).toString('hex') + '@teste.local',
    password_hash: await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10), pin_hash: await bcrypt.hash('8642', 10), is_active: true } });
  try {
    // --- A6: terminais
    const term = await pairedTerminal('Balcao A40');
    const list0 = (await owner.req('GET', '/api/owner/terminals')).data;
    const tA = list0.find((x) => x.name === 'Balcao A40');
    ok(tA && Array.isArray(tA.member_ids) && tA.member_ids.length === 0, 'terminal novo: sem lista de perfis (= todos)', tA);
    const prof0 = (await term.req('GET', '/api/pos/terminal')).data;
    ok(prof0?.cashiers?.some((c) => c.id === other.id) && prof0.cashiers.some((c) => c.id === ctx.cashier.id), 'sem lista: aparecem todos os caixistas');
    const mem = await owner.req('PUT', '/api/owner/terminals/' + tA.id + '/members', { user_ids: [other.id] });
    ok(mem.status === 200 && mem.data.member_ids.length === 1, 'dono escolhe so a Caixa Cafetaria para este terminal', mem);
    ok((await owner.req('PUT', '/api/owner/terminals/' + tA.id + '/members', { user_ids: [ctx.owner.id] })).data?.code === 'BAD_MEMBERS', 'o dono (nao caixista) nao entra na lista: 400');
    const prof1 = (await term.req('GET', '/api/pos/terminal')).data;
    ok(prof1.cashiers.length === 1 && prof1.cashiers[0].id === other.id, 'terminal mostra so o perfil escolhido', prof1.cashiers);
    const notHere = await term.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
    ok(notHere.status === 403 && notHere.data?.code === 'NOT_ON_TERMINAL', 'caixista fora da lista nao entra neste terminal: 403', notHere);
    // RLS: a tabela nova so mostra linhas da loja do contexto.
    const otherTenant = await prisma.tenant.findFirst({ where: { id: { not: t } }, select: { id: true } });
    if (otherTenant) ok((await prisma.runWithTenant(otherTenant.id, () => prisma.posTerminalMember.count({ where: { terminal_id: tA.id } }))) === 0, 'RLS: outra loja nao ve os perfis deste terminal');
    ok((await prisma.runWithTenant(t, () => prisma.posTerminalMember.count({ where: { terminal_id: tA.id } }))) === 1, 'RLS: a propria loja ve a sua linha');
    // Novo codigo para o MESMO terminal (o browser perdeu o cookie).
    const rc = await owner.req('POST', '/api/owner/terminals/' + tA.id + '/pairing-code');
    ok(rc.status === 201 && /^\d{6}$/.test(rc.data.code), 'codigo novo para o mesmo terminal', rc);
    const lost = client();
    const re = await lost.req('POST', '/api/pos/pair', { code: rc.data.code });
    ok(re.status === 201, 'aparelho que perdeu a ligacao volta a emparelhar', re);
    const list1 = (await owner.req('GET', '/api/owner/terminals')).data;
    ok(list1.filter((x) => x.name === 'Balcao A40').length === 1 && list1.find((x) => x.id === tA.id).member_ids.length === 1, 'continua UM terminal, com os mesmos perfis');
    ok((await term.req('GET', '/api/pos/terminal')).status === 401, 'o cookie antigo desse terminal deixa de valer');
    ok((await lost.req('GET', '/api/pos/terminal')).data?.cashiers?.length === 1, 'o aparelho novo ve os mesmos perfis');
    ok((await prisma.auditLog.count({ where: { tenant_id: t, action: 'TERMINAL_REPAIRED', entity_id: tA.id } })) === 1, 'auditoria TERMINAL_REPAIRED');
    // Eliminar so revogado; reactivar.
    ok((await owner.req('DELETE', '/api/owner/terminals/' + tA.id)).data?.code === 'TERMINAL_ACTIVE', 'eliminar terminal activo: 409');
    ok((await owner.req('POST', '/api/owner/terminals/' + tA.id + '/revoke')).status === 200, 'dono revoga');
    ok((await lost.req('GET', '/api/pos/terminal')).status === 401, 'revogado: o terminal deixa de funcionar');
    ok((await owner.req('POST', '/api/owner/terminals/' + tA.id + '/reactivate')).status === 200, 'dono reactiva');
    ok((await lost.req('GET', '/api/pos/terminal')).status === 200, 'reactivado: o mesmo aparelho volta a funcionar');
    await owner.req('POST', '/api/owner/terminals/' + tA.id + '/revoke');
    const del = await owner.req('DELETE', '/api/owner/terminals/' + tA.id);
    ok(del.status === 200 && (await prisma.posTerminal.count({ where: { id: tA.id } })) === 0 && (await prisma.posTerminalMember.count({ where: { terminal_id: tA.id } })) === 0, 'revogado: eliminado, com a lista de perfis', del);

    // --- A5: taxas escritas pelo dono
    ok((await owner.req('PUT', '/api/settings/taxes', { vat_mode: 'iva', vat_rate_std: 31 })).status === 400, 'IVA 31%: 400');
    ok((await owner.req('PUT', '/api/settings/taxes', { inss_employer_pct: 31 })).status === 400, 'INSS 31%: 400');
    const tx = await owner.req('PUT', '/api/settings/taxes', { vat_mode: 'iva', vat_rate_std: 15, inss_employer_pct: 2 });
    ok(tx.status === 200, 'dono escreve IVA 15% e INSS 2%', tx);
    const s0 = (await owner.req('GET', '/api/settings')).data;
    ok(s0.taxes.vat_rate_std === 15 && s0.taxes.inss_employer_pct === 2, 'Definicoes devolvem 15% e 2%', s0.taxes);
    await prisma.product.update({ where: { id: ctx.product.id }, data: { vat_rate: null, stock_qty: 50 } });
    const sale15 = await owner.req('POST', '/api/sales', saleBody());
    ok(sale15.status === 201 && sale15.data.vat_amount === 1304, 'venda de 100 MT com IVA 15% incluido: 13,04 MT de IVA', sale15.data);
    await prisma.tenant.update({ where: { id: t }, data: { vat_mode: 'none', vat_rate_std: 16, inss_employer_pct: 0 } });

    // --- A11: venda personalizada
    const stock0 = (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty;
    const customName = 'Xarope meia dose ' + crypto.randomBytes(2).toString('hex');
    const cs = await owner.req('POST', '/api/sales', {
      items: [
        { product_id: ctx.product.id, quantity: 1, unit_sell_price: 10000, unit_cost_price: 0 },
        { custom: true, product_name: customName, quantity: 2, unit_sell_price: 7500, add_to_catalog: true },
      ],
      total_amount: 25000, payment_method: 'cash', amount_received: 25000,
    });
    ok(cs.status === 201, 'venda com artigo do catalogo + pedido personalizado (2 x 75 MT)', cs);
    const items = await prisma.saleItem.findMany({ where: { sale_id: cs.data?.id } });
    const ci = items.find((i) => i.custom);
    ok(ci && ci.product_id === null && ci.product_name === customName && ci.unit_sell_price === 7500 && ci.unit_cost_price === 0, 'personalizado gravado sem produto, com a descricao e o preco escritos', ci);
    ok((await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty === stock0 - 1, 'so o artigo do catalogo baixa o stock');
    const newP = await prisma.product.findFirst({ where: { tenant_id: t, name: customName } });
    ok(newP && newP.sell_price === 7500 && newP.stock_qty === 0 && newP.cost_price === 0, '«acrescentar ao catalogo»: produto criado com o preco, sem stock', newP);
    const aud = await prisma.auditLog.findFirst({ where: { tenant_id: t, action: 'CUSTOM_ITEM_SOLD', entity_id: cs.data?.id } });
    ok(aud && JSON.parse(aud.new_value).items[0].unit_sell_price === 7500, 'auditoria CUSTOM_ITEM_SOLD com o que foi escrito e o preco');
    ok((await owner.req('POST', '/api/sales', { items: [{ custom: true, product_name: 'Sem preco', quantity: 1, unit_sell_price: 0 }], total_amount: 0, payment_method: 'cash' })).data?.code === 'CUSTOM_ITEM_PRICE', 'personalizado sem preco: 400');
    ok((await owner.req('POST', '/api/sales', { items: [{ custom: true, quantity: 1, unit_sell_price: 500 }], total_amount: 500, payment_method: 'cash' })).status === 400, 'personalizado sem descricao: 400');
    // Desconto acima do limite continua a pedir o PIN.
    ok((await owner.req('POST', '/api/sales', { items: [{ custom: true, product_name: 'Prato do dia', quantity: 1, unit_sell_price: 10000 }], discount_amount: 5000, total_amount: 5000, payment_method: 'cash' })).data?.code === 'DISCOUNT_NEEDS_PIN', 'desconto de 50% num personalizado: pede o PIN do dono');
    const day = (await owner.req('GET', '/api/owner/reports/daily')).data;
    ok(day.top_products.some((p) => p.name === customName) || (day.by_category || []).some((c) => c.category === 'Personalizado'), 'relatorio: o personalizado aparece (categoria «Personalizado»)', day.by_category);
    const cancel = await owner.req('POST', '/api/sales/' + cs.data.id + '/cancel', { pin: PIN, reason: 'teste A11' });
    ok(cancel.status === 200 && (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock_qty === stock0, 'cancelar: repoe so o stock do artigo do catalogo', cancel);
    ok((await owner.req('PUT', '/api/settings/custom-items', { enabled: false })).status === 200, 'dono desliga a venda personalizada');
    ok((await owner.req('POST', '/api/sales', { items: [{ custom: true, product_name: 'Avulso', quantity: 1, unit_sell_price: 500 }], total_amount: 500, payment_method: 'cash' })).data?.code === 'CUSTOM_ITEMS_DISABLED', 'desligada: 403 CUSTOM_ITEMS_DISABLED');
    await owner.req('PUT', '/api/settings/custom-items', { enabled: true });

    // --- A8 + A7: fecho recusado com o escrito e o esperado; estatisticas por caixista
    const caixa = await cashierTerminal();
    const login = await caixa.req('POST', '/api/pos/login', { cashier_id: ctx.cashier.id, pin: CASHIER_PIN });
    const sold = await caixa.req('POST', '/api/sales', saleBody());
    ok(sold.status === 201, 'caixista vende 100 MT', sold.status === 201 ? undefined : { login, sold });
    const low = await caixa.req('POST', '/api/pos/shift/close', { declared_amount: 1000 });
    ok(low.status === 400 && low.data.code === 'COUNT_BELOW_EXPECTED' && low.data.expected === undefined, 'fecho abaixo do esperado: recusado e o caixista NAO ve o esperado', low.data);
    const today = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10);
    const tl = (await owner.req('GET', '/api/owner/reports/timeline?from=' + today + '&to=' + today + '&types=shift&cashier_id=' + ctx.cashier.id)).data;
    const fail = tl.rows.find((e) => e.shift_fail);
    ok(fail && fail.declared === 1000 && fail.expected >= 10000 && fail.attempt >= 1, 'rastreio do dono: «escreveu 10 MT, esperado …, tentativa n/3»', fail);
    ok(tl.totals.losses === 0 || tl.rows.every((e) => e.effect !== 'loss' || !e.shift_fail), 'tentativa recusada nao conta como perda nos totais');
    const bell = (await owner.req('GET', '/api/owner/notifications')).data;
    const bf = bell.items.find((n) => n.type === 'shift_attempt_fail');
    ok(bf && bf.params.declared === 1000 && bf.params.expected >= 10000, 'sino do dono: fecho recusado com o escrito e o esperado', bf);
    const tlOther = (await owner.req('GET', '/api/owner/reports/timeline?from=' + today + '&to=' + today + '&cashier_id=' + other.id)).data;
    ok(tlOther.rows.length === 0, 'rastreio filtrado por outro caixista: nada deste caixista');
    const exp = (await prisma.shiftClosing.findMany({ where: { tenant_id: t } })).length;
    const good = await caixa.req('POST', '/api/pos/shift/close', { declared_amount: fail ? fail.expected : 999999 });
    ok(good.data?.accepted === true && (await prisma.shiftClosing.count({ where: { tenant_id: t } })) === exp + 1, 'fecho certo aceite', good.data);
    const rep = (await owner.req('GET', '/api/owner/reports/daily')).data;
    const me = rep.by_cashier.find((c) => c.cashier_id === ctx.cashier.id);
    ok(me && me.sales >= 1 && me.items >= 1 && me.shifts >= 1 && typeof me.worked_seconds === 'number', 'relatorio por caixista: vendas, artigos, turnos e horas', me);

    // --- A9: subscricao ate uma data
    const act = await admin.req('POST', '/api/admin/tenants/' + t + '/activate');
    const until = new Date(act.data?.subscription_until);
    ok(act.status === 200 && until > new Date(Date.now() + 27 * 86400000) && until < new Date(Date.now() + 32 * 86400000), 'admin activa: activa ate daqui a 1 mes (plano mensal)', act.data);
    const act2 = await admin.req('POST', '/api/admin/tenants/' + t + '/activate', { months: 12 });
    ok(act2.status === 200 && new Date(act2.data.subscription_until) > new Date(until.getTime() + 330 * 86400000), 'renovar antes do fim soma a partir da data que havia (+12 meses)', act2.data);
    ok((await owner.req('GET', '/api/owner/tenant')).data.subscription_until, 'o painel do dono recebe a data');
    await prisma.tenant.update({ where: { id: t }, data: { subscription_until: new Date(Date.now() - 60000) } });
    await sleep(STATUS_CACHE_MS + 200);
    const blocked = await owner.req('POST', '/api/sales', saleBody());
    ok(blocked.status === 402 && blocked.data?.code === 'SUBSCRIPTION_OVERDUE', 'subscricao vencida: vender = 402 SUBSCRIPTION_OVERDUE', blocked);
    ok((await owner.req('GET', '/api/owner/reports/daily')).status === 200, 'vencida: relatorios continuam visiveis');
    await prisma.tenant.update({ where: { id: t }, data: { subscription_until: null } });

    // --- A10: sugestao aceite em varios tipos de negocio
    const sugName = 'Sumo Teste A40 ' + crypto.randomBytes(2).toString('hex');
    const { nameKey } = require('../src/utils/catalogSuggestions');
    await prisma.catalogSuggestion.create({ data: { tenant_id: t, product_id: newP.id, business_type: 'bottle_store', product_name: sugName, name_key: nameKey(sugName), category: 'Bebidas', barcode: '6001234567890', cost_price: 3000, sell_price: 5000 } });
    const groups = (await admin.req('GET', '/api/admin/catalog-suggestions')).data.groups;
    const g = groups.find((x) => x.name_key === nameKey(sugName));
    ok(g && g.barcode === '6001234567890', 'sugestao chega ao admin com o codigo de barras do estabelecimento', g);
    const acc = await admin.req('POST', '/api/admin/catalog-suggestions/accept', { business_type: 'bottle_store', name_key: nameKey(sugName), product_name: sugName, category: 'Bebidas', suggested_cost: 3000, suggested_sell: 5000, barcode: '6001234567890', also_types: ['mercearia', 'supermercado'] });
    const rows = await prisma.masterCatalog.findMany({ where: { product_name: sugName } });
    ok(acc.status === 201 && rows.length === 3 && rows.every((r) => r.barcode === '6001234567890'), 'aceite em 3 tipos de negocio de uma vez, com o codigo de barras', acc.data);
    await prisma.masterCatalog.deleteMany({ where: { product_name: sugName } });
  } finally {
    await prisma.posTerminalMember.deleteMany({ where: { tenant_id: t } });
    await prisma.tenant.update({ where: { id: t }, data: { vat_mode: 'none', vat_rate_std: 16, inss_employer_pct: 0, subscription_until: null, custom_items_enabled: true } });
    // O estado do estabelecimento fica em cache: perto da BD a seccao seguinte
    // comecava dentro desse tempo e ainda via «subscricao em atraso» (402).
    await sleep(STATUS_CACHE_MS + 200);
    // Esta seccao fecha o turno do caixista: as seguintes (42...) vendem com ele.
    await client(signAccessToken(ctx.cashier, { scope: 'pos' })).req('POST', '/api/pos/shift/open', { pin: PIN }).catch(() => {});
  }
}

async function test41() {
  section(41, 'Etapa A: «Brevemente» + «Avise-me» (lista de espera publica, so o admin ve) e e-mail unico em todo o Genesis');
  const phone = '84' + String(Date.now()).slice(-7);
  const anon = client();
  try {
    ok((await anon.req('POST', '/api/auth/request-account', { businessName: 'Restaurante Teste', ownerName: 'Dono Teste', businessType: 'restaurante', location: 'Maputo', phone, email: 'r-' + phone + '@teste.local', acceptTerms: true })).data?.code === 'MODE_COMING_SOON', 'pedido de conta de restaurante: «brevemente» (400)');
    ok((await anon.req('POST', '/api/waitlist', { business_type: 'bottle_store', name: 'Ana', phone, channel: 'whatsapp' })).status === 400, 'avise-me de um tipo que ja existe: 400');
    ok((await anon.req('POST', '/api/waitlist', { business_type: 'hotelaria', name: 'Ana', phone, channel: 'email' })).status === 400, 'avisar por e-mail sem e-mail: 400');
    const w = await anon.req('POST', '/api/waitlist', { business_type: 'hotelaria', name: 'Ana Teste', phone, email: '', channel: 'whatsapp' });
    ok(w.status === 201, 'sem sessao: fica na lista (hotelaria, WhatsApp)', w);
    const w2 = await anon.req('POST', '/api/waitlist', { business_type: 'hotelaria', name: 'Ana Teste', phone, email: 'ana-' + phone + '@teste.local', channel: 'both' });
    ok(w2.status === 201 && (await prisma.modeWaitlist.count({ where: { phone } })) === 1, 'o mesmo numero outra vez: actualiza, nao duplica');
    ok((await prisma.runWithTenant(ctx.tenant.id, () => prisma.modeWaitlist.count().catch(() => -1))) <= 0, 'a aplicacao (papel das lojas) nao ve a lista');
    ok((await ownerClient().req('GET', '/api/admin/waitlist')).status === 403, 'dono de loja nao abre a lista do admin');
    const admin = adminClient();
    const list = (await admin.req('GET', '/api/admin/waitlist')).data;
    const row = list.rows.find((r) => r.phone === phone);
    ok(row && row.channel === 'both' && row.email && list.by_type.hotelaria >= 1, 'admin ve o pedido: hotelaria, WhatsApp e e-mail', row);
    ok((await admin.req('POST', '/api/admin/waitlist/' + row.id + '/notified')).status === 200 && (await prisma.modeWaitlist.findUnique({ where: { id: row.id } })).notified_at, 'admin marca como avisado');
    ok((await admin.req('POST', '/api/admin/waitlist/' + row.id + '/notified')).status === 404, 'marcar outra vez: 404');
    // E-mail unico em todo o Genesis (com a RLS a loja so via as suas contas).
    const r = await ownerClient().req('POST', '/api/profile/email/start', { new_email: ctx.admin.email, password: OWNER_PW });
    ok(r.data?.code === 'EMAIL_IN_USE', 'perfil: e-mail de uma conta de OUTRA loja/admin = 409', r);
  } finally {
    await prisma.modeWaitlist.deleteMany({ where: { phone } });
    await prisma.auditLog.deleteMany({ where: { action: 'WAITLIST_NOTIFIED', user_id: ctx.admin.id } });
  }
}

async function test42() {
  section(42, '30/10: auditoria legivel (nomes em vez de codigos, artigos da venda), 2.a via do recibo (com PIN e sem rede), versao do PIN do dono no terminal');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  await unlockCashier().catch(() => {});
  await prisma.product.update({ where: { id: ctx.product.id }, data: { stock_qty: 50 } });
  const sale = await caixa.req('POST', '/api/sales', saleBody({ items: [{ product_id: ctx.product.id, quantity: 2, unit_sell_price: 10000, unit_cost_price: 0 }], total_amount: 20000, amount_received: 20000 }));
  ok(sale.status === 201, 'caixista vende 2 unidades', sale);
  // --- Auditoria do dono: o caixista pelo nome, nunca o codigo.
  const list = await owner.req('GET', '/api/owner/audit?period=today&group=sales&limit=20');
  const row = list.data?.items?.find((a) => a.action === 'CREATE_SALE' && a.entity_id === sale.data.id);
  ok(row && row.names && row.names[ctx.cashier.id] === ctx.cashier.name, 'venda na auditoria: o id do caixista vem com o nome', row && row.names);
  const detail = await owner.req('GET', '/api/owner/audit/' + row.id);
  const items = detail.data?.sale?.items || [];
  ok(detail.status === 200 && items.length === 1 && items[0].name === ctx.product.name && items[0].quantity === 2 && items[0].line_total === 20000, 'detalhe: o que se vendeu (produto, quantidade, total da linha)', detail.data?.sale);
  ok(detail.data.sale.cashier_name === ctx.cashier.name && detail.data.sale.total_amount === 20000, 'detalhe: caixista e total da venda', detail.data.sale);
  const adj = await owner.req('PATCH', '/api/products/' + ctx.product.id + '/stock', { delta: -1, reason: 'contagem 42' });
  ok(adj.status === 200, 'dono ajusta o stock', adj);
  const stock = (await owner.req('GET', '/api/owner/audit?period=today&group=stock&limit=20')).data?.items?.find((a) => a.action === 'STOCK_ADJUSTMENT');
  const pid = stock && (stock.new_value?.product_id || stock.old_value?.product_id);
  ok(!pid || stock.names[pid] === ctx.product.name, 'ajuste de stock: o produto pelo nome', stock && stock.names);
  // --- 2.a via: so com o PIN do dono, sempre auditada.
  const wrong = await caixa.req('POST', '/api/pos/sales/' + sale.data.id + '/reprint', { pin: '0000' });
  ok(wrong.status === 403 && wrong.data?.code === 'INVALID_AUTH_PIN', '2.a via com PIN errado: 403', wrong);
  ok((await caixa.req('POST', '/api/pos/sales/' + sale.data.id + '/reprint', {})).status === 400, '2.a via sem PIN nem marca de «sem rede»: 400');
  const okRe = await caixa.req('POST', '/api/pos/sales/' + sale.data.id + '/reprint', { pin: PIN });
  ok(okRe.status === 201, '2.a via com o PIN do dono: 201', okRe);
  const at = new Date().toISOString();
  const off = await caixa.req('POST', '/api/pos/sales/' + sale.data.id + '/reprint', { offline_at: at });
  ok(off.status === 201, '2.a via feita sem rede: o registo chega depois (201)', off);
  const logs = await prisma.auditLog.findMany({ where: { tenant_id: t, action: 'RECEIPT_REPRINTED', entity_id: sale.data.id }, orderBy: { created_at: 'asc' } });
  ok(logs.length === 2 && JSON.parse(logs[1].new_value).offline_at === at && logs.every((l) => l.user_id === ctx.cashier.id), 'auditoria: 2 registos RECEIPT_REPRINTED (um marcado «sem rede»)', logs.map((l) => l.new_value));
  const ownSale = await owner.req('POST', '/api/sales', saleBody());
  ok((await caixa.req('POST', '/api/pos/sales/' + ownSale.data.id + '/reprint', { pin: PIN })).status === 404, '2.a via de uma venda que nao e dele: 404');
  const viaGroup = (await owner.req('GET', '/api/owner/audit?period=today&group=sales&limit=50')).data?.items || [];
  ok(viaGroup.some((a) => a.action === 'RECEIPT_REPRINTED'), 'o dono ve a 2.a via no filtro «Vendas»');
  // Lista do terminal traz as partes do pagamento (para reimprimir igual).
  const mine = await caixa.req('POST', '/api/pos/sales', { pin: PIN });
  ok(mine.status === 200 && mine.data.every((s) => Array.isArray(s.payments)), 'lista do terminal: cada venda traz as partes do pagamento', mine.status);
  await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: { in: ['SALES_VIEW_PIN_FAIL'] } } });
  // --- Versao do PIN do dono no terminal (nunca o hash).
  const term = await cashierTerminal();
  const info = (await term.req('GET', '/api/pos/terminal')).data;
  const tenant = await prisma.tenant.findUnique({ where: { id: t }, select: { cancel_pin_hash: true } });
  ok(typeof info.auth_pin_v === 'string' && info.auth_pin_v.length > 0 && !JSON.stringify(info).includes(tenant.cancel_pin_hash), 'terminal recebe a versao do PIN do dono, nunca o PIN nem o hash', info.auth_pin_v);
}

async function test43() {
  section(43, 'Etapa B: terminal do guarda (papel guard, recibo conferido uma vez, recibo repetido = 409 com quem e quando, so a sua loja, RLS)');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  await unlockCashier().catch(() => {});
  // O dono cria um guarda (mesma lista da equipa, funcao «guard»).
  const cg = await owner.req('POST', '/api/owner/cashiers', { name: 'Guarda Rui', pin: '1357', role: 'guard' });
  ok(cg.status === 201 && cg.data.role === 'guard', 'dono cria um guarda com PIN', cg);
  const guardUser = await prisma.user.findUnique({ where: { id: cg.data.id } });
  try {
    ok((await owner.req('POST', '/api/owner/cashiers', { name: 'Chefe', pin: '1111', role: 'owner' })).status === 400, 'funcao invalida (owner): 400');
    const list = (await owner.req('GET', '/api/owner/cashiers')).data;
    ok(list.some((c) => c.id === guardUser.id && c.role === 'guard'), 'equipa mostra o guarda com a funcao');
    // Terminal: o guarda aparece nos perfis e entra com o PIN; sessao de ambito «guard».
    const term = await pairedTerminal('Saida A43');
    const prof = (await term.req('GET', '/api/pos/terminal')).data;
    ok(prof.cashiers.some((c) => c.id === guardUser.id && c.role === 'guard'), 'terminal mostra o perfil do guarda');
    const login = await term.req('POST', '/api/pos/login', { cashier_id: guardUser.id, pin: '1357' });
    ok(login.status === 200 && login.data.cashier.role === 'guard', 'guarda entra com o PIN', login);
    const guard = client(signAccessToken(guardUser, { scope: 'guard', tid: prof.terminal.id }));
    // O guarda nao vende, nao ve produtos com precos de custo nem a lista de vendas.
    ok((await guard.req('POST', '/api/sales', saleBody())).status === 403, 'guarda nao vende (403)');
    ok((await guard.req('POST', '/api/pos/sales', { pin: PIN })).status === 403, 'guarda nao abre a lista de vendas (403)');
    ok((await guard.req('GET', '/api/owner/audit')).status === 403, 'guarda nao chega ao painel do dono (403)');
    // Um caixista nao chega as rotas do guarda.
    ok((await caixa.req('GET', '/api/guard/receipt?code=' + crypto.randomUUID())).status === 403, 'caixista nao usa o leitor do guarda (403)');
    // Venda real e leitura pelo QR (endereco /verify/<id>).
    await prisma.product.update({ where: { id: ctx.product.id }, data: { stock_qty: 50 } });
    const sale = await caixa.req('POST', '/api/sales', saleBody());
    ok(sale.status === 201, 'caixista vende', sale);
    const qr = 'https://genesismz.com/verify/' + sale.data.id;
    const r1 = await guard.req('GET', '/api/guard/receipt?code=' + encodeURIComponent(qr));
    ok(r1.status === 200 && r1.data.sale.id === sale.data.id && r1.data.check === null && r1.data.sale.items[0].name === ctx.product.name, 'QR lido: mostra a venda, ainda nao conferida', r1.data);
    ok(r1.data.sale.total_cost === undefined && !JSON.stringify(r1.data).includes('unit_cost'), 'o guarda nao ve custos');
    const c1 = await guard.req('POST', '/api/guard/receipt/' + sale.data.id + '/check');
    ok(c1.status === 201 && c1.data.check.guard_name === 'Guarda Rui', 'marcar como conferido: 201', c1);
    const c2 = await guard.req('POST', '/api/guard/receipt/' + sale.data.id + '/check');
    ok(c2.status === 409 && c2.data.code === 'ALREADY_CHECKED' && c2.data.check.guard_name === 'Guarda Rui' && c2.data.check.checked_at, 'recibo lido outra vez: 409 «ja conferido» com quem e quando', c2);
    // Pelo codigo de barras (AAAAMMDD + numero do dia).
    const day = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const bc = day + String(sale.data.daily_number).padStart(4, '0');
    const r2 = await guard.req('GET', '/api/guard/receipt?code=' + bc);
    ok(r2.status === 200 && r2.data.sale.id === sale.data.id && r2.data.check, 'codigo de barras lido: mesma venda, ja conferida', r2.data);
    ok((await guard.req('GET', '/api/guard/receipt?code=abc')).status === 400, 'texto que nao e recibo: 400');
    // Venda de OUTRA loja: nao existe para este guarda.
    const otherSale = await prisma.sale.findFirst({ where: { tenant_id: { not: t } }, select: { id: true } });
    if (otherSale) {
      ok((await guard.req('GET', '/api/guard/receipt?code=' + otherSale.id)).status === 404, 'recibo de outro estabelecimento: 404');
      ok((await guard.req('POST', '/api/guard/receipt/' + otherSale.id + '/check')).status === 404, 'conferir recibo de outro estabelecimento: 404');
    }
    // Venda cancelada nao sai.
    const s2 = await caixa.req('POST', '/api/sales', saleBody());
    await owner.req('POST', '/api/sales/' + s2.data.id + '/cancel', { pin: PIN, reason: 'teste 43' });
    ok((await guard.req('POST', '/api/guard/receipt/' + s2.data.id + '/check')).data?.code === 'SALE_CANCELLED', 'venda cancelada: 409 SALE_CANCELLED');
    // Auditoria do dono e RLS.
    const logs = await prisma.auditLog.findMany({ where: { tenant_id: t, entity_id: sale.data.id, action: { in: ['RECEIPT_CHECKED', 'RECEIPT_RECHECK_ATTEMPT'] } } });
    ok(logs.filter((l) => l.action === 'RECEIPT_CHECKED').length === 1 && logs.filter((l) => l.action === 'RECEIPT_RECHECK_ATTEMPT').length === 2, 'auditoria: 1 conferido + 2 apresentacoes repetidas (marcar outra vez e ler o codigo de barras)', logs.map((l) => l.action));
    const otherTenant = await prisma.tenant.findFirst({ where: { id: { not: t } }, select: { id: true } });
    if (otherTenant) ok((await prisma.runWithTenant(otherTenant.id, () => prisma.receiptCheck.count({ where: { sale_id: sale.data.id } }))) === 0, 'RLS: outra loja nao ve a conferencia');
    ok((await prisma.runWithTenant(t, () => prisma.receiptCheck.count({ where: { sale_id: sale.data.id } }))) === 1, 'RLS: a propria loja ve a sua conferencia');
  } finally {
    await prisma.receiptCheck.deleteMany({ where: { tenant_id: t } });
  }
}

// Le um canal SSE ate `want` eventos ou `ms` milissegundos.
async function readSse(path, headers, want, ms, during) {
  const ctrl = new AbortController();
  const events = [];
  const res = await fetch(BASE + path, { headers, signal: ctrl.signal });
  if (res.status !== 200) return { status: res.status, events };
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const timer = setTimeout(() => ctrl.abort(), ms);
  const pump = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, i); buf = buf.slice(i + 2);
          const type = (block.match(/^event: (.+)$/m) || [])[1];
          const data = (block.match(/^data: (.+)$/m) || [])[1];
          if (type && data) events.push({ type, data: JSON.parse(data) });
          if (events.length >= want) { ctrl.abort(); return; }
        }
      }
    } catch { /* abortado */ }
  })();
  await new Promise((r) => setTimeout(r, 1500)); // o canal esta aberto antes de provocar o evento
  if (during) await during();
  await pump;
  clearTimeout(timer);
  return { status: 200, events };
}

async function test44() {
  section(44, 'Etapa C: localizacao do estabelecimento, canal ao vivo do dono (so a sua loja, com lucro) e do admin (mapa), mapa com vendas de hoje');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  ok((await owner.req('PUT', '/api/settings/location', { lat: 0, lng: 0 })).status === 400, 'localizacao 0,0: 400');
  ok((await owner.req('PUT', '/api/settings/location', { lat: 95, lng: 32 })).status === 400, 'latitude 95: 400');
  const link = 'https://www.google.com/maps/place/Polana/@-25.9692,32.5995,17z/data=!3m1!4b1!8m2!3d-25.969512!4d32.601144';
  const r = await owner.req('POST', '/api/settings/location/resolve', { text: link });
  ok(r.status === 200 && r.data.lat === -25.969512 && r.data.lng === 32.601144, 'link do Google Maps -> coordenadas do marcador', r.data);
  ok((await owner.req('POST', '/api/settings/location/resolve', { text: 'https://google.com.evil.example/maps/x' })).data?.code === 'LOCATION_NOT_FOUND', 'link que nao e do Google: recusado sem o abrir');
  const put = await owner.req('PUT', '/api/settings/location', { lat: r.data.lat, lng: r.data.lng, address: 'Polana' });
  ok(put.status === 200, 'dono guarda o ponto no mapa', put);
  const s = (await owner.req('GET', '/api/settings')).data;
  ok(s.geo && s.geo.lat === -25.969512 && s.geo.lng === 32.601144, 'Definicoes devolvem o ponto', s.geo);
  ok((await prisma.auditLog.count({ where: { tenant_id: t, action: 'UPDATE_LOCATION' } })) >= 1, 'auditoria: UPDATE_LOCATION');
  // Canal do dono: a venda chega com total e lucro.
  await unlockCashier().catch(() => {});
  await prisma.product.update({ where: { id: ctx.product.id }, data: { stock_qty: 50 } });
  const caixa = client(signAccessToken(ctx.cashier, { scope: 'pos' }));
  const ownerCookie = { Cookie: 'token=' + signAccessToken(ctx.owner) };
  const live = await readSse('/api/owner/live', ownerCookie, 1, 25000, () => caixa.req('POST', '/api/sales', saleBody()));
  const ev = live.events.find((e) => e.type === 'sale');
  ok(live.status === 200 && ev && ev.data.total === 10000 && ev.data.profit === 4000, 'dono recebe a venda ao vivo (100 MT, lucro 40 MT)', live);
  ok(ev && ev.data.tenant_id === undefined && ev.data.seller_user_id === undefined, 'o aviso nao leva ids internos');
  ok((await fetch(BASE + '/api/owner/live', { headers: { Cookie: 'token=' + signAccessToken(ctx.cashier, { scope: 'pos' }) } })).status === 403, 'caixista nao abre o canal do dono (403)');
  // Canal e mapa do admin.
  const adminHeaders = { Cookie: 'token=' + signAccessToken(ctx.admin), Origin: ADMIN_ORIGIN };
  const map = await adminClient().req('GET', '/api/admin/map');
  const pt = map.data?.points?.find((p) => p.id === t);
  ok(map.status === 200 && pt && pt.lat === -25.969512 && pt.today_total >= 10000, 'mapa do admin: o estabelecimento com o ponto e as vendas de hoje', pt);
  ok(!JSON.stringify(map.data).includes('total_cost') && !JSON.stringify(map.data).includes('profit'), 'mapa do admin: sem custos nem lucros');
  const adm = await readSse('/api/admin/live', adminHeaders, 1, 25000, () => caixa.req('POST', '/api/sales', saleBody()));
  const aev = adm.events.find((e) => e.type === 'sale' && e.data.tenant_id === t);
  ok(adm.status === 200 && aev && aev.data.total === 10000 && aev.data.profit === undefined, 'admin recebe a venda ao vivo (sem o lucro)', adm);
  ok((await fetch(BASE + '/api/admin/live', { headers: ownerCookie })).status === 403, 'dono nao abre o canal do admin (403)');
}

// Apaga um estabelecimento criado pela seccao 45 (e tudo o que tem dentro).
async function dropTenant(id) {
  if (!id) return;
  const saleIds = (await prisma.sale.findMany({ where: { tenant_id: id }, select: { id: true } })).map((s) => s.id);
  await prisma.salePayment.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.saleItem.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.sale.deleteMany({ where: { tenant_id: id } });
  for (const m of ['stockLot', 'stockEntry', 'productPriceHistory', 'posTerminalMember', 'posTerminal', 'catalogSuggestion', 'demandCapture', 'shrinkageRecord', 'shiftClosing']) await prisma[m].deleteMany({ where: { tenant_id: id } });
  await prisma.product.deleteMany({ where: { tenant_id: id } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ tenant_id: id }, { entity_id: id }] } });
  await prisma.membership.deleteMany({ where: { tenant_id: id } });
  await prisma.user.deleteMany({ where: { tenant_id: id } });
  await prisma.tenant.deleteMany({ where: { id } });
}

async function test45() {
  section(45, 'Etapa D: varios estabelecimentos do mesmo dono — criar, trocar, isolamento A/B, acesso de outro dono/caixista recusado, retirar acesso conta logo, painel geral');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  let bId = null; let cTenant = null;
  try {
    const list0 = await owner.req('GET', '/api/establishments');
    ok(list0.status === 200 && list0.data.length === 1 && list0.data[0].is_home && list0.data[0].is_current, 'um so estabelecimento: o de casa', list0.data);
    ok((await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + '-B', business_type: 'restaurante', location: 'Matola' })).data?.code === 'MODE_COMING_SOON', 'tipo «brevemente»: recusado');
    const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + '-B', business_type: 'mercearia', location: 'Matola' });
    ok(cb.status === 201, 'dono acrescenta o 2.o estabelecimento', cb);
    bId = cb.data.id;
    const list1 = (await owner.req('GET', '/api/establishments')).data;
    ok(list1.length === 2 && list1[0].id === t && list1[1].id === bId && !list1[1].onboarding_completed, 'lista: o de casa primeiro, o novo por configurar');
    // Trocar: cookie novo com o estabelecimento activo.
    const sw = client(signAccessToken(ctx.owner));
    const swr = await sw.req('POST', '/api/establishments/switch', { tenant_id: bId });
    ok(swr.status === 200 && sw.jar.get('token'), 'trocar para o 2.o: 200 e sessao nova', swr);
    const sB = (await sw.req('GET', '/api/settings')).data;
    ok(sB?.store?.name === ctx.tenant.name + '-B', 'depois de trocar, as Definicoes sao as do 2.o', sB?.store);
    const me = (await sw.req('GET', '/api/auth/me')).data;
    ok(me?.user?.tenant_id === bId && me.user.home_tenant_id === t && me.user.tenant?.name === ctx.tenant.name + '-B', '/api/auth/me mostra o estabelecimento activo', me?.user);
    // Isolamento: produtos e vendas de A nao aparecem em B (e vice-versa).
    const pA = (await owner.req('GET', '/api/products')).data;
    const pB0 = (await sw.req('GET', '/api/products')).data;
    ok(pA.some((p) => p.id === ctx.product.id) && Array.isArray(pB0) && pB0.length === 0, 'B nao ve os produtos de A');
    const np = await sw.req('POST', '/api/products', { name: 'Arroz B', category: 'Mercearia', sell_price: 5000, cost_price: 3000, stock_qty: 10 });
    ok(np.status === 201 || np.status === 200, 'produto criado em B', np);
    const prodB = await prisma.product.findFirst({ where: { name: 'Arroz B' } });
    ok(prodB && prodB.tenant_id === bId, 'o produto ficou em B (tenant_id da BD)', prodB && prodB.tenant_id);
    ok(!(await owner.req('GET', '/api/products')).data.some((p) => p.name === 'Arroz B'), 'A nao ve o produto de B');
    const saleB = await sw.req('POST', '/api/sales', { items: [{ product_id: prodB.id, quantity: 2, unit_sell_price: 5000, unit_cost_price: 0 }], total_amount: 10000, payment_method: 'cash', amount_received: 10000 });
    ok(saleB.status === 201, 'venda em B', saleB);
    ok((await prisma.sale.findUnique({ where: { id: saleB.data.id } })).tenant_id === bId, 'a venda ficou em B');
    const salesA = (await owner.req('GET', '/api/owner/sales?page=1&page_size=50')).data;
    ok(!JSON.stringify(salesA).includes(saleB.data.id), 'A nao ve a venda de B');
    // RLS por baixo: no contexto de A a venda de B nao existe.
    ok((await prisma.runWithTenant(t, () => prisma.sale.count({ where: { id: saleB.data.id } }))) === 0, 'RLS: no contexto de A a venda de B nao existe');
    // Rastreio de B: o dono aparece pelo nome (a conta dele e de A).
    const audB = (await sw.req('GET', '/api/owner/audit?period=today&group=sales')).data;
    const rowB = audB?.items?.find((a) => a.entity_id === saleB.data.id);
    ok(rowB && rowB.user_name === ctx.owner.name, 'rastreio de B: a venda aparece com o nome do dono', rowB && rowB.user_name);
    // Painel geral.
    await owner.req('POST', '/api/sales', saleBody());
    const sum = (await owner.req('GET', '/api/establishments/summary')).data;
    const sb = sum?.establishments?.find((e) => e.id === bId);
    ok(sum?.establishments?.length === 2 && sb && sb.today.total === 10000 && sb.today.count === 1 && sb.today.profit === 4000, 'painel geral: B com a sua venda (100 MT, lucro 40 MT)', sb && sb.today);
    ok(sum.totals.today.total >= 20000 && sum.totals.today.total === sum.establishments.reduce((s, e) => s + e.today.total, 0), 'painel geral: a soma e a soma dos estabelecimentos', sum.totals);
    // Outro dono (outra conta) nao chega a B, nem com um token forjado com act=B.
    cTenant = await prisma.tenant.create({ data: { name: ctx.tenant.name + '-C', owner_name: 'Outro', business_type: 'bottle_store', location: 'Teste', phone: '840000009', status: 'active', onboarding_completed: true } });
    const other = await prisma.user.create({ data: { tenant_id: cTenant.id, role: 'owner', name: 'Outro Dono', email: 'outro-' + crypto.randomBytes(4).toString('hex') + '@teste.local', password_hash: await bcrypt.hash(crypto.randomBytes(10).toString('hex'), 10), is_active: true } });
    const oc = client(signAccessToken(other));
    ok((await oc.req('POST', '/api/establishments/switch', { tenant_id: bId })).status === 403, 'outro dono: trocar para B = 403');
    const forged = client(signAccessToken(other, { act: bId }));
    const fr = await forged.req('GET', '/api/products');
    ok(fr.status === 403 && fr.data?.code === 'ESTABLISHMENT_FORBIDDEN', 'outro dono com token forjado act=B: 403', fr);
    const cash = client(signAccessToken(ctx.cashier, { scope: 'pos', act: bId }));
    ok((await cash.req('GET', '/api/products')).status === 403, 'caixista com act de outro estabelecimento: 403');
    ok((await client(signAccessToken(ctx.cashier, { scope: 'pos' })).req('GET', '/api/establishments')).status === 403, 'caixista nao ve os estabelecimentos do dono');
    // Retirar o acesso conta logo (cache de 5 s).
    await prisma.membership.deleteMany({ where: { tenant_id: bId } });
    await new Promise((r) => setTimeout(r, 5500));
    const after = await sw.req('GET', '/api/products');
    ok(after.status === 403, 'acesso retirado: a sessao em B deixa de funcionar', after.status);
    await prisma.user.delete({ where: { id: other.id } });
  } finally {
    await dropTenant(bId);
    await dropTenant(cTenant && cTenant.id);
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'CREATE_ESTABLISHMENT' } });
  }
}

async function test46() {
  section(46, '31/10: a conta e da pessoa — no 2.o estabelecimento o PIN do painel, «esqueci o PIN» (senha), lingua, perfil, PIN de autorizacao e Face ID funcionam');
  const t = ctx.tenant.id;
  const LOCK_PIN = '1357';
  let bId = null;
  const pinOf = async (id) => (await prisma.tenant.findUnique({ where: { id }, select: { cancel_pin_hash: true } })).cancel_pin_hash;
  // As falhas de outras seccoes (32) contam na janela de 15 min: comecar limpo.
  await prisma.auditLog.deleteMany({ where: { tenant_id: t, user_id: ctx.owner.id, action: { in: ['PANEL_UNLOCK_FAIL', 'PANEL_LOCK_SIGNED_OUT'] } } });
  try {
    const owner = ownerClient();
    ok((await owner.req('PUT', '/api/lock/pin', { pin: LOCK_PIN })).status === 200, 'PIN do painel criado no estabelecimento de casa');
    const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + '-B', business_type: 'mercearia', location: 'Matola' });
    ok(cb.status === 201, '2.o estabelecimento criado', cb);
    bId = cb.data.id;
    const b = ownerClient();
    ok((await b.req('POST', '/api/lock/unlock', { pin: LOCK_PIN })).status === 200, 'desbloquear em casa');
    ok((await b.req('POST', '/api/establishments/switch', { tenant_id: bId })).status === 200, 'trocar para o 2.o');
    const st = await b.req('GET', '/api/lock/status');
    ok(st.status === 200 && st.data.has_pin === true && st.data.unlocked === true, 'no 2.o: o painel sabe que o PIN existe (antes: 404 / «ainda nao criou o PIN»)', st);
    await b.req('POST', '/api/lock/lock');
    ok((await b.req('GET', '/api/products')).status === 423, 'no 2.o: bloqueado sem o desbloqueio');
    const wrong = await b.req('POST', '/api/lock/unlock', { pin: '0000' });
    ok(wrong.status === 403 && wrong.data?.code === 'INVALID_LOCK_PIN' && wrong.data.remaining === 4, 'no 2.o: PIN errado = 403 com as tentativas que restam', wrong);
    const failRows = await prisma.auditLog.findMany({ where: { user_id: ctx.owner.id, action: 'PANEL_UNLOCK_FAIL' }, select: { tenant_id: true } });
    ok(failRows.length === 1 && failRows[0].tenant_id === t, 'a falha fica no estabelecimento de casa (a mesma contagem em todos)', failRows);
    const right = await b.req('POST', '/api/lock/unlock', { pin: LOCK_PIN });
    ok(right.status === 200 && (await b.req('GET', '/api/products')).status === 200, 'no 2.o: o PIN certo desbloqueia (antes: «Ainda nao criou o PIN do painel»)', right);
    // Lingua e perfil: da pessoa.
    const lang = await b.req('PUT', '/api/auth/language', { language: 'en' });
    ok(lang.status === 200 && (await b.req('GET', '/api/auth/me')).data?.user?.language === 'en', 'no 2.o: mudar a lingua funciona (antes: 404)', lang);
    await b.req('PUT', '/api/auth/language', { language: 'pt' });
    const prof = await b.req('GET', '/api/profile');
    ok(prof.status === 200 && prof.data.name === ctx.owner.name && prof.data.has_lock_pin === true, 'no 2.o: o perfil abre com o nome do dono', prof);
    // PIN de autorizacao: confirmado com a senha da pessoa, guardado so no 2.o.
    const pinA = await pinOf(t);
    const ap = await b.req('PUT', '/api/settings/authorization-pin', { pin: '4321', owner_password: OWNER_PW });
    ok(ap.status === 200, 'no 2.o: definir o PIN de autorizacao com a senha do dono (antes: «senha incorrecta»)', ap);
    ok(Boolean(await pinOf(bId)) && (await pinOf(t)) === pinA, 'o PIN de autorizacao fica so no 2.o (o de casa nao muda)');
    // Face ID: as chaves sao da pessoa.
    const cred = 'teste-' + crypto.randomUUID();
    await prisma.webAuthnCredential.create({ data: { id: cred, user_id: ctx.owner.id, tenant_id: t, public_key: 'x' } });
    const fid = await b.req('POST', '/api/lock/passkey/options', undefined, { Origin: 'http://localhost:5180' });
    ok(fid.status === 200 && fid.data?.allowCredentials?.some((c) => c.id === cred), 'no 2.o: o Face ID registado em casa e encontrado', fid.status);
    // Esqueci o PIN: a senha da conta apaga-o e pede um novo.
    await b.req('POST', '/api/lock/lock');
    const fw = await b.req('POST', '/api/lock/forgot', { password: 'senha-errada-1' });
    ok(fw.status === 403 && fw.data?.code === 'INVALID_PASSWORD' && fw.data.remaining === 3, 'esqueci o PIN com a senha errada: 403 e conta como falha', fw);
    const fr = await b.req('POST', '/api/lock/forgot', { password: OWNER_PW });
    ok(fr.status === 200 && fr.data.has_pin === false, 'esqueci o PIN com a senha certa: PIN apagado', fr);
    const st2 = (await b.req('GET', '/api/lock/status')).data;
    ok(st2.has_pin === false && (await b.req('GET', '/api/products')).status === 200, 'sem PIN o painel abre (e a app pede logo um PIN novo)', st2);
    ok((await b.req('PUT', '/api/lock/pin', { pin: '2468' })).status === 200 && (await b.req('GET', '/api/lock/status')).data.has_pin === true, 'PIN novo criado sem pedir o antigo');
    ok((await prisma.auditLog.count({ where: { tenant_id: t, user_id: ctx.owner.id, action: 'PANEL_PIN_RESET' } })) === 1, 'rastreio: PANEL_PIN_RESET no estabelecimento de casa');
    // Outro dono nao reinicia o PIN deste.
    const res = await client().req('POST', '/api/lock/forgot', { password: OWNER_PW });
    ok(res.status === 401, 'sem sessao: 401');
  } finally {
    await prisma.user.update({ where: { id: ctx.owner.id }, data: { lock_pin_hash: null, language: 'pt' } });
    await prisma.webAuthnCredential.deleteMany({ where: { user_id: ctx.owner.id } });
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, user_id: ctx.owner.id, action: { in: ['PANEL_UNLOCK_FAIL', 'PANEL_LOCK_SIGNED_OUT', 'PANEL_PIN_RESET', 'PANEL_PIN_CREATED', 'PANEL_PIN_CHANGED', 'CREATE_ESTABLISHMENT'] } } });
    await dropTenant(bId);
    require('../src/utils/sessionUser').invalidateSessionUser();
    await sleep(Number(process.env.SESSION_USER_CACHE_MS || 5000) + 1500);
  }
}

async function test47() {
  section(47, '31/10: o dono nunca fica preso — trocar com o activo em teste acabado/suspenso, voltar a casa, de casa suspensa entra no outro; Rastreio e historico de custos do 2.o com o nome do dono');
  const t = ctx.tenant.id;
  let bId = null;
  const today = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10);
  const setStatus = async (id, data) => { await prisma.tenant.update({ where: { id }, data }); await sleep(STATUS_CACHE_MS + 500); };
  const before = await prisma.tenant.findUnique({ where: { id: t }, select: { status: true, trial_ends_at: true } });
  try {
    const owner = ownerClient();
    const cid = crypto.randomUUID();
    const cb = await owner.req('POST', '/api/establishments', { client_id: cid, name: ctx.tenant.name + '-B', business_type: 'mercearia', location: 'Matola' });
    ok(cb.status === 201 && cb.data.id === cid, '2.o estabelecimento criado com o id do aparelho', cb);
    bId = cb.data.id;
    const again = await owner.req('POST', '/api/establishments', { client_id: cid, name: ctx.tenant.name + '-B', business_type: 'mercearia', location: 'Matola' });
    ok(again.status === 200 && again.data.id === cid && again.data.repeated === true, 'repetir o pedido (rede caiu) devolve o mesmo, sem duplicar', again);
    ok((await prisma.membership.count({ where: { tenant_id: cid } })) === 1, 'um so estabelecimento criado');
    const nb = await prisma.tenant.findUnique({ where: { id: bId }, select: { status: true, trial_ends_at: true, subscription_until: true } });
    ok(nb.status === 'trial' && nb.subscription_until === null && nb.trial_ends_at > new Date(), 'o novo comeca em teste (nao herda «activa ate» sem pagar)', nb);
    await prisma.tenant.update({ where: { id: bId }, data: { onboarding_completed: true } });
    const b = ownerClient();
    ok((await b.req('POST', '/api/establishments/switch', { tenant_id: bId })).status === 200, 'trocar para o 2.o');
    // Nomes do dono no 2.o: produto, entrada de stock, ajuste e mudanca de custo feitos pelo dono.
    const np = await b.req('POST', '/api/products', { name: 'Feijao B', category: 'Mercearia', sell_price: 9000, cost_price: 6000, stock_qty: 5 });
    const prod = await prisma.product.findFirst({ where: { tenant_id: bId, name: 'Feijao B' } });
    ok((np.status === 201 || np.status === 200) && prod, 'produto do dono no 2.o', np);
    ok((await b.req('POST', '/api/inventory/stock', { product_id: prod.id, quantity: 10, unit_cost: 6500 })).status < 300, 'entrada de stock pelo dono no 2.o');
    ok((await b.req('PATCH', '/api/products/' + prod.id + '/stock', { delta: -1, reason: 'contagem' })).status < 300, 'ajuste de stock pelo dono no 2.o');
    const tl = await b.req('GET', '/api/owner/reports/timeline?from=' + today + '&to=' + today);
    const stockEv = tl.data?.rows?.find((e) => e.type === 'stock');
    ok(tl.status === 200 && stockEv && stockEv.who === ctx.owner.name, 'Rastreio do 2.o abre e mostra o dono pelo nome (antes: 500)', tl.status === 200 ? stockEv : tl);
    const ph = await b.req('GET', '/api/inventory/price-history?product_id=' + prod.id);
    ok(ph.status === 200 && ph.data.length >= 1 && ph.data[0].changed_by === ctx.owner.name, 'historico de custos do 2.o abre com o nome do dono (antes: 500)', ph.status === 200 ? ph.data[0] : ph);
    // Dois separadores: a pagina que ainda mostra casa nao grava no 2.o.
    const stale = await b.req('POST', '/api/products', { name: 'Separador antigo', category: 'X', sell_price: 100, cost_price: 50, stock_qty: 1 }, { 'X-Genesis-Establishment': t });
    ok(stale.status === 409 && stale.data?.code === 'ESTABLISHMENT_CHANGED', 'separador que mostra outro estabelecimento: 409 e nada gravado', stale);
    ok(!(await prisma.product.findFirst({ where: { name: 'Separador antigo' } })), 'o produto do separador antigo nao ficou em lado nenhum');
    ok((await b.req('GET', '/api/products', undefined, { 'X-Genesis-Establishment': bId })).status === 200, 'separador certo: 200');
    const sl = await b.req('GET', '/api/owner/sales?page=1&page_size=20');
    ok(sl.status === 200, 'lista de vendas do 2.o abre', sl.status);
    // Teste acabado no 2.o: trocar para casa continua a funcionar (antes: 402).
    await setStatus(bId, { status: 'trial', trial_ends_at: new Date(Date.now() - 86400000) });
    ok((await b.req('POST', '/api/products', { name: 'X', category: 'Y', sell_price: 100, cost_price: 50, stock_qty: 1 })).status === 402, 'no 2.o com o teste acabado: criar = 402 (so leitura)');
    const sw = await b.req('POST', '/api/establishments/switch', { tenant_id: t });
    ok(sw.status === 200, 'com o teste acabado no 2.o, trocar para casa = 200 (antes: 402)', sw);
    // 2.o suspenso: a lista diz, trocar para ele e recusado sem expulsar o dono.
    await setStatus(bId, { status: 'suspended' });
    const list = (await b.req('GET', '/api/establishments')).data;
    ok(list.find((e) => e.id === bId)?.available === false, 'lista: o 2.o aparece como indisponivel');
    const sw2 = await b.req('POST', '/api/establishments/switch', { tenant_id: bId });
    ok(sw2.status === 403 && sw2.data?.code === 'ESTABLISHMENT_UNAVAILABLE', 'trocar para o suspenso: 403 ESTABLISHMENT_UNAVAILABLE (nao termina a sessao)', sw2);
    // Quem ja estava no 2.o quando foi suspenso: volta a casa.
    const stuck = client(signAccessToken(ctx.owner, { act: bId }));
    const sp = await stuck.req('GET', '/api/products');
    ok(sp.status === 403 && sp.data?.code === 'ESTABLISHMENT_FORBIDDEN', 'no 2.o suspenso: 403 ESTABLISHMENT_FORBIDDEN (o painel volta a casa)', sp);
    const home = await stuck.req('POST', '/api/establishments/home');
    ok(home.status === 200 && (await stuck.req('GET', '/api/products')).status === 200, 'voltar a casa funciona mesmo com o activo suspenso', home);
    // De casa suspensa: o login entra no 2.o que esta aberto.
    await setStatus(bId, { status: 'active' });
    await setStatus(t, { status: 'suspended' });
    const lg = client();
    const li = await lg.req('POST', '/api/auth/login', { email: ctx.owner.email, password: OWNER_PW });
    const me = await lg.req('GET', '/api/auth/me');
    ok(li.status === 200 && me.data?.user?.tenant_id === bId, 'de casa suspensa: o login entra no 2.o (antes: conta suspensa)', { login: li.status, tenant: me.data?.user?.tenant_id });
    // Refresh com o activo suspenso: volta a casa se estiver aberta.
    await setStatus(t, { status: before.status, trial_ends_at: before.trial_ends_at });
    await setStatus(bId, { status: 'suspended' });
    const rf = client(); rf.jar.set('refreshToken', require('../src/utils/tokens').signRefreshToken(ctx.owner, { act: bId }));
    const r = await rf.req('POST', '/api/refresh');
    const me2 = await rf.req('GET', '/api/auth/me');
    ok(r.status === 200 && me2.data?.user?.tenant_id === t, 'refresh com o 2.o suspenso: continua, no de casa', { refresh: r.status, tenant: me2.data?.user?.tenant_id });
  } finally {
    await prisma.tenant.update({ where: { id: t }, data: { status: before.status, trial_ends_at: before.trial_ends_at } });
    await dropTenant(bId);
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'CREATE_ESTABLISHMENT' } });
    await sleep(STATUS_CACHE_MS + 500);
  }
}

async function test48() {
  section(48, '31/10: configurar o estabelecimento numa so operacao (tudo ou nada, repetir nao duplica) e eventos ao vivo de perdas, txenekas, despesas, compras e turnos (dono com valores; admin sem lucros nem nomes)');
  const t = ctx.tenant.id;
  const made = [];
  const counts = async (id) => ({ fixed: await prisma.fixedCost.count({ where: { tenant_id: id } }), emp: await prisma.employee.count({ where: { tenant_id: id } }), sup: await prisma.supplier.count({ where: { tenant_id: id } }), prod: await prisma.product.count({ where: { tenant_id: id } }) });
  const body = (products) => ({
    business_type: 'mercearia', products,
    rent: 4000000, costs: [{ description: 'Luz', amount: 300000 }], employees: [{ name: 'Ana Teste', role: 'Ajudante', monthly_salary: 900000 }],
    suppliers: [{ name: 'Fornecedor Teste', phone: '840000000', delivery_cost_per_visit: 50000 }], hours: { opening_time: '07:00', closing_time: '21:00' },
  });
  const goodProducts = [{ name: 'Arroz 1kg', price_mzn: 95, cost_mzn: 70, stock: 10, category: 'Mercearia', barcode: '6009876543210' }, { name: 'Oleo 1L', price_mzn: 150, cost_mzn: 120, stock: 5, category: 'Mercearia', barcode: null }];
  try {
    const owner = ownerClient();
    const newEst = async (suffix) => {
      const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + suffix, business_type: 'mercearia', location: 'Matola' });
      made.push(cb.data.id);
      const c = ownerClient();
      await c.req('POST', '/api/establishments/switch', { tenant_id: cb.data.id });
      return { id: cb.data.id, c };
    };
    const { id: bId, c: b } = await newEst('-B');
    const bad = await b.req('POST', '/api/onboarding/complete', body([goodProducts[0], { ...goodProducts[1], barcode: '123' }]));
    ok(bad.status === 400 && bad.data?.code === 'INVALID_CATALOG', 'codigo de barras curto: 400 a dizer o produto', bad);
    const c0 = await counts(bId);
    ok(c0.fixed === 0 && c0.emp === 0 && c0.sup === 0 && c0.prod === 0, 'com o erro nada ficou gravado (antes: renda, custos e equipa ja estavam gravados)', c0);
    const done = await b.req('POST', '/api/onboarding/complete', body(goodProducts));
    ok(done.status === 201 && done.data.imported === 2, 'configuracao concluida numa so operacao', done);
    const c1 = await counts(bId);
    ok(c1.fixed === 2 && c1.emp === 1 && c1.sup === 1 && c1.prod === 2, 'renda + 1 custo, 1 trabalhador, 1 fornecedor, 2 produtos', c1);
    const tb = await prisma.tenant.findUnique({ where: { id: bId }, select: { onboarding_completed: true, business_type: true, opening_time: true, closing_time: true } });
    ok(tb.onboarding_completed && tb.business_type === 'mercearia' && tb.opening_time === '07:00' && tb.closing_time === '21:00', 'tipo e horario gravados', tb);
    const again = await b.req('POST', '/api/onboarding/complete', body(goodProducts));
    ok(again.status === 409 && again.data?.code === 'ONBOARDING_DONE', 'repetir (duplo clique, resposta perdida): 409', again);
    ok(JSON.stringify(await counts(bId)) === JSON.stringify(c1), 'repetir nao duplica a renda, a equipa nem os produtos');
    // Dois pedidos ao mesmo tempo: so um grava.
    const { id: cId, c: cc } = await newEst('-C');
    const [r1, r2] = await Promise.all([cc.req('POST', '/api/onboarding/complete', body(goodProducts)), cc.req('POST', '/api/onboarding/complete', body(goodProducts))]);
    ok([r1.status, r2.status].sort().join(',') === '201,409', 'dois pedidos ao mesmo tempo: um 201 e um 409', [r1.status, r2.status]);
    const cC = await counts(cId);
    ok(cC.fixed === 2 && cC.emp === 1 && cC.prod === 2, 'e os dados ficaram uma so vez', cC);

    // Eventos ao vivo no estabelecimento de casa.
    const ownerCookie = { Cookie: 'token=' + signAccessToken(ctx.owner) };
    const adminHeaders = { Cookie: 'token=' + signAccessToken(ctx.admin), Origin: ADMIN_ORIGIN };
    const today = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10);
    const make = async () => {
      await owner.req('POST', '/api/owner/debts', { debtor_name: 'Cliente Teste', debtor_phone: '840000001', total_amount: 25000, due_date: today });
      await owner.req('POST', '/api/settings/expenses', { date: today, category: 'Limpeza', description: 'Detergente', amount: 12000 });
      const st = await owner.req('POST', '/api/inventory/stock', { product_id: ctx.product.id, quantity: 2, unit_cost: ctx.product.cost_price });
      if (st.status >= 300) ok(false, 'entrada de stock aceite', st);
      const sh = await owner.req('POST', '/api/shrinkage_records', { product_id: ctx.product.id, quantity: 1, reason: 'broken' });
      if (sh.status >= 300) ok(false, 'perda aceite', sh);
    };
    const live = await readSse('/api/owner/live', ownerCookie, 4, 150000, make);
    const kinds = live.events.map((e) => e.type);
    ok(['debt', 'expense', 'stock_in', 'loss'].every((k) => kinds.includes(k)), 'dono recebe txeneka, despesa, compra de stock e perda ao vivo', kinds);
    const debtEv = live.events.find((e) => e.type === 'debt');
    const lossEv = live.events.find((e) => e.type === 'loss');
    ok(debtEv?.data.total === 25000 && debtEv.data.name === 'Cliente Teste', 'txeneka ao dono: valor e nome', debtEv?.data);
    ok(lossEv?.data.total === ctx.product.cost_price && Boolean(lossEv.data.name), 'perda ao dono: valor ao custo e produto', lossEv?.data);
    const adm = await readSse('/api/admin/live', adminHeaders, 4, 150000, make);
    const aDebt = adm.events.find((e) => e.type === 'debt');
    ok(adm.status === 200 && ['debt', 'expense', 'stock_in', 'loss'].every((k) => adm.events.some((e) => e.type === k)), 'admin recebe os mesmos movimentos no mapa', adm.events.map((e) => e.type));
    ok(Boolean(aDebt) && aDebt.data.total === 25000 && !('profit' in aDebt.data) && !JSON.stringify(adm.events).includes('Cliente Teste'), 'admin: valores sim, lucro e nomes de pessoas nao', aDebt && aDebt.data);
  } finally {
    for (const m of ['fixedCost', 'employee', 'supplier']) await prisma[m].deleteMany({ where: { tenant_id: { in: made } } });
    for (const id of made) await dropTenant(id);
    await prisma.debt.deleteMany({ where: { tenant_id: t, debtor_name: 'Cliente Teste' } });
    await prisma.expense.deleteMany({ where: { tenant_id: t, description: 'Detergente' } });
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'CREATE_ESTABLISHMENT' } });
  }
}

async function test49() {
  section(49, '31/10: copiar o catalogo de outro estabelecimento (precos, unidade, IVA; sem stock; sem repetir; so do mesmo dono; RLS)');
  const t = ctx.tenant.id;
  let bId = null; let cTenant = null; let other = null;
  try {
    const owner = ownerClient();
    // Um produto ao kg com IVA isento no estabelecimento de casa.
    const kg = await owner.req('POST', '/api/products', { name: 'Carne moida (kg)', category: 'Talho', sell_price: 45000, cost_price: 30000, stock_qty: 5000, unit: 'kg', vat_rate: 0 });
    ok(kg.status === 201 || kg.status === 200, 'produto ao kg em casa', kg);
    const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + '-B', business_type: 'mercearia', location: 'Matola' });
    bId = cb.data.id;
    const b = ownerClient();
    await b.req('POST', '/api/establishments/switch', { tenant_id: bId });
    const list = await b.req('GET', '/api/establishments/' + t + '/catalog');
    const kgRow = list.data?.find((p) => p.name === 'Carne moida (kg)');
    ok(list.status === 200 && kgRow && kgRow.unit === 'kg' && kgRow.vat_rate === 0 && kgRow.stock === 0, 'a lista da origem traz unidade e IVA, sem stock', kgRow);
    const op = crypto.randomUUID();
    const cp = await b.req('POST', '/api/establishments/copy-catalog', { from: t, op_id: op });
    const nHome = await prisma.product.count({ where: { tenant_id: t, is_active: true } });
    ok(cp.status === 201 && cp.data.copied === nHome && cp.data.skipped === 0, 'copia todos os produtos activos de casa', { copied: cp.data?.copied, home: nHome });
    const copiedKg = await prisma.product.findFirst({ where: { tenant_id: bId, name: 'Carne moida (kg)' } });
    ok(copiedKg && copiedKg.unit === 'kg' && copiedKg.vat_rate === 0 && copiedKg.sell_price === 45000 && copiedKg.cost_price === 30000 && copiedKg.stock_qty === 0, 'no 2.o: o mesmo preco, ao kg, isento, stock a zero', copiedKg);
    const again = await b.req('POST', '/api/establishments/copy-catalog', { from: t, op_id: op });
    ok(again.status === 200 && again.data.repeated === true && (await prisma.product.count({ where: { tenant_id: bId } })) === nHome, 'repetir com o mesmo pedido nao copia duas vezes');
    const second = await b.req('POST', '/api/establishments/copy-catalog', { from: t, op_id: crypto.randomUUID() });
    ok(second.status === 201 && second.data.copied === 0 && second.data.skipped === nHome, 'copiar outra vez: tudo salta (ja existe)', second.data);
    ok((await b.req('POST', '/api/establishments/copy-catalog', { from: bId, op_id: crypto.randomUUID() })).data?.code === 'SAME_ESTABLISHMENT', 'copiar de si proprio: recusado');
    // Outro dono nao copia o catalogo deste.
    cTenant = await prisma.tenant.create({ data: { name: ctx.tenant.name + '-C', owner_name: 'Outro', business_type: 'bottle_store', location: 'Teste', phone: '840000009', status: 'active', onboarding_completed: true } });
    other = await prisma.user.create({ data: { tenant_id: cTenant.id, role: 'owner', name: 'Outro Dono', email: 'outro-' + crypto.randomBytes(4).toString('hex') + '@teste.local', password_hash: await bcrypt.hash(crypto.randomBytes(10).toString('hex'), 10), is_active: true } });
    const oc = client(signAccessToken(other));
    ok((await oc.req('GET', '/api/establishments/' + t + '/catalog')).status === 403, 'outro dono: ver o catalogo deste = 403');
    ok((await oc.req('POST', '/api/establishments/copy-catalog', { from: t, op_id: crypto.randomUUID() })).status === 403, 'outro dono: copiar deste = 403');
    ok((await prisma.product.count({ where: { tenant_id: cTenant.id } })) === 0, 'nada foi copiado para o outro');
  } finally {
    const kgIds = (await prisma.product.findMany({ where: { tenant_id: t, name: 'Carne moida (kg)' }, select: { id: true } })).map((p) => p.id);
    for (const m of ['stockLot', 'stockEntry', 'productPriceHistory']) await prisma[m].deleteMany({ where: { product_id: { in: kgIds } } });
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, entity_id: { in: kgIds } } });
    await prisma.product.deleteMany({ where: { id: { in: kgIds } } });
    if (other) await prisma.user.delete({ where: { id: other.id } });
    await dropTenant(bId);
    await dropTenant(cTenant && cTenant.id);
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'CREATE_ESTABLISHMENT' } });
  }
}

async function test50() {
  section(50, '31/10: horario a serio (24 h, por dia, depois da meia-noite, feriados; o pedido antigo continua) e terminal da saida so com guardas');
  const t = ctx.tenant.id;
  const before = await prisma.tenant.findUnique({ where: { id: t }, select: { opening_time: true, closing_time: true, hours_json: true } });
  let guardId = null; let termId = null;
  try {
    const owner = ownerClient();
    const legacy = await owner.req('PUT', '/api/settings/hours', { opening_time: '07:30', closing_time: '21:00' });
    ok(legacy.status === 200 && legacy.data.schedule?.mode === 'same' && legacy.data.schedule.days['3'][0][0] === '07:30', 'pedido antigo (abre/fecha) continua a funcionar', legacy.data);
    const h24 = await owner.req('PUT', '/api/settings/hours', { schedule: { mode: '24h' } });
    ok(h24.status === 200 && h24.data.opening_time === '00:00' && h24.data.closing_time === '23:59', '24 horas: resumo 00:00-23:59', h24.data);
    const g = await owner.req('GET', '/api/settings');
    ok(g.data?.hours?.schedule?.mode === '24h', 'as Definicoes devolvem o horario novo');
    const bar = await owner.req('PUT', '/api/settings/hours', { schedule: { mode: 'custom', days: { 5: [['18:00', '04:00']], 6: [['18:00', '04:00']], 0: [] , 1: [['08:00', '12:00'], ['14:00', '20:00']] } } });
    ok(bar.status === 200 && bar.data.schedule.day_end === '04:00', 'bar 18h-04h: o fim do dia de vendas fica nas 04:00 sozinho', bar.data?.schedule);
    const bad = await owner.req('PUT', '/api/settings/hours', { schedule: { mode: 'custom', days: { 1: [['08:00', '14:00'], ['13:00', '18:00']] } } });
    ok(bad.status === 400 && bad.data?.code === 'INVALID_HOURS', 'periodos sobrepostos: 400 com a razao', bad);
    ok((await owner.req('PUT', '/api/settings/hours', { schedule: { mode: 'custom', days: {} } })).status === 400, 'nenhum dia aberto: 400');
    // Terminal da saida: so os guardas.
    const guard = await owner.req('POST', '/api/owner/cashiers', { name: 'Guarda Saida', pin: '4826', role: 'guard' });
    guardId = guard.data?.id;
    ok(guard.status === 201, 'guarda criado', guard);
    const pc = await owner.req('POST', '/api/owner/terminals/pairing-code', { name: 'Saida principal', purpose: 'exit' });
    ok(pc.status === 201 && pc.data.code, 'codigo para um terminal da saida', pc);
    const term = client();
    const pr = await term.req('POST', '/api/pos/pair', { code: pc.data.code });
    termId = pr.data?.terminal?.id;
    const tp = await term.req('GET', '/api/pos/terminal');
    ok(tp.status === 200 && tp.data.terminal.purpose === 'exit' && tp.data.cashiers.length >= 1 && tp.data.cashiers.every((c) => c.role === 'guard'), 'o terminal da saida mostra so os guardas', tp.data?.cashiers);
    const list = (await owner.req('GET', '/api/owner/terminals')).data;
    ok(list.find((x) => x.id === termId)?.purpose === 'exit', 'a lista de terminais diz «saida»');
  } finally {
    await prisma.tenant.update({ where: { id: t }, data: before });
    if (termId) await prisma.posTerminal.deleteMany({ where: { id: termId } });
    if (guardId) { await prisma.auditLog.deleteMany({ where: { tenant_id: t, entity_id: guardId } }); await prisma.user.deleteMany({ where: { id: guardId } }); }
  }
}

async function test51() {
  section(51, '31/10: encerrar/apagar estabelecimento (sem vendas = apagado; com vendas = so consulta, fila sem rede aceite 7 dias, reabrir 30 dias; principal protegido; admin nao elimina o principal de quem tem outros)');
  const t = ctx.tenant.id;
  const made = [];
  try {
    const owner = ownerClient();
    const mk = async (suffix) => {
      const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + suffix, business_type: 'mercearia', location: 'Matola' });
      made.push(cb.data.id);
      await prisma.tenant.update({ where: { id: cb.data.id }, data: { onboarding_completed: true } });
      return { id: cb.data.id, name: ctx.tenant.name + suffix };
    };
    // Principal: nao se encerra.
    const home = await owner.req('POST', '/api/establishments/' + t + '/close', { password: OWNER_PW, confirm_name: ctx.tenant.name });
    ok(home.status === 400 && home.data?.code === 'HOME_ESTABLISHMENT', 'o principal nao se encerra (a conta vive nele)', home);
    // B sem vendas: apagado.
    const B = await mk('-B');
    ok((await owner.req('POST', '/api/establishments/' + B.id + '/close', { password: 'errada-123', confirm_name: B.name })).data?.code === 'WRONG_PASSWORD', 'senha errada: recusado');
    ok((await owner.req('POST', '/api/establishments/' + B.id + '/close', { password: OWNER_PW, confirm_name: 'outro nome' })).data?.code === 'NAME_MISMATCH', 'nome errado: recusado');
    const del = await owner.req('POST', '/api/establishments/' + B.id + '/close', { password: OWNER_PW, confirm_name: B.name.toUpperCase() });
    ok(del.status === 200 && del.data.status === 'deleted', 'sem vendas: apagado', del);
    ok(!(await owner.req('GET', '/api/establishments')).data.some((e) => e.id === B.id), 'o apagado sai da lista do dono');
    // C com vendas: encerrado, so consulta.
    const C = await mk('-C');
    const c = ownerClient();
    await c.req('POST', '/api/establishments/switch', { tenant_id: C.id });
    await c.req('POST', '/api/products', { name: 'Pao C', category: 'Padaria', sell_price: 1000, cost_price: 600, stock_qty: 50 });
    const prod = await prisma.product.findFirst({ where: { tenant_id: C.id, name: 'Pao C' } });
    const cash = await c.req('POST', '/api/owner/cashiers', { name: 'Caixa C', pin: '3579' });
    const cashierC = await prisma.user.findUnique({ where: { id: cash.data.id } });
    const pos = client(signAccessToken(cashierC, { scope: 'pos' }));
    const sale1 = await pos.req('POST', '/api/sales', { id: crypto.randomUUID(), items: [{ product_id: prod.id, quantity: 1, unit_sell_price: 1000, unit_cost_price: 0 }], total_amount: 1000, payment_method: 'cash', amount_received: 1000 });
    ok(sale1.status === 201, 'venda no C antes de encerrar', sale1);
    const cl = await c.req('POST', '/api/establishments/' + C.id + '/close', { password: OWNER_PW, confirm_name: C.name });
    ok(cl.status === 200 && cl.data.status === 'closed' && cl.data.reopen_until, 'com vendas: encerrado (so consulta), reabre ate 30 dias', cl.data);
    await sleep(STATUS_CACHE_MS + 500);
    const listC = (await owner.req('GET', '/api/establishments')).data.find((e) => e.id === C.id);
    ok(listC && listC.status === 'closed', 'a lista mostra o encerrado');
    const ro = ownerClient();
    ok((await ro.req('POST', '/api/establishments/switch', { tenant_id: C.id })).status === 200 && (await ro.req('GET', '/api/products')).status === 200, 'entrar no encerrado para consultar: 200');
    const w = await ro.req('POST', '/api/products', { name: 'Novo', category: 'X', sell_price: 100, cost_price: 50, stock_qty: 1 });
    ok(w.status === 403 && w.data?.code === 'ESTABLISHMENT_CLOSED', 'no encerrado nao se cria nada (403)', w);
    const sync = await pos.req('POST', '/api/sales', { id: crypto.randomUUID(), items: [{ product_id: prod.id, quantity: 1, unit_sell_price: 1000, unit_cost_price: 0 }], total_amount: 1000, payment_method: 'cash', amount_received: 1000 });
    ok(sync.status === 201, 'venda que estava na fila sem rede: aceite (7 dias)', sync);
    // Reabrir.
    const re = await owner.req('POST', '/api/establishments/' + C.id + '/reopen');
    ok(re.status === 200 && ['trial', 'active'].includes(re.data.status), 'reabrir: volta ao estado anterior', re.data);
    await sleep(STATUS_CACHE_MS + 500);
    ok((await ro.req('POST', '/api/products', { name: 'Depois de reabrir', category: 'X', sell_price: 100, cost_price: 50, stock_qty: 1 })).status < 300, 'depois de reabrir volta a poder criar');
    // Admin: eliminar o principal de um dono com outros = recusado.
    const adm = client(signAccessToken(ctx.admin), { Origin: ADMIN_ORIGIN });
    const ad = await adm.req('POST', '/api/admin/tenants/' + t + '/delete');
    ok(ad.status === 409 && ad.data?.code === 'HOME_WITH_OTHERS', 'admin: eliminar o principal de quem tem outros = 409', ad);
    ok((await prisma.user.findUnique({ where: { id: ctx.owner.id } })).is_active === true, 'o dono continua activo');
  } finally {
    for (const id of made) await dropTenant(id);
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: { in: ['CREATE_ESTABLISHMENT', 'ESTABLISHMENT_CLOSED', 'ESTABLISHMENT_DELETED', 'ESTABLISHMENT_CLOSE_FAIL'] } } });
    await sleep(STATUS_CACHE_MS + 500);
  }
}

async function test52() {
  section(52, '31/10 (E1 2.a parte): modo suporte num estabelecimento extra (so leitura, o certo), pedido de conta com e-mail de um dono = juntar a conta dele, morada e lembrete «marque no mapa», textos «estabelecimento»');
  const t = ctx.tenant.id;
  const made = [];
  let reqTenant = null;
  try {
    const owner = ownerClient();
    const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + '-B', business_type: 'mercearia', location: 'Matola' });
    const bId = cb.data.id; made.push(bId);
    await prisma.tenant.update({ where: { id: bId }, data: { onboarding_completed: true } });
    const b = ownerClient();
    await b.req('POST', '/api/establishments/switch', { tenant_id: bId });
    await b.req('POST', '/api/products', { name: 'So no B', category: 'X', sell_price: 1000, cost_price: 500, stock_qty: 3 });
    // Modo suporte no extra: o admin abre-o e ve o B, so leitura.
    const adm = client(signAccessToken(ctx.admin), { Origin: ADMIN_ORIGIN });
    const sc = await adm.req('POST', '/api/admin/tenants/' + bId + '/support');
    ok(sc.status === 200 && sc.data.url && sc.data.url.includes('#'), 'admin: codigo de suporte para o estabelecimento extra (antes: «ainda nao tem dono»)', sc);
    const code = sc.data.url.split('#')[1];
    const sup = client();
    const rd = await sup.req('POST', '/api/auth/support', { code });
    ok(rd.status === 200 && rd.data.scope === 'support', 'o codigo abre uma sessao de suporte', rd);
    const sp = await sup.req('GET', '/api/products');
    ok(sp.status === 200 && sp.data.some((p) => p.name === 'So no B') && !sp.data.some((p) => p.id === ctx.product.id), 'suporte ve os produtos do B (e so do B)', sp.status);
    ok((await sup.req('POST', '/api/products', { name: 'X', category: 'X', sell_price: 100, cost_price: 50, stock_qty: 1 })).status === 403, 'suporte: so leitura (403 ao criar)');
    // Pedido de conta com o e-mail de um dono: juntar.
    const rq = await client().req('POST', '/api/auth/request-account', { businessName: ctx.tenant.name + '-R', ownerName: ctx.owner.name, businessType: 'mercearia', location: 'Beira', phone: '840000123', email: ctx.owner.email, acceptTerms: true });
    ok(rq.status === 201 || rq.status === 200, 'pedido de conta com o mesmo e-mail do dono entra como pedido', rq);
    reqTenant = await prisma.tenant.findFirst({ where: { name: ctx.tenant.name + '-R' } });
    if (reqTenant) made.push(reqTenant.id);
    const ap1 = await adm.req('POST', '/api/admin/requests/' + reqTenant.id + '/approve');
    ok(ap1.status === 409 && ap1.data?.code === 'EMAIL_IS_OWNER', 'aprovar: o e-mail ja e de um dono -> pergunta se junta (409 EMAIL_IS_OWNER)', ap1);
    const ap2 = await adm.req('POST', '/api/admin/requests/' + reqTenant.id + '/approve', { join_existing: true });
    ok(ap2.status === 200 && ap2.data.joined === true && !ap2.data.temporaryPassword, 'juntar: sem senha nova (entra com a que tem)', ap2.data);
    const list = (await owner.req('GET', '/api/establishments')).data;
    ok(list.some((e) => e.id === reqTenant.id && e.status === 'trial'), 'o estabelecimento do pedido aparece na lista do dono, em teste');
    ok((await prisma.user.count({ where: { email: ctx.owner.email } })) === 1, 'continua a haver uma so conta com esse e-mail');
    // Morada e lembrete «marque no mapa».
    const nb0 = (await b.req('GET', '/api/owner/notifications')).data;
    ok(Array.isArray(nb0) ? nb0.some((n) => n.type === 'no_location') : (nb0.items || []).some((n) => n.type === 'no_location'), 'sem ponto no mapa: lembrete no sino', nb0);
    const loc = await b.req('PUT', '/api/settings/location', { lat: -25.9692, lng: 32.5732, address: 'Av. Eduardo Mondlane, cruzamento com a Av. Karl Marx' });
    ok(loc.status === 200 && loc.data.location.address.includes('Karl Marx'), 'morada guardada com o ponto', loc);
    const nb1 = (await b.req('GET', '/api/owner/notifications')).data;
    ok(!(Array.isArray(nb1) ? nb1 : (nb1.items || [])).some((n) => n.type === 'no_location'), 'com ponto: o lembrete desaparece');
    // Textos: «estabelecimento» nas mensagens do servidor.
    const miss = await b.req('POST', '/api/owner/cashiers/' + crypto.randomUUID() + '/unlock');
    ok(!JSON.stringify(miss.data || {}).includes('loja'), 'mensagens do servidor sem «loja»', miss.data);
  } finally {
    for (const id of made) await dropTenant(id);
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'CREATE_ESTABLISHMENT' } });
  }
}

// E2 (31/10): procura nomes de campos sensiveis em qualquer nivel (independente
// de utils/managerPolicy.js, para nao testar a regra com ela propria).
const LEAK_RE = /cost|profit|margin|lucro|custo(s)?$|salar|payroll|deduc|expense|despesa|investment|(^|_)rent(_|$)|stock_value|losses_total|losses_by_reason/i;
function leaks(v, path = '', out = []) {
  if (Array.isArray(v)) v.forEach((x, i) => leaks(x, path + '[' + i + ']', out));
  else if (v && typeof v === 'object' && !(v instanceof Date)) {
    for (const [k, x] of Object.entries(v)) { if (LEAK_RE.test(k)) out.push(path + '.' + k); leaks(x, path + '.' + k, out); }
  }
  return out;
}
const isoDay = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

async function test53() {
  section(53, 'E2: gerente — entra com e-mail e senha, so as rotas da lista (403 no resto), nenhum custo/lucro nas respostas, sem act, PIN de autorizacao proprio com o nome no rastreio, senha nova e desactivar cortam logo');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  const email = 'gerente-' + crypto.randomBytes(4).toString('hex') + '@teste.local';
  const pw = 'Gerente-' + crypto.randomBytes(5).toString('hex');
  const MPIN = '8642';
  let bId = null; let otherTenant = null;
  try {
    // Dados com custos em todo o lado: venda, entrada com validade, fornecedor, perda, despesa.
    const sup = await owner.req('POST', '/api/inventory/suppliers', { name: 'Fornecedor E2', phone: '840000123', delivery_cost_per_visit: 5000 });
    await owner.req('POST', '/api/inventory/stock', { product_id: ctx.product.id, unit_cost: 6000, supplier_id: sup.data?.id, lots: [{ quantity: 4, expiry_date: isoDay(new Date(Date.now() + 86400000)) }] });
    const s1 = await owner.req('POST', '/api/sales', saleBody());
    const term = await cashierTerminal();
    await term.req('POST', '/api/shrinkage_records', { id: crypto.randomUUID(), product_id: ctx.product.id, quantity: 1, reason: 'broken' });
    await owner.req('POST', '/api/settings/expenses', { date: isoDay(), category: 'Limpeza', description: 'E2', amount: 1500 });
    await owner.req('POST', '/api/shopping-lists', { name: 'Lista E2', items: [{ product_id: ctx.product.id, quantity: 3 }] });

    // Criar (so o dono). E-mail unico em todo o Genesis; PIN diferente do dono.
    const dup = await owner.req('POST', '/api/managers', { name: 'Gerente Teste', email: ctx.owner.email, password: pw });
    ok(dup.status === 409 && dup.data?.code === 'EMAIL_IN_USE', 'e-mail de outra conta: 409', dup);
    const samePin = await owner.req('POST', '/api/managers', { name: 'Gerente Teste', email, password: pw, pin: PIN });
    ok(samePin.status === 409 && samePin.data?.code === 'PIN_TAKEN', 'PIN igual ao do dono: 409 (o rastreio ficava ambiguo)', samePin);
    ok((await owner.req('POST', '/api/managers', { name: 'Gerente Teste', email, password: 'curta' })).status === 400, 'senha com menos de 8: 400');
    const cr = await owner.req('POST', '/api/managers', { name: 'Gerente Teste', email, password: pw, pin: MPIN });
    ok(cr.status === 201 && cr.data.tenant_id === t && cr.data.has_pin && cr.data.establishment === ctx.tenant.name && !JSON.stringify(cr.data).includes('hash'), 'dono cria o gerente (e-mail, senha, PIN), sem hashes na resposta', cr);
    const managerId = cr.data?.id;
    const list = await owner.req('GET', '/api/managers');
    ok(list.status === 200 && list.data.some((m) => m.id === managerId && m.is_active), 'lista de gerentes do dono');
    const cashierSees = await client(signAccessToken(ctx.cashier, { scope: 'pos' })).req('GET', '/api/managers');
    ok(cashierSees.status === 403, 'caixista nao chega aos gerentes', cashierSees.status);

    // Entrar com e-mail e senha.
    const g = client();
    const login = await g.req('POST', '/api/auth/login', { email, password: pw });
    ok(login.status === 200 && login.data?.user?.role === 'manager', 'gerente entra em /entrar com e-mail e senha', login.status);
    const me = (await g.req('GET', '/api/auth/me')).data;
    ok(me?.user?.role === 'manager' && me.user.tenant_id === t && !me.user.lock, '/me: gerente no seu estabelecimento, sem o bloqueio do painel do dono', me?.user);

    // O que pode ver: 200 e nenhum campo de custo/lucro/salario em nenhuma resposta.
    const day = isoDay();
    const allowed = ['/api/owner/overview', '/api/owner/sales?page=1', '/api/products', '/api/products/' + ctx.product.id + '/lots', '/api/owner/reports/daily', '/api/owner/reports/weekly',
      `/api/owner/reports/timeline?from=${day}&to=${day}`, '/api/owner/audit?period=today', '/api/owner/notifications', '/api/owner/alerts', '/api/inventory/stock',
      '/api/inventory/suppliers', '/api/settings', '/api/owner/tenant', '/api/owner/cashiers', '/api/owner/terminals', '/api/shopping-lists', '/api/shopping-lists/suggestion', '/api/sales',
      '/api/owner/shift-closings', '/api/owner/debts', '/api/owner/goals/current', '/api/owner/goals/history'];
    if (sup.data?.id) allowed.push('/api/inventory/suppliers/' + sup.data.id + '/entries');
    for (const p of allowed) {
      const r = await g.req('GET', p);
      const found = r.status === 200 ? leaks(r.data) : [];
      ok(r.status === 200 && found.length === 0, `gerente GET ${p.split('?')[0]}: 200, sem custos nem lucros`, r.status === 200 ? found.slice(0, 5) : r);
    }
    const daily = (await g.req('GET', '/api/owner/reports/daily')).data;
    ok(daily && daily.gross_revenue >= 10000 && Array.isArray(daily.losses) && daily.losses.length >= 1 && daily.losses.every((l) => l.value === undefined), 'relatorio do gerente: receita sim; perdas so com quantidades (o valor e a custo)', daily && daily.losses);
    const tl = (await g.req('GET', `/api/owner/reports/timeline?from=${day}&to=${day}`)).data;
    ok(tl && !tl.rows.some((e) => e.type === 'expense') && tl.rows.filter((e) => e.type === 'loss' || e.type === 'stock').every((e) => e.amount === undefined), 'rastreio do gerente: sem despesas; perdas e compras sem valor', tl && tl.rows.map((e) => e.type));
    const tlOwner = (await owner.req('GET', `/api/owner/reports/timeline?from=${day}&to=${day}`)).data;
    ok(tlOwner.rows.some((e) => e.type === 'expense') && tlOwner.rows.some((e) => e.type === 'sale' && typeof e.profit === 'number'), 'o dono continua a ver despesas e lucro no rastreio');
    const st = (await g.req('GET', '/api/settings')).data;
    ok(st && !st.store.phone && !st.store.email && st.taxes === undefined && st.fixed_costs === undefined && st.hours, 'definicoes do gerente: horario sim; contacto do dono, impostos e custos fixos nao', st);
    const tn = (await g.req('GET', '/api/owner/tenant')).data;
    ok(tn && tn.name && tn.phone === undefined && tn.email === undefined && tn.subscription_price === undefined && tn.trial_ends_at === undefined, 'estabelecimento do gerente: sem contacto do dono nem plano', tn);
    const al = (await g.req('GET', '/api/owner/alerts')).data;
    ok(al && al.expiringLots.length >= 1 && al.expiringLots.every((l) => l.value === undefined), 'validades do gerente: os lotes sem o valor (a custo)', al && al.expiringLots);

    // O que e do dono: 403 (mesmo que o ecra se esqueca de esconder).
    const denied = [['GET', '/api/owner/reports/monthly'], ['GET', '/api/owner/reports/total'], ['GET', '/api/owner/employees'], ['GET', '/api/owner/payroll'], ['GET', '/api/settings/fixed-costs'], ['GET', '/api/settings/expenses'],
      ['PUT', '/api/settings/store', { name: 'Hack' }], ['PUT', '/api/settings/authorization-pin', { pin: '1111', password: 'x' }], ['PUT', '/api/settings/location', { lat: 1, lng: 1 }], ['PUT', '/api/settings/taxes', { vat_mode: 'none' }],
      ['GET', '/api/profile'], ['PUT', '/api/profile/email', { email: 'x@y.z' }], ['GET', '/api/dashboard/summary'], ['GET', '/api/establishments'], ['POST', '/api/establishments', { name: 'X', business_type: 'mercearia', location: 'Y' }],
      ['GET', '/api/group/overview'], ['GET', '/api/managers'], ['POST', '/api/managers', { name: 'Outro', email: 'o@t.local', password: 'abcdefgh1' }], ['GET', '/api/owner/month-close'], ['DELETE', '/api/products/' + ctx.product.id],
      ['GET', '/api/inventory/price-history'], ['POST', '/api/owner/goals', { target_amount: 100 }], ['GET', '/api/lock/status'], ['POST', '/api/onboarding/complete', {}], ['POST', '/api/catalogs/bottle_store/import', {}]];
    for (const [m, p, b] of denied) {
      const r = await g.req(m, p, b);
      ok(r.status === 403, `gerente ${m} ${p}: 403`, r.status);
    }
    // A mensagem do recibo sim (so ela): o resto dos dados do estabelecimento e do dono.
    const rf = await g.req('PUT', '/api/settings/store', { receipt_footer: 'Volte sempre (gerente)' });
    const tf = await prisma.tenant.findUnique({ where: { id: t }, select: { receipt_footer: true, name: true } });
    ok(rf.status === 200 && tf.receipt_footer === 'Volte sempre (gerente)' && tf.name === ctx.tenant.name, 'gerente muda a mensagem do recibo (so isso)', rf);
    const both = await g.req('PUT', '/api/settings/store', { receipt_footer: 'x', phone: '849999999' });
    ok(both.status === 403 && both.data?.code === 'MANAGER_FORBIDDEN', 'gerente com a mensagem + o telefone do dono: 403', both);
    const adm = await client(signAccessToken(await prisma.user.findUnique({ where: { id: managerId } })), { Origin: ADMIN_ORIGIN }).req('GET', '/api/admin/tenants');
    ok(adm.status === 403, 'gerente no admin: 403', adm.status);

    // Sem custos nas escritas: produto novo com custo 0 (o dono e avisado), entrada e edicao sem mexer no custo.
    const np = await g.req('POST', '/api/products', { name: 'Produto do Gerente E2', category: 'Geral', sell_price: 5000, cost_price: 999, stock_qty: 3 });
    ok(np.status === 201 && np.data.cost_price === undefined, 'gerente cria um produto (a resposta nao traz custo)', np);
    ok((await prisma.product.findUnique({ where: { id: np.data.id } })).cost_price === 0, 'o custo que o gerente mandou foi ignorado (fica 0)');
    const notesO = (await owner.req('GET', '/api/owner/notifications')).data.items;
    ok(notesO.some((n) => n.type === 'cost_missing' && n.params.names.includes('Produto do Gerente E2')), 'o dono e avisado no sino: produto criado pelo gerente sem custo', notesO.map((n) => n.type));
    const notesG = (await g.req('GET', '/api/owner/notifications')).data.items;
    ok(!notesG.some((n) => n.type === 'cost_missing' || n.type === 'no_location'), 'o gerente nao ve o aviso de custos nem o do mapa');
    const before = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    const se = await g.req('POST', '/api/inventory/stock', { product_id: ctx.product.id, quantity: 2, unit_cost: 1 });
    const afterSe = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    ok(se.status === 201 && afterSe.cost_price === before.cost_price && afterSe.stock_qty === before.stock_qty + 2, 'entrada de stock do gerente: stock +2, custo do produto intacto', { status: se.status, before: before.cost_price, after: afterSe.cost_price });
    const ed = await g.req('PATCH', '/api/products/' + ctx.product.id, { cost_price: 1, sell_price: 10000 });
    ok(ed.status === 200 && (await prisma.product.findUnique({ where: { id: ctx.product.id } })).cost_price === before.cost_price, 'editar: o custo mandado pelo gerente e ignorado', ed.status);
    const sp = await g.req('POST', '/api/inventory/suppliers', { name: 'Fornecedor do Gerente', delivery_cost_per_visit: 9999 });
    ok(sp.status === 201 && (await prisma.supplier.findUnique({ where: { id: sp.data.id } })).delivery_cost_per_visit === 0, 'fornecedor criado pelo gerente: custo de entrega 0 (e do dono)');

    // Sem `act` noutro estabelecimento (mesmo do mesmo dono).
    const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + '-G', business_type: 'mercearia', location: 'Matola' });
    bId = cb.data?.id;
    const mUser = await prisma.user.findUnique({ where: { id: managerId } });
    const forged = await client(signAccessToken(mUser, { act: bId })).req('GET', '/api/products');
    ok(forged.status === 403, 'gerente com token forjado act=outro estabelecimento do dono: 403', forged);
    ok((await g.req('POST', '/api/establishments/switch', { tenant_id: bId })).status === 403, 'gerente nao troca de estabelecimento');

    // PIN de autorizacao do gerente: cancelamento (no painel) e desconto (no terminal), com o nome no rastreio.
    const wrong = await g.req('POST', `/api/sales/${s1.data.id}/cancel`, { pin: '0000', reason: 'teste' });
    ok(wrong.status === 403, 'cancelar com PIN errado: 403', wrong.status);
    const canc = await g.req('POST', `/api/sales/${s1.data.id}/cancel`, { pin: MPIN, reason: 'teste E2' });
    ok(canc.status === 200, 'gerente cancela com o seu PIN', canc);
    const ca = await prisma.auditLog.findFirst({ where: { tenant_id: t, action: 'CANCEL_SALE', entity_id: s1.data.id } });
    const cav = ca ? JSON.parse(ca.new_value) : {};
    ok(ca && ca.user_id === managerId && cav.authorized_by === 'manager' && cav.manager_name === 'Gerente Teste', 'rastreio: cancelamento autorizado pelo gerente, com o nome dele', cav);
    const disc = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID(), discount_amount: 2500, total_amount: 7500, amount_received: 7500, authorization_pin: MPIN }));
    ok(disc.status === 201, 'desconto de 25% no terminal autorizado com o PIN do gerente', disc);
    const da = disc.data?.id ? await prisma.auditLog.findFirst({ where: { tenant_id: t, action: 'DISCOUNT_AUTHORIZED', entity_id: disc.data.id } }) : null;
    ok(da && JSON.parse(da.new_value).manager_name === 'Gerente Teste', 'rastreio: desconto autorizado pelo gerente (com o nome)', da && da.new_value);
    const ownerPinStill = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID(), discount_amount: 2500, total_amount: 7500, amount_received: 7500, authorization_pin: PIN }));
    ok(ownerPinStill.status === 201, 'o PIN do dono continua a valer');
    await owner.req('PUT', `/api/managers/${managerId}`, { pin: null });
    const off = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID(), discount_amount: 2500, total_amount: 7500, amount_received: 7500, authorization_pin: MPIN }));
    ok(off.status === 403 && off.data?.code === 'INVALID_AUTH_PIN', 'o dono tira o PIN ao gerente: deixa de autorizar', off);

    // Ao vivo: a venda chega ao gerente sem o lucro.
    const live = await readSse('/api/owner/live', { Cookie: 'token=' + g.jar.get('token') }, 1, 20000, () => owner.req('POST', '/api/sales', saleBody()));
    const ev = live.events.find((e) => e.type === 'sale');
    ok(live.status === 200 && ev && ev.data.total === 10000 && ev.data.profit === undefined, 'canal ao vivo do gerente: a venda, sem lucro', live);

    // A propria senha; depois o dono muda a senha e desactiva.
    const own = await g.req('PUT', '/api/profile/password', { current_password: pw, new_password: pw + 'Z' });
    ok(own.status === 200, 'o gerente muda a propria senha', own);
    const reset = await owner.req('PUT', `/api/managers/${managerId}`, { password: pw + 'Y' });
    ok(reset.status === 200, 'dono poe uma senha nova ao gerente', reset);
    ok((await g.req('GET', '/api/owner/overview')).status === 401, 'senha nova: a sessao aberta do gerente cai');
    const g2 = client();
    ok((await g2.req('POST', '/api/auth/login', { email, password: pw + 'Y' })).status === 200, 'entra com a senha nova');
    await owner.req('PUT', `/api/managers/${managerId}`, { is_active: false });
    ok((await g2.req('GET', '/api/owner/overview')).status === 401, 'desactivado: a sessao acaba no pedido seguinte');
    ok((await client().req('POST', '/api/auth/login', { email, password: pw + 'Y' })).status === 401, 'desactivado: nao entra');

    // Outro dono nao ve nem mexe nos gerentes deste.
    otherTenant = await prisma.tenant.create({ data: { name: ctx.tenant.name + '-O', owner_name: 'Outro', business_type: 'bottle_store', location: 'Teste', phone: '840000008', status: 'active', onboarding_completed: true } });
    const other = await prisma.user.create({ data: { tenant_id: otherTenant.id, role: 'owner', name: 'Outro Dono', email: 'outro-' + crypto.randomBytes(4).toString('hex') + '@teste.local', password_hash: await bcrypt.hash(crypto.randomBytes(10).toString('hex'), 10), is_active: true } });
    const oc = client(signAccessToken(other));
    ok(!(await oc.req('GET', '/api/managers')).data.some((m) => m.id === managerId), 'outro dono nao ve este gerente');
    ok((await oc.req('PUT', `/api/managers/${managerId}`, { is_active: true })).status === 404, 'outro dono nao reactiva este gerente (404)');
    ok((await oc.req('POST', '/api/managers', { tenant_id: t, name: 'Intruso', email: 'intruso-' + crypto.randomBytes(3).toString('hex') + '@t.local', password: 'abcdefgh1' })).status === 404, 'outro dono nao cria gerentes no estabelecimento deste (404)');
  } finally {
    await dropTenant(bId);
    await dropTenant(otherTenant && otherTenant.id);
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'CREATE_ESTABLISHMENT' } });
  }
}

async function test54() {
  section(54, 'E2: painel geral — somas iguais as de cada estabelecimento, ultimas vendas com terminal e perfil, rastreio, stock e relatorios de todos, canal ao vivo so do dono; outro dono, gerente e caixista fora');
  const t = ctx.tenant.id;
  const owner = ownerClient();
  let bId = null; let cTenant = null;
  try {
    const cb = await owner.req('POST', '/api/establishments', { name: ctx.tenant.name + '-B2', business_type: 'mercearia', location: 'Matola' });
    ok(cb.status === 201, '2.o estabelecimento', cb);
    bId = cb.data.id;
    const sw = client(signAccessToken(ctx.owner));
    await sw.req('POST', '/api/establishments/switch', { tenant_id: bId });
    // O mesmo produto (mesmo nome) em B, sem stock: o stock geral junta-os.
    await sw.req('POST', '/api/products', { name: 'Cerveja Teste', category: 'Bebidas', sell_price: 9000, cost_price: 5000, stock_qty: 0, min_stock: 5 });
    await sw.req('POST', '/api/products', { name: 'Arroz B2', category: 'Mercearia', sell_price: 5000, cost_price: 3000, stock_qty: 10 });
    const prodB = await prisma.product.findFirst({ where: { tenant_id: bId, name: 'Arroz B2' } });
    const saleB = await sw.req('POST', '/api/sales', { items: [{ product_id: prodB.id, quantity: 2, unit_sell_price: 5000, unit_cost_price: 0 }], total_amount: 10000, payment_method: 'cash', amount_received: 10000 });
    ok(saleB.status === 201, 'venda em B', saleB);
    // Venda num terminal de A: o painel geral mostra o terminal e o perfil.
    const term = await cashierTerminal();
    const saleT = await term.req('POST', '/api/sales', saleBody({ id: crypto.randomUUID() }));
    ok(saleT.status === 201, 'venda no terminal de A', saleT);
    ok((await prisma.sale.findUnique({ where: { id: saleT.data.id } })).terminal_id, 'a venda guarda o terminal de onde saiu');

    const ov = await owner.req('GET', '/api/group/overview');
    ok(ov.status === 200 && ov.data.establishments.length === 2, 'painel geral: os 2 estabelecimentos', ov.status);
    const light = await owner.req('GET', '/api/group/overview?light=1');
    ok(light.status === 200 && light.data.totals.today.revenue === ov.data.totals.today.revenue && light.data.establishments.every((e) => e.month.net_profit === null), 'hub (modo leve): hoje igual, sem lucro liquido', light.data && light.data.totals.today);
    const a = ov.data.establishments.find((e) => e.id === t);
    const b = ov.data.establishments.find((e) => e.id === bId);
    const oa = (await owner.req('GET', '/api/owner/overview')).data;
    const ob = (await sw.req('GET', '/api/owner/overview')).data;
    ok(a && a.today.revenue === oa.today.revenue && a.today.count === oa.today.sales_count && a.today.profit === oa.today.gross_profit, 'hoje de A = o Inicio de A', { geral: a && a.today, inicio: oa.today });
    ok(b && b.today.revenue === ob.today.revenue && b.today.revenue === 10000 && b.today.profit === 4000, 'hoje de B = o Inicio de B (100 MT, lucro 40 MT)', b && b.today);
    ok(a.month.revenue === oa.month.revenue && b.month.revenue === ob.month.revenue, 'mes de cada um = o Inicio de cada um');
    const tot = ov.data.totals;
    ok(tot.today.revenue === a.today.revenue + b.today.revenue && tot.month.revenue === a.month.revenue + b.month.revenue && tot.week.revenue === a.week.revenue + b.week.revenue, 'totais = soma dos estabelecimentos (hoje, 7 dias, mes)', tot);
    ok(typeof a.month.net_profit === 'number' && typeof tot.month.net_profit === 'number' && 'change_pct' in tot.today && typeof a.open_now === 'boolean', 'lucro liquido do mes, comparacoes e «aberto agora»', { net: tot.month.net_profit, open: a.open_now });

    const rec = await owner.req('GET', '/api/group/recent?limit=10');
    const rb = rec.data.find((s) => s.id === saleB.data.id);
    const rt = rec.data.find((s) => s.id === saleT.data.id);
    ok(rec.status === 200 && rb && rb.establishment === ctx.tenant.name + '-B2' && rb.items.some((i) => i.product_name === 'Arroz B2'), 'ultimas vendas: a de B com o estabelecimento e o que se vendeu', rb);
    ok(rt && rt.terminal && rt.cashier === ctx.cashier.name && rt.establishment === ctx.tenant.name, 'ultimas vendas: a do terminal com o nome do terminal e do caixista', rt);

    const day = isoDay();
    const tl = await owner.req('GET', `/api/group/timeline?from=${day}&to=${day}&page_size=100`);
    const tla = (await owner.req('GET', `/api/owner/reports/timeline?from=${day}&to=${day}&page_size=200`)).data;
    const tlb = (await sw.req('GET', `/api/owner/reports/timeline?from=${day}&to=${day}&page_size=200`)).data;
    ok(tl.status === 200 && tl.data.total === tla.total + tlb.total && tl.data.rows.some((e) => e.tenant_id === bId && e.establishment) && tl.data.rows.some((e) => e.tenant_id === t), 'rastreio geral: os dois juntos, cada linha com o estabelecimento; total = soma', { geral: tl.data && tl.data.total, a: tla.total, b: tlb.total });
    const sorted = tl.data.rows.every((e, i, arr) => i === 0 || new Date(arr[i - 1].at) >= new Date(e.at));
    ok(sorted, 'rastreio geral por ordem (mais recente primeiro)');

    const sg = await owner.req('GET', '/api/group/stock');
    const beer = sg.data.low.find((g) => g.name === 'Cerveja Teste');
    const inA = beer && beer.per.find((p) => p.tenant_id === t);
    const inB = beer && beer.per.find((p) => p.tenant_id === bId);
    ok(sg.status === 200 && beer && inA && inB && inB.qty === 0 && inB.low && inA.qty > 0 && beer.total === inA.qty + inB.qty, 'stock geral: «Cerveja Teste: N em A, 0 em B» (somado pelo nome)', beer);
    ok(sg.data.low.every((g) => g.per.length === 2), 'stock geral: cada produto mostra os 2 estabelecimentos');

    const rg = await owner.req('GET', '/api/group/reports?period=daily');
    const da = (await owner.req('GET', '/api/owner/reports/daily')).data;
    const db = (await sw.req('GET', '/api/owner/reports/daily')).data;
    ok(rg.status === 200 && rg.data.totals.gross_revenue === da.gross_revenue + db.gross_revenue && rg.data.totals.gross_profit === da.gross_profit + db.gross_profit, 'relatorio diario de todos = soma dos relatorios de cada um', { geral: rg.data && rg.data.totals, a: da.gross_revenue, b: db.gross_revenue });
    const rm = await owner.req('GET', '/api/group/reports?period=monthly');
    ok(rm.status === 200 && typeof rm.data.totals.net_profit === 'number' && rm.data.establishments.length === 2, 'relatorio mensal de todos (com lucro liquido)', rm.status);

    const ownerCookie = { Cookie: 'token=' + signAccessToken(ctx.owner) };
    const live = await readSse('/api/group/live', ownerCookie, 1, 20000, () => sw.req('POST', '/api/sales', { items: [{ product_id: prodB.id, quantity: 1, unit_sell_price: 5000, unit_cost_price: 0 }], total_amount: 5000, payment_method: 'cash', amount_received: 5000 }));
    const ev = live.events.find((e) => e.type === 'sale');
    ok(live.status === 200 && ev && ev.data.tenant_id === bId && ev.data.establishment === ctx.tenant.name + '-B2' && ev.data.total === 5000, 'canal geral: a venda de B chega com o nome do estabelecimento', live);

    // Fora: outro dono so ve os seus; gerente, caixista e suporte recusados.
    cTenant = await prisma.tenant.create({ data: { name: ctx.tenant.name + '-C2', owner_name: 'Outro', business_type: 'bottle_store', location: 'Teste', phone: '840000007', status: 'active', onboarding_completed: true } });
    const other = await prisma.user.create({ data: { tenant_id: cTenant.id, role: 'owner', name: 'Outro Dono', email: 'outro2-' + crypto.randomBytes(4).toString('hex') + '@teste.local', password_hash: await bcrypt.hash(crypto.randomBytes(10).toString('hex'), 10), is_active: true } });
    const oc = client(signAccessToken(other));
    const ovO = await oc.req('GET', '/api/group/overview');
    ok(ovO.status === 200 && ovO.data.establishments.length === 1 && ovO.data.establishments[0].id === cTenant.id, 'outro dono: o painel geral so tem o dele', ovO.data && ovO.data.establishments.map((e) => e.id));
    const oLive = await readSse('/api/group/live', { Cookie: 'token=' + signAccessToken(other) }, 1, 6000, () => sw.req('POST', '/api/sales', { items: [{ product_id: prodB.id, quantity: 1, unit_sell_price: 5000, unit_cost_price: 0 }], total_amount: 5000, payment_method: 'cash', amount_received: 5000 }));
    ok(oLive.status === 200 && !oLive.events.some((e) => e.data.tenant_id === bId), 'outro dono: o canal geral nao traz as vendas deste');
    const mgr = await prisma.user.create({ data: { tenant_id: t, role: 'manager', name: 'Gerente 54', email: 'gerente54-' + crypto.randomBytes(4).toString('hex') + '@teste.local', password_hash: await bcrypt.hash(crypto.randomBytes(10).toString('hex'), 10), is_active: true } });
    for (const [who, c] of [['gerente', client(signAccessToken(mgr))], ['caixista', client(signAccessToken(ctx.cashier, { scope: 'pos' }))], ['suporte', client(signAccessToken(ctx.owner, { scope: 'support' }))]]) {
      ok((await c.req('GET', '/api/group/overview')).status === 403, `${who}: painel geral 403`);
    }
  } finally {
    await dropTenant(bId);
    await dropTenant(cTenant && cTenant.id);
    await prisma.auditLog.deleteMany({ where: { tenant_id: t, action: 'CREATE_ESTABLISHMENT' } });
  }
}

const TESTS = { 2: test2, 3: test3, 4: test4, 5: test5, 6: test6, 7: test7, 8: test8, 9: test9, 10: test10, 11: test11, 12: test12, 13: test13, 14: test14, 15: test15, 16: test16, 17: test17, 18: test18, 19: test19, 20: test20, 21: test21, 22: test22, 23: test23, 24: test24, 25: test25, 26: test26, 27: test27, 28: test28, 29: test29, 30: test30, 31: test31, 32: test32, 33: test33, 34: test34, 35: test35, 36: test36, 37: test37, 38: test38, 39: test39, 40: test40, 41: test41, 42: test42, 43: test43, 44: test44, 45: test45, 46: test46, 47: test47, 48: test48, 49: test49, 50: test50, 51: test51, 52: test52, 53: test53, 54: test54 };

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
