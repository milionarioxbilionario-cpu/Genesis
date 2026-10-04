// Fecho do mes (Genesis 2.1, Fase 5.3) — logica pura, sem Prisma.
// A partir do dia `closeDay` de cada mes, o primeiro acesso do dono mostra o
// fecho do mes ANTERIOR (relatorio + lista de compras sugerida), uma unica vez.
// Antes desse dia nao ha nada a mostrar (o mes anterior a esse ja foi tratado).
// Uma loja que ainda nao existia no mes anterior nao tem fecho para ver.

const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

function monthCloseStatus({ now = new Date(), closeDay = 1, tenantCreatedAt = null, seenKeys = [] } = {}) {
  const day = Math.min(28, Math.max(1, Number(closeDay) || 1));
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prev.getFullYear();
  const month = prev.getMonth() + 1;
  const key = monthKey(year, month);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const existed = !tenantCreatedAt || new Date(tenantCreatedAt) < currentMonthStart;
  const seen = seenKeys.includes(key);
  return { due: now.getDate() >= day && existed && !seen, year, month, key, close_day: day, seen };
}

module.exports = { monthCloseStatus, monthKey };
