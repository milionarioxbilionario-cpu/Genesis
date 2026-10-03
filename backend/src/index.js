require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const prisma = require('./utils/prisma');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const salesRoutes = require('./routes/sales');
const catalogRoutes = require('./routes/catalogs');
const masterCatalogRoutes = require('./routes/master_catalogs');
const productsRoutes = require('./routes/products');
const ownerRoutes = require('./routes/owner');
const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const demandCapturesRoutes = require('./routes/demand_captures');
const shrinkageRoutes = require('./routes/shrinkage_records');
const authMiddleware = require('./middleware/auth');
const requireRole = require('./middleware/rbac');
const adminOriginCheck = require('./middleware/adminOriginCheck');
const refreshRoute = require('./routes/refresh');
const settingsRoutes = require('./routes/settings');
const posRoutes = require('./routes/pos');
const posWriteAuth = require('./middleware/posWriteAuth');
const helmet = require('helmet');
const { errorHandler } = require('./utils/http');

const app = express();
const port = process.env.PORT || 4000;

// Atras de um proxy (nginx) o IP real vem em X-Forwarded-For. Sem isto, todas
// as lojas partilhavam o IP do proxy e 5 logins errados bloqueavam o pais
// inteiro. So se activa por env: sem proxy, confiar no header deixaria
// qualquer cliente falsificar o IP e fugir ao rate limit.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.disable('x-powered-by');

// Uma rejeicao nao tratada terminava o processo (Node 24) — todas as lojas
// ficavam sem servidor. Regista-se e o servidor continua.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && (reason.stack || reason));
});

// Guarda de arranque (fail-closed em producao): um JWT_SECRET ausente, curto ou
// previsivel permite FORJAR tokens de qualquer tenant/role — todo o isolamento
// multi-tenant cai. Em desenvolvimento avisa-se; em producao aborta-se.
function assertSecureConfig() {
  const secret = process.env.JWT_SECRET || '';
  const weakSecret = secret.length < 32 || /dev-only|trocar|changeme|example|secret-trocar/i.test(secret);
  const sqliteFallback = String(process.env.DB_ALLOW_SQLITE_FALLBACK).toLowerCase() === 'true';
  const isProd = process.env.NODE_ENV === 'production';

  if (weakSecret) {
    const msg = 'JWT_SECRET inseguro (ausente, curto ou previsivel). Gera um valor aleatorio de 48 bytes — ver backend/.env.example.';
    if (isProd) throw new Error(msg);
    console.warn('[config] ' + msg);
  }

  // Em producao, o fallback SQLite nao tem RLS nem isolamento entre lojas. Se
  // o Postgres falhar uma sondagem, o servidor passaria a servir dados locais.
  if (isProd && sqliteFallback) {
    throw new Error('DB_ALLOW_SQLITE_FALLBACK=true em producao: desliga-o para nunca servir a base SQLite local (sem RLS).');
  }
}

