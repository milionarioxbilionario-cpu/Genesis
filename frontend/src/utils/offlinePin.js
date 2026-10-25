// PIN sem rede (Fase 12.2/12.4).
//
// Quando um PIN e aceite PELO SERVIDOR, o aparelho guarda um verificador
// (PBKDF2-SHA-256 com sal aleatorio; nunca o PIN). Sem rede, o PIN escrito e
// comparado com esse verificador. Limites:
//   - so quem ja entrou uma vez COM rede neste aparelho pode entrar sem rede;
//   - 5 PINs errados em 15 minutos bloqueiam a entrada sem rede desse perfil;
//   - quando o servidor diz que o PIN mudou (versao diferente) ou o perfil
//     desapareceu, o verificador e apagado (pruneVerifiers).
// Um PIN de 4 digitos guardado assim e adivinhavel por quem tiver o aparelho
// e tempo: a entrada sem rede so permite vender para a fila (que o servidor
// volta a validar) ou ver dados ja guardados — nunca alterar nada no servidor.
import db from '../db/localDb.js';

const ITERATIONS = 100000;
export const OFFLINE_FAIL_MAX = 5;
export const OFFLINE_FAIL_WINDOW_MS = 15 * 60 * 1000;

const enc = new TextEncoder();
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pin, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

function sameBytes(a, b) {
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Chamar so depois de o servidor aceitar o PIN.
export async function rememberPin(key, pin, version) {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(pin, salt, ITERATIONS);
    await db.pin_verifiers.put({ key, salt: toB64(salt), hash: toB64(hash), iterations: ITERATIONS, version: version || null, fails: [], saved_at: new Date().toISOString() });
  } catch { /* sem WebCrypto/IndexedDB: simplesmente nao ha entrada sem rede */ }
}

export async function hasOfflinePin(key) {
  try { return Boolean(await db.pin_verifiers.get(key)); } catch { return false; }
}

// 'ok' | 'wrong' (com remaining) | 'locked' | 'unknown' (nunca entrou com rede aqui)
export async function checkOfflinePin(key, pin, now = Date.now()) {
  const row = await db.pin_verifiers.get(key);
  if (!row) return { result: 'unknown' };
  const fails = (row.fails || []).filter((t) => now - t < OFFLINE_FAIL_WINDOW_MS);
  if (fails.length >= OFFLINE_FAIL_MAX) return { result: 'locked' };
  const hash = await derive(pin, fromB64(row.salt), row.iterations);
  if (sameBytes(hash, fromB64(row.hash))) {
    await db.pin_verifiers.update(key, { fails: [] });
    return { result: 'ok' };
  }
  fails.push(now);
  await db.pin_verifiers.update(key, { fails });
  return { result: fails.length >= OFFLINE_FAIL_MAX ? 'locked' : 'wrong', remaining: Math.max(0, OFFLINE_FAIL_MAX - fails.length) };
}

// `valid` = { key: version } do que o servidor diz que existe agora, para as
// chaves com este prefixo. Tudo o resto (perfil removido, PIN mudado) e apagado.
export async function pruneVerifiers(prefix, valid) {
  try {
    const rows = await db.pin_verifiers.where('key').startsWith(prefix).toArray();
    const stale = rows.filter((r) => !(r.key in valid) || (valid[r.key] && r.version !== valid[r.key])).map((r) => r.key);
    if (stale.length) await db.pin_verifiers.bulkDelete(stale);
    return stale.length;
  } catch { return 0; }
}

export async function forgetPin(key) {
  try { await db.pin_verifiers.delete(key); } catch { /* nada a apagar */ }
}

// Ultima resposta boa do servidor (ecras que tem de abrir sem rede).
export async function saveSnapshot(key, data) {
  try { await db.snapshots.put({ key, data, saved_at: new Date().toISOString() }); } catch { /* sem IndexedDB */ }
}
export async function loadSnapshot(key) {
  try { return (await db.snapshots.get(key)) || null; } catch { return null; }
}
export async function clearSnapshots(prefix) {
  try {
    if (prefix) await db.snapshots.where('key').startsWith(prefix).delete();
    else await db.snapshots.clear();
  } catch { /* nada */ }
}

// Sem resposta do servidor (rede) ou servidor/proxy em baixo (5xx).
export const isOfflineError = (err) => !err?.response || err.response.status >= 500;
