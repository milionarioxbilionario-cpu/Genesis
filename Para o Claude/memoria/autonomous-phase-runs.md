---
name: autonomous-phase-runs
description: "Trabalho por ETAPAS completas: fazer a etapa inteira (testes+commit+push+publicar), só parar no fim e perguntar qual a próxima (decisão 27/10)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c0ebfffb-5761-4d6b-b8f3-8118785ad444
  modified: 2026-10-27T16:27:26.381Z
---

Desde 27/10/2026 o fundador trabalha por **etapas** (plano `Para o Claude/planos/kind-sleeping-squid.md`: etapa A correcções rápidas, depois menu B–N).
- Faço a etapa INTEIRA (todas as partes), com testes, commit, push e publicação em genesismz.com, e só paro no fim dessa etapa — nunca no meio, nem depois de cada parte.
- No fim aviso com a prova e **pergunto qual é a próxima etapa** (opções numeradas do menu do plano).
- Se a sessão cair e ele perguntar «onde paramos?»: ler Mapa Mental Parte B (última entrada) e dizer em que etapa/parte ia; continuar até ao fim da etapa; se a etapa já estava terminada, dizer que falta ele escolher a próxima.

Antes (25/10): «faz tudo sem parar e avisa no fim de cada etapa» — continua a valer não interromper com perguntas a meio; perguntas fazem-se antes de começar uma etapa.

**Why:** o fundador quer progresso sem idas e voltas, mas com controlo sobre a ordem das etapas grandes; reclamou quando parei a meio (27/10) e pediu este formato.

**How to apply:**
- Durante a etapa decido pelo plano; quando falta um pormenor escolho o mais seguro e anoto-o no aviso.
- Migrações SÓ aditivas na BD de produção, sempre com `backup_db.js` antes.
- Paro antes do fim só perante algo irreversível que o plano não cubra.
- Ver [[commits-on-main]], [[git-authorship]], [[plan-fases-12-20-decisoes]], [[site-estilo-e-tom]].

**Update 2026-10-30 (fundador foi dormir):** «continua sem parar até tudo estar concluído; o que precisar de mim (credenciais, configuração manual, decisões) escreve num PDF na pasta Genesis e salta essa parte; depois de tudo confirmado, com push e publicado, podes começar as fases de restaurante, hotel, etc.» Isto vale para essa noite/sessão: passar de etapa em etapa (B, C, D, I, J, K…) sem perguntar, registando cada uma (Mapa Mental, Diário, commit, publicação). PDF dessa noite: «Para ler - respostas e o que preciso de ti (30-10-2026).pdf». Os modos de negócio (F/G/…) só depois de o plano estar publicado e verificado — ver [[foco-pos-puro]].

**Update 2026-10-31:** o fundador reclamou que «não faço nada direito» (Etapa D falhou no 2.º estabelecimento). Pediu: plano completo («pensar como arquitecto: e se...?»), corrigir tudo, modo escuro, movimento fluido, publicar e um PDF com o que fiz e como verificar. Plano novo: `Mapa Mental/Plano 31-10-2026 - corrigir, painel geral e experiencia premium.md` (etapas E1 correcções, E2 painel geral + gerentes, E4 códigos de barras, E5 escuro/movimento, E6 site/admin/mapa mental, E7 mapa ao vivo). Ver [[lista-e-se]].
- Limite de uso: workflows com 8–9 agentes esgotaram o limite de 5 h duas vezes sem devolver resultados (só 1 de 17 acabou). Preferir trabalho directo (ler o código eu mesmo) e, se usar agentes, poucos e focados.
