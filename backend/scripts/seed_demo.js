// ============================================================================
//  Seed das contas de demonstracao (Genesis)
//
//  PORQUE ESTE SCRIPT EXISTE
//  A base de dados local nasceu vazia (nao havia dev.db) e o seed automatico do
//  arranque esta desligado por SEED_DEMO_DATA=false — por seguranca, para nunca
//  criar um super_admin com password conhecida sem querer. Resultado: o login
//  do owner e do admin respondia sempre "credenciais invalidas", porque os
//  utilizadores simplesmente nao existiam na base.
//
//  USO
//    node scripts/seed_demo.js --force    cria as contas (idempotente)
//    node scripts/seed_demo.js --force --reset   repoe as passwords do .env
//    node scripts/seed_demo.js --list     mostra o que existe
//
//  SEGURANCA
//  - As passwords vem SEMPRE do .env (nunca do codigo) e nunca sao impressas.
//  - O script recusa correr sem --force, para continuar a ser uma accao
//    deliberada e nao um efeito secundario de arrancar o servidor.
// ============================================================================

require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);

const DEMO_TENANT_ID = '44444444-4444-4444-4444-444444444444';

const ACCOUNTS = [
  { email: 'owner@genesis.local', role: 'owner', name: 'Owner Demo',
    phone: '+258840000000', passwordVar: 'DEMO_OWNER_PASSWORD', withTenant: true },
  { email: 'cashier@genesis.local', role: 'cashier', name: 'Demo Cashier',
    phone: '+258840000001', passwordVar: 'DEMO_CASHIER_PASSWORD', withTenant: true },
  { email: 'admin@genesis.co.mz', role: 'super_admin', name: 'Super Admin Genesis',
    phone: null, passwordVar: 'DEMO_ADMIN_PASSWORD', withTenant: false },
];

const TENANT = {
  id: DEMO_TENANT_ID,
  name: 'Genesis Demo Store',
  owner_name: 'Demo Owner',
  business_type: 'mercearia',
  location: 'Maputo',
  phone: '+258840000000',
  email: 'owner@genesis.local',
  status: 'active',
  onboarding_completed: true,
};

const DEMO_PRODUCTS = [
  { name: 'Cerveja Laurentina 550ml', sell_price: 9500, cost_price: 5500, stock_qty: 148, category: 'Bebidas', barcode: 'CVR-LA-550' },
  { name: 'Refrigerante Coca Cola 500ml', sell_price: 6000, cost_price: 4000, stock_qty: 210, category: 'Bebidas', barcode: 'CC-500' },
  { name: 'Agua Nana 1.5L', sell_price: 4500, cost_price: 2500, stock_qty: 18, category: 'Bebidas', barcode: 'AG-NANA-1500' },
  { name: 'Vinho Tinto Casa 750ml', sell_price: 48000, cost_price: 30000, stock_qty: 24, category: 'Bebidas', barcode: 'VTC-750' },
  { name: 'Arroz Agulha 5kg', sell_price: 52000, cost_price: 42000, stock_qty: 36, category: 'Mercearia', barcode: 'AR-5KG' },
];

async function listExisting() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, is_active: true },
    orderBy: { email: 'asc' },
  });
  const tenants = await prisma.tenant.count();
  const products = await prisma.product.count();
  console.log('utilizadores:', users.length, '| tenants:', tenants, '| produtos:', products);
  users.forEach((u) => console.log('  -', u.email, '(' + u.role + ')', u.is_active ? '' : '[inactivo]'));
}

async function seed() {
  const missing = ACCOUNTS
    .map((a) => [a.passwordVar, process.env[a.passwordVar]])
    .filter(([, v]) => !v)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error('Faltam no .env: ' + missing.join(', ') + ' (ver backend/.env)');
  }

  const tenant = await prisma.tenant.upsert({
    where: { id: DEMO_TENANT_ID },
    update: TENANT,
    create: TENANT,
  });

  for (const acc of ACCOUNTS) {
    const hash = await bcrypt.hash(process.env[acc.passwordVar], 12);
    const data = {
      role: acc.role,
      name: acc.name,
      password_hash: hash,
      phone: acc.phone,
      is_active: true,
      tenant_id: acc.withTenant ? tenant.id : null,
    };
    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!existing) {
      await prisma.user.create({ data: { email: acc.email, ...data } });
      console.log('  + criada:', acc.email, '(' + acc.role + ')');
    } else if (has('--reset')) {
      await prisma.user.update({ where: { email: acc.email }, data });
      console.log('  ~ senha reposta:', acc.email);
    } else {
      await prisma.user.update({ where: { email: acc.email },
        data: { is_active: true, role: data.role, tenant_id: data.tenant_id } });
      console.log('  = ja existia (inalterada; usa --reset para repor a senha):', acc.email);
    }
  }

  if (await prisma.product.count({ where: { tenant_id: tenant.id } }) === 0) {
    for (const p of DEMO_PRODUCTS) {
      await prisma.product.create({ data: { ...p, tenant_id: tenant.id, is_active: true } });
    }
    console.log('  + produtos demo:', DEMO_PRODUCTS.length);
  }

  // device_keys e @@ignore no Prisma: criada por SQL directo.
  if (prisma.engineName() === 'sqlite') {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS device_keys (
      id TEXT PRIMARY KEY, device_name TEXT NOT NULL, key_hash TEXT NOT NULL,
      owner_user_id TEXT NOT NULL, tenant_id TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME, revoked_at DATETIME, metadata TEXT)`);
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS device_keys_owner_idx ON device_keys(owner_user_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS device_keys_tenant_idx ON device_keys(tenant_id)');
  }

  console.log('OK. As passwords NAO sao impressas: estao em backend/.env.');
}

(async () => {
  if (!has('--force') && !has('--list')) {
    console.error('Criar contas demo e uma accao deliberada. Corre com:');
    console.error('    node scripts/seed_demo.js --force');
    process.exit(1);
  }

  await prisma.ready();
  console.log('motor:', prisma.engineName());
  if (has('--list')) {
    await listExisting();
  } else {
    await seed();
    console.log('--- estado final ---');
    await listExisting();
  }
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('ERRO:', e.message);
  try { await prisma.$disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
