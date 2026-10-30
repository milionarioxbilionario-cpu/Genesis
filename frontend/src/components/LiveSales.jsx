import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { money } from '../utils/format';
import { usePrivacy } from '../utils/privacy';
import { useI18n } from '../i18n/react';
import { useToast } from './ui';

// Etapa C: aviso de venda para o dono, em qualquer pagina do painel
// («Venda n.º 12: 450,00 MT · lucro 120,00 MT»). Tocar abre as vendas.
// Canal /api/owner/live (so a loja de quem pede). Modo privado: sem valores.
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
      const n = d.daily_number ? String(d.daily_number).padStart(3, '0') : '';
      const text = kind === 'sale'
        ? (h ? tr('Nova venda (n.º {n}).', { n }) : tr('Venda n.º {n}: {total} · lucro {profit}', { n, total: money(d.total), profit: money(d.profit || 0) }))
        : (h ? tr('Venda cancelada.') : tr('Venda cancelada: {total}', { total: money(d.total) }));
      push(<button type="button" className="text-left" onClick={() => go('/app/vendas')}>{text}</button>, kind === 'sale' ? 'positive' : 'danger');
    };
    es.addEventListener('sale', show('sale'));
    es.addEventListener('cancel', show('cancel'));
    return () => es.close();
  }, []);
  return null;
}
