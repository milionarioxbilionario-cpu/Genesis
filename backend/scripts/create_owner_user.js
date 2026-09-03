require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { id: '44444444-4444-4444-4444-444444444444' } });
  if (!tenant) {
    console.error('Tenant not found. Run create_test_tenant.js first.');
    return process.exit(1);
  }

  const email = 'owner@genesis.local';
  const password = '<password-demo-removida-do-historico>';
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password_hash: hash, role: 'owner', tenant_id: tenant.id, is_active: true, name: 'Owner Test' },
    create: {
      tenant_id: tenant.id,
      role: 'owner',
      name: 'Owner Test',
      email,
      password_hash: hash,
      phone: tenant.phone
    }
  });

  console.log('Owner created/updated:', email);
  console.log('Password (plaintext for test):', password);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
