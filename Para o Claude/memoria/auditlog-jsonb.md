---
name: auditlog-jsonb
description: "Na BD real AuditLog.new_value/old_value são jsonb (desvio do schema String): nunca pesquisar com contains de texto JSON"
metadata:
  node_type: memory
  type: project
  originSessionId: 41409db2-e4b7-4ff6-a487-1a3e3f7005ae
  modified: 2026-10-31T16:41:52.416Z
---

Na BD Supabase (dev = produção) as colunas `AuditLog.new_value` / `old_value` são `jsonb`, embora o `schema.prisma` diga `String`. O Postgres guarda o JSON normalizado (`"chave": valor`, com espaço e chaves reordenadas), por isso um filtro Prisma `new_value: { contains: '"x":true' }` nunca encontra nada. Visto em 31/10/2026 (E2, aviso «produto sem custo» — verify 53 falhou por isto).

**Why:** desvio antigo da BD (tal como os ids uuid sem FKs); localmente com SQLite funcionaria e enganaria.
**How to apply:** filtrar o rastreio por colunas (action, user_id, entity_id, tenant_id) e ler o JSON em JS depois (`JSON.parse`). Ver também [[lista-e-se]].
