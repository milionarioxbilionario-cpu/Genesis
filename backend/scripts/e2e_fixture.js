// Dados para os testes de browser (frontend/tests/e2e). Cria uma loja
// descartavel com dono, caixista com PIN e produtos; ou apaga-a.
//   node scripts/e2e_fixture.js create <ficheiro.json> [onboarding|fecho|demo|sempin]
//   node scripts/e2e_fixture.js delete <ficheiro.json>
// Com "onboarding": loja nova, sem produtos nem custos e com o assistente por fazer.
// Fase 12.4: o dono ja tem o PIN do painel (1357), como qualquer dono depois do
// 1.o acesso; com "sempin" fica sem ele (o painel pede para o criar).
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');

async function create(file, mode) {
  const fresh = mode === 'onboarding';
  const tag = 'E2E-' + Date.now();
  const ownerPw = 'E2e-' + crypto.randomBytes(6).toString('hex');
  const tenant = await prisma.tenant.create({ data: {
    name: 'Bottle Store Central', owner_name: 'Ana Machava', business_type: 'bottle_store', location: 'Polana, Maputo',
    phone: '841234567', status: 'trial', trial_ends_at: new Date(Date.now() + 21 * 86400000), onboarding_completed: !fresh,
    discount_free_pct: 10, cancel_pin_hash: await bcrypt.hash('4321', 10), opening_time: '08:00', closing_time: '21:00',
  } });
  const owner = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'owner', name: 'Ana Machava', email: tag.toLowerCase() + '@teste.local', password_hash: await bcrypt.hash(ownerPw, 12), is_active: true, lock_pin_hash: mode === 'sempin' ? null : await bcrypt.hash('1357', 10) } });
  const cashier = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'cashier', name: 'Carlos', email: tag.toLowerCase() + '-caixa@pos.genesis.local', password_hash: await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10), pin_hash: await bcrypt.hash('2468', 10), is_active: true } });
  const out = { tenantId: tenant.id, owner: { email: owner.email, password: ownerPw }, cashier: { id: cashier.id, name: cashier.name, pin: '2468' }, authPin: '4321', lockPin: mode === 'sempin' ? null : '1357' };
  if (fresh) {
    fs.writeFileSync(file, JSON.stringify(out, null, 2));
    console.log('fixture (onboarding) criada: ' + tenant.id);
    return;
  }
  const items = [
    ['2M 340ml', 'Cervejas', 6000, 3800, 48, '6001234000017'], ['Laurentina Preta 550ml', 'Cervejas', 9500, 6000, 36, '6001234000024'],
    ['Heineken 330ml', 'Cervejas', 8500, 5500, 14, '6001234000031'], ['Coca-Cola 500ml', 'Refrigerantes', 4500, 2800, 60, '6001234000048'],
    ['Água Namaacha 1,5L', 'Águas', 4000, 2200, 8, '6001234000055'], ['Sumol Laranja 330ml', 'Refrigerantes', 3500, 2000, 40, null],
  ];
  for (const [name, category, sell, cost, stock, barcode] of items) {
    await prisma.product.create({ data: { tenant_id: tenant.id, name, category, sell_price: sell, cost_price: cost, stock_qty: stock, min_stock: 12, barcode, is_active: true } });
  }
  await prisma.fixedCost.create({ data: { tenant_id: tenant.id, description: 'Renda do contentor', amount: 1500000, type: 'rent' } });
  await prisma.employee.create({ data: { tenant_id: tenant.id, name: 'Joana Cossa', role: 'Ajudante', monthly_salary: 800000, start_date: new Date('2026-03-01'), is_active: true } });
  await prisma.debt.create({ data: { tenant_id: tenant.id, debtor_name: 'Sr. Mabunda', debtor_phone: '845556677', total_amount: 250000, amount_paid: 50000, due_date: new Date(Date.now() - 2 * 86400000), status: 'partially_paid', created_by: owner.id } });
  if (mode === 'demo') await addDemoData(tenant.id, owner.id, cashier.id);
  if (mode === 'fecho') {
    // Loja "antiga" (criada ha 2 meses) com uma venda no ultimo dia do mes
    // passado: 30 x Agua (stock 8) -> o fecho do mes aparece e sugere comprar.
    const now = new Date();
    await prisma.tenant.update({ where: { id: tenant.id }, data: { created_at: new Date(now.getFullYear(), now.getMonth() - 2, 10) } });
    const agua = await prisma.product.findFirst({ where: { tenant_id: tenant.id, name: 'Água Namaacha 1,5L' } });
    await prisma.sale.create({ data: {
      tenant_id: tenant.id, cashier_user_id: cashier.id, total_amount: 30 * agua.sell_price, total_cost: 30 * agua.cost_price,
      payment_method: 'cash', amount_received: 30 * agua.sell_price, change_given: 0, status: 'completed', daily_number: 1,
      created_at: new Date(now.getFullYear(), now.getMonth(), 0, 12),
      items: { create: [{ product_id: agua.id, product_name: agua.name, quantity: 30, unit_sell_price: agua.sell_price, unit_cost_price: agua.cost_price }] },
    } });
  }
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log('fixture criada: ' + tenant.id);
}

