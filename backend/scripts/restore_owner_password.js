// Repoe a password de uma conta depois de um teste de reset instantaneo.
// O teste de reset MUDA a password a serio; sem esta reposicao o fundador
// ficava bloqueado na propria conta de demonstracao.
// Uso: node scripts/restore_owner_password.js [email] [password]
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = process.argv[2] || process.env.DEMO_OWNER_EMAIL || 'owner@genesis.local';
const password = process.argv[3] || process.env.DEMO_OWNER_PASSWORD;

(async () => {
  let code = 0;
  try {
    if (!password) {
      throw new Error('Sem password (passar como argumento 2 ou DEMO_OWNER_PASSWORD).');
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { email },
      data: { password_hash: hash }
    });
    const ok = await bcrypt.compare(password, user.password_hash);
    console.log(`RESULTADO: senha de ${email} (${user.role}) reposta; verificada=${ok}`);
    if (!ok) code = 5;
  } catch (e) {
    console.log('ERRO=' + e.message);
    code = 1;
  }
  await prisma.$disconnect();
  process.exit(code);
})();
