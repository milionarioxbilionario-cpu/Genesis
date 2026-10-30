// Etapa C: localizacao de cada estabelecimento. Puro (testado em tests/geo.test.js).
//
// O dono pode colar um link do Google Maps (ou escrever «-25.96, 32.58"). Os
// links longos trazem as coordenadas no proprio endereco; os curtos
// (maps.app.goo.gl) sao abertos pelo servidor so para ler o destino.
const PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // ponto exacto do marcador
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // centro do mapa
  /[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
  /^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/, // «-25.96, 32.58»
];

function validCoords(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}

// Texto/link -> { lat, lng } com 6 casas (cerca de 10 cm) ou null.
function parseLocation(text) {
  const s = String(text || '');
  for (const re of PATTERNS) {
    const m = s.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (validCoords(lat, lng)) return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
  }
  return null;
}

// So estes enderecos podem ser abertos pelo servidor (nada de pedidos para
// enderecos escolhidos por quem escreve: evita usar o servidor para espreitar a rede).
const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'g.co']);
// Lista fechada (antes: «termina em google.<qualquer coisa>», e o teste mostrou
// que google.com.evil.example passava).
const LONG_HOSTS = /^(www\.|maps\.)?google\.(com|co\.mz|pt|co\.za|com\.br|co\.uk)$/;
function mapsLinkKind(text) {
  let u;
  try { u = new URL(String(text || '').trim()); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  if (SHORT_HOSTS.has(u.hostname)) return 'short';
  if (LONG_HOSTS.test(u.hostname) && u.pathname.startsWith('/maps')) return 'long';
  return null;
}

module.exports = { parseLocation, validCoords, mapsLinkKind };
