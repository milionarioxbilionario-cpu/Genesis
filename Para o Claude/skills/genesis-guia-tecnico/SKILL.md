---
name: genesis-guia-tecnico
description: Guia técnico de implementação do Genesis (Secção 18 do Prompt Mestre) — código de referência para conversão de centavos, ProtectedRoute/useAuth//api/auth/me, QR real nos recibos, wizard de onboarding + seed master_catalog, fórmula exacta do relatório mensal (lucro líquido real), Cashiers/Employees/Debts/Goals, serviço WhatsApp/Twilio, race conditions de stock (SELECT FOR UPDATE). Usar ao implementar uma destas sub-tarefas.
---

# Genesis — Guia técnico de implementação (Secção 18 do Prompt Mestre)

Extraído literalmente de `Prompt_Mestre.txt` (versão Setembro 2026). É código
de REFERÊNCIA, não código a colar: o repositório já evoluiu desde então. Ler
sempre o ficheiro real antes de editar. Divergências conhecidas:
- O backend não tem `controllers/` nem `report.service.js`; a lógica vive em
  `backend/src/routes/*.js` (ex.: relatórios em `routes/owner.js`).
- Variáveis Twilio reais: `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` /
  `TWILIO_WHATSAPP_FROM` (ver `backend/.env.example`), não `TWILIO_SID`/`TWILIO_TOKEN`.
  O serviço existente é `backend/src/utils/whatsapp.js`.
- Conversão MZN↔centavos já existe em `frontend/src/utils/money.js`
  (`mznToCents`, `centsToMznInput`) — usar em vez de `Math.round(x * 100)` solto.
- `adminOriginCheck.js` actual usa comparação EXACTA de origin (a versão da
  Secção 15 com `startsWith` tinha um bypass e foi corrigida).

--------------------------------------------------------------------------------
SECÇÃO 18 — GUIA TÉCNICO DE IMPLEMENTAÇÃO (código de referência por
sub-tarefa)
--------------------------------------------------------------------------------

### 18.1 — Corrigir bug de moeda no OnboardingWizard

```javascript
// ANTES (errado — envia em MZN directamente):
const products = template.products.map(p => ({
  name: p.name,
  price_mzn: Number(p.price_mzn),
  cost_mzn: Number(p.cost_mzn),
}));

// DEPOIS (correcto — converte para centavos):
const products = template.products.map(p => ({
  name: p.name.trim(),
  sell_price: Math.round(Number(p.price_mzn) * 100),   // 150.00 -> 15000
  cost_price: Math.round(Number(p.cost_mzn) * 100),    // 80.00 -> 8000
  stock_qty: Math.round(Number(p.stock) || 0),
  min_stock: 5,
  category: p.category || 'Geral',
  barcode: p.sku || null,
  is_active: true
}));
```
O backend já espera `sell_price`/`cost_price` em centavos (campos do
schema Prisma). A interface continua a mostrar valores em MZN ao
utilizador — só a conversão no envio muda. Manter a coluna "Centavos" como
preview na tabela do wizard para confirmação visual antes de importar.

### 18.2 — ProtectedRoute.jsx + useAuth.js + endpoint /api/auth/me

```jsx
// frontend/src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../utils/api';

const roleRedirects = {
  super_admin: '/admin-forbidden', // super admin não usa o frontend principal
  owner: '/owner',
  cashier: '/pos',
};

export default function ProtectedRoute({ children, requiredRole }) {
  const [status, setStatus] = useState('loading');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => {
        const role = res.data.user.role;
        setUserRole(role);
        setStatus(!requiredRole || role === requiredRole ? 'ok' : 'wrong-role');
      })
      .catch(() => setStatus('unauthorized'));
  }, [requiredRole]);

  if (status === 'loading') return <LoadingSpinner />;
  if (status === 'unauthorized') return <Navigate to="/login" replace />;
  if (status === 'wrong-role') return <Navigate to={roleRedirects[userRole] || '/login'} replace />;
  return children;
}
```

```jsx
// App.jsx — usar assim, e remover a rota /admin (vai para admin-frontend)
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/owner/*" element={
    <ProtectedRoute requiredRole="owner"><OwnerDashboard /></ProtectedRoute>
  } />
  <Route path="/pos" element={
    <ProtectedRoute requiredRole="cashier"><CashierDashboard /></ProtectedRoute>
  } />
  <Route path="/onboarding" element={
    <ProtectedRoute requiredRole="owner"><OnboardingWizard /></ProtectedRoute>
  } />
  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

```javascript
// backend/src/controllers/auth.controller.js
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, name: true, email: true, tenant_id: true, is_active: true }
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Conta inactiva ou não encontrada' });
    }
    if (user.tenant_id) {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenant_id }, select: { status: true } });
      if (tenant?.status === 'suspended') {
        return res.status(401).json({ error: 'Conta suspensa. Contacta o suporte.' });
      }
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});
```

### 18.3 — useAuth hook (verificação de token ao carregar)

```javascript
// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => { setUser(res.data.user); setLoading(false); })
      .catch(err => { setError(err); setUser(null); setLoading(false); });
      // Se 401: cookie inválido/expirado — não faz redirect aqui,
      // o ProtectedRoute trata do redirect.
  }, []);

  return { user, loading, error };
}
```

### 18.4 — QR Code real nos recibos

```bash
cd frontend && npm install qrcode
```

```javascript
import QRCode from 'qrcode';

