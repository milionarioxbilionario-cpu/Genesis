// Testes de seguranca do login Google (POST /api/auth/google).
//
// Estes testes NAO tocam na base de dados e NAO precisam de rede: geramos um
// par de chaves RSA local e interceptamos o `fetch` global para servir a
// discovery e o JWKS falsos. Isto torna o teste deterministico e prova que a
// validacao nao depende de nada externo.
//
// Executar:  node scripts/test_google.js
//
// Objectivo: provar que verifyGoogleCredential() so aceita um token que
//  - tem 3 partes bem formadas;
//  - foi assinado pela chave correcta (RS256);
//  - tem iss = Google;
//  - tem aud = GOOGLE_CLIENT_ID configurado;
//  - tem exp no futuro;
//  - tem email verificado.

process.env.GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret';

const crypto = require('crypto');
const { generateKeyPairSync, createSign } = crypto;

const { verifyGoogleCredential } = require('../src/routes/auth');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const KID = 'test-key-1';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' });
jwk.kid = KID;
jwk.alg = 'RS256';
jwk.use = 'sig';

// ---- Interceptar o fetch: servimos discovery + JWKS locais ---------------
const realFetch = global.fetch;
global.fetch = async (url) => {
  const u = String(url);
  if (u.includes('openid-configuration')) {
    return {
      ok: true,
      json: async () => ({ issuer: 'https://accounts.google.com', jwks_uri: 'https://test.local/jwks' })
    };
  }
  if (u.includes('jwks')) {
    return { ok: true, json: async () => ({ keys: [jwk] }) };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

const b64url = (buf) => Buffer.from(buf).toString('base64url');

const signToken = (payload, { key = privateKey, kid = KID, alg = 'RS256' } = {}) => {
  const header = { alg, typ: 'JWT', kid };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${b64url(signer.sign(key))}`;
};

const now = Math.floor(Date.now() / 1000);
const basePayload = (over = {}) => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  sub: '1234567890',
  email: 'owner@genesis.local',
  email_verified: true,
  name: 'Owner Teste',
  iat: now,
  exp: now + 3600,
  ...over
});

// ---- Runner simples ------------------------------------------------------
let pass = 0;
let fail = 0;
const failures = [];

const check = async (name, fn, expectedCode) => {
  try {
    const result = await fn();
    if (expectedCode) {
      throw new Error(`esperava falhar com ${expectedCode}, mas passou`);
    }
    if (result && result.email !== 'owner@genesis.local') {
      throw new Error(`email inesperado: ${result && result.email}`);
    }
    console.log(`  PASS  ${name}`);
    pass += 1;
  } catch (err) {
    if (expectedCode && err.code === expectedCode) {
      console.log(`  PASS  ${name} (rejeitado com ${err.code})`);
      pass += 1;
    } else {
      console.log(`  FAIL  ${name} -> ${err.code || ''} ${err.message}`);
      failures.push(`${name}: ${err.message}`);
      fail += 1;
    }
  }
};

const CASES_POSITIVOS = [];
const CASES_NEGATIVOS = [];

CASES_POSITIVOS.push(
  ['token valido e aceite', () => verifyGoogleCredential(signToken(basePayload()))],
  ['issuer aceito sem https (formato antigo do Google)',
    () => verifyGoogleCredential(signToken(basePayload({ iss: 'accounts.google.com' })))],
  ['email normalizado para minusculas', async () => {
    const r = await verifyGoogleCredential(signToken(basePayload({ email: 'OWNER@GENESIS.LOCAL' })));
    if (r.email !== 'owner@genesis.local') throw new Error(`email nao normalizado: ${r.email}`);
    return r;
  }]
);

CASES_NEGATIVOS.push(
  ['audience errada', () => verifyGoogleCredential(
    signToken(basePayload({ aud: 'outro-client.apps.googleusercontent.com' }))), 'BAD_AUDIENCE'],

  ['token expirado', () => verifyGoogleCredential(signToken(basePayload({ exp: now - 60 }))), 'EXPIRED'],

  ['token sem exp', () => {
    const p = basePayload();
    delete p.exp;
    return verifyGoogleCredential(signToken(p));
  }, 'EXPIRED'],

  ['token ainda nao valido (nbf futuro)', () => verifyGoogleCredential(
    signToken(basePayload({ nbf: now + 3600 }))), 'NOT_YET_VALID'],

  ['email nao verificado', () => verifyGoogleCredential(
    signToken(basePayload({ email_verified: false }))), 'EMAIL_UNVERIFIED'],

  ['issuer de outro dominio', () => verifyGoogleCredential(
    signToken(basePayload({ iss: 'https://evil.example.com' }))), 'BAD_ISSUER'],

  ['alg "none" (sem assinatura)', () => verifyGoogleCredential(
    signToken(basePayload(), { alg: 'none' })), 'BAD_ALG'],

  ['token sem assinatura', () => {
    const header = { alg: 'RS256', typ: 'JWT', kid: KID };
    return verifyGoogleCredential(
      `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(basePayload()))}.`
    );
  }, 'BAD_SIGNATURE'],

  ['assinatura forjada com outra chave', () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
    return verifyGoogleCredential(signToken(basePayload(), { key: other.privateKey }));
  }, 'BAD_SIGNATURE'],

  ['kid desconhecido', () => verifyGoogleCredential(signToken(basePayload(), { kid: 'outra-chave' })), 'BAD_SIGNATURE'],
  ['lixo (nao e JWT)', () => verifyGoogleCredential('isto-nao-e-um-token'), 'MALFORMED'],
  ['duas partes apenas', () => verifyGoogleCredential('aaa.bbb'), 'MALFORMED'],

  ['payload nao e JSON', () => {
    const header = { alg: 'RS256', typ: 'JWT', kid: KID };
    const signingInput = `${b64url(JSON.stringify(header))}.${b64url('nao-sou-json')}`;
    const signer = createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    return verifyGoogleCredential(`${signingInput}.${b64url(signer.sign(privateKey))}`);
  }, 'MALFORMED'],

  ['sem GOOGLE_CLIENT_ID configurado', () => {
    const saved = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    return verifyGoogleCredential(signToken(basePayload())).finally(() => {
      process.env.GOOGLE_CLIENT_ID = saved;
    });
  }, 'NOT_CONFIGURED'],

  ['API Key (AIza...) recusada como Client ID', () => {
    const saved = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = 'AIzaSyDUMINHOCOENTEAIzaFAKE';
    return verifyGoogleCredential(signToken(basePayload())).finally(() => {
      process.env.GOOGLE_CLIENT_ID = saved;
    });
  }, 'NOT_CONFIGURED']
);

(async () => {
  console.log('\n=== Login Google: validacao de token ===\n');
  for (const [name, fn] of CASES_POSITIVOS) await check(name, fn, null);
  for (const [name, fn, code] of CASES_NEGATIVOS) await check(name, fn, code);

  global.fetch = realFetch;

  console.log(`\n=== Resultado: ${pass} passaram, ${fail} falharam ===\n`);
  if (fail > 0) {
    failures.forEach((f) => console.log(' - ' + f));
    process.exit(1);
  }
  process.exit(0);
})();
