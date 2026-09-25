// Cria a tabela device_keys (modelo @@ignore do Prisma, criada por SQL no
// deviceKeyService). Corre sempre em SQLite; em Postgres e um no-op porque a
// tabela e criada pelo prisma db push normal.
require('dotenv').config();
const prisma = require('../src/utils/prisma');

(async () => {
  await prisma.ready();
  if (prisma.engineName() !== 'sqlite') {
    console.log('OK: em Postgres a tabela vem do prisma db push');
    await prisma.$disconnect();
    return;
  }
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS device_keys (
      id TEXT PRIMARY KEY, device_name TEXT NOT NULL, key_hash TEXT NOT NULL,
      owner_user_id TEXT NOT NULL, tenant_id TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME, revoked_at DATETIME, metadata TEXT)`);
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS device_keys_owner_idx ON device_keys(owner_user_id)');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS device_keys_tenant_idx ON device_keys(tenant_id)');
  console.log('OK: device_keys pronta (sqlite)');
  await prisma.$disconnect();
})().catch((e) => { console.error('FALHOU:', e.message); process.exit(1); });