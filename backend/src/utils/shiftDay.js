// Turno por dia (pedido do fundador 10/10/2026) — regra pura, sem BD.
//
// Cada caixista tem UM fecho por dia (dia civil de Maputo):
//  - fechou o turno de hoje -> fechado; reabrir hoje so com o PIN do dono;
//  - dia novo -> o perfil abre sozinho (o fecho desse dia ainda nao foi usado);
//  - um turno que passa da meia-noite (bottle stores 24/24) fecha como turno
//    do dia em que COMECOU: fechar as 02h do dia X+1 gasta o fecho do dia X, e
//    o caixista ainda pode trabalhar em X+1 sem PIN; ao fechar outra vez em
//    X+1 gasta o fecho de X+1.
// O esperado do fecho cego conta a partir do INICIO do turno = o mais recente
// entre o ultimo fecho e a ultima abertura (SHIFT_OPENED). Antes contava desde
// o ultimo fecho e vendas soltas entre um fecho e a reabertura (feitas antes
// da Fase 7.1) entravam no turno seguinte.

const { dayInMaputo } = require('./fefo');

// Dia a que um fecho pertence (fechos antigos, sem shift_day, = dia do fecho).
const closingDay = (c) => c.shift_day || dayInMaputo(c.closed_at);

const later = (a, b) => (!a ? b : !b ? a : (new Date(a) > new Date(b) ? a : b));

// recentClosings: fechos do caixista (os mais recentes primeiro; basta os de
// 2-3 dias). openedAt: ultimo SHIFT_OPENED depois do ultimo fecho (ou, sem
// fecho nenhum, o ultimo de sempre).
function decideShift({ recentClosings = [], openedAt = null, now = new Date() }) {
  const lastClosing = recentClosings[0] || null;
  const since = later(lastClosing ? lastClosing.closed_at : null, openedAt);
  const today = dayInMaputo(now);
  if (!lastClosing) return { open: true, auto: false, since, today, closedToday: false };
  if (openedAt) return { open: true, auto: false, since, today, closedToday: recentClosings.some((c) => closingDay(c) === today) };
  const closedToday = recentClosings.some((c) => closingDay(c) === today);
  return { open: !closedToday, auto: !closedToday, since, today, closedToday };
}

// Dia do turno que se esta a fechar: o da abertura (PIN do dono / limpeza) ou,
// sem abertura registada, o da primeira actividade depois do ultimo fecho
// (entrar no perfil ou vender); sem nada, hoje.
function shiftDayOf({ openedAt = null, firstActivityAt = null, now = new Date() }) {
  return dayInMaputo(openedAt || firstActivityAt || now);
}

module.exports = { dayInMaputo, closingDay, decideShift, shiftDayOf };
