const prisma = require('../src/utils/prisma');
(async ()=>{
  try {
    const bcrypt = require('bcrypt');
    const pw = 'SystemPassword!2026';
    const hash = await bcrypt.hash(pw, 12);
    await prisma.user.createMany({
      data: [{
        id: '55555555-5555-5555-5555-555555555555',
        tenant_id: null,
        role: 'super_admin',
        name: 'System User',
        email: 'system@genesis.local',
        password_hash: hash,
        phone: '+000',
        is_active: true
      }],
      skipDuplicates: true
    });
    // Note: password printed before for convenience in dev, removed for security. Use a secure secret management in production.
    console.log('Created system user');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
