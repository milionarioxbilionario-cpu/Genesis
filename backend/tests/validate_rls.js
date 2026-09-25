const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRLS() {
  console.log('--- Iniciando Teste de Validação de RLS ---');

  try {
    // 1. Criar dois Tenants de teste
    const tenantA = await prisma.tenant.create({
      data: {
        name: 'Loja A',
        owner_name: 'Dono A',
        business_type: 'bottle_store',
        location: 'Maputo',
        phone: '840000001',
        email: 'lojaa@test.com'
      }
    });

    const tenantB = await prisma.tenant.create({
      data: {
        name: 'Loja B',
        owner_name: 'Dono B',
        business_type: 'mercearia',
        location: 'Matola',
        phone: '840000002',
        email: 'lojab@test.com'
      }
    });

    console.log(`Tenants criados: A(${tenantA.id}), B(${tenantB.id})`);

    // 2. Criar um produto para cada tenant
    await prisma.product.create({
      data: {
        name: 'Cerveja 2M',
        category: 'Bebidas',
        cost_price: 5000,
        sell_price: 7000,
        tenant_id: tenantA.id
      }
    });

    await prisma.product.create({
      data: {
        name: 'Arroz 1kg',
        category: 'Mercearia',
        cost_price: 4000,
        sell_price: 6000,
        tenant_id: tenantB.id
      }
    });

    console.log('Produtos criados para ambos os tenants.');

    // 3. Testar isolamento via SQL Raw (simulando o que o middleware fará)
    console.log('Testando isolamento para Tenant A...');
    
    // No Prisma, o RLS exige que a transação mantenha a variável de sessão
    const resultA = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET app.tenant_id = '${tenantA.id}'`);
      return await tx.product.findMany();
    });

    console.log(`Produtos visíveis para Tenant A: ${resultA.length}`);
    resultA.forEach(p => console.log(`- ${p.name} (Tenant: ${p.tenant_id})`));

    const isIsolatedA = resultA.length === 1 && resultA[0].tenant_id === tenantA.id;

    console.log('Testando isolamento para Tenant B...');
    const resultB = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET app.tenant_id = '${tenantB.id}'`);
      return await tx.product.findMany();
    });

    console.log(`Produtos visíveis para Tenant B: ${resultB.length}`);
    resultB.forEach(p => console.log(`- ${p.name} (Tenant: ${p.tenant_id})`));

    const isIsolatedB = resultB.length === 1 && resultB[0].tenant_id === tenantB.id;

    if (isIsolatedA && isIsolatedB) {
      console.log('✅ SUCESSO: O RLS está a isolar os dados correctamente!');
    } else {
      console.error('❌ ERRO: O RLS falhou! Um tenant conseguiu ver dados do outro.');
    }

  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRLS();
