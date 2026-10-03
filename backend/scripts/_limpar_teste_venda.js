// Limpeza da venda de teste do B1.
//
// PORQUE E QUE ISTO PRECISA DE UM SCRIPT PROPRIO: a primeira tentativa de
// limpeza usou prisma.sale.delete() diretamente, SEM contexto de tenant, e o
// RLS bloqueou-a em silencio. O mesmo applyTenantRls que a app usa e obrigatorio
// aqui tambem. (Boa noticia: prova que as politicas de RLS estao activas.)
//
// Uso: node scripts/_limpar_teste_venda.js
require('dotenv').config();
const prisma = require('../src/utils/prisma');
const { applyTenantRls } = require('../src/utils/tenantRls');

const TENANT = '44444444-4444-4444-4444-444444444444';

(async () => {
  // A venda de teste: criada hoje, na loja demo, com o valor do produto de teste.
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);

  const candidatas = await prisma.sale.findMany({
    where: { tenant_id: TENANT, created_at: { gte: inicio } },
    include: { items: true },
    orderBy: { created_at: 'desc' }
  });

  console.log('vendas de hoje na loja demo: ' + candidatas.length);
  candidatas.forEach((s) => console.log('  ' + s.id + ' | n' + s.daily_number +
    ' | ' + s.total_amount + ' | ' + s.created_at.toISOString() + ' | itens=' + s.items.length));

  const alvo = candidatas.find((s) => s.total_amount === 12550 && s.items.length === 1);
  if (!alvo) {
    console.log('\nNada para limpar (nao encontrei a venda de teste).');
    process.exit(0);
  }

  const produtoId = alvo.items[0].product_id;
  const qtd = alvo.items[0].quantity;
  console.log('\nA limpar venda ' + alvo.id + ' (devolver ' + qtd + ' unidade(s) ao stock)...');

  await prisma.$transaction(async (tx) => {
    await applyTenantRls(tx, TENANT);
    await tx.saleItem.deleteMany({ where: { sale_id: alvo.id } });
    await tx.sale.delete({ where: { id: alvo.id } });
    const p = await tx.product.findUnique({ where: { id: produtoId }, select: { stock_qty: true, name: true } });
    if (p) {
      await tx.product.update({ where: { id: produtoId }, data: { stock_qty: p.stock_qty + qtd } });
      console.log('  stock de "' + p.name + '": ' + p.stock_qty + ' -> ' + (p.stock_qty + qtd));
    }
  });

  console.log('  venda apagada');

  const restam = await prisma.sale.count({ where: { tenant_id: TENANT, created_at: { gte: inicio } } });
  console.log('\nvendas de hoje apos limpeza: ' + restam);
  process.exit(0);
})().catch((e) => { console.log('ERRO: ' + e.message); process.exit(1); });