async function ensureDemoData() {
  // O seed de demonstração é OPT-IN e NUNCA deve correr em produção:
  // cria contas (incluindo super_admin) com password conhecida.
  if (process.env.SEED_DEMO_DATA !== 'true') {
    return;
  }

  const demoOwnerPassword = process.env.DEMO_OWNER_PASSWORD;
  const demoCashierPassword = process.env.DEMO_CASHIER_PASSWORD;
  const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD;
  const missing = [
    ['DEMO_OWNER_PASSWORD', demoOwnerPassword],
    ['DEMO_CASHIER_PASSWORD', demoCashierPassword],
    ['DEMO_ADMIN_PASSWORD', demoAdminPassword],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    throw new Error(
      `SEED_DEMO_DATA=true exige as variáveis ${missing.join(', ')} (ver backend/.env.example)`
    );
  }

  const demoTenantId = '44444444-4444-4444-4444-444444444444';

  const tenant = await prisma.tenant.upsert({
    where: { id: demoTenantId },
    update: {
      name: 'Genesis Demo Store',
      owner_name: 'Demo Owner',
      business_type: 'mercearia',
      location: 'Maputo',
      phone: '+258840000000',
      email: 'owner@genesis.local',
      status: 'active',
      onboarding_completed: true,
    },
    create: {
      id: demoTenantId,
      name: 'Genesis Demo Store',
      owner_name: 'Demo Owner',
      business_type: 'mercearia',
      location: 'Maputo',
      phone: '+258840000000',
      email: 'owner@genesis.local',
      status: 'active',
      onboarding_completed: true,
    }
  });

  const ownerPasswordHash = await bcrypt.hash(demoOwnerPassword, 12);
  await prisma.user.upsert({
    where: { email: 'owner@genesis.local' },
    update: {
      tenant_id: tenant.id,
      role: 'owner',
      name: 'Owner Demo',
      password_hash: ownerPasswordHash,
      phone: '+258840000000',
      is_active: true,
    },
    create: {
      tenant_id: tenant.id,
      role: 'owner',
      name: 'Owner Demo',
      email: 'owner@genesis.local',
      password_hash: ownerPasswordHash,
      phone: '+258840000000',
      is_active: true,
    }
  });

  const adminPasswordHash = await bcrypt.hash(demoAdminPassword, 12);
  await prisma.user.upsert({
    where: { email: 'admin@genesis.co.mz' },
    update: {
      role: 'super_admin',
      name: 'Super Admin Genesis',
      password_hash: adminPasswordHash,
      is_active: true,
      tenant_id: null,
    },
    create: {
      email: 'admin@genesis.co.mz',
      name: 'Super Admin Genesis',
      password_hash: adminPasswordHash,
      role: 'super_admin',
      is_active: true,
      tenant_id: null,
    }
  });

  // Create a cashier user for POS testing
  const cashierPasswordHash = await bcrypt.hash(demoCashierPassword, 12);
  await prisma.user.upsert({
    where: { email: 'cashier@genesis.local' },
    update: {
      tenant_id: tenant.id,
      role: 'cashier',
      name: 'Demo Cashier',
      password_hash: cashierPasswordHash,
      phone: '+258840000001',
      is_active: true,
    },
    create: {
      tenant_id: tenant.id,
      role: 'cashier',
      name: 'Demo Cashier',
      email: 'cashier@genesis.local',
      password_hash: cashierPasswordHash,
      phone: '+258840000001',
      is_active: true,
    }
  });

  // Seed demo products for POS (prices in centavos)
  const existingProducts = await prisma.product.findMany({ where: { tenant_id: tenant.id } });
  if (!existingProducts || existingProducts.length === 0) {
    const sample = [
      { name: 'Cerveja Laurentina 550ml', sell_price: 9500, cost_price: 5500, stock_qty: 148, category: 'Bebidas', barcode: 'CVR-LA-550' },
      { name: 'Refrigerante Coca Cola 500ml', sell_price: 6000, cost_price: 4000, stock_qty: 210, category: 'Bebidas', barcode: 'CC-500' },
      { name: 'Água Nana 1.5L', sell_price: 4500, cost_price: 2500, stock_qty: 18, category: 'Bebidas', barcode: 'AG-NANA-1500' },
      { name: 'Vinho Tinto Casa 750ml', sell_price: 48000, cost_price: 30000, stock_qty: 24, category: 'Bebidas', barcode: 'VTC-750' },
      { name: 'Arroz Agulha 5kg', sell_price: 52000, cost_price: 42000, stock_qty: 36, category: 'Mercearia', barcode: 'AR-5KG' }
    ];
    for (const p of sample) {
      await prisma.product.create({ data: {
        tenant_id: tenant.id,
        name: p.name,
        sell_price: p.sell_price,
        cost_price: p.cost_price,
        stock_qty: p.stock_qty,
        category: p.category,
        barcode: p.barcode,
        is_active: true
      }});
    }
  }

  console.log('Demo data ensured: owner@genesis.local, cashier@genesis.local, admin@genesis.co.mz (passwords lidas de DEMO_*_PASSWORD; não são impressas)');
}

// CORS com lista fechada de origens (antes: qualquer origem, com cookies).
// Pedidos sem Origin (mesma origem via proxy do Vite, curl, scripts) passam.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175')
  .split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, cb) {
    if (!origin || CORS_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Rotas Públicas
app.use('/api/auth', authRoutes);
app.use('/api/refresh', refreshRoute);
// Catálogos públicos (templates) e import (protegido)
app.use('/api/catalogs', catalogRoutes);
// Master catalogs (admin)
app.use('/api/master_catalogs', masterCatalogRoutes);
// Produtos do tenant
app.use('/api/products', productsRoutes);
app.use('/api/owner', ownerRoutes);
// Definicoes da loja: horario, descontos, custos fixos (renda), PIN.
app.use('/api/settings', settingsRoutes);
// Resumo operacional
app.use('/api/dashboard', dashboardRoutes);
// Gestão de stock e fornecedores
app.use('/api/inventory', inventoryRoutes);
// Escritas do POS: sessao do caixista (PIN no terminal) ou, para a fila
// offline, o cookie do terminal emparelhado + seller_user_id (ver
// middleware/posWriteAuth.js). Substitui as antigas device keys.
app.use('/api/demand_captures', posWriteAuth, requireRole('owner', 'cashier'), demandCapturesRoutes);
app.use('/api/shrinkage_records', posWriteAuth, requireRole('owner', 'cashier'), shrinkageRoutes);
app.use('/api/sales', posWriteAuth, requireRole('owner', 'cashier'), salesRoutes);

// Terminal POS: emparelhamento, PIN do caixista, turno e fecho cego.
app.use('/api/pos', posRoutes);

// Rotas Protegidas de Admin
app.use('/api/admin', adminOriginCheck, authMiddleware, requireRole('super_admin'), adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Genesis API - v1.0' });
});

app.use(errorHandler);

// Escolhe o motor ANTES de qualquer query (ver src/utils/dbEngine2.js).
// Se a base nao responder, a falha e explicita e o processo termina — e
// preferivel a um servidor que arranque sem base de dados.
prisma.ready()
  .then(() => assertSecureConfig())
  .then(() => ensureDemoData())
  .then(() => {
    app.listen(port, () => {
      console.log(`Genesis backend running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Genesis backend nao arrancou:', error.message);
    process.exit(1);
  });
