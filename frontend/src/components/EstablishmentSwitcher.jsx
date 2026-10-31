import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LayoutGrid, Plus, Store } from 'lucide-react';
import api, { announceEstablishmentChange } from '../utils/api';
import { newUuid } from '../utils/syncPolicy';
import { errorMessage } from '../utils/format';
import { forgetOwnerData } from '../utils/session';
import { useI18n } from '../i18n/react';
import { BUSINESS_TYPES } from '../pages/auth/RequestAccount';
import { Alert, Button, Drawer, Input, Select, cx } from './ui';

// Etapa D: o dono escolhe em que estabelecimento trabalha, abre o «Painel
// geral» (somas de todos) ou acrescenta um estabelecimento. Ao trocar, tudo o
// que estava guardado no aparelho do estabelecimento anterior e apagado.
export default function EstablishmentSwitcher({ open, onClose }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [adding, setAdding] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError(''); setAdding(null);
    api.get('/api/establishments').then((r) => setList(r.data)).catch((err) => setError(errorMessage(err)));
  }, [open]);

  async function switchTo(id) {
    setBusy(id); setError('');
    try {
      await api.post('/api/establishments/switch', { tenant_id: id });
      announceEstablishmentChange(id);
      await forgetOwnerData();
      window.location.assign('/app');
    } catch (err) { setError(errorMessage(err)); setBusy(''); }
  }
  async function reopen(id) {
    setBusy(id); setError('');
    try { await api.post('/api/establishments/' + id + '/reopen'); const r = await api.get('/api/establishments'); setList(r.data); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function create() {
    setBusy('add'); setError('');
    try {
      const { data } = await api.post('/api/establishments', adding);
      await switchTo(data.id); // abre no onboarding do estabelecimento novo
    } catch (err) { setError(errorMessage(err)); setBusy(''); }
  }

  const types = BUSINESS_TYPES.filter((b) => !b.pending);
  return (
    <Drawer open={open} onClose={onClose} title={t('Os seus estabelecimentos')} description={t('Cada estabelecimento tem os seus produtos, caixistas e vendas, separados.')}
      footer={adding
        ? <><Button onClick={() => setAdding(null)}>{t('Voltar')}</Button><Button variant="primary" loading={busy === 'add'} disabled={adding.name.trim().length < 3 || adding.location.trim().length < 3} onClick={create}>{t('Criar e abrir')}</Button></>
        : <Button onClick={onClose}>{t('Fechar')}</Button>}>
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      {adding ? (
        <div className="flex flex-col gap-4">
          <Input label={t('Nome do estabelecimento')} value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} autoFocus />
          <Select label={t('Tipo de negócio')} value={adding.business_type} onChange={(e) => setAdding({ ...adding, business_type: e.target.value })}>
            {types.map((b) => <option key={b.value} value={b.value}>{t(b.label)}</option>)}
          </Select>
          <Input label={t('Localização')} placeholder={t('Bairro, cidade')} value={adding.location} onChange={(e) => setAdding({ ...adding, location: e.target.value })} />
          <p className="text-sm text-ink-muted">{t('Depois de criar, configura-o como fez com o primeiro: produtos, custos e equipa.')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(list || []).map((e) => (
            <button key={e.id} type="button" disabled={e.is_current || Boolean(busy) || e.available === false} onClick={() => switchTo(e.id)}
              className={cx('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors', e.is_current ? 'border-accent bg-accent-soft' : 'border-border hover:bg-subtle')}>
              <Store size={18} className="shrink-0 text-ink-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{e.name}</span>
                <span className="block truncate text-xs text-ink-muted">{e.location}{e.available === false ? ' · ' + t('suspenso') : e.status === 'closed' ? ' · ' + t('encerrado (só consulta)') : e.onboarding_completed ? '' : ' · ' + t('por configurar')}</span>
              </span>
              {e.is_current && <Check size={18} className="text-accent" aria-label={t('Actual')} />}
              {e.status === 'closed' && e.closed_at && Date.now() - new Date(e.closed_at).getTime() < 30 * 86400000 && (
                <span role="button" tabIndex={0} className="rounded px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft" onClick={(ev) => { ev.stopPropagation(); reopen(e.id); }} onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.stopPropagation(); reopen(e.id); } }}>{t('Reabrir')}</span>
              )}
            </button>
          ))}
          {list && list.length > 1 && <Button className="mt-2" icon={LayoutGrid} onClick={() => { onClose(); navigate('/app/geral'); }}>{t('Painel geral')}</Button>}
          <Button className="mt-1" icon={Plus} onClick={() => setAdding({ client_id: newUuid(), name: '', business_type: types[0]?.value || 'mercearia', location: '' })}>{t('Acrescentar estabelecimento')}</Button>
        </div>
      )}
    </Drawer>
  );
}
