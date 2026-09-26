// Teste de seguranca do fecho de turno (POST /api/shift_closings).
//
// BUG QUE ESTE TESTE IMPEDE DE VOLTAR:
//   A rota aceitava `expected_amount` DO CORPO DO PEDIDO e estava montada com
//   requireRole('owner','cashier'). Um caixista podia gravar um fecho oficial
//   com o `difference` que quisesse, contornando o fecho cego do POS. Era a
//   causa do "permite fechar o turno abaixo do que foi vendido hoje".
//
// O que se prova aqui:
//   1. Caixista NAO consegue usar a rota (403) — o fecho dele e o
//      /api/owner/cashiers/:id/close-shift-blind, validado pelo dono.
//   2. Dono a declarar MENOS do que a gaveta tinha -> 400, e NENHUM fecho fica
//      gravado (antes disto gravava!).
//   3. `expected_amount` enviado pelo cliente e IGNORADO por completo.
//   4. Declarar o valor certo -> 201, com o esperado calculado pelo servidor.
//   5. A tentativa falhada fica em auditoria (SHIFT_ATTEMPT_FAIL).
//
// Executar (backend a correr):  node scripts/shift_closing_e2e.js
// ENV: API_BASE=http://localhost:4020 FORCE_DB=sqlite
//
// Cria o seu proprio tenant e limpa-o no fim. Nao depende de contas demo.

require('dotenv').config();
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const { prepareDatabase } = require('../src/utils/dbEngine2');

const API_BASE = process.env.API_BASE || 'http://localhost:4000';

let pass = 0;
let fail = 0;
const failures = [];

function ok(name) { console.log(`  PASS  ${name}`); pass += 1; }
function bad(name, detail) {
  console.log(`  FAIL  ${name} -> ${detail}`);
  failures.push(`${name}: ${detail}`);
  fail += 1;
}
function assert(name, cond, detail) {
  if (cond) ok(name); else bad(name, detail || 'condicao falsa');
}

