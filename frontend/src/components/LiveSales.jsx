import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { money } from '../utils/format';
import { usePrivacy } from '../utils/privacy';
import { useI18n } from '../i18n/react';
import { useToast } from './ui';

// Etapa C: avisos ao vivo para o dono, em qualquer pagina do painel. Canal
// /api/owner/live (so o estabelecimento de quem pede). Modo privado: sem valores.
// 31/10: alem das vendas (verde) e cancelamentos, tambem o que tira dinheiro
// do dia (perdas, txenekas, despesas, compras de stock — a vermelho) e os turnos.
// Tocar no aviso abre a pagina onde esta o detalhe.
const LIVE = {
  sale: { tone: 'positive', to: '/app/vendas' },
  cancel: { tone: 'danger', to: '/app/vendas' },
  loss: { tone: 'danger', to: '/app/relatorios' },
  debt: { tone: 'danger', to: '/app/txenekas' },
  debt_payment: { tone: 'positive', to: '/app/txenekas' },
  expense: { tone: 'danger', to: '/app/relatorios' },
  stock_in: { tone: 'warning', to: '/app/produtos' },
  shift_open: { tone: 'info', to: '/app' },
  shift_close: { tone: 'info', to: '/app' },
  shift_fail: { tone: 'danger', to: '/app/definicoes?tab=audit' },
};

export function liveText(kind, d, t, hidden) {
  const v = (c) => money(c || 0);
  const n = d.daily_number ? String(d.daily_number).padStart(3, '0') : '';
  switch (kind) {
    // E2: ao gerente o servidor nao manda o lucro nem o valor (a custo) das perdas e compras.
    case 'sale': return hidden ? t('Nova venda (n.º {n}).', { n }) : d.profit == null ? t('Venda n.º {n}: {total}', { n, total: v(d.total) }) : t('Venda n.º {n}: {total} · lucro {profit}', { n, total: v(d.total), profit: v(d.profit) });
    case 'cancel': return hidden ? t('Venda cancelada.') : t('Venda cancelada: {total}', { total: v(d.total) });
    case 'loss': return hidden ? t('Perda registada.') : d.total == null ? t('Perda: {name}', { name: d.name || '' }) : t('Perda: {name} −{total}', { name: d.name || '', total: v(d.total) });
    case 'debt': return hidden ? t('Nova txeneka.') : t('Txeneka de {name}: −{total}', { name: d.name || '', total: v(d.total) });
    case 'debt_payment': return hidden ? t('Txeneka paga.') : t('Txeneka paga ({name}): +{total}', { name: d.name || '', total: v(d.total) });
    case 'expense': return hidden ? t('Despesa registada.') : t('Despesa: {name} −{total}', { name: d.name || '', total: v(d.total) });
    case 'stock_in': return hidden ? t('Compra de stock registada.') : d.total == null ? t('Compra de stock: {name}', { name: d.name || '' }) : t('Compra de stock: {name} −{total}', { name: d.name || '', total: v(d.total) });
    case 'shift_open': return t('Turno aberto: {name}', { name: d.name || '' });
    case 'shift_close': return hidden || !d.difference ? t('Turno fechado: {name}', { name: d.name || '' }) : t('Turno fechado: {name} (sobra {total})', { name: d.name || '', total: v(d.difference) });
    case 'shift_fail': return hidden ? t('Fecho de turno falhado: {name}', { name: d.name || '' }) : t('Fecho falhado: {name} escreveu {declared}, o Genesis esperava {expected} (tentativa {n}/3)', { name: d.name || '', declared: v(d.declared), expected: v(d.expected), n: d.attempt || 1 });
    default: return '';
  }
}

export default function LiveSales() {
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { hidden } = usePrivacy();
  const ref = useRef({ hidden, t, toast, navigate });
  ref.current = { hidden, t, toast, navigate };

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const es = new EventSource('/api/owner/live', { withCredentials: true });
    const show = (kind) => (ev) => {
      let d; try { d = JSON.parse(ev.data); } catch { return; }
      const { hidden: h, t: tr, toast: push, navigate: go } = ref.current;
      const text = liveText(kind, d, tr, h);
      if (!text) return;
      push(<button type="button" className="text-left" onClick={() => go(LIVE[kind].to)}>{text}</button>, LIVE[kind].tone);
    };
    for (const kind of Object.keys(LIVE)) es.addEventListener(kind, show(kind));
    return () => es.close();
  }, []);
  return null;
}
