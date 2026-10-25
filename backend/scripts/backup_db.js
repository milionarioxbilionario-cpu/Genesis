// Copia de seguranca da base de dados em JSON (antes de cada migracao).
//   node scripts/backup_db.js [pasta]      (por omissao: ~/Documents/Genesis-copias)
// Le TODAS as tabelas do esquema public com o cliente de sistema (postgres) e
// grava um ficheiro .json.gz por execucao. Sem pg_dump: nem este PC nem o
// servidor o tem, e instalar pacotes no servidor de producao so para isto
// nao vale o risco. Serve para repor dados; o esquema esta em prisma/migrations.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { PrismaClient } = require('@prisma/client');

// Ligacoes de Maputo ao Supabase demoram: sem isto falham com 'Can't reach'.
const withTimeout = (u) => (u && !/connect_timeout=/.test(u) ? u + (u.includes('?') ? '&' : '?') + 'connect_timeout=60&pool_timeout=60' : u);
const outDir = process.argv[2] || path.join(os.homedir(), 'Documents', 'Genesis-copias');

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: withTimeout(process.env.DATABASE_URL) } } });
  try {
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
    );
    const dump = { created_at: new Date().toISOString(), tables: {} };
    for (const { table_name: t } of tables) {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM public."${t.replace(/"/g, '""')}"`);
      dump.tables[t] = rows;
    }
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `genesis-bd-${dump.created_at.replace(/[:.]/g, '-')}.json.gz`);
    const json = JSON.stringify(dump, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
    fs.writeFileSync(file, zlib.gzipSync(json));
    const counts = Object.entries(dump.tables).map(([t, r]) => `${t}=${r.length}`).join(' ');
    console.log(`copia: ${file} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
    console.log(counts);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error('falhou:', e.message); process.exit(1); });
