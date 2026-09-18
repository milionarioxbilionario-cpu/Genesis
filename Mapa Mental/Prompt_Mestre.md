# PROMPT MESTRE — PROJECTO GENESIS
## Documento de Handoff para Agente de IA (Claude Code / Copilot / Cursor / outro)
### Versão 1.0 — Setembro 2026
---
## 0. LEIA ISTO PRIMEIRO — COMO USAR ESTE DOCUMENTO
Tu (agente de IA) estás a entrar num projecto **já em curso**, não a começar do zero. Este documento é a tua fonte única de verdade sobre o que este projecto é, o que já foi feito, o que está confirmado como correcto, e o que está confirmado como problema.

**A tua primeira acção, sem excepção, é:**
1. Verificar se existe o directório `Mapa Mental/` na raiz do repositório Genesis.
2. Se existir, ler `Mapa Mental/Mapa_Mental.md` na íntegra antes de tocares em qualquer ficheiro de código.
3. Se **não** existir, cria o directório e o ficheiro agora, usando a Secção 6 deste documento como conteúdo inicial.
4. Só depois de leres o estado actual é que decides o que fazer a seguir.

---
## 1. IDENTIDADE DO PROJECTO
- **Nome oficial e definitivo do produto:** `Genesis`. Não uses "LucroCerto" nem "GESTÃO INTELIGENTE MZ".
- **Tipo:** Plataforma SaaS multi-tenant de gestão comercial.
- **Mercado-alvo:** Pequenos e médios comerciantes de Moçambique.
- **Repositório:** `github.com/milionarioxbilionario-cpu/Genesis`
- **Moeda:** Metical moçambicano (MZN). Valores internos em centavos (inteiros), nunca floats.
- **Idiomas da interface:** Português (padrão) e Inglês.

---
## 2. MISSÃO E CONTEXTO DE NEGÓCIO
Este software vai processar **dinheiro real de pequenos comerciantes reais**.

**Modelo de negócio:**
- Subscrição mensal: 3.000 MZN/cliente.
- Trial gratuito: 30 dias.
- Aquisição: vendas presenciais porta-a-porta.

**Três níveis de utilizador:**
1. **Super Admin (fundador):** painel fisicamente separado (`admin-frontend/`). Nunca partilha o bundle do frontend principal.
2. **Owner:** um único painel de gestão. Sem modo POS nem Super Admin misturados. Caixistas, histórico, dashboards, WhatsApp, barra de meta. Subscrição em atraso: histórico visível, acções de valor bloqueadas.
3. **Cashier/Caixista:** só POS. Sempre associado ao Owner. Não cancela vendas sem PIN do Owner.

---
## 3. REGRAS INVIOLÁVEIS DE TRABALHO
1. Uma etapa de cada vez, com paragem obrigatória.
2. Proibido despachar tudo de uma vez.
3. Nunca declares algo "feito" sem prova concreta.
4. Segurança é fundação, não camada final.
5. Offline-first é esqueleto, não feature.
6. Dinheiro é inteiro, nunca float. Antes de dar um bug de moeda como resolvido, grep o repositório inteiro.
7. Um tenant nunca vê dados de outro. RLS obrigatório.
8. Nunca inventes funcionalidades.
9. Não geres código ou texto desnecessário. Sem "pronto para produção" sem prova.

---
## 4. PROTOCOLO DE VERIFICAÇÃO ANTI-ALUCINAÇÃO
Antes de reportares qualquer coisa como feita: corrigiste de facto agora? tens output real? procuraste o mesmo padrão noutros ficheiros? verificaste tu mesmo ou estás a repetir um resumo?

Se não: marcar `⚠️ NÃO VERIFICADO`, nunca `✅ CONFIRMADO`.

---
## 5. SISTEMA DE MEMÓRIA PERSISTENTE — "MAPA MENTAL"
**Localização:** `/Genesis/Mapa Mental/Mapa_Mental.md`
Ler por inteiro antes de qualquer acção. Actualizar Parte A e Parte B antes de terminar a resposta.

---
## 6. ESTADO REAL VERIFICADO (auditoria até 13 de Setembro de 2026)
Ver `Mapa_Mental.md` Parte A — é o estado vivo. A auditoria original está no prompt mestre da sessão de 13/09/2026 e foi copiada para a primeira versão da Parte A.

### 6.1 — Confirmado como correcto (auditoria inicial)
- Conversão de centavos no Onboarding Wizard
- ProtectedRoute.jsx
- Protecção das rotas Super Admin no backend
- Isolamento de tenant em owner.js
- App.jsx correcto em `frontend/src/App.jsx`

### 6.2 — Problemas (por ordem de prioridade)
0.1 Dois App.jsx (em tratamento nesta sessão)
0.2 Bug de moeda ×100 em formulários
0.3 Fórmula do relatório mensal
0.4 Ficheiros residuais / .gitignore
1.x Super Admin ainda no bundle principal
2.x Confusão de UI Owner/POS/Admin
3.x Arquitectura backend inconsistente
4.x CORS aberto
5.x Resíduos no repositório

### 6.3 — Por verificar
E2E reais, Debts/Goals moeda, ADMIN_ORIGINS, fecho de turno, PIN, sync offline.

---
## 7. ROADMAP
Fase 0 crítica → Fase 1 admin separado → Fase 2 UI Owner → Fase 3 arquitectura → Fase 4 UI/UX → Fase 5 features pendentes → Fase 6 testes → Fase 7 piloto.

---
## 8. STACK
Node.js + Express + Prisma (PostgreSQL/Supabase); JWT httpOnly cookie; bcrypt ≥12; React+Vite+Tailwind (Owner/Cashier); admin-frontend separado; Dexie+PWA; Twilio; Recharts.

---
## 9. PRIMEIRA INSTRUÇÃO
Ler este documento e o Mapa Mental. Uma mini-meta. Prova. Actualizar mapa. Parar.
