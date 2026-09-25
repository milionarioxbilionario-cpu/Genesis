require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'admin@genesis.co.mz';
  const password = process.env.DEMO_ADMIN_PASSWORD;
  if (!password) throw new Error('DEMO_ADMIN_PASSWORD não definida (ver backend/.env.example)');
  const hash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: 'Super Admin Genesis',
        password_hash: hash,
        role: 'super_admin',
        is_active: true
      }
    });
    console.log('--- Super Admin Criado ---');
    console.log(`Email: ${email}`);
    console.log('Credenciais geradas com hash seguro (senha não impressa por segurança).');
    console.log('---------------------------');
  } catch (e) {
    console.error('Erro ao criar admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