async function generateQrCodeDataUrl(saleId) {
  const url = `https://genesis.co.mz/verify/${saleId}`;
  try {
    return await QRCode.toDataURL(url, { width: 70, margin: 1, color: { dark: '#111', light: '#fff' } });
  } catch (e) {
    console.warn('QR Code generation failed:', e);
    return null;
  }
}

export async function buildReceiptHtml({ shopName = 'Genesis', sale = {}, items = [] }) {
  const qrDataUrl = await generateQrCodeDataUrl(sale.id);
  const qrSection = qrDataUrl
    ? `<div class="qr"><img src="${qrDataUrl}" width="70" height="70" alt="QR Code" /></div>`
    : '';
  // ... inserir qrSection no HTML do recibo
}
```

### 18.5 — OnboardingWizard completo (5 passos) + seed de master_catalog

```jsx
// frontend/src/pages/Onboarding/Wizard.jsx
const STEPS = ['Tipo de Negócio', 'Categorias Adicionais', 'Catálogo de Produtos',
  'Equipa e Custos Fixos', 'Horário de Funcionamento'];

const BUSINESS_TYPES = [
  { value: 'bottle_store', label: 'Bottle Store / Loja de Bebidas', icon: '🍺' },
  { value: 'mercearia', label: 'Mercearia / Contentor', icon: '🛒' },
  { value: 'padaria', label: 'Padaria / Café', icon: '🥐' },
  { value: 'talho', label: 'Talho / Carniceria', icon: '🥩' },
  { value: 'supermercado', label: 'Supermercado', icon: '🏪' },
  { value: 'restaurante', label: 'Restaurante / Churrasqueira', icon: '🍽️' },
  { value: 'boutique', label: 'Boutique / Loja de Roupa', icon: '👗' },
  { value: 'outro', label: 'Outro tipo de negócio', icon: '🏢' },
];

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    businessType: null, additionalTypes: [], products: [], employees: [],
    fixedCosts: [], suppliers: [], openTime: '08:00', closeTime: '20:00',
    workDays: ['Mon','Tue','Wed','Thu','Fri','Sat'],
  });

  async function handleFinish() {
    await api.post('/api/owner/onboarding/complete', {
      products: data.products.map(p => ({
        ...p,
        sell_price: Math.round(Number(p.price_mzn || 0) * 100),
        cost_price: Math.round(Number(p.cost_mzn || 0) * 100),
      })),
      employees: data.employees,
      fixed_costs: data.fixedCosts,
      suppliers: data.suppliers,
      schedule: { open_time: data.openTime, close_time: data.closeTime, work_days: data.workDays }
    });
    onComplete();
  }
  // Passo 0: BUSINESS_TYPES; Passo 1: categorias adicionais; Passo 2: catálogo
  // (carregado via API a partir de master_catalogs); Passo 3: equipa+custos;
  // Passo 4: horário. Navegação Anterior/Próximo/Concluir com barra de
  // progresso proporcional a (currentStep+1)/STEPS.length.
}
```

**Seed da master_catalog (`backend/prisma/seed.js`)** — produtos reais do
mercado moçambicano por tipo de negócio (valores em centavos,
`suggested_cost`/`suggested_sell`):

- bottle_store: 2M 340ml, Manica 340ml, Txilar 340ml, Laurentina Premium,
  Heineken 330ml, Amstel 340ml, Sumol Laranja/Maçã 330ml, Coca-Cola
  330ml/500ml, Fanta Laranja 330ml, Sprite 330ml, Schweppes Tónica 330ml,
  Água Mineral 500ml/1.5L, Hunter's Gold 330ml, Smirnoff Ice 330ml, Whisky
  J&B 200ml, Vodka 200ml.
- mercearia: Arroz Mariana 1kg/5kg, Açúcar 1kg, Óleo Palmoil 1L/5L, Farinha
  de Milho 1kg, Farinha de Trigo 1kg, Ovos (unidade/caixa 30), Feijão 1kg,
  Sal 1kg, Tomate Concentrado (lata), Sardinha em Lata, Sabão Sunlight,
  Detergente OMO 500g.
- padaria: Pão de Forma (unidade/pacote), Bolo Simples/Chocolate (fatia),
  Croissant, Café Expresso, Café com Leite, Sumo Natural de Laranja (copo),
  Manteiga 200g, Queijo Fatiado 200g.
- talho: Frango Inteiro (~1kg), Peito de Frango 1kg, Coxa de Frango 1kg,
  Carne Bovina 1kg, Carne de Porco 1kg, Chouriço (unidade), Linguiça
  (unidade), Costeletas de Porco 1kg.
- supermercado: combinar bottle_store + mercearia + outros.

Usar `prisma.masterCatalog.upsert` por `business_type` + `product_name`
para popular/actualizar a tabela sem duplicar.

### 18.6 — Relatório mensal: fórmula exacta do lucro líquido real

```javascript
// backend/src/services/report.service.js
async function generateMonthlyReport(tenantId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const sales = await prisma.sale.findMany({
    where: { tenant_id: tenantId, status: 'completed', created_at: { gte: startDate, lte: endDate } },
    include: { sale_items: true }
  });

  const gross_revenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const cost_of_goods = sales.reduce((sum, s) =>
    sum + s.sale_items.reduce((si, item) => si + (Number(item.unit_cost_price) * Number(item.quantity)), 0), 0);
  const gross_profit = gross_revenue - cost_of_goods;

  const fixedCosts = await prisma.fixedCost.findMany({ where: { tenant_id: tenantId } });
  const total_rent = fixedCosts.filter(c => c.type === 'rent').reduce((s, c) => s + Number(c.amount), 0);
  const total_other_fixed = fixedCosts.filter(c => c.type !== 'rent').reduce((s, c) => s + Number(c.amount), 0);

  const employees = await prisma.employee.findMany({ where: { tenant_id: tenantId, is_active: true } });
  const total_salaries = employees.reduce((s, e) => s + Number(e.monthly_salary), 0);

  // Custo de fornecedores: entradas de stock REAIS no período, não "1x por fornecedor activo"
  const stockEntries = await prisma.stockEntry.findMany({
    where: { tenant_id: tenantId, created_at: { gte: startDate, lte: endDate }, supplier_id: { not: null } },
    include: { supplier: true }
  });
  const supplierDeliveryCosts = {};
  for (const entry of stockEntries) {
    if (entry.supplier_id && entry.supplier) {
      supplierDeliveryCosts[entry.supplier_id] = supplierDeliveryCosts[entry.supplier_id] ||
        { count: 0, cost_per_visit: Number(entry.supplier.delivery_cost_per_visit) };
      supplierDeliveryCosts[entry.supplier_id].count++;
    }
  }
  const total_supplier_delivery = Object.values(supplierDeliveryCosts)
    .reduce((s, sup) => s + (sup.count * sup.cost_per_visit), 0);

  const net_profit = gross_profit - total_salaries - total_rent - total_other_fixed - total_supplier_delivery;

  const revenue_by_payment = { cash: 0, mpesa: 0, emola: 0, pos_bank: 0 };
  for (const sale of sales) {
    revenue_by_payment[sale.payment_method] = (revenue_by_payment[sale.payment_method] || 0) + Number(sale.total_amount);
  }

  return {
    period: { year, month, startDate, endDate },
    sales_count: sales.length,
    gross_revenue, cost_of_goods, gross_profit,
    deductions: { total_salaries, total_rent, total_other_fixed, total_supplier_delivery },
    net_profit, // LUCRO LÍQUIDO REAL
    revenue_by_payment,
    employees_detail: employees.map(e => ({ name: e.name, role: e.role, salary: e.monthly_salary })),
    fixed_costs_detail: fixedCosts.map(c => ({ desc: c.description, amount: c.amount, type: c.type })),
  };
}
```

**18.6.1 — Visual do relatório mensal:** apresentar como "cascata" —
começar na receita bruta e ir deduzindo cada custo (cost_of_goods,
salaries, rent, other_fixed, supplier_delivery) até ao resultado final
(net_profit), com cor verde para valores positivos de entrada, vermelho
para deduções, azul/vermelho conforme o sinal do resultado final. É a peça
visual mais importante de todo o produto.

**ATENÇÃO AO IMPLEMENTAR CÁLCULOS FINANCEIROS (regra geral, válida para
todos os relatórios):**
- Usar inteiros (centavos) para todos os cálculos monetários — NUNCA
  float/double.
- Testar edge cases: produto com preço de custo zero, vendas no último
  segundo do dia, stock negativo.
- Vendas canceladas NUNCA contam na receita de nenhum relatório.

### 18.7 — Cashiers.jsx — gestão de caixistas (estrutura de referência)

Formulário de criação (nome, telefone opcional, senha inicial) que chama
`POST /api/owner/cashiers`; tabela com nome, telefone, estado
(activo/desactivado), data de criação, e botão de desactivar que chama
`PUT /api/owner/cashiers/:id/deactivate`.

### 18.8 — Employees.jsx — trabalhadores (estrutura de referência)

Formulário (nome, função, salário mensal em MZN — CONVERTER para
centavos com `Math.round(Number(form.monthly_salary_mzn) * 100)` antes de
enviar — este é exactamente o bug confirmado na SECÇÃO 12.2 item 2, não
repetir), telefone opcional, data de início. Mostrar total de salários
mensais em destaque (soma de todos os `monthly_salary`), com nota de que
este valor é deduzido automaticamente no relatório mensal.

### 18.9 — Debts.jsx — módulo de chenecas (estrutura de referência)

Cards de resumo: total em dívida (activa + parcialmente paga), número de
dívidas vencidas, número a vencer na semana. Formulário de nova cheneca
(nome do devedor, WhatsApp, valor total em MZN → converter para centavos,
data de vencimento). Tabela com devedor, WhatsApp, total, pago, saldo,
vencimento, estado (Activa/Pago parcialmente/Pago/Vencida, com cores
azul/amarelo/verde/vermelho respectivamente). Modal de registo de
pagamento parcial que actualiza o saldo.

### 18.10 — (reservado — ver 18.6.1 para o relatório mensal em cascata)

### 18.11 — Goals.jsx — barra de progresso de metas

Lógica de cor por percentagem: <20% vermelho, 20-50% laranja, 50-80%
amarelo, 80-100% verde/esmeralda. Acima de 100%: barra de bónus separada,
azul, mostrando o excedente (`pct - 100`). Transições suaves (ex:
`transition-all duration-700`).

### 18.12 — WhatsApp / Twilio — serviço e mensagens

```javascript
// backend/src/services/whatsapp.service.js
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function sendWhatsApp(to, message) {
  if (!process.env.TWILIO_SID || process.env.TWILIO_SID.startsWith('placeholder')) {
    console.log(`[WhatsApp MOCK] Para: ${to}\nMensagem: ${message}`);
    return;
  }
  try {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:+258${to.replace(/\D/g, '')}`,
      body: message,
    });
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar:', err.message);
  }
}

// Resumo diário (chamar no fecho do dia)
async function sendDailySummary({ ownerPhone, tenantName, date, sales_count, gross_revenue, net_profit_estimate, top_product }) {
  const revenue_mzn = (gross_revenue / 100).toFixed(2);
  const msg = `🏪 *${tenantName} — Resumo ${date}*\n\n` +
    `✅ Vendas: *${sales_count}*\n💰 Receita: *${revenue_mzn} MZN*\n` +
    `📦 Produto mais vendido: *${top_product}*\n` +
    `💵 Lucro bruto estimado: *${(net_profit_estimate / 100).toFixed(2)} MZN*\n\n` +
    `_Genesis — O teu negócio sempre no controlo_`;
  await sendWhatsApp(ownerPhone, msg);
}

// Alerta de cheneca (7/1/0 dias)
async function sendDebtAlert({ debtorPhone, debtorName, storeName, amount_mzn, due_date, days_remaining }) {
  const urgency = days_remaining === 0 ? '🚨 HOJE' : days_remaining === 1 ? '⚠️ AMANHÃ' : `ℹ️ em ${days_remaining} dias`;
  const msg = `Olá *${debtorName}*, lembrete da loja *${storeName}*.\n\n` +
    `Tens um pagamento pendente de *${amount_mzn} MZN* com vencimento *${urgency}* (${due_date}).\n\n` +
    `Por favor, procede ao pagamento quando possível. Obrigado! 🙏`;
  await sendWhatsApp(debtorPhone, msg);
}

// Alerta de stock mínimo (normal/severo/crítico)
async function sendLowStockAlert({ ownerPhone, productName, current_qty, min_qty, tenantName }) {
  const level = current_qty <= 10 ? '🚨 CRÍTICO' : current_qty <= 20 ? '⚠️ URGENTE' : '📢 AVISO';
  const msg = `${level} | *${tenantName}*\n\nStock baixo: *${productName}*\n` +
    `Quantidade actual: *${current_qty}* unidades\nMínimo configurado: *${min_qty}* unidades\n\n` +
    `Considera reabastecer em breve.`;
  await sendWhatsApp(ownerPhone, msg);
}

module.exports = { sendDailySummary, sendDebtAlert, sendLowStockAlert };
```

### 18.13 — Race conditions no stock (Fase 8)

```sql
-- Envolver a venda numa transacção com SELECT FOR UPDATE
BEGIN;
SELECT stock_qty FROM products WHERE id = $1 FOR UPDATE;
-- Se stock_qty >= quantity: deduzir; senão: ROLLBACK
COMMIT;
```

