import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import api from '../utils/api';
import { money, int, errorMessage } from '../utils/format';
import { Alert, Button, Dialog, KeyValue, Select, Stat, useToast } from './ui';

// Fecho do mes (Genesis 2.1, Fase 5.3): a partir do dia do fecho
// (Definicoes -> Loja), o 1.o acesso do dono mostra o relatorio do mes anterior
// e a lista de compras sugerida, com "Contactar fornecedor agora?".
// "Agora nao" guarda a lista como rascunho. Fechar no X adia so esta sessao.
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const sessionKey = (key) => 'genesis:fecho-mes:' + key;
const skipped = (key) => { try { return sessionStorage.getItem(sessionKey(key)) === '1'; } catch { return false; } };
const skip = (key) => { try { sessionStorage.setItem(sessionKey(key), '1'); } catch { /* sem storage: volta a aparecer */ } };

export default function MonthCloseDialog() {
  const toast = useToast();
  const [state, setState] = useState(null); // { status, report, suggestion, suppliers }
  const [supplierId, setSupplierId] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // O relatorio mensal faz muitas consultas. Com a BD longe (Maputo ->
    // Frankfurt) e o pool pequeno, pedir tudo ao mesmo tempo que o Inicio
    // esgotava as ligacoes (P2024). Por isso: espera o Inicio carregar, pede
    // um de cada vez e tenta outra vez se falhar.
    const get = async (url) => {
      for (let attempt = 1; ; attempt++) {
        try { return (await api.get(url)).data; } catch (err) {
          if (attempt >= 3 || (err.response && err.response.status < 500)) throw err;
          await wait(3000 * attempt);
        }
      }
    };
    (async () => {
      try {
        await wait(2500);
        const st = alive && await get('/api/owner/month-close');
        if (!st || !st.due || skipped(st.key)) return;
        const report = await get(`/api/owner/reports/monthly?year=${st.year}&month=${st.month}`);
        const suggestion = await get('/api/shopping-lists/suggestion?days=30');
        const suppliers = await get('/api/inventory/suppliers');
        if (alive) setState({ status: st, report, suggestion, suppliers });
      } catch { /* sem fecho desta vez; volta a tentar no proximo acesso */ }
    })();
    return () => { alive = false; };
  }, []);

  if (!state) return null;
  const { status, report: r, suggestion, suppliers } = state;
  const items = suggestion.items || [];
  const supplier = suppliers.find((s) => s.id === supplierId);
  const title = `Fecho de ${MONTHS[status.month - 1]} ${status.year}`;
  const listBody = () => ({
    name: `Compras depois do fecho de ${MONTHS[status.month - 1]}`,
    supplier_id: supplierId || null,
    items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost })),
  });
  async function seen(choice, listId) {
    await api.post('/api/owner/month-close/seen', { year: status.year, month: status.month, choice, shopping_list_id: listId || null });
  }
  async function finish(kind) {
    // A janela do WhatsApp abre ja no clique, senao o browser bloqueia o pop-up.
    const win = kind === 'contact' ? window.open('', '_blank') : null;
    setBusy(kind); setError('');
    try {
      let listId = null;
      if (items.length > 0 && kind !== 'dismiss') {
        listId = (await api.post('/api/shopping-lists', listBody())).data.id;
        if (kind === 'contact') {
          const wa = await api.get(`/api/shopping-lists/${listId}/whatsapp`);
          if (win) win.location.href = wa.data.url; else window.location.href = wa.data.url;
          await api.put(`/api/shopping-lists/${listId}/status`, { status: 'sent' });
        }
      }
      await seen(kind === 'contact' ? 'contacted' : kind === 'later' ? 'later' : 'dismissed', listId);
      if (kind === 'later' && listId) toast('Lista guardada como rascunho em Produtos → Lista de compras.');
      if (kind === 'contact') toast('Mensagem aberta no WhatsApp. A lista ficou como enviada.');
      setState(null);
    } catch (err) {
      win?.close();
      setError(errorMessage(err));
    } finally { setBusy(''); }
  }
  const close = () => { skip(status.key); setState(null); };

  return (
    <Dialog open onClose={close} size="lg" title={title} description="O resumo do mês que terminou e o que comprar a seguir.">
      <div className="flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Receita" value={money(r.gross_revenue)} delta={r.compare?.revenue_change_pct ?? undefined} hint={`vs ${money(r.compare?.previous_revenue || 0)} no mês anterior`} />
          <Stat label="Lucro líquido real" value={money(r.net_profit)} tone={r.net_profit < 0 ? 'danger' : 'positive'} hint="Depois de salários, renda, entregas e despesas" />
        </div>
        <div className="rounded border border-border p-3">
          <KeyValue label="Lucro bruto" value={money(r.gross_profit)} />
          <KeyValue label="Despesas do mês (salários, renda, entregas, avulsas)" value={'−' + money(r.deductions.operating_expenses)} />
          {r.losses_total > 0 && <KeyValue label="Perdas (quebras e validades)" value={'−' + money(r.losses_total)} tone="danger" />}
          {r.goal && <KeyValue label="Meta" value={`${String(r.goal.pct).replace('.', ',')}% de ${money(r.goal.target)}`} />}
        </div>
        <Link to={`/app/relatorios?tab=monthly&y=${status.year}&m=${status.month}`} onClick={close} className="text-sm text-accent">Ver o relatório completo</Link>

        <div>
          <p className="font-medium text-ink">O que comprar para os próximos 30 dias</p>
          {items.length === 0 ? (
            <p className="text-sm text-ink-muted">O stock actual chega. Não há nada a encomendar agora.</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-ink-muted">{int(items.length)} produto(s), {money(suggestion.total_investment)} ao custo{supplier ? ` + entrega ${money(supplier.delivery_cost_per_visit)}` : ''}.</p>
              <ul className="mb-3 divide-y divide-border rounded border border-border text-sm">
                {items.slice(0, 6).map((i) => (
                  <li key={i.product_id} className="flex justify-between gap-3 px-3 py-1.5"><span className="truncate text-ink-2">{i.name}</span><span className="num text-ink">{int(i.quantity)} un.</span></li>
                ))}
                {items.length > 6 && <li className="px-3 py-1.5 text-ink-muted">e mais {items.length - 6}…</li>}
              </ul>
              <Select label="Fornecedor" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Escolher no WhatsApp</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {items.length === 0 ? (
          <Button variant="primary" loading={busy === 'dismiss'} onClick={() => finish('dismiss')}>Fechar</Button>
        ) : (
          <>
            <Button loading={busy === 'later'} disabled={Boolean(busy)} onClick={() => finish('later')}>Agora não</Button>
            <Button variant="primary" icon={MessageCircle} loading={busy === 'contact'} disabled={Boolean(busy)} onClick={() => finish('contact')}>Contactar fornecedor agora</Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