// Modo "demo" (Fase 11.3): loja com aspecto real para as capturas do site
// publico (frontend/scripts/capturas_site.mjs) — mais produtos, lotes com
// validade, vendas do mes ate agora, meta, fornecedor e txenekas. Apagada no fim
// como qualquer outra loja de teste. Aleatorio com semente: sempre igual.
async function addDemoData(tenantId, ownerId, cashierId) {
  let seed = 20261024;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  await prisma.tenant.update({ where: { id: tenantId }, data: { name: 'Bottle Store Exemplo', location: 'Malhangalene, Maputo', status: 'active', trial_ends_at: null } });
  const day = 86400000;
  const extra = [
    ['Castle Lager 340ml', 'Cervejas', 6500, 4100, 72, '6001234000062', null], ['Manica 550ml', 'Cervejas', 9000, 5800, 30, '6001234000079', null],
    ['Savanna Dry 330ml', 'Sidras', 11000, 7200, 24, '6001234000086', null], ['Red Bull 250ml', 'Energéticos', 12000, 8000, 18, '6001234000093', 120],
    ['Compal Pêssego 1L', 'Sumos', 9000, 5600, 16, '6001234000109', 5], ['Fanta Laranja 500ml', 'Refrigerantes', 4500, 2800, 42, '6001234000116', null],
    ['Tipo Tinto 750ml', 'Vinhos', 45000, 30000, 10, '6001234000123', null], ['Gelo 2kg', 'Outros', 5000, 2000, 25, null, null],
  ];
  for (const [name, category, sell, cost, stock, barcode] of extra) {
    await prisma.product.create({ data: { tenant_id: tenantId, name, category, sell_price: sell, cost_price: cost, stock_qty: stock, min_stock: 12, barcode, is_active: true } });
  }
  const products = await prisma.product.findMany({ where: { tenant_id: tenantId } });
  // Lotes: stock = soma dos lotes; alguns com validade (um a 5 dias -> alerta).
  const expiryDays = Object.fromEntries(extra.map((e) => [e[0], e[6]]));
  for (const p of products) {
    const d = expiryDays[p.name];
    await prisma.stockLot.create({ data: { tenant_id: tenantId, product_id: p.id, quantity_remaining: p.stock_qty, unit_cost: p.cost_price, expiry_date: d ? new Date(Date.now() + d * day) : null } });
    if (d) await prisma.product.update({ where: { id: p.id }, data: { has_expiry: true } });
  }
  await prisma.supplier.create({ data: { tenant_id: tenantId, name: 'Distribuidora da Matola', phone: '847001122', delivery_cost_per_visit: 50000 } });
  await prisma.debt.create({ data: { tenant_id: tenantId, debtor_name: 'Dona Celeste', debtor_phone: '823334455', total_amount: 180000, amount_paid: 0, due_date: new Date(Date.now() + 3 * day), status: 'pending', created_by: ownerId } });
  // Vendas do dia 1 do mes ate agora, entre as 09:00 e as 21:00 (ou a hora actual).
  const now = new Date();
  const sales = []; const items = [];
  let monthTotal = 0;
  for (let d = 1; d <= now.getDate(); d++) {
    const n = 7 + Math.floor(rnd() * 8) + (new Date(now.getFullYear(), now.getMonth(), d).getDay() >= 5 ? 5 : 0);
    let num = 0;
    for (let i = 0; i < n; i++) {
      const at = new Date(now.getFullYear(), now.getMonth(), d, 9 + Math.floor(rnd() * 12), Math.floor(rnd() * 60));
      if (at > now) continue;
      const id = crypto.randomUUID();
      const lines = []; let total = 0; let cost = 0;
      const k = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < k; j++) {
        const p = pick(products); const q = 1 + Math.floor(rnd() * (p.sell_price < 6000 ? 6 : 3));
        lines.push({ id: crypto.randomUUID(), sale_id: id, product_id: p.id, product_name: p.name, quantity: q, unit_sell_price: p.sell_price, unit_cost_price: p.cost_price });
        total += q * p.sell_price; cost += q * p.cost_price;
      }
      const r = rnd(); const method = r < 0.55 ? 'cash' : r < 0.8 ? 'mpesa' : r < 0.92 ? 'emola' : 'card';
      const received = method === 'cash' ? Math.ceil(total / 10000) * 10000 : total;
      sales.push({ id, tenant_id: tenantId, cashier_user_id: cashierId, total_amount: total, total_cost: cost, payment_method: method, amount_received: received, change_given: received - total, status: 'completed', daily_number: ++num, created_at: at });
      items.push(...lines);
      monthTotal += total;
    }
  }
  await prisma.sale.createMany({ data: sales });
  await prisma.saleItem.createMany({ data: items });
  // Meta do mes um pouco acima do ritmo actual (a barra fica a meio caminho).
  const target = Math.round((monthTotal / now.getDate()) * 31 * 1.1 / 100000) * 100000;
  await prisma.saleGoal.create({ data: { tenant_id: tenantId, month: now.getMonth() + 1, year: now.getFullYear(), target_amount: target } });
  console.log(`demo: ${products.length} produtos, ${sales.length} vendas, meta ${target / 100} MT`);
}

