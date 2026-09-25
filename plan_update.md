ETAPA 0 — Progresso e Ações Realizadas (Atualização)

Data: 2026-09-09

Resumo rápido do que foi feito agora:
- Criado backend/.env.example com placeholders e instruções para não commitar segredos.
- Criado backend/prisma/add_indexes.sql com índices recomendados para Postgres/Supabase.
- Criado Plano_a_executar.md anteriormente contendo auditoria completa e backlog.

O que já existia e foi verificado:
- Prisma schema e migrações já presentes e aplicadas localmente (backend/prisma/dev.db).
- Dexie.js local DB e useOfflineSync hook já implementados no frontend.
- Scripts RLS (backend/prisma/rls.sql, rls_policies.sql) presentes.

Pendências que requerem ação externa ou credenciais:
1) Aplicar RLS no Supabase (criar políticas) — exige acesso ao projeto Supabase ou que um administrador execute o script backend/prisma/rls_policies.sql via SQL editor. Até que isto seja aplicado, isolamento total entre tenants NÃO está garantido no ambiente remoto.

2) Testes de validação finais que envolvem Supabase/Postgres e browser:
   - Criar dois tenants no Supabase e verificar queries com SET app.tenant_id
   - Executar migrações contra um Postgres real (se necessário) e confirmar tabelas
   - Testar o fluxo offline: criar vendas no browser em modo offline e confirmar sincronização quando online (useOfflineSync)

3) Rotação de segredos (se qualquer segredo de produção estiver comprometido). Se os valores no repositório forem apenas de dev (SQLite), ainda recomendo criar .env.example e adicionar .env ao .gitignore.

Próximo passo sugerido (escolhe uma):
- "aplicar-rls": eu preparo instruções passo a passo e posso executar se forneceres credenciais (recomendado executar via Supabase UI ou psql).
- "remover-secrets": eu removo/rotaciono segredos do repo (posso criar commits que substituem production secrets with placeholders) — precisa confirmar se queres que eu commite essa alteração.
- "start-etapa-1": começo a implementar autenticação segura (httpOnly cookies, refresh tokens) e middleware que seta app.tenant_id para cada conexão DB.

Notas:
- Eu não apliquei RLS automaticamente pois não tenho credenciais do Supabase nem permission to change remote infra.
- Todos os arquivos criados nesta atualização são não-invasivos e não alteram o código de execução existente.

