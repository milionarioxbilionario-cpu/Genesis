const deviceKeyService = require('../src/services/deviceKeyService');
const prisma = require('../src/utils/prisma');

(async () => {
  try {
    let user = await prisma.user.findFirst({ where: { role: 'owner' } });
    if (!user) {
      console.log('No owner user found; creating test tenant and owner user');
      const tenant = await prisma.tenant.create({ data: { name: 'Test Tenant', owner_name: 'Tester', business_type: 'mercearia', location: 'Moçambique', phone: '000', status: 'trial' } });
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('password', 10);
      user = await prisma.user.create({ data: { tenant_id: tenant.id, role: 'owner', name: 'Test Owner', email: 'owner@test.local', password_hash: passwordHash, is_active: true } });
      console.log('Created user', user.id);
    } else {
      console.log('Found owner user', user.id);
    }

    const result = await deviceKeyService.createDeviceKey({ ownerUserId: user.id, tenantId: user.tenant_id, deviceName: 'tmp-device-script' });
    console.log('Created device key:', result);
    process.exit(0);
  } catch (e) { console.error('err', e); process.exit(2); }
})();
