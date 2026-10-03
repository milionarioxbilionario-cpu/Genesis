// Dados para o teste de browser do painel admin: um Super Admin de teste e um
// pedido de conta pendente. create grava as credenciais num JSON; delete apaga
// tudo (incluindo a loja criada pela aprovacao e o seu dono).
//   node scripts/e2e_admin_fixture.js create|delete <ficheiro.json>
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');

(async () => {
  await prisma.ready();
  const [cmd, file] = process.argv.slice(2);
  if (cmd === 'create') {
    const tag = 'e2e-admin-' + Date.now();
    const password = 'Adm-' + crypto.randomBytes(8).toString('hex');
    const admin = await prisma.user.create({ data: { tenant_id: null, role: 'super_admin', name: 'Admin E2E', email: tag + '@teste.local', password_hash: await bcrypt.hash(password, 12), is_active: true } });
    const request = await prisma.tenant.create({ data: { name: 'Mercearia Boa Esperança', owner_name: 'Fátima Nhantumbo', business_type: 'mercearia', location: 'Xipamanine, Maputo', phone: '847778899', email: tag + '-dono@teste.local', status: 'pending' } });
    fs.writeFileSync(file, JSON.stringify({ admin: { id: admin.id, email: admin.email, password }, request: { id: request.id, name: request.name } }, null, 2));
    console.log('fixture admin criada');
  } else if (cmd === 'delete') {
    const fx = JSON.parse(fs.readFileSync(file, 'utf8'));
    const t = fx.request.id;
    const userIds = (await prisma.user.findMany({ where: { tenant_id: t }, select: { id: true } })).map((u) => u.id).concat(fx.admin.id);
    await prisma.auditLog.deleteMany({ where: { OR: [{ tenant_id: t }, { user_id: { in: userIds } }, { entity_id: t }] } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.tenant.deleteMany({ where: { id: t } });
    console.log('fixture admin apagada');
  } else throw new Error('uso: create|delete <ficheiro.json>');
  process.exit(0);
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
