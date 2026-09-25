// Contexto de tenant para as politicas RLS do Postgres.
//
// Substitui o padrao antigo (existsSync em prisma/dev.db + $executeRawUnsafe com
// o tenantId interpolado na string SQL):
//   - Isolar ou nao os dados nao pode depender de um ficheiro existir no disco.
//   - Um identificador de tenant nunca entra numa query por concatenacao.
//   - A decisao certa e o DATABASE_URL (file: => SQLite, resto => Postgres).
//
// Fail-closed: se o URL aponta para Postgres e o SET LOCAL nao e aplicado, a
// transacao aborta em vez de continuar a servir dados sem isolamento.

const isSqliteUrl = () => String(process.env.DATABASE_URL || '').trim().startsWith('file:');

async function applyTenantRls(tx, tenantId) {
  if (!tenantId) {
    throw new Error('tenantId em falta: sem contexto de tenant nao ha isolamento');
  }

  // SQLite (desenvolvimento local) nao tem RLS nem set_config.
  if (isSqliteUrl()) return;

  // set_config aceita parametros (ao contrario de SET app.tenant_id = $1) e o
  // tagged template do Prisma parametriza o valor. O terceiro argumento (true)
  // limita a definicao a transacao corrente.
  await tx.$queryRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
}

module.exports = { applyTenantRls, isSqliteUrl };