async function waitForServer(timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${API_BASE}/`);
      if (res.ok) return true;
    } catch (e) { /* ainda a arrancar */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Servidor nao ficou pronto a tempo em ' + API_BASE);
}

const api = (path, { method = 'GET', token, body } = {}) => fetch(`${API_BASE}${path}`, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

async function main() {
  console.log('\n=== Fecho de turno: guarda de seguranca ===\n');

  // A base de dados e escolhida pelo mesmo motor que o servidor usa.
  const prisma = require('../src/utils/prisma');
  await prisma.ready();

  const stamp = Date.now();
  const password = 'Pass123!';
  const ids = { tenant: null };

  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: `Guard Teste ${stamp}`, owner_name: 'Owner Guard',
        business_type: 'mercearia', location: 'Loc', phone: '+000', status: 'trial',
      },
    });
    ids.tenant = tenant.id;

    const hash = await bcrypt.hash(password, 12);
    const owner = await prisma.user.create({
      data: { tenant_id: tenant.id, role: 'owner', name: 'Owner Guard', email: `owner.guard.${stamp}@example.test`, password_hash: hash, is_active: true },
    });
    const cashier = await prisma.user.create({
      data: { tenant_id: tenant.id, role: 'cashier', name: 'Cashier Guard', email: `cashier.guard.${stamp}@example.test`, password_hash: hash, is_active: true },
    });

    const product = await prisma.product.create({
      data: { tenant_id: tenant.id, name: 'Produto Guard', category: 'geral', sell_price: 1000, cost_price: 500, stock_qty: 50, min_stock: 1, is_active: true },
    });

    await waitForServer();

    const ownerLogin = await api('/api/auth/login', { method: 'POST', body: { email: `owner.guard.${stamp}@example.test`, password } });
    const ownerJson = await ownerLogin.json();
    if (!ownerLogin.ok) throw new Error('login do dono falhou: ' + JSON.stringify(ownerJson));

    const cashierLogin = await api('/api/auth/login', { method: 'POST', body: { email: `cashier.guard.${stamp}@example.test`, password } });
    const cashierJson = await cashierLogin.json();
    if (!cashierLogin.ok) throw new Error('login do caixista falhou: ' + JSON.stringify(cashierJson));

    const ownerToken = ownerJson.token;
    const cashierToken = cashierJson.token;

    // Venda em DINHEIRO de 5000 centavos (50,00 MZN), feita pelo caixista.
    const saleRes = await api('/api/sales', {
      method: 'POST', token: cashierToken,
      body: {
        items: [{ product_id: product.id, product_name: 'Produto Guard', quantity: 5, unit_sell_price: 1000, unit_cost_price: 500 }],
        total_amount: 5000, total_cost: 2500, payment_method: 'cash', amount_received: 5000,
      },
    });
    const saleJson = await saleRes.json();
    if (!saleRes.ok) throw new Error('venda falhou: ' + JSON.stringify(saleJson));

    const CASH = 5000;
    console.log(`\n  (venda em dinheiro de ${CASH} centavos registada)\n`);

    // 1) Caixista nao entra nesta rota.
    const cashierAttempt = await api('/api/shift_closings', {
      method: 'POST', token: cashierToken, body: { counted_amount: CASH },
    });
    assert('caixista recebe 403 (rota so para o dono)', cashierAttempt.status === 403,
      `status ${cashierAttempt.status}`);

    // 2) Abaixo do esperado e RECUSADO e nada e gravado.
    const below = await api('/api/shift_closings', {
      method: 'POST', token: ownerToken, body: { counted_amount: CASH - 1, cashier_user_id: cashier.id },
    });
    const belowJson = await below.json();
    assert('declarar MENOS do que a gaveta e recusado (400)', below.status === 400,
      `status ${below.status} ${JSON.stringify(belowJson)}`);
    assert('resposta identifica COUNTED_BELOW_EXPECTED', belowJson.code === 'COUNTED_BELOW_EXPECTED',
      JSON.stringify(belowJson));

    const closingsAfterBelow = await prisma.shiftClosing.count({
      where: { tenant_id: tenant.id, cashier_user_id: cashier.id },
    });
    assert('NENHUM fecho gravado com valor abaixo', closingsAfterBelow === 0,
      `encontrados ${closingsAfterBelow} fechos`);

    // 3) `expected_amount` do cliente e ignorado por completo.
    const spoof = await api('/api/shift_closings', {
      method: 'POST', token: ownerToken,
      body: { counted_amount: 1, expected_amount: 0, cashier_user_id: cashier.id },
    });
    const spoofJson = await spoof.json();
    assert('expected_amount forjado nao ilude a validacao', spoof.status === 400,
      `status ${spoof.status} ${JSON.stringify(spoofJson)}`);

    // 4) Valor certo e aceite.
    const good = await api('/api/shift_closings', {
      method: 'POST', token: ownerToken, body: { counted_amount: CASH, cashier_user_id: cashier.id },
    });
    const goodJson = await good.json();
    assert('declarar o valor certo e aceite (201)', good.status === 201,
      `status ${good.status} ${JSON.stringify(goodJson)}`);
    assert('esperado calculado pelo SERVIDOR', goodJson.expected_amount === CASH,
      `expected_amount=${goodJson.expected_amount}, esperado ${CASH}`);
    assert('difference zero quando a contagem bate certo', goodJson.difference === 0,
      `difference=${goodJson.difference}`);
    assert('total vendido do dia devolvido ao dono', goodJson.total_sold_today === CASH,
      `total_sold_today=${goodJson.total_sold_today}`);

    // 5) Auditoria.
    const failLogs = await prisma.auditLog.count({
      where: { tenant_id: tenant.id, action: 'SHIFT_ATTEMPT_FAIL', entity_id: cashier.id },
    });
    assert('tentativas falhadas em auditoria (2)', failLogs === 2, `encontrados ${failLogs}`);

    const okLogs = await prisma.auditLog.count({
      where: { tenant_id: tenant.id, action: 'SHIFT_CLOSING' },
    });
    assert('fecho aceite em auditoria', okLogs === 1, `encontrados ${okLogs}`);

    // 6) Depois de fechar, contagem abaixo continua recusada.
    const afterClose = await api('/api/shift_closings', {
      method: 'POST', token: ownerToken, body: { counted_amount: CASH - 1, cashier_user_id: cashier.id },
    });
    assert('nova contagem abaixo continua recusada', afterClose.status === 400,
      `status ${afterClose.status}`);
  } finally {
    if (ids.tenant) {
      await prisma.saleItem.deleteMany({ where: { sale: { tenant_id: ids.tenant } } }).catch(() => {});
      await prisma.sale.deleteMany({ where: { tenant_id: ids.tenant } }).catch(() => {});
      await prisma.shiftClosing.deleteMany({ where: { tenant_id: ids.tenant } }).catch(() => {});
      await prisma.product.deleteMany({ where: { tenant_id: ids.tenant } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { tenant_id: ids.tenant } }).catch(() => {});
      await prisma.user.deleteMany({ where: { tenant_id: ids.tenant } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: ids.tenant } }).catch(() => {});
    }
    console.log('\n  (limpeza concluida)\n');
  }

  console.log(`=== Resultado: ${pass} passaram, ${fail} falharam ===\n`);
  if (fail > 0) failures.forEach((f) => console.log(' - ' + f));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\nTeste falhou ao correr:', err.message || err);
  process.exit(1);
});

