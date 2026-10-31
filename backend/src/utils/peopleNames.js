// Nomes das pessoas citadas nos registos de um estabelecimento (quem vendeu,
// quem registou a perda, quem mudou o custo...).
//
// Lidos A PARTE e nunca com `include` da relacao User: com a RLS, a linha de
// quem nao pertence a este estabelecimento fica invisivel e o Prisma recebia
// «relacao obrigatoria em falta» -> a pagina inteira dava 500. Aconteceu com o
// super admin em modo suporte e, desde a Etapa D, com o dono de varios
// estabelecimentos (a conta dele vive no estabelecimento de casa): bastava ele
// registar stock ou mudar um custo no 2.o para o Rastreio deixar de abrir.
//
// Fora as pessoas deste estabelecimento, so se acrescentam os donos com acesso
// a ELE (Membership, cliente de sistema): nunca o nome de outra conta qualquer.
const prisma = require('./prisma');

async function peopleNames(tenantId, ids) {
  const want = [...new Set((ids || []).filter(Boolean))];
  if (!want.length) return new Map();
  const map = new Map((await prisma.user.findMany({ where: { tenant_id: tenantId, id: { in: want } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const missing = want.filter((id) => !map.has(id));
  if (missing.length) {
    const members = await prisma.system.membership.findMany({ where: { tenant_id: tenantId, user_id: { in: missing } }, select: { user_id: true } });
    if (members.length) {
      for (const u of await prisma.system.user.findMany({ where: { id: { in: members.map((m) => m.user_id) } }, select: { id: true, name: true } })) map.set(u.id, u.name);
    }
  }
  return map;
}

// Junta a cada linha { id, name } da pessoa, no mesmo campo que o `include`
// usava (ex.: [['cashier', 'cashier_user_id']] -> linha.cashier.name).
async function attachPeople(tenantId, rows, relations) {
  const ids = [];
  for (const r of rows) for (const [, fk] of relations) if (r[fk]) ids.push(r[fk]);
  const names = await peopleNames(tenantId, ids);
  for (const r of rows) {
    for (const [rel, fk] of relations) r[rel] = r[fk] ? { id: r[fk], name: names.get(r[fk]) || null } : null;
  }
  return rows;
}

module.exports = { peopleNames, attachPeople };
