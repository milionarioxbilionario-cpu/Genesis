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

// Abre um canal SSE: `filter(event)` decide o que este cliente ve; `shape(event)`
// tira o que ele nao deve ver. Batimento a cada 25 s (o nginx corta aos 90 s).
function openStream(req, res, { filter, shape = (e) => e }) {
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
  bus.on('event', send);
  const beat = setInterval(() => res.write(': ok\n\n'), 25000);
  req.on('close', () => { clearInterval(beat); bus.off('event', send); });
}

module.exports = { publish, openStream, bus };
