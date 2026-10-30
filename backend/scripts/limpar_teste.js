// Apaga uma loja de teste deixada por uma corrida interrompida do verify_system
// (so lojas «TESTE-SEGURANCA-*»; os mesmos passos da limpeza do proprio script).
//   node scripts/limpar_teste.js <tenant_id>
require('dotenv').config();
const prisma = require('../src/utils/prisma');

(async () => {
  await prisma.ready();
  const id = process.argv[2];
  const tenant = id && await prisma.tenant.findUnique({ where: { id } });
  if (!tenant || !tenant.name.startsWith('TESTE-SEGURANCA-')) { console.log('Nao e uma loja de teste: nada apagado.'); process.exit(1); }
  const t = tenant.id;
  const admins = await prisma.user.findMany({ where: { tenant_id: null, email: tenant.name.toLowerCase() + '-admin@teste.local' }, select: { id: true } });
  const userIds = [...(await prisma.user.findMany({ where: { tenant_id: t }, select: { id: true } })), ...admins].map((u) => u.id);
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
  console.log('apagada: ' + tenant.name + ' (' + userIds.length + ' contas)');
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
