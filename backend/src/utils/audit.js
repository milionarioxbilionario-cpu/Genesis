// Escrita de auditoria — fonte unica (Genesis 2.0).
//
// AuditLog.user_id e chave estrangeira obrigatoria para User. Codigo antigo
// gravava 'system'/'unknown': a insercao falhava e o erro era engolido, ou
// seja, a accao ficava SEM rasto. Aqui o user_id real e obrigatorio e os
// valores sao serializados uma unica vez.
const prisma = require('./prisma');

function serialize(value) {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

async function writeAudit({ db = prisma, req, tenantId, userId, action, entityType, entityId = null, oldValue, newValue }) {
  const uid = userId || req?.user?.userId;
  if (!uid) throw new Error('writeAudit: user_id obrigatorio (' + action + ')');
  return db.auditLog.create({
    data: {
      tenant_id: tenantId === undefined ? (req?.user?.tenantId || null) : tenantId,
      user_id: uid,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: serialize(oldValue),
      new_value: serialize(newValue),
      ip_address: req?.ip || '0.0.0.0',
    },
  });
}

module.exports = { writeAudit };
