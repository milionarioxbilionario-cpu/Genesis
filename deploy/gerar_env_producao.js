// Gera o .env de PRODUCAO a partir do backend/.env local, sem o imprimir.
//   node deploy/gerar_env_producao.js <APP_HOST> <ADMIN_HOST> <ficheiro_saida>
// Mantem as ligacoes a BD (DATABASE_URL, APP_DATABASE_URL, DIRECT_URL), Supabase,
// Twilio, e-mail e Google. Muda o que em producao tem de ser diferente e gera
// segredos JWT NOVOS (as sessoes de producao nao valem em desenvolvimento e
// vice-versa). Tira as senhas de demonstracao.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));

const [appHost, adminHost, out] = process.argv.slice(2);
if (!appHost || !adminHost || !out) {
  console.error('uso: node deploy/gerar_env_producao.js <APP_HOST> <ADMIN_HOST> <ficheiro_saida>');
  process.exit(1);
}
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', '.env')));
for (const k of ['DATABASE_URL', 'APP_DATABASE_URL']) {
  if (!env[k]) { console.error(`falta ${k} no backend/.env`); process.exit(1); }
}
for (const k of Object.keys(env)) if (/^DEMO_.*PASSWORD$/.test(k)) delete env[k];

Object.assign(env, {
  NODE_ENV: 'production',
  PORT: '4000',
  TRUST_PROXY: '1',
  CORS_ORIGINS: `https://${appHost},https://${adminHost}`,
  ADMIN_ORIGINS: `https://${adminHost}`,
  APP_URL: `https://${appHost}`,
  SEED_DEMO_DATA: 'false',
  DEV_SHOW_RESET_CODE: 'false',
  DB_ALLOW_SQLITE_FALLBACK: 'false',
  DB_RLS_ENFORCE: 'true',
  JWT_SECRET: crypto.randomBytes(48).toString('hex'),
  REFRESH_TOKEN_SECRET: crypto.randomBytes(48).toString('hex'),
});

const quote = (v) => (/^[A-Za-z0-9_.:\/,+@-]*$/.test(v) ? v : JSON.stringify(v));
fs.writeFileSync(out, Object.entries(env).map(([k, v]) => `${k}=${quote(String(v))}`).join('\n') + '\n', { mode: 0o600 });
console.log(`.env de producao escrito em ${out} (${Object.keys(env).length} variaveis; valores nao mostrados)`);
