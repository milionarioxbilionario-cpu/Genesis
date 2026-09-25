const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');

// Secret format: <uuid>.<base64urlrandom>
// Server stores only hash of the random part (bcrypt), not raw secret.

const createDeviceKey = async ({ ownerUserId, tenantId, deviceName }) => {
  const id = crypto.randomUUID();
  const rawSecret = crypto.randomBytes(24).toString('base64url');
  const secretHash = await bcrypt.hash(rawSecret, 10);

  // Insert using raw query so Prisma client doesn't need a model update here.
  await prisma.$executeRaw`INSERT INTO device_keys (id, device_name, key_hash, owner_user_id, tenant_id) VALUES (${id}, ${deviceName}, ${secretHash}, ${ownerUserId}, ${tenantId})`;

  return { id, rawSecret: `${id}.${rawSecret}` };
};

const revokeDeviceKey = async (id, actorUserId) => {
  const now = new Date();
  await prisma.$executeRaw`UPDATE device_keys SET revoked_at = ${now} WHERE id = ${id}`;
  return true;
};

const listDeviceKeysForOwner = async (ownerUserId, tenantId) => {
  const rows = await prisma.$queryRaw`SELECT id, device_name, owner_user_id, tenant_id, created_at, last_used_at, revoked_at, metadata FROM device_keys WHERE owner_user_id = ${ownerUserId} AND tenant_id = ${tenantId}`;
  return rows;
};

// Verify a raw secret in format id.secretRandom
const verifyDeviceSecret = async (rawSecret) => {
  if (!rawSecret || typeof rawSecret !== 'string') return null;
  const parts = rawSecret.split('.');
  if (parts.length < 2) return null;
  const id = parts[0];
  const secretRandom = parts.slice(1).join('.');

  const rows = await prisma.$queryRaw`SELECT id, device_name, key_hash, owner_user_id, tenant_id, revoked_at FROM device_keys WHERE id = ${id}`;
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  if (row.revoked_at) return null;

  const ok = await bcrypt.compare(secretRandom, row.key_hash);
  if (!ok) return null;

  // update last_used_at
  const now = new Date();
  await prisma.$executeRaw`UPDATE device_keys SET last_used_at = ${now} WHERE id = ${id}`;

  return {
    id: row.id,
    device_name: row.device_name,
    owner_user_id: row.owner_user_id,
    tenant_id: row.tenant_id
  };
};

module.exports = {
  createDeviceKey,
  revokeDeviceKey,
  listDeviceKeysForOwner,
  verifyDeviceSecret
};
