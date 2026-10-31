// Horario de funcionamento a serio (31/10/2026). Funcoes PURAS (tests/hours.test.js).
//
// O fundador: «e se for 24/24h? segunda fecha as 20h, sexta nao fecha, domingo
// fecha as 12h...». Antes havia so uma hora de abrir e uma de fechar.
//
// Forma guardada em Tenant.hours_json:
//   { v: 1, mode: 'same' | '24h' | 'custom',
//     days: { '0'..'6': [['08:00','20:00'], ...] },   0 = domingo ... 6 = sabado
//     day_end: 'HH:MM',                                 fim do «dia de vendas»
//     exceptions: [{ date: 'AAAA-MM-DD', closed: true } | { date, intervals: [[..]] }] }
// Cada dia e uma lista de intervalos (a pausa do almoco sao dois). [] = fechado.
// ['18:00','04:00'] passa a meia-noite (fecha no dia seguinte). ['00:00','24:00'] = 24 h.
//
// Dia de vendas (day_end): um bar que abre as 18h e fecha as 4h vende a 1h; essa
// venda conta para o dia em que abriu. Por omissao '00:00' (a meia-noite, como
// sempre): quem nao mexe no horario nao ve diferenca nenhuma.
// Tudo na hora de Maputo (UTC+2, sem hora de verao).

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const END = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
const DAYS = ['0', '1', '2', '3', '4', '5', '6'];
const MAPUTO_MS = 2 * 3600 * 1000;
const MODES = ['same', '24h', 'custom'];
const FULL = [['00:00', '24:00']];

const minutes = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
const hhmm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Hora antiga (opening_time/closing_time) -> horario novo, igual todos os dias.
function fromLegacy(opening = '08:00', closing = '20:00') {
  const o = HHMM.test(opening) ? opening : '08:00';
  const c = HHMM.test(closing) ? closing : '20:00';
  return { v: 1, mode: 'same', days: Object.fromEntries(DAYS.map((d) => [d, [[o, c]]])), day_end: '00:00', exceptions: [] };
}

// Valida e arruma o que veio do ecra. Lanca Error com mensagem em portugues.
function normalize(input) {
  if (!input || typeof input !== 'object') throw new Error('Horário inválido');
  const mode = MODES.includes(input.mode) ? input.mode : 'custom';
  const days = {};
  for (const d of DAYS) {
    let list = mode === '24h' ? FULL : (input.days && Array.isArray(input.days[d]) ? input.days[d] : []);
    if (mode === 'same') list = Array.isArray(input.days?.['1']) ? input.days['1'] : (Array.isArray(input.same) ? input.same : []);
    if (list.length > 4) throw new Error('No máximo 4 períodos por dia');
    days[d] = list.map((p) => {
      if (!Array.isArray(p) || p.length !== 2 || !HHMM.test(p[0]) || !END.test(p[1])) throw new Error('Hora no formato HH:MM');
      if (p[0] === p[1]) throw new Error('A hora de abrir e a de fechar não podem ser iguais');
      return [p[0], p[1]];
    });
    // Periodos do mesmo dia nao se podem sobrepor (contando os que passam a meia-noite).
    const spans = days[d].map(([a, b]) => { const s = minutes(a); let e = b === '24:00' ? 1440 : minutes(b); if (e <= s) e += 1440; return [s, e]; }).sort((x, y) => x[0] - y[0]);
    for (let i = 1; i < spans.length; i++) if (spans[i][0] < spans[i - 1][1]) throw new Error('Há períodos sobrepostos no mesmo dia');
  }
  if (!DAYS.some((d) => days[d].length)) throw new Error(mode === 'same' ? 'Escreva a hora de abrir e a de fechar' : 'Marque pelo menos um dia aberto');
  const day_end = HHMM.test(input.day_end) ? input.day_end : suggestDayEnd({ days });
  const exceptions = (Array.isArray(input.exceptions) ? input.exceptions : []).slice(0, 60).map((x) => {
    if (!x || !/^\d{4}-\d{2}-\d{2}$/.test(x.date)) throw new Error('Data especial inválida (AAAA-MM-DD)');
    if (x.closed) return { date: x.date, closed: true };
    const intervals = (Array.isArray(x.intervals) ? x.intervals : []).map((p) => {
      if (!Array.isArray(p) || !HHMM.test(p[0]) || !END.test(p[1]) || p[0] === p[1]) throw new Error('Hora no formato HH:MM');
      return [p[0], p[1]];
    });
    return intervals.length ? { date: x.date, intervals } : { date: x.date, closed: true };
  });
  return { v: 1, mode, days, day_end, exceptions };
}

