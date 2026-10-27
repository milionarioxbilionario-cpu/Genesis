// Fase 16: planos (Basico / Premium) e o presente de aniversario do dono. Puro.
// Premium efectivo = plano 'premium' ou um periodo Premium temporario em curso
// (premium_from <= agora < premium_until), que e o que o presente da.
// Por agora nada fica bloqueado no Basico (decisao do fundador, 25/10).
const { dayInMaputo } = require('../utils/shiftDay');

const PLANS = ['basic', 'premium'];
const PERIODS = ['monthly', 'annual'];

// Soma meses a uma data AAAA-MM-DD, prendendo o dia ao fim do mes (31/01 + 1 = 28/02).
function addMonthsDay(day, months) {
  const [y, m, d] = day.split('-').map(Number);
  const total = (m - 1) + months;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

// Inicio do dia em Maputo (UTC+2, sem hora de verao) como instante.
const startOfMaputoDay = (day) => new Date(`${day}T00:00:00+02:00`);

function effectivePlan(tenant, now = new Date()) {
  if (tenant?.plan === 'premium') return 'premium';
  const from = tenant?.premium_from ? new Date(tenant.premium_from) : null;
  const until = tenant?.premium_until ? new Date(tenant.premium_until) : null;
  return from && until && from <= now && now < until ? 'premium' : 'basic';
}

// E hoje (dia de Maputo) o aniversario? 29/02 festeja-se a 28/02 nos anos comuns.
function isBirthdayToday(birthday, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthday || ''))) return false;
  const today = dayInMaputo(now);
  const [y] = today.split('-').map(Number);
  let md = birthday.slice(5);
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  if (md === '02-29' && !leap) md = '02-28';
  return today.slice(5) === md;
}

// Proximo inicio de ciclo mensal (dia do mes em que a loja foi criada), estritamente depois de hoje.
function nextCycleDay(createdAt, now = new Date()) {
  const today = dayInMaputo(now);
  const anchor = Number(dayInMaputo(new Date(createdAt)).slice(8, 10));
  const [y, m] = today.split('-').map(Number);
  let candidate = addMonthsDay(`${y}-${String(m).padStart(2, '0')}-01`, 0).slice(0, 8);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  candidate = candidate + String(Math.min(anchor, last)).padStart(2, '0');
  if (candidate <= today) {
    const nextMonth = addMonthsDay(`${y}-${String(m).padStart(2, '0')}-01`, 1);
    const [ny, nm] = nextMonth.split('-').map(Number);
    const nlast = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
    candidate = `${nextMonth.slice(0, 8)}${String(Math.min(anchor, nlast)).padStart(2, '0')}`;
  }
  return candidate;
}

// Janela do mes de Premium oferecido (regras do fundador, 25/10):
//  - mensal: comeca no proximo ciclo e dura 1 mes;
//  - anual (Basico): comeca hoje e acaba no mesmo dia do mes seguinte;
//  - ja Premium temporario a decorrer: soma 1 mes ao fim.
function giftWindow(tenant, now = new Date()) {
  const today = dayInMaputo(now);
  if (tenant?.premium_until && new Date(tenant.premium_until) > now) {
    const end = dayInMaputo(new Date(tenant.premium_until));
    return { from: new Date(tenant.premium_from || now), until: startOfMaputoDay(addMonthsDay(end, 1)), rule: 'extend' };
  }
  if (tenant?.plan_period === 'annual') {
    return { from: startOfMaputoDay(today), until: startOfMaputoDay(addMonthsDay(today, 1)), rule: 'annual_now' };
  }
  const start = nextCycleDay(tenant?.created_at || now, now);
  return { from: startOfMaputoDay(start), until: startOfMaputoDay(addMonthsDay(start, 1)), rule: 'next_cycle' };
}

// O presente esta disponivel hoje? (aniversario hoje e ainda nao recolhido este ano)
function giftAvailable(user, now = new Date()) {
  const year = Number(dayInMaputo(now).slice(0, 4));
  return isBirthdayToday(user?.birthday, now) && user?.birthday_gift_year !== year;
}

module.exports = { PLANS, PERIODS, addMonthsDay, effectivePlan, isBirthdayToday, nextCycleDay, giftWindow, giftAvailable };