async function remove(file) {
  const { tenantId: t } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const userIds = (await prisma.user.findMany({ where: { tenant_id: t }, select: { id: true } })).map((u) => u.id);
  const saleIds = (await prisma.sale.findMany({ where: { tenant_id: t }, select: { id: true } })).map((s) => s.id);
  const debtIds = (await prisma.debt.findMany({ where: { tenant_id: t }, select: { id: true } })).map((d) => d.id);
  await prisma.salePayment.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.saleItem.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.sale.deleteMany({ where: { tenant_id: t } });
  await prisma.debtPayment.deleteMany({ where: { debt_id: { in: debtIds } } });
  await prisma.debt.deleteMany({ where: { tenant_id: t } });
  for (const m of ['stockLot', 'stockEntry', 'shrinkageRecord', 'demandCapture', 'shiftClosing', 'productPriceHistory', 'fixedCost', 'employee', 'saleGoal', 'posTerminal', 'supplier', 'expense', 'shoppingListItem', 'shoppingList', 'catalogSuggestion', 'webAuthnCredential']) {
    await prisma[m].deleteMany({ where: { tenant_id: t } });
  }
  await prisma.auditLog.deleteMany({ where: { OR: [{ tenant_id: t }, { user_id: { in: userIds } }, { entity_id: t }] } });
  await prisma.product.deleteMany({ where: { tenant_id: t } });
  await prisma.user.deleteMany({ where: { tenant_id: t } });
  await prisma.tenant.delete({ where: { id: t } });
  // Produtos de teste que o admin acrescentou ao catalogo-mestre levam o
  // prefixo do id da loja no nome (tests/e2e/fase8_2.mjs).
  const mc = await prisma.masterCatalog.deleteMany({ where: { product_name: { contains: t.slice(0, 8) } } });
  console.log('fixture apagada: ' + t + (mc.count ? ' (+' + mc.count + ' no catalogo-mestre)' : ''));
}

(async () => {
  await prisma.ready();
  const [cmd, file, mode] = process.argv.slice(2);
  if (cmd === 'create') await create(file, mode);
  else if (cmd === 'delete') await remove(file);
  else throw new Error('uso: create|delete <ficheiro.json>');
  process.exit(0);
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
