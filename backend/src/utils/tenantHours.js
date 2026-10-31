// Horario de cada estabelecimento (utils/hours.js), lido com uma cache curta.
// A chave e o tenant_id (regra 7: nada de um estabelecimento passa para outro);
// a leitura corre no contexto do pedido (RLS) ou com o cliente de sistema nos jobs.
const prisma = require('./prisma');
const H = require('./hours');

const TTL_MS = 30 * 1000;
const cache = new Map(); // tenantId -> { s, at }

async function scheduleOf(tenantId) {
  const hit = cache.get(tenantId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.s;
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { hours_json: true, opening_time: true, closing_time: true } });
  const s = H.parse(t || {});
  cache.set(tenantId, { s, at: Date.now() });
  return s;
}

const forgetSchedule = (tenantId) => cache.delete(tenantId);

// Dia de vendas com fim a meia-noite = o que sempre houve (nenhuma mudanca).
const shiftsDay = (s) => Boolean(s.day_end && s.day_end !== '00:00');

module.exports = { scheduleOf, forgetSchedule, shiftsDay };
