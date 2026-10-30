import React, { useState } from 'react';
import { Crosshair, Link2, MapPin } from 'lucide-react';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { useI18n } from '../../i18n/react';
import { Alert, Button, Card, CardHeader, Input, useToast } from '../../components/ui';

// Etapa C: ponto do estabelecimento no mapa (para o mapa ao vivo e, depois, o
// painel geral de varios estabelecimentos). Tres formas: GPS do aparelho, link
// do Google Maps (o servidor le as coordenadas) ou coordenadas escritas.
// Pre-visualizacao: imagem estatica do Mapbox (sem carregar o mapa inteiro).
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const preview = (g) => (TOKEN && g
  ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+0B4D3B(${g.lng},${g.lat})/${g.lng},${g.lat},16,0,45/640x280@2x?access_token=${TOKEN}`
  : null);

export default function LocationCard({ s, reload }) {
  const toast = useToast();
  const { t } = useI18n();
  const [geo, setGeo] = useState(s.geo || null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function save(point, how) {
    setBusy(how); setError('');
    try {
      const { data } = await api.put('/api/settings/location', { lat: point.lat, lng: point.lng, address: s.store?.location || null });
      setGeo(data.location); setText('');
      toast(t('Localização guardada.'));
      reload?.();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  function useGps() {
    if (!navigator.geolocation) { setError(t('Este aparelho não dá a localização. Cole um link do Google Maps.')); return; }
    setBusy('gps'); setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => save({ lat: p.coords.latitude, lng: p.coords.longitude }, 'gps'),
      () => { setBusy(''); setError(t('Não foi possível obter a localização. Autorize a localização no browser ou cole um link do Google Maps.')); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  async function fromLink() {
    setBusy('link'); setError('');
    try {
      const { data } = await api.post('/api/settings/location/resolve', { text });
      await save(data, 'link');
    } catch (err) { setError(errorMessage(err)); setBusy(''); }
  }

  const img = preview(geo);
  return (
    <Card>
      <CardHeader title={t('Localização no mapa')} description={t('Importante para o mapa dos seus estabelecimentos. Pode configurar mais tarde.')} />
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      {geo ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-border">
          {img ? <img src={img} alt={t('Mapa com o ponto do estabelecimento')} className="block h-40 w-full object-cover" loading="lazy" /> : null}
          <p className="flex items-center gap-2 px-3 py-2 text-sm text-ink-2"><MapPin size={16} className="text-accent" /><span className="num">{geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</span></p>
        </div>
      ) : <p className="mb-4 text-sm text-warning">{t('Ainda sem ponto no mapa.')}</p>}
      <div className="flex flex-col gap-3">
        <Button icon={Crosshair} loading={busy === 'gps'} onClick={useGps}>{t('Usar a localização deste aparelho')}</Button>
        <div className="flex items-end gap-2">
          <Input className="flex-1" label={t('Ou cole um link do Google Maps')} placeholder="https://maps.app.goo.gl/…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button icon={Link2} loading={busy === 'link'} disabled={text.trim().length < 3} onClick={fromLink}>{t('Usar')}</Button>
        </div>
      </div>
    </Card>
  );
}
