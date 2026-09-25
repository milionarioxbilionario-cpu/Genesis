const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Inserting test tenants and products...');
    await prisma.$executeRawUnsafe(`INSERT INTO "Tenant" (id, name, owner_name, business_type, location, phone, status)
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'Tenant A', 'Owner A', 'mercearia', 'Zona A', '+258111', 'active')
      ON CONFLICT (id) DO NOTHING;`);

    await prisma.$executeRawUnsafe(`INSERT INTO "Tenant" (id, name, owner_name, business_type, location, phone, status)
      VALUES
        ('22222222-2222-2222-2222-222222222222', 'Tenant B', 'Owner B', 'padaria', 'Zona B', '+258222', 'active')
      ON CONFLICT (id) DO NOTHING;`);

    await prisma.$executeRawUnsafe(`INSERT INTO "Product" (id, tenant_id, name, category, sell_price, cost_price, stock_qty)
      VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','Arroz Mariana 1kg','mercearia', 150000, 120000, 10)
      ON CONFLICT (id) DO NOTHING;`);

    await prisma.$executeRawUnsafe(`INSERT INTO "Product" (id, tenant_id, name, category, sell_price, cost_price, stock_qty)
      VALUES
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222','Pao de forma','padaria', 50000, 30000, 20)
      ON CONFLICT (id) DO NOTHING;`);

    console.log('\nQuerying as Tenant A (setting app.tenant_id to Tenant A)');
    await prisma.$executeRawUnsafe(`SET app.tenant_id = '11111111-1111-1111-1111-111111111111';`);
    const productsA = await prisma.$queryRawUnsafe(`SELECT id, tenant_id, name, sell_price FROM "Product" ORDER BY id;`);
    console.log('Products visible to Tenant A:');
    console.table(productsA);

    console.log('\nQuerying as Tenant B (setting app.tenant_id to Tenant B)');
    await prisma.$executeRawUnsafe(`SET app.tenant_id = '22222222-2222-2222-2222-222222222222';`);
    const productsB = await prisma.$queryRawUnsafe(`SELECT id, tenant_id, name, sell_price FROM "Product" ORDER BY id;`);
    console.log('Products visible to Tenant B:');
    console.table(productsB);

    console.log('\nCleaning up test rows...');
    await prisma.$executeRawUnsafe(`DELETE FROM "Product" WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Tenant" WHERE id IN ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');`);

    console.log('RLS validation script completed successfully.');
  } catch (err) {
    console.error('RLS validation error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
