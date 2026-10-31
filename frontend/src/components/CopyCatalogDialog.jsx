import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { errorMessage } from '../utils/format';
import { newUuid } from '../utils/syncPolicy';
import { useI18n } from '../i18n/react';
import { Alert, Button, Dialog, Select, Spinner, useToast } from './ui';

// 31/10 (o fundador: «nao tinha a opcao de importar o catalogo da loja que ja
// tenho»). Copia os produtos de outro estabelecimento do mesmo dono para este:
// nome, categoria, precos, codigo de barras, IVA, unidade, stock minimo e
// validade. O stock nao (e fisico). Os que ja existem aqui saltam-se.
export default function CopyCatalogDialog({ open, onClose, onDone, others }) {
  const { t } = useI18n();
  const toast = useToast();
  const [from, setFrom] = useState('');
  const [rows, setRows] = useState(null);
  const [cats, setCats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [opId, setOpId] = useState(newUuid());

  useEffect(() => { if (open) { setFrom(others[0]?.id || ''); setError(''); setOpId(newUuid()); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open || !from) return;
    setRows(null); setCats(null);
    api.get('/api/establishments/' + from + '/catalog').then(({ data }) => { setRows(data); setCats(new Set(data.map((p) => p.category))); }).catch((err) => setError(errorMessage(err)));
  }, [open, from]);
  const byCat = useMemo(() => {
    const m = new Map();
    for (const p of rows || []) m.set(p.category, (m.get(p.category) || 0) + 1);
    return [...m].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);
  const chosen = (rows || []).filter((p) => cats?.has(p.category)).length;

  async function copy() {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/api/establishments/copy-catalog', { from, categories: [...cats], op_id: opId });
      toast(data.skipped ? t('Copiados {n} produtos; {s} já existiam aqui.', { n: data.copied, s: data.skipped }) : t('Copiados {n} produtos.', { n: data.copied }));
      onDone?.(); onClose();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} size="md" title={t('Copiar de outro estabelecimento')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!chosen} onClick={copy}>{t('Copiar {n} produtos', { n: chosen })}</Button></>}>
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      <div className="flex flex-col gap-3">
        <Select label={t('Copiar de')} value={from} onChange={(e) => setFrom(e.target.value)}>
          {others.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
        <p className="text-sm text-ink-muted">{t('Leva o nome, a categoria, os preços, o código de barras, o IVA, a unidade e o stock mínimo. O stock fica a zero: é o que está fisicamente noutro sítio. Os produtos que já existem aqui não se repetem.')}</p>
        {!rows ? <div className="flex justify-center py-6"><Spinner /></div> : (
          <div className="flex max-h-72 flex-col gap-1.5 overflow-auto">
            {byCat.map(([c, n]) => (
              <label key={c} className="flex items-center gap-2.5 rounded border border-border px-3 py-2 text-base text-ink">
                <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={cats.has(c)} onChange={(e) => setCats((s) => { const x = new Set(s); if (e.target.checked) x.add(c); else x.delete(c); return x; })} />
                <span className="flex-1">{c}</span><span className="num text-sm text-ink-muted">{n}</span>
              </label>
            ))}
            {byCat.length === 0 && <p className="text-sm text-ink-muted">{t('Esse estabelecimento ainda não tem produtos.')}</p>}
          </div>
        )}
      </div>
    </Dialog>
  );
}
