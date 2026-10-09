/* GERADO AUTOMATICAMENTE por scripts/gen_mindmap_data.js - NAO EDITAR A MAO.
   Fonte de verdade curada: Mapa Mental/mapa_mental_status.json
   Gerado em: 2026-10-09T17:08:34.336Z */
window.GENESIS_MINDMAP = {
 "generatedAt": "2026-10-09T17:08:34.336Z",
 "generator": "scripts/gen_mindmap_data.js",
 "curatedFrom": "Mapa Mental/mapa_mental_status.json",
 "project": "Genesis",
 "totals": {
  "files": 194,
  "planned": 5,
  "links": 316,
  "lines": 27789,
  "byStatus": {
   "ok": 119,
   "partial": 12,
   "broken": 0,
   "planned": 5,
   "untracked": 63
  },
  "byGroup": {
   "infra": 12,
   "docs": 11,
   "admin": 9,
   "backend-data": 49,
   "backend": 52,
   "frontend-pub": 4,
   "frontend": 59,
   "scripts": 3
  }
 },
 "topExternals": [
  {
   "pkg": "react",
   "count": 35
  },
  {
   "pkg": "lucide-react",
   "count": 20
  },
  {
   "pkg": "bcrypt",
   "count": 20
  },
  {
   "pkg": "react-router-dom",
   "count": 19
  },
  {
   "pkg": "dotenv",
   "count": 19
  },
  {
   "pkg": "express",
   "count": 17
  },
  {
   "pkg": "crypto",
   "count": 15
  },
  {
   "pkg": "zod",
   "count": 15
  },
  {
   "pkg": "@prisma/client",
   "count": 13
  },
  {
   "pkg": "node:path",
   "count": 10
  },
  {
   "pkg": "node:fs",
   "count": 9
  },
  {
   "pkg": "path",
   "count": 8
  },
  {
   "pkg": "node:test",
   "count": 8
  },
  {
   "pkg": "node:assert",
   "count": 8
  },
  {
   "pkg": "fs",
   "count": 7
  },
  {
   "pkg": "@playwright/test",
   "count": 7
  },
  {
   "pkg": "nodemailer",
   "count": 5
  },
  {
   "pkg": "express-rate-limit",
   "count": 5
  },
  {
   "pkg": "qrcode",
   "count": 4
  },
  {
   "pkg": "node-fetch",
   "count": 4
  },
  {
   "pkg": "react-dom",
   "count": 3
  },
  {
   "pkg": "child_process",
   "count": 3
  },
  {
   "pkg": "jsonwebtoken",
   "count": 3
  },
  {
   "pkg": "axios",
   "count": 2
  }
 ],
 "groups": [
  {
   "id": "infra",
   "label": "Infra / Raiz",
   "tone": "#94a3b8",
   "nodes": 12,
   "clusters": {
    ".": 7,
    "backend": 1,
    "deploy": 3,
    "frontend": 1
   }
  },
  {
   "id": "docs",
   "label": "Documentos",
   "tone": "#f59e0b",
   "nodes": 11,
   "clusters": {
    "Mapa Mental": 3,
    ".": 2,
    "docs": 6
   }
  },
  {
   "id": "admin",
   "label": "Super Admin",
   "tone": "#a855f7",
   "nodes": 9,
   "clusters": {
    "admin-frontend": 5,
    "admin-frontend/src": 3,
    "admin-frontend/tests": 1
   }
  },
  {
   "id": "backend-data",
   "label": "Backend - Dados e Testes",
   "tone": "#8f0a11",
   "nodes": 49,
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
    "backend/scripts": 26,
    "backend/tests": 7,
    "backend/prisma/migrations/postgres/0001_init": 1
   }
  },
  {
   "id": "backend",
   "label": "Backend (API)",
   "tone": "#e50914",
   "nodes": 52,
   "clusters": {
    "backend/src": 1,
    "backend/src/middleware": 5,
    "backend/src/routes": 16,
    "backend/src/services": 9,
    "backend/src/utils": 20,
    "backend/src/jobs": 1
   }
  },
  {
   "id": "frontend-pub",
   "label": "Frontend - Config",
   "tone": "#0ea5e9",
   "nodes": 4,
   "clusters": {
    "frontend": 4
   }
  },
  {
   "id": "frontend",
   "label": "Frontend (Owner/POS)",
   "tone": "#3b82f6",
   "nodes": 59,
   "clusters": {
    "frontend/scripts": 1,
    "frontend/src": 4,
    "frontend/src/components": 2,
    "frontend/src/components/ui": 7,
    "frontend/src/db": 1,
    "frontend/src/hooks": 1,
    "frontend/src/layouts": 1,
    "frontend/src/pages": 2,
    "frontend/src/pages/auth": 5,
    "frontend/src/pages/owner": 10,
    "frontend/src/pages/pos": 3,
    "frontend/src/ui": 1,
    "frontend/src/utils": 11,
    "frontend/tests/e2e": 7,
    "frontend/tests": 3
   }
  },
  {
   "id": "scripts",
   "label": "Automatismos / Scripts",
   "tone": "#22c55e",
   "nodes": 3,
   "clusters": {
    ".": 1,
    "scripts": 2
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
   "lines": 120,
   "size": 15158,
   "externals": [
    "@prisma/client"
   ],
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
   "lines": 678,
   "size": 125105,
   "externals": [
    "@prisma/client"
   ],
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
   "lines": 1176,
   "size": 61988,
   "externals": [
    "nodemailer"
   ],
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
   "size": 16578,
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
   "size": 114210,
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
   "lines": 27,
   "size": 610,
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
   "status": "partial",
   "summary": "Painel de super admin num ficheiro so: login, dashboard de tenants por estado, aprovar/rejeitar, suspender, bloquear, recuperar, eliminar e abrir a conta do owner.",
   "notes": "DEFEITOS ABERTOS: (1) o email `admin@genesis.co.mz` vem PRE-PREENCHIDO no formulario; (2) rejeitar e bloquear usam window.prompt sem validacao; (3) a UI so usa parte da API (falta auditoria, pedidos detalhados, historico); (4) sem pesquisa nem filtros; (5) sem botao de tema. 09/10/2026 (Fase 7.3): modo suporte abre o separador no proprio toque (Safari); bloqueado -> link. admin_flows 7/7 no Chromium; Safari real nao verificado.",
   "role": "Painel da plataforma.",
   "security": "",
   "planned": false,
   "lines": 418,
   "size": 24359,
   "externals": [
    "react",
    "react-router-dom",
    "axios",
    "lucide-react",
    "@ui"
   ],
   "dependsOn": [],
   "usedBy": [
    "admin-frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 0
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
   "size": 5611,
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
   "notes": "",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 30,
   "size": 960,
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
   "lines": 36,
   "size": 1092,
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
   "lines": 91,
   "size": 5117,
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
   "notes": "Dinheiro em Int (centavos), IDs em String, datas em DateTime: portatil entre SQLite e Postgres.",
   "role": "Modelo de dados.",
   "security": "",
   "planned": false,
   "lines": 399,
   "size": 13821,
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
   "notes": "",
   "role": "Modelo de dados.",
   "security": "",
   "planned": false,
   "lines": 416,
   "size": 14703,
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
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 32,
   "size": 2067,
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
   "lines": 84,
   "size": 6042,
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
   "size": 5174,
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
   "lines": 930,
   "size": 73477,
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
    "backend/src/services/expiryJob.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 4
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
   "notes": "O fecho de turno esta montado so com requireRole('owner').",
   "role": "Ponto de entrada do backend.",
   "security": "CORRIGIDO 28/09: o handler global de erros ja nao devolve `details` ao cliente (enviava nomes de tabelas/colunas e o host da BD a qualquer pessoa) e respeita headersSent para nao tentar escrever um segundo 500. Passa a logar `[erro] <METODO> <rota>` com a stack completa no servidor.",
   "planned": false,
   "lines": 280,
   "size": 10820,
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
    "backend/src/routes/master_catalogs.js",
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
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/verify.js",
    "backend/src/utils/http.js",
    "backend/src/services/expiryJob.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 23
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
   "summary": "Valida o JWT do cookie e injecta req.user (userId, role, tenantId).",
   "notes": "",
   "role": "Autenticacao.",
   "security": "",
   "planned": false,
   "lines": 72,
   "size": 3295,
   "externals": [
    "jsonwebtoken"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/sessionScopes.js",
    "backend/src/utils/sessionUser.js"
   ],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/master_catalogs.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/products.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js"
   ],
   "inbound": 11,
   "outbound": 4
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
    "backend/src/routes/inventory.js",
    "backend/src/routes/master_catalogs.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/products.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js"
   ],
   "inbound": 10,
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
   "lines": 23,
   "size": 1163,
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
   "notes": " 09/10/2026 (Fase 7.3): aprovar com email ja usado -> 409 EMAIL_IN_USE (antes inventava email). Pedido sem email ainda gera @genesis.co.mz (decisao do fundador).",
   "role": "API da plataforma.",
   "security": "requireRole('super_admin') + adminOriginCheck.",
   "planned": false,
   "lines": 188,
   "size": 11679,
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
    "backend/src/utils/supportCodes.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 6
  },
  {
   "id": "backend/src/routes/auth.js",
   "path": "backend/src/routes/auth.js",
   "label": "auth.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Login email/senha, login Google verificado no servidor, pedido de conta, forgot-password (codigo de 6 digitos) e reset-password com codigo OBRIGATORIO.",
   "notes": "Le GOOGLE_CLIENT_ID de backend/.env. CORRIGIDO 28/09 — (1) TODOS os catch que devolviam 500 engolem o erro sem log; agora cada um tem console.error com o email, o que finalmente torna um 500 diagnosticavel. (2) O login Google devolvia NOT_YET_VALID quando o token parecia estar no futuro; passou a devolver CLOCK_SKEW com a medida do desvio do relogio (o PC estava 8h19 atrasado). (3) forgot-password devolve o codigo no ecra quando nao ha SMTP, se DEV_SHOW_RESET_CODE=true e NODE_ENV != production.",
   "role": "Autenticacao.",
   "security": "A rota /reset-password-instant foi REMOVIDA a 26/09. Sem codigo valido nao ha troca de senha. Rate limit no login, no pedido e na reposicao; resposta generica para nao revelar contas existentes. CORRIGIDO 28/09: conta sem password_hash devolve 401 NO_PASSWORD (antes bcrypt.compare(pass, null) lancava e dava 500).",
   "planned": false,
   "lines": 601,
   "size": 23355,
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
    "backend/src/utils/tokens.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/supportCodes.js",
    "backend/src/utils/audit.js"
   ],
   "usedBy": [
    "backend/scripts/test_google.js",
    "backend/src/index.js"
   ],
   "inbound": 2,
   "outbound": 8
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
   "notes": "Fase 1 (2.1): fonte unica = tabela MasterCatalog (templates no codigo removidos); aceita barcode e image_url; codigo repetido -> 400 DUPLICATE_BARCODE; erro de validacao diz o produto e o campo (INVALID_CATALOG). 04/10/2026: onboarding.mjs 18/18 no browser + import invalido devolve 400 com produto e campo.",
   "role": "Onboarding.",
   "security": "",
   "planned": false,
   "lines": 103,
   "size": 5233,
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
    "backend/src/utils/productImage.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 5
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
   "summary": "Registo de procura nao satisfeita: transaccional, com auditoria.",
   "notes": "",
   "role": "Inteligencia comercial.",
   "security": "",
   "planned": false,
   "lines": 78,
   "size": 2750,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tenantRls.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "backend/src/routes/inventory.js",
   "path": "backend/src/routes/inventory.js",
   "label": "inventory.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Entradas de stock (compras a fornecedores) e ajustes.",
   "notes": "",
   "role": "Stock.",
   "security": "",
   "planned": false,
   "lines": 194,
   "size": 7663,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/stockLots.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "backend/src/routes/master_catalogs.js",
   "path": "backend/src/routes/master_catalogs.js",
   "label": "master_catalogs.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Serve o catalogo mestre global usado como sugestao no onboarding.",
   "notes": "",
   "role": "Onboarding.",
   "security": "",
   "planned": false,
   "lines": 93,
   "size": 3031,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/rbac.js",
    "backend/src/middleware/auth.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "backend/src/routes/owner.js",
   "path": "backend/src/routes/owner.js",
   "label": "owner.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Rotas do dono: tenant, alertas, dashboard, relatorios, caixistas, fecho cego de turno, desbloqueio com senha, metas, despesas e salarios.",
   "notes": "GET /api/owner/tenant alimenta o nome real da loja no shell; nunca dados de demonstracao.",
   "role": "API do dono.",
   "security": "",
   "planned": false,
   "lines": 435,
   "size": 24257,
   "externals": [
    "express",
    "crypto",
    "bcrypt",
    "zod",
    "express-rate-limit"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/whatsapp.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/services/reports.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/terminals.js",
    "backend/src/services/monthClose.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 12
  },
  {
   "id": "backend/src/routes/pos.js",
   "path": "backend/src/routes/pos.js",
   "label": "pos.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Terminal: emparelhar, perfis (com estado do turno), PIN do caixista, fecho cego, abrir turno novo e ver vendas com o PIN do dono.",
   "notes": "09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser.",
   "role": "Balcao.",
   "security": "Abrir turno e ver vendas exigem o PIN de autorizacao do dono (falhas gravadas e limitadas).",
   "planned": false,
   "lines": 152,
   "size": 9201,
   "externals": [
    "express",
    "bcrypt",
    "zod",
    "express-rate-limit"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
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
   "outbound": 12
  },
  {
   "id": "backend/src/routes/products.js",
   "path": "backend/src/routes/products.js",
   "label": "products.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "CRUD de produtos com scoping por tenant e historico de precos.",
   "notes": "",
   "role": "Catalogo.",
   "security": "",
   "planned": false,
   "lines": 274,
   "size": 11115,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/productImage.js",
    "backend/src/utils/stockLots.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 5
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
   "lines": 53,
   "size": 2089,
   "externals": [
    "express"
   ],
   "dependsOn": [
    "backend/src/utils/tokens.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/tenantStatus.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 3
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
   "notes": "getNextDailyNumber reinicia a contagem a meia-noite - e a base do nome Recibo_N. 09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser.",
   "role": "Nucleo do POS.",
   "security": "",
   "planned": false,
   "lines": 518,
   "size": 24299,
   "externals": [
    "express",
    "zod",
    "bcrypt",
    "express-rate-limit",
    "crypto"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/shift.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/tenantRls.js",
    "backend/src/utils/paymentMethods.js",
    "backend/src/utils/stockLots.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 7
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
   "notes": "04/10/2026 Fase 5.1: /expenses; verify_system 16 23/23.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 233,
   "size": 11794,
   "externals": [
    "express",
    "bcrypt",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/http.js",
    "backend/src/utils/audit.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 5
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
   "notes": "04/10/2026 Fase 5.2: verify_system 17 25/25.",
   "role": "Compras.",
   "security": "",
   "planned": false,
   "lines": 151,
   "size": 8330,
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
    "backend/src/services/shoppingList.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 7
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
   "lines": 106,
   "size": 4538,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tenantRls.js",
    "backend/src/utils/stockLots.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 3
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
   "size": 2400,
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
   "lines": 59,
   "size": 2006,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/services/reports.js",
    "backend/tests/monthlyDeductions.test.js",
    "backend/src/services/report.service.js"
   ],
   "inbound": 3,
   "outbound": 0
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
   "id": "backend/src/services/reports.js",
   "path": "backend/src/services/reports.js",
   "label": "reports.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Relatorios diario/semanal/mensal, rastreio (timeline), metas 12 meses.",
   "notes": "04/10/2026 Fase 4: verify_system 194/194; e2e reports/flows/pos/stock OK.",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 423,
   "size": 27762,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/services/monthlyDeductions.js",
    "backend/src/services/restock.js"
   ],
   "usedBy": [
    "backend/src/routes/owner.js",
    "backend/src/routes/shoppingLists.js"
   ],
   "inbound": 2,
   "outbound": 3
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
   "lines": 46,
   "size": 2221,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/services/reports.js",
    "backend/tests/restock.test.js"
   ],
   "inbound": 2,
   "outbound": 0
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
   "notes": "04/10/2026: 5/5 testes.",
   "role": "Compras.",
   "security": "",
   "planned": false,
   "lines": 41,
   "size": 1779,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/shoppingLists.js",
    "backend/tests/shoppingList.test.js"
   ],
   "inbound": 2,
   "outbound": 0
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
   "notes": "04/10/2026: verify_system 14 27/27; completo 160/160; e2e stock 3/3.",
   "role": "Operacoes.",
   "security": "",
   "planned": false,
   "lines": 65,
   "size": 2787,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/fefo.js"
   ],
   "usedBy": [
    "backend/src/routes/owner.js",
    "backend/src/jobs/dailyDigest.js"
   ],
   "inbound": 2,
   "outbound": 2
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
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/shift.js"
   ],
   "inbound": 8,
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
   "size": 2053,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/services/expiryJob.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/utils/stockLots.js",
    "backend/tests/fefo.test.js"
   ],
   "inbound": 5,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/http.js",
   "path": "backend/src/utils/http.js",
   "label": "http.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 37,
   "size": 1644,
   "externals": [
    "zod"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/routes/verify.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/shift.js"
   ],
   "inbound": 10,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/mailer.js",
   "path": "backend/src/utils/mailer.js",
   "label": "mailer.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "partial",
   "summary": "Envio de emails por SMTP Gmail (App Password). sendPasswordResetEmail entrega o codigo de 6 digitos. require('nodemailer') e lazy, dentro de try/catch.",
   "notes": "INCOMPLETO: faltam MAIL_USER/MAIL_PASS reais em backend/.env. Sem isso o codigo sai apenas no log (fora de producao). ESTE ERA O BLOQUEIO DO 'ESQUECI A SENHA': sem SMTP o utilizador pedia o codigo e nunca recebia. Mitigado a 28/09 com DEV_SHOW_RESET_CODE=true, que devolve o codigo no proprio ecra quando nao foi entregue a ninguem (so em desenvolvimento).",
   "role": "Entrega do codigo de recuperacao.",
   "security": "Nunca deita o backend abaixo se faltar o nodemailer.",
   "planned": false,
   "lines": 133,
   "size": 5054,
   "externals": [
    "nodemailer"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/check_mail.js",
    "backend/src/routes/auth.js",
    "backend/src/jobs/dailyDigest.js"
   ],
   "inbound": 3,
   "outbound": 0
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
   "lines": 48,
   "size": 1617,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/sales.js",
    "backend/tests/paymentMethods.test.js"
   ],
   "inbound": 2,
   "outbound": 0
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
    "backend/scripts/create_system_user.js",
    "backend/scripts/create_test_tenant.js",
    "backend/scripts/e2e_admin_fixture.js",
    "backend/scripts/e2e_fixture.js",
    "backend/scripts/ensure_device_keys.js",
    "backend/scripts/gerir_contas.js",
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
    "backend/src/routes/inventory.js",
    "backend/src/routes/master_catalogs.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/products.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/settings.js",
    "backend/src/routes/shoppingLists.js",
    "backend/src/routes/shrinkage_records.js",
    "backend/src/routes/verify.js",
    "backend/src/services/expiryJob.js",
    "backend/src/services/reports.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/authPin.js",
    "backend/src/utils/sessionUser.js",
    "backend/src/utils/shift.js",
    "backend/src/utils/tenantStatus.js",
    "backend/src/utils/terminals.js",
    "backend/src/services/report.service.js"
   ],
   "inbound": 38,
   "outbound": 1
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
   "id": "backend/src/utils/sessionScopes.js",
   "path": "backend/src/utils/sessionScopes.js",
   "label": "sessionScopes.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Listas fechadas de rotas por ambito (pos = terminal, support = so leitura).",
   "notes": "09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser.",
   "role": "Seguranca.",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 1831,
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
   "size": 2417,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/tokens.js"
   ],
   "usedBy": [
    "backend/src/middleware/auth.js",
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/refresh.js"
   ],
   "inbound": 6,
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
   "summary": "Turno e fecho cego: estado aberto/fechado (SHIFT_OPENED na auditoria), esperado nunca revelado antes de contar.",
   "notes": "09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser.",
   "role": "Fecho de caixa.",
   "security": "",
   "planned": false,
   "lines": 113,
   "size": 5568,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/audit.js",
    "backend/src/utils/http.js"
   ],
   "usedBy": [
    "backend/src/routes/pos.js",
    "backend/src/routes/sales.js"
   ],
   "inbound": 2,
   "outbound": 4
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
    "backend/src/routes/owner.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/sales.js",
    "backend/src/utils/shift.js"
   ],
   "inbound": 4,
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
   "lines": 70,
   "size": 2809,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/middleware/auth.js",
    "backend/src/middleware/terminalAuth.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/refresh.js"
   ],
   "inbound": 5,
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
   "lines": 80,
   "size": 3494,
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
   "lines": 86,
   "size": 3131,
   "externals": [
    "crypto",
    "jsonwebtoken"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/scripts/verify_system.js",
    "backend/src/middleware/posWriteAuth.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/pos.js",
    "backend/src/routes/refresh.js",
    "backend/src/utils/sessionUser.js"
   ],
   "inbound": 6,
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
    "backend/src/jobs/dailyDigest.js"
   ],
   "inbound": 3,
   "outbound": 0
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
   "lines": 91,
   "size": 3436,
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
   "size": 4423,
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
   "lines": 63,
   "size": 3045,
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
   "id": "frontend/index.html",
   "path": "frontend/index.html",
   "label": "index.html",
   "group": "frontend-pub",
   "dir": "frontend",
   "ext": ".html",
   "status": "partial",
   "summary": "HTML do produto: meta theme-color, fundo escuro inicial e carregamento do bundle.",
   "notes": "Falta o script inline que aplica o tema guardado antes do primeiro pixel (evita o flash branco no modo claro).",
   "role": "HTML.",
   "security": "",
   "planned": false,
   "lines": 18,
   "size": 637,
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
   "lines": 33,
   "size": 757,
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
   "lines": 96,
   "size": 4932,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
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
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/Onboarding.jsx"
   ],
   "usedBy": [
    "frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 18
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
   "notes": "04/10/2026: fecho_mes.mjs 10/10. Caminho Agora nao so provado pela API.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 141,
   "size": 7899,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/layouts/AppShell.jsx"
   ],
   "inbound": 1,
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
   "notes": "04/10/2026 Fase 4: verify_system 194/194; e2e reports/flows/pos/stock OK.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2383,
   "externals": [
    "react",
    "lucide-react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/receiptPrinter.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx"
   ],
   "inbound": 2,
   "outbound": 3
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
    "frontend/src/components/ui/Overlay.jsx"
   ],
   "inbound": 1,
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
   "lines": 203,
   "size": 9289,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
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
   "lines": 157,
   "size": 7290,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js",
    "frontend/src/utils/money.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
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
   "lines": 128,
   "size": 5623,
   "externals": [
    "react",
    "react-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js",
    "frontend/src/components/ui/Button.jsx"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
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
   "notes": "04/10/2026: pos.mjs 21/21 + flows.mjs 24/24 no browser.",
   "role": "UI kit.",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 2001,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/components/ui/cx.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
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
    "frontend/src/components/ui/Overlay.jsx",
    "frontend/src/components/ui/ProductImage.jsx"
   ],
   "inbound": 5,
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
   "lines": 8,
   "size": 554,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/session.jsx"
   ],
   "inbound": 23,
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
   "lines": 72,
   "size": 3470,
   "externals": [
    "dexie"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/hooks/useOfflineSync.js",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/utils/productCache.js",
    "frontend/tests/offline_queue.test.mjs"
   ],
   "inbound": 5,
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
   "summary": "Sincronizacao offline para o servidor com Authorization Bearer, e envio de perdas/procura pendentes.",
   "notes": "",
   "role": "Offline.",
   "security": "",
   "planned": false,
   "lines": 87,
   "size": 3226,
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
   "lines": 49,
   "size": 1862,
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
   "summary": "Moldura do painel do dono; monta o fecho do mes.",
   "notes": "04/10/2026: regressao completa OK.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 134,
   "size": 6657,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/components/MonthCloseDialog.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
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
   "lines": 57,
   "size": 3149,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
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
   "lines": 26,
   "size": 1339,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx"
   ],
   "inbound": 5,
   "outbound": 0
  },
  {
   "id": "frontend/src/pages/auth/Login.jsx",
   "path": "frontend/src/pages/auth/Login.jsx",
   "label": "Login.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 122,
   "size": 5377,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/auth/RequestAccount.jsx",
   "path": "frontend/src/pages/auth/RequestAccount.jsx",
   "label": "RequestAccount.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/auth",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 74,
   "size": 4077,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/pages/owner/Onboarding.jsx"
   ],
   "inbound": 2,
   "outbound": 4
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
   "lines": 65,
   "size": 3660,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
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
   "lines": 31,
   "size": 1445,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/auth/AuthLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
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
   "lines": 108,
   "size": 7153,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/pages/owner/Home.jsx",
   "path": "frontend/src/pages/owner/Home.jsx",
   "label": "Home.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Inicio do dono: KPIs, meta do mes e do mes passado, alertas.",
   "notes": "04/10/2026 Fase 4: verify_system 194/194; e2e reports/flows/pos/stock OK.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 176,
   "size": 9937,
   "externals": [
    "react",
    "react-router-dom",
    "recharts"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
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
   "summary": "Assistente de 5 passos no 1.o login: tipo, categorias adicionais, catalogo (com coluna de codigo de barras para o leitor), custos/equipa/fornecedores, horario.",
   "notes": "04/10/2026: onboarding.mjs 18/18 no browser + import invalido devolve 400 com produto e campo.",
   "role": "Onboarding do dono.",
   "security": "",
   "planned": false,
   "lines": 258,
   "size": 18087,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/auth/RequestAccount.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
  },
  {
   "id": "frontend/src/pages/owner/Products.jsx",
   "path": "frontend/src/pages/owner/Products.jsx",
   "label": "Products.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 287,
   "size": 18536,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/search.js",
    "frontend/src/utils/imageResize.js",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "frontend/src/pages/owner/Reports.jsx",
   "path": "frontend/src/pages/owner/Reports.jsx",
   "label": "Reports.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra dos relatorios: KPIs, resumo, rastreio com filtros, cascata mensal.",
   "notes": "04/10/2026 Fase 4: verify_system 194/194; e2e reports/flows/pos/stock OK.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 497,
   "size": 32475,
   "externals": [
    "react",
    "lucide-react",
    "react-router-dom",
    "recharts"
   ],
   "dependsOn": [
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
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
   "lines": 78,
   "size": 4618,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/useApi.js",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
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
   "notes": "04/10/2026 Fase 5.1: despesas avulsas; fase5.mjs 9/9.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 368,
   "size": 24542,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
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
   "notes": "04/10/2026: fase5.mjs 16/16.",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 193,
   "size": 12570,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/owner/Products.jsx"
   ],
   "inbound": 1,
   "outbound": 4
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
   "lines": 76,
   "size": 4700,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
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
   "lines": 163,
   "size": 10579,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/useApi.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/pages/pos/PosDialogs.jsx",
   "path": "frontend/src/pages/pos/PosDialogs.jsx",
   "label": "PosDialogs.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/pos",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Dialogos do POS: PIN do dono, recibo, fecho cego (envia a fila antes e recusa com vendas por enviar), vendas com PIN, quebra, produto em falta.",
   "notes": "09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser. 09/10/2026 (Fase 7.2): verify_system 19 (8/8) + flows.mjs no browser (QR = /verify/<id>, comparado pixel a pixel; pagina publica abre sem sessao).",
   "role": "Balcao.",
   "security": "",
   "planned": false,
   "lines": 276,
   "size": 14203,
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
    "frontend/src/utils/search.js",
    "frontend/src/utils/format.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/PosScreen.jsx"
   ],
   "inbound": 1,
   "outbound": 7
  },
  {
   "id": "frontend/src/pages/pos/PosScreen.jsx",
   "path": "frontend/src/pages/pos/PosScreen.jsx",
   "label": "PosScreen.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/pos",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Ecra de vendas do terminal: grelha com foto/icone, faixa do leitor, M-Pesa/e-Mola separados, atalhos F2/F3/F4/Ctrl+Enter/Alt+n/setas. Faixa Turno fechado + Abrir turno novo (PIN do dono).",
   "notes": "04/10/2026: pos.mjs 21/21 + flows.mjs 24/24 no browser. 09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser. 09/10/2026 (Fase 7.3): com catalogo em cache e rede, volta a pedir o catalogo (aviso sai sozinho). flows.mjs OK.",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 418,
   "size": 24333,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/db/localDb.js",
    "frontend/src/hooks/useOfflineSync.js",
    "frontend/src/utils/syncPolicy.js",
    "frontend/src/utils/productCache.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/search.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/pos/PosDialogs.jsx"
   ],
   "usedBy": [
    "frontend/src/pages/pos/Terminal.jsx"
   ],
   "inbound": 1,
   "outbound": 9
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
   "notes": "09/10/2026: verify_system 271/271 + flows.mjs (todos os fluxos) no browser.",
   "role": "Balcao.",
   "security": "",
   "planned": false,
   "lines": 177,
   "size": 8473,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/format.js",
    "frontend/src/utils/productCache.js",
    "frontend/src/components/ui/index.js",
    "frontend/src/pages/pos/PosScreen.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 5
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
   "id": "frontend/src/ui/tokens.css",
   "path": "frontend/src/ui/tokens.css",
   "label": "tokens.css",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".css",
   "status": "partial",
   "summary": "Fonte unica de verdade visual: paleta escura vermelho/preto, tipografia, espacamento, raios, sombras e movimento.",
   "notes": "SO TEM TEMA ESCURO. O tema claro precisa do bloco [data-theme=\"light\"] (azul ciano de piscina) num ficheiro proprio.",
   "role": "Design tokens.",
   "security": "",
   "planned": false,
   "lines": 66,
   "size": 2126,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/index.css"
   ],
   "inbound": 1,
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
   "notes": "",
   "role": "Rede.",
   "security": "",
   "planned": false,
   "lines": 60,
   "size": 2494,
   "externals": [
    "axios"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/productCache.js",
    "frontend/src/utils/session.jsx",
    "frontend/src/utils/useApi.js"
   ],
   "inbound": 21,
   "outbound": 0
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
   "lines": 57,
   "size": 2309,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/MonthCloseDialog.jsx",
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/RequestAccount.jsx",
    "frontend/src/pages/auth/ResetPassword.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/Onboarding.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx",
    "frontend/src/utils/useApi.js"
   ],
   "inbound": 21,
   "outbound": 0
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
    "frontend/src/pages/owner/Products.jsx"
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
   "id": "frontend/src/utils/productCache.js",
   "path": "frontend/src/utils/productCache.js",
   "label": "productCache.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 44,
   "size": 1723,
   "externals": [],
   "dependsOn": [
    "frontend/src/db/localDb.js",
    "frontend/src/utils/api.js"
   ],
   "usedBy": [
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/pages/pos/Terminal.jsx"
   ],
   "inbound": 2,
   "outbound": 2
  },
  {
   "id": "frontend/src/utils/receiptPrinter.js",
   "path": "frontend/src/utils/receiptPrinter.js",
   "label": "receiptPrinter.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "partial",
   "summary": "Impressao do talao: Web Serial (impressora termica ligada) com recurso a window.print(). O PDFVectorial do recibo vive em receiptPdf.js.",
   "notes": "O que falha em muitos ambientes (sem Web Serial e com o popup bloqueado) ja nao e o caminho principal: o PDF e descarregado sempre antes, com o nome pedido. 09/10/2026: o QR deixou de apontar para genesis.co.mz (dominio que nao e nosso) e usa saleVerifyUrl() = origem da app + /verify/<id>.",
   "role": "Recibo (impressao).",
   "security": "Corrigido a 27/09: todo o texto (nome do produto, loja, caixista) passa por esc() e o src do QR e validado como data URL de imagem. Antes, um produto chamado <img onerror=...> executava dentro do documento do dialogo de impressao.",
   "planned": false,
   "lines": 200,
   "size": 9456,
   "externals": [
    "qrcode"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/SaleDrawer.jsx",
    "frontend/src/pages/pos/PosDialogs.jsx"
   ],
   "inbound": 2,
   "outbound": 0
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
   "notes": "09/10/2026 (Fase 7.2): tests/search.test.mjs 4/4 + pos.mjs no browser.",
   "role": "Pesquisa de produtos (POS, quebra/pedido, Produtos do dono).",
   "security": "",
   "planned": false,
   "lines": 12,
   "size": 524,
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
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 46,
   "size": 1911,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/layouts/AppShell.jsx",
    "frontend/src/pages/VerifyReceipt.jsx",
    "frontend/src/pages/auth/Login.jsx",
    "frontend/src/pages/auth/Support.jsx",
    "frontend/src/pages/owner/Onboarding.jsx"
   ],
   "inbound": 6,
   "outbound": 2
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
    "frontend/src/pages/pos/PosDialogs.jsx",
    "frontend/src/pages/pos/PosScreen.jsx",
    "frontend/src/utils/offlineQueue.js",
    "frontend/tests/offline_queue.test.mjs"
   ],
   "inbound": 4,
   "outbound": 0
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
    "frontend/src/pages/owner/Debts.jsx",
    "frontend/src/pages/owner/Home.jsx",
    "frontend/src/pages/owner/Products.jsx",
    "frontend/src/pages/owner/Reports.jsx",
    "frontend/src/pages/owner/Sales.jsx",
    "frontend/src/pages/owner/Settings.jsx",
    "frontend/src/pages/owner/ShoppingLists.jsx",
    "frontend/src/pages/owner/Suppliers.jsx",
    "frontend/src/pages/owner/Team.jsx"
   ],
   "inbound": 9,
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
   "size": 2107,
   "externals": [
    "tailwindcss"
   ],
   "dependsOn": [],
   "usedBy": [
    "admin-frontend/tailwind.config.cjs"
   ],
   "inbound": 1,
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
   "size": 5649,
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
   "lines": 279,
   "size": 16520,
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
   "lines": 162,
   "size": 9864,
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
   "lines": 129,
   "size": 8626,
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
   "status": "untracked",
   "summary": "",
   "notes": "",
   "role": "",
   "security": "",
   "planned": false,
   "lines": 67,
   "size": 3941,
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
   "lines": 26,
   "size": 1090,
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
   "id": "frontend/vite.config.js",
   "path": "frontend/vite.config.js",
   "label": "vite.config.js",
   "group": "frontend-pub",
   "dir": "frontend",
   "ext": ".js",
   "status": "ok",
   "summary": "Configuracao do Vite: proxy para a API, PWA e build.",
   "notes": "",
   "role": "Build.",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 995,
   "externals": [
    "vite",
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
   "lines": 397,
   "size": 15177,
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
   "target": "backend/src/routes/master_catalogs.js"
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
   "target": "backend/src/middleware/posWriteAuth.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/verify.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/utils/http.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/services/expiryJob.js"
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
   "target": "backend/src/utils/tokens.js"
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
   "source": "backend/src/routes/inventory.js",
   "target": "backend/src/utils/prisma.js"
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
   "source": "backend/src/routes/master_catalogs.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/master_catalogs.js",
   "target": "backend/src/middleware/rbac.js"
  },
  {
   "source": "backend/src/routes/master_catalogs.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/prisma.js"
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
   "target": "backend/src/services/tenantAlerts.js"
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
   "source": "backend/src/routes/pos.js",
   "target": "backend/src/utils/prisma.js"
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
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/prisma.js"
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
   "source": "backend/src/routes/settings.js",
   "target": "backend/src/utils/prisma.js"
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
   "source": "backend/src/routes/shrinkage_records.js",
   "target": "backend/src/utils/prisma.js"
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
   "source": "backend/src/services/expiryJob.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/expiryJob.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/services/monthlyDeductions.js"
  },
  {
   "source": "backend/src/services/reports.js",
   "target": "backend/src/services/restock.js"
  },
  {
   "source": "backend/src/services/tenantAlerts.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/tenantAlerts.js",
   "target": "backend/src/utils/fefo.js"
  },
  {
   "source": "backend/src/utils/audit.js",
   "target": "backend/src/utils/prisma.js"
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
   "source": "backend/src/utils/prisma.js",
   "target": "backend/src/utils/dbEngine2.js"
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
   "source": "backend/src/utils/stockLots.js",
   "target": "backend/src/utils/fefo.js"
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
   "source": "backend/tests/fefo.test.js",
   "target": "backend/src/utils/fefo.js"
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
   "source": "backend/tests/paymentMethods.test.js",
   "target": "backend/src/utils/paymentMethods.js"
  },
  {
   "source": "backend/tests/restock.test.js",
   "target": "backend/src/services/restock.js"
  },
  {
   "source": "backend/tests/shoppingList.test.js",
   "target": "backend/src/services/shoppingList.js"
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
   "target": "frontend/src/pages/auth/Login.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/auth/RequestAccount.jsx"
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
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/MonthCloseDialog.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/utils/receiptPrinter.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/components/SaleDrawer.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/components/ui/Button.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/Data.jsx",
   "target": "frontend/src/components/ui/cx.js"
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
   "source": "frontend/src/components/ui/Overlay.jsx",
   "target": "frontend/src/components/ui/cx.js"
  },
  {
   "source": "frontend/src/components/ui/Overlay.jsx",
   "target": "frontend/src/components/ui/Button.jsx"
  },
  {
   "source": "frontend/src/components/ui/ProductImage.jsx",
   "target": "frontend/src/components/ui/cx.js"
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
   "source": "frontend/src/index.css",
   "target": "frontend/src/ui/tokens.css"
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
   "target": "frontend/src/components/MonthCloseDialog.jsx"
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
   "target": "frontend/src/pages/auth/AuthLayout.jsx"
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
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/owner/Home.jsx",
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
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Onboarding.jsx",
   "target": "frontend/src/pages/auth/RequestAccount.jsx"
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
   "target": "frontend/src/utils/imageResize.js"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/pages/owner/ShoppingLists.jsx"
  },
  {
   "source": "frontend/src/pages/owner/Products.jsx",
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/useApi.js"
  },
  {
   "source": "frontend/src/pages/owner/Reports.jsx",
   "target": "frontend/src/utils/format.js"
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
   "target": "frontend/src/components/ui/index.js"
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
   "target": "frontend/src/utils/format.js"
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
   "target": "frontend/src/components/ui/index.js"
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
   "target": "frontend/src/components/ui/index.js"
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
   "target": "frontend/src/utils/search.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/utils/format.js"
  },
  {
   "source": "frontend/src/pages/pos/PosDialogs.jsx",
   "target": "frontend/src/components/ui/index.js"
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
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/PosScreen.jsx",
   "target": "frontend/src/pages/pos/PosDialogs.jsx"
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
   "target": "frontend/src/components/ui/index.js"
  },
  {
   "source": "frontend/src/pages/pos/Terminal.jsx",
   "target": "frontend/src/pages/pos/PosScreen.jsx"
  },
  {
   "source": "frontend/src/utils/offlineQueue.js",
   "target": "frontend/src/utils/syncPolicy.js"
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
   "source": "frontend/src/utils/session.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/utils/session.jsx",
   "target": "frontend/src/components/ui/index.js"
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
   "source": "frontend/tests/search.test.mjs",
   "target": "frontend/src/utils/search.js"
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
