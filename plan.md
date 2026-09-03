# Plano de implementação do Genesis

## Estado atual (atualizado)
- Backend e frontend prontos com autenticação, POS offline-first, dashboard do proprietário e painel de admin.
- Migrations do Prisma aplicadas (não havia migrations pendentes quando verificado).
- Row-Level Security (RLS) e políticas de isolamento por tenant foram aplicadas no Supabase via SQL Editor (policies tenant_isolation_* criadas/confirmadas).
- Fecho de turno, impressão de recibos, cancelamento por PIN e hardening UX para cancelamentos implementados no código.

## Validações já concluídas
- Frontend build validado localmente (vite build ok) e preview iniciado localmente (porta 5174).
- Backend sintaxe validada (checagem Node/Prisma em ambiente local).
- Prisma migrations: `npx prisma migrate deploy` reportou "No pending migrations".
- RLS: script idempotente executado no SQL Editor do projeto; políticas criadas/confirmadas.
- E2E test: script `backend/scripts/e2e_test2.js` executado localmente — criou tenant/test owner, definiu PIN, criou produto, registou venda, cancelou venda com PIN, validou restauração de stock e entradas em AuditLog.

## Passos recomendados agora (end-to-end)
1. Instalar dependências (se ainda não o fizeste):
   - Backend: `cd /home/kali/Genesis/backend && npm install`
   - Frontend: `cd /home/kali/Genesis/frontend && npm install`

2. Iniciar serviços para testes manuais:
   - Backend (dev/prod): `cd /home/kali/Genesis/backend && npm start`
   - Frontend (dev): `cd /home/kali/Genesis/frontend && npm run dev` (ou usar build + preview)

3. Testes SQL/rápidos para confirmar RLS (executar no SQL Editor do Supabase):
   - Listar policies criadas:
     SELECT policyname, schemaname, tablename FROM pg_policies WHERE policyname LIKE 'tenant_isolation_%' ORDER BY tablename;

   - Verificar RLS ativo nas tabelas:
     SELECT c.relname AS table, c.relrowsecurity
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname IN ('Tenant','User','Product','Sale','SaleItem','StockEntry','Employee','Supplier','FixedCost','Debt','DebtPayment','DemandCapture','ShrinkageRecord','ShiftClosing','SaleGoal','AuditLog','ProductPriceHistory');

   - Teste funcional (substitui `<TENANT_UUID>` por um tenant real):
     SET app.tenant_id = '<TENANT_UUID>';
     SELECT count(*) FROM public."Product";
     -- Remove o setting e testa que sem tenant_id a query pode devolver diferente (ou falhar dependendo da policy)

4. Fluxo end-to-end recomendado (manual):
   a) Criar pedido de conta -> aprovar no Super Admin
   b) Login como owner -> definir PIN de cancelamento em Owner Dashboard
   c) Importar ou criar produtos
   d) Login como cashier -> registar venda no POS (testar offline -> sync)
   e) Fecho de turno
   f) Cancelar venda usando PIN do owner (validar que o audit log regista a ação e stock é restaurado)

5. Testes automatizados / scripts (opcional):
   - Escrever scripts de integração que usem a API do backend (com JWT) para simular:
     * criação de tenant + users
     * criar produtos
     * registrar uma venda
     * cancelar a venda (com PIN)
     * validar stock e audit_log

## Próximos passos que posso executar aqui (diz qual preferes)
- Iniciar o backend e correr um conjunto de verificações automáticas (se autorizares a usar as credenciais actuais em `.env`).
- Criar um script de testes de integração (node + axios) e executá-lo contra o ambiente já configurado para validar os fluxos críticos.
- Gerar dumps (backup) das tabelas críticas antes de mudanças posteriores.

## Local do ficheiro deste plano
- [plan.md](/home/kali/Genesis/plan.md)

Se quiseres, prossigo com: iniciar o backend aqui e executar um script de verificação end-to-end (criar tenant de teste, criar users, fazer venda, cancelar, verificar logs). Responde com "executar verificações" ou "prefiro fazer manualmente".