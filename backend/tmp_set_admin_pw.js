const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
(async ()=>{
  const p = new PrismaClient();
  try {
    const pw = crypto.randomBytes(16).toString('hex');
    const hash = await bcrypt.hash(pw, 12);
    await p.user.update({ where: { email: 'admin@genesis.co.mz' }, data: { password_hash: hash } });
    console.log('NEW_ADMIN_PASSWORD:' + pw);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();
