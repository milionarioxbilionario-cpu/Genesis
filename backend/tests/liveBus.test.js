// Etapa C: canal ao vivo. Uma loja nunca recebe eventos de outra; o que sai
// passa pelo `shape` (o dono ve o lucro, o admin nao). Correr: node --test tests/liveBus.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { publish, openStream, bus } = require('../src/utils/liveBus');

function fakeStream() {
  const req = new EventEmitter();
  const out = [];
  const res = { set() {}, flushHeaders() {}, write: (s) => { out.push(s); } };
  return { req, res, out, events: () => out.filter((s) => s.startsWith('event:')).map((s) => ({ type: s.split('\n')[0].slice(7), data: JSON.parse(s.split('\n')[1].slice(6)) })) };
}

test('o dono so recebe os eventos da sua loja, com o que o shape deixa', () => {
  const a = fakeStream();
  openStream(a.req, a.res, { filter: (e) => e.tenant_id === 'A', shape: (e) => ({ total: e.total, profit: e.profit }) });
  publish({ type: 'sale', tenant_id: 'B', total: 999, profit: 1 });
  publish({ type: 'sale', tenant_id: 'A', total: 45000, profit: 12000, secret: 'x' });
  const ev = a.events();
  assert.equal(ev.length, 1);
  assert.deepEqual(ev[0], { type: 'sale', data: { total: 45000, profit: 12000 } });
  a.req.emit('close');
});

test('ao fechar a ligacao deixa de ouvir (sem fugas de memoria)', () => {
  const before = bus.listenerCount('event');
  const s = fakeStream();
  openStream(s.req, s.res, { filter: () => true });
  assert.equal(bus.listenerCount('event'), before + 1);
  s.req.emit('close');
  assert.equal(bus.listenerCount('event'), before);
});

test('quem publica nunca rebenta, mesmo com um ouvinte partido', () => {
  const s = fakeStream();
  openStream(s.req, s.res, { filter: () => true, shape: () => { throw new Error('partido'); } });
  assert.doesNotThrow(() => publish({ type: 'sale', tenant_id: 'A', total: 1 }));
  s.req.emit('close');
});

test('um cliente partido nao impede os outros de receber', () => {
  const bad = fakeStream();
  const good = fakeStream();
  openStream(bad.req, bad.res, { filter: () => true, shape: () => { throw new Error('partido'); } });
  openStream(good.req, good.res, { filter: () => true });
  publish({ type: 'sale', tenant_id: 'A', total: 7 });
  assert.equal(good.events().length, 1);
  bad.req.emit('close'); good.req.emit('close');
});
