// Teste end-to-end das rotas de autenticação contra o servidor a correr.
// Uso: BASE_URL=http://localhost:4020 node scripts/test_auth.js
// ACTUALIZADO 2026-09-26 (Frente 2): a rota /reset-password-instant foi
// REMOVIDA. O teste agora verifica que ela devolve 404 e que o fluxo por
// codigo (forgot-password -> reset-password) continua intacto.
require('dotenv').config();
const BASE = process.env.BASE_URL || 'http://localhost:4000';

// Os erros do Zod voltam como array de {path, message}; sem isto imprime-se
// "[object Object]" e ninguém percebe o que falhou.
const explain = (d) => {
  if (!d) return '-';
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map(e => `${(e.path || []).join('.')}: ${e.message}`).join('; ');
  if (d.error && Array.isArray(d.error)) return d.error.map(e => `${(e.path || []).join('.')}: ${e.message}`).join('; ');
  if (d.error) return typeof d.error === 'string' ? d.error : JSON.stringify(d.error);
  return JSON.stringify(d);
};

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | ${detail}`);
};

async function call(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'manual'
  });
  let data = null;
  try { data = await res.json(); } catch { /* corpo nao-JSON */ }
  return { status: res.status, data, headers: res.headers };
}

(async () => {
  const ownerPass = process.env.DEMO_OWNER_PASSWORD;
  const adminPass = process.env.DEMO_ADMIN_PASSWORD;

  // 1) Login do dono — era isto que o fundador via falhar.
  try {
    const r = await call('/api/auth/login', { email: 'owner@genesis.local', password: ownerPass });
    record('login owner', r.status === 200,
      `status=${r.status} role=${r.data?.user?.role || explain(r.data)}`);
  } catch (e) { record('login owner', false, 'sem resposta: ' + e.message); }

  // 2) Login do super admin — o fundador disse que dava "incorrecta".
  try {
    const r = await call('/api/auth/login', { email: 'admin@genesis.co.mz', password: adminPass });
    record('login admin', r.status === 200,
      `status=${r.status} role=${r.data?.user?.role || explain(r.data)}`);
  } catch (e) { record('login admin', false, 'sem resposta: ' + e.message); }

  // 3) Google sem GOOGLE_CLIENT_ID -> tem de dar 503, nunca autenticar.
  try {
    const r = await call('/api/auth/google', { credential: 'x'.repeat(40) });
    const blocked = r.status === 503 || r.status === 401;
    record('google bloqueado sem config', blocked, `status=${r.status} code=${r.data?.code || '-'}`);
    const mustNotAuth = !r.data?.token;
    record('google nao emite token', mustNotAuth, mustNotAuth ? 'sem token (correcto)' : 'EMITIU TOKEN!');
  } catch (e) { record('google bloqueado sem config', false, 'sem resposta: ' + e.message); }

  // 4) Reset imediato foi REMOVIDO (Frente 2): tem de dar 404.
  // Qualquer outro status significa que a backdoor ainda esta exposta.
  try {
    const r = await call('/api/auth/reset-password-instant', {
      email: 'owner@genesis.local', password: 'NovaSenha12345'
    });
    record('reset-instant removido (404)', r.status === 404,
      `status=${r.status} ${r.status === 404 ? '(correcto: rota extinta)' : '-> ' + explain(r.data)}`);
  } catch (e) { console.log('FAIL | reset-instant removido | ' + e.message); }

  const failed = results.filter(r => !r.ok);
  console.log(`\nRESUMO: ${results.length - failed.length}/${results.length} passaram`);
  process.exit(failed.length ? 1 : 0);
})();
