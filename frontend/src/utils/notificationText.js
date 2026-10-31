// Texto das notificacoes do sino (Fase 10.1). O servidor manda o tipo e os
// dados; a frase e montada aqui, na lingua de quem ve. Cada texto e um literal
// inteiro (sem ternarios) para o teste de cobertura do ingles o apanhar.
import { money, date, monthName } from './format.js';
import { t } from '../i18n/core.js';

// Dia AAAA-MM-DD ao meio-dia: nao muda de dia em nenhum fuso.
const day = (d) => date(d + 'T12:00:00');

export function notificationTitle(n) {
  const p = n.params || {};
  switch (n.type) {
    case 'cashier_locked': return t('Caixista bloqueado');
    case 'debt_due':
      if (p.days_left < 0) return t('Txeneka vencida');
      if (p.days_left === 0) return t('Txeneka vence hoje');
      if (p.days_left === 1) return t('Txeneka vence amanhã');
      return t('Txeneka a vencer');
    case 'stock_low':
      if (p.stock_level === 'critical') return t('Stock crítico');
      if (p.stock_level === 'severe') return t('Stock severo');
      return t('Stock baixo');
    case 'lot_expiring': return t('Validade');
    case 'shift_difference': return t('Diferença no fecho de turno');
    case 'shift_attempt_fail': return t('Fecho de turno recusado');
    case 'goal_reached': return t('Meta atingida');
    case 'day_closed': return t('Fecho do dia');
    case 'no_location': return t('Marque o estabelecimento no mapa');
    default: return n.type;
  }
}

export function notificationDetail(n) {
  const p = n.params || {};
  switch (n.type) {
    case 'cashier_locked': return t('{name} errou a contagem 3 vezes no fecho de turno. Desbloqueie em Equipa.', { name: p.cashier });
    case 'debt_due':
      if (p.days_left < 0) return t('{name}: falta {v}, venceu há {n} dia(s).', { name: p.debtor, v: money(p.remaining), n: -p.days_left });
      if (p.days_left <= 1) return t('{name}: falta {v}.', { name: p.debtor, v: money(p.remaining) });
      return t('{name}: falta {v}, vence em {n} dias.', { name: p.debtor, v: money(p.remaining), n: p.days_left });
    case 'stock_low': return t('{name}: {q} un. (mínimo {min}).', { name: p.name, q: p.qty, min: p.min });
    case 'lot_expiring':
      if (p.days_left < 0) return t('{name}: {q} un. expiradas.', { name: p.name, q: p.quantity });
      if (p.days_left === 0) return t('{name}: {q} un. expiram hoje.', { name: p.name, q: p.quantity });
      return t('{name}: {q} un. expiram em {n} dia(s).', { name: p.name, q: p.quantity, n: p.days_left });
    case 'shift_difference':
      if (p.difference < 0) return t('{name}, {day}: faltaram {v} na caixa.', { name: p.cashier, day: day(p.day), v: money(-p.difference) });
      return t('{name}, {day}: sobraram {v} na caixa.', { name: p.cashier, day: day(p.day), v: money(p.difference) });
    case 'shift_attempt_fail': return t('{name}, {day}: escreveu {declared}, esperado {expected} (tentativa {n}/{max}).', { name: p.cashier, day: day(p.day), declared: money(p.declared), expected: money(p.expected), n: p.attempt, max: p.max || 3 });
    case 'goal_reached': return t('{month}: {current} vendidos, meta {target}.', { month: monthName(p.month), current: money(p.current), target: money(p.target) });
    case 'day_closed': return t('Hoje: {n} venda(s), {v}. Ver o relatório do dia.', { n: p.sales, v: money(p.revenue) });
    case 'no_location': return t('Definições › Estabelecimento › «Onde fica o estabelecimento?». Use o telemóvel no local ou cole o link do Google Maps.');
    default: return '';
  }
}
