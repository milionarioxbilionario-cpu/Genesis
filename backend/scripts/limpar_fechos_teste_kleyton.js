// Limpeza pedida pelo fundador (10/10/2026): fechos de turno de TESTE da loja
// "Loja de Kleyton". As vendas ficam. Para as vendas antigas (06/10 e 10/10)
// nao voltarem a entrar no esperado, cada caixista recomeca o turno agora
// (SHIFT_OPENED em nome do dono). A auditoria e append-only por desenho: esta
// excepcao fica registada no Mapa Mental.
//   node scripts/limpar_fechos_teste_kleyton.js            -> so mostra
//   node scripts/limpar_fechos_teste_kleyton.js --aplicar  -> apaga
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TENANT = 'd3b2b17b-5365-410e-8918-0ddd2ec289c8';
const ACTIONS = ['SHIFT_ATTEMPT_FAIL', 'CASHIER_LOCKED', 'CASHIER_UNLOCKED', 'SHIFT_CLOSING_OK', 'SHIFT_OPENED', 'SHIFT_OPEN_PIN_FAIL'];

(async () => {
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
  const apply = process.argv.includes('--aplicar');
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: TENANT }, select: { name: true } });
    if (!tenant) throw new Error('loja nao encontrada');
    const owner = await prisma.user.findFirst({ where: { tenant_id: TENANT, role: 'owner' }, select: { id: true, name: true } });
    const cashiers = await prisma.user.findMany({ where: { tenant_id: TENANT, role: 'cashier' }, select: { id: true, name: true } });
    const closings = await prisma.shiftClosing.count({ where: { tenant_id: TENANT } });
    const audits = await prisma.auditLog.count({ where: { tenant_id: TENANT, action: { in: ACTIONS } } });
    const sales = await prisma.sale.count({ where: { tenant_id: TENANT } });
    console.log(`Loja: ${tenant.name} | dono: ${owner?.name} | caixistas: ${cashiers.map((c) => c.name).join(', ')}`);
    console.log(`A apagar: ${closings} fecho(s) de turno, ${audits} registo(s) de auditoria de turno. Ficam: ${sales} venda(s).`);
    if (!apply) { console.log('(nada apagado — use --aplicar)'); return; }
    // Hora da BD, nao a deste PC: o relogio do PC ja esteve atrasado (10/10: 63 min)
    // e o recomeco ficava antes de vendas reais, que voltavam a contar.
    const [{ now }] = await prisma.$queryRaw`select now() as now`;
    await prisma.$transaction(async (tx) => {
      await tx.shiftClosing.deleteMany({ where: { tenant_id: TENANT } });
      await tx.auditLog.deleteMany({ where: { tenant_id: TENANT, action: { in: ACTIONS } } });
      for (const c of cashiers) {
        await tx.auditLog.create({ data: {
          tenant_id: TENANT, user_id: owner.id, action: 'SHIFT_OPENED', entity_type: 'user', entity_id: c.id,
          new_value: JSON.stringify({ cashierName: c.name, auto: true, motivo: 'limpeza dos fechos de teste pedida pelo fundador (10/10/2026)' }),
          ip_address: '0.0.0.0', created_at: now,
        } });
      }
    });
    const left = await prisma.shiftClosing.count({ where: { tenant_id: TENANT } });
    const opened = await prisma.auditLog.count({ where: { tenant_id: TENANT, action: 'SHIFT_OPENED' } });
    console.log(`Feito: fechos restantes ${left}; turnos recomecados ${opened}; vendas ${await prisma.sale.count({ where: { tenant_id: TENANT } })}.`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error('ERRO: ' + e.message); process.exit(1); });
