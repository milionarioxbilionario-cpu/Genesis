// Etapa C: acontecimentos ao vivo (vendas, cancelamentos, fechos de turno) para
// o painel do dono e o mapa do admin, por Server-Sent Events. Num so processo
// (um servidor), por isso um EventEmitter chega; nada sai daqui para fora.
//
// Regra de isolamento: cada evento leva o tenant_id; a rota do dono so envia os
// eventos da loja dele (utils/liveBus.js nunca decide quem ve o que).
const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(1000);

// Nunca rebenta quem publica (uma venda nao pode falhar por causa do mapa).
function publish(event) {
  try { bus.emit('event', { ...event, at: event.at || new Date().toISOString() }); } catch { /* ignorado */ }
}

// E2 (revisao de 31/10): a sessao so era vista ao abrir o canal — um gerente
// desactivado (ou com a senha mudada, ou o estabelecimento suspenso) continuava a
// receber as vendas. Agora cada batimento volta a validar e o canal dura no
// maximo 30 min (o browser volta a ligar e passa outra vez pela autenticacao).
const { validateSessionClaims } = require('./sessionUser');
const { blockedTenantStatus } = require('./tenantStatus');
const MAX_STREAM_MS = 30 * 60 * 1000;

async function sessionStillValid(req) {
  if (!req.sessionClaims) return true;
  try {
    const check = await validateSessionClaims(req.sessionClaims);
    if (!check.ok) return false;
    return !(req.user && req.user.tenantId && await blockedTenantStatus(req.user.tenantId));
  } catch { return true; } // falha da BD nao e falta de sessao (como no middleware)
}

// Abre um canal SSE: `filter(event)` decide o que este cliente ve; `shape(event)`
// tira o que ele nao deve ver; `recheck()` (opcional) diz se ainda pode ver.
// Batimento a cada 25 s (o nginx corta aos 90 s).
function openStream(req, res, { filter, shape = (e) => e, recheck }) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  res.write('retry: 5000\n\n');
  // Cada cliente isolado: um que falhe nao impede os outros de receber o evento.
  const send = (e) => {
    try {
      if (!filter(e)) return;
      const data = shape(e);
      if (data) res.write(`event: ${e.type}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch { /* este cliente perde este evento */ }
  };
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(beat); clearTimeout(cap); bus.off('event', send);
    try { res.end(); } catch { /* ja fechado */ }
  };
  bus.on('event', send);
  const beat = setInterval(async () => {
    const ok = (await sessionStillValid(req)) && (!recheck || await recheck().catch(() => true));
    if (!ok) return close();
    if (!closed) res.write(': ok\n\n');
  }, Number(process.env.LIVE_BEAT_MS) || 25000);
  const cap = setTimeout(close, MAX_STREAM_MS);
  req.on('close', close);
}

module.exports = { publish, openStream, bus };
