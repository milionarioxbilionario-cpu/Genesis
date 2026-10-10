// Dados para os testes de browser (frontend/tests/e2e). Cria uma loja
// descartavel com dono, caixista com PIN e produtos; ou apaga-a.
//   node scripts/e2e_fixture.js create <ficheiro.json> [onboarding]
//   node scripts/e2e_fixture.js delete <ficheiro.json>
// Com "onboarding": loja nova, sem produtos nem custos e com o assistente por fazer.
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
  const owner = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'owner', name: 'Ana Machava', email: tag.toLowerCase() + '@teste.local', password_hash: await bcrypt.hash(ownerPw, 12), is_active: true } });
  const cashier = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'cashier', name: 'Carlos', email: tag.toLowerCase() + '-caixa@pos.genesis.local', password_hash: await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10), pin_hash: await bcrypt.hash('2468', 10), is_active: true } });
  const out = { tenantId: tenant.id, owner: { email: owner.email, password: ownerPw }, cashier: { id: cashier.id, name: cashier.name, pin: '2468' }, authPin: '4321' };
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

async function remove(file) {
  const { tenantId: t } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const userIds = (await prisma.user.findMany({ where: { tenant_id: t }, select: { id: true } })).map((u) => u.id);
  const saleIds = (await prisma.sale.findMany({ where: { tenant_id: t }, select: { id: true } })).map((s) => s.id);
  const debtIds = (await prisma.debt.findMany({ where: { tenant_id: t }, select: { id: true } })).map((d) => d.id);
  await prisma.saleItem.deleteMany({ where: { sale_id: { in: saleIds } } });
  await prisma.sale.deleteMany({ where: { tenant_id: t } });
  await prisma.debtPayment.deleteMany({ where: { debt_id: { in: debtIds } } });
  await prisma.debt.deleteMany({ where: { tenant_id: t } });
  for (const m of ['stockLot', 'stockEntry', 'shrinkageRecord', 'demandCapture', 'shiftClosing', 'productPriceHistory', 'fixedCost', 'employee', 'saleGoal', 'posTerminal', 'supplier', 'expense', 'shoppingListItem', 'shoppingList', 'catalogSuggestion']) {
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
