const prisma = require('../src/utils/prisma');

(async () => {
  try {
    const sql = `CREATE TABLE IF NOT EXISTS device_keys (
      id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now')),
      last_used_at DATETIME,
      revoked_at DATETIME,
      metadata TEXT
    );`;
    await prisma.$executeRawUnsafe(sql);
    console.log('device_keys table ensured (sqlite)');
    process.exit(0);
  } catch (e) { console.error(e); process.exit(2); }
})();
