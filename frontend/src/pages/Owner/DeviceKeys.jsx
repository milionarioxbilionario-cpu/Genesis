import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import db from '../../db/localDb';
import { Card, CardHead, Button, Badge, Input, PageHead, Table, EmptyState, Skeleton, Modal, Alert, useToast } from '../../components/ui';
import { KeyRound } from 'lucide-react';

/* CHAVES DE DISPOSITIVO — sync offline.
   CORRECCAO: fala com /api/device-keys (plural, o path montado no backend)
   via axios (cookies). Antes usava fetch + alert/confirm e falhava em prod. */
const dt = (v) => (v ? new Date(v).toLocaleString('pt-MZ') : '\u2014');

export default function DeviceKeysPage() {
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceName, setDeviceName] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);
  const [toRevoke, setToRevoke] = useState(null);
  const [revoking, setRevoking] = useState(false);

  async function fetchKeys() {
    setLoading(true);
    try { const res = await api.get('/api/device-keys'); setKeys(res.data || []); }
    catch { toast.push('Nao foi possivel carregar as chaves.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { fetchKeys(); }, []);

  const createKey = async (e) => {
    e?.preventDefault?.();
    setIssuing(true);
    try {
      const body = (await api.post('/api/device-keys', { device_name: deviceName || 'device-' + Date.now() })).data;
      try { await db.device_keys.put({ id: body.id, device_name: deviceName || 'device', created_at: new Date().toISOString(), secret: body.secret }); } catch {}
      setCreatedSecret(body.secret);
      setDeviceName('');
      toast.push('Chave emitida. Copia o segredo agora — so aparece uma vez.', 'ok');
      await fetchKeys();
    } catch (err) { toast.push(err?.response?.data?.error || 'Nao foi possivel emitir a chave.', 'err'); }
    finally { setIssuing(false); }
  };

  const revokeKey = async () => {
    if (!toRevoke) return;
    setRevoking(true);
    try {
      await api.post(`/api/device-keys/${toRevoke.id}/revoke`);
      try { await db.device_keys.delete(toRevoke.id); } catch {}
      toast.push('Chave revogada.', 'ok');
      setToRevoke(null);
      await fetchKeys();
    } catch (err) { toast.push(err?.response?.data?.error || 'Nao foi possivel revogar.', 'err'); }
    finally { setRevoking(false); }
  };

  const active = keys.filter((k) => !k.revoked_at).length;

  return (
    <div className="g-page">
      <PageHead title="Chaves de Dispositivo" sub="Sync offline do balcao — emite e revoga chaves"
        actions={<Button variant="ghost" onClick={fetchKeys}>Atualizar</Button>} />
      <div className="g-kpis" style={{ marginBottom: 24 }}>
        <Card tight><div className="g-stat"><span className="g-stat-label">Chaves</span><span className="g-stat-value">{keys.length}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Activas</span><span className="g-stat-value" style={{ color: 'var(--ok)' }}>{active}</span></div></Card>
      </div>
      <Card style={{ marginBottom: 24 }}>
        <CardHead title="Emitir chave" hint="O segredo aparece uma unica vez" />
        <form onSubmit={createKey} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240, flex: 1 }}><Input label="Nome do dispositivo" placeholder="Ex: balcao-01" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} /></div>
          <Button variant="primary" type="submit" disabled={issuing}>{issuing ? 'A emitir...' : 'Emitir chave'}</Button>
        </form>
        {createdSecret && (
          <div style={{ marginTop: 16 }}>
            <Alert tone="warn" icon={<KeyRound size={26} aria-hidden="true" />}>Copia o segredo agora — nao volta a aparecer.
              <code style={{ display: 'block', marginTop: 8, wordBreak: 'break-all', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>{createdSecret}</code>
            </Alert>
          </div>
        )}
      </Card>
      <Card tight>
        <div style={{ padding: '14px 16px 0' }}><CardHead title="Chaves registadas" /></div>
        {loading ? <div style={{ padding: 16 }}><Skeleton height={160} /></div> : (
          <Table rowKey={(r) => r.id} rows={keys}
            empty={<EmptyState icon={<KeyRound size={26} aria-hidden="true" />} title="Sem chaves" hint="Emite a primeira chave para o dispositivo do balcao." />}
            columns={[
              { key: 'device_name', label: 'Dispositivo', render: (r) => (<strong>{r.device_name}</strong>) },
              { key: 'created_at', label: 'Criada', render: (r) => dt(r.created_at) },
              { key: 'last_used_at', label: 'Ultimo uso', render: (r) => dt(r.last_used_at) },
              { key: 'revoked_at', label: 'Estado', render: (r) => <Badge tone={r.revoked_at ? 'neutral' : 'ok'}>{r.revoked_at ? 'REVOGADA' : 'ACTIVA'}</Badge> },
              { key: 'actions', label: '', align: 'right', render: (r) => (r.revoked_at ? <span style={{ color: 'var(--text-dim)' }}>—</span> : <Button variant="danger" small onClick={() => setToRevoke(r)}>Revogar</Button>) },
            ]} />
        )}
      </Card>
      <Modal open={Boolean(toRevoke)} title="Revogar chave" hint="O dispositivo deixa de sincronizar de imediato."
        onClose={() => setToRevoke(null)} width={460}
        footer={<><Button variant="ghost" onClick={() => setToRevoke(null)}>Cancelar</Button><Button variant="danger" onClick={revokeKey} disabled={revoking}>{revoking ? 'A revogar...' : 'Sim, revogar'}</Button></>}>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Revogar a chave de <strong style={{ color: 'var(--text)' }}>{toRevoke?.device_name}</strong>?</p>
      </Modal>
      <div style={{ height: 28 }} />
    </div>
  );
}
