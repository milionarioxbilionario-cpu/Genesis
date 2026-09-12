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
const shiftClosingsRoutes = require('./routes/shift_closings');
const demandCapturesRoutes = require('./routes/demand_captures');
const deviceKeysRoutes = require('./routes/device_keys');
const deviceKeyAuth = require('./middleware/deviceKeyAuth');
const shrinkageRoutes = require('./routes/shrinkage_records');
const authMiddleware = require('./middleware/auth');
const authOrDevice = require('./middleware/authOrDevice');
const requireRole = require('./middleware/rbac');
const adminOriginCheck = require('./middleware/adminOriginCheck');
const refreshRoute = require('./routes/refresh');

const app = express();
const port = process.env.PORT || 4000;

async function ensureDemoData() {
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

  const ownerPasswordHash = await bcrypt.hash('<password-demo-removida-do-historico>', 12);
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

  const adminPasswordHash = await bcrypt.hash('<password-demo-removida-do-historico>', 12);
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
  const cashierPasswordHash = await bcrypt.hash('<password-demo-removida-do-historico>', 12);
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

  console.log('Demo data ensured: owner@genesis.local / <password-demo-removida-do-historico>, cashier@genesis.local / <password-demo-removida-do-historico>, admin@genesis.co.mz / <password-demo-removida-do-historico>');
}

// CORS: allow credentials (cookies) and accept requests from frontend (origin can be tightened)
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

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
// Resumo operacional
app.use('/api/dashboard', dashboardRoutes);
// Gestão de stock e fornecedores
app.use('/api/inventory', inventoryRoutes);
// Demand captures (offlines / requisicoes) - require auth
app.use('/api/demand_captures', authOrDevice, requireRole('owner', 'cashier'), demandCapturesRoutes);
// Shrinkage records (stock loss) - require auth
app.use('/api/shrinkage_records', authOrDevice, requireRole('owner', 'cashier'), shrinkageRoutes);
// Fechos de turno (caixa cego)
app.use('/api/shift_closings', authOrDevice, requireRole('owner', 'cashier'), shiftClosingsRoutes);

// Rotas de Sales - require auth
app.use('/api/sales', authOrDevice, requireRole('owner', 'cashier'), salesRoutes);

// Device Keys management (owner only)
app.use('/api/device-keys', authMiddleware, requireRole('owner'), deviceKeysRoutes);

// Example: if you want sync endpoints to allow device key auth, you can mount them alongside JWT auth on dedicated paths.
// For example, allow POST /api/sync/sales to accept Device <secret> header via deviceKeyAuth middleware.
// (No sync routes added here automatically; add per-need)

// Rotas Protegidas de Admin
app.use('/api/admin', adminOriginCheck, authMiddleware, requireRole('super_admin'), adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Genesis API - v1.0' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);               //  imprime o stack no terminal
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message || err.stack   //  devolve detalhes opcionalmente
  });
});

ensureDemoData()
  .then(() => {
    app.listen(port, () => {
      console.log(`Genesis backend running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to ensure demo data:', error);
    process.exit(1);
  });
