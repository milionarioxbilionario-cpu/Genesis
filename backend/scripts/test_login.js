// Prova de login real contra um servidor JA em execucao.
// Usa um ficheiro JSON temporario para o corpo, evitando problemas de escape
// do PowerShell com o "$" da password.
require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = process.env.PORT || 4000;
const base = 'http://localhost:' + PORT;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(email, password) {
  const file = path.join(os.tmpdir(), 'login-body-' + process.pid + '.json');
  fs.writeFileSync(file, JSON.stringify({ email, password }));
  try {
    const res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: fs.readFileSync(file),
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, role: body.user && body.user.role, error: body.error };
  } catch (e) {
    return { status: 0, error: e.message };
  } finally {
    fs.unlinkSync(file);
  }
}

(async () => {
  const health = await fetch(base + '/').catch(() => null);
  if (!health || health.status !== 200) {
    console.log('SERVIDOR NAO ESTA A CORRER na porta ' + PORT + '. Arranca-o primeiro.');
    process.exit(2);
  }

  const cases = [
    ['owner@genesis.local', process.env.DEMO_OWNER_PASSWORD, 'owner'],
    ['cashier@genesis.local', process.env.DEMO_CASHIER_PASSWORD, 'cashier'],
    ['admin@genesis.co.mz', process.env.DEMO_ADMIN_PASSWORD, 'super_admin'],
  ];

  let pass = 0;
  for (const [email, password, expected] of cases) {
    if (!password) { console.log('FALHOU  ' + email + '  (variavel de password ausente no .env)'); continue; }
    const r = await login(email, password);
    const ok = r.status === 200 && r.role === expected;
    if (ok) pass++;
    console.log((ok ? 'PASS   ' : 'FALHOU ') + email +
      '  -> HTTP ' + r.status + (r.role ? ' role=' + r.role : ' esperado=' + expected) +
      (r.error ? '  (' + r.error + ')' : ''));
    await wait(1200); // o rate limiter permite 5 tentativas por 15 min
  }
  console.log('RESULTADO: ' + pass + '/' + cases.length + ' logins correctos');
  process.exit(pass === cases.length ? 0 : 1);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });