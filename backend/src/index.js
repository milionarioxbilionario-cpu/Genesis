require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const salesRoutes = require('./routes/sales');
const catalogRoutes = require('./routes/catalogs');
const masterCatalogRoutes = require('./routes/master_catalogs');
const productsRoutes = require('./routes/products');
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
const refreshRoute = require('./routes/refresh');

const app = express();
const port = process.env.PORT || 4000;

// CORS: allow credentials (cookies) and accept requests from frontend (origin can be tightened)
app.use(cors({ origin: true, credentials: true }));
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
app.use('/api/admin', authMiddleware, requireRole('super_admin'), adminRoutes);

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

app.listen(port, () => {
  console.log(`Genesis backend running on port ${port}`);
});
