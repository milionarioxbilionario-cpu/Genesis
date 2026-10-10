// Texto de cada movimento do rastreio, partilhado pelo ecra de Relatorios e
// pelo PDF (para os dois dizerem o mesmo).
import { money, date, timeSec } from './format';

export function timelineExtra(e) {
  return [
    e.expiry_date ? `validade ${date(e.expiry_date)}` : null,
    e.due_date ? `vence a ${date(e.due_date)}` : null,
    e.discount ? `desconto ${money(e.discount)}` : null,
    e.type === 'loss' ? `${money(e.unit_cost)} por unidade` : null,
    e.type === 'stock' ? `${money(e.unit_cost)} por unidade` : null,
    e.type === 'shift' ? `contado ${money(e.counted)} · esperado ${money(e.expected)}` : null,
  ].filter(Boolean).join(' · ');
}

export function timelineWhen(e, sameDay) {
  if (e.day_only) return sameDay ? '(dia)' : date(e.at);
  return sameDay ? timeSec(e.at) : `${date(e.at)} ${timeSec(e.at)}`;
}

// Valor em texto (o ecra usa cores; o PDF usa este texto).
export function timelineValueText(e) {
  if (e.effect === 'gain') return money(e.amount, { sign: true });
  if (e.effect === 'loss' || e.effect === 'expense') return money(e.amount);
  if (e.type === 'cancelled') return `${money(e.sale.total_amount)} (cancelada)`;
  if (e.type === 'shift') return money(e.amount, { sign: true });
  return e.amount ? money(e.amount) : '—';
}
