import React, { useState } from 'react';
import { Crosshair, Link2, MapPin } from 'lucide-react';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { useI18n } from '../../i18n/react';
import { Alert, Button, Card, CardHeader, Input, useToast } from '../../components/ui';

// Etapa C: ponto do estabelecimento no mapa (para o mapa ao vivo e o painel
// geral). Duas formas: GPS do aparelho ou link do Google Maps (o servidor le
// as coordenadas). Pre-visualizacao: imagem estatica do Mapbox.
// 31/10 (lista «e se...?»): e se o dono estiver em casa, ou num PC sem GPS?
// O ponto ja nao se grava logo: aparece no mapa com a precisao («± 12 m») e so
// se grava depois de confirmar. Precisao fraca (> 100 m = posicao pela rede) e
// ponto fora de Mocambique dao aviso. A morada escrita ajuda quem for visitar.
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const preview = (g) => (TOKEN && g
  ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+0B4D3B(${g.lng},${g.lat})/${g.lng},${g.lat},16,0,45/640x280@2x?access_token=${TOKEN}`
  : null);
// Caixa larga a volta de Mocambique (so para avisar; outros paises sao aceites).
export const inMozambique = (g) => g.lat >= -27 && g.lat <= -10.3 && g.lng >= 30.2 && g.lng <= 41;

export default function LocationCard({ s, reload, compact = false }) {
  const toast = useToast();
  const { t } = useI18n();
  const [geo, setGeo] = useState(s.geo || null);
  const [pending, setPending] = useState(null); // { lat, lng, accuracy?, how }
  const [address, setAddress] = useState(s.geo?.address || '');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function save(point) {
    setBusy('save'); setError('');
    try {
      const { data } = await api.put('/api/settings/location', { lat: point.lat, lng: point.lng, address: address.trim() || null });
      setGeo(data.location); setPending(null); setText('');
      toast(t('Localização guardada.'));
      reload?.();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  function useGps() {
    if (!navigator.geolocation) { setError(t('Este aparelho não dá a localização. Cole um link do Google Maps.')); return; }
    setBusy('gps'); setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(''); setPending({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy || 0), how: 'gps' }); },
      () => { setBusy(''); setError(t('Não foi possível obter a localização. Autorize a localização no browser ou cole um link do Google Maps.')); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }
  async function fromLink() {
    setBusy('link'); setError('');
    try {
      const { data } = await api.post('/api/settings/location/resolve', { text });
      setPending({ lat: data.lat, lng: data.lng, how: 'link' });
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }

  const shown = pending || geo;
  const img = preview(shown);
  return (
    <Card>
      <CardHeader title={t('Onde fica o estabelecimento?')} description={t('Muito importante: é o ponto exacto do seu estabelecimento no mapa. Se ainda não sabe a localização certa, pode configurar mais tarde nas Definições. Mas não se esqueça.')} />
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      {shown ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-border">
          {img ? <img src={img} alt={t('Mapa com o ponto do estabelecimento')} className={compact ? 'block h-32 w-full object-cover' : 'block h-40 w-full object-cover'} loading="lazy" /> : null}
          <p className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm text-ink-2">
            <MapPin size={16} className="text-accent" />
            <span className="num">{shown.lat.toFixed(5)}, {shown.lng.toFixed(5)}</span>
            {pending?.accuracy ? <span className="text-ink-muted">{t('precisão ± {m} m', { m: pending.accuracy })}</span> : null}
            {!pending && geo ? <span className="text-positive">{t('guardado')}</span> : null}
          </p>
        </div>
      ) : <p className="mb-4 text-sm text-warning">{t('Ainda sem ponto no mapa.')}</p>}
      {pending && (
        <div className="mb-4 flex flex-col gap-3">
          {pending.accuracy > 100 && <Alert tone="warning">{t('A precisão é fraca (± {m} m): parece a localização da rede, não do sítio exacto. Se puder, use o telemóvel dentro do estabelecimento, ou cole o link do Google Maps.', { m: pending.accuracy })}</Alert>}
          {!inMozambique(pending) && <Alert tone="warning">{t('Este ponto fica fora de Moçambique. Tem a certeza de que é aqui?')}</Alert>}
          {pending.how === 'gps' && <p className="text-sm text-ink-muted">{t('É a posição deste aparelho agora. Se está em casa e não no estabelecimento, não guarde: cole o link do Google Maps do sítio certo.')}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={busy === 'save'} onClick={() => save(pending)}>{t('Guardar este ponto')}</Button>
            <Button variant="ghost" onClick={() => setPending(null)}>{t('Cancelar')}</Button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <Input label={t('Morada (rua ou avenida, cruzamento, ponto de referência)')} placeholder={t('Ex.: Av. Eduardo Mondlane, cruzamento com a Av. Karl Marx, ao lado da farmácia')} maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} />
        {geo && !pending && address.trim() !== (geo.address || '') && <Button className="self-start" size="sm" loading={busy === 'save'} onClick={() => save(geo)}>{t('Guardar a morada')}</Button>}
        <Button icon={Crosshair} loading={busy === 'gps'} onClick={useGps}>{t('Usar a localização deste aparelho')}</Button>
        <div className="flex items-end gap-2">
          <Input className="flex-1" label={t('Ou cole um link do Google Maps')} placeholder="https://maps.app.goo.gl/…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button icon={Link2} loading={busy === 'link'} disabled={text.trim().length < 3} onClick={fromLink}>{t('Usar')}</Button>
        </div>
      </div>
    </Card>
  );
}
