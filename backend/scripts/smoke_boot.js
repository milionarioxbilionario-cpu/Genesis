// Prova funcional de arranque: sobe o servidor, chama a API, e termina.
// Nao deixa processos orfaos.
require('dotenv').config();
const { spawn } = require('child_process');

const PORT = process.env.PORT || 4000;
const child = spawn(process.execPath, ['src/index.js'], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
child.stdout.on('data', (d) => { log += d.toString(); });
child.stderr.on('data', (d) => { log += d.toString(); });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
  try {
    const res = await fetch('http://localhost:' + PORT + path, { signal: AbortSignal.timeout(8000) });
    return { status: res.status, body: (await res.text()).slice(0, 120) };
  } catch (e) {
    return { status: 0, body: e.message.slice(0, 80) };
  }
}

(async () => {
  // Espera o arranque. A cadeia completa e: sondagem ao Postgres (ate
  // ~2x DB_PROBE_TIMEOUT_MS, porque sao probe TCP + query) -> prisma generate
  // -> db push nao e preciso -> listen. Da margem generosa.
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (log.includes('running on port')) break;
    if (log.includes('nao arrancou')) break;
    await wait(500);
  }

  const r1 = await get('/');
  const r2 = await get('/api/auth/me');
  console.log('GET /            -> HTTP ' + r1.status + '  ' + r1.body);
  console.log('GET /auth/me     -> HTTP ' + r2.status + '  (401 = proteccao activa)');

  child.kill();
  await wait(500);
  console.log('--- ultimas linhas do arranque ---');
  console.log(log.split('\n').slice(-25).join('\n'));
  process.exit(0);
})().catch((e) => { console.error('ERRO:', e.message); child.kill(); process.exit(1); });