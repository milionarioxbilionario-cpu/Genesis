/* GERADO AUTOMATICAMENTE por scripts/gen_mindmap_data.js - NAO EDITAR A MAO.
   Fonte de verdade curada: Mapa Mental/mapa_mental_status.json
   Gerado em: 2026-10-31T13:19:10.576Z */
window.GENESIS_MINDMAP = {
 "generatedAt": "2026-10-31T13:19:10.576Z",
 "generator": "scripts/gen_mindmap_data.js",
 "curatedFrom": "Mapa Mental/mapa_mental_status.json",
 "project": "Genesis",
 "totals": {
  "files": 408,
  "planned": 5,
  "links": 780,
  "lines": 58102,
  "byStatus": {
   "ok": 242,
   "partial": 8,
   "broken": 0,
   "planned": 5,
   "untracked": 158
  },
  "byGroup": {
   "infra": 55,
   "docs": 13,
   "admin": 14,
   "backend-data": 94,
   "backend": 83,
   "frontend-pub": 8,
   "frontend": 142,
   "scripts": 4
  }
 },
 "topExternals": [
  {
   "pkg": "react",
   "count": 61
  },
  {
   "pkg": "node:path",
   "count": 45
  },
  {
   "pkg": "node:fs",
   "count": 44
  },
  {
   "pkg": "lucide-react",
   "count": 37
  },
  {
   "pkg": "node:test",
   "count": 37
  },
  {
   "pkg": "node:assert",
   "count": 37
  },
  {
   "pkg": "@playwright/test",
   "count": 32
  },
  {
   "pkg": "react-router-dom",
   "count": 27
  },
  {
   "pkg": "dotenv",
   "count": 24
  },
  {
   "pkg": "bcrypt",
   "count": 23
  },
  {
   "pkg": "express",
   "count": 22
  },
  {
   "pkg": "zod",
   "count": 21
  },
  {
   "pkg": "@prisma/client",
   "count": 17
  },
  {
   "pkg": "crypto",
   "count": 17
  },
  {
   "pkg": "path",
   "count": 10
  },
  {
   "pkg": "node:url",
   "count": 9
  },
  {
   "pkg": "fs",
   "count": 9
  },
  {
   "pkg": "express-rate-limit",
   "count": 6
  },
  {
   "pkg": "nodemailer",
   "count": 5
  },
  {
   "pkg": "qrcode",
   "count": 5
  },
  {
   "pkg": "node:module",
   "count": 4
  },
  {
   "pkg": "node-fetch",
   "count": 4
  },
  {
   "pkg": "jsonwebtoken",
   "count": 4
  },
  {
   "pkg": "axios",
   "count": 3
  }
 ],
 "groups": [
  {
   "id": "infra",
   "label": "Infra / Raiz",
   "tone": "#94a3b8",
   "nodes": 55,
   "clusters": {
    ".": 9,
    "Para o Claude": 3,
    "Para o Claude/memoria": 11,
    "Para o Claude/planos": 7,
    "Para o Claude/skills/genesis-guia-tecnico": 1,
    "Para o Claude/skills/genesis-historico-auditoria": 1,
    "Para o Claude/skills/genesis-spec": 1,
    "backend": 1,
    "deploy": 3,
    "frontend": 6,
    "frontend/en": 4,
    "frontend/site": 8
   }
  },
  {
   "id": "docs",
   "label": "Documentos",
   "tone": "#f59e0b",
   "nodes": 13,
   "clusters": {
    "Mapa Mental": 4,
    "Mapa Mental/Pedidos do fundador": 1,
    ".": 2,
    "docs": 6
   }
  },
  {
   "id": "admin",
   "label": "Super Admin",
   "tone": "#a855f7",
   "nodes": 14,
   "clusters": {
    "admin-frontend": 5,
    "admin-frontend/src": 6,
    "admin-frontend/tests": 3
   }
  },
  {
   "id": "backend-data",
   "label": "Backend - Dados e Testes",
   "tone": "#8f0a11",
   "nodes": 94,
   "clusters": {
    "backend/data": 1,
    "backend/prisma": 5,
    "backend/prisma/migrations/20260905141627_init": 1,
    "backend/prisma/migrations/20260905200000_add_device_keys": 1,
    "backend/prisma/migrations/20260919_add_sale_discount_daily": 1,
    "backend/prisma/migrations/20261003_genesis2": 1,
    "backend/prisma/migrations/20261004_catalogo_mz": 1,
    "backend/prisma/migrations/20261004_despesas": 1,
    "backend/prisma/migrations/20261004_fecho_mes": 1,
    "backend/prisma/migrations/20261004_lista_compras": 1,
    "backend/prisma/migrations/20261004_stock_lotes": 1,
    "backend/prisma/migrations/20261010_icone_sugestoes": 1,
    "backend/prisma/migrations/20261011_auditoria_retencao": 1,
    "backend/prisma/migrations/20261011_horarios_relatorios": 1,
    "backend/prisma/migrations/20261011_turno_dia": 1,
    "backend/prisma/migrations/20261011_vendas_perdidas": 1,
    "backend/prisma/migrations/20261017_idioma": 1,
    "backend/prisma/migrations/20261018_nome_ingles": 1,
    "backend/prisma/migrations/20261025_bloqueio_painel": 1,
    "backend/prisma/migrations/20261025_recibo": 1,
    "backend/prisma/migrations/20261027_impostos_multas": 1,
    "backend/prisma/migrations/20261027_pagamento_misto": 1,
    "backend/prisma/migrations/20261027_perfil_planos": 1,
    "backend/prisma/migrations/20261027_venda_peso": 1,
    "backend/prisma/migrations/20261028_etapa_a": 1,
    "backend/prisma/migrations/20261028_lista_espera": 1,
    "backend/prisma/migrations/20261030_estabelecimentos": 1,
    "backend/prisma/migrations/20261030_localizacao": 1,
    "backend/prisma/migrations/20261030_precos_termos": 1,
    "backend/prisma/migrations/20261030_terminal_guarda": 1,
    "backend/prisma/migrations/20261031_terminal_saida_horario": 1,
    "backend/scripts": 32,
    "backend/tests": 26,
    "backend/prisma/migrations/postgres/0001_init": 1
   }
  },
  {
   "id": "backend",
   "label": "Backend (API)",
   "tone": "#e50914",
   "nodes": 83,
   "clusters": {
    "backend/src": 1,
    "backend/src/middleware": 5,
    "backend/src/routes": 21,
    "backend/src/services": 17,
    "backend/src/utils": 38,
    "backend/src/jobs": 1
   }
  },
  {
   "id": "frontend-pub",
   "label": "Frontend - Config",
   "tone": "#0ea5e9",
   "nodes": 8,
   "clusters": {
    "frontend": 4,
    "frontend/public": 3,
    "frontend/public/site/shots": 1
   }
  },
  {
   "id": "frontend",
   "label": "Frontend (Owner/POS)",
   "tone": "#3b82f6",
   "nodes": 142,
   "clusters": {
    "frontend/scripts": 5,
    "frontend/src": 4,
    "frontend/src/components": 12,
    "frontend/src/components/ui": 11,
    "frontend/src/db": 1,
    "frontend/src/hooks": 1,
    "frontend/src/i18n": 2,
    "frontend/src/i18n/en": 5,
    "frontend/src/layouts": 1,
    "frontend/src/pages": 3,
    "frontend/src/pages/auth": 6,
    "frontend/src/pages/owner": 15,
    "frontend/src/pages/pos": 5,
    "frontend/src/ui": 2,
    "frontend/src/utils": 22,
    "frontend/src/utils/pdf": 4,
    "frontend/tests": 13,
    "frontend/tests/e2e": 30
   }
  },
  {
   "id": "scripts",
   "label": "Automatismos / Scripts",
   "tone": "#22c55e",
   "nodes": 4,
   "clusters": {
    ".": 1,
    "scripts": 3
   }
  }
 ],
 "nodes": [
  {
   "id": "CLAUDE.md",
   "path": "CLAUDE.md",
   "label": "CLAUDE.md",
   "group": "infra",
   "dir": ".",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 127,
   "size": 19065,
   "externals": [
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Guia - aparecer no Google.txt",
   "path": "Guia - aparecer no Google.txt",
   "label": "Guia - aparecer no Google.txt",
   "group": "infra",
   "dir": ".",
   "ext": ".txt",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 45,
   "size": 3188,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Mapa Mental/Mapa_Mental.md",
   "path": "Mapa Mental/Mapa_Mental.md",
   "label": "Mapa_Mental.md",
   "group": "docs",
   "dir": "Mapa Mental",
   "ext": ".md",
   "status": "ok",
   "summary": "Jornal cronologico e inventario do estado do projecto (Parte A: estado actual; Parte B: o que foi feito, quando e por que).",
   "notes": "",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 1372,
   "size": 318027,
   "externals": [
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Mapa Mental/Pedidos do fundador/2026-10-31 - pedido completo (palavras do fundador).txt",
   "path": "Mapa Mental/Pedidos do fundador/2026-10-31 - pedido completo (palavras do fundador).txt",
   "label": "2026-10-31 - pedido completo (palavras do fundador).txt",
   "group": "docs",
   "dir": "Mapa Mental/Pedidos do fundador",
   "ext": ".txt",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 4,
   "size": 83375,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Mapa Mental/Plano 31-10-2026 - corrigir, painel geral e experiencia premium.md",
   "path": "Mapa Mental/Plano 31-10-2026 - corrigir, painel geral e experiencia premium.md",
   "label": "Plano 31-10-2026 - corrigir, painel geral e experiencia premium.md",
   "group": "docs",
   "dir": "Mapa Mental",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 399,
   "size": 26512,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Mapa Mental/mapa_mental_3d.html",
   "path": "Mapa Mental/mapa_mental_3d.html",
   "label": "mapa_mental_3d.html",
   "group": "docs",
   "dir": "Mapa Mental",
   "ext": ".html",
   "status": "ok",
   "summary": "Mapa mental / rede neural 3D do sistema: cada ponto é um ficheiro, cada linha é um import real, agrupado por directoria. Roda, tem zoom, clique, pesquisa, filtro por estado/grupo e tema escuro/claro (claro = azul-piscina).",
   "notes": "Ficheiro independente: abre com duplo-clique, sem servidor, sem internet e sem CDN. Lê os dados de mapa_mental_data.js (ao lado). Validado com 16 verificações automáticas: 144 nós, 182 ligações, 5 planeados, 2 vermelhos. CORRIGIDO 28/09: a barra de estado / legenda não se escondiam e tapavam o mapa — agora escondem-se sozinhas ao fim de 3,5 s sem movimento do rato (qualquer movimento fá-las voltar), e existe um modo limpo permanente com o botão vassoura (topbar) ou a tecla H. Sai-se com o botão flutuante 'Ver controlos' ou outra vez com H. A preferência é guardada em localStorage, tal como o tema; respeita prefers-reduced-motion.",
   "role": "Ferramenta de leitura do código.",
   "security": "",
   "planned": false,
   "lines": 1149,
   "size": 48552,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Mapa Mental/mapa_mental_status.json",
   "path": "Mapa Mental/mapa_mental_status.json",
   "label": "mapa_mental_status.json",
   "group": "docs",
   "dir": "Mapa Mental",
   "ext": ".json",
   "status": "ok",
   "summary": "Mapa curado (este ficheiro): estado, descricao e dependencias por ficheiro. E a fonte de verdade do mapa 3D.",
   "notes": "Editar a mao sempre que um ficheiro nasce, muda de estado ou e planeado.",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 1886,
   "size": 109484,
   "externals": [
    "nodemailer"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/CLAUDE.md",
   "path": "Para o Claude/CLAUDE.md",
   "label": "CLAUDE.md",
   "group": "infra",
   "dir": "Para o Claude",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 127,
   "size": 19065,
   "externals": [
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/COMO MUDAR DE PC.txt",
   "path": "Para o Claude/COMO MUDAR DE PC.txt",
   "label": "COMO MUDAR DE PC.txt",
   "group": "infra",
   "dir": "Para o Claude",
   "ext": ".txt",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 1954,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/MEMORY.md",
   "path": "Para o Claude/memoria/MEMORY.md",
   "label": "MEMORY.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 11,
   "size": 1510,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/autonomous-phase-runs.md",
   "path": "Para o Claude/memoria/autonomous-phase-runs.md",
   "label": "autonomous-phase-runs.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 30,
   "size": 3155,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/commits-on-main.md",
   "path": "Para o Claude/memoria/commits-on-main.md",
   "label": "commits-on-main.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 705,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/foco-pos-puro.md",
   "path": "Para o Claude/memoria/foco-pos-puro.md",
   "label": "foco-pos-puro.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 20,
   "size": 1820,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/git-authorship.md",
   "path": "Para o Claude/memoria/git-authorship.md",
   "label": "git-authorship.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 19,
   "size": 1379,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/lista-e-se.md",
   "path": "Para o Claude/memoria/lista-e-se.md",
   "label": "lista-e-se.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 13,
   "size": 1263,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/plan-fases-12-20-decisoes.md",
   "path": "Para o Claude/memoria/plan-fases-12-20-decisoes.md",
   "label": "plan-fases-12-20-decisoes.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 2807,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/site-contact-number.md",
   "path": "Para o Claude/memoria/site-contact-number.md",
   "label": "site-contact-number.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 17,
   "size": 978,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/site-estilo-e-tom.md",
   "path": "Para o Claude/memoria/site-estilo-e-tom.md",
   "label": "site-estilo-e-tom.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 18,
   "size": 1486,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/subscription-payment-plans.md",
   "path": "Para o Claude/memoria/subscription-payment-plans.md",
   "label": "subscription-payment-plans.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 25,
   "size": 2412,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/memoria/whatsapp-business-number.md",
   "path": "Para o Claude/memoria/whatsapp-business-number.md",
   "label": "whatsapp-business-number.md",
   "group": "infra",
   "dir": "Para o Claude/memoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 17,
   "size": 1144,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/planos/a-malha-entrou-dentro-effervescent-honey.md",
   "path": "Para o Claude/planos/a-malha-entrou-dentro-effervescent-honey.md",
   "label": "a-malha-entrou-dentro-effervescent-honey.md",
   "group": "infra",
   "dir": "Para o Claude/planos",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 220,
   "size": 13115,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/planos/joyful-wibbling-lighthouse.md",
   "path": "Para o Claude/planos/joyful-wibbling-lighthouse.md",
   "label": "joyful-wibbling-lighthouse.md",
   "group": "infra",
   "dir": "Para o Claude/planos",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 289,
   "size": 21945,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/planos/kind-sleeping-squid.md",
   "path": "Para o Claude/planos/kind-sleeping-squid.md",
   "label": "kind-sleeping-squid.md",
   "group": "infra",
   "dir": "Para o Claude/planos",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 291,
   "size": 18240,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/planos/o-meu-site-n-o-gleaming-clock.md",
   "path": "Para o Claude/planos/o-meu-site-n-o-gleaming-clock.md",
   "label": "o-meu-site-n-o-gleaming-clock.md",
   "group": "infra",
   "dir": "Para o Claude/planos",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 138,
   "size": 10741,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/planos/piped-prancing-sloth.md",
   "path": "Para o Claude/planos/piped-prancing-sloth.md",
   "label": "piped-prancing-sloth.md",
   "group": "infra",
   "dir": "Para o Claude/planos",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 197,
   "size": 16767,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/planos/plano-31-10-2026-corrigir-painel-geral.md",
   "path": "Para o Claude/planos/plano-31-10-2026-corrigir-painel-geral.md",
   "label": "plano-31-10-2026-corrigir-painel-geral.md",
   "group": "infra",
   "dir": "Para o Claude/planos",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 399,
   "size": 26512,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/planos/publica-no-genesismz-com-noble-trinket.md",
   "path": "Para o Claude/planos/publica-no-genesismz-com-noble-trinket.md",
   "label": "publica-no-genesismz-com-noble-trinket.md",
   "group": "infra",
   "dir": "Para o Claude/planos",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 391,
   "size": 22479,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/restaurar.mjs",
   "path": "Para o Claude/restaurar.mjs",
   "label": "restaurar.mjs",
   "group": "infra",
   "dir": "Para o Claude",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 39,
   "size": 1853,
   "externals": [
    "node:fs",
    "node:os",
    "node:path",
    "node:url"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/skills/genesis-guia-tecnico/SKILL.md",
   "path": "Para o Claude/skills/genesis-guia-tecnico/SKILL.md",
   "label": "SKILL.md",
   "group": "infra",
   "dir": "Para o Claude/skills/genesis-guia-tecnico",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 429,
   "size": 18336,
   "externals": [
    "react",
    "react-router-dom",
    "qrcode",
    "twilio"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/skills/genesis-historico-auditoria/SKILL.md",
   "path": "Para o Claude/skills/genesis-historico-auditoria/SKILL.md",
   "label": "SKILL.md",
   "group": "infra",
   "dir": "Para o Claude/skills/genesis-historico-auditoria",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 325,
   "size": 19220,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Para o Claude/skills/genesis-spec/SKILL.md",
   "path": "Para o Claude/skills/genesis-spec/SKILL.md",
   "label": "SKILL.md",
   "group": "infra",
   "dir": "Para o Claude/skills/genesis-spec",
   "ext": ".md",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 249,
   "size": 12918,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Plano_a_executar.md",
   "path": "Plano_a_executar.md",
   "label": "Plano_a_executar.md",
   "group": "infra",
   "dir": ".",
   "ext": ".md",
   "status": "partial",
   "summary": "Plano operacional anterior, com passos executados em sessoes passadas.",
   "notes": "Parcialmente absorvido pelo plan.md; candidato a arquivo.",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 246,
   "size": 16559,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "Prompt_Mestre.txt",
   "path": "Prompt_Mestre.txt",
   "label": "Prompt_Mestre.txt",
   "group": "docs",
   "dir": ".",
   "ext": ".txt",
   "status": "ok",
   "summary": "Prompt mestre do fundador: regras, arquitectura, formulas e checklists de validacao.",
   "notes": "",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 2199,
   "size": 114335,
   "externals": [
    "react",
    "react-router-dom",
    "qrcode",
    "twilio"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "admin-frontend/index.html",
   "path": "admin-frontend/index.html",
   "label": "index.html",
   "group": "admin",
   "dir": "admin-frontend",
   "ext": ".html",
   "status": "partial",
   "summary": "Pagina do painel de super admin.",
   "notes": "Falta o script anti-flash do tema e o fundo com os tokens.",
   "role": "HTML.",
   "security": "",
   "planned": false,
   "lines": 15,
   "size": 404,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "admin-frontend/package.json",
   "path": "admin-frontend/package.json",
   "label": "package.json",
   "group": "admin",
   "dir": "admin-frontend",
   "ext": ".json",
   "status": "ok",
   "summary": "Dependencias do painel de super admin (React, React Router, axios, Vite).",
   "notes": "",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 28,
   "size": 638,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "admin-frontend/postcss.config.cjs",
   "path": "admin-frontend/postcss.config.cjs",
   "label": "postcss.config.cjs",
   "group": "admin",
   "dir": "admin-frontend",
   "ext": ".cjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 7,
   "size": 83,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "admin-frontend/src/App.jsx",
   "path": "admin-frontend/src/App.jsx",
   "label": "App.jsx",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Painel de super admin num ficheiro so: login, dashboard de tenants por estado, aprovar/rejeitar, suspender, bloquear, recuperar, eliminar e abrir a conta do owner.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Painel da plataforma.",
   "security": "",
   "planned": false,
   "lines": 710,
   "size": 47620,
   "externals": [
    "react",
    "react-router-dom",
    "axios",
    "lucide-react",
    "@ui",
    "@i18n/react.jsx",
    "@i18n/core.js"
   ],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "admin-frontend/src/accountCard.js",
    "admin-frontend/src/LiveMap.jsx"
   ],
   "usedBy": [
    "admin-frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "admin-frontend/src/LiveMap.jsx",
   "path": "admin-frontend/src/LiveMap.jsx",
   "label": "LiveMap.jsx",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Mapa ao vivo do admin: todos os movimentos (verde/vermelho), turnos e subscricoes; satelite como camada.",
   "notes": "31/10/2026 E1: todos os movimentos ao vivo; satelite recusado pelo Mapbox (429, conta do fundador) -> aviso e volta ao mapa, confirmado em producao.",
   "role": "Etapa C.",
   "security": "",
   "planned": false,
   "lines": 199,
   "size": 12195,
   "externals": [
    "react",
    "axios",
    "lucide-react",
    "@i18n/react.jsx",
    "@ui",
    "mapbox-gl"
   ],
   "dependsOn": [
    "frontend/src/utils/format.js"
   ],
   "usedBy": [
    "admin-frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "admin-frontend/src/accountCard.js",
   "path": "admin-frontend/src/accountCard.js",
   "label": "accountCard.js",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".js",
   "status": "ok",
   "summary": "Cartao da conta criada (imagem PNG/PDF com a marca: dados, senha temporaria, teste ate...) para enviar por WhatsApp.",
   "notes": "30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Admin: entrega da conta ao dono.",
   "security": "",
   "planned": false,
   "lines": 130,
   "size": 4776,
   "externals": [],
   "dependsOn": [
    "frontend/src/ui/marca.js"
   ],
   "usedBy": [
    "admin-frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "admin-frontend/src/i18n_en.js",
   "path": "admin-frontend/src/i18n_en.js",
   "label": "i18n_en.js",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".js",
   "status": "ok",
   "summary": "Ingles do painel super admin.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 244,
   "size": 13614,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "admin-frontend/src/index.css",
   "path": "admin-frontend/src/index.css",
   "label": "index.css",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".css",
   "status": "partial",
   "summary": "Estilo do painel de super admin: cartoes claros, tabelas e badges.",
   "notes": "Conjunto de estilos independente do produto: nao usa os tokens do Genesis nem tem tema claro/escuro.",
   "role": "Estilo.",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 525,
   "externals": [
    "@fontsource-variable/inter",
    "@tokens"
   ],
   "dependsOn": [],
   "usedBy": [
    "admin-frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "admin-frontend/src/main.jsx",
   "path": "admin-frontend/src/main.jsx",
   "label": "main.jsx",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Bootstrap do painel de super admin (React + Router + CSS proprio).",
   "notes": "",
   "role": "Bootstrap.",
   "security": "",
   "planned": false,
   "lines": 11,
   "size": 240,
   "externals": [
    "react",
    "react-dom"
   ],
   "dependsOn": [
    "admin-frontend/src/App.jsx",
    "admin-frontend/src/index.css"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "admin-frontend/tailwind.config.cjs",
   "path": "admin-frontend/tailwind.config.cjs",
   "label": "tailwind.config.cjs",
   "group": "admin",
   "dir": "admin-frontend",
   "ext": ".cjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 8,
   "size": 259,
   "externals": [],
   "dependsOn": [
    "frontend/tailwind.config.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "admin-frontend/tests/admin_flows.mjs",
   "path": "admin-frontend/tests/admin_flows.mjs",
   "label": "admin_flows.mjs",
   "group": "admin",
   "dir": "admin-frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 105,
   "size": 5633,
   "externals": [
    "node:fs",
    "node:path",
    "node:module"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "admin-frontend/tests/fase8_6.mjs",
   "path": "admin-frontend/tests/fase8_6.mjs",
   "label": "fase8_6.mjs",
   "group": "admin",
   "dir": "admin-frontend/tests",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: super admin acrescenta e edita o catalogo-mestre; onboarding recebe.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 106,
   "size": 6177,
   "externals": [
    "node:fs",
    "node:path",
    "node:module"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "admin-frontend/tests/idioma_admin.mjs",
   "path": "admin-frontend/tests/idioma_admin.mjs",
   "label": "idioma_admin.mjs",
   "group": "admin",
   "dir": "admin-frontend/tests",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: painel admin em ingles, nome em ingles no catalogo-mestre, iPhone.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 123,
   "size": 8049,
   "externals": [
    "node:fs",
    "node:path",
    "node:module"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "admin-frontend/vite.config.js",
   "path": "admin-frontend/vite.config.js",
   "label": "vite.config.js",
   "group": "admin",
   "dir": "admin-frontend",
   "ext": ".js",
   "status": "ok",
   "summary": "Configuracao do Vite do painel, com porta propria (5175).",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 32,
   "size": 1106,
   "externals": [
    "node:path",
    "vite",
    "@vitejs/plugin-react"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/data/master_catalogs.json",
   "path": "backend/data/master_catalogs.json",
   "label": "master_catalogs.json",
   "group": "backend-data",
   "dir": "backend/data",
   "ext": ".json",
   "status": "ok",
   "summary": "Catalogo mocambicano: bottle store 43, restaurante 25, mercearia 31, padaria 25, talho 25, supermercado 58.",
   "notes": "Precos sugeridos em MZN com fonte por produto (bazara.co.mz out/2026, noticias, hikersbay) ou \"estimativa — confirmar\". Codigos de barras a null de proposito (nao se inventam EAN). Imagens: Open Food Facts quase nao tem produtos mocambicanos — sem imagens pre-definidas por agora.",
   "role": "Dados.",
   "security": "",
   "planned": false,
   "lines": 1881,
   "size": 49294,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/package.json",
   "path": "backend/package.json",
   "label": "package.json",
   "group": "infra",
   "dir": "backend",
   "ext": ".json",
   "status": "ok",
   "summary": "Dependencias e scripts do backend (Express, Prisma, bcrypt, jsonwebtoken, zod, nodemailer, nodemon).",
   "notes": "",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1132,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/add_indexes.sql",
   "path": "backend/prisma/add_indexes.sql",
   "label": "add_indexes.sql",
   "group": "backend-data",
   "dir": "backend/prisma",
   "ext": ".sql",
   "status": "ok",
   "summary": "Indices de desempenho para consultas frequentes.",
   "notes": "",
   "role": "Desempenho.",
   "security": "",
   "planned": false,
   "lines": 33,
   "size": 1426,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/fix_2026-09-28_colunas.sql",
   "path": "backend/prisma/fix_2026-09-28_colunas.sql",
   "label": "fix_2026-09-28_colunas.sql",
   "group": "backend-data",
   "dir": "backend/prisma",
   "ext": ".sql",
   "status": "ok",
   "summary": "MIGRACAO CIRURGICA de 28/09. Adiciona apenas o que faltava na base de dados: a coluna Tenant.onboarding_completed, as colunas Sale.daily_number e Sale.discount_amount, o indice Sale_tenant_created_idx e a tabela device_keys.",
   "notes": "PORQUE NAO FOI FEITO COM `prisma db push`? O push completo tentava converter varias colunas de uuid para text e o Postgres recusa: 'ERROR: cannot alter type of a column used in a policy definition / DETAIL: policy tenant_isolation_auditlog on table AuditLog depends on column tenant_id'. As politicas de RLS que isolam os dados entre empresas nao podem ser destruidas so por mudar um tipo de coluna. Antes de aplicar, foi verificada a integridade referencial (zero linhas orfas), para o ADD CONSTRAINT nao falhar a meio. Executar com: npx prisma db execute --file prisma/fix_2026-09-28_colunas.sql --schema prisma/schema.prisma",
   "role": "Correccao da base de dados.",
   "security": "So faz ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS. Nunca apaga nem altera dados.",
   "planned": false,
   "lines": 43,
   "size": 2175,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20260905141627_init/migration.sql",
   "path": "backend/prisma/migrations/20260905141627_init/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20260905141627_init",
   "ext": ".sql",
   "status": "ok",
   "summary": "Migracao inicial completa do schema.",
   "notes": "Escrita para SQLite (DATETIME/BOOLEAN): precisa de versao Postgres para producao.",
   "role": "Migracao.",
   "security": "",
   "planned": false,
   "lines": 251,
   "size": 10117,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20260905200000_add_device_keys/migration.sql",
   "path": "backend/prisma/migrations/20260905200000_add_device_keys/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20260905200000_add_device_keys",
   "ext": ".sql",
   "status": "ok",
   "summary": "Migracao que acrescenta as chaves de dispositivo.",
   "notes": "",
   "role": "Migracao.",
   "security": "",
   "planned": false,
   "lines": 18,
   "size": 570,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20260919_add_sale_discount_daily/migration.sql",
   "path": "backend/prisma/migrations/20260919_add_sale_discount_daily/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20260919_add_sale_discount_daily",
   "ext": ".sql",
   "status": "ok",
   "summary": "Migracao que acrescenta discount_amount e daily_number a Sale, mais o indice por tenant/data.",
   "notes": "",
   "role": "Migracao.",
   "security": "",
   "planned": false,
   "lines": 8,
   "size": 365,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261003_genesis2/migration.sql",
   "path": "backend/prisma/migrations/20261003_genesis2/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261003_genesis2",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 1681,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261004_catalogo_mz/migration.sql",
   "path": "backend/prisma/migrations/20261004_catalogo_mz/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261004_catalogo_mz",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 5,
   "size": 281,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261004_despesas/migration.sql",
   "path": "backend/prisma/migrations/20261004_despesas/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261004_despesas",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 27,
   "size": 1311,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261004_fecho_mes/migration.sql",
   "path": "backend/prisma/migrations/20261004_fecho_mes/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261004_fecho_mes",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 7,
   "size": 331,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261004_lista_compras/migration.sql",
   "path": "backend/prisma/migrations/20261004_lista_compras/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261004_lista_compras",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 49,
   "size": 2716,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261004_stock_lotes/migration.sql",
   "path": "backend/prisma/migrations/20261004_stock_lotes/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261004_stock_lotes",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 2329,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261010_icone_sugestoes/migration.sql",
   "path": "backend/prisma/migrations/20261010_icone_sugestoes/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261010_icone_sugestoes",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 38,
   "size": 2059,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261011_auditoria_retencao/migration.sql",
   "path": "backend/prisma/migrations/20261011_auditoria_retencao/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261011_auditoria_retencao",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 11,
   "size": 658,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261011_horarios_relatorios/migration.sql",
   "path": "backend/prisma/migrations/20261011_horarios_relatorios/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261011_horarios_relatorios",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 1013,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261011_turno_dia/migration.sql",
   "path": "backend/prisma/migrations/20261011_turno_dia/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261011_turno_dia",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 5,
   "size": 297,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261011_vendas_perdidas/migration.sql",
   "path": "backend/prisma/migrations/20261011_vendas_perdidas/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261011_vendas_perdidas",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 21,
   "size": 1260,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261017_idioma/migration.sql",
   "path": "backend/prisma/migrations/20261017_idioma/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261017_idioma",
   "ext": ".sql",
   "status": "ok",
   "summary": "User.language TEXT NOT NULL DEFAULT pt + CHECK pt/en (so adicao).",
   "notes": "17/10/2026 Fase 9.3 (publicada 1f1f384): aplicada com db execute; information_schema confirmado.",
   "role": "Migracao.",
   "security": "",
   "planned": false,
   "lines": 7,
   "size": 374,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261018_nome_ingles/migration.sql",
   "path": "backend/prisma/migrations/20261018_nome_ingles/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261018_nome_ingles",
   "ext": ".sql",
   "status": "ok",
   "summary": "MasterCatalog.product_name_en (opcional).",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Migracao.",
   "security": "",
   "planned": false,
   "lines": 6,
   "size": 362,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261025_bloqueio_painel/migration.sql",
   "path": "backend/prisma/migrations/20261025_bloqueio_painel/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261025_bloqueio_painel",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 27,
   "size": 1427,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261025_recibo/migration.sql",
   "path": "backend/prisma/migrations/20261025_recibo/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261025_recibo",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 6,
   "size": 377,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261027_impostos_multas/migration.sql",
   "path": "backend/prisma/migrations/20261027_impostos_multas/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261027_impostos_multas",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 17,
   "size": 1341,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261027_pagamento_misto/migration.sql",
   "path": "backend/prisma/migrations/20261027_pagamento_misto/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261027_pagamento_misto",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 23,
   "size": 1252,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261027_perfil_planos/migration.sql",
   "path": "backend/prisma/migrations/20261027_perfil_planos/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261027_perfil_planos",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 10,
   "size": 737,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261027_venda_peso/migration.sql",
   "path": "backend/prisma/migrations/20261027_venda_peso/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261027_venda_peso",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 7,
   "size": 507,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261028_etapa_a/migration.sql",
   "path": "backend/prisma/migrations/20261028_etapa_a/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261028_etapa_a",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 29,
   "size": 1865,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261028_lista_espera/migration.sql",
   "path": "backend/prisma/migrations/20261028_lista_espera/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261028_lista_espera",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 19,
   "size": 943,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261030_estabelecimentos/migration.sql",
   "path": "backend/prisma/migrations/20261030_estabelecimentos/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261030_estabelecimentos",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 862,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261030_localizacao/migration.sql",
   "path": "backend/prisma/migrations/20261030_localizacao/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261030_localizacao",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 5,
   "size": 291,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261030_precos_termos/migration.sql",
   "path": "backend/prisma/migrations/20261030_precos_termos/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261030_precos_termos",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 8,
   "size": 554,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261030_terminal_guarda/migration.sql",
   "path": "backend/prisma/migrations/20261030_terminal_guarda/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261030_terminal_guarda",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 21,
   "size": 1125,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/migrations/20261031_terminal_saida_horario/migration.sql",
   "path": "backend/prisma/migrations/20261031_terminal_saida_horario/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/20261031_terminal_saida_horario",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 8,
   "size": 528,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/rls_v2.sql",
   "path": "backend/prisma/rls_v2.sql",
   "label": "rls_v2.sql",
   "group": "backend-data",
   "dir": "backend/prisma",
   "ext": ".sql",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 101,
   "size": 5748,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/schema.prisma",
   "path": "backend/prisma/schema.prisma",
   "label": "schema.prisma",
   "group": "backend-data",
   "dir": "backend/prisma",
   "ext": ".prisma",
   "status": "ok",
   "summary": "Schema Prisma completo: Tenant, User, Product, Sale, SaleItem, StockEntry, Employee, Supplier, FixedCost, Debt, DebtPayment, DemandCapture, ShrinkageRecord, ShiftClosing, SaleGoal, AuditLog, DeviceKey, ProductPriceHistory.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Modelo de dados.",
   "security": "",
   "planned": false,
   "lines": 576,
   "size": 20875,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/prisma/migrations/postgres/0001_init/migration.sql"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "backend/prisma/schema.sqlite.prisma",
   "path": "backend/prisma/schema.sqlite.prisma",
   "label": "schema.sqlite.prisma",
   "group": "backend-data",
   "dir": "backend/prisma",
   "ext": ".prisma",
   "status": "ok",
   "summary": "Variante do schema para o SQLite de desenvolvimento local.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Modelo de dados.",
   "security": "",
   "planned": false,
   "lines": 593,
   "size": 21757,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/add_cancel_pin_column.js",
   "path": "backend/scripts/add_cancel_pin_column.js",
   "label": "add_cancel_pin_column.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Acrescenta a coluna do PIN de cancelamento.",
   "notes": "",
   "role": "Migracao pontual.",
   "security": "",
   "planned": false,
   "lines": 19,
   "size": 507,
   "externals": [
    "dotenv",
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/apply_master_en.js",
   "path": "backend/scripts/apply_master_en.js",
   "label": "apply_master_en.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Preenche MasterCatalog.product_name_en com a proposta (a seco por defeito).",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Script.",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 1855,
   "externals": [
    "dotenv"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/scripts/master_catalog_en.json"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "backend/scripts/apply_sql.js",
   "path": "backend/scripts/apply_sql.js",
   "label": "apply_sql.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Aplica migracoes aditivas instrucao a instrucao (o prisma db execute prende no pooler).",
   "notes": "",
   "role": "Migracoes.",
   "security": "",
   "planned": false,
   "lines": 44,
   "size": 1916,
   "externals": [
    "dotenv",
    "path",
    "fs",
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/backup_db.js",
   "path": "backend/scripts/backup_db.js",
   "label": "backup_db.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Copia JSON.gz de todas as tabelas antes de migrar (sem pg_dump).",
   "notes": "",
   "role": "Copias de seguranca.",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 2242,
   "externals": [
    "dotenv",
    "path",
    "fs",
    "os",
    "zlib",
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/check_mail.js",
   "path": "backend/scripts/check_mail.js",
   "label": "check_mail.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Verificação do SMTP em 4 passos: configuração lida do .env, nodemailer instalado, ligação real ao servidor e envio de um email de recuperação para o endereço indicado.",
   "notes": "Uso: node scripts/check_mail.js --to omeu@email.com. Ainda em AVISO porque MAIL_USER/MAIL_PASS estão vazios à espera da senha de aplicativo do fundador.",
   "role": "Diagnóstico de e-mail.",
   "security": "",
   "planned": false,
   "lines": 118,
   "size": 4375,
   "externals": [
    "path",
    "dotenv",
    "nodemailer"
   ],
   "dependsOn": [
    "backend/src/utils/mailer.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/configurar_email.js",
   "path": "backend/scripts/configurar_email.js",
   "label": "configurar_email.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 69,
   "size": 3562,
   "externals": [
    "fs",
    "readline",
    "nodemailer"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/create_owner_user.js",
   "path": "backend/scripts/create_owner_user.js",
   "label": "create_owner_user.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Cria/actualiza o utilizador dono de demonstracao.",
   "notes": "",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1217,
   "externals": [
    "dotenv",
    "@prisma/client",
    "bcrypt"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/create_system_user.js",
   "path": "backend/scripts/create_system_user.js",
   "label": "create_system_user.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Cria o utilizador de sistema (super admin).",
   "notes": "",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 28,
   "size": 796,
   "externals": [
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/create_test_tenant.js",
   "path": "backend/scripts/create_test_tenant.js",
   "label": "create_test_tenant.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Cria um tenant de teste completo.",
   "notes": "",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 9,
   "size": 668,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/e2e_admin_fixture.js",
   "path": "backend/scripts/e2e_admin_fixture.js",
   "label": "e2e_admin_fixture.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "",
   "notes": "11/10/2026: limpa produtos de teste do catalogo-mestre.",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 35,
   "size": 2296,
   "externals": [
    "dotenv",
    "fs",
    "crypto",
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/e2e_fixture.js",
   "path": "backend/scripts/e2e_fixture.js",
   "label": "e2e_fixture.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 166,
   "size": 12606,
   "externals": [
    "dotenv",
    "fs",
    "crypto",
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/e2e_test.js",
   "path": "backend/scripts/e2e_test.js",
   "label": "e2e_test.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Fluxo E2E geral: onboarding, login, produto, venda, cancelamento e stock.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 154,
   "size": 5353,
   "externals": [
    "dotenv",
    "node-fetch",
    "@prisma/client",
    "bcrypt"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/ensure_device_keys.js",
   "path": "backend/scripts/ensure_device_keys.js",
   "label": "ensure_device_keys.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Garante que a chave de dispositivo de teste existe.",
   "notes": "",
   "role": "Apoio.",
   "security": "",
   "planned": false,
   "lines": 23,
   "size": 1223,
   "externals": [
    "dotenv"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/gerir_contas.js",
   "path": "backend/scripts/gerir_contas.js",
   "label": "gerir_contas.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Gestao de contas e senhas pela linha de comando: lista todas as contas com papel, estado e loja; permite verificar se uma senha bate certo, definir uma senha nova, gerar uma senha forte, repor a senha do .env e activar/desactivar contas. Modo --list|--verificar|--definir para automacao.",
   "notes": "As senhas do Genesis estao em BCRYPT custo 12 (bcrypt.hash(password, 12)), um hash de sentido UNICO: nao existe forma de o reverter nem de listar as senhas guardadas. O script faz o unico possivel — testar, definir ou gerar. Exige no minimo 8 caracteres com minusculas, maiusculas, numeros e simbolos (o mesmo minimo que o resetPasswordSchema aceita). A listagem e instantanea; a identificacao de a que conta pertence cada senha do .env e a opcao 7 e demora alguns segundos (~50 comparacoes bcrypt), por isso NAO corre de arranque.",
   "role": "Ferramenta de administracao.",
   "security": "As senhas nunca sao escritas no ecra (mascara de asteriscos com raw mode) e o hash nunca e impresso por inteiro, so o prefixo $2b$12$. Cada alteracao e registada em AuditLog como PASSWORD_CHANGED_VIA_SCRIPT e o script volta a ler a base de dados para provar que gravou.",
   "planned": false,
   "lines": 459,
   "size": 20113,
   "externals": [
    "dotenv",
    "crypto",
    "bcrypt",
    "readline"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/limpar_fechos_teste_kleyton.js",
   "path": "backend/scripts/limpar_fechos_teste_kleyton.js",
   "label": "limpar_fechos_teste_kleyton.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Limpeza unica dos fechos de teste da loja do Kleyton (pedido do fundador 10/10).",
   "notes": "Usado uma vez a 10/10/2026.",
   "role": "Scripts.",
   "security": "",
   "planned": false,
   "lines": 49,
   "size": 3285,
   "externals": [
    "dotenv",
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/limpar_teste.js",
   "path": "backend/scripts/limpar_teste.js",
   "label": "limpar_teste.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 33,
   "size": 2431,
   "externals": [
    "dotenv"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/master_catalog_en.json",
   "path": "backend/scripts/master_catalog_en.json",
   "label": "master_catalog_en.json",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".json",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 148,
   "size": 6853,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/apply_master_en.js"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "backend/scripts/restore_owner_password.js",
   "path": "backend/scripts/restore_owner_password.js",
   "label": "restore_owner_password.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Repoe a password do dono (apoio a testes locais).",
   "notes": "",
   "role": "Apoio.",
   "security": "Ferramenta de operacao: correr apenas em ambiente controlado.",
   "planned": false,
   "lines": 34,
   "size": 1237,
   "externals": [
    "dotenv",
    "bcrypt",
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/rls_validation.js",
   "path": "backend/scripts/rls_validation.js",
   "label": "rls_validation.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Valida o isolamento por tenant com SQL directo.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 53,
   "size": 2708,
   "externals": [
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/rls_validation_with_role.js",
   "path": "backend/scripts/rls_validation_with_role.js",
   "label": "rls_validation_with_role.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Valida o isolamento por tenant assumindo uma role especifica.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 71,
   "size": 3326,
   "externals": [
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/run_checks.js",
   "path": "backend/scripts/run_checks.js",
   "label": "run_checks.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Harness: sobe o backend numa porta livre com SQLite, corre os testes E2E (auth, fecho de turno) e a verificação de SMTP, e depois mata o servidor.",
   "notes": "Uso: node scripts/run_checks.js [--port=4020]. Não deixa processos pendurados.",
   "role": "Automatismo de testes.",
   "security": "",
   "planned": false,
   "lines": 120,
   "size": 4528,
   "externals": [
    "child_process",
    "path",
    "net",
    "http"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/run_phase0.sh",
   "path": "backend/scripts/run_phase0.sh",
   "label": "run_phase0.sh",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".sh",
   "status": "ok",
   "summary": "Script de apoio a Fase 0 (verificacoes de seguranca).",
   "notes": "",
   "role": "Automatismo.",
   "security": "",
   "planned": false,
   "lines": 88,
   "size": 4523,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/seed_admin.js",
   "path": "backend/scripts/seed_admin.js",
   "label": "seed_admin.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Semeia a conta de super admin.",
   "notes": "",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1032,
   "externals": [
    "dotenv",
    "@prisma/client",
    "bcrypt"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/seed_demo.js",
   "path": "backend/scripts/seed_demo.js",
   "label": "seed_demo.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Semeia a loja de demonstracao.",
   "notes": "",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 153,
   "size": 6420,
   "externals": [
    "dotenv",
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/seed_master_catalogs.js",
   "path": "backend/scripts/seed_master_catalogs.js",
   "label": "seed_master_catalogs.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Carrega data/master_catalogs.json para a tabela MasterCatalog.",
   "notes": "Reescrito 04/10: usa o cliente do projecto (nao new PrismaClient), so insere o que falta, nunca apaga. 207 inseridos; 2.a execucao = 0 (idempotente).",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 45,
   "size": 2119,
   "externals": [
    "dotenv",
    "path"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/shift_closing_e2e.js",
   "path": "backend/scripts/shift_closing_e2e.js",
   "label": "shift_closing_e2e.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Teste E2E do fecho de turno contra o servidor a correr.",
   "notes": "",
   "role": "Teste.",
   "security": "Prova que o caixista recebe 403, que contar abaixo do esperado e recusado sem gravar nada, que expected_amount forjado nao ilude a validacao e que a tentativa falhada fica em auditoria.",
   "planned": false,
   "lines": 210,
   "size": 9425,
   "externals": [
    "dotenv",
    "node-fetch",
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/dbEngine2.js",
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "backend/scripts/smoke_boot.js",
   "path": "backend/scripts/smoke_boot.js",
   "label": "smoke_boot.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Verificacao rapida de arranque do backend.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 44,
   "size": 1756,
   "externals": [
    "dotenv",
    "child_process"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/smoke_tests.js",
   "path": "backend/scripts/smoke_tests.js",
   "label": "smoke_tests.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Bateria de smoke tests: relatorios, folha salarial e alertas.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 101,
   "size": 5188,
   "externals": [
    "dotenv",
    "@prisma/client",
    "bcrypt",
    "node-fetch"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/test_auth.js",
   "path": "backend/scripts/test_auth.js",
   "label": "test_auth.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Teste E2E das rotas de autenticacao, incluindo o login Google bloqueado sem configuracao.",
   "notes": "",
   "role": "Teste.",
   "security": "Verifica que /reset-password-instant devolve 404 (a porta dos fundos ficou mesmo fechada).",
   "planned": false,
   "lines": 79,
   "size": 3738,
   "externals": [
    "dotenv"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/test_google.js",
   "path": "backend/scripts/test_google.js",
   "label": "test_google.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Teste do fluxo de login com Google.",
   "notes": "Falha enquanto GOOGLE_CLIENT_ID e as origens autorizadas nao estiverem configurados.",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 197,
   "size": 7291,
   "externals": [
    "crypto"
   ],
   "dependsOn": [
    "backend/src/routes/auth.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/scripts/test_login.js",
   "path": "backend/scripts/test_login.js",
   "label": "test_login.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Teste simples de login.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 58,
   "size": 2391,
   "externals": [
    "dotenv",
    "fs",
    "os",
    "path"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/scripts/verify_system.js",
   "path": "backend/scripts/verify_system.js",
   "label": "verify_system.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 2879,
   "size": 255551,
   "externals": [
    "dotenv",
    "crypto",
    "bcrypt",
    "path",
    "url",
    "module",
    "jsonwebtoken",
    "@prisma/client"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tokens.js",
    "backend/src/utils/fefo.js",
    "backend/src/services/expiryJob.js",
    "backend/src/services/auditRetention.js",
    "backend/src/utils/auditGroups.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/services/reportJob.js",
    "backend/src/services/notifications.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/services/overview.js",
    "backend/src/utils/shift.js",
    "backend/src/utils/catalogSuggestions.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 13
  },
  {
   "id": "backend/src/index.js",
   "path": "backend/src/index.js",
   "label": "index.js",
   "group": "backend",
   "dir": "backend/src",
   "ext": ".js",
   "status": "ok",
   "summary": "Arranque do servidor Express: CORS, cookies, JSON, montagem de todas as rotas e guardas de arranque (JWT_SECRET, DATABASE_URL).",
   "notes": "11/10/2026 Fase 8.7: fuso de Maputo (TZ) no arranque; arranca reportJob (desligado por defeito).",
   "role": "Ponto de entrada do backend.",
   "security": "CORRIGIDO 28/09: o handler global de erros ja nao devolve `details` ao cliente (enviava nomes de tabelas/colunas e o host da BD a qualquer pessoa) e respeita headersSent para nao tentar escrever um segundo 500. Passa a logar `[erro] <METODO> <rota>` com a stack completa no servidor.",
   "planned": false,
   "lines": 304,
   "size": 12213,
   "externals": [
    "dotenv",
    "express",
    "cors",
    "cookie-parser",
    "bcrypt",
    "helmet"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/products.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/demand_captures.js",
    "backend/src/routes/shrinkage_records.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/middleware/adminOriginCheck.js",
    "backend/src/routes/refresh.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/profile.js",
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/verify.js",
    "backend/src/routes/guard.js",
    "backend/src/routes/establishments.js",
    "backend/src/utils/http.js",
    "backend/src/routes/onboarding.js",
    "backend/src/routes/waitlist.js",
    "backend/src/services/expiryJob.js",
    "backend/src/services/auditRetention.js",
    "backend/src/services/reportJob.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 30
  },
  {
   "id": "backend/src/middleware/adminOriginCheck.js",
   "path": "backend/src/middleware/adminOriginCheck.js",
   "label": "adminOriginCheck.js",
   "group": "backend",
   "dir": "backend/src/middleware",
   "ext": ".js",
   "status": "ok",
   "summary": "Restringe as rotas de super admin as origens declaradas em ADMIN_ORIGINS.",
   "notes": "",
   "role": "Autorizacao.",
   "security": "Separacao fisica do painel admin da plataforma.",
   "planned": false,
   "lines": 37,
   "size": 1497,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "backend/src/middleware/auth.js",
   "path": "backend/src/middleware/auth.js",
   "label": "auth.js",
   "group": "backend",
   "dir": "backend/src/middleware",
   "ext": ".js",
   "status": "ok",
   "summary": "Autenticacao + estabelecimento activo; nunca prende o dono; 409 com dois separadores; encerrado = so leitura.",
   "notes": "31/10/2026 E1: verify_system 47, 51.",
   "role": "Autenticacao.",
   "security": "",
   "planned": false,
   "lines": 126,
   "size": 6870,
   "externals": [
    "jsonwebtoken"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/sessionScopes.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/panelLock.js",
    "backend/src/utils/actingTenant.js"
   ],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/guard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/onboarding.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/products.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js"
   ],
   "inbound": 16,
   "outbound": 6
  },
  {
   "id": "backend/src/middleware/posWriteAuth.js",
   "path": "backend/src/middleware/posWriteAuth.js",
   "label": "posWriteAuth.js",
   "group": "backend",
   "dir": "backend/src/middleware",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2428,
   "externals": [],
   "dependsOn": [
    "backend/src/middleware/auth.js",
    "backend/src/middleware/terminalAuth.js",
    "backend/src/utils/tokens.js",
    "backend/src/utils/terminals.js",
    "backend/src/utils/sessionUser.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "backend/src/middleware/rbac.js",
   "path": "backend/src/middleware/rbac.js",
   "label": "rbac.js",
   "group": "backend",
   "dir": "backend/src/middleware",
   "ext": ".js",
   "status": "ok",
   "summary": "requireRole(...roles): guarda de perfil (super_admin, owner, cashier).",
   "notes": "",
   "role": "Autorizacao.",
   "security": "",
   "planned": false,
   "lines": 13,
   "size": 587,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/guard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/onboarding.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/products.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js"
   ],
   "inbound": 14,
   "outbound": 0
  },
  {
   "id": "backend/src/middleware/terminalAuth.js",
   "path": "backend/src/middleware/terminalAuth.js",
   "label": "terminalAuth.js",
   "group": "backend",
   "dir": "backend/src/middleware",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 27,
   "size": 1510,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/terminals.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/pos.js"
   ],
   "inbound": 2,
   "outbound": 3
  },
  {
   "id": "backend/src/routes/admin.js",
   "path": "backend/src/routes/admin.js",
   "label": "admin.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Super admin: pedidos, aprovar/rejeitar, tenants, suspender/bloquear/recuperar/eliminar, impersonate e auditoria.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "API da plataforma.",
   "security": "requireRole('super_admin') + adminOriginCheck.",
   "planned": false,
   "lines": 431,
   "size": 28696,
   "externals": [
    "express",
    "bcrypt",
    "crypto",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/supportCodes.js",
    "backend/src/utils/productIcons.js",
    "backend/src/utils/catalogSuggestions.js",
    "backend/src/utils/lostRequests.js",
    "backend/src/services/plans.js",
    "backend/src/utils/businessTypes.js",
    "backend/src/utils/liveBus.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 12
  },
  {
   "id": "backend/src/routes/auth.js",
   "path": "backend/src/routes/auth.js",
   "label": "auth.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Login, Google, recuperar senha, pedido de conta (18+ e Termos), suporte.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Autenticacao.",
   "security": "A rota /reset-password-instant foi REMOVIDA a 26/09. Sem codigo valido nao ha troca de senha. Rate limit no login, no pedido e na reposicao; resposta generica para nao revelar contas existentes. CORRIGIDO 28/09: conta sem password_hash devolve 401 NO_PASSWORD (antes bcrypt.compare(pass, null) lancava e dava 500).",
   "planned": false,
   "lines": 695,
   "size": 29180,
   "externals": [
    "express",
    "bcrypt",
    "zod",
    "express-rate-limit",
    "crypto"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/services/passwordResetStore.js",
    "backend/src/utils/whatsapp.js",
    "backend/src/utils/mailer.js",
    "backend/src/utils/lang.js",
    "backend/src/utils/tokens.js",
    "backend/src/utils/panelLock.js",
    "backend/src/utils/ownerSelf.js",
    "backend/src/utils/actingTenant.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/supportCodes.js",
    "backend/src/utils/audit.js",
    "backend/src/middleware/auth.js",
    "backend/src/utils/businessTypes.js"
   ],
   "usedBy": [
    "backend/scripts/test_google.js",
    "backend/src/index.js"
   ],
   "inbound": 2,
   "outbound": 14
  },
  {
   "id": "backend/src/routes/catalogs.js",
   "path": "backend/src/routes/catalogs.js",
   "label": "catalogs.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Catalogo pre-definido por tipo de negocio (GET publico) e importacao para a loja no fim do onboarding.",
   "notes": "10/10/2026 Fase 8.2: verify_system 20 (32/32) + fase8_2.mjs no browser (dono no PC e iPhone 390 px, super admin). Fase 1 (2.1): fonte unica = tabela MasterCatalog (templates no codigo removidos); aceita barcode e image_url; codigo repetido -> 400 DUPLICATE_BARCODE; erro de validacao diz o produto e o campo (INVALID_CATALOG). 04/10/2026: onboarding.mjs 18/18 no browser + import invalido devolve 400 com produto e campo.",
   "role": "Onboarding.",
   "security": "",
   "planned": false,
   "lines": 142,
   "size": 7487,
   "externals": [
    "crypto",
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/productImage.js",
    "backend/src/utils/catalogSuggestions.js",
    "backend/src/utils/productIcons.js",
    "backend/src/utils/businessTypes.js"
   ],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/routes/onboarding.js"
   ],
   "inbound": 2,
   "outbound": 8
  },
  {
   "id": "backend/src/routes/dashboard.js",
   "path": "backend/src/routes/dashboard.js",
   "label": "dashboard.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "partial",
   "summary": "Metricas agregadas para o painel do dono.",
   "notes": "Sem prova funcional recente registada.",
   "role": "Leitura.",
   "security": "",
   "planned": false,
   "lines": 171,
   "size": 5722,
   "externals": [
    "express"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "backend/src/routes/demand_captures.js",
   "path": "backend/src/routes/demand_captures.js",
   "label": "demand_captures.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Vendas perdidas: produto da loja ou texto livre, quantidade, preco opcional (centavos); idempotente; auditado.",
   "notes": "11/10/2026 Fase 8.4: verify_system 23 (25/25).",
   "role": "Inteligencia comercial.",
   "security": "",
   "planned": false,
   "lines": 90,
   "size": 4109,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tenantRls.js",
    "backend/src/utils/http.js",
    "backend/src/utils/catalogSuggestions.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "backend/src/routes/establishments.js",
   "path": "backend/src/routes/establishments.js",
   "label": "establishments.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Estabelecimentos: criar (id do aparelho, 30 dias de teste), trocar, voltar a casa, copiar catalogo, encerrar/apagar/reabrir.",
   "notes": "31/10/2026 E1: verify_system 47, 49, 51.",
   "role": "Etapa D.",
   "security": "",
   "planned": false,
   "lines": 276,
   "size": 18605,
   "externals": [
    "express",
    "zod",
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/tokens.js",
    "backend/src/utils/actingTenant.js",
    "backend/src/utils/ownerSelf.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/businessTypes.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 11
  },
  {
   "id": "backend/src/routes/guard.js",
   "path": "backend/src/routes/guard.js",
   "label": "guard.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Terminal do guarda: ler o recibo e marcar conferido uma vez; repetido = vermelho e rastreio.",
   "notes": "30/10/2026 Etapa B: verify_system 43 22/22, guarda.mjs 8/8, guard.test.js 3/3.",
   "role": "Antifraude a saida.",
   "security": "",
   "planned": false,
   "lines": 108,
   "size": 6397,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/units.js"
   ],
   "usedBy": [
    "backend/src/index.js",
    "backend/tests/guard.test.js"
   ],
   "inbound": 2,
   "outbound": 7
  },
  {
   "id": "backend/src/routes/inventory.js",
   "path": "backend/src/routes/inventory.js",
   "label": "inventory.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Fornecedores e compras de stock: POST /stock aceita varias validades (lots[]) numa transaccao, auditoria STOCK_ENTRY.",
   "notes": "11/10/2026: auditoria STOCK_ENTRY guarda tambem o preco de compra novo. verify_system 22 + fase8_5.mjs.",
   "role": "Stock.",
   "security": "",
   "planned": false,
   "lines": 223,
   "size": 9628,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/units.js",
    "backend/src/utils/liveBus.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/stockLots.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "backend/src/routes/onboarding.js",
   "path": "backend/src/routes/onboarding.js",
   "label": "onboarding.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Configurar o estabelecimento numa so operacao (tudo ou nada).",
   "notes": "31/10/2026 E1: verify_system 48 14/14.",
   "role": "Repetir nao duplica renda/equipa.",
   "security": "",
   "planned": false,
   "lines": 85,
   "size": 5500,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/businessTypes.js",
    "backend/src/routes/catalogs.js",
    "backend/src/utils/hours.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "backend/src/routes/owner.js",
   "path": "backend/src/routes/owner.js",
   "label": "owner.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Painel do dono; auditoria com nomes e artigos da venda.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Dono.",
   "security": "",
   "planned": false,
   "lines": 626,
   "size": 36609,
   "externals": [
    "express",
    "crypto",
    "bcrypt",
    "zod",
    "express-rate-limit"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/whatsapp.js",
    "backend/src/utils/lang.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/services/notifications.js",
    "backend/src/services/overview.js",
    "backend/src/services/reports.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/terminals.js",
    "backend/src/services/monthClose.js",
    "backend/src/utils/auditGroups.js",
    "backend/src/utils/units.js",
    "backend/src/utils/liveBus.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 19
  },
  {
   "id": "backend/src/routes/panelLock.js",
   "path": "backend/src/routes/panelLock.js",
   "label": "panelLock.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Bloqueio do painel + «Esqueci o PIN» (senha da conta).",
   "notes": "31/10/2026 E1: conta da pessoa (ownerSelf); verify_system 46.",
   "role": "API do bloqueio do painel.",
   "security": "",
   "planned": false,
   "lines": 243,
   "size": 13341,
   "externals": [
    "express",
    "bcrypt",
    "zod",
    "@simplewebauthn/server"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/tokens.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/panelLock.js",
    "backend/src/utils/ownerSelf.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 8
  },
  {
   "id": "backend/src/routes/pos.js",
   "path": "backend/src/routes/pos.js",
   "label": "pos.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Terminal: emparelhar, perfis, PIN, turno, vendas com PIN do dono, 2.a via.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Terminal POS.",
   "security": "Abrir turno e ver vendas exigem o PIN de autorizacao do dono (falhas gravadas e limitadas).",
   "planned": false,
   "lines": 188,
   "size": 13427,
   "externals": [
    "express",
    "bcrypt",
    "zod",
    "express-rate-limit"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/liveBus.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/middleware/terminalAuth.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/tokens.js",
    "backend/src/utils/terminals.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/shift.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/tenantStatus.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 13
  },
  {
   "id": "backend/src/routes/products.js",
   "path": "backend/src/routes/products.js",
   "label": "products.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Produtos: lista, criar (icone, varias validades, fornecedor opcional, sugestao ao admin), editar, lotes com validade, ajuste de stock auditado.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Catalogo.",
   "security": "",
   "planned": false,
   "lines": 398,
   "size": 20523,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/units.js",
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/productImage.js",
    "backend/src/utils/stockLots.js",
    "backend/src/utils/productIcons.js",
    "backend/src/utils/masterNames.js",
    "backend/src/utils/catalogSuggestions.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 9
  },
  {
   "id": "backend/src/routes/profile.js",
   "path": "backend/src/routes/profile.js",
   "label": "profile.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Perfil do dono (Fase 16): senha, e-mail com 2 codigos, WhatsApp dos alertas, aniversario/presente. E-mail unico em todo o Genesis (cliente de sistema so para saber se existe).",
   "notes": "30/10/2026: em producao a mudanca de e-mail dava 500 (corrigido em utils/http.js).",
   "role": "Perfil.",
   "security": "",
   "planned": false,
   "lines": 186,
   "size": 11841,
   "externals": [
    "express",
    "bcrypt",
    "crypto",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/tokens.js",
    "backend/src/utils/panelLock.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/mailer.js",
    "backend/src/utils/lang.js",
    "backend/src/utils/shiftDay.js",
    "backend/src/services/plans.js",
    "backend/src/utils/ownerSelf.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 13
  },
  {
   "id": "backend/src/routes/refresh.js",
   "path": "backend/src/routes/refresh.js",
   "label": "refresh.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Rota auxiliar de renovacao de dados do cliente.",
   "notes": "",
   "role": "Sincronizacao.",
   "security": "",
   "planned": false,
   "lines": 58,
   "size": 2514,
   "externals": [
    "express"
   ],
   "dependsOn": [
    "backend/src/utils/tokens.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/actingTenant.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "backend/src/routes/sales.js",
   "path": "backend/src/routes/sales.js",
   "label": "sales.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Venda transaccional: valida stock, calcula totais em centavos, gera daily_number sequencial por dia, idempotencia por id e auditoria. Turno fechado = 409 SHIFT_CLOSED; GET recusado ao caixista (lista so com PIN do dono em /api/pos/sales).",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou. | 30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Nucleo do POS.",
   "security": "",
   "planned": false,
   "lines": 605,
   "size": 31154,
   "externals": [
    "express",
    "zod",
    "bcrypt",
    "express-rate-limit",
    "crypto"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/shift.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/tenantRls.js",
    "backend/src/utils/paymentMethods.js",
    "backend/src/utils/stockLots.js",
    "backend/src/services/tax.js",
    "backend/src/utils/salePayments.js",
    "backend/src/utils/units.js",
    "backend/src/utils/liveBus.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 12
  },
  {
   "id": "backend/src/routes/settings.js",
   "path": "backend/src/routes/settings.js",
   "label": "settings.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Definicoes da loja, custos fixos e despesas avulsas.",
   "notes": "11/10/2026 Fase 8.7: PUT /report-schedule + report_schedule no GET. verify_system 26. | 30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 384,
   "size": 22863,
   "externals": [
    "express",
    "bcrypt",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/ownerSelf.js",
    "backend/src/utils/hours.js",
    "backend/src/utils/tenantHours.js",
    "backend/src/utils/liveBus.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/services/tax.js",
    "backend/src/services/monthlyDeductions.js",
    "backend/src/utils/geo.js",
    "backend/src/utils/auditGroups.js",
    "backend/src/services/reportJob.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 14
  },
  {
   "id": "backend/src/routes/shoppingLists.js",
   "path": "backend/src/routes/shoppingLists.js",
   "label": "shoppingLists.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Lista de compras: sugestao, CRUD, estado, link WhatsApp.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Compras.",
   "security": "",
   "planned": false,
   "lines": 164,
   "size": 9185,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/services/reports.js",
    "backend/src/services/shoppingList.js",
    "backend/src/utils/lang.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 8
  },
  {
   "id": "backend/src/routes/shrinkage_records.js",
   "path": "backend/src/routes/shrinkage_records.js",
   "label": "shrinkage_records.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Registo de perdas/quebras com baixa de stock e auditoria.",
   "notes": "",
   "role": "Controlo de perdas.",
   "security": "",
   "planned": false,
   "lines": 111,
   "size": 5015,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/units.js",
    "backend/src/utils/liveBus.js",
    "backend/src/utils/tenantRls.js",
    "backend/src/utils/stockLots.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "backend/src/routes/verify.js",
   "path": "backend/src/routes/verify.js",
   "label": "verify.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "GET /api/verify/:saleId publico: confirma que o recibo existe e se a venda continua valida (concluida/cancelada).",
   "notes": "09/10/2026 (Fase 7.2): verify_system 19 (8/8) + flows.mjs no browser (QR = /verify/<id>, comparado pixel a pixel; pagina publica abre sem sessao).",
   "role": "QR de autenticidade do recibo.",
   "security": "So devolve o que ja esta impresso no recibo (sem custos, sem caixista, sem ids internos); UUID validado (400); 60 pedidos/IP/15 min; Cache-Control no-store e noindex.",
   "planned": false,
   "lines": 58,
   "size": 2412,
   "externals": [
    "express",
    "express-rate-limit"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/http.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "backend/src/routes/waitlist.js",
   "path": "backend/src/routes/waitlist.js",
   "label": "waitlist.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "POST publico /api/waitlist: «Avise-me quando estiver pronto» dos modos de negocio ainda por construir (nome, WhatsApp, e-mail opcional, canal). Grava em ModeWaitlist pelo cliente de sistema.",
   "notes": "30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Lista de espera dos modos futuros (restaurante, hotel, farmacia...).",
   "security": "Tabela sem tenant_id: RLS ligada e sem politica para genesis_app (o papel da aplicacao nao ve nada); so o admin le.",
   "planned": false,
   "lines": 41,
   "size": 2218,
   "externals": [
    "express",
    "express-rate-limit",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/http.js",
    "backend/src/utils/businessTypes.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "backend/src/services/auditRetention.js",
   "path": "backend/src/services/auditRetention.js",
   "label": "auditRetention.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Apaga a auditoria mais antiga que a retencao de cada loja (minimo 2 meses), nunca as accoes protegidas nem as do admin.",
   "notes": "11/10/2026 Fase 8.5: verify_system 24; contagem a seco nas lojas reais = 0.",
   "role": "Job (6 em 6 h).",
   "security": "",
   "planned": false,
   "lines": 62,
   "size": 2906,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/auditGroups.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/index.js"
   ],
   "inbound": 2,
   "outbound": 2
  },
  {
   "id": "backend/src/services/expiryJob.js",
   "path": "backend/src/services/expiryJob.js",
   "label": "expiryJob.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Perda automatica de lotes vencidos (de hora a hora, idempotente, por loja com RLS).",
   "notes": "04/10/2026: verify_system 14 27/27; completo 160/160; e2e stock 3/3.",
   "role": "Stock e validades.",
   "security": "",
   "planned": false,
   "lines": 87,
   "size": 4470,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/fefo.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/index.js"
   ],
   "inbound": 2,
   "outbound": 2
  },
  {
   "id": "backend/src/services/monthClose.js",
   "path": "backend/src/services/monthClose.js",
   "label": "monthClose.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Puro: quando mostrar o fecho do mes anterior.",
   "notes": "04/10/2026: 6/6 testes; verify_system 18 15/15.",
   "role": "Fecho do mes.",
   "security": "",
   "planned": false,
   "lines": 22,
   "size": 1164,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/owner.js",
    "backend/tests/monthClose.test.js"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "backend/src/services/monthlyDeductions.js",
   "path": "backend/src/services/monthlyDeductions.js",
   "label": "monthlyDeductions.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Deducoes mensais (salarios, custos fixos) que entram no lucro liquido real.",
   "notes": "04/10/2026 Fase 5.1: total_expenses; 8/8 testes.",
   "role": "Financeiro.",
   "security": "",
   "planned": false,
   "lines": 77,
   "size": 2973,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/settings.js",
    "backend/src/services/reports.js",
    "backend/tests/monthlyDeductions.test.js",
    "backend/src/services/report.service.js"
   ],
   "inbound": 4,
   "outbound": 0
  },
  {
   "id": "backend/src/services/notifications.js",
   "path": "backend/src/services/notifications.js",
   "label": "notifications.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Notificacoes do sino do dono, calculadas na leitura: stock (3 niveis), validades, chenecas 7/1/0, fecho de turno, caixista bloqueado, meta, fecho do dia.",
   "notes": "18/10/2026 Fase 10.1 (sino do dono): notifications.test 7/7; verify_system 31 23/23; sino.mjs 12/12; regressao idioma_dono 35/35 e flows 40/40. Publicado 9cb2e61 (18/10): sino.mjs 12/12 no site.",
   "role": "Operacoes.",
   "security": "",
   "planned": false,
   "lines": 152,
   "size": 9837,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/utils/hours.js",
    "backend/src/utils/tenantHours.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/fefo.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/routes/owner.js",
    "backend/tests/notifications.test.js"
   ],
   "inbound": 3,
   "outbound": 7
  },
  {
   "id": "backend/src/services/overview.js",
   "path": "backend/src/services/overview.js",
   "label": "overview.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Visao geral do dono num pedido: hoje vs ontem a mesma hora, meta, turno de cada caixista, ultimas vendas.",
   "notes": "25/10 Fase 13: verify_system 33 21/21; overview.test 5/5.",
   "role": "Inicio do dono.",
   "security": "",
   "planned": false,
   "lines": 111,
   "size": 7100,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/utils/hours.js",
    "backend/src/utils/tenantHours.js",
    "backend/src/utils/shift.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/fefo.js",
    "backend/src/utils/units.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/routes/owner.js",
    "backend/tests/overview.test.js"
   ],
   "inbound": 3,
   "outbound": 8
  },
  {
   "id": "backend/src/services/passwordResetStore.js",
   "path": "backend/src/services/passwordResetStore.js",
   "label": "passwordResetStore.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Guarda o HASH do codigo de 6 digitos: expira em 15 min, max 5 tentativas, comparacao em tempo constante.",
   "notes": "",
   "role": "Seguranca do reset.",
   "security": "O codigo nunca fica guardado em claro.",
   "planned": false,
   "lines": 81,
   "size": 2413,
   "externals": [
    "crypto"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/auth.js"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "backend/src/services/plans.js",
   "path": "backend/src/services/plans.js",
   "label": "plans.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 82,
   "size": 4030,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/shiftDay.js"
   ],
   "usedBy": [
    "backend/src/routes/admin.js",
    "backend/src/routes/profile.js",
    "backend/tests/plans.test.js"
   ],
   "inbound": 3,
   "outbound": 1
  },
  {
   "id": "backend/src/services/ranking.js",
   "path": "backend/src/services/ranking.js",
   "label": "ranking.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Ranking por niveis dos relatorios (empates partilham o lugar, ate 3 niveis, sem o nivel mais baixo).",
   "notes": "10/10/2026 Fase 8.1: fase8_1.mjs 32/32 no Chromium (descarga no PC, partilha emulada em tablet/iPhone, 0 janelas novas); reports.mjs OK. iPhone real por confirmar.",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 23,
   "size": 1110,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/services/reports.js",
    "backend/tests/ranking.test.js"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "backend/src/services/reportJob.js",
   "path": "backend/src/services/reportJob.js",
   "label": "reportJob.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Envio programado dos relatorios por WhatsApp; DESLIGADO sem REPORTS_WHATSAPP=true.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Job (5 em 5 min).",
   "security": "",
   "planned": false,
   "lines": 63,
   "size": 3678,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/services/reportSchedule.js",
    "backend/src/services/reports.js",
    "backend/src/utils/whatsapp.js",
    "backend/src/services/shoppingList.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/index.js",
    "backend/src/routes/settings.js"
   ],
   "inbound": 3,
   "outbound": 5
  },
  {
   "id": "backend/src/services/reportSchedule.js",
   "path": "backend/src/services/reportSchedule.js",
   "label": "reportSchedule.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Puro: que relatorio toca (diario/semanal/mensal) e de que periodo, pelo calendario de Maputo; mensagem do WhatsApp.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Relatorios por WhatsApp.",
   "security": "",
   "planned": false,
   "lines": 90,
   "size": 5384,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/fefo.js",
    "backend/src/utils/lang.js"
   ],
   "usedBy": [
    "backend/src/services/reportJob.js",
    "backend/tests/reportSchedule.test.js",
    "backend/tests/serverLang.test.js"
   ],
   "inbound": 3,
   "outbound": 2
  },
  {
   "id": "backend/src/services/reports.js",
   "path": "backend/src/services/reports.js",
   "label": "reports.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Relatorios diario/semanal/mensal, rastreio (timeline), metas 12 meses.",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 511,
   "size": 35529,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/utils/hours.js",
    "backend/src/utils/tenantHours.js",
    "backend/src/services/monthlyDeductions.js",
    "backend/src/services/tax.js",
    "backend/src/services/restock.js",
    "backend/src/services/ranking.js",
    "backend/src/utils/lostRequests.js",
    "backend/src/utils/salePayments.js",
    "backend/src/utils/units.js",
    "backend/src/utils/shift.js"
   ],
   "usedBy": [
    "backend/src/routes/owner.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/services/reportJob.js"
   ],
   "inbound": 3,
   "outbound": 12
  },
  {
   "id": "backend/src/services/restock.js",
   "path": "backend/src/services/restock.js",
   "label": "restock.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Recomendacao de restock pura: ritmo x dias + procura perdida - stock; nao reforcar.",
   "notes": "04/10/2026 Fase 4: verify_system 194/194; e2e reports/flows/pos/stock OK.",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 48,
   "size": 2348,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/units.js"
   ],
   "usedBy": [
    "backend/src/services/reports.js",
    "backend/tests/restock.test.js"
   ],
   "inbound": 2,
   "outbound": 1
  },
  {
   "id": "backend/src/services/shoppingList.js",
   "path": "backend/src/services/shoppingList.js",
   "label": "shoppingList.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Puro: totais, telefone +258, mensagem e link wa.me.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Compras.",
   "security": "",
   "planned": false,
   "lines": 45,
   "size": 2183,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/lang.js",
    "backend/src/utils/units.js"
   ],
   "usedBy": [
    "backend/src/routes/shoppingLists.js",
    "backend/src/services/reportJob.js",
    "backend/tests/serverLang.test.js",
    "backend/tests/shoppingList.test.js"
   ],
   "inbound": 4,
   "outbound": 2
  },
  {
   "id": "backend/src/services/tax.js",
   "path": "backend/src/services/tax.js",
   "label": "tax.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 94,
   "size": 4511,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/units.js"
   ],
   "usedBy": [
    "backend/src/routes/sales.js",
    "backend/src/routes/settings.js",
    "backend/src/services/reports.js",
    "backend/tests/tax.test.js"
   ],
   "inbound": 4,
   "outbound": 1
  },
  {
   "id": "backend/src/services/tenantAlerts.js",
   "path": "backend/src/services/tenantAlerts.js",
   "label": "tenantAlerts.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Alertas: stock baixo e validades por lote (X dias configuraveis).",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Operacoes.",
   "security": "",
   "planned": false,
   "lines": 71,
   "size": 3244,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/units.js",
    "backend/src/utils/fefo.js",
    "backend/src/utils/lang.js"
   ],
   "usedBy": [
    "backend/src/routes/owner.js",
    "backend/src/services/notifications.js",
    "backend/tests/serverLang.test.js",
    "backend/src/jobs/dailyDigest.js"
   ],
   "inbound": 4,
   "outbound": 4
  },
  {
   "id": "backend/src/utils/actingTenant.js",
   "path": "backend/src/utils/actingTenant.js",
   "label": "actingTenant.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Estabelecimento activo do dono, validado em cada pedido.",
   "notes": "30/10/2026 Etapa D: verify_system 45 23/23, etapaD.mjs 6/6.",
   "role": "Etapa D.",
   "security": "",
   "planned": false,
   "lines": 55,
   "size": 2823,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/middleware/auth.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/refresh.js"
   ],
   "inbound": 4,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/audit.js",
   "path": "backend/src/utils/audit.js",
   "label": "audit.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 32,
   "size": 1154,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/routes/admin.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/guard.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/ownerSelf.js",
    "backend/src/utils/shift.js"
   ],
   "inbound": 12,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/auditGroups.js",
   "path": "backend/src/utils/auditGroups.js",
   "label": "auditGroups.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Puro: tipos da auditoria, periodos de Maputo (hoje/semana/mes), corte da retencao, accoes protegidas.",
   "notes": "11/10/2026 Fase 8.5: auditGroups.test.js 3/3.",
   "role": "Auditoria do dono.",
   "security": "",
   "planned": false,
   "lines": 70,
   "size": 4614,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/fefo.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/settings.js",
    "backend/src/services/auditRetention.js",
    "backend/tests/auditGroups.test.js"
   ],
   "inbound": 5,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/authPin.js",
   "path": "backend/src/utils/authPin.js",
   "label": "authPin.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Verificacao unica do PIN de autorizacao do dono no terminal; limite partilhado de 5 falhas/loja/15 min.",
   "notes": "09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser.",
   "role": "Seguranca do balcao.",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 1946,
   "externals": [
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/http.js"
   ],
   "usedBy": [
    "backend/src/routes/pos.js",
    "backend/src/routes/sales.js"
   ],
   "inbound": 2,
   "outbound": 3
  },
  {
   "id": "backend/src/utils/businessTypes.js",
   "path": "backend/src/utils/businessTypes.js",
   "label": "businessTypes.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Lista unica dos tipos de negocio (com icone) e quais ja tem modo proprio; os outros ficam «Brevemente».",
   "notes": "30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Tipos separados no pedido de conta e no onboarding.",
   "security": "",
   "planned": false,
   "lines": 28,
   "size": 1459,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/admin.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/onboarding.js",
    "backend/src/routes/waitlist.js"
   ],
   "inbound": 6,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/catalogSuggestions.js",
   "path": "backend/src/utils/catalogSuggestions.js",
   "label": "catalogSuggestions.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Produtos criados fora do catalogo-mestre -> sugestoes ao super admin (agrupadas, sem nomes de lojas).",
   "notes": "10/10/2026 Fase 8.2: verify_system 20 (32/32) + fase8_2.mjs no browser (dono no PC e iPhone 390 px, super admin).",
   "role": "Catalogo-mestre.",
   "security": "",
   "planned": false,
   "lines": 73,
   "size": 3531,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/demand_captures.js",
    "backend/src/routes/products.js",
    "backend/src/utils/lostRequests.js",
    "backend/src/utils/masterNames.js",
    "backend/tests/catalogSuggestions.test.js"
   ],
   "inbound": 8,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/dbEngine2.js",
   "path": "backend/src/utils/dbEngine2.js",
   "label": "dbEngine2.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Deteccao de provedor resiliente: aceita SQLite local e Postgres/Supabase sem rebentar no arranque.",
   "notes": "Escrito a 26/09 para desbloquear o 'servidor offline'. 03/10: a sondagem do Postgres passa a tentar 3 vezes antes de cair para SQLite (uma unica falha de rede mandava o servidor para outra base, com esquema antigo e sem as lojas reais). Provado: arranque real com 1.a tentativa falhada e 2.a OK -> postgresql.",
   "role": "Infra de dados.",
   "security": "Com DB_ALLOW_SQLITE_FALLBACK=true no .env o servidor ainda pode cair para a SQLite local se as 3 tentativas falharem; recomendado false.",
   "planned": false,
   "lines": 165,
   "size": 6483,
   "externals": [
    "path",
    "fs",
    "child_process",
    "net",
    "pg"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/shift_closing_e2e.js",
    "backend/src/utils/prisma.js"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/fefo.js",
   "path": "backend/src/utils/fefo.js",
   "label": "fefo.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "FEFO puro: ordem de saida dos lotes, validade em hora de Maputo.",
   "notes": "04/10/2026: verify_system 14 27/27; completo 160/160; e2e stock 3/3.",
   "role": "Stock e validades.",
   "security": "",
   "planned": false,
   "lines": 47,
   "size": 2066,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/services/expiryJob.js",
    "backend/src/services/notifications.js",
    "backend/src/services/overview.js",
    "backend/src/services/reportSchedule.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/utils/auditGroups.js",
    "backend/src/utils/shiftDay.js",
    "backend/src/utils/stockLots.js",
    "backend/tests/fefo.test.js"
   ],
   "inbound": 10,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/geo.js",
   "path": "backend/src/utils/geo.js",
   "label": "geo.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Link do Google Maps ou coordenadas -> ponto do estabelecimento.",
   "notes": "30/10/2026 Etapa C: verify_system 44 14/14, etapaC.mjs 9/9, geo/liveBus testes 8/8.",
   "role": "Etapa C.",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2026,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/settings.js",
    "backend/tests/geo.test.js"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/hours.js",
   "path": "backend/src/utils/hours.js",
   "label": "hours.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Horario a serio: por dia, 24 h, depois da meia-noite, pausas, feriados, dia de vendas.",
   "notes": "31/10/2026 E1: tests/hours.test.js 8/8; verify_system 50.",
   "role": "Pedido do fundador: «e se for 24/24?».",
   "security": "",
   "planned": false,
   "lines": 156,
   "size": 8368,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/onboarding.js",
    "backend/src/routes/settings.js",
    "backend/src/services/notifications.js",
    "backend/src/services/overview.js",
    "backend/src/services/reports.js",
    "backend/src/utils/tenantHours.js",
    "backend/tests/hours.test.js"
   ],
   "inbound": 7,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/http.js",
   "path": "backend/src/utils/http.js",
   "label": "http.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "httpError/asyncHandler/errorHandler. 30/10: um 5xx criado de proposito (ex.: 503 e-mails nao configurados) mostra a mensagem e o codigo; falhas inesperadas continuam com «Erro interno do servidor».",
   "notes": "30/10/2026: defeito visto no genesismz.com (Perfil > Mudar o e-mail dava «Erro interno do servidor»); http.test.js 3/3.",
   "role": "Erros HTTP de todas as rotas.",
   "security": "Nada do erro inesperado sai para o cliente (tests/http.test.js).",
   "planned": false,
   "lines": 43,
   "size": 2102,
   "externals": [
    "zod"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/demand_captures.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/guard.js",
    "backend/src/routes/onboarding.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/routes/verify.js",
    "backend/src/routes/waitlist.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/salePayments.js",
    "backend/src/utils/shift.js",
    "backend/tests/http.test.js"
   ],
   "inbound": 19,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/lang.js",
   "path": "backend/src/utils/lang.js",
   "label": "lang.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Lingua das mensagens que o servidor escreve para fora (WhatsApp, email): tr(lang, texto), X-Genesis-Lang.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 71,
   "size": 4883,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/auth.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/services/reportSchedule.js",
    "backend/src/services/shoppingList.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/utils/mailer.js",
    "backend/tests/serverLang.test.js"
   ],
   "inbound": 9,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/liveBus.js",
   "path": "backend/src/utils/liveBus.js",
   "label": "liveBus.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Eventos ao vivo (SSE) por loja; cada cliente isolado.",
   "notes": "30/10/2026 Etapa C: verify_system 44 14/14, etapaC.mjs 9/9, geo/liveBus testes 8/8.",
   "role": "Etapa C.",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1670,
   "externals": [
    "events"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/admin.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shrinkage_records.js",
    "backend/src/utils/shift.js",
    "backend/tests/liveBus.test.js"
   ],
   "inbound": 9,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/lostRequests.js",
   "path": "backend/src/utils/lostRequests.js",
   "label": "lostRequests.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Puro: agrupa vendas perdidas para o dono (unidades, valor estimado) e para o admin (lojas, pedidos, preco indicado; sem nomes de lojas).",
   "notes": "11/10/2026 Fase 8.4: lostRequests.test.js 3/3.",
   "role": "Relatorios / admin.",
   "security": "",
   "planned": false,
   "lines": 69,
   "size": 3238,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/catalogSuggestions.js"
   ],
   "usedBy": [
    "backend/src/routes/admin.js",
    "backend/src/services/reports.js",
    "backend/tests/lostRequests.test.js"
   ],
   "inbound": 3,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/mailer.js",
   "path": "backend/src/utils/mailer.js",
   "label": "mailer.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Envio de emails por SMTP Gmail (App Password). sendPasswordResetEmail entrega o codigo de 6 digitos. require('nodemailer') e lazy, dentro de try/catch.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Entrega do codigo de recuperacao.",
   "security": "Nunca deita o backend abaixo se faltar o nodemailer.",
   "planned": false,
   "lines": 143,
   "size": 5616,
   "externals": [
    "nodemailer"
   ],
   "dependsOn": [
    "backend/src/utils/lang.js"
   ],
   "usedBy": [
    "backend/scripts/check_mail.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/profile.js",
    "backend/tests/serverLang.test.js",
    "backend/src/jobs/dailyDigest.js"
   ],
   "inbound": 5,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/masterNames.js",
   "path": "backend/src/utils/masterNames.js",
   "label": "masterNames.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "name_en dos produtos da loja juntado na leitura pelo nome do catalogo-mestre (pesquisa bilingue).",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Catalogo.",
   "security": "",
   "planned": false,
   "lines": 33,
   "size": 1502,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/catalogSuggestions.js"
   ],
   "usedBy": [
    "backend/src/routes/products.js",
    "backend/tests/masterNames.test.js"
   ],
   "inbound": 2,
   "outbound": 2
  },
  {
   "id": "backend/src/utils/ownerSelf.js",
   "path": "backend/src/utils/ownerSelf.js",
   "label": "ownerSelf.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "A conta do dono (PIN, senha, lingua, Face ID) lida no estabelecimento de casa.",
   "notes": "31/10/2026 E1: verify_system 46 20/20.",
   "role": "Correccao do PIN «que nao existe» no 2.o estabelecimento.",
   "security": "",
   "planned": false,
   "lines": 35,
   "size": 1759,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/audit.js"
   ],
   "usedBy": [
    "backend/src/routes/auth.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/settings.js"
   ],
   "inbound": 5,
   "outbound": 2
  },
  {
   "id": "backend/src/utils/panelLock.js",
   "path": "backend/src/utils/panelLock.js",
   "label": "panelLock.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Bloqueio do painel do dono: cookie de sessao genesis_unlock (JWT 5 min deslizante, pv + versao do PIN); 423 PANEL_LOCKED.",
   "notes": "25/10/2026 Fase 12: verify_system 32 28/28.",
   "role": "Seguranca do painel do dono.",
   "security": "",
   "planned": false,
   "lines": 62,
   "size": 2800,
   "externals": [
    "crypto",
    "jsonwebtoken"
   ],
   "dependsOn": [
    "backend/src/utils/tokens.js"
   ],
   "usedBy": [
    "backend/src/middleware/auth.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/profile.js"
   ],
   "inbound": 4,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/paymentMethods.js",
   "path": "backend/src/utils/paymentMethods.js",
   "label": "paymentMethods.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Normaliza payment_method: cash, mpesa, emola, card (+ mobile_money antigo).",
   "notes": "04/10: paymentMethods.test.js 4/4.",
   "role": "Dominio de vendas.",
   "security": "",
   "planned": false,
   "lines": 50,
   "size": 1762,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/sales.js",
    "backend/src/utils/salePayments.js",
    "backend/tests/paymentMethods.test.js"
   ],
   "inbound": 3,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/peopleNames.js",
   "path": "backend/src/utils/peopleNames.js",
   "label": "peopleNames.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Nomes de quem vendeu/registou lidos a parte (sem include de User).",
   "notes": "31/10/2026 E1: verify_system 47.",
   "role": "Rastreio e custos do 2.o estabelecimento sem 500.",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 2122,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/routes/guard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/sales.js",
    "backend/src/services/notifications.js",
    "backend/src/services/overview.js",
    "backend/src/services/reports.js"
   ],
   "inbound": 7,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/prisma.js",
   "path": "backend/src/utils/prisma.js",
   "label": "prisma.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "partial",
   "summary": "Cliente Prisma unico (singleton) partilhado por todo o backend.",
   "notes": "03/10: acrescenta connect_timeout=30 e pool_timeout=30 aos URLs (o Prisma desistia aos 5 s / 10 s a partir de Maputo). CORRIGIDO 28/09: o proxy preguiçoso devolvia uma FUNCAO para tudo enquanto o cliente nao estava pronto, e `prisma.user.findUnique` ficava undefined (TypeError -> 500 opaco em qualquer rota que tocasse na BD antes do arranque). Agora cada acesso e adiado por um Proxy recursivo, que so vai buscar o model delegate no momento da chamada.",
   "role": "Acesso a base de dados.",
   "security": "",
   "planned": false,
   "lines": 189,
   "size": 8538,
   "externals": [
    "@prisma/client",
    "async_hooks"
   ],
   "dependsOn": [
    "backend/src/utils/dbEngine2.js"
   ],
   "usedBy": [
    "backend/scripts/apply_master_en.js",
    "backend/scripts/create_system_user.js",
    "backend/scripts/create_test_tenant.js",
    "backend/scripts/e2e_admin_fixture.js",
    "backend/scripts/e2e_fixture.js",
    "backend/scripts/ensure_device_keys.js",
    "backend/scripts/gerir_contas.js",
    "backend/scripts/limpar_teste.js",
    "backend/scripts/seed_demo.js",
    "backend/scripts/seed_master_catalogs.js",
    "backend/scripts/shift_closing_e2e.js",
    "backend/scripts/verify_system.js",
    "backend/src/index.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/terminalAuth.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/demand_captures.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/guard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/onboarding.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/products.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/routes/shrinkage_records.js",
    "backend/src/routes/verify.js",
    "backend/src/routes/waitlist.js",
    "backend/src/services/auditRetention.js",
    "backend/src/services/expiryJob.js",
    "backend/src/services/notifications.js",
    "backend/src/services/overview.js",
    "backend/src/services/reportJob.js",
    "backend/src/services/reports.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/utils/actingTenant.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/masterNames.js",
    "backend/src/utils/ownerSelf.js",
    "backend/src/utils/peopleNames.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/shift.js",
    "backend/src/utils/tenantHours.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/terminals.js",
    "backend/src/services/report.service.js"
   ],
   "inbound": 54,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/productIcons.js",
   "path": "backend/src/utils/productIcons.js",
   "label": "productIcons.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Lista de icones que o dono pode escolher (validacao no servidor).",
   "notes": "10/10/2026 Fase 8.2: verify_system 20 (32/32) + fase8_2.mjs no browser (dono no PC e iPhone 390 px, super admin).",
   "role": "Produtos.",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 769,
   "externals": [
    "zod"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/admin.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/products.js"
   ],
   "inbound": 3,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/productImage.js",
   "path": "backend/src/utils/productImage.js",
   "label": "productImage.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Regra unica de imagem de produto (https ou data:image, < 60 000 car.).",
   "notes": "04/10/2026: pos.mjs 21/21 + flows.mjs 24/24 no browser.",
   "role": "Validacao.",
   "security": "",
   "planned": false,
   "lines": 15,
   "size": 588,
   "externals": [
    "zod"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/catalogs.js",
    "backend/src/routes/products.js"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/salePayments.js",
   "path": "backend/src/utils/salePayments.js",
   "label": "salePayments.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 49,
   "size": 2683,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/paymentMethods.js",
    "backend/src/utils/http.js"
   ],
   "usedBy": [
    "backend/src/routes/sales.js",
    "backend/src/services/reports.js",
    "backend/tests/salePayments.test.js"
   ],
   "inbound": 3,
   "outbound": 2
  },
  {
   "id": "backend/src/utils/sessionScopes.js",
   "path": "backend/src/utils/sessionScopes.js",
   "label": "sessionScopes.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Listas fechadas de rotas por ambito de sessao (terminal, suporte).",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Seguranca.",
   "security": "",
   "planned": false,
   "lines": 51,
   "size": 2312,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/middleware/auth.js"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/sessionUser.js",
   "path": "backend/src/utils/sessionUser.js",
   "label": "sessionUser.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 55,
   "size": 2438,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tokens.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/refresh.js"
   ],
   "inbound": 10,
   "outbound": 2
  },
  {
   "id": "backend/src/utils/shift.js",
   "path": "backend/src/utils/shift.js",
   "label": "shift.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Fecho cego: esperado = dinheiro desde o inicio do turno; turno por dia; resumo depois de aceite.",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou.",
   "role": "Turno / fecho cego.",
   "security": "",
   "planned": false,
   "lines": 144,
   "size": 8173,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/liveBus.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/http.js",
    "backend/src/utils/shiftDay.js"
   ],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/sales.js",
    "backend/src/services/overview.js",
    "backend/src/services/reports.js"
   ],
   "inbound": 5,
   "outbound": 6
  },
  {
   "id": "backend/src/utils/shiftDay.js",
   "path": "backend/src/utils/shiftDay.js",
   "label": "shiftDay.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Regra pura do turno por dia: um fecho por dia de Maputo, abre sozinho no dia seguinte, turno 24/24 conta no dia em que comecou.",
   "notes": "10/10/2026 Fase 8.3-A (turno por dia): shiftDay.test 8/8; verify_system 2-21 334/334; flows.mjs no browser.",
   "role": "Turno / fecho cego.",
   "security": "",
   "planned": false,
   "lines": 43,
   "size": 2353,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/fefo.js"
   ],
   "usedBy": [
    "backend/src/routes/profile.js",
    "backend/src/services/plans.js",
    "backend/src/utils/shift.js",
    "backend/tests/shiftDay.test.js"
   ],
   "inbound": 4,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/shiftLock.js",
   "path": "backend/src/utils/shiftLock.js",
   "label": "shiftLock.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Bloqueio do perfil do caixista apos MAX_ATTEMPTS falhas no fecho cego.",
   "notes": "",
   "role": "Controlo do fecho de turno.",
   "security": "",
   "planned": false,
   "lines": 38,
   "size": 1259,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/sales.js",
    "backend/src/services/notifications.js",
    "backend/src/services/overview.js",
    "backend/src/utils/shift.js"
   ],
   "inbound": 7,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/stockLots.js",
   "path": "backend/src/utils/stockLots.js",
   "label": "stockLots.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Lotes dentro da transaccao: addLot e consumeLots (FEFO com guarda atomica).",
   "notes": "04/10/2026: verify_system 14 27/27; completo 160/160; e2e stock 3/3.",
   "role": "Stock e validades.",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2022,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/fefo.js"
   ],
   "usedBy": [
    "backend/src/routes/inventory.js",
    "backend/src/routes/products.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/shrinkage_records.js"
   ],
   "inbound": 4,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/supportCodes.js",
   "path": "backend/src/utils/supportCodes.js",
   "label": "supportCodes.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 27,
   "size": 1125,
   "externals": [
    "crypto"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/admin.js",
    "backend/src/routes/auth.js"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/tenantHours.js",
   "path": "backend/src/utils/tenantHours.js",
   "label": "tenantHours.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Horario de cada estabelecimento com cache curta por tenant.",
   "notes": "31/10/2026 E1: verify_system 50.",
   "role": "Relatorios, Inicio e avisos usam o dia de vendas.",
   "security": "",
   "planned": false,
   "lines": 25,
   "size": 1024,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/hours.js"
   ],
   "usedBy": [
    "backend/src/routes/settings.js",
    "backend/src/services/notifications.js",
    "backend/src/services/overview.js",
    "backend/src/services/reports.js"
   ],
   "inbound": 4,
   "outbound": 2
  },
  {
   "id": "backend/src/utils/tenantRls.js",
   "path": "backend/src/utils/tenantRls.js",
   "label": "tenantRls.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Isolamento por tenant fail-closed: em Postgres aplica set_config('app.tenant_id'); em SQLite usa o caminho local.",
   "notes": "",
   "role": "Seguranca multi-tenant.",
   "security": "Fail-closed: aborta em vez de servir dados sem isolamento.",
   "planned": false,
   "lines": 29,
   "size": 1276,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/demand_captures.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/shrinkage_records.js"
   ],
   "inbound": 3,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/tenantStatus.js",
   "path": "backend/src/utils/tenantStatus.js",
   "label": "tenantStatus.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 97,
   "size": 4280,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/middleware/auth.js",
    "backend/src/middleware/terminalAuth.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/refresh.js"
   ],
   "inbound": 6,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/terminals.js",
   "path": "backend/src/utils/terminals.js",
   "label": "terminals.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 99,
   "size": 4925,
   "externals": [
    "crypto"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/middleware/terminalAuth.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js"
   ],
   "inbound": 4,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/tokens.js",
   "path": "backend/src/utils/tokens.js",
   "label": "tokens.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 88,
   "size": 3327,
   "externals": [
    "crypto",
    "jsonwebtoken"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/establishments.js",
    "backend/src/routes/panelLock.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/profile.js",
    "backend/src/routes/refresh.js",
    "backend/src/utils/panelLock.js",
    "backend/src/utils/sessionUser.js"
   ],
   "inbound": 10,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/units.js",
   "path": "backend/src/utils/units.js",
   "label": "units.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 32,
   "size": 1461,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/guard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/products.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/shrinkage_records.js",
    "backend/src/services/overview.js",
    "backend/src/services/reports.js",
    "backend/src/services/restock.js",
    "backend/src/services/shoppingList.js",
    "backend/src/services/tax.js",
    "backend/src/services/tenantAlerts.js",
    "backend/tests/units.test.js",
    "frontend/tests/units.test.mjs"
   ],
   "inbound": 14,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/whatsapp.js",
   "path": "backend/src/utils/whatsapp.js",
   "label": "whatsapp.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "partial",
   "summary": "Alertas por WhatsApp (Twilio) com degradacao suave quando nao ha credenciais.",
   "notes": "Twilio nao configurado: devolve skipped.",
   "role": "Canal alternativo do codigo.",
   "security": "",
   "planned": false,
   "lines": 48,
   "size": 1879,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/auth.js",
    "backend/src/routes/owner.js",
    "backend/src/services/reportJob.js",
    "backend/src/jobs/dailyDigest.js"
   ],
   "inbound": 4,
   "outbound": 0
  },
  {
   "id": "backend/tests/auditGroups.test.js",
   "path": "backend/tests/auditGroups.test.js",
   "label": "auditGroups.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 2776,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/auditGroups.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/catalogSuggestions.test.js",
   "path": "backend/tests/catalogSuggestions.test.js",
   "label": "catalogSuggestions.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Testes das sugestoes (3).",
   "notes": "10/10/2026 Fase 8.2: verify_system 20 (32/32) + fase8_2.mjs no browser (dono no PC e iPhone 390 px, super admin).",
   "role": "Testes.",
   "security": "",
   "planned": false,
   "lines": 25,
   "size": 1753,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/catalogSuggestions.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/fefo.test.js",
   "path": "backend/tests/fefo.test.js",
   "label": "fefo.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 48,
   "size": 2411,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/fefo.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/geo.test.js",
   "path": "backend/tests/geo.test.js",
   "label": "geo.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 2008,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/geo.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/guard.test.js",
   "path": "backend/tests/guard.test.js",
   "label": "guard.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 24,
   "size": 969,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/routes/guard.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/hours.test.js",
   "path": "backend/tests/hours.test.js",
   "label": "hours.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Testes do horario (24 h, por dia, bar 18h-04h, feriados, recusas).",
   "notes": "31/10/2026 E1: 8/8.",
   "role": "Prova do horario.",
   "security": "",
   "planned": false,
   "lines": 89,
   "size": 5414,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/hours.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/http.test.js",
   "path": "backend/tests/http.test.js",
   "label": "http.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 1637,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/http.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/liveBus.test.js",
   "path": "backend/tests/liveBus.test.js",
   "label": "liveBus.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 51,
   "size": 2338,
   "externals": [
    "node:test",
    "node:assert",
    "node:events"
   ],
   "dependsOn": [
    "backend/src/utils/liveBus.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/lostRequests.test.js",
   "path": "backend/tests/lostRequests.test.js",
   "label": "lostRequests.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 2745,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/lostRequests.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/masterNames.test.js",
   "path": "backend/tests/masterNames.test.js",
   "label": "masterNames.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Teste: so produtos com o nome do catalogo-mestre recebem name_en.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Teste unitario.",
   "security": "",
   "planned": false,
   "lines": 21,
   "size": 976,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/masterNames.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/monthClose.test.js",
   "path": "backend/tests/monthClose.test.js",
   "label": "monthClose.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 1640,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/monthClose.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/monthlyDeductions.test.js",
   "path": "backend/tests/monthlyDeductions.test.js",
   "label": "monthlyDeductions.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Testes das deducoes mensais usadas no lucro liquido.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 126,
   "size": 5206,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/monthlyDeductions.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/notifications.test.js",
   "path": "backend/tests/notifications.test.js",
   "label": "notifications.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 111,
   "size": 7076,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/notifications.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/overview.test.js",
   "path": "backend/tests/overview.test.js",
   "label": "overview.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 26,
   "size": 1637,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/overview.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/paymentMethods.test.js",
   "path": "backend/tests/paymentMethods.test.js",
   "label": "paymentMethods.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 24,
   "size": 953,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/paymentMethods.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/plans.test.js",
   "path": "backend/tests/plans.test.js",
   "label": "plans.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 63,
   "size": 3451,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/plans.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/ranking.test.js",
   "path": "backend/tests/ranking.test.js",
   "label": "ranking.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Testes do ranking por niveis (6).",
   "notes": "10/10/2026 Fase 8.1: fase8_1.mjs 32/32 no Chromium (descarga no PC, partilha emulada em tablet/iPhone, 0 janelas novas); reports.mjs OK. iPhone real por confirmar.",
   "role": "Testes.",
   "security": "",
   "planned": false,
   "lines": 35,
   "size": 1456,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/ranking.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/reportSchedule.test.js",
   "path": "backend/tests/reportSchedule.test.js",
   "label": "reportSchedule.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 72,
   "size": 3975,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/reportSchedule.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/restock.test.js",
   "path": "backend/tests/restock.test.js",
   "label": "restock.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 49,
   "size": 2369,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/restock.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/salePayments.test.js",
   "path": "backend/tests/salePayments.test.js",
   "label": "salePayments.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2963,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/salePayments.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/serverLang.test.js",
   "path": "backend/tests/serverLang.test.js",
   "label": "serverLang.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Teste: mensagens do servidor em PT (iguais) e EN; cobertura de tr().",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Teste unitario.",
   "security": "",
   "planned": false,
   "lines": 85,
   "size": 4959,
   "externals": [
    "node:test",
    "node:assert",
    "node:fs",
    "node:path"
   ],
   "dependsOn": [
    "backend/src/utils/lang.js",
    "backend/src/services/shoppingList.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/services/reportSchedule.js",
    "backend/src/utils/mailer.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 5
  },
  {
   "id": "backend/tests/shiftDay.test.js",
   "path": "backend/tests/shiftDay.test.js",
   "label": "shiftDay.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Testes do turno por dia (8).",
   "notes": "10/10/2026 Fase 8.3-A (turno por dia): shiftDay.test 8/8; verify_system 2-21 334/334; flows.mjs no browser.",
   "role": "Testes.",
   "security": "",
   "planned": false,
   "lines": 64,
   "size": 3640,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/shiftDay.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/shoppingList.test.js",
   "path": "backend/tests/shoppingList.test.js",
   "label": "shoppingList.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 33,
   "size": 1659,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/shoppingList.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/tax.test.js",
   "path": "backend/tests/tax.test.js",
   "label": "tax.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 63,
   "size": 3621,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/services/tax.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/units.test.js",
   "path": "backend/tests/units.test.js",
   "label": "units.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 29,
   "size": 1407,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/units.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "backend/tests/validate_rls.js",
   "path": "backend/tests/validate_rls.js",
   "label": "validate_rls.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Validacao das politicas de RLS.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 95,
   "size": 2817,
   "externals": [
    "@prisma/client"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "deploy/gerar_env_producao.js",
   "path": "deploy/gerar_env_producao.js",
   "label": "gerar_env_producao.js",
   "group": "infra",
   "dir": "deploy",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 41,
   "size": 1929,
   "externals": [
    "fs",
    "path",
    "crypto"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "deploy/publicar.sh",
   "path": "deploy/publicar.sh",
   "label": "publicar.sh",
   "group": "infra",
   "dir": "deploy",
   "ext": ".sh",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 81,
   "size": 4446,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "deploy/setup_servidor.sh",
   "path": "deploy/setup_servidor.sh",
   "label": "setup_servidor.sh",
   "group": "infra",
   "dir": "deploy",
   "ext": ".sh",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 64,
   "size": 3149,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "docs/ETAPA0_RESULT.md",
   "path": "docs/ETAPA0_RESULT.md",
   "label": "ETAPA0_RESULT.md",
   "group": "docs",
   "dir": "docs",
   "ext": ".md",
   "status": "ok",
   "summary": "Resultado da Etapa 0 (higiene de seguranca e credenciais).",
   "notes": "",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 45,
   "size": 3305,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "docs/curl_collection.sh",
   "path": "docs/curl_collection.sh",
   "label": "curl_collection.sh",
   "group": "docs",
   "dir": "docs",
   "ext": ".sh",
   "status": "ok",
   "summary": "Coleccao de exemplos curl da API.",
   "notes": "",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 28,
   "size": 1707,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "docs/offline_sync_test_plan.md",
   "path": "docs/offline_sync_test_plan.md",
   "label": "offline_sync_test_plan.md",
   "group": "docs",
   "dir": "docs",
   "ext": ".md",
   "status": "ok",
   "summary": "Plano de teste da sincronizacao offline do POS.",
   "notes": "",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 3132,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "docs/postman_genesis_collection.json",
   "path": "docs/postman_genesis_collection.json",
   "label": "postman_genesis_collection.json",
   "group": "docs",
   "dir": "docs",
   "ext": ".json",
   "status": "ok",
   "summary": "Coleccao Postman com os pedidos principais da API.",
   "notes": "",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 63,
   "size": 2930,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "docs/test_harness.sh",
   "path": "docs/test_harness.sh",
   "label": "test_harness.sh",
   "group": "docs",
   "dir": "docs",
   "ext": ".sh",
   "status": "ok",
   "summary": "Utilitario de arranque de harness de testes.",
   "notes": "",
   "role": "Automatismo.",
   "security": "",
   "planned": false,
   "lines": 18,
   "size": 462,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/app.html",
   "path": "frontend/app.html",
   "label": "app.html",
   "group": "infra",
   "dir": "frontend",
   "ext": ".html",
   "status": "ok",
   "summary": "HTML da app (SPA: entrar, painel do dono, terminal), noindex.",
   "notes": "24/10/2026 Fase 11.1 (antes index.html): flows 40/40, pos 22/22, idioma 33/33, pwa_offline 8/8.",
   "role": "HTML da app.",
   "security": "",
   "planned": false,
   "lines": 23,
   "size": 993,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/en/index.html",
   "path": "frontend/en/index.html",
   "label": "index.html",
   "group": "infra",
   "dir": "frontend/en",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 457,
   "size": 89500,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/en/pricing.html",
   "path": "frontend/en/pricing.html",
   "label": "pricing.html",
   "group": "infra",
   "dir": "frontend/en",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 179,
   "size": 25222,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/en/privacy.html",
   "path": "frontend/en/privacy.html",
   "label": "privacy.html",
   "group": "infra",
   "dir": "frontend/en",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 154,
   "size": 16250,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/en/terms.html",
   "path": "frontend/en/terms.html",
   "label": "terms.html",
   "group": "infra",
   "dir": "frontend/en",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 160,
   "size": 15461,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/index.html",
   "path": "frontend/index.html",
   "label": "index.html",
   "group": "frontend-pub",
   "dir": "frontend",
   "ext": ".html",
   "status": "partial",
   "summary": "Raiz do site publico (landing PT). Provisoria na Fase 11.1; o site completo chega na 11.3.",
   "notes": "24/10/2026 Fase 11.1: a app passou para app.html; site.mjs 9/9.",
   "role": "Site publico.",
   "security": "",
   "planned": false,
   "lines": 457,
   "size": 89506,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/package.json",
   "path": "frontend/package.json",
   "label": "package.json",
   "group": "infra",
   "dir": "frontend",
   "ext": ".json",
   "status": "ok",
   "summary": "Dependencias e scripts do frontend (React, Vite, Dexie, qrcode, recharts, i18next, lucide, jspdf).",
   "notes": "jspdf adicionado a 27/09 para gerar o PDF do recibo offline (fica no bundle, sem CDN).",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 38,
   "size": 917,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/planos.html",
   "path": "frontend/planos.html",
   "label": "planos.html",
   "group": "infra",
   "dir": "frontend",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 179,
   "size": 25216,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/postcss.config.js",
   "path": "frontend/postcss.config.js",
   "label": "postcss.config.js",
   "group": "frontend-pub",
   "dir": "frontend",
   "ext": ".js",
   "status": "ok",
   "summary": "Pipeline PostCSS/Tailwind.",
   "notes": "",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 15,
   "size": 618,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/privacidade.html",
   "path": "frontend/privacidade.html",
   "label": "privacidade.html",
   "group": "infra",
   "dir": "frontend",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 154,
   "size": 16486,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/public/05c70f306ca5185ab7e583ccee3071e1.txt",
   "path": "frontend/public/05c70f306ca5185ab7e583ccee3071e1.txt",
   "label": "05c70f306ca5185ab7e583ccee3071e1.txt",
   "group": "frontend-pub",
   "dir": "frontend/public",
   "ext": ".txt",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 1,
   "size": 32,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/public/404.html",
   "path": "frontend/public/404.html",
   "label": "404.html",
   "group": "frontend-pub",
   "dir": "frontend/public",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 167,
   "size": 48203,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/public/robots.txt",
   "path": "frontend/public/robots.txt",
   "label": "robots.txt",
   "group": "frontend-pub",
   "dir": "frontend/public",
   "ext": ".txt",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 15,
   "size": 340,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/public/site/shots/shots.json",
   "path": "frontend/public/site/shots/shots.json",
   "label": "shots.json",
   "group": "frontend-pub",
   "dir": "frontend/public/site/shots",
   "ext": ".json",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 53,
   "size": 917,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/scripts/capturas_site.mjs",
   "path": "frontend/scripts/capturas_site.mjs",
   "label": "capturas_site.mjs",
   "group": "frontend",
   "dir": "frontend/scripts",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Capturas reais PT/EN em WebP numa loja demo.",
   "notes": "",
   "role": "Ferramenta do site.",
   "security": "",
   "planned": false,
   "lines": 136,
   "size": 7144,
   "externals": [
    "node:fs",
    "node:path",
    "node:url",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/scripts/fix-hex.mjs",
   "path": "frontend/scripts/fix-hex.mjs",
   "label": "fix-hex.mjs",
   "group": "frontend",
   "dir": "frontend/scripts",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Utilitario de migracao de cores hex para os tokens de design.",
   "notes": "",
   "role": "Ferramenta.",
   "security": "",
   "planned": false,
   "lines": 105,
   "size": 3618,
   "externals": [
    "node:fs",
    "node:path"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/scripts/gerar_404.mjs",
   "path": "frontend/scripts/gerar_404.mjs",
   "label": "gerar_404.mjs",
   "group": "frontend",
   "dir": "frontend/scripts",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 234,
   "size": 17180,
   "externals": [
    "node:fs",
    "node:path",
    "node:url"
   ],
   "dependsOn": [
    "frontend/src/ui/marca.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/scripts/gerar_icones.mjs",
   "path": "frontend/scripts/gerar_icones.mjs",
   "label": "gerar_icones.mjs",
   "group": "frontend",
   "dir": "frontend/scripts",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Gera favicon (svg/ico/png), apple-touch-icon e icones da app a partir de marca.js (Chromium do Playwright).",
   "notes": "",
   "role": "Script.",
   "security": "",
   "planned": false,
   "lines": 88,
   "size": 4989,
   "externals": [
    "node:fs",
    "node:path",
    "node:url",
    "@playwright/test"
   ],
   "dependsOn": [
    "frontend/src/ui/marca.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/scripts/gerar_site.mjs",
   "path": "frontend/scripts/gerar_site.mjs",
   "label": "gerar_site.mjs",
   "group": "frontend",
   "dir": "frontend/scripts",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Gera index/planos/en + sitemap; --check.",
   "notes": "",
   "role": "Ferramenta do site.",
   "security": "",
   "planned": false,
   "lines": 23,
   "size": 1066,
   "externals": [
    "node:fs",
    "node:path"
   ],
   "dependsOn": [
    "frontend/site/build.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/site/build.js",
   "path": "frontend/site/build.js",
   "label": "build.js",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".js",
   "status": "ok",
   "summary": "Monta as paginas (icones lucide em linha, capturas).",
   "notes": "",
   "role": "Site publico.",
   "security": "",
   "planned": false,
   "lines": 45,
   "size": 2240,
   "externals": [
    "node:fs",
    "node:path",
    "node:url"
   ],
   "dependsOn": [
    "frontend/site/textos.pt.js",
    "frontend/site/textos.en.js",
    "frontend/site/template.js"
   ],
   "usedBy": [
    "frontend/scripts/gerar_site.mjs",
    "frontend/tests/site.test.mjs"
   ],
   "inbound": 2,
   "outbound": 3
  },
  {
   "id": "frontend/site/config.js",
   "path": "frontend/site/config.js",
   "label": "config.js",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".js",
   "status": "ok",
   "summary": "Fonte unica: WhatsApp, preco, contas de pagamento (vazias = escondidas).",
   "notes": "",
   "role": "Site publico.",
   "security": "",
   "planned": false,
   "lines": 28,
   "size": 1347,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/site/template.js",
    "frontend/tests/site.test.mjs"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "frontend/site/legal.js",
   "path": "frontend/site/legal.js",
   "label": "legal.js",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".js",
   "status": "ok",
   "summary": "Texto da Politica de privacidade e dos Termos (PT/EN).",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Site publico.",
   "security": "",
   "planned": false,
   "lines": 198,
   "size": 15920,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/site/template.js"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/site/site.css",
   "path": "frontend/site/site.css",
   "label": "site.css",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".css",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 97,
   "size": 5282,
   "externals": [
    "@fontsource-variable/inter"
   ],
   "dependsOn": [
    "frontend/src/ui/tokens.css"
   ],
   "usedBy": [
    "frontend/site/site.js"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "frontend/site/site.js",
   "path": "frontend/site/site.js",
   "label": "site.js",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".js",
   "status": "ok",
   "summary": "Encaminhamento por sessao, menu movel, saudacao do WhatsApp pela hora.",
   "notes": "25/10 Fase 14: site novo; site.mjs 54/54 em producao.",
   "role": "Site publico.",
   "security": "",
   "planned": false,
   "lines": 81,
   "size": 3988,
   "externals": [],
   "dependsOn": [
    "frontend/site/site.css"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/site/template.js",
   "path": "frontend/site/template.js",
   "label": "template.js",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".js",
   "status": "ok",
   "summary": "Modelo HTML das 4 paginas do site publico (PT/EN), SEO e JSON-LD.",
   "notes": "25/10 Fase 14: site novo; site.mjs 54/54 em producao.",
   "role": "Site publico.",
   "security": "",
   "planned": false,
   "lines": 502,
   "size": 31790,
   "externals": [],
   "dependsOn": [
    "frontend/src/ui/marca.js",
    "frontend/site/config.js",
    "frontend/site/legal.js"
   ],
   "usedBy": [
    "frontend/site/build.js"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/site/textos.en.js",
   "path": "frontend/site/textos.en.js",
   "label": "textos.en.js",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".js",
   "status": "ok",
   "summary": "",
   "notes": "25/10 Fase 14: site novo; site.mjs 54/54 em producao.",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 241,
   "size": 18511,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/site/build.js",
    "frontend/tests/site.test.mjs"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "frontend/site/textos.pt.js",
   "path": "frontend/site/textos.pt.js",
   "label": "textos.pt.js",
   "group": "infra",
   "dir": "frontend/site",
   "ext": ".js",
   "status": "ok",
   "summary": "",
   "notes": "25/10 Fase 14: site novo; site.mjs 54/54 em producao.",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 247,
   "size": 19110,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/site/build.js",
    "frontend/tests/site.test.mjs"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "frontend/src/App.jsx",
   "path": "frontend/src/App.jsx",
   "label": "App.jsx",
   "group": "frontend",
   "dir": "frontend/src",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Router do produto: todas as rotas /owner/* protegidas por ProtectedRoute; /pos atras do PosGate; /admin e /super-admin redireccionam para /login.",
   "notes": "",
   "role": "Mapa de rotas.",
   "security": "Nenhuma rota de gestao esta exposta sem sessao.",
   "planned": false,
   "lines": 113,
   "size": 6030,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/NotifyMe.jsx",
    "frontend/src/pages/NotFound.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/Profile.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/GroupPanel.jsx"
   ],
   "usedBy": [
    "frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 23
  },
  {
   "id": "frontend/src/components/BarcodeScanner.jsx",
   "path": "frontend/src/components/BarcodeScanner.jsx",
   "label": "BarcodeScanner.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Leitura de codigo de barras pela camara (ZXing).",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Camara.",
   "security": "",
   "planned": false,
   "lines": 87,
   "size": 4965,
   "externals": [
    "react",
    "@zxing/browser",
    "@zxing/library"
   ],
   "dependsOn": [
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx"
   ],
   "usedBy": [
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/pages/pos/GuardScreen.jsx",
    "frontend/src/pages/pos/PosScreen.jsx"
   ],
   "inbound": 3,
   "outbound": 3
  },
  {
   "id": "frontend/src/components/BirthdayDialog.jsx",
   "path": "frontend/src/components/BirthdayDialog.jsx",
   "label": "BirthdayDialog.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 2065,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/layouts/AppShell.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/components/CopyCatalogDialog.jsx",
   "path": "frontend/src/components/CopyCatalogDialog.jsx",
   "label": "CopyCatalogDialog.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Copiar produtos de outro estabelecimento do mesmo dono.",
   "notes": "31/10/2026 E1: verify_system 49.",
   "role": "R1 do fundador.",
   "security": "",
   "planned": false,
   "lines": 68,
   "size": 3975,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/syncPolicy.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Products.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/components/EstablishmentSwitcher.jsx",
   "path": "frontend/src/components/EstablishmentSwitcher.jsx",
   "label": "EstablishmentSwitcher.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Trocar de estabelecimento / acrescentar.",
   "notes": "30/10/2026 Etapa D: verify_system 45 23/23, etapaD.mjs 6/6.",
   "role": "Etapa D.",
   "security": "",
   "planned": false,
   "lines": 89,
   "size": 5535,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/syncPolicy.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/layouts/AppShell.jsx"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "frontend/src/components/HoursEditor.jsx",
   "path": "frontend/src/components/HoursEditor.jsx",
   "label": "HoursEditor.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Editor de horario (igual / 24 h / por dia, pausas, feriados, horas em 24 h).",
   "notes": "31/10/2026 E1: escolhas em coluna no telemovel (0 px a mais a 390), em linha no PC; e2e em producao.",
   "role": "Onboarding e Definicoes.",
   "security": "",
   "planned": false,
   "lines": 151,
   "size": 9391,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/Settings.jsx"
   ],
   "inbound": 2,
   "outbound": 2
  },
  {
   "id": "frontend/src/components/LiveSales.jsx",
   "path": "frontend/src/components/LiveSales.jsx",
   "label": "LiveSales.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Avisos ao vivo do dono: vendas, perdas, txenekas, despesas, compras, turnos.",
   "notes": "31/10/2026 E1: verify_system 48.",
   "role": "Etapa C.",
   "security": "",
   "planned": false,
   "lines": 67,
   "size": 3872,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "frontend/src/utils/privacy.jsx",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/layouts/AppShell.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/components/MonthCloseDialog.jsx",
   "path": "frontend/src/components/MonthCloseDialog.jsx",
   "label": "MonthCloseDialog.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Dialogo do fecho do mes (resumo + lista sugerida + WhatsApp).",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 145,
   "size": 8272,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/layouts/AppShell.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/components/NotificationBell.jsx",
   "path": "frontend/src/components/NotificationBell.jsx",
   "label": "NotificationBell.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Sino no cabecalho do dono com contador e gaveta de notificacoes; tocar abre a pagina certa.",
   "notes": "18/10/2026 Fase 10.1 (sino do dono): notifications.test 7/7; verify_system 31 23/23; sino.mjs 12/12; regressao idioma_dono 35/35 e flows 40/40. Publicado 9cb2e61 (18/10): sino.mjs 12/12 no site.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 87,
   "size": 4172,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/notificationText.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/layouts/AppShell.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/components/PanelLock.jsx",
   "path": "frontend/src/components/PanelLock.jsx",
   "label": "PanelLock.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra do PIN do painel + «Esqueci o PIN».",
   "notes": "31/10/2026 E1: e2e correcoes_3110.",
   "role": "Bloqueio do painel (cliente).",
   "security": "",
   "planned": false,
   "lines": 280,
   "size": 14938,
   "externals": [
    "react",
    "lucide-react",
    "@simplewebauthn/browser"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/utils/offlinePin.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/i18n/en/lock.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/utils/session.jsx"
   ],
   "inbound": 2,
   "outbound": 7
  },
  {
   "id": "frontend/src/components/PdfButton.jsx",
   "path": "frontend/src/components/PdfButton.jsx",
   "label": "PdfButton.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Botao PDF / imprimir (gera, partilha ou descarrega).",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "PDF.",
   "security": "",
   "planned": false,
   "lines": 36,
   "size": 1472,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/pdf/deliver.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/PdfReadyDialog.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Reports.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/components/PdfReadyDialog.jsx",
   "path": "frontend/src/components/PdfReadyDialog.jsx",
   "label": "PdfReadyDialog.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Dialogo \"PDF pronto\" quando o iPhone pede um toque novo para partilhar.",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "PDF.",
   "security": "",
   "planned": false,
   "lines": 34,
   "size": 1201,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/pdf/deliver.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/components/PdfButton.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx"
   ],
   "inbound": 3,
   "outbound": 3
  },
  {
   "id": "frontend/src/components/SaleDrawer.jsx",
   "path": "frontend/src/components/SaleDrawer.jsx",
   "label": "SaleDrawer.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Recibo completo de uma venda num Drawer, com reimprimir.",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 81,
   "size": 4627,
   "externals": [
    "react",
    "lucide-react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/receiptPrinter.js",
    "frontend/src/components/PdfReadyDialog.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/utils/units.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx"
   ],
   "inbound": 3,
   "outbound": 7
  },
  {
   "id": "frontend/src/components/ui/BrandMark.jsx",
   "path": "frontend/src/components/ui/BrandMark.jsx",
   "label": "BrandMark.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Simbolo da marca (G + quadrado dourado, de ui/marca.js) num quadrado verde; substitui o antigo G de texto no AuthLayout, AppShell, Onboarding, Terminal, PosScreen e admin.",
   "notes": "25/10/2026: flows.mjs 40/40 + idioma_admin 17/17, 0 erros de JS, capturas revistas.",
   "role": "UI kit (marca).",
   "security": "",
   "planned": false,
   "lines": 20,
   "size": 837,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/ui/marca.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/src/components/ui/Button.jsx",
   "path": "frontend/src/components/ui/Button.jsx",
   "label": "Button.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 61,
   "size": 2430,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js"
   ],
   "usedBy": [
    "frontend/src/components/ui/LanguageSwitch.jsx",
    "frontend/src/components/ui/Overlay.jsx"
   ],
   "inbound": 2,
   "outbound": 1
  },
  {
   "id": "frontend/src/components/ui/CountUp.jsx",
   "path": "frontend/src/components/ui/CountUp.jsx",
   "label": "CountUp.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Numeros que sobem ao aparecer (reduced-motion respeitado).",
   "notes": "",
   "role": "UI.",
   "security": "",
   "planned": false,
   "lines": 40,
   "size": 1694,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/format.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/src/components/ui/Data.jsx",
   "path": "frontend/src/components/ui/Data.jsx",
   "label": "Data.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 206,
   "size": 9430,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js",
    "frontend/src/i18n/react.jsx"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "frontend/src/components/ui/Form.jsx",
   "path": "frontend/src/components/ui/Form.jsx",
   "label": "Form.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 159,
   "size": 7394,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js",
    "frontend/src/utils/money.js",
    "frontend/src/i18n/react.jsx"
   ],
   "usedBy": [
    "frontend/src/components/ui/LanguageSwitch.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/components/ui/LanguageSwitch.jsx",
   "path": "frontend/src/components/ui/LanguageSwitch.jsx",
   "label": "LanguageSwitch.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Seletor PT | EN (segmentado) ou botao compacto que alterna; onChange grava na conta.",
   "notes": "17/10/2026 Fase 9.3 (publicada 1f1f384): criado.",
   "role": "Kit de UI.",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1603,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js",
    "frontend/src/components/ui/Button.jsx",
    "frontend/src/components/ui/Form.jsx",
    "frontend/src/i18n/react.jsx"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 4
  },
  {
   "id": "frontend/src/components/ui/Overlay.jsx",
   "path": "frontend/src/components/ui/Overlay.jsx",
   "label": "Overlay.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 136,
   "size": 6061,
   "externals": [
    "react",
    "react-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js",
    "frontend/src/components/ui/Button.jsx",
    "frontend/src/i18n/react.jsx"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 3
  },
  {
   "id": "frontend/src/components/ui/ProductImage.jsx",
   "path": "frontend/src/components/ui/ProductImage.jsx",
   "label": "ProductImage.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Foto do produto ou icone da categoria.",
   "notes": "10/10/2026 Fase 8.2: verify_system 20 (32/32) + fase8_2.mjs no browser (dono no PC e iPhone 390 px, super admin). 04/10/2026: pos.mjs 21/21 + flows.mjs 24/24 no browser.",
   "role": "UI kit.",
   "security": "",
   "planned": false,
   "lines": 48,
   "size": 2145,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js",
    "frontend/src/components/ui/productIcons.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "frontend/src/components/ui/cx.js",
   "path": "frontend/src/components/ui/cx.js",
   "label": "cx.js",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 3,
   "size": 108,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/ui/Button.jsx",
    "frontend/src/components/ui/Data.jsx",
    "frontend/src/components/ui/Form.jsx",
    "frontend/src/components/ui/LanguageSwitch.jsx",
    "frontend/src/components/ui/Overlay.jsx",
    "frontend/src/components/ui/ProductImage.jsx"
   ],
   "inbound": 6,
   "outbound": 0
  },
  {
   "id": "frontend/src/components/ui/index.js",
   "path": "frontend/src/components/ui/index.js",
   "label": "index.js",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 12,
   "size": 771,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/components/BarcodeScanner.jsx",
    "frontend/src/components/BirthdayDialog.jsx",
    "frontend/src/components/CopyCatalogDialog.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/components/HoursEditor.jsx",
    "frontend/src/components/LiveSales.jsx",
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/NotificationBell.jsx",
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/components/PdfButton.jsx",
    "frontend/src/components/PdfReadyDialog.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/NotifyMe.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/GroupPanel.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/LocationCard.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Profile.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/pos/DevicesDialog.jsx",
    "frontend/src/pages/pos/GuardScreen.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/session.jsx"
   ],
   "inbound": 42,
   "outbound": 0
  },
  {
   "id": "frontend/src/components/ui/productIcons.js",
   "path": "frontend/src/components/ui/productIcons.js",
   "label": "productIcons.js",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".js",
   "status": "ok",
   "summary": "32 icones de produto (desenho + nome em portugues).",
   "notes": "10/10/2026 Fase 8.2: verify_system 20 (32/32) + fase8_2.mjs no browser (dono no PC e iPhone 390 px, super admin).",
   "role": "Design system.",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2379,
   "externals": [
    "lucide-react"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/ui/ProductImage.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/db/localDb.js",
   "path": "frontend/src/db/localDb.js",
   "label": "localDb.js",
   "group": "frontend",
   "dir": "frontend/src/db",
   "ext": ".js",
   "status": "ok",
   "summary": "Base de dados local (Dexie/IndexedDB) para o POS funcionar offline: produtos, vendas, perdas, procura e fechos.",
   "notes": "",
   "role": "Offline.",
   "security": "",
   "planned": false,
   "lines": 82,
   "size": 3923,
   "externals": [
    "dexie"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/hooks/useOfflineSync.js",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/utils/offlinePin.js",
    "frontend/src/utils/productCache.js",
    "frontend/tests/offline_pin.test.mjs",
    "frontend/tests/offline_queue.test.mjs"
   ],
   "inbound": 7,
   "outbound": 0
  },
  {
   "id": "frontend/src/hooks/useOfflineSync.js",
   "path": "frontend/src/hooks/useOfflineSync.js",
   "label": "useOfflineSync.js",
   "group": "frontend",
   "dir": "frontend/src/hooks",
   "ext": ".js",
   "status": "ok",
   "summary": "Envia a fila a cada 30 s e quando a rede volta; avisa o ecra (genesis:queue-synced).",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Terminal sem rede.",
   "security": "",
   "planned": false,
   "lines": 96,
   "size": 3767,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/db/localDb.js",
    "frontend/src/utils/offlineQueue.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/PosScreen.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/i18n/core.js",
   "path": "frontend/src/i18n/core.js",
   "label": "core.js",
   "group": "frontend",
   "dir": "frontend/src/i18n",
   "ext": ".js",
   "status": "ok",
   "summary": "Lingua da interface: t(texto em portugues), dicionarios por area, setLang/locale, sem bibliotecas.",
   "notes": "17/10/2026 Fase 9.3 (publicada 1f1f384): tests/i18n.test.mjs 6/6 (cobertura: cada t() literal tem ingles; contraprova falha).",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 62,
   "size": 2378,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "admin-frontend/src/i18n_en.js",
    "frontend/src/components/BarcodeScanner.jsx",
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/i18n/en/auth.js",
    "frontend/src/i18n/en/common.js",
    "frontend/src/i18n/en/lock.js",
    "frontend/src/i18n/en/owner.js",
    "frontend/src/i18n/en/pos.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/api.js",
    "frontend/src/utils/auditLabels.js",
    "frontend/src/utils/devices.js",
    "frontend/src/utils/escpos.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/notificationText.js",
    "frontend/src/utils/pdf/receiptPdf.js",
    "frontend/src/utils/pdf/reportPdf.js",
    "frontend/src/utils/receiptImage.js",
    "frontend/src/utils/receiptPrinter.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/timelineText.js",
    "frontend/src/utils/units.js",
    "frontend/tests/audit_labels.test.mjs",
    "frontend/tests/i18n.test.mjs",
    "frontend/tests/receipt_image.test.mjs",
    "frontend/tests/units.test.mjs"
   ],
   "inbound": 33,
   "outbound": 0
  },
  {
   "id": "frontend/src/i18n/en/auth.js",
   "path": "frontend/src/i18n/en/auth.js",
   "label": "auth.js",
   "group": "frontend",
   "dir": "frontend/src/i18n/en",
   "ext": ".js",
   "status": "ok",
   "summary": "Ingles da area auth.",
   "notes": "17/10/2026 Fase 9.3 (publicada 1f1f384): criado.",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 90,
   "size": 5566,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "frontend/src/i18n/en/common.js",
   "path": "frontend/src/i18n/en/common.js",
   "label": "common.js",
   "group": "frontend",
   "dir": "frontend/src/i18n/en",
   "ext": ".js",
   "status": "ok",
   "summary": "Ingles da area common.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 363,
   "size": 22037,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/i18n/react.jsx",
    "frontend/tests/receipt_image.test.mjs"
   ],
   "inbound": 2,
   "outbound": 1
  },
  {
   "id": "frontend/src/i18n/en/lock.js",
   "path": "frontend/src/i18n/en/lock.js",
   "label": "lock.js",
   "group": "frontend",
   "dir": "frontend/src/i18n/en",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 52,
   "size": 4213,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/components/PanelLock.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "frontend/src/i18n/en/owner.js",
   "path": "frontend/src/i18n/en/owner.js",
   "label": "owner.js",
   "group": "frontend",
   "dir": "frontend/src/i18n/en",
   "ext": ".js",
   "status": "ok",
   "summary": "Ingles da area owner: menu e todas as paginas do dono (9.4).",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 1256,
   "size": 80735,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/src/i18n/en/pos.js",
   "path": "frontend/src/i18n/en/pos.js",
   "label": "pos.js",
   "group": "frontend",
   "dir": "frontend/src/i18n/en",
   "ext": ".js",
   "status": "ok",
   "summary": "Ingles da area pos (so emparelhar/perfis na 9.3; venda na 9.5).",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou.",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 234,
   "size": 16463,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/src/i18n/react.jsx",
   "path": "frontend/src/i18n/react.jsx",
   "label": "react.jsx",
   "group": "frontend",
   "dir": "frontend/src/i18n",
   "ext": ".jsx",
   "status": "ok",
   "summary": "I18nProvider + useI18n: componentes voltam a desenhar quando a lingua muda, sem perder estado.",
   "notes": "17/10/2026 Fase 9.3 (publicada 1f1f384): idioma.mjs 33/33.",
   "role": "Traducao PT/EN.",
   "security": "",
   "planned": false,
   "lines": 18,
   "size": 821,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/en/common.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/components/BarcodeScanner.jsx",
    "frontend/src/components/BirthdayDialog.jsx",
    "frontend/src/components/CopyCatalogDialog.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/components/HoursEditor.jsx",
    "frontend/src/components/LiveSales.jsx",
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/NotificationBell.jsx",
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/components/PdfButton.jsx",
    "frontend/src/components/PdfReadyDialog.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/components/ui/Data.jsx",
    "frontend/src/components/ui/Form.jsx",
    "frontend/src/components/ui/LanguageSwitch.jsx",
    "frontend/src/components/ui/Overlay.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/NotifyMe.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/GroupPanel.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/LocationCard.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Profile.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/pos/DevicesDialog.jsx",
    "frontend/src/pages/pos/GuardScreen.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx"
   ],
   "inbound": 44,
   "outbound": 2
  },
  {
   "id": "frontend/src/index.css",
   "path": "frontend/src/index.css",
   "label": "index.css",
   "group": "frontend",
   "dir": "frontend/src",
   "ext": ".css",
   "status": "partial",
   "summary": "Folha principal do produto: layout POS, cartoes, tabelas e blocos de impressao.",
   "notes": "Tem cores hex fixas (receipt-shell, POS) e nao acompanha o tema claro.",
   "role": "Estilo.",
   "security": "",
   "planned": false,
   "lines": 66,
   "size": 3019,
   "externals": [
    "@fontsource-variable/inter"
   ],
   "dependsOn": [
    "frontend/src/ui/tokens.css"
   ],
   "usedBy": [
    "frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "frontend/src/layouts/AppShell.jsx",
   "path": "frontend/src/layouts/AppShell.jsx",
   "label": "AppShell.jsx",
   "group": "frontend",
   "dir": "frontend/src/layouts",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Moldura do painel do dono; monta o fecho do mes e o sino de notificacoes.",
   "notes": "04/10/2026: regressao completa OK. | 17/10/2026 Fase 9.3 (publicada 1f1f384): menu traduzido + seletor PT/EN no menu (grava na conta; modo suporte so muda o ecra). | 18/10/2026 Fase 10.1 (sino do dono): notifications.test 7/7; verify_system 31 23/23; sino.mjs 12/12; regressao idioma_dono 35/35 e flows 40/40. Publicado 9cb2e61 (18/10): sino.mjs 12/12 no site. | 30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 209,
   "size": 12153,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/privacy.jsx",
    "frontend/src/utils/api.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/NotificationBell.jsx",
    "frontend/src/components/LiveSales.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/components/BirthdayDialog.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 10
  },
  {
   "id": "frontend/src/main.jsx",
   "path": "frontend/src/main.jsx",
   "label": "main.jsx",
   "group": "frontend",
   "dir": "frontend/src",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ponto de entrada: importa o App, o i18n, os tokens e as folhas de estilo, e registra o service worker.",
   "notes": "Ordem dos CSS importa: tokens.css tem de vir primeiro.",
   "role": "Bootstrap do frontend.",
   "security": "",
   "planned": false,
   "lines": 12,
   "size": 263,
   "externals": [
    "react",
    "react-dom"
   ],
   "dependsOn": [
    "frontend/src/App.jsx",
    "frontend/src/index.css",
    "frontend/src/registerSW.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/NotFound.jsx",
   "path": "frontend/src/pages/NotFound.jsx",
   "label": "NotFound.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Pagina «nao encontrada» dentro da app para rotas que nao existem.",
   "notes": "30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "404 da app.",
   "security": "",
   "planned": false,
   "lines": 9,
   "size": 444,
   "externals": [
    "react"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/pages/VerifyReceipt.jsx",
   "path": "frontend/src/pages/VerifyReceipt.jsx",
   "label": "VerifyReceipt.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Pagina publica /verify/:saleId aberta pelo QR: Recibo autentico / Venda cancelada / Recibo nao encontrado.",
   "notes": "09/10/2026 (Fase 7.2): verify_system 19 (8/8) + flows.mjs no browser (QR = /verify/<id>, comparado pixel a pixel; pagina publica abre sem sessao).",
   "role": "QR de autenticidade do recibo.",
   "security": "",
   "planned": false,
   "lines": 58,
   "size": 3262,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/pages/auth/AuthLayout.jsx",
   "path": "frontend/src/pages/auth/AuthLayout.jsx",
   "label": "AuthLayout.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 32,
   "size": 1576,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/i18n/en/auth.js"
   ],
   "usedBy": [
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/NotifyMe.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx"
   ],
   "inbound": 6,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/auth/Login.jsx",
   "path": "frontend/src/pages/auth/Login.jsx",
   "label": "Login.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Entrada do dono (email/senha e Google).",
   "notes": "25/10/2026 Fase 12: botao Google sem piscar ao trocar de lingua.",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 164,
   "size": 7221,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/auth/AuthLayout.jsx",
    "frontend/src/i18n/react.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/pages/auth/NotifyMe.jsx",
   "path": "frontend/src/pages/auth/NotifyMe.jsx",
   "label": "NotifyMe.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Pagina /avise-me: formulario da lista de espera, PT/EN.",
   "notes": "30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Brevemente + Avise-me.",
   "security": "",
   "planned": false,
   "lines": 69,
   "size": 4103,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/pages/auth/RequestAccount.jsx",
   "path": "frontend/src/pages/auth/RequestAccount.jsx",
   "label": "RequestAccount.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Pedido de conta; exige 18+ e Termos.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Registo.",
   "security": "",
   "planned": false,
   "lines": 108,
   "size": 7285,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/pages/auth/NotifyMe.jsx",
    "frontend/src/pages/owner/Onboarding.jsx"
   ],
   "inbound": 4,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/auth/ResetPassword.jsx",
   "path": "frontend/src/pages/auth/ResetPassword.jsx",
   "label": "ResetPassword.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 67,
   "size": 3821,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/auth/Support.jsx",
   "path": "frontend/src/pages/auth/Support.jsx",
   "label": "Support.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 33,
   "size": 1534,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/pages/owner/AuditLogPage.jsx",
   "path": "frontend/src/pages/owner/AuditLogPage.jsx",
   "label": "AuditLogPage.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Rastreio do dono; o detalhe de uma venda mostra o que se vendeu.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Auditoria do dono.",
   "security": "",
   "planned": false,
   "lines": 205,
   "size": 11819,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/units.js",
    "frontend/src/utils/auditLabels.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Settings.jsx"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "frontend/src/pages/owner/Debts.jsx",
   "path": "frontend/src/pages/owner/Debts.jsx",
   "label": "Debts.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 111,
   "size": 7511,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/owner/GroupPanel.jsx",
   "path": "frontend/src/pages/owner/GroupPanel.jsx",
   "label": "GroupPanel.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Painel geral de todos os estabelecimentos.",
   "notes": "30/10/2026 Etapa D: verify_system 45 23/23, etapaD.mjs 6/6.",
   "role": "Etapa D.",
   "security": "",
   "planned": false,
   "lines": 65,
   "size": 3393,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/pages/owner/Home.jsx",
   "path": "frontend/src/pages/owner/Home.jsx",
   "label": "Home.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Inicio curto: hoje, meta, caixistas agora, ultimas vendas (sem repetir outras paginas).",
   "notes": "25/10 Fase 13: fase13.mjs 19/19 em producao.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 283,
   "size": 14613,
   "externals": [
    "react",
    "react-router-dom",
    "recharts",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "frontend/src/pages/owner/LocationCard.jsx",
   "path": "frontend/src/pages/owner/LocationCard.jsx",
   "label": "LocationCard.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Localizacao no mapa nas Definicoes.",
   "notes": "30/10/2026 Etapa C: verify_system 44 14/14, etapaC.mjs 9/9, geo/liveBus testes 8/8.",
   "role": "Etapa C.",
   "security": "",
   "planned": false,
   "lines": 72,
   "size": 3739,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Settings.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/pages/owner/Onboarding.jsx",
   "path": "frontend/src/pages/owner/Onboarding.jsx",
   "label": "Onboarding.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Assistente de configuracao: uma so operacao, voltar ao principal, rascunho, copiar de outro, horario a serio.",
   "notes": "31/10/2026 E1: verify_system 48; e2e correcoes_3110.",
   "role": "Onboarding do dono.",
   "security": "",
   "planned": false,
   "lines": 341,
   "size": 24869,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/components/HoursEditor.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "frontend/src/pages/owner/ProductDrawer.jsx",
   "path": "frontend/src/pages/owner/ProductDrawer.jsx",
   "label": "ProductDrawer.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Formulario do produto (novo/editar, icone, validades por lote, fornecedor, stock actual) partilhado pelo Catalogo e pela Entrada de stock; LotRows.",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 269,
   "size": 19001,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/units.js",
    "frontend/src/utils/imageResize.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/BarcodeScanner.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Products.jsx"
   ],
   "inbound": 1,
   "outbound": 8
  },
  {
   "id": "frontend/src/pages/owner/Products.jsx",
   "path": "frontend/src/pages/owner/Products.jsx",
   "label": "Products.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Produtos: Catalogo, Stock (Entrada de stock = produto novo; Ajuste manual Adicionar/Retirar com quantidade positiva), Lista de compras, Historico de custos.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 256,
   "size": 17058,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/CopyCatalogDialog.jsx",
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/search.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/utils/units.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 10
  },
  {
   "id": "frontend/src/pages/owner/Profile.jsx",
   "path": "frontend/src/pages/owner/Profile.jsx",
   "label": "Profile.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra do Perfil do dono (Fase 16).",
   "notes": "30/10/2026 Etapa A: unitarios backend 116/116 e frontend 64/64, verify_system 40-41 sem falhas, etapaA.mjs 16/16 (local contra o Supabase).",
   "role": "Perfil.",
   "security": "",
   "planned": false,
   "lines": 231,
   "size": 13202,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/owner/Reports.jsx",
   "path": "frontend/src/pages/owner/Reports.jsx",
   "label": "Reports.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra dos relatorios: KPIs, ranking por niveis, rastreio com filtros, cascata mensal, botao PDF / imprimir por separador.",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou. | 25/10/2026: eixo Y width=80 (cortava 120 000).",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 593,
   "size": 40496,
   "externals": [
    "react",
    "react-router-dom",
    "recharts"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/timelineText.js",
    "frontend/src/components/PdfButton.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/units.js",
    "frontend/src/utils/pdf/reportPdf.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 11
  },
  {
   "id": "frontend/src/pages/owner/Sales.jsx",
   "path": "frontend/src/pages/owner/Sales.jsx",
   "label": "Sales.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 84,
   "size": 5095,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/useApi.js",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/owner/Settings.jsx",
   "path": "frontend/src/pages/owner/Settings.jsx",
   "label": "Settings.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Definicoes: loja, custos e despesas, descontos/PIN, terminais, auditoria.",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 724,
   "size": 50702,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react",
    "@simplewebauthn/browser"
   ],
   "dependsOn": [
    "frontend/src/utils/session.jsx",
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/utils/offlinePin.js",
    "frontend/src/utils/receiptPrinter.js",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/src/components/HoursEditor.jsx",
    "frontend/src/pages/owner/LocationCard.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 14
  },
  {
   "id": "frontend/src/pages/owner/ShoppingLists.jsx",
   "path": "frontend/src/pages/owner/ShoppingLists.jsx",
   "label": "ShoppingLists.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra da lista de compras (Produtos).",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 198,
   "size": 13462,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Products.jsx"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "frontend/src/pages/owner/Suppliers.jsx",
   "path": "frontend/src/pages/owner/Suppliers.jsx",
   "label": "Suppliers.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 79,
   "size": 4997,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/pages/owner/Team.jsx",
   "path": "frontend/src/pages/owner/Team.jsx",
   "label": "Team.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 190,
   "size": 12858,
   "externals": [
    "react",
    "lucide-react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/pos/DevicesDialog.jsx",
   "path": "frontend/src/pages/pos/DevicesDialog.jsx",
   "label": "DevicesDialog.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/pos",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Pergunta dos dispositivos depois do PIN / botao Dispositivos.",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou.",
   "role": "Terminal.",
   "security": "",
   "planned": false,
   "lines": 108,
   "size": 7182,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/devices.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/api.js",
    "frontend/src/i18n/react.jsx"
   ],
   "usedBy": [
    "frontend/src/pages/pos/PosScreen.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/pages/pos/GuardScreen.jsx",
   "path": "frontend/src/pages/pos/GuardScreen.jsx",
   "label": "GuardScreen.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/pos",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra do guarda: leitor USB/camara, verde Pode sair, vermelho Ja conferido.",
   "notes": "30/10/2026 Etapa B: verify_system 43 22/22, guarda.mjs 8/8, guard.test.js 3/3.",
   "role": "Antifraude a saida.",
   "security": "",
   "planned": false,
   "lines": 134,
   "size": 7582,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/BarcodeScanner.jsx",
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/units.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/Terminal.jsx"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "frontend/src/pages/pos/PosDialogs.jsx",
   "path": "frontend/src/pages/pos/PosDialogs.jsx",
   "label": "PosDialogs.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/pos",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Dialogos do terminal: recibo (tambem provisorio sem rede), vendas com 2.a via e PIN do dono sem rede.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Terminal POS.",
   "security": "",
   "planned": false,
   "lines": 513,
   "size": 30789,
   "externals": [
    "react",
    "qrcode",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/db/localDb.js",
    "frontend/src/utils/syncPolicy.js",
    "frontend/src/utils/receiptPrinter.js",
    "frontend/src/utils/code128.js",
    "frontend/src/components/PdfReadyDialog.jsx",
    "frontend/src/utils/search.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js",
    "frontend/src/utils/offlinePin.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/PosScreen.jsx"
   ],
   "inbound": 1,
   "outbound": 13
  },
  {
   "id": "frontend/src/pages/pos/PosScreen.jsx",
   "path": "frontend/src/pages/pos/PosScreen.jsx",
   "label": "PosScreen.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/pos",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra de vendas: recibo sem rede, stock que muda pisca, «A enviar N».",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Terminal POS.",
   "security": "",
   "planned": false,
   "lines": 581,
   "size": 39153,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/BarcodeScanner.jsx",
    "frontend/src/pages/pos/DevicesDialog.jsx",
    "frontend/src/utils/devices.js",
    "frontend/src/utils/api.js",
    "frontend/src/db/localDb.js",
    "frontend/src/hooks/useOfflineSync.js",
    "frontend/src/utils/syncPolicy.js",
    "frontend/src/utils/productCache.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/search.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/Terminal.jsx"
   ],
   "inbound": 1,
   "outbound": 14
  },
  {
   "id": "frontend/src/pages/pos/Terminal.jsx",
   "path": "frontend/src/pages/pos/Terminal.jsx",
   "label": "Terminal.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/pos",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Terminal: emparelhar -> perfis (Turno aberto/fechado) -> PIN -> POS.",
   "notes": "25/10/2026 Fase 12: arranca sem rede com perfis guardados e PIN confirmado no aparelho (fase12.mjs).",
   "role": "Balcao.",
   "security": "",
   "planned": false,
   "lines": 261,
   "size": 13554,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/productCache.js",
    "frontend/src/utils/offlinePin.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/react.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/GuardScreen.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 9
  },
  {
   "id": "frontend/src/registerSW.js",
   "path": "frontend/src/registerSW.js",
   "label": "registerSW.js",
   "group": "frontend",
   "dir": "frontend/src",
   "ext": ".js",
   "status": "ok",
   "summary": "Registo do service worker (PWA) para apoio offline.",
   "notes": "",
   "role": "PWA.",
   "security": "",
   "planned": false,
   "lines": 9,
   "size": 168,
   "externals": [
    "virtual:pwa-register"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/ui/marca.js",
   "path": "frontend/src/ui/marca.js",
   "label": "marca.js",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".js",
   "status": "ok",
   "summary": "Simbolo da marca (G + quadrado dourado) medido na arte original; fonte unica de icones e logotipo.",
   "notes": "",
   "role": "Marca.",
   "security": "",
   "planned": false,
   "lines": 30,
   "size": 1828,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "admin-frontend/src/accountCard.js",
    "frontend/scripts/gerar_404.mjs",
    "frontend/scripts/gerar_icones.mjs",
    "frontend/site/template.js",
    "frontend/src/components/ui/BrandMark.jsx"
   ],
   "inbound": 5,
   "outbound": 0
  },
  {
   "id": "frontend/src/ui/tokens.css",
   "path": "frontend/src/ui/tokens.css",
   "label": "tokens.css",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".css",
   "status": "ok",
   "summary": "Fonte unica de verdade visual: tema claro unico, neutros stone, acento = verde do logotipo #0B4D3B (Fase 11.2), positivo = esmeralda #047857, dourado #F2B300 so da marca.",
   "notes": "25/10/2026: verde do logo verificado no browser (flows 40/40, idioma_admin 17/17, capturas revistas).",
   "role": "Design tokens.",
   "security": "",
   "planned": false,
   "lines": 72,
   "size": 2365,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/site/site.css",
    "frontend/src/index.css"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/api.js",
   "path": "frontend/src/utils/api.js",
   "label": "api.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Cliente axios com base URL, cookies e tratamento comum de erros 401.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Rede.",
   "security": "",
   "planned": false,
   "lines": 122,
   "size": 5869,
   "externals": [
    "axios"
   ],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/components/BirthdayDialog.jsx",
    "frontend/src/components/CopyCatalogDialog.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/NotifyMe.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/GroupPanel.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/LocationCard.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Profile.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/pos/DevicesDialog.jsx",
    "frontend/src/pages/pos/GuardScreen.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/productCache.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/useApi.js"
   ],
   "inbound": 35,
   "outbound": 1
  },
  {
   "id": "frontend/src/utils/auditLabels.js",
   "path": "frontend/src/utils/auditLabels.js",
   "label": "auditLabels.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Nomes das accoes e campos da auditoria (PT/EN); ids escondidos ou trocados pelo nome; dinheiro em MT; pagamento em PT.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Auditoria do dono.",
   "security": "",
   "planned": false,
   "lines": 88,
   "size": 9150,
   "externals": [],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/tests/audit_labels.test.mjs",
    "frontend/tests/i18n.test.mjs"
   ],
   "inbound": 3,
   "outbound": 2
  },
  {
   "id": "frontend/src/utils/code128.js",
   "path": "frontend/src/utils/code128.js",
   "label": "code128.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Numero e codigo de barras do recibo; recibo provisorio sem rede; titulo 2.a via.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Recibos.",
   "security": "",
   "planned": false,
   "lines": 88,
   "size": 4901,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/utils/escpos.js",
    "frontend/src/utils/pdf/receiptPdf.js",
    "frontend/src/utils/receiptImage.js",
    "frontend/src/utils/receiptPrinter.js",
    "frontend/tests/code128.test.mjs",
    "frontend/tests/stock_overlay.test.mjs"
   ],
   "inbound": 7,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/devices.js",
   "path": "frontend/src/utils/devices.js",
   "label": "devices.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Preferencias de dispositivos do aparelho; impressora USB (Web Serial) e Bluetooth (Web Bluetooth).",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou.",
   "role": "Dispositivos.",
   "security": "",
   "planned": false,
   "lines": 126,
   "size": 6173,
   "externals": [],
   "dependsOn": [
    "frontend/src/utils/pdf/deliver.js",
    "frontend/src/i18n/core.js",
    "frontend/src/utils/escpos.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/DevicesDialog.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/utils/receiptPrinter.js"
   ],
   "inbound": 3,
   "outbound": 3
  },
  {
   "id": "frontend/src/utils/escpos.js",
   "path": "frontend/src/utils/escpos.js",
   "label": "escpos.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Puro: recibo ESC/POS (sem acentos, 32 colunas, QR GS ( k, corte). Fase 15.1: logotipo a preto e branco (raster com difusao), codigo de barras CODE128 e impulso da gaveta.",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou. | 27/10/2026 Fase 15.1/15.1b publicadas (9207f9d, 8ae2ab4): verify_system 34 14/14; fase15.mjs 10/10 e flows.mjs 41/41 em genesismz.com; unitarios frontend 58/58.",
   "role": "Impressora de recibos.",
   "security": "",
   "planned": false,
   "lines": 151,
   "size": 7018,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js",
    "frontend/src/utils/units.js",
    "frontend/src/utils/code128.js"
   ],
   "usedBy": [
    "frontend/src/utils/devices.js",
    "frontend/src/utils/receiptPrinter.js",
    "frontend/tests/escpos.test.mjs",
    "frontend/tests/i18n.test.mjs"
   ],
   "inbound": 4,
   "outbound": 3
  },
  {
   "id": "frontend/src/utils/format.js",
   "path": "frontend/src/utils/format.js",
   "label": "format.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 115,
   "size": 4987,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "admin-frontend/src/App.jsx",
    "admin-frontend/src/LiveMap.jsx",
    "frontend/src/components/CopyCatalogDialog.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/components/LiveSales.jsx",
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/components/ui/CountUp.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/NotifyMe.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/GroupPanel.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/LocationCard.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Profile.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/pos/GuardScreen.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/auditLabels.js",
    "frontend/src/utils/notificationText.js",
    "frontend/src/utils/pdf/receiptPdf.js",
    "frontend/src/utils/pdf/reportPdf.js",
    "frontend/src/utils/privacy.jsx",
    "frontend/src/utils/receiptImage.js",
    "frontend/src/utils/timelineText.js",
    "frontend/src/utils/useApi.js",
    "frontend/tests/i18n.test.mjs"
   ],
   "inbound": 43,
   "outbound": 1
  },
  {
   "id": "frontend/src/utils/imageResize.js",
   "path": "frontend/src/utils/imageResize.js",
   "label": "imageResize.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Reduz a foto do dono para WebP/JPEG <= 256 px e < 60 000 caracteres.",
   "notes": "04/10/2026: pos.mjs 21/21 + flows.mjs 24/24 no browser.",
   "role": "Utilitario.",
   "security": "",
   "planned": false,
   "lines": 26,
   "size": 1342,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/owner/ProductDrawer.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/money.js",
   "path": "frontend/src/utils/money.js",
   "label": "money.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "centsToMznInput / mznToCents: toda a conversao de dinheiro do frontend passa aqui.",
   "notes": "",
   "role": "Dinheiro.",
   "security": "Evita o bug de arredondamento que multiplicava valores por 100 duas vezes.",
   "planned": false,
   "lines": 14,
   "size": 341,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/ui/Form.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/notificationText.js",
   "path": "frontend/src/utils/notificationText.js",
   "label": "notificationText.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Titulo e detalhe de cada notificacao na lingua de quem ve.",
   "notes": "18/10/2026 Fase 10.1 (sino do dono): notifications.test 7/7; verify_system 31 23/23; sino.mjs 12/12; regressao idioma_dono 35/35 e flows 40/40. Publicado 9cb2e61 (18/10): sino.mjs 12/12 no site.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 54,
   "size": 3227,
   "externals": [],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/components/NotificationBell.jsx",
    "frontend/tests/i18n.test.mjs"
   ],
   "inbound": 2,
   "outbound": 2
  },
  {
   "id": "frontend/src/utils/offlinePin.js",
   "path": "frontend/src/utils/offlinePin.js",
   "label": "offlinePin.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Verificador PBKDF2 do PIN aceite pelo servidor e copias de ecra (Dexie) para abrir sem rede.",
   "notes": "25/10/2026 Fase 12: offline_pin.test.mjs 7/7.",
   "role": "Terminal e painel sem rede.",
   "security": "",
   "planned": false,
   "lines": 97,
   "size": 4376,
   "externals": [],
   "dependsOn": [
    "frontend/src/db/localDb.js"
   ],
   "usedBy": [
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/session.jsx",
    "frontend/tests/offline_pin.test.mjs"
   ],
   "inbound": 6,
   "outbound": 1
  },
  {
   "id": "frontend/src/utils/offlineQueue.js",
   "path": "frontend/src/utils/offlineQueue.js",
   "label": "offlineQueue.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 69,
   "size": 2803,
   "externals": [],
   "dependsOn": [
    "frontend/src/utils/syncPolicy.js"
   ],
   "usedBy": [
    "frontend/src/hooks/useOfflineSync.js",
    "frontend/tests/offline_queue.test.mjs"
   ],
   "inbound": 2,
   "outbound": 1
  },
  {
   "id": "frontend/src/utils/pdf/deliver.js",
   "path": "frontend/src/utils/pdf/deliver.js",
   "label": "deliver.js",
   "group": "frontend",
   "dir": "frontend/src/utils/pdf",
   "ext": ".js",
   "status": "ok",
   "summary": "Entrega de PDF: folha de partilha no telemovel/tablet, descarga no computador.",
   "notes": "10/10/2026 Fase 8.1: fase8_1.mjs 32/32 no Chromium (descarga no PC, partilha emulada em tablet/iPhone, 0 janelas novas); reports.mjs OK. iPhone real por confirmar.",
   "role": "PDF.",
   "security": "",
   "planned": false,
   "lines": 53,
   "size": 2051,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/PdfButton.jsx",
    "frontend/src/components/PdfReadyDialog.jsx",
    "frontend/src/utils/devices.js",
    "frontend/src/utils/receiptPrinter.js"
   ],
   "inbound": 4,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/pdf/receiptPdf.js",
   "path": "frontend/src/utils/pdf/receiptPdf.js",
   "label": "receiptPdf.js",
   "group": "frontend",
   "dir": "frontend/src/utils/pdf",
   "ext": ".js",
   "status": "ok",
   "summary": "Recibo em PDF no formato de talao (80 mm), com QR.",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou. | 27/10/2026 Fase 15.1/15.1b publicadas (9207f9d, 8ae2ab4): verify_system 34 14/14; fase15.mjs 10/10 e flows.mjs 41/41 em genesismz.com; unitarios frontend 58/58.",
   "role": "PDF.",
   "security": "",
   "planned": false,
   "lines": 141,
   "size": 7498,
   "externals": [
    "jspdf",
    "jspdf-autotable"
   ],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "frontend/src/utils/code128.js",
    "frontend/src/utils/pdf/text.js",
    "frontend/src/i18n/core.js",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/utils/receiptPrinter.js"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/utils/pdf/reportPdf.js",
   "path": "frontend/src/utils/pdf/reportPdf.js",
   "label": "reportPdf.js",
   "group": "frontend",
   "dir": "frontend/src/utils/pdf",
   "ext": ".js",
   "status": "ok",
   "summary": "Relatorio diario/semanal/mensal em PDF A4 com rastreio.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "PDF.",
   "security": "",
   "planned": false,
   "lines": 224,
   "size": 14496,
   "externals": [
    "jspdf",
    "jspdf-autotable"
   ],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "frontend/src/utils/units.js",
    "frontend/src/utils/timelineText.js",
    "frontend/src/utils/pdf/text.js",
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Reports.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/utils/pdf/text.js",
   "path": "frontend/src/utils/pdf/text.js",
   "label": "text.js",
   "group": "frontend",
   "dir": "frontend/src/utils/pdf",
   "ext": ".js",
   "status": "ok",
   "summary": "Texto seguro para o PDF (Latin-1) e nomes de ficheiro validos.",
   "notes": "10/10/2026 Fase 8.1: fase8_1.mjs 32/32 no Chromium (descarga no PC, partilha emulada em tablet/iPhone, 0 janelas novas); reports.mjs OK. iPhone real por confirmar.",
   "role": "PDF.",
   "security": "",
   "planned": false,
   "lines": 22,
   "size": 1126,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/utils/pdf/receiptPdf.js",
    "frontend/src/utils/pdf/reportPdf.js",
    "frontend/src/utils/receiptImage.js"
   ],
   "inbound": 3,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/privacy.jsx",
   "path": "frontend/src/utils/privacy.jsx",
   "label": "privacy.jsx",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Modo privado do painel: esconde os valores em dinheiro (estado no AppShell).",
   "notes": "",
   "role": "Privacidade do dono.",
   "security": "",
   "planned": false,
   "lines": 33,
   "size": 1500,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/format.js"
   ],
   "usedBy": [
    "frontend/src/components/LiveSales.jsx",
    "frontend/src/layouts/AppShell.jsx"
   ],
   "inbound": 2,
   "outbound": 1
  },
  {
   "id": "frontend/src/utils/productCache.js",
   "path": "frontend/src/utils/productCache.js",
   "label": "productCache.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Catalogo guardado no aparelho; stock com a fila descontada.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Terminal sem rede.",
   "security": "",
   "planned": false,
   "lines": 58,
   "size": 2306,
   "externals": [],
   "dependsOn": [
    "frontend/src/db/localDb.js",
    "frontend/src/utils/api.js",
    "frontend/src/utils/syncPolicy.js",
    "frontend/src/utils/stockOverlay.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx"
   ],
   "inbound": 2,
   "outbound": 4
  },
  {
   "id": "frontend/src/utils/receiptImage.js",
   "path": "frontend/src/utils/receiptImage.js",
   "label": "receiptImage.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Recibo em imagem PNG (1176 px) para enviar ao cliente por WhatsApp: logotipo, NUIT, n.o do documento com codigo de barras, QR e mensagem do dono. Desenho testavel com canvas falso.",
   "notes": "27/10/2026 Fase 15.1/15.1b publicadas (9207f9d, 8ae2ab4): verify_system 34 14/14; fase15.mjs 10/10 e flows.mjs 41/41 em genesismz.com; unitarios frontend 58/58.",
   "role": "Recibo (imagem para WhatsApp).",
   "security": "",
   "planned": false,
   "lines": 190,
   "size": 9230,
   "externals": [],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "frontend/src/utils/code128.js",
    "frontend/src/utils/pdf/text.js",
    "frontend/src/i18n/core.js",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/utils/receiptPrinter.js",
    "frontend/tests/receipt_image.test.mjs"
   ],
   "inbound": 2,
   "outbound": 5
  },
  {
   "id": "frontend/src/utils/receiptPrinter.js",
   "path": "frontend/src/utils/receiptPrinter.js",
   "label": "receiptPrinter.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Recibo nos 3 formatos (HTML para imprimir, PDF de talao, ESC/POS) com logotipo, NUIT, telefone, n.o do documento com codigo de barras, QR e mensagem do dono; imagem PNG para WhatsApp (shareReceiptImage). Nunca abre janela nova.",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou. | 27/10/2026 Fase 15.1/15.1b publicadas (9207f9d, 8ae2ab4): verify_system 34 14/14; fase15.mjs 10/10 e flows.mjs 41/41 em genesismz.com; unitarios frontend 58/58.",
   "role": "Recibo (impressao).",
   "security": "Corrigido a 27/09: todo o texto (nome do produto, loja, caixista) passa por esc() e o src do QR e validado como data URL de imagem. Antes, um produto chamado <img onerror=...> executava dentro do documento do dialogo de impressao.",
   "planned": false,
   "lines": 285,
   "size": 15106,
   "externals": [
    "qrcode"
   ],
   "dependsOn": [
    "frontend/src/utils/pdf/deliver.js",
    "frontend/src/utils/escpos.js",
    "frontend/src/utils/code128.js",
    "frontend/src/utils/devices.js",
    "frontend/src/i18n/core.js",
    "frontend/src/utils/units.js",
    "frontend/src/utils/pdf/receiptPdf.js",
    "frontend/src/utils/receiptImage.js"
   ],
   "usedBy": [
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx"
   ],
   "inbound": 3,
   "outbound": 8
  },
  {
   "id": "frontend/src/utils/search.js",
   "path": "frontend/src/utils/search.js",
   "label": "search.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Pesquisa sem acentos nem maiusculas (foldText/nameMatches): acucar encontra Açúcar.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Pesquisa de produtos (POS, quebra/pedido, Produtos do dono).",
   "security": "",
   "planned": false,
   "lines": 20,
   "size": 979,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/tests/search.test.mjs"
   ],
   "inbound": 4,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/session.jsx",
   "path": "frontend/src/utils/session.jsx",
   "label": "session.jsx",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".jsx",
   "status": "ok",
   "summary": "",
   "notes": "25/10/2026 Fase 12: sem rede usa o ultimo utilizador; apaga a cache genesis-api ao sair/trocar de conta; RequireOwner com PanelLockGate.",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 90,
   "size": 4511,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/i18n/core.js",
    "frontend/src/utils/offlinePin.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/components/PanelLock.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/GroupPanel.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/Settings.jsx"
   ],
   "inbound": 11,
   "outbound": 5
  },
  {
   "id": "frontend/src/utils/stockOverlay.js",
   "path": "frontend/src/utils/stockOverlay.js",
   "label": "stockOverlay.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Desconta do stock do servidor as vendas e quebras ainda por enviar deste terminal.",
   "notes": "30/10/2026: unitarios 116+76, verify_system 2/6/10/11/40/41 154/154 + 42 15/15, correcoes_3010.mjs 20/20, site.mjs 55/55, pedir_conta 9/9 (local, Supabase).",
   "role": "Terminal sem rede.",
   "security": "",
   "planned": false,
   "lines": 13,
   "size": 871,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/utils/productCache.js",
    "frontend/tests/stock_overlay.test.mjs"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/syncPolicy.js",
   "path": "frontend/src/utils/syncPolicy.js",
   "label": "syncPolicy.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 49,
   "size": 2119,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/CopyCatalogDialog.jsx",
    "frontend/src/components/EstablishmentSwitcher.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/utils/offlineQueue.js",
    "frontend/src/utils/productCache.js",
    "frontend/tests/offline_queue.test.mjs"
   ],
   "inbound": 7,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/timelineText.js",
   "path": "frontend/src/utils/timelineText.js",
   "label": "timelineText.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Texto de cada movimento do rastreio, partilhado pelo ecra e pelo PDF.",
   "notes": "17/10/2026 Fase 9.4 (paginas do dono em ingles): idioma_dono.mjs 28/28, i18n.test.mjs 9/9, verify_system 15/27 OK; regressao PT (12 testes de browser) passou.",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 83,
   "size": 4702,
   "externals": [],
   "dependsOn": [
    "frontend/src/utils/format.js",
    "frontend/src/i18n/core.js",
    "frontend/src/utils/units.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/utils/pdf/reportPdf.js",
    "frontend/tests/i18n.test.mjs"
   ],
   "inbound": 3,
   "outbound": 3
  },
  {
   "id": "frontend/src/utils/units.js",
   "path": "frontend/src/utils/units.js",
   "label": "units.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 53,
   "size": 2442,
   "externals": [],
   "dependsOn": [
    "frontend/src/i18n/core.js"
   ],
   "usedBy": [
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/owner/AuditLogPage.jsx",
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/pos/GuardScreen.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/utils/escpos.js",
    "frontend/src/utils/pdf/receiptPdf.js",
    "frontend/src/utils/pdf/reportPdf.js",
    "frontend/src/utils/receiptImage.js",
    "frontend/src/utils/receiptPrinter.js",
    "frontend/src/utils/timelineText.js",
    "frontend/tests/units.test.mjs"
   ],
   "inbound": 19,
   "outbound": 1
  },
  {
   "id": "frontend/src/utils/useApi.js",
   "path": "frontend/src/utils/useApi.js",
   "label": "useApi.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 31,
   "size": 1253,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js"
   ],
   "usedBy": [
    "frontend/src/components/NotificationBell.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/GroupPanel.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/ProductDrawer.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Profile.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx"
   ],
   "inbound": 13,
   "outbound": 2
  },
  {
   "id": "frontend/tailwind.config.js",
   "path": "frontend/tailwind.config.js",
   "label": "tailwind.config.js",
   "group": "frontend-pub",
   "dir": "frontend",
   "ext": ".js",
   "status": "ok",
   "summary": "Tailwind com darkMode por [data-theme=\"dark\"] e as cores do Genesis.",
   "notes": "Nenhum ficheiro usa classes `dark:`: mudar data-theme nao rebenta nada.",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 47,
   "size": 2105,
   "externals": [
    "tailwindcss"
   ],
   "dependsOn": [],
   "usedBy": [
    "admin-frontend/tailwind.config.cjs",
    "frontend/tailwind.site.config.js"
   ],
   "inbound": 2,
   "outbound": 0
  },
  {
   "id": "frontend/tailwind.site.config.js",
   "path": "frontend/tailwind.site.config.js",
   "label": "tailwind.site.config.js",
   "group": "infra",
   "dir": "frontend",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 29,
   "size": 969,
   "externals": [
    "tailwindcss"
   ],
   "dependsOn": [
    "frontend/tailwind.config.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/termos.html",
   "path": "frontend/termos.html",
   "label": "termos.html",
   "group": "infra",
   "dir": "frontend",
   "ext": ".html",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 160,
   "size": 15588,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/audit_labels.test.mjs",
   "path": "frontend/tests/audit_labels.test.mjs",
   "label": "audit_labels.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 73,
   "size": 3799,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "frontend/src/i18n/core.js",
    "frontend/src/utils/auditLabels.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "frontend/tests/code128.test.mjs",
   "path": "frontend/tests/code128.test.mjs",
   "label": "code128.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2475,
   "externals": [
    "node:test",
    "node:assert",
    "@zxing/library"
   ],
   "dependsOn": [
    "frontend/src/utils/code128.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/tests/e2e/correcoes_3010.mjs",
   "path": "frontend/tests/e2e/correcoes_3010.mjs",
   "label": "correcoes_3010.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 164,
   "size": 11005,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/correcoes_3110.mjs",
   "path": "frontend/tests/e2e/correcoes_3110.mjs",
   "label": "correcoes_3110.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "E2E das correccoes de 31/10 (2.o estabelecimento, esqueci o PIN, dois separadores, horario, guarda, copiar).",
   "notes": "31/10/2026 E1: 11/11 em genesismz.com, sem erros de JS.",
   "role": "Prova no browser.",
   "security": "",
   "planned": false,
   "lines": 160,
   "size": 10784,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/etapaA.mjs",
   "path": "frontend/tests/e2e/etapaA.mjs",
   "label": "etapaA.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 176,
   "size": 10744,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/etapaC.mjs",
   "path": "frontend/tests/e2e/etapaC.mjs",
   "label": "etapaC.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 113,
   "size": 7511,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/etapaD.mjs",
   "path": "frontend/tests/e2e/etapaD.mjs",
   "label": "etapaD.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 86,
   "size": 5508,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase12.mjs",
   "path": "frontend/tests/e2e/fase12.mjs",
   "label": "fase12.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Teste de browser da Fase 12 (Google, bloqueio, Face ID, terminal e painel sem rede, telemovel/tablet).",
   "notes": "25/10: 29/29 no build local e em genesismz.com.",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 295,
   "size": 16866,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase13.mjs",
   "path": "frontend/tests/e2e/fase13.mjs",
   "label": "fase13.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Teste de browser da Fase 13 (Inicio, animacao, modo privado, telemovel).",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 110,
   "size": 6686,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase15.mjs",
   "path": "frontend/tests/e2e/fase15.mjs",
   "label": "fase15.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 198,
   "size": 13724,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase16.mjs",
   "path": "frontend/tests/e2e/fase16.mjs",
   "label": "fase16.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 126,
   "size": 7570,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase5.mjs",
   "path": "frontend/tests/e2e/fase5.mjs",
   "label": "fase5.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 141,
   "size": 9150,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase8_1.mjs",
   "path": "frontend/tests/e2e/fase8_1.mjs",
   "label": "fase8_1.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Teste de browser da Fase 8.1 (ranking, PDF, recibo sem janela nova, 390 px).",
   "notes": "10/10/2026 Fase 8.1: fase8_1.mjs 32/32 no Chromium (descarga no PC, partilha emulada em tablet/iPhone, 0 janelas novas); reports.mjs OK. iPhone real por confirmar.",
   "role": "Testes.",
   "security": "",
   "planned": false,
   "lines": 205,
   "size": 14580,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase8_2.mjs",
   "path": "frontend/tests/e2e/fase8_2.mjs",
   "label": "fase8_2.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Teste de browser da Fase 8.2 (formulario, validades, botao Stock, sugestoes no admin).",
   "notes": "10/10/2026 Fase 8.2: verify_system 20 (32/32) + fase8_2.mjs no browser (dono no PC e iPhone 390 px, super admin).",
   "role": "Testes.",
   "security": "",
   "planned": false,
   "lines": 151,
   "size": 10185,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase8_4.mjs",
   "path": "frontend/tests/e2e/fase8_4.mjs",
   "label": "fase8_4.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: vendas perdidas no terminal (iPhone), Relatorios do dono e Pedidos de clientes no admin.",
   "notes": "11/10/2026: passou.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 139,
   "size": 8588,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase8_5.mjs",
   "path": "frontend/tests/e2e/fase8_5.mjs",
   "label": "fase8_5.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: auditoria do dono (filtros, detalhe, retencao, iPhone).",
   "notes": "11/10/2026: 16/16.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 123,
   "size": 7709,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase8_7.mjs",
   "path": "frontend/tests/e2e/fase8_7.mjs",
   "label": "fase8_7.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: horarios dos relatorios nas Definicoes.",
   "notes": "11/10/2026: 7/7.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 74,
   "size": 4720,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fase8_8.mjs",
   "path": "frontend/tests/e2e/fase8_8.mjs",
   "label": "fase8_8.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: dispositivos, camara falsa, impressoras simuladas, PDF.",
   "notes": "11/10/2026: 19/19.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 240,
   "size": 16494,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/fecho_mes.mjs",
   "path": "frontend/tests/e2e/fecho_mes.mjs",
   "label": "fecho_mes.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 103,
   "size": 5655,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/flows.mjs",
   "path": "frontend/tests/e2e/flows.mjs",
   "label": "flows.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 320,
   "size": 19347,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test",
    "qrcode"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/guarda.mjs",
   "path": "frontend/tests/e2e/guarda.mjs",
   "label": "guarda.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 125,
   "size": 7062,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/idioma.mjs",
   "path": "frontend/tests/e2e/idioma.mjs",
   "label": "idioma.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: entrada, dono (2 aparelhos), terminal telemovel e computador.",
   "notes": "17/10/2026 Fase 9.5 (terminal em ingles; X de Dispositivos): idioma_pos.mjs 28/28 (+contraprova do X), i18n.test.mjs 11/11, escpos 4/4, verify_system 4/6/7/8/21/27/29 OK; regressao pos/flows/fase8_8/fase5/idioma passou.",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 191,
   "size": 12940,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/idioma_dono.mjs",
   "path": "frontend/tests/e2e/idioma_dono.mjs",
   "label": "idioma_dono.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: dono em ingles, 19 paginas + 5 gavetas sem portugues residual; mensal no iPhone.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 168,
   "size": 11381,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/idioma_pos.mjs",
   "path": "frontend/tests/e2e/idioma_pos.mjs",
   "label": "idioma_pos.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Browser: terminal em ingles (venda, dialogos, Dispositivos, recibo PDF e ESC/POS), X que nao apaga a impressora; iPhone.",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Teste E2E.",
   "security": "",
   "planned": false,
   "lines": 229,
   "size": 15957,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/onboarding.mjs",
   "path": "frontend/tests/e2e/onboarding.mjs",
   "label": "onboarding.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 128,
   "size": 7685,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/pedir_conta.mjs",
   "path": "frontend/tests/e2e/pedir_conta.mjs",
   "label": "pedir_conta.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 68,
   "size": 4276,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/pos.mjs",
   "path": "frontend/tests/e2e/pos.mjs",
   "label": "pos.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 170,
   "size": 10170,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/pwa_offline.mjs",
   "path": "frontend/tests/e2e/pwa_offline.mjs",
   "label": "pwa_offline.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 55,
   "size": 2915,
   "externals": [
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/reports.mjs",
   "path": "frontend/tests/e2e/reports.mjs",
   "label": "reports.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 137,
   "size": 8949,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/sino.mjs",
   "path": "frontend/tests/e2e/sino.mjs",
   "label": "sino.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 106,
   "size": 6189,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/site.mjs",
   "path": "frontend/tests/e2e/site.mjs",
   "label": "site.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 175,
   "size": 10877,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/e2e/stock.mjs",
   "path": "frontend/tests/e2e/stock.mjs",
   "label": "stock.mjs",
   "group": "frontend",
   "dir": "frontend/tests/e2e",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Teste de browser do separador Stock (Ajuste Adicionar/Retirar, Entrada de stock = produto novo, validades, iPhone).",
   "notes": "10/10/2026 Fase 8.3-B: verify_system 22 (18/18) + stock.mjs no browser (PC e iPhone 390 px).",
   "role": "Testes.",
   "security": "",
   "planned": false,
   "lines": 152,
   "size": 10480,
   "externals": [
    "node:fs",
    "node:path",
    "@playwright/test"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/escpos.test.mjs",
   "path": "frontend/tests/escpos.test.mjs",
   "label": "escpos.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 83,
   "size": 4415,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "frontend/src/utils/escpos.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/tests/i18n.test.mjs",
   "path": "frontend/tests/i18n.test.mjs",
   "label": "i18n.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "ok",
   "summary": "Teste unitario da lingua (t, formatos, erros do servidor, cobertura das chaves).",
   "notes": "18/10/2026 Fase 9.6-9.8 (PDFs/WhatsApp/emails, admin, catalogo-mestre e pesquisa em PT/EN): unitarios todos a passar; verify_system 25+30 26/26; idioma_admin 17/17, idioma_pos 31/31, idioma_dono 35/35; regressao PT passou. Publicado f525726 (18/10) e testado no site: idioma_pos 31/31, idioma_dono 35/35, idioma_admin 17/17, fase8_6 8/8.",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 222,
   "size": 13365,
   "externals": [
    "node:test",
    "node:assert",
    "node:fs",
    "node:path",
    "node:url"
   ],
   "dependsOn": [
    "frontend/src/i18n/core.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/timelineText.js",
    "frontend/src/utils/auditLabels.js",
    "frontend/src/utils/escpos.js",
    "frontend/src/utils/notificationText.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 6
  },
  {
   "id": "frontend/tests/notfound.test.mjs",
   "path": "frontend/tests/notfound.test.mjs",
   "label": "notfound.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 39,
   "size": 2207,
   "externals": [
    "node:test",
    "node:assert",
    "node:fs",
    "node:path",
    "node:child_process",
    "node:url"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/offline_pin.test.mjs",
   "path": "frontend/tests/offline_pin.test.mjs",
   "label": "offline_pin.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 77,
   "size": 3765,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "frontend/src/db/localDb.js",
    "frontend/src/utils/offlinePin.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "frontend/tests/offline_queue.test.mjs",
   "path": "frontend/tests/offline_queue.test.mjs",
   "label": "offline_queue.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 122,
   "size": 6222,
   "externals": [
    "node:test",
    "node:assert",
    "dexie"
   ],
   "dependsOn": [
    "frontend/src/utils/syncPolicy.js",
    "frontend/src/utils/offlineQueue.js",
    "frontend/src/db/localDb.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 3
  },
  {
   "id": "frontend/tests/playwright_offline_sync_test.js",
   "path": "frontend/tests/playwright_offline_sync_test.js",
   "label": "playwright_offline_sync_test.js",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Teste Playwright da sincronizacao offline do POS.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 104,
   "size": 3718,
   "externals": [
    "playwright",
    "node-fetch"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/tests/receipt_image.test.mjs",
   "path": "frontend/tests/receipt_image.test.mjs",
   "label": "receipt_image.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 76,
   "size": 3902,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "frontend/src/utils/receiptImage.js",
    "frontend/src/i18n/core.js",
    "frontend/src/i18n/en/common.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 3
  },
  {
   "id": "frontend/tests/search.test.mjs",
   "path": "frontend/tests/search.test.mjs",
   "label": "search.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1822,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "frontend/src/utils/search.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/tests/site.test.mjs",
   "path": "frontend/tests/site.test.mjs",
   "label": "site.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 157,
   "size": 8809,
   "externals": [
    "node:test",
    "node:assert",
    "node:fs",
    "node:path"
   ],
   "dependsOn": [
    "frontend/site/build.js",
    "frontend/site/config.js",
    "frontend/site/textos.pt.js",
    "frontend/site/textos.en.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 4
  },
  {
   "id": "frontend/tests/stock_overlay.test.mjs",
   "path": "frontend/tests/stock_overlay.test.mjs",
   "label": "stock_overlay.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 51,
   "size": 2533,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "frontend/src/utils/stockOverlay.js",
    "frontend/src/utils/code128.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "frontend/tests/units.test.mjs",
   "path": "frontend/tests/units.test.mjs",
   "label": "units.test.mjs",
   "group": "frontend",
   "dir": "frontend/tests",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 43,
   "size": 1766,
   "externals": [
    "node:test",
    "node:assert",
    "node:module"
   ],
   "dependsOn": [
    "frontend/src/utils/units.js",
    "frontend/src/i18n/core.js",
    "backend/src/utils/units.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 3
  },
  {
   "id": "frontend/vite.config.js",
   "path": "frontend/vite.config.js",
   "label": "vite.config.js",
   "group": "frontend-pub",
   "dir": "frontend",
   "ext": ".js",
   "status": "ok",
   "summary": "Vite multi-pagina (site + app), plugin de rotas no dev/preview, proxy da API, PWA (fallback app.html, start_url /inicio).",
   "notes": "24/10/2026 Fase 11.1: pwa_offline.mjs 8/8 + contraprova.",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 114,
   "size": 5631,
   "externals": [
    "vite",
    "node:url",
    "vite-plugin-pwa"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "gerir-contas.bat",
   "path": "gerir-contas.bat",
   "label": "gerir-contas.bat",
   "group": "infra",
   "dir": ".",
   "ext": ".bat",
   "status": "ok",
   "summary": "Atalho de Windows para o script de gestao de contas: localiza o Node.js (incluindo os locais habituais se nao estiver no PATH), avisa se faltar o backend/node_modules e arranca o menu interactivo.",
   "notes": "Define UV_THREADPOOL_SIZE=16 para acelerar as comparacoes bcrypt. Passa os argumentos ao script, por isso tambem aceita --list, --verificar e --definir.",
   "role": "Infra de administracao.",
   "security": "",
   "planned": false,
   "lines": 70,
   "size": 2163,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "gerir-contas.sh",
   "path": "gerir-contas.sh",
   "label": "gerir-contas.sh",
   "group": "infra",
   "dir": ".",
   "ext": ".sh",
   "status": "ok",
   "summary": "Atalho Linux/macOS para o script de gestao de contas: verifica o Node.js e as dependencias e arranca o menu interactivo.",
   "notes": "Equivalente exacto ao .bat, com export UV_THREADPOOL_SIZE=16 para acelerar o bcrypt.",
   "role": "Infra de administracao.",
   "security": "",
   "planned": false,
   "lines": 41,
   "size": 1241,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "oque falar.txt",
   "path": "oque falar.txt",
   "label": "oque falar.txt",
   "group": "infra",
   "dir": ".",
   "ext": ".txt",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 1,
   "size": 2732,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "plan.md",
   "path": "plan.md",
   "label": "plan.md",
   "group": "docs",
   "dir": ".",
   "ext": ".md",
   "status": "ok",
   "summary": "Plano de implementacao do Genesis: estado, frentes de trabalho, decisoes e riscos declarados.",
   "notes": "",
   "role": "Documentacao.",
   "security": "",
   "planned": false,
   "lines": 700,
   "size": 40298,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "docs/README_INSTALACAO.md"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "run-admin.ps1",
   "path": "run-admin.ps1",
   "label": "run-admin.ps1",
   "group": "infra",
   "dir": ".",
   "ext": ".ps1",
   "status": "ok",
   "summary": "Launcher do painel de super admin em PowerShell.",
   "notes": "",
   "role": "Infra.",
   "security": "",
   "planned": false,
   "lines": 9,
   "size": 198,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "run-admin.sh",
   "path": "run-admin.sh",
   "label": "run-admin.sh",
   "group": "infra",
   "dir": ".",
   "ext": ".sh",
   "status": "ok",
   "summary": "Launcher do painel de super admin em shell.",
   "notes": "",
   "role": "Infra.",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1138,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "run-localhost.sh",
   "path": "run-localhost.sh",
   "label": "run-localhost.sh",
   "group": "scripts",
   "dir": ".",
   "ext": ".sh",
   "status": "ok",
   "summary": "Launcher local: arranca backend, frontend e admin-frontend e abre o browser quando o frontend responde.",
   "notes": "",
   "role": "Infra.",
   "security": "",
   "planned": false,
   "lines": 5,
   "size": 84,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "docs/README_INSTALACAO.md"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "run-open-admin.sh",
   "path": "run-open-admin.sh",
   "label": "run-open-admin.sh",
   "group": "infra",
   "dir": ".",
   "ext": ".sh",
   "status": "ok",
   "summary": "Launcher do painel de super admin em shell.",
   "notes": "",
   "role": "Infra.",
   "security": "",
   "planned": false,
   "lines": 17,
   "size": 467,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "scripts/backup_claude.mjs",
   "path": "scripts/backup_claude.mjs",
   "label": "backup_claude.mjs",
   "group": "scripts",
   "dir": "scripts",
   "ext": ".mjs",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 51,
   "size": 2207,
   "externals": [
    "node:fs",
    "node:os",
    "node:path",
    "node:url"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "scripts/gen_mindmap_data.js",
   "path": "scripts/gen_mindmap_data.js",
   "label": "gen_mindmap_data.js",
   "group": "scripts",
   "dir": "scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Gerador dos dados do Mapa Mental 3D: varre o repositorio, extrai import/require, resolve para ficheiros reais e cruza com o mapa curado.",
   "notes": "Reescrever sempre que o mapa curado mudar: node scripts/gen_mindmap_data.js",
   "role": "Ferramenta de documentacao.",
   "security": "",
   "planned": false,
   "lines": 398,
   "size": 14845,
   "externals": [
    "fs",
    "path"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "scripts/run_playwright_docker.sh",
   "path": "scripts/run_playwright_docker.sh",
   "label": "run_playwright_docker.sh",
   "group": "scripts",
   "dir": "scripts",
   "ext": ".sh",
   "status": "ok",
   "summary": "Corre os testes Playwright num contentor, para ambientes sem browser instalado.",
   "notes": "",
   "role": "Automatismo.",
   "security": "",
   "planned": false,
   "lines": 27,
   "size": 1020,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/src/services/report.service.js",
   "path": "backend/src/services/report.service.js",
   "label": "report.service.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "planned",
   "summary": "Servico de relatorios (diario/semanal/mensal) extraido das rotas, com uma unica formula testavel do lucro liquido.",
   "notes": "Hoje a formula vive dentro do owner.js. Extrair reduz o risco de divergencia entre relatorios.",
   "role": "Refactor planeado.",
   "security": "",
   "planned": true,
   "lines": 0,
   "size": 0,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/services/monthlyDeductions.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "backend/src/jobs/dailyDigest.js",
   "path": "backend/src/jobs/dailyDigest.js",
   "label": "dailyDigest.js",
   "group": "backend",
   "dir": "backend/src/jobs",
   "ext": ".js",
   "status": "planned",
   "summary": "Tarefa agendada que envia ao dono, no fim do dia, o resumo de vendas, alertas de stock e diferencas de fecho.",
   "notes": "Depende do mailer configurado e do whatsapp.",
   "role": "Nao implementado.",
   "security": "",
   "planned": true,
   "lines": 0,
   "size": 0,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/mailer.js",
    "backend/src/utils/whatsapp.js",
    "backend/src/services/tenantAlerts.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 3
  },
  {
   "id": "backend/prisma/migrations/postgres/0001_init/migration.sql",
   "path": "backend/prisma/migrations/postgres/0001_init/migration.sql",
   "label": "migration.sql",
   "group": "backend-data",
   "dir": "backend/prisma/migrations/postgres/0001_init",
   "ext": ".sql",
   "status": "planned",
   "summary": "Migracao inicial limpa para PostgreSQL, em tipos de Postgres, com as politicas de RLS aplicadas.",
   "notes": "Enquanto nao existir, o backend corre em SQLite local.",
   "role": "Pendente.",
   "security": "",
   "planned": true,
   "lines": 0,
   "size": 0,
   "externals": [],
   "dependsOn": [
    "backend/prisma/schema.prisma",
    "backend/prisma/rls_policies.sql"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/src/pages/CodeMap.jsx",
   "path": "frontend/src/pages/CodeMap.jsx",
   "label": "CodeMap.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "planned",
   "summary": "Versao do mapa 3D dentro da propria aplicacao, alimentada pelo mesmo mapa_mental_data.js.",
   "notes": "O mapa independente (Mapa Mental/mapa_mental_3d.html) ja existe e e a versao oficial.",
   "role": "Ferramenta interna planeada.",
   "security": "",
   "planned": true,
   "lines": 0,
   "size": 0,
   "externals": [],
   "dependsOn": [
    "Mapa Mental/mapa_mental_data.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "docs/README_INSTALACAO.md",
   "path": "docs/README_INSTALACAO.md",
   "label": "README_INSTALACAO.md",
   "group": "docs",
   "dir": "docs",
   "ext": ".md",
   "status": "planned",
   "summary": "Guia de instalacao e arranque: dependencias, .env, base de dados, portas e verificacoes.",
   "notes": "",
   "role": "Documentacao planeada.",
   "security": "",
   "planned": true,
   "lines": 0,
   "size": 0,
   "externals": [],
   "dependsOn": [
    "plan.md",
    "run-localhost.sh"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  }
 ],
 "links": [
  {
   "source": "admin-frontend/src/App.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "admin-frontend/src/App.jsx",
   "target": "admin-frontend/src/accountCard.js"
  },
  {
   "source": "admin-frontend/src/App.jsx",
   "target": "admin-frontend/src/LiveMap.jsx"
  },
  {
   "source": "admin-frontend/src/LiveMap.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "admin-frontend/src/accountCard.js",
   "target": "frontend/src/ui/marca.js"
  },
  {
   "source": "admin-frontend/src/i18n_en.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "admin-frontend/src/main.jsx",
   "target": "admin-frontend/src/App.jsx"
  },
  {
   "source": "admin-frontend/src/main.jsx",
   "target": "admin-frontend/src/index.css"
  },
  {
   "source": "admin-frontend/tailwind.config.cjs",
   "target": "frontend/tailwind.config.js"
  },
  {
   "source": "backend/scripts/apply_master_en.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/apply_master_en.js",
   "target": "backend/scripts/master_catalog_en.json"
  },
  {
   "source": "backend/scripts/check_mail.js",
   "target": "backend/src/utils/mailer.js"
  },
  {
   "source": "backend/scripts/create_system_user.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/create_test_tenant.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/e2e_admin_fixture.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/e2e_fixture.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/ensure_device_keys.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/gerir_contas.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/limpar_teste.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/seed_demo.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/seed_master_catalogs.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/shift_closing_e2e.js",
   "target": "backend/src/utils/dbEngine2.js"
  },
  {
   "source": "backend/scripts/shift_closing_e2e.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/test_google.js",
   "target": "backend/src/routes/auth.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/services/expiryJob.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/services/auditRetention.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/auditGroups.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/shiftLock.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/services/reportJob.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/services/notifications.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/services/overview.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/shift.js"
  },
  {
   "source": "backend/scripts/verify_system.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/auth.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/admin.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/sales.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/catalogs.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/products.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/owner.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/dashboard.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/inventory.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/demand_captures.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/shrinkage_records.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/middleware/adminOriginCheck.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/refresh.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/settings.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/shoppingLists.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/pos.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/panelLock.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/profile.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/middleware/posWriteAuth.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/verify.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/guard.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/establishments.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/onboarding.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/waitlist.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/services/expiryJob.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/services/auditRetention.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/services/reportJob.js"
  },
  {
   "source": "backend/src/middleware/auth.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/middleware/auth.js",
   "target": "backend/src/utils/tenantStatus.js"
  },
  {
   "source": "backend/src/middleware/auth.js",
   "target": "backend/src/utils/sessionScopes.js"
  },
  {
   "source": "backend/src/middleware/auth.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/middleware/auth.js",
   "target": "backend/src/utils/panelLock.js"
  },
  {
   "source": "backend/src/middleware/auth.js",
   "target": "backend/src/utils/actingTenant.js"
  },
  {
   "source": "backend/src/middleware/posWriteAuth.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/middleware/posWriteAuth.js",
   "target": "backend/src/middleware/terminalAuth.js"
  },
  {
   "source": "backend/src/middleware/posWriteAuth.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/middleware/posWriteAuth.js",
   "target": "backend/src/utils/terminals.js"
  },
  {
   "source": "backend/src/middleware/posWriteAuth.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/middleware/terminalAuth.js",
   "target": "backend/src/utils/terminals.js"
  },
  {
   "source": "backend/src/middleware/terminalAuth.js",
   "target": "backend/src/utils/tenantStatus.js"
  },
  {
   "source": "backend/src/middleware/terminalAuth.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/tenantStatus.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/supportCodes.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/productIcons.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/lostRequests.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/services/plans.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/businessTypes.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/services/passwordResetStore.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/whatsapp.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/mailer.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/panelLock.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/ownerSelf.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/actingTenant.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/supportCodes.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/auth.js",
   "target": "backend/src/utils/businessTypes.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/utils/productImage.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/utils/productIcons.js"
  },
  {
   "source": "backend/src/routes/catalogs.js",
   "target": "backend/src/utils/businessTypes.js"
  },
  {
   "source": "backend/src/routes/dashboard.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/dashboard.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/dashboard.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/demand_captures.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/demand_captures.js",
   "target": "backend/src/utils/tenantRls.js"
  },
  {
   "source": "backend/src/routes/demand_captures.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/demand_captures.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/actingTenant.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/ownerSelf.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/tenantStatus.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/routes/establishments.js",
   "target": "backend/src/utils/businessTypes.js"
  },
  {
   "source": "backend/src/routes/guard.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/guard.js",
   "target": "backend/src/utils/peopleNames.js"
  },
  {
   "source": "backend/src/routes/guard.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/guard.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/guard.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/guard.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/guard.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/utils/peopleNames.js"
  },
  {
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/utils/stockLots.js"
  },
  {
   "source": "backend/src/routes/onboarding.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/onboarding.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/onboarding.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/onboarding.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/onboarding.js",
   "target": "backend/src/utils/businessTypes.js"
  },
  {
   "source": "backend/src/routes/onboarding.js",
   "target": "backend/src/routes/catalogs.js"
  },
  {
   "source": "backend/src/routes/onboarding.js",
   "target": "backend/src/utils/hours.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/peopleNames.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/whatsapp.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/services/tenantAlerts.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/services/notifications.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/services/overview.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/services/reports.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/shiftLock.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/terminals.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/services/monthClose.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/auditGroups.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/utils/panelLock.js"
  },
  {
   "source": "backend/src/routes/panelLock.js",
   "target": "backend/src/utils/ownerSelf.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/middleware/terminalAuth.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/terminals.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/shiftLock.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/shift.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/authPin.js"
  },
  {
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/tenantStatus.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/utils/productImage.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/utils/stockLots.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/utils/productIcons.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/utils/masterNames.js"
  },
  {
   "source": "backend/src/routes/products.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/panelLock.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/mailer.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/shiftDay.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/services/plans.js"
  },
  {
   "source": "backend/src/routes/profile.js",
   "target": "backend/src/utils/ownerSelf.js"
  },
  {
   "source": "backend/src/routes/refresh.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/routes/refresh.js",
   "target": "backend/src/utils/sessionUser.js"
  },
  {
   "source": "backend/src/routes/refresh.js",
   "target": "backend/src/utils/tenantStatus.js"
  },
  {
   "source": "backend/src/routes/refresh.js",
   "target": "backend/src/utils/actingTenant.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/peopleNames.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/shiftLock.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/shift.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/authPin.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/tenantRls.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/paymentMethods.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/stockLots.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/services/tax.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/salePayments.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/ownerSelf.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/hours.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/tenantHours.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/services/tax.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/services/monthlyDeductions.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/geo.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/auditGroups.js"
  },
  {
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/services/reportJob.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/services/reports.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/services/shoppingList.js"
  },
  {
   "source": "backend/src/routes/shoppingLists.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/routes/shrinkage_records.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/shrinkage_records.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/routes/shrinkage_records.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/routes/shrinkage_records.js",
   "target": "backend/src/utils/tenantRls.js"
  },
  {
   "source": "backend/src/routes/shrinkage_records.js",
   "target": "backend/src/utils/stockLots.js"
  },
  {
   "source": "backend/src/routes/verify.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/verify.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/waitlist.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/waitlist.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/routes/waitlist.js",
   "target": "backend/src/utils/businessTypes.js"
  },
  {
   "source": "backend/src/services/auditRetention.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/auditRetention.js",
   "target": "backend/src/utils/auditGroups.js"
  },
  {
   "source": "backend/src/services/expiryJob.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/expiryJob.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/services/notifications.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/notifications.js",
   "target": "backend/src/utils/peopleNames.js"
  },
  {
   "source": "backend/src/services/notifications.js",
   "target": "backend/src/utils/hours.js"
  },
  {
   "source": "backend/src/services/notifications.js",
   "target": "backend/src/utils/tenantHours.js"
  },
  {
   "source": "backend/src/services/notifications.js",
   "target": "backend/src/services/tenantAlerts.js"
  },
  {
   "source": "backend/src/services/notifications.js",
   "target": "backend/src/utils/shiftLock.js"
  },
  {
   "source": "backend/src/services/notifications.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/peopleNames.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/hours.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/tenantHours.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/shift.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/shiftLock.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/services/overview.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/services/plans.js",
   "target": "backend/src/utils/shiftDay.js"
  },
  {
   "source": "backend/src/services/reportJob.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/reportJob.js",
   "target": "backend/src/services/reportSchedule.js"
  },
  {
   "source": "backend/src/services/reportJob.js",
   "target": "backend/src/services/reports.js"
  },
  {
   "source": "backend/src/services/reportJob.js",
   "target": "backend/src/utils/whatsapp.js"
  },
  {
   "source": "backend/src/services/reportJob.js",
   "target": "backend/src/services/shoppingList.js"
  },
  {
   "source": "backend/src/services/reportSchedule.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/services/reportSchedule.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/peopleNames.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/hours.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/tenantHours.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/services/monthlyDeductions.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/services/tax.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/services/restock.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/services/ranking.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/lostRequests.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/salePayments.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/shift.js"
  },
  {
   "source": "backend/src/services/restock.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/services/shoppingList.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/services/shoppingList.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/services/tax.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/services/tenantAlerts.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/tenantAlerts.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/services/tenantAlerts.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/services/tenantAlerts.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/utils/actingTenant.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/audit.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/auditGroups.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/utils/authPin.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/authPin.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/utils/authPin.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/utils/lostRequests.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/src/utils/mailer.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/src/utils/masterNames.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/masterNames.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/src/utils/ownerSelf.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/ownerSelf.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/utils/panelLock.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/utils/peopleNames.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/prisma.js",
   "target": "backend/src/utils/dbEngine2.js"
  },
  {
   "source": "backend/src/utils/salePayments.js",
   "target": "backend/src/utils/paymentMethods.js"
  },
  {
   "source": "backend/src/utils/salePayments.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/utils/sessionUser.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/sessionUser.js",
   "target": "backend/src/utils/tokens.js"
  },
  {
   "source": "backend/src/utils/shift.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/shift.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/src/utils/shift.js",
   "target": "backend/src/utils/shiftLock.js"
  },
  {
   "source": "backend/src/utils/shift.js",
   "target": "backend/src/utils/audit.js"
  },
  {
   "source": "backend/src/utils/shift.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/utils/shift.js",
   "target": "backend/src/utils/shiftDay.js"
  },
  {
   "source": "backend/src/utils/shiftDay.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/utils/stockLots.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/utils/tenantHours.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/tenantHours.js",
   "target": "backend/src/utils/hours.js"
  },
  {
   "source": "backend/src/utils/tenantStatus.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/terminals.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/tests/auditGroups.test.js",
   "target": "backend/src/utils/auditGroups.js"
  },
  {
   "source": "backend/tests/catalogSuggestions.test.js",
   "target": "backend/src/utils/catalogSuggestions.js"
  },
  {
   "source": "backend/tests/fefo.test.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/tests/geo.test.js",
   "target": "backend/src/utils/geo.js"
  },
  {
   "source": "backend/tests/guard.test.js",
   "target": "backend/src/routes/guard.js"
  },
  {
   "source": "backend/tests/hours.test.js",
   "target": "backend/src/utils/hours.js"
  },
  {
   "source": "backend/tests/http.test.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/tests/liveBus.test.js",
   "target": "backend/src/utils/liveBus.js"
  },
  {
   "source": "backend/tests/lostRequests.test.js",
   "target": "backend/src/utils/lostRequests.js"
  },
  {
   "source": "backend/tests/masterNames.test.js",
   "target": "backend/src/utils/masterNames.js"
  },
  {
   "source": "backend/tests/monthClose.test.js",
   "target": "backend/src/services/monthClose.js"
  },
  {
   "source": "backend/tests/monthlyDeductions.test.js",
   "target": "backend/src/services/monthlyDeductions.js"
  },
  {
   "source": "backend/tests/notifications.test.js",
   "target": "backend/src/services/notifications.js"
  },
  {
   "source": "backend/tests/overview.test.js",
   "target": "backend/src/services/overview.js"
  },
  {
   "source": "backend/tests/paymentMethods.test.js",
   "target": "backend/src/utils/paymentMethods.js"
  },
  {
   "source": "backend/tests/plans.test.js",
   "target": "backend/src/services/plans.js"
  },
  {
   "source": "backend/tests/ranking.test.js",
   "target": "backend/src/services/ranking.js"
  },
  {
   "source": "backend/tests/reportSchedule.test.js",
   "target": "backend/src/services/reportSchedule.js"
  },
  {
   "source": "backend/tests/restock.test.js",
   "target": "backend/src/services/restock.js"
  },
  {
   "source": "backend/tests/salePayments.test.js",
   "target": "backend/src/utils/salePayments.js"
  },
  {
   "source": "backend/tests/serverLang.test.js",
   "target": "backend/src/utils/lang.js"
  },
  {
   "source": "backend/tests/serverLang.test.js",
   "target": "backend/src/services/shoppingList.js"
  },
  {
   "source": "backend/tests/serverLang.test.js",
   "target": "backend/src/services/tenantAlerts.js"
  },
  {
   "source": "backend/tests/serverLang.test.js",
   "target": "backend/src/services/reportSchedule.js"
  },
  {
   "source": "backend/tests/serverLang.test.js",
   "target": "backend/src/utils/mailer.js"
  },
  {
   "source": "backend/tests/shiftDay.test.js",
   "target": "backend/src/utils/shiftDay.js"
  },
  {
   "source": "backend/tests/shoppingList.test.js",
   "target": "backend/src/services/shoppingList.js"
  },
  {
   "source": "backend/tests/tax.test.js",
   "target": "backend/src/services/tax.js"
  },
  {
   "source": "backend/tests/units.test.js",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "frontend/scripts/gerar_404.mjs",
   "target": "frontend/src/ui/marca.js"
  },
  {
   "source": "frontend/scripts/gerar_icones.mjs",
   "target": "frontend/src/ui/marca.js"
  },
  {
   "source": "frontend/scripts/gerar_site.mjs",
   "target": "frontend/site/build.js"
  },
  {
   "source": "frontend/site/build.js",
   "target": "frontend/site/textos.pt.js"
  },
  {
   "source": "frontend/site/build.js",
   "target": "frontend/site/textos.en.js"
  },
  {
   "source": "frontend/site/build.js",
   "target": "frontend/site/template.js"
  },
  {
   "source": "frontend/site/site.css",
   "target": "frontend/src/ui/tokens.css"
  },
  {
   "source": "frontend/site/site.js",
   "target": "frontend/site/site.css"
  },
  {
   "source": "frontend/site/template.js",
   "target": "frontend/src/ui/marca.js"
  },
  {
   "source": "frontend/site/template.js",
   "target": "frontend/site/config.js"
  },
  {
   "source": "frontend/site/template.js",
   "target": "frontend/site/legal.js"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/auth/Login.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/auth/RequestAccount.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/auth/NotifyMe.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/NotFound.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/auth/ResetPassword.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/auth/Support.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/VerifyReceipt.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/pos/Terminal.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/layouts/AppShell.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Home.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Sales.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Products.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Suppliers.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Debts.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Profile.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Team.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Reports.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Settings.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/Onboarding.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/owner/GroupPanel.jsx"
  },
  {
   "source": "frontend/src/components/BarcodeScanner.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/BarcodeScanner.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/components/BarcodeScanner.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/BirthdayDialog.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/BirthdayDialog.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/BirthdayDialog.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/CopyCatalogDialog.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/CopyCatalogDialog.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/CopyCatalogDialog.jsx",
   "target": "frontend/src/utils/syncPolicy.js"
  },
  {
   "source": "frontend/src/components/CopyCatalogDialog.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/CopyCatalogDialog.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/EstablishmentSwitcher.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/EstablishmentSwitcher.jsx",
   "target": "frontend/src/utils/syncPolicy.js"
  },
  {
   "source": "frontend/src/components/EstablishmentSwitcher.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/EstablishmentSwitcher.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/components/EstablishmentSwitcher.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/EstablishmentSwitcher.jsx",
   "target": "frontend/src/pages/auth/RequestAccount.jsx"
  },
  {
   "source": "frontend/src/components/EstablishmentSwitcher.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/HoursEditor.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/HoursEditor.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/LiveSales.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/LiveSales.jsx",
   "target": "frontend/src/utils/privacy.jsx"
  },
  {
   "source": "frontend/src/components/LiveSales.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/LiveSales.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/components/NotificationBell.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/components/NotificationBell.jsx",
   "target": "frontend/src/utils/notificationText.js"
  },
  {
   "source": "frontend/src/components/NotificationBell.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/NotificationBell.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/PanelLock.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/PanelLock.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/components/PanelLock.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/PanelLock.jsx",
   "target": "frontend/src/utils/offlinePin.js"
  },
  {
   "source": "frontend/src/components/PanelLock.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/PanelLock.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/PanelLock.jsx",
   "target": "frontend/src/i18n/en/lock.js"
  },
  {
   "source": "frontend/src/components/PdfButton.jsx",
   "target": "frontend/src/utils/pdf/deliver.js"
  },
  {
   "source": "frontend/src/components/PdfButton.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/PdfButton.jsx",
   "target": "frontend/src/components/PdfReadyDialog.jsx"
  },
  {
   "source": "frontend/src/components/PdfButton.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/PdfReadyDialog.jsx",
   "target": "frontend/src/utils/pdf/deliver.js"
  },
  {
   "source": "frontend/src/components/PdfReadyDialog.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/PdfReadyDialog.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/utils/receiptPrinter.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/components/PdfReadyDialog.jsx"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/ui/BrandMark.jsx",
   "target": "frontend/src/ui/marca.js"
  },
  {
   "source": "frontend/src/components/ui/Button.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/CountUp.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/ui/Data.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/Data.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/ui/Form.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/Form.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/components/ui/Form.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/ui/LanguageSwitch.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/LanguageSwitch.jsx",
   "target": "frontend/src/components/ui/Button.jsx"
  },
  {
   "source": "frontend/src/components/ui/LanguageSwitch.jsx",
   "target": "frontend/src/components/ui/Form.jsx"
  },
  {
   "source": "frontend/src/components/ui/LanguageSwitch.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/ui/Overlay.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/Overlay.jsx",
   "target": "frontend/src/components/ui/Button.jsx"
  },
  {
   "source": "frontend/src/components/ui/Overlay.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/components/ui/ProductImage.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/ProductImage.jsx",
   "target": "frontend/src/components/ui/productIcons.js"
  },
  {
   "source": "frontend/src/hooks/useOfflineSync.js",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/hooks/useOfflineSync.js",
   "target": "frontend/src/utils/offlineQueue.js"
  },
  {
   "source": "frontend/src/i18n/en/auth.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/i18n/en/common.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/i18n/en/lock.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/i18n/en/owner.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/i18n/en/pos.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/i18n/react.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/i18n/react.jsx",
   "target": "frontend/src/i18n/en/common.js"
  },
  {
   "source": "frontend/src/index.css",
   "target": "frontend/src/ui/tokens.css"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/utils/privacy.jsx"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/components/MonthCloseDialog.jsx"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/components/NotificationBell.jsx"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/components/LiveSales.jsx"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/components/EstablishmentSwitcher.jsx"
  },
  {
   "source": "frontend/src/layouts/AppShell.jsx",
   "target": "frontend/src/components/BirthdayDialog.jsx"
  },
  {
   "source": "frontend/src/main.jsx",
   "target": "frontend/src/App.jsx"
  },
  {
   "source": "frontend/src/main.jsx",
   "target": "frontend/src/index.css"
  },
  {
   "source": "frontend/src/main.jsx",
   "target": "frontend/src/registerSW.js"
  },
  {
   "source": "frontend/src/pages/VerifyReceipt.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/VerifyReceipt.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/VerifyReceipt.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/VerifyReceipt.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/pages/VerifyReceipt.jsx",
   "target": "frontend/src/pages/auth/AuthLayout.jsx"
  },
  {
   "source": "frontend/src/pages/VerifyReceipt.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/auth/AuthLayout.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/auth/AuthLayout.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/auth/AuthLayout.jsx",
   "target": "frontend/src/i18n/en/auth.js"
  },
  {
   "source": "frontend/src/pages/auth/Login.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/auth/Login.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/pages/auth/Login.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/auth/Login.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/auth/Login.jsx",
   "target": "frontend/src/pages/auth/AuthLayout.jsx"
  },
  {
   "source": "frontend/src/pages/auth/Login.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/auth/NotifyMe.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/auth/NotifyMe.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/auth/NotifyMe.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/auth/NotifyMe.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/auth/NotifyMe.jsx",
   "target": "frontend/src/pages/auth/AuthLayout.jsx"
  },
  {
   "source": "frontend/src/pages/auth/NotifyMe.jsx",
   "target": "frontend/src/pages/auth/RequestAccount.jsx"
  },
  {
   "source": "frontend/src/pages/auth/RequestAccount.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/auth/RequestAccount.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/auth/RequestAccount.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/auth/RequestAccount.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/auth/RequestAccount.jsx",
   "target": "frontend/src/pages/auth/AuthLayout.jsx"
  },
  {
   "source": "frontend/src/pages/auth/ResetPassword.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/auth/ResetPassword.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/auth/ResetPassword.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/auth/ResetPassword.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/auth/ResetPassword.jsx",
   "target": "frontend/src/pages/auth/AuthLayout.jsx"
  },
  {
   "source": "frontend/src/pages/auth/Support.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/auth/Support.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/pages/auth/Support.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/auth/Support.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/auth/Support.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/auth/Support.jsx",
   "target": "frontend/src/pages/auth/AuthLayout.jsx"
  },
  {
   "source": "frontend/src/pages/owner/AuditLogPage.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/AuditLogPage.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/AuditLogPage.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/owner/AuditLogPage.jsx",
   "target": "frontend/src/utils/auditLabels.js"
  },
  {
   "source": "frontend/src/pages/owner/AuditLogPage.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/pages/owner/AuditLogPage.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/AuditLogPage.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Debts.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Debts.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Debts.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Debts.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Debts.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/GroupPanel.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/GroupPanel.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/GroupPanel.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/GroupPanel.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/pages/owner/GroupPanel.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/GroupPanel.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/LocationCard.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/LocationCard.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/LocationCard.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/LocationCard.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/pages/auth/RequestAccount.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/components/HoursEditor.jsx"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/utils/imageResize.js"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/components/BarcodeScanner.jsx"
  },
  {
   "source": "frontend/src/pages/owner/ProductDrawer.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/components/CopyCatalogDialog.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/utils/search.js"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/pages/owner/ShoppingLists.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/pages/owner/ProductDrawer.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Profile.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Profile.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Profile.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Profile.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Profile.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/timelineText.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/components/PdfButton.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/components/SaleDrawer.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/pdf/reportPdf.js"
  },
  {
   "source": "frontend/src/pages/owner/Sales.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Sales.jsx",
   "target": "frontend/src/components/SaleDrawer.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Sales.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Sales.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Sales.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/utils/session.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/components/PanelLock.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/utils/offlinePin.js"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/utils/receiptPrinter.js"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/components/SaleDrawer.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/pages/owner/AuditLogPage.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/components/HoursEditor.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/pages/owner/LocationCard.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Settings.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/ShoppingLists.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/ShoppingLists.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/ShoppingLists.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/ShoppingLists.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/pages/owner/ShoppingLists.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/ShoppingLists.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/ShoppingLists.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/owner/Suppliers.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Suppliers.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Suppliers.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Suppliers.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Suppliers.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Suppliers.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/owner/Team.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/owner/Team.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Team.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Team.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Team.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/DevicesDialog.jsx",
   "target": "frontend/src/utils/devices.js"
  },
  {
   "source": "frontend/src/pages/pos/DevicesDialog.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/DevicesDialog.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/pos/DevicesDialog.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/pos/GuardScreen.jsx",
   "target": "frontend/src/components/BarcodeScanner.jsx"
  },
  {
   "source": "frontend/src/pages/pos/GuardScreen.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/pos/GuardScreen.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/pos/GuardScreen.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/pos/GuardScreen.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/pos/GuardScreen.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/syncPolicy.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/receiptPrinter.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/code128.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/components/PdfReadyDialog.jsx"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/search.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/offlinePin.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/components/BarcodeScanner.jsx"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/pages/pos/DevicesDialog.jsx"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/utils/devices.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/hooks/useOfflineSync.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/utils/syncPolicy.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/utils/productCache.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/utils/search.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/pages/pos/PosDialogs.jsx"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/utils/productCache.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/utils/offlinePin.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/i18n/react.jsx"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/pages/pos/PosScreen.jsx"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/pages/pos/GuardScreen.jsx"
  },
  {
   "source": "frontend/src/utils/api.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/auditLabels.js",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/utils/auditLabels.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/devices.js",
   "target": "frontend/src/utils/pdf/deliver.js"
  },
  {
   "source": "frontend/src/utils/devices.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/devices.js",
   "target": "frontend/src/utils/escpos.js"
  },
  {
   "source": "frontend/src/utils/escpos.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/escpos.js",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/utils/escpos.js",
   "target": "frontend/src/utils/code128.js"
  },
  {
   "source": "frontend/src/utils/format.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/notificationText.js",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/utils/notificationText.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/offlinePin.js",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/utils/offlineQueue.js",
   "target": "frontend/src/utils/syncPolicy.js"
  },
  {
   "source": "frontend/src/utils/pdf/receiptPdf.js",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/utils/pdf/receiptPdf.js",
   "target": "frontend/src/utils/code128.js"
  },
  {
   "source": "frontend/src/utils/pdf/receiptPdf.js",
   "target": "frontend/src/utils/pdf/text.js"
  },
  {
   "source": "frontend/src/utils/pdf/receiptPdf.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/pdf/receiptPdf.js",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/utils/pdf/reportPdf.js",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/utils/pdf/reportPdf.js",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/utils/pdf/reportPdf.js",
   "target": "frontend/src/utils/timelineText.js"
  },
  {
   "source": "frontend/src/utils/pdf/reportPdf.js",
   "target": "frontend/src/utils/pdf/text.js"
  },
  {
   "source": "frontend/src/utils/pdf/reportPdf.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/privacy.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/utils/productCache.js",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/utils/productCache.js",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/utils/productCache.js",
   "target": "frontend/src/utils/syncPolicy.js"
  },
  {
   "source": "frontend/src/utils/productCache.js",
   "target": "frontend/src/utils/stockOverlay.js"
  },
  {
   "source": "frontend/src/utils/receiptImage.js",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/utils/receiptImage.js",
   "target": "frontend/src/utils/code128.js"
  },
  {
   "source": "frontend/src/utils/receiptImage.js",
   "target": "frontend/src/utils/pdf/text.js"
  },
  {
   "source": "frontend/src/utils/receiptImage.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/receiptImage.js",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/utils/pdf/deliver.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/utils/escpos.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/utils/code128.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/utils/devices.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/utils/pdf/receiptPdf.js"
  },
  {
   "source": "frontend/src/utils/receiptPrinter.js",
   "target": "frontend/src/utils/receiptImage.js"
  },
  {
   "source": "frontend/src/utils/session.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/utils/session.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/utils/session.jsx",
   "target": "frontend/src/components/PanelLock.jsx"
  },
  {
   "source": "frontend/src/utils/session.jsx",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/session.jsx",
   "target": "frontend/src/utils/offlinePin.js"
  },
  {
   "source": "frontend/src/utils/timelineText.js",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/utils/timelineText.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/timelineText.js",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/src/utils/units.js",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/src/utils/useApi.js",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/utils/useApi.js",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/tailwind.site.config.js",
   "target": "frontend/tailwind.config.js"
  },
  {
   "source": "frontend/tests/audit_labels.test.mjs",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/tests/audit_labels.test.mjs",
   "target": "frontend/src/utils/auditLabels.js"
  },
  {
   "source": "frontend/tests/code128.test.mjs",
   "target": "frontend/src/utils/code128.js"
  },
  {
   "source": "frontend/tests/escpos.test.mjs",
   "target": "frontend/src/utils/escpos.js"
  },
  {
   "source": "frontend/tests/i18n.test.mjs",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/tests/i18n.test.mjs",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/tests/i18n.test.mjs",
   "target": "frontend/src/utils/timelineText.js"
  },
  {
   "source": "frontend/tests/i18n.test.mjs",
   "target": "frontend/src/utils/auditLabels.js"
  },
  {
   "source": "frontend/tests/i18n.test.mjs",
   "target": "frontend/src/utils/escpos.js"
  },
  {
   "source": "frontend/tests/i18n.test.mjs",
   "target": "frontend/src/utils/notificationText.js"
  },
  {
   "source": "frontend/tests/offline_pin.test.mjs",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/tests/offline_pin.test.mjs",
   "target": "frontend/src/utils/offlinePin.js"
  },
  {
   "source": "frontend/tests/offline_queue.test.mjs",
   "target": "frontend/src/utils/syncPolicy.js"
  },
  {
   "source": "frontend/tests/offline_queue.test.mjs",
   "target": "frontend/src/utils/offlineQueue.js"
  },
  {
   "source": "frontend/tests/offline_queue.test.mjs",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/tests/receipt_image.test.mjs",
   "target": "frontend/src/utils/receiptImage.js"
  },
  {
   "source": "frontend/tests/receipt_image.test.mjs",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/tests/receipt_image.test.mjs",
   "target": "frontend/src/i18n/en/common.js"
  },
  {
   "source": "frontend/tests/search.test.mjs",
   "target": "frontend/src/utils/search.js"
  },
  {
   "source": "frontend/tests/site.test.mjs",
   "target": "frontend/site/build.js"
  },
  {
   "source": "frontend/tests/site.test.mjs",
   "target": "frontend/site/config.js"
  },
  {
   "source": "frontend/tests/site.test.mjs",
   "target": "frontend/site/textos.pt.js"
  },
  {
   "source": "frontend/tests/site.test.mjs",
   "target": "frontend/site/textos.en.js"
  },
  {
   "source": "frontend/tests/stock_overlay.test.mjs",
   "target": "frontend/src/utils/stockOverlay.js"
  },
  {
   "source": "frontend/tests/stock_overlay.test.mjs",
   "target": "frontend/src/utils/code128.js"
  },
  {
   "source": "frontend/tests/units.test.mjs",
   "target": "frontend/src/utils/units.js"
  },
  {
   "source": "frontend/tests/units.test.mjs",
   "target": "frontend/src/i18n/core.js"
  },
  {
   "source": "frontend/tests/units.test.mjs",
   "target": "backend/src/utils/units.js"
  },
  {
   "source": "backend/src/services/report.service.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/report.service.js",
   "target": "backend/src/services/monthlyDeductions.js"
  },
  {
   "source": "backend/src/jobs/dailyDigest.js",
   "target": "backend/src/utils/mailer.js"
  },
  {
   "source": "backend/src/jobs/dailyDigest.js",
   "target": "backend/src/utils/whatsapp.js"
  },
  {
   "source": "backend/src/jobs/dailyDigest.js",
   "target": "backend/src/services/tenantAlerts.js"
  },
  {
   "source": "backend/prisma/migrations/postgres/0001_init/migration.sql",
   "target": "backend/prisma/schema.prisma"
  },
  {
   "source": "docs/README_INSTALACAO.md",
   "target": "plan.md"
  },
  {
   "source": "docs/README_INSTALACAO.md",
   "target": "run-localhost.sh"
  }
 ]
};
