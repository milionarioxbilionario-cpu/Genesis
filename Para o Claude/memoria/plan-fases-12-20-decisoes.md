---
name: plan-fases-12-20-decisoes
description: "Decisões do fundador (25/10) para as Fases 12-20 — bloqueio, cores do turno, servente, gerente, descontos, premium/aniversário, revenda"
metadata:
  node_type: memory
  type: project
  originSessionId: c0ebfffb-5761-4d6b-b8f3-8118785ad444
  modified: 2026-10-25T14:35:24.921Z
---

Plano aprovado a 2026-10-25 (cópia em `Para o Claude/planos/joyful-wibbling-lighthouse.md`). Ordem: Etapa 0 (repositório) → 12 defeitos → 13 visão geral + modo privado → 14 site → 15 recibo/IVA/peso/pagamento misto → 16 perfil + planos + aniversário → 17 vários estabelecimentos + gerente + mapa → 18 restaurante → 19 revenda/encomendas → 20 extras.

Decisões:
- **Bloqueio do painel:** PIN pessoal do dono + Face ID (passkey). Bloqueia ao reabrir e depois de 5 min parado; 5 erros → senha.
- **Cores do turno:** verde = abriu, cinzento = fechou, laranja = ainda não abriu, vermelho = só problemas.
- **Servente:** tira pedidos, gere mesas, ecrã da cozinha, cancelar com PIN do dono depois de sair da cozinha.
  - Não fecha a venda: envia a conta ao caixista, com a forma de pagamento.
  - Pode receber em dinheiro ou no POS, mas fica "enviado — por confirmar" até o caixista confirmar.
  - O recibo do restaurante leva logótipo, mesa, servente e tempo à mesa.
  - Limite de horas sem consumo avisa o servente.
- **Gerente** (por estabelecimento): não vê os outros estabelecimentos, a subscrição, o aniversário, o PIN de autorização, o lucro nem os custos. Os relatórios dele mostram só quanto se vendeu.
- **Descontos por n.º de estabelecimentos** (decididos por Claude, a pedido): 1–2 = 0%, 3–9 = 10%, 10+ = 15%. Calculadora animada em tempo real.
- **Premium (8 000 MT):** o mecanismo faz-se já; o conteúdo é "conteúdos premium e personalizados" até ele decidir.
  - Ideia futura: chat com IA no Premium.
- **Aniversário do dono:** definido uma só vez. O presente (1 mês Premium) só é explicado depois de definido.
  - Regras: mensal → o Premium começa no próximo ciclo; anual básico → sobe no próprio dia e dura até ao mesmo dia do mês seguinte.
  - Pop-up de parabéns; ícone 🎁 no Perfil, que fica transparente depois de recolhido.
- **Revenda:** produtos "sem stock" (custo pedido na venda) e artigos únicos que desaparecem ao vender (ex.: iPhone usado).
- **Só registar no Mapa Mental:** apps nativas, modo escuro, chat IA, confirmação automática de pagamentos.

**Why:** o fundador comparou com SIGEM, SmartChoice, DartPOS e PharmaSys, e com a IA do Google, que dizia que o Genesis não servia para encomendas nem restauração. Quer ser melhor que todos.

**How to apply:** seguir estas decisões sem voltar a perguntar. Ver [[autonomous-phase-runs]] e [[subscription-payment-plans]].
