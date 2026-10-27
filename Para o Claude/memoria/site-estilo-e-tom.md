---
name: site-estilo-e-tom
description: "Site público — branco como destaque, verde só a acompanhar; textos para o cliente, sem jargão técnico nem tom de IA"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e4db621a-a3ae-4288-bbef-828858c814e3
  modified: 2026-10-27T10:26:24.278Z
---

Site público (genesismz.com): o fundo branco é o destaque; o verde da marca só acompanha (botões, ícones, fim do título, a faixa da segurança). A Fase 14 pôs o herói e a chamada final em verde-escuro e o fundador não gostou (27/10/2026). Dentro da app o verde fica como está (marca o saldo/receita, dá contraste ao que importa).

Textos do site são para o CLIENTE moçambicano, não para o fundador: nada de «base de dados», «servidor», «duas camadas», «lotes», «auditoria», «sessões», «sincronizar», «browser», «emparelhar», «fecho às cegas». Frases curtas, simples, profissionais, que despertem curiosidade e mostrem o valor; sem palavras caras.

**Why:** o fundador disse que os textos pareciam escritos por uma IA a explicar-lhe o que mudou (ex.: «cada loja está separada… na base de dados»), e que a maioria dos clientes nem sabe o que é uma base de dados.

**How to apply:** ao mexer em `frontend/site/textos.*.js` ou `template.js`, escrever como benefício para o dono do negócio. O teste `tests/site.test.mjs` («sem palavras tecnicas») e `tests/e2e/site.mjs` (herói branco) guardam isto. Ver [[plan-fases-12-20-decisoes]].
