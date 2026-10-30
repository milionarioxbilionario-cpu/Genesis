import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Globe2, Satellite } from 'lucide-react';
import { useI18n } from '@i18n/react.jsx';
import { money, errorMessage } from '../../frontend/src/utils/format.js';
import { Alert, Button, Card, PageHeader } from '@ui';

// Etapa C: mapa ao vivo do super admin (Mapbox GL, globo 3D com predios).
//  - pinos = estabelecimentos com ponto no mapa (Definicoes > Localizacao);
//  - venda: bolha verde «+X MT» por cima do pino; cancelamento: vermelha «−X MT»;
//  - luz do mapa conforme a hora de Maputo (madrugada, dia, fim de tarde, noite);
//  - «Satelite»: imagem de satelite com os predios em 3D.
// O mapbox-gl so se carrega nesta pagina (import dinamico): o resto do painel fica leve.
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/', withCredentials: true });
const MOZ = { center: [35.0, -18.5], zoom: 4.4 };

// Hora de Maputo (UTC+2, sem hora de verao) -> luz do estilo Standard.
export function maputoHour(now = new Date()) { return (now.getUTCHours() + 2) % 24; }
export function lightFor(hour) {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}
const STYLES = { map: 'mapbox://styles/mapbox/standard', satellite: 'mapbox://styles/mapbox/standard-satellite' };

