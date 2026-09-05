# Plano de implementação do Genesis

## Estado atual (completo e validado)
- O sistema Genesis já está funcional em ambiente local e pronto para uso produtivo em contexto de demonstração e primeira implantação real.
- Backend e frontend estão integrados, com autenticação, dashboard de proprietário, painel de super admin, POS e onboarding de catálogo.
- As políticas de multi-tenancy e RLS foram validadas no Supabase e a camada de segurança foi reforçada com tenant scoping em todas as consultas protegidas.
- O fluxo de onboarding foi melhorado para funcionar em poucos cliques, com seleção do tipo de negócio, catálogo sugerido e importação rápida de produtos.
- O UX foi melhorado para reduzir atrito operacional: CTA de onboarding no dashboard, rota real do wizard e validações de importação mais claras.

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

## Próximos passos recomendados
1. Limpeza opcional: `rm -rf frontend/node_modules/.vite` e reiniciar `./run-local.sh` para forçar re-optimização do Vite se notar algum comportamento estranho.
2. Mover validação para CI: adicionar um job que execute `npm run build` (frontend) e um smoke test (simular admin→owner→import) contra um ambiente SQLite temporário.
3. Avançar para Stage POS: integrar UI de caixa (POS) com a fila offline já preparada e testes de e2e de venda + fecho de turno.

Se nada mais for pedido nesta etapa, este checkpoint está pronto para ser marcado como concluído.
