// Texto de cada movimento do rastreio, partilhado pelo ecra de Relatorios e
// pelo PDF (para os dois dizerem o mesmo). Fase 9.4: o texto e montado aqui,
// na lingua de quem ve, a partir dos dados do movimento; se faltarem (servidor
// antigo), fica o titulo/detalhe que o servidor mandou em portugues.
import { money, date, timeSec } from './format.js';
import { t } from '../i18n/core.js';

// Motivos das perdas (codigos do servidor; label em portugues = chave).
export const LOSS_REASON = { broken: 'Partido', expired: 'Validade expirada', internal_consumption: 'Consumo interno', other: 'Outro' };
export const lossReason = (code) => (LOSS_REASON[code] ? t(LOSS_REASON[code]) : code);

const n3 = (n) => String(n || '').padStart(3, '0');

export function timelineTitle(e) {
  switch (e.type) {
    case 'sale': return e.sale ? t('Venda n.º {n}', { n: n3(e.sale.daily_number) }) : e.title;
    case 'cancelled': return e.sale ? t('Venda cancelada n.º {n}', { n: n3(e.sale.daily_number) }) : e.title;
    case 'loss': return e.product_name != null ? t('Perda: {q} × {name}', { q: e.quantity, name: e.product_name }) : e.title;
    case 'stock':
      if (e.product_name == null) return e.title;
      return t(e.quantity >= 0 ? 'Entrada de stock: {q} × {name}' : 'Ajuste de stock: {q} × {name}', { q: (e.quantity > 0 ? '+' : '') + e.quantity, name: e.product_name });
    case 'debt': return e.debtor != null ? t('Txeneka nova: {name}', { name: e.debtor }) : e.title;
    case 'debt_payment': return e.debtor != null ? t('Txeneka paga: {name}', { name: e.debtor }) : e.title;
    case 'shift': return t('Fecho de turno');
    case 'demand':
      if (e.product_name == null) return e.title;
      return t(e.in_catalog ? 'Cliente pediu: {name}{q} (em falta)' : 'Cliente pediu: {name}{q} (fora do catálogo)', { name: e.product_name, q: e.quantity > 1 ? ' ×' + e.quantity : '' });
    case 'expense': if (e.kind === 'fine') return t('Multa: {c}', { c: e.entity || '' }); return e.category != null ? t('Despesa: {c}', { c: e.category }) : e.title;
    default: return e.title;
  }
}

export function timelineDetail(e) {
  switch (e.type) {
    case 'sale':
    case 'cancelled': {
      if (!e.sale?.items) return e.detail;
      const items = e.sale.items.map((it) => `${it.quantity} × ${it.product_name}`).join(', ');
      return e.type === 'cancelled' && e.sale.cancel_reason ? items + ' · ' + t('motivo: {r}', { r: e.sale.cancel_reason }) : items;
    }
    case 'loss': return [lossReason(e.reason), e.barcode ? t('código {c}', { c: e.barcode }) : null].filter(Boolean).join(' · ');
    case 'stock':
      if (e.product_name == null) return e.detail;
      return e.supplier_name ? t('fornecedor {name}', { name: e.supplier_name }) : (e.quantity >= 0 ? t('sem fornecedor') : t('ajuste do dono'));
    case 'debt_payment': return t('pagamento recebido');
    case 'shift': return e.amount === 0 ? t('contagem certa') : t('contagem com diferença');
    case 'demand': return t('oportunidade perdida');
    default: return e.detail;
  }
}

export const timelineWho = (e) => (e.type === 'loss' && e.auto ? t('Genesis (automático)') : e.who);

export function timelineExtra(e) {
  return [
    e.expiry_date ? t('validade {d}', { d: date(e.expiry_date) }) : null,
    e.due_date ? t('vence a {d}', { d: date(e.due_date) }) : null,
    e.discount ? t('desconto {v}', { v: money(e.discount) }) : null,
    e.type === 'loss' ? t('{v} por unidade', { v: money(e.unit_cost) }) : null,
    e.type === 'stock' ? t('{v} por unidade', { v: money(e.unit_cost) }) : null,
    e.type === 'shift' ? t('contado {a} · esperado {b}', { a: money(e.counted), b: money(e.expected) }) : null,
  ].filter(Boolean).join(' · ');
}

export function timelineWhen(e, sameDay) {
  if (e.day_only) return sameDay ? t('(dia)') : date(e.at);
  return sameDay ? timeSec(e.at) : `${date(e.at)} ${timeSec(e.at)}`;
}

// Valor em texto (o ecra usa cores; o PDF usa este texto).
export function timelineValueText(e) {
  if (e.effect === 'gain') return money(e.amount, { sign: true });
  if (e.effect === 'loss' || e.effect === 'expense') return money(e.amount);
  if (e.type === 'cancelled') return t('{v} (cancelada)', { v: money(e.sale.total_amount) });
  if (e.type === 'shift') return money(e.amount, { sign: true });
  return e.amount ? money(e.amount) : '—';
}
