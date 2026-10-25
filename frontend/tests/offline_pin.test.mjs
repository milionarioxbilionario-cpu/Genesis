// Fase 12.2/12.4: PIN sem rede (verificador PBKDF2 no aparelho) e copias de ecra.
// Correr: node --test tests/offline_pin.test.mjs   (dentro de frontend/)
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import db from '../src/db/localDb.js';
import {
  rememberPin, checkOfflinePin, pruneVerifiers, forgetPin, hasOfflinePin,
  saveSnapshot, loadSnapshot, clearSnapshots, isOfflineError, OFFLINE_FAIL_MAX, OFFLINE_FAIL_WINDOW_MS,
} from '../src/utils/offlinePin.js';

const KEY = 'cashier:term-1:ana';

test('sem verificador: "unknown" (nunca entrou com rede neste aparelho)', async () => {
  assert.equal((await checkOfflinePin('cashier:term-1:ninguem', '1234')).result, 'unknown');
});

test('o PIN nunca fica guardado: so sal + hash', async () => {
  await rememberPin(KEY, '4821', 'v1');
  const row = await db.pin_verifiers.get(KEY);
  assert.ok(row.salt && row.hash && row.iterations >= 100000);
  assert.ok(!JSON.stringify(row).includes('4821'));
  assert.equal(await hasOfflinePin(KEY), true);
});

test('PIN certo -> ok; errado -> wrong com tentativas restantes', async () => {
  await rememberPin(KEY, '4821', 'v1');
  assert.equal((await checkOfflinePin(KEY, '4821')).result, 'ok');
  const w = await checkOfflinePin(KEY, '0000');
  assert.equal(w.result, 'wrong');
  assert.equal(w.remaining, OFFLINE_FAIL_MAX - 1);
  // Acertar limpa as falhas.
  assert.equal((await checkOfflinePin(KEY, '4821')).result, 'ok');
  assert.deepEqual((await db.pin_verifiers.get(KEY)).fails, []);
});

test('5 erros em 15 min bloqueiam (mesmo com o PIN certo); passado o tempo volta a deixar', async () => {
  await rememberPin(KEY, '4821', 'v1');
  const t0 = Date.now();
  for (let i = 0; i < OFFLINE_FAIL_MAX - 1; i++) assert.equal((await checkOfflinePin(KEY, '1111', t0 + i)).result, 'wrong');
  assert.equal((await checkOfflinePin(KEY, '1111', t0 + 10)).result, 'locked');
  assert.equal((await checkOfflinePin(KEY, '4821', t0 + 20)).result, 'locked');
  assert.equal((await checkOfflinePin(KEY, '4821', t0 + OFFLINE_FAIL_WINDOW_MS + 100)).result, 'ok');
});

test('pruneVerifiers apaga perfis removidos e PINs mudados; nao toca noutro terminal', async () => {
  await rememberPin('cashier:term-1:ana', '1111', 'v1');
  await rememberPin('cashier:term-1:rui', '2222', 'v1');
  await rememberPin('cashier:term-1:eva', '3333', 'v1');
  await rememberPin('cashier:term-2:ana', '4444', 'v1');
  // rui mudou o PIN (v2), eva foi removida.
  const n = await pruneVerifiers('cashier:term-1:', { 'cashier:term-1:ana': 'v1', 'cashier:term-1:rui': 'v2' });
  assert.equal(n, 2);
  assert.equal(await hasOfflinePin('cashier:term-1:ana'), true);
  assert.equal(await hasOfflinePin('cashier:term-1:rui'), false);
  assert.equal(await hasOfflinePin('cashier:term-1:eva'), false);
  assert.equal(await hasOfflinePin('cashier:term-2:ana'), true);
  await forgetPin('cashier:term-2:ana');
  assert.equal(await hasOfflinePin('cashier:term-2:ana'), false);
});

test('copias de ecra: guardar, ler e apagar por prefixo (dono)', async () => {
  await saveSnapshot('owner:me', { id: 'u1' });
  await saveSnapshot('terminal:info', { terminal: { id: 't' } });
  assert.equal((await loadSnapshot('owner:me')).data.id, 'u1');
  await clearSnapshots('owner:');
  assert.equal(await loadSnapshot('owner:me'), null);
  assert.ok(await loadSnapshot('terminal:info'));
});

test('isOfflineError: sem resposta ou 5xx = sem rede; 4xx = resposta do servidor', () => {
  assert.equal(isOfflineError(new Error('Network Error')), true);
  assert.equal(isOfflineError({ response: { status: 502 } }), true);
  assert.equal(isOfflineError({ response: { status: 401 } }), false);
  assert.equal(isOfflineError({ response: { status: 403 } }), false);
});
