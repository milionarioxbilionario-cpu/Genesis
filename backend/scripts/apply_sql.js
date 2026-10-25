// Aplica um ficheiro de migracao SO ADITIVA, instrucao a instrucao, com o
// cliente de sistema (postgres).
//   node scripts/apply_sql.js prisma/migrations/<data>_<nome>/migration.sql
// Porque existe: a partir de Maputo, o `prisma db execute` (schema engine)
// ficou mais de 10 minutos preso no pooler do Supabase (25/10/2026); o cliente
// normal executa o mesmo SQL em segundos. As migracoes sao idempotentes
// (IF NOT EXISTS / DROP POLICY IF EXISTS), por isso repetir e seguro.
// Separa por ';' no fim da linha, fora de blocos $$ ... $$.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

function statements(sql) {
  const out = [];
  let cur = '';
  let inDollar = false;
  for (const line of sql.split(/\r?\n/)) {
    if (/^\s*--/.test(line) && !cur.trim()) continue;
    cur += line + '\n';
    if ((line.match(/\$\$/g) || []).length % 2 === 1) inDollar = !inDollar;
    if (!inDollar && /;\s*$/.test(line)) { out.push(cur.trim()); cur = ''; }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter((s) => s.replace(/--.*$/gm, '').trim());
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('uso: node scripts/apply_sql.js <ficheiro.sql>');
  const url = process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'connect_timeout=60&pool_timeout=60';
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const list = statements(fs.readFileSync(file, 'utf8'));
    for (const [i, s] of list.entries()) {
      await prisma.$executeRawUnsafe(s);
      console.log(`${i + 1}/${list.length} ok  ${s.split('\n').find((l) => !/^\s*--/.test(l)).slice(0, 90)}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error('falhou:', e.message); process.exit(1); });
