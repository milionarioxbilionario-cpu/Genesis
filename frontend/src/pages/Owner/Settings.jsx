import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Card, CardHead, Button, Input, PageHead, Badge, Alert, useToast } from '../../components/ui';
import { AlertTriangle } from 'lucide-react';

const BUSINESS_LABEL = {
  bottle_store: 'Bottle Store / Loja de Bebidas', mercearia: 'Mercearia / Contentor',
  padaria: 'Padaria / Cafe', talho: 'Talho', supermercado: 'Supermercado',
  restaurante: 'Restaurante / Churrasqueira', boutique: 'Boutique', outro: 'Outro',
};
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Settings() {
  const toast = useToast();
  const [pin, setPin] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);
  const [hours, setHours] = useState({ opening: '08:00', closing: '18:00' });
  const [tenant, setTenant] = useState(null);
  const [savingPin, setSavingPin] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    api.get('/api/owner/settings/hours').then((r) => setHours({ opening: r.data?.opening || '08:00', closing: r.data?.closing || '18:00' })).catch(() => {});
    api.get('/api/sales/cancel-pin-status').then((r) => setPinConfigured(Boolean(r.data?.configured))).catch(() => {});
    api.get('/api/owner/tenant').then((r) => setTenant(r.data || null)).catch(() => {});
  }, []);

  async function savePin(e) {
    e.preventDefault();
		if (!/^\d{4,6}$/.test(pin)) { toast.push('O PIN deve ter 4 a 6 digitos.', 'warn'); return; }
    setSavingPin(true);
    try {
      await api.post('/api/sales/cancel-pin', { pin });
      toast.push('PIN de cancelamento guardado.', 'ok');
      setPin('');
      setPinConfigured(true);
    } catch (err) { toast.push(err?.response?.data?.error || 'Nao foi possivel guardar o PIN.', 'err'); }
    finally { setSavingPin(false); }
  }

  async function saveHours(e) {
    e.preventDefault();
    setSavingHours(true);
    try {
      await api.post('/api/owner/settings/hours', hours);
      toast.push('Horario guardado.', 'ok');
    } catch (err) { toast.push(err?.response?.data?.error || 'Nao foi possivel guardar o horario.', 'err'); }
    finally { setSavingHours(false); }
  }

  return (
    <div className="g-page">
      <PageHead title="Definicoes" sub="PIN de seguranca, horario de funcionamento e dados da loja" />

      <div className="g-cols-2" style={{ marginBottom: 24 }}>
        <Card>
          <CardHead title="PIN de cancelamento" hint="Exigido para anular uma venda ja impressa"
            action={<Badge tone={pinConfigured ? 'ok' : 'warn'}>{pinConfigured ? 'CONFIGURADO' : 'POR CONFIGURAR'}</Badge>} />
          {!pinConfigured && (
            <div style={{ marginBottom: 16 }}>
              <Alert tone="warn" icon={<AlertTriangle size={17} aria-hidden="true" />}>Sem PIN, os caixistas nao conseguem anular vendas (o que e seguro) — mas tu tambem nao. Define um PIN.</Alert>
            </div>
          )}
          <form onSubmit={savePin} style={{ display: 'grid', gap: 14 }}>
            <Input label="Novo PIN (4 a 6 digitos)" type="password" inputMode="numeric" maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••" hint="Fica guardado com encriptacao (nunca em texto simples)" />
            <div><Button variant="primary" type="submit" disabled={savingPin}>{savingPin ? 'A guardar...' : 'Guardar PIN'}</Button></div>
          </form>
        </Card>

        <Card>
          <CardHead title="Horario de funcionamento" hint="Usado no fecho do dia e nos relatorios" />
          <form onSubmit={saveHours} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <Input label="Abertura" type="time" value={hours.opening} onChange={(e) => setHours((p) => ({ ...p, opening: e.target.value }))} />
              <Input label="Fecho" type="time" value={hours.closing} onChange={(e) => setHours((p) => ({ ...p, closing: e.target.value }))} />
            </div>
            <div><Button variant="primary" type="submit" disabled={savingHours}>{savingHours ? 'A guardar...' : 'Guardar horario'}</Button></div>
          </form>
        </Card>
      </div>

      <Card>
        <CardHead title="Dados da loja" hint="Informacao do teu estabelecimento no Genesis"
          action={<Badge tone={tenant?.status === 'active' ? 'ok' : tenant?.status === 'trial' ? 'info' : 'neutral'}>{tenant?.status || '—'}</Badge>} />
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[
            ['Nome da loja', tenant?.name],
            ['Dono', tenant?.owner_name],
            ['Tipo de negocio', BUSINESS_LABEL[tenant?.business_type] || tenant?.business_type],
            ['Localizacao', tenant?.location],
            ['Telefone', tenant?.phone],
            ['Email', tenant?.email || '—'],
            ['Plano mensal', tenant?.subscription_price ? MZN(tenant.subscription_price) : '—'],
            ['Cliente desde', tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString('pt-MZ') : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="g-stat-label">{label}</div>
              <div style={{ color: 'var(--text)', fontWeight: 600, marginTop: 4 }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ height: 28 }} />
    </div>
  );
}
