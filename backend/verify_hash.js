require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@genesis.co.mz';
  const testPassword = process.env.DEMO_ADMIN_PASSWORD;
  if (!testPassword) {
    console.log('⚠️  DEMO_ADMIN_PASSWORD não definida (ver backend/.env.example)');
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return console.log('🔎 Utilizador não encontrado');

  // For security, do not print password hashes. Only show whether the provided password matches.
  const ok = await bcrypt.compare(testPassword, user.password_hash);
  console.log('✅ A password coincide?', ok);
  await prisma.$disconnect();
}
main();
