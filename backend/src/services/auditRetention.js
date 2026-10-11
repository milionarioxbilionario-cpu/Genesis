// Retencao da auditoria (Fase 8.5, decisao do fundador 10/10/2026): o dono
// escolhe quantos meses guarda (minimo 2 = o mes corrente + o anterior); o mais
// antigo apaga-se sozinho.
//  - So linhas de LOJAS (tenant_id da loja). As do super admin (tenant_id NULL)
//    nunca sao tocadas.
//  - Nunca se apagam as accoes que guiam estados (PROTECTED_ACTIONS).
//  - Corre com o cliente de SISTEMA (sem loja no contexto) — RLS nao se aplica,
//    por isso cada DELETE filtra explicitamente por tenant_id.
const prisma = require('../utils/prisma');
const { retentionCutoff, PROTECTED_ACTIONS } = require('../utils/auditGroups');

const BATCH = 5000;
const SIX_HOURS = 6 * 3600 * 1000;

// Quantas linhas cada loja perderia agora (sem apagar nada).
async function previewAuditRetention({ now = new Date() } = {}) {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, audit_retention_months: true } });
  const out = [];
  for (const t of tenants) {
    const cutoff = retentionCutoff({ now, months: t.audit_retention_months });
    const n = await prisma.auditLog.count({ where: { tenant_id: t.id, created_at: { lt: cutoff }, action: { notIn: PROTECTED_ACTIONS } } });
    out.push({ tenant_id: t.id, name: t.name, months: t.audit_retention_months, cutoff, to_delete: n });
  }
  return out;
}

async function purgeTenant(tenantId, cutoff) {
  let total = 0;
  for (;;) {
    const ids = (await prisma.auditLog.findMany({
      where: { tenant_id: tenantId, created_at: { lt: cutoff }, action: { notIn: PROTECTED_ACTIONS } },
      select: { id: true }, take: BATCH,
    })).map((r) => r.id);
    if (!ids.length) break;
    const r = await prisma.auditLog.deleteMany({ where: { id: { in: ids }, tenant_id: tenantId } });
    total += r.count;
    if (ids.length < BATCH) break;
  }
  return total;
}

async function runAuditRetention({ now = new Date(), tenantId } = {}) {
  const tenants = await prisma.tenant.findMany({ where: tenantId ? { id: tenantId } : {}, select: { id: true, audit_retention_months: true } });
  let total = 0;
  for (const t of tenants) {
    try { total += await purgeTenant(t.id, retentionCutoff({ now, months: t.audit_retention_months })); } catch (err) { console.error('[auditoria] loja ' + t.id + ':', err.message); }
  }
  if (total) console.log(`[auditoria] ${total} registo(s) antigos apagados (retencao escolhida por cada loja)`);
  return total;
}

function startAuditRetentionJob() {
  if (String(process.env.AUDIT_RETENTION_JOB || 'true').toLowerCase() === 'false') return null;
  const run = () => runAuditRetention().catch((err) => console.error('[auditoria] retencao falhou:', err.message));
  const first = setTimeout(run, 2 * 60 * 1000);
  const every = setInterval(run, SIX_HOURS);
  first.unref(); every.unref();
  return { first, every };
}

module.exports = { previewAuditRetention, runAuditRetention, startAuditRetentionJob };