// Le o que esta guardado (ou a hora antiga). Nunca lanca: dados estragados = hora antiga.
function parse(tenant = {}) {
  if (tenant.hours_json) {
    try { return normalize(JSON.parse(tenant.hours_json)); } catch { /* volta a hora antiga */ }
  }
  return fromLegacy(tenant.opening_time || '08:00', tenant.closing_time || '20:00');
}

const crossesMidnight = (s) => DAYS.some((d) => (s.days[d] || []).some(([a, b]) => b !== '24:00' && minutes(b) <= minutes(a)));
const isAlwaysOpen = (s) => DAYS.every((d) => (s.days[d] || []).some(([a, b]) => a === '00:00' && b === '24:00'));

// Fim do dia de vendas sugerido: meia-noite, ou a hora do fecho mais tarde dos
// periodos que passam a meia-noite (ex.: 18h-04h -> 04:00).
function suggestDayEnd(s) {
  let latest = 0;
  for (const d of DAYS) for (const [a, b] of (s.days[d] || [])) if (b !== '24:00' && minutes(b) <= minutes(a)) latest = Math.max(latest, minutes(b));
  return hhmm(latest);
}

// Resumo para as colunas antigas (opening_time/closing_time) e textos curtos.
function summary(s) {
  if (isAlwaysOpen(s)) return { opening_time: '00:00', closing_time: '23:59' };
  const all = DAYS.flatMap((d) => s.days[d] || []);
  if (!all.length) return { opening_time: '08:00', closing_time: '20:00' };
  const opening = all.map(([a]) => a).sort()[0];
  // O fecho mais tarde: um que passa a meia-noite conta como «depois» das 23:59.
  const closing = all.map(([a, b]) => (b === '24:00' ? 1440 : (minutes(b) <= minutes(a) ? minutes(b) + 1440 : minutes(b)))).sort((x, y) => y - x)[0];
  return { opening_time: opening, closing_time: closing >= 1440 ? '23:59' : hhmm(closing) };
}

// Hora de Maputo de um instante.
function maputoParts(date) {
  const x = new Date(new Date(date).getTime() + MAPUTO_MS);
  return { day: x.toISOString().slice(0, 10), weekday: x.getUTCDay(), minute: x.getUTCHours() * 60 + x.getUTCMinutes() };
}
const addDays = (day, n) => new Date(Date.parse(day + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const weekdayOf = (day) => new Date(day + 'T00:00:00Z').getUTCDay();

// Intervalos de um dia do calendario (feriados e dias especiais primeiro).
function intervalsOn(s, day) {
  const ex = (s.exceptions || []).find((x) => x.date === day);
  if (ex) return ex.closed ? [] : ex.intervals;
  return s.days[String(weekdayOf(day))] || [];
}

// Esta aberto neste instante? Conta tambem o periodo de ontem que passa a meia-noite.
function isOpenAt(s, date = new Date()) {
  const { day, minute } = maputoParts(date);
  for (const [a, b] of intervalsOn(s, day)) {
    const st = minutes(a); const en = b === '24:00' ? 1440 : minutes(b);
    if (en > st ? (minute >= st && minute < en) : minute >= st) return true;
  }
  for (const [a, b] of intervalsOn(s, addDays(day, -1))) {
    const st = minutes(a); const en = b === '24:00' ? 1440 : minutes(b);
    if (en <= st && minute < en) return true;
  }
  return false;
}

// Dia de vendas (AAAA-MM-DD) a que pertence um instante.
function businessDay(s, date = new Date()) {
  const { day, minute } = maputoParts(date);
  const end = minutes(s.day_end || '00:00');
  return end > 0 && minute < end ? addDays(day, -1) : day;
}

// Inicio e fim (instantes) de um dia de vendas. Com day_end 00:00 = o dia do calendario de Maputo.
function businessDayRange(s, day) {
  const [h, m] = (s.day_end || '00:00').split(':');
  const start = new Date(`${day}T${h}:${m}:00.000+02:00`);
  return { start, end: new Date(start.getTime() + 86400000 - 1) };
}

// Ultimo fecho do dia de vendas `day` (para o aviso «fecho do dia»). null se o
// estabelecimento esteve aberto 24 h ou fechado nesse dia.
function lastCloseOf(s, day) {
  const list = intervalsOn(s, day);
  if (!list.length || list.some(([a, b]) => a === '00:00' && b === '24:00')) return null;
  let latest = null;
  for (const [a, b] of list) {
    const st = minutes(a); let en = b === '24:00' ? 1440 : minutes(b);
    if (en <= st) en += 1440;
    if (latest === null || en > latest) latest = en;
  }
  return new Date(new Date(`${day}T00:00:00.000+02:00`).getTime() + latest * 60000);
}

module.exports = { HHMM, DAYS, fromLegacy, normalize, parse, summary, crossesMidnight, isAlwaysOpen, suggestDayEnd, isOpenAt, businessDay, businessDayRange, lastCloseOf, intervalsOn };
