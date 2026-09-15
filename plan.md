# Plano de implementação do Genesis

## Estado atual (completo e validado)
- O sistema Genesis está funcional em ambiente local e validado para a base do produto: autenticação, dashboard de proprietário, painel de super admin, POS e onboarding de catálogo.
- Backend e frontend estão integrados e os principais pontos críticos de segurança e negócio foram verificados em smoke tests reais.
- As políticas de multi-tenancy e RLS foram validadas no contexto local e a camada de segurança foi reforçada com tenant scoping em consultas protegidas.
- O fluxo de onboarding foi melhorado para funcionar em poucos cliques, com seleção do tipo de negócio, catálogo sugerido e importação rápida de produtos.
- O UX foi melhorado para reduzir atrito operacional: CTA de onboarding no dashboard, rota real do wizard e validações de importação mais claras.
- Foram concluídos os ajustes finais da fase de acabamento: cálculo de lucro líquido do relatório mensal, persistência de horário de funcionamento por tenant, gestão completa do lifecycle de tenants no painel admin e launcher `run-localhost.sh --admin` funcional.

## O que foi entregue
- Autenticação JWT com roles (`super_admin`, `owner`, `cashier`)
- Pedido público de conta e aprovação no painel administrativo
- Gestão de tenants e bloqueio de contas suspensas
- Dashboard do proprietário com métricas, stock, alertas e exportação CSV
- POS e operações de vendas
- Fecho de turno, PIN de cancelamento e auditoria
- Catalog import wizard para arranque da loja em poucos cliques
- Frontend PWA-ready e build validado

## Validações executadas
- Backend e frontend iniciados localmente com sucesso
- Smoke tests do sistema executados com sucesso
- Build de produção do frontend concluído com sucesso (`vite build`)
- Fluxo real de login do owner validado em ambiente local
- Fluxo de importação de catálogo validado em ambiente local
- Resposta da API confirmada com criação de produtos no tenant autenticado

## Como usar agora
- Backend: `cd /home/kali/Genesis/backend && npm start`
- Frontend: `cd /home/kali/Genesis/frontend && npm run dev`
- Acesso local:
  - Frontend: http://localhost:5173/login
  - Backend: http://localhost:4000/

## Credenciais de demonstração
- Owner de teste: `owner@genesis.local` / `<password-demo-removida-do-historico>`

## Observações finais
- O sistema está em estado pronto para uso e validação em produção de prova de conceito / primeira entrega.
- O foco agora é operar com clientes reais, ajustar fluxos de negócio específicos e ampliar integrações, mas sem perder a base funcional já validada.

## Atualizações recentes (resumo técnico)
- Endpoints adicionados: POST /api/demand_captures e POST /api/shrinkage_records (server-side, transactional, com AuditLog entries).
- Frontend: POS UI atualizado com botões "Pedido" (demand capture) e "Perda" (shrinkage) no catálogo de produtos.
- IndexedDB: Dexie schema bumped to include `shrinkage_records` store; demand captures already present. Local writes are created with `sync: false` and synchronized by `useOfflineSync` when online.
- Sync worker: `useOfflineSync` extended to sync pending shrinkage records to /api/shrinkage_records and mark them as synced on success.
- Test scripts added: `backend/scripts/tmp_post_demand_capture.js` and `backend/scripts/tmp_post_shrinkage.js` for quick server validation.

These changes were validated locally: the backend accepted demand capture and shrinkage requests and updated product stock and audit logs accordingly. Frontend changes write local records which the sync worker will POST when online.

## Recent fix and validation (2026-09-05)
- Corrigido problema no arranque local onde o frontend Vite falhava com EACCES sobre `node_modules/.vite` (cache). O script `run-local.sh` agora garante ownership adequado antes de arrancar o frontend.
- Validação completa do onboarding: request-account → admin approve → owner login → fetch template → import catalog → produtos visíveis em /api/products. `tenant.onboarding_completed` é marcado true na importação.
- Scripts de desenvolvimento: `run-local.sh` actualizado para prevenir regressões (corrige .vite ownership) e para abrir o browser apenas quando o frontend responde.

