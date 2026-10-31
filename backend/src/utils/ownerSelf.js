// A conta da propria pessoa (linha User) com varios estabelecimentos.
//
// Desde a Etapa D o pedido corre no estabelecimento ACTIVO (req.user.tenantId:
// filtro + RLS), mas a linha User do dono pertence ao estabelecimento de CASA
// (User.tenant_id = req.user.homeTenantId). Lida no contexto do estabelecimento
// activo, a linha nao aparece: no 2.o estabelecimento o painel pedia um PIN «que
// nao existia», a lingua e a senha nao mudavam, o Face ID nao era encontrado.
//
// O que e da PESSOA (senha, PIN do painel, e-mail, lingua, aniversario, chaves
// de acesso e as falhas de desbloqueio) le-se e grava-se aqui: com o cliente de
// sistema, sempre pelo id do token ja validado em middleware/auth.js e com o
// estabelecimento de casa no filtro. Nada daqui serve para ler dados de um
// estabelecimento (produtos, vendas...): esses continuam no contexto activo.
const prisma = require('./prisma');
const { writeAudit } = require('./audit');

const homeOf = (req) => req.user.homeTenantId || req.user.tenantId;
const selfWhere = (req) => ({ id: req.user.userId, tenant_id: homeOf(req) });

const findSelf = (req, select) => prisma.system.user.findFirst({ where: selfWhere(req), ...(select ? { select } : {}) });

// -> numero de linhas alteradas (0 ou 1).
async function updateSelf(req, data) {
  const done = await prisma.system.user.updateMany({ where: selfWhere(req), data });
  return done.count;
}

// Auditoria do que e da pessoa: fica no estabelecimento de casa.
const auditSelf = (req, action, extra = {}) => writeAudit({
  db: prisma.system, req, tenantId: homeOf(req), userId: req.user.userId,
  action, entityType: 'user', entityId: req.user.userId, ...extra,
});

module.exports = { homeOf, selfWhere, findSelf, updateSelf, auditSelf };
