// ===========================================================================
// TESTE REAL DE VENDA (B1) — confirma se o POST /api/sales grava de verdade.
// Uso: node scripts/_teste_venda.js
//
// Faz uma venda de 1 unidade, verifica na base de dados que a venda existe e
// que o stock baixou, e no fim APAGA tudo e devolve o stock ao valor original.
// Nao deixa lixo. Se falhar a meio, o cleanup corre na mesma.
// ===========================================================================
require('dotenv').config();
const prisma = require('../src/utils/prisma');

const BASE = process.env.BASE_URL || 'http://localhost:4000';

const linha = (t) => console.log('\n=== ' + t + ' ===');
const ok = (m) => console.log('  OK    ' + m);
const mal = (m) => console.log('  FALHA ' + m);

let cookie = null;
let criadaId = null;
let produtoId = null;
let stockAntes = null;

async function pedir(rota, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  const r = await fetch(BASE + rota, { ...opcoes, headers });
  const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  if (set.length) cookie = set.map((c) => c.split(';')[0]).join('; ');
  let corpo = null;
  try { corpo = await r.json(); } catch (e) { corpo = null; }
  return { status: r.status, corpo };
}

(async () => {
  // -------------------------------------------------------------------------
  linha('1. Sessao de teste (sem tocar em senhas)');
  // Em vez de fazer login (que gasta tentativas do rate limiter e obrigaria a
  // saber a senha atual), assinamos um JWT exatamente como o signUserToken do
  // auth.js faz. E a mesma coisa que o servidor emite depois de um login bom.
  const jwt = require('jsonwebtoken');
  const dono = await prisma.user.findUnique({
    where: { email: 'owner@genesis.local' },
    select: { id: true, tenant_id: true, role: true, name: true, is_active: true }
  });
  if (!dono) { mal('owner@genesis.local nao existe'); process.exit(1); }
  if (!dono.is_active) { mal('conta do owner esta inactiva'); process.exit(1); }

  const token = jwt.sign(
    { userId: dono.id, tenantId: dono.tenant_id, role: dono.role, name: dono.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '12h' }
  );
  cookie = 'token=' + token;
  ok('token de sessao emitido para ' + dono.role + ' (tenant ' + String(dono.tenant_id).slice(0, 8) + '...)');

  const euMimo = await pedir('/api/auth/me');
  if (euMimo.status !== 200) {
    mal('/api/auth/me devolveu ' + euMimo.status + ' -> ' + JSON.stringify(euMimo.corpo));
    process.exit(1);
  }
  ok('/api/auth/me confirmou a sessao');

  // -------------------------------------------------------------------------
  linha('2. Escolher um produto com stock');
  const prods = await pedir('/api/products');
  const lista = Array.isArray(prods.corpo) ? prods.corpo : (prods.corpo && prods.corpo.products) || [];
  const p = lista.find((x) => Number(x.stock_qty) >= 2 && x.is_active !== false);
  if (!p) { mal('nao ha produto com stock >= 2 (total ' + lista.length + ')'); process.exit(1); }
  produtoId = p.id;
  stockAntes = Number(p.stock_qty);
  ok('produto: ' + p.name + ' | stock=' + stockAntes + ' | preco=' + p.sell_price + ' centavos');

  // -------------------------------------------------------------------------
  linha('3. POST /api/sales  (o teste que decide tudo)');
  const payload = {
    items: [{
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      unit_sell_price: Number(p.sell_price),
      unit_cost_price: Number(p.cost_price)
    }],
    discount_amount: 0,
    total_amount: Number(p.sell_price),
    total_cost: Number(p.cost_price),
    payment_method: 'cash',
    amount_received: Number(p.sell_price),
    change_given: 0,
    status: 'completed',
    created_at: new Date().toISOString()
  };
  const venda = await pedir('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
  console.log('  HTTP ' + venda.status);
  console.log('  resposta: ' + JSON.stringify(venda.corpo));
  if (venda.status !== 200 && venda.status !== 201) {
    mal('A VENDA FALHOU. Este e o bug B1.');
  } else {
    ok('a venda foi aceite');
    criadaId = venda.corpo && venda.corpo.id;
    if (venda.corpo && venda.corpo.daily_number) ok('daily_number = ' + venda.corpo.daily_number);
    else mal('sem daily_number na resposta');
  }

  // -------------------------------------------------------------------------
  linha('4. Confirmar na base de dados');
  if (criadaId) {
    const naBd = await prisma.sale.findUnique({
      where: { id: criadaId },
      include: { items: true }
    });
    if (naBd) {
      ok('venda existe na BD | total=' + naBd.total_amount + ' | daily_number=' + naBd.daily_number);
      ok('itens: ' + naBd.items.length);
    } else {
      mal('a venda NAO esta na base de dados');
    }
  }
  const depois = produtoId
    ? await prisma.product.findUnique({ where: { id: produtoId }, select: { stock_qty: true } })
    : null;
  if (depois) {
    const esperado = criadaId ? stockAntes - 1 : stockAntes;
    if (Number(depois.stock_qty) === esperado) ok('stock ' + stockAntes + ' -> ' + depois.stock_qty + ' (correcto)');
    else mal('stock ' + stockAntes + ' -> ' + depois.stock_qty + ' (esperado ' + esperado + ')');
  }

  // -------------------------------------------------------------------------
  linha('5. Limpeza (desfazer o teste)');
  if (criadaId) {
    await prisma.saleItem.deleteMany({ where: { sale_id: criadaId } }).catch(() => {});
    await prisma.sale.delete({ where: { id: criadaId } }).catch((e) => console.log('  aviso: ' + e.message));
    console.log('  venda de teste apagada');
  }
  if (produtoId && criadaId) {
    await prisma.product.update({ where: { id: produtoId }, data: { stock_qty: stockAntes } });
    console.log('  stock devolvido a ' + stockAntes);
  }
  console.log('\nFIM');
  process.exit(0);
})().catch(async (e) => {
  console.log('\nERRO GERAL: ' + e.message);
  if (criadaId) {
    await prisma.saleItem.deleteMany({ where: { sale_id: criadaId } }).catch(() => {});
    await prisma.sale.delete({ where: { id: criadaId } }).catch(() => {});
    if (produtoId && stockAntes !== null) {
      await prisma.product.update({ where: { id: produtoId }, data: { stock_qty: stockAntes } }).catch(() => {});
    }
    console.log('(limpeza feita)');
  }
  process.exit(1);
});