## Atualização operacional 2026-09-11
- Implementados alertas de stock mínimo e validade vencida para o dashboard do owner via `/api/owner/alerts`.
- Corrigida consistência do relatório mensal para expor `cost_of_goods` e `deductions` esperadas pelos componentes do frontend.
- Dashboard do owner agora apresenta alertas operacionais combinados, incluindo itens em risco e produtos expirados.
- Validação executada: `npm run build` no frontend e `node --check src/index.js` no backend concluídos com sucesso.

## Próximos passos recomendados
1. Limpeza opcional: `rm -rf frontend/node_modules/.vite` e reiniciar `./run-local.sh` para forçar re-optimização do Vite se notar algum comportamento estranho.
2. Mover validação para CI: adicionar um job que execute `npm run build` (frontend) e um smoke test (simular admin→owner→import) contra um ambiente SQLite temporário.
3. Avançar para Stage POS: integrar UI de caixa (POS) com a fila offline já preparada e testes de e2e de venda + fecho de turno.

Se nada mais for pedido nesta etapa, este checkpoint está pronto para ser marcado como concluído.

## Nova interface CRM (2026-09-06)
- Adicionados recursos de interface tipo CRM para demonstração rápida no frontend:
  - Arquivos CSS e animações importados em `frontend/src/ui/` (components.css, animations.css, main.css).
  - Mock data para demo em `frontend/src/ui/mockData.js` (window.GENESIS_DATA).
  - Componente de layout CRM: `frontend/src/layouts/CRMLayout.jsx` (sidebar, header, áreas principais).
  - Componentes demo adicionados: `frontend/src/components/StatsGrid.jsx`, `frontend/src/components/Pipeline.jsx`.
- As rotas principais (`/owner`, `/pos`, `/admin`, `/onboarding`) foram embrulhadas no `CRMLayout` para exibir o novo visual.
- O Owner Dashboard foi adaptado para apresentar visualização demo (Stats + Pipeline) quando a API de backend não retornar dados (útil para revisão visual antes de ligar ao backend real).
- Build do frontend validado: `npm run build` concluído sem erros.

Próximos passos para completar o redesign CRM (se aprovado):
1. Converter os widgets do `components.js.javascript` para React components reativos (botões, tenant switcher, badges, kanban cards) — isto trará interatividade real.
2. Implementar Command Palette (Ctrl+K) com pesquisa global usando uma pequena store e foco acessível.
3. Integrar TanStack Query e um adaptador demo↔API (VITE_API_BASE_URL) para alternar rapidamente entre dados locais de demonstração e o backend remoto.
4. Criar componentes de Sheet/Modal e Toasts (usar sonner/React Motion) e migrar formulários inline para painéis deslizantes.
5. Internacionalização (PT/EN) e tema claro/escuro com tokens em `src/ui/main.css`.

Status: trabalho de reconstrução do frontend iniciado e demo visual funcional. Se concordar, prosseguir automaticamente para converter os componentes JS fornecidos em React, integrar command palette e finalizar o conjunto de componentes CRM para entrega QA.

## Smoke tests (2026-09-15)
- Execução: scripts locais de smoke e E2E executados com sucesso em ambiente local.
- Testes realizados: onboarding (criação de tenant+owner via Prisma), owner login, criação de produto, venda, cancelamento com PIN, verificação de restauro de stock, geração de relatório mensal, criação de trabalhador e verificação da folha salarial, verificação de alertas e envio de resumo WhatsApp (modo "skipped" se Twilio não configurado).
- Artefactos/novos scripts adicionados:
  - backend/scripts/e2e_test2.fixed.js — versão corrigida do E2E com Authorization fix
  - backend/scripts/smoke_tests.js — bateria de smoke tests cobrindo reports/payroll/alerts
- Resultado: todos os passos da bateria de smoke tests passaram localmente. Alertas WhatsApp foram gerados em texto mas o envio foi ignorado porque as credenciais Twilio não estavam configuradas (comportamento esperado).

