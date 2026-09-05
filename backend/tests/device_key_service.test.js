const test = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../src/utils/prisma');
const { createDeviceKey, verifyDeviceSecret } = require('../src/services/deviceKeyService');
const deviceKeyAuth = require('../src/middleware/deviceKeyAuth');

async function createTenantAndOwner() {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 8);
  const tenant = await prisma.tenant.create({
    data: {
      name: `Test Tenant ${suffix}`,
      owner_name: 'Owner Test',
      business_type: 'mercearia',
      location: 'Maputo',
      phone: '840000000',
      email: `tenant-${suffix}@example.com`,
      status: 'trial'
    }
  });

  const user = await prisma.user.create({
    data: {
      tenant_id: tenant.id,
      role: 'owner',
      name: 'Owner Test',
      email: `owner-${suffix}@example.com`,
      password_hash: 'test-hash',
      phone: '840000001',
      is_active: true
    }
  });

  return { tenant, user };
}

test('device key creates and verifies a secret', async () => {
  const { tenant, user } = await createTenantAndOwner();
  const { id, rawSecret } = await createDeviceKey({
    ownerUserId: user.id,
    tenantId: tenant.id,
    deviceName: 'Test Device'
  });

  const verified = await verifyDeviceSecret(rawSecret);
  assert.ok(verified);
  assert.equal(verified.id, id);
  assert.equal(verified.tenant_id, tenant.id);
  assert.equal(verified.owner_user_id, user.id);
});

test('deviceKeyAuth middleware accepts a valid Device header', async () => {
  const { tenant, user } = await createTenantAndOwner();
  const { rawSecret } = await createDeviceKey({
    ownerUserId: user.id,
    tenantId: tenant.id,
    deviceName: 'Auth Device'
  });

  const req = { headers: { authorization: `Device ${rawSecret}` } };
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };

  let nextCalled = false;
  await new Promise((resolve) => {
    deviceKeyAuth(req, res, () => {
      nextCalled = true;
      resolve();
    });
  });

  assert.equal(nextCalled, true);
  assert.equal(req.deviceKey.tenant_id, tenant.id);
  assert.equal(req.user.tenantId, tenant.id);
});
