---
name: autonomous-phase-runs
description: "Execução autónoma: no fim de cada etapa testar, commit, push, publicar e avisar curto; seguir para a seguinte sem esperar (decisão 25/10)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c0ebfffb-5761-4d6b-b8f3-8118785ad444
  modified: 2026-10-25T14:35:15.884Z
---

A 2026-10-11 o fundador pediu para avançar sem parar ("só pare se precisares de uma validação minha sobre algo importante… e não cometa erros"). A 2026-10-25 reforçou, antes de pôr o auto mode no plano das Fases 12–20 (`Para o Claude/planos/joyful-wibbling-lighthouse.md`): "é melhor me perguntar agora tudo… depois não quero que me interrompas, faz tudo e só me avisa quando tiveres terminado cada etapa; no fim de cada etapa commit, push e publicar no genesismz.com".

**Why:** o fundador quer progresso sem idas e voltas. A regra 1 do CLAUDE.md (paragem entre fases) fica substituída, por autorização explícita dele, por um aviso curto no fim de cada etapa, seguindo logo para a etapa seguinte.

**How to apply:**
- As perguntas fazem-se TODAS antes de começar. Durante a execução decido pelo plano aprovado, e quando falta um pormenor escolho a opção mais segura e anoto-a no aviso.
- O fundador autorizou migrações SÓ aditivas na BD de produção, sempre com `pg_dump` antes.
- Paro apenas perante algo irreversível que o plano não cubra.
- Ver [[commits-on-main]], [[git-authorship]] e [[plan-fases-12-20-decisoes]].