export default function LiveMap() {
  const { t } = useI18n();
  const box = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef(new Map());
  const [points, setPoints] = useState([]);
  const [missing, setMissing] = useState([]);
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState(TOKEN ? '' : t('Falta a chave do Mapbox (VITE_MAPBOX_TOKEN).'));
  const [style, setStyle] = useState('map');
  const [clock, setClock] = useState(() => new Date());
  const [ready, setReady] = useState(false);

  useEffect(() => { const i = setInterval(() => setClock(new Date()), 30000); return () => clearInterval(i); }, []);

  // Dados: pontos e totais de hoje.
  useEffect(() => {
    api.get('/api/admin/map').then(({ data }) => { setPoints(data.points); setMissing(data.without_location); }).catch((err) => setError(errorMessage(err)));
  }, []);

  // Mapa (uma vez) + troca de estilo.
  useEffect(() => {
    if (!TOKEN || !box.current) return undefined;
    let alive = true;
    (async () => {
      const [{ default: mapboxgl }] = await Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')]);
      if (!alive) return;
      mapboxgl.accessToken = TOKEN;
      const map = new mapboxgl.Map({ container: box.current, style: STYLES[style], projection: 'globe', center: MOZ.center, zoom: MOZ.zoom, pitch: 45, bearing: -10, attributionControl: true });
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.on('style.load', () => { try { map.setConfigProperty('basemap', 'lightPreset', lightFor(maputoHour())); } catch { /* estilo sem luz configuravel */ } });
      mapRef.current = { map, mapboxgl };
      setReady(true); // os pinos so se desenham agora (os dados podem ter chegado antes do mapa)
    })().catch((err) => setError(t('Não foi possível abrir o mapa: {e}', { e: err.message })));
    return () => { alive = false; mapRef.current?.map.remove(); mapRef.current = null; markers.current.clear(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { mapRef.current?.map.setStyle(STYLES[style]); }, [style]);
  // Luz: muda com o relogio.
  useEffect(() => { try { mapRef.current?.map.setConfigProperty('basemap', 'lightPreset', lightFor(maputoHour(clock))); } catch { /* ainda a carregar */ } }, [clock]);

  // Pinos.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !points.length) return;
    for (const p of points) {
      if (markers.current.has(p.id)) continue;
      const el = document.createElement('div');
      el.className = 'genesis-pin';
      el.style.cssText = `width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35);background:${p.status === 'suspended' ? '#78716c' : '#0B4D3B'};position:relative;cursor:pointer`;
      el.title = p.name;
      const popup = new m.mapboxgl.Popup({ offset: 14 }).setHTML(`<strong>${p.name.replace(/[<>&]/g, '')}</strong><br>${String(p.place || '').replace(/[<>&]/g, '')}<br>${t('Hoje')}: ${money(p.today_total)} (${p.today_count})`);
      markers.current.set(p.id, new m.mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(m.map));
    }
  }, [points, style, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ao vivo: bolhas por cima do pino e lista «Agora».
  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const es = new EventSource('/api/admin/live', { withCredentials: true });
    const on = (kind) => (ev) => {
      let d; try { d = JSON.parse(ev.data); } catch { return; }
      setFeed((f) => [{ ...d, kind, key: d.at + Math.random() }, ...f].slice(0, 20));
      if (kind === 'sale') setPoints((ps) => ps.map((p) => (p.id === d.tenant_id ? { ...p, today_total: p.today_total + d.total, today_count: p.today_count + 1 } : p)));
      const mk = markers.current.get(d.tenant_id);
      if (!mk) return;
      const b = document.createElement('div');
      b.textContent = (kind === 'sale' ? '+' : '−') + money(d.total);
      b.style.cssText = `position:absolute;bottom:20px;left:50%;transform:translateX(-50%);white-space:nowrap;font:600 12px Inter,sans-serif;padding:2px 6px;border-radius:6px;color:#fff;background:${kind === 'sale' ? '#047857' : '#b91c1c'};transition:transform 2.4s ease-out,opacity 2.4s ease-out;opacity:1`;
      mk.getElement().appendChild(b);
      requestAnimationFrame(() => { b.style.transform = 'translate(-50%,-36px)'; b.style.opacity = '0'; });
      setTimeout(() => b.remove(), 2600);
    };
    es.addEventListener('sale', on('sale'));
    es.addEventListener('cancel', on('cancel'));
    return () => es.close();
  }, []);

  const hh = String(maputoHour(clock)).padStart(2, '0') + ':' + String(clock.getUTCMinutes()).padStart(2, '0');
  const total = points.reduce((s, p) => s + p.today_total, 0);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('Mapa ao vivo')} description={t('Vendas a verde e cancelamentos a vermelho, no momento em que acontecem. Hora de Maputo: {h}.', { h: hh })} />
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="relative overflow-hidden rounded-lg border border-border bg-subtle" style={{ height: 'min(70vh, 640px)' }}>
          {/* h-full (nao absolute): o CSS do Mapbox poe o contentor em position:relative. */}
          <div ref={box} className="h-full w-full" data-testid="mapa" />
          <div className="absolute left-3 top-3 flex gap-1">
            <Button size="sm" variant={style === 'map' ? 'primary' : 'secondary'} icon={Globe2} onClick={() => setStyle('map')}>{t('Mapa')}</Button>
            <Button size="sm" variant={style === 'satellite' ? 'primary' : 'secondary'} icon={Satellite} onClick={() => setStyle('satellite')}>{t('Satélite')}</Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-sm text-ink-muted">{t('Vendido hoje nos estabelecimentos do mapa')}</p>
            <p className="num mt-1 text-2xl font-semibold text-ink">{money(total)}</p>
            <p className="mt-1 text-sm text-ink-muted">{t('{n} no mapa · {m} sem localização', { n: points.length, m: missing.length })}</p>
          </Card>
          <Card>
            <p className="mb-2 font-medium text-ink">{t('Agora')}</p>
            {feed.length === 0 ? <p className="text-sm text-ink-muted">{t('À espera da próxima venda…')}</p> : (
              <ul className="flex flex-col gap-1.5" aria-live="polite">
                {feed.map((e) => (
                  <li key={e.key} className="flex justify-between gap-2 text-sm">
                    <span className="truncate text-ink-2">{e.name || t('Estabelecimento sem localização')}</span>
                    <span className={'num shrink-0 font-medium ' + (e.kind === 'sale' ? 'text-positive' : 'text-danger')}>{e.kind === 'sale' ? '+' : '−'}{money(e.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {missing.length > 0 && (
            <Card>
              <p className="mb-1 font-medium text-ink">{t('Sem localização')}</p>
              <p className="mb-2 text-sm text-ink-muted">{t('O dono marca o ponto em Definições > Localização no mapa.')}</p>
              <ul className="text-sm text-ink-2">{missing.slice(0, 12).map((m) => <li key={m.id} className="truncate">{m.name}</li>)}</ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
