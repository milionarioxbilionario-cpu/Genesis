// Diagnóstico: quem existe na base e se as passwords demo batem certo.
// Uso: node scripts/diag_login.js [email]
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const target = process.argv[2] || 'owner@genesis.local';

(async () => {
  let code = 0;
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true, is_active: true, password_hash: true }
    });
    console.log('TOTAL_UTILIZADORES=' + users.length);
    for (const u of users) {
      console.log(`  ${u.role} | ${u.email} | activo=${u.is_active}`);
    }

    const passwords = {
      'owner@genesis.local': process.env.DEMO_OWNER_PASSWORD,
      'admin@genesis.co.mz': process.env.DEMO_ADMIN_PASSWORD,
      'cashier@genesis.local': process.env.DEMO_CASHIER_PASSWORD
    };

    console.log('\n--- teste de senha (' + target + ') ---');
    const u = users.find(x => x.email === target);
    if (!u) {
      console.log('RESULTADO: CONTA_INEXISTENTE');
      console.log('  SEED_DEMO_DATA=' + process.env.SEED_DEMO_DATA);
      console.log('  Dica: npm run db:seed-demo');
      code = 3;
    } else if (!u.password_hash) {
      console.log('RESULTADO: SEM_PASSWORD_ARMAZENADA');
      code = 4;
    } else {
      const candidate = passwords[target];
      if (candidate) {
        const ok = await bcrypt.compare(candidate, u.password_hash);
        console.log('  password do .env: ' + (ok ? 'CORRECTA' : 'INCORRECTA'));
        if (!ok) code = 5;
      } else {
        console.log('  nao ha password de demo para este email');
      }
    }
  } catch (e) {
    console.log('ERRO=' + e.message);
    code = 1;
  }
  await prisma.$disconnect();
  process.exit(code);
})();
