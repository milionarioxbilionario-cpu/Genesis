/* GERADO AUTOMATICAMENTE por scripts/gen_mindmap_data.js - NAO EDITAR A MAO.
   Fonte de verdade curada: Mapa Mental/mapa_mental_status.json
   Gerado em: 2026-09-29T01:50:23.881Z */
window.GENESIS_MINDMAP = {
 "generatedAt": "2026-09-29T01:50:23.881Z",
 "generator": "scripts/gen_mindmap_data.js",
 "curatedFrom": "Mapa Mental/mapa_mental_status.json",
 "project": "Genesis",
 "totals": {
  "files": 160,
  "planned": 5,
  "links": 190,
  "lines": 25751,
  "byStatus": {
   "ok": 139,
   "partial": 21,
   "broken": 0,
   "planned": 5,
   "untracked": 0
  },
  "byGroup": {
   "docs": 11,
   "infra": 8,
   "admin": 8,
   "backend-data": 43,
   "backend": 34,
   "frontend-pub": 4,
   "frontend": 54,
   "scripts": 3
  }
 },
 "topExternals": [
  {
   "pkg": "react",
   "count": 38
  },
  {
   "pkg": "dotenv",
   "count": 20
  },
  {
   "pkg": "bcrypt",
   "count": 19
  },
  {
   "pkg": "lucide-react",
   "count": 18
  },
  {
   "pkg": "@prisma/client",
   "count": 16
  },
  {
   "pkg": "express",
   "count": 15
  },
  {
   "pkg": "react-router-dom",
   "count": 13
  },
  {
   "pkg": "zod",
   "count": 9
  },
  {
   "pkg": "path",
   "count": 7
  },
  {
   "pkg": "crypto",
   "count": 7
  },
  {
   "pkg": "node-fetch",
   "count": 6
  },
  {
   "pkg": "fs",
   "count": 5
  },
  {
   "pkg": "nodemailer",
   "count": 4
  },
  {
   "pkg": "child_process",
   "count": 4
  },
  {
   "pkg": "jsonwebtoken",
   "count": 4
  },
  {
   "pkg": "qrcode",
   "count": 3
  },
  {
   "pkg": "net",
   "count": 3
  },
  {
   "pkg": "axios",
   "count": 2
  },
  {
   "pkg": "react-dom",
   "count": 2
  },
  {
   "pkg": "vite",
   "count": 2
  },
  {
   "pkg": "pg",
   "count": 2
  },
  {
   "pkg": "node:test",
   "count": 2
  },
  {
   "pkg": "node:assert",
   "count": 2
  },
  {
   "pkg": "twilio",
   "count": 1
  }
 ],
 "groups": [
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
   "id": "infra",
   "label": "Infra / Raiz",
   "tone": "#94a3b8",
   "nodes": 8,
   "clusters": {
    ".": 6,
    "backend": 1,
    "frontend": 1
   }
  },
  {
   "id": "admin",
   "label": "Super Admin",
   "tone": "#a855f7",
   "nodes": 8,
   "clusters": {
    "admin-frontend": 3,
    "admin-frontend/src": 5
   }
  },
  {
   "id": "backend-data",
   "label": "Backend - Dados e Testes",
   "tone": "#8f0a11",
   "nodes": 43,
   "clusters": {
    "backend/data": 1,
    "backend/prisma": 6,
    "backend/prisma/migrations/20260905141627_init": 1,
    "backend/prisma/migrations/20260905200000_add_device_keys": 1,
    "backend/prisma/migrations/20260919_add_sale_discount_daily": 1,
    "backend/scripts": 28,
    "backend/tests": 3,
    "backend": 1,
    "backend/prisma/migrations/postgres/0001_init": 1
   }
  },
  {
   "id": "backend",
   "label": "Backend (API)",
   "tone": "#e50914",
   "nodes": 34,
   "clusters": {
    "backend/src": 1,
    "backend/src/middleware": 5,
    "backend/src/routes": 14,
    "backend/src/services": 5,
    "backend/src/utils": 8,
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
   "nodes": 54,
   "clusters": {
    "frontend/scripts": 1,
    "frontend/src": 4,
    "frontend/src/components": 4,
    "frontend/src/components/ui": 1,
    "frontend/src/data": 1,
    "frontend/src/db": 1,
    "frontend/src/hooks": 3,
    "frontend/src/i18n": 1,
    "frontend/src/layouts": 1,
    "frontend/src/pages": 8,
    "frontend/src/pages/Owner": 10,
    "frontend/src/pages/Owner/Reports": 3,
    "frontend/src/theme": 3,
    "frontend/src/ui": 6,
    "frontend/src/utils": 6,
    "frontend/tests": 1
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
   "lines": 406,
   "size": 58950,
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
   "lines": 987,
   "size": 49914,
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
   "lines": 30,
   "size": 962,
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
   "lines": 22,
   "size": 448,
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
   "notes": "DEFEITOS ABERTOS: (1) o email `admin@genesis.co.mz` vem PRE-PREENCHIDO no formulario; (2) rejeitar e bloquear usam window.prompt sem validacao; (3) a UI so usa parte da API (falta auditoria, pedidos detalhados, historico); (4) sem pesquisa nem filtros; (5) sem botao de tema.",
   "role": "Painel da plataforma.",
   "security": "",
   "planned": false,
   "lines": 476,
   "size": 19144,
   "externals": [
    "react",
    "react-router-dom",
    "axios"
   ],
   "dependsOn": [
    "admin-frontend/src/ThemeToggle.jsx"
   ],
   "usedBy": [
    "admin-frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "admin-frontend/src/ThemeToggle.jsx",
   "path": "admin-frontend/src/ThemeToggle.jsx",
   "label": "ThemeToggle.jsx",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Botão lua/sol do painel de super admin, com os ícones em SVG inline (o admin-frontend não tem lucide-react e a regra é não adicionar dependências).",
   "notes": "",
   "role": "Tema do painel admin.",
   "security": "",
   "planned": false,
   "lines": 50,
   "size": 2220,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "admin-frontend/src/theme.js"
   ],
   "usedBy": [
    "admin-frontend/src/App.jsx"
   ],
   "inbound": 1,
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
   "lines": 336,
   "size": 12870,
   "externals": [],
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
   "lines": 14,
   "size": 328,
   "externals": [
    "react",
    "react-dom",
    "react-router-dom"
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
   "id": "admin-frontend/src/theme.js",
   "path": "admin-frontend/src/theme.js",
   "label": "theme.js",
   "group": "admin",
   "dir": "admin-frontend/src",
   "ext": ".js",
   "status": "ok",
   "summary": "Leitura, aplicação e gravação do tema no painel de super admin, com a MESMA chave localStorage do produto.",
   "notes": "",
   "role": "Tema do painel admin.",
   "security": "",
   "planned": false,
   "lines": 32,
   "size": 1266,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "admin-frontend/src/ThemeToggle.jsx"
   ],
   "inbound": 1,
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
   "lines": 16,
   "size": 267,
   "externals": [
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
   "summary": "Fonte dos catalogos mestres semeada na base de dados.",
   "notes": "",
   "role": "Dados.",
   "security": "",
   "planned": false,
   "lines": 68,
   "size": 4863,
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
   "lines": 35,
   "size": 1068,
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
   "id": "backend/prisma/rls.sql",
   "path": "backend/prisma/rls.sql",
   "label": "rls.sql",
   "group": "backend-data",
   "dir": "backend/prisma",
   "ext": ".sql",
   "status": "partial",
   "summary": "Script auxiliar de activacao de RLS.",
   "notes": "",
   "role": "Seguranca de dados.",
   "security": "",
   "planned": false,
   "lines": 120,
   "size": 4415,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "backend/prisma/rls_policies.sql",
   "path": "backend/prisma/rls_policies.sql",
   "label": "rls_policies.sql",
   "group": "backend-data",
   "dir": "backend/prisma",
   "ext": ".sql",
   "status": "partial",
   "summary": "Politicas de Row Level Security para 16 tabelas (isolamento por tenant).",
   "notes": "Enquanto nao forem aplicadas, o isolamento depende do scoping da aplicacao (tenantRls).",
   "role": "Seguranca de dados.",
   "security": "Escritas e prontas; FALTA APLICAR no Supabase (prisma db push + rls_policies.sql).",
   "planned": false,
   "lines": 118,
   "size": 5195,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/prisma/migrations/postgres/0001_init/migration.sql"
   ],
   "inbound": 1,
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
   "lines": 295,
   "size": 10048,
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
   "lines": 312,
   "size": 10930,
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
   "id": "backend/scripts/check_sale.js",
   "path": "backend/scripts/check_sale.js",
   "label": "check_sale.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Inspecciona uma venda na base de dados.",
   "notes": "",
   "role": "Diagnostico.",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 555,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
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
   "id": "backend/scripts/create_tenant_7777.js",
   "path": "backend/scripts/create_tenant_7777.js",
   "label": "create_tenant_7777.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Cria o tenant de teste 7777.",
   "notes": "",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 22,
   "size": 528,
   "externals": [],
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
   "id": "backend/scripts/diag_login.js",
   "path": "backend/scripts/diag_login.js",
   "label": "diag_login.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Diagnostico de problemas de login (hash, tenant, estado da conta).",
   "notes": "",
   "role": "Diagnostico.",
   "security": "",
   "planned": false,
   "lines": 54,
   "size": 1836,
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
   "id": "backend/scripts/e2e_test2.fixed.js",
   "path": "backend/scripts/e2e_test2.fixed.js",
   "label": "e2e_test2.fixed.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Versao corrigida do E2E2.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 163,
   "size": 5606,
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
   "id": "backend/scripts/e2e_test2.js",
   "path": "backend/scripts/e2e_test2.js",
   "label": "e2e_test2.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Fluxo E2E mais completo, com cabecalho Authorization.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 164,
   "size": 5607,
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
   "id": "backend/scripts/insert_product_7777.js",
   "path": "backend/scripts/insert_product_7777.js",
   "label": "insert_product_7777.js",
   "group": "backend-data",
   "dir": "backend/scripts",
   "ext": ".js",
   "status": "ok",
   "summary": "Insere um produto de teste no tenant 7777.",
   "notes": "",
   "role": "Apoio.",
   "security": "",
   "planned": false,
   "lines": 22,
   "size": 551,
   "externals": [],
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
   "summary": "Popula/actualiza a tabela de catalogos mestres sem duplicar.",
   "notes": "",
   "role": "Semear dados.",
   "security": "",
   "planned": false,
   "lines": 124,
   "size": 6205,
   "externals": [
    "dotenv",
    "@prisma/client",
    "fs",
    "path"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
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
   "lines": 244,
   "size": 9173,
   "externals": [
    "dotenv",
    "express",
    "cors",
    "cookie-parser",
    "bcrypt"
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
    "backend/src/routes/shift_closings.js",
    "backend/src/routes/demand_captures.js",
    "backend/src/routes/device_keys.js",
    "backend/src/middleware/deviceKeyAuth.js",
    "backend/src/routes/shrinkage_records.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/authOrDevice.js",
    "backend/src/middleware/rbac.js",
    "backend/src/middleware/adminOriginCheck.js",
    "backend/src/routes/refresh.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 20
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
   "lines": 12,
   "size": 440,
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
   "lines": 47,
   "size": 1519,
   "externals": [
    "jsonwebtoken"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/middleware/authOrDevice.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/master_catalogs.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/products.js"
   ],
   "inbound": 8,
   "outbound": 0
  },
  {
   "id": "backend/src/middleware/authOrDevice.js",
   "path": "backend/src/middleware/authOrDevice.js",
   "label": "authOrDevice.js",
   "group": "backend",
   "dir": "backend/src/middleware",
   "ext": ".js",
   "status": "ok",
   "summary": "Aceita JWT OU chave de dispositivo (POS offline).",
   "notes": "",
   "role": "Autenticacao do POS.",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 461,
   "externals": [],
   "dependsOn": [
    "backend/src/middleware/auth.js",
    "backend/src/middleware/deviceKeyAuth.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "backend/src/middleware/deviceKeyAuth.js",
   "path": "backend/src/middleware/deviceKeyAuth.js",
   "label": "deviceKeyAuth.js",
   "group": "backend",
   "dir": "backend/src/middleware",
   "ext": ".js",
   "status": "ok",
   "summary": "Valida chaves de dispositivo registadas para lojas sem sessao de utilizador.",
   "notes": "",
   "role": "Autenticacao de dispositivos.",
   "security": "",
   "planned": false,
   "lines": 32,
   "size": 1216,
   "externals": [],
   "dependsOn": [
    "backend/src/services/deviceKeyService.js"
   ],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/middleware/authOrDevice.js",
    "backend/tests/device_key_service.test.js"
   ],
   "inbound": 3,
   "outbound": 1
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
   "lines": 21,
   "size": 510,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/index.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/master_catalogs.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/products.js"
   ],
   "inbound": 7,
   "outbound": 0
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
   "notes": "",
   "role": "API da plataforma.",
   "security": "requireRole('super_admin') + adminOriginCheck.",
   "planned": false,
   "lines": 334,
   "size": 11211,
   "externals": [
    "express",
    "bcrypt",
    "crypto",
    "jsonwebtoken"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 1
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
   "lines": 590,
   "size": 21464,
   "externals": [
    "express",
    "jsonwebtoken",
    "bcrypt",
    "zod",
    "express-rate-limit",
    "crypto"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/services/passwordResetStore.js",
    "backend/src/utils/whatsapp.js",
    "backend/src/utils/mailer.js"
   ],
   "usedBy": [
    "backend/scripts/test_google.js",
    "backend/src/index.js"
   ],
   "inbound": 2,
   "outbound": 4
  },
  {
   "id": "backend/src/routes/catalogs.js",
   "path": "backend/src/routes/catalogs.js",
   "label": "catalogs.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "partial",
   "summary": "Importacao do catalogo sugerido no onboarding.",
   "notes": "Validado a mao; sem testes automatizados.",
   "role": "Onboarding.",
   "security": "",
   "planned": false,
   "lines": 171,
   "size": 8111,
   "externals": [
    "express",
    "zod"
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
   "lines": 161,
   "size": 5305,
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
   "lines": 73,
   "size": 2621,
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
   "id": "backend/src/routes/device_keys.js",
   "path": "backend/src/routes/device_keys.js",
   "label": "device_keys.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Emissao e revogacao de chaves de dispositivo para o POS.",
   "notes": "",
   "role": "Dispositivos.",
   "security": "",
   "planned": false,
   "lines": 53,
   "size": 2286,
   "externals": [
    "express"
   ],
   "dependsOn": [
    "backend/src/services/deviceKeyService.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 1
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
   "lines": 117,
   "size": 3804,
   "externals": [
    "express",
    "zod"
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
   "lines": 950,
   "size": 36862,
   "externals": [
    "express",
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/middleware/auth.js",
    "backend/src/middleware/rbac.js",
    "backend/src/utils/whatsapp.js",
    "backend/src/services/tenantAlerts.js",
    "backend/src/services/monthlyDeductions.js",
    "backend/src/utils/shiftLock.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 7
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
   "lines": 219,
   "size": 7669,
   "externals": [
    "express",
    "zod"
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
   "lines": 29,
   "size": 1455,
   "externals": [
    "express",
    "jsonwebtoken"
   ],
   "dependsOn": [],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "backend/src/routes/sales.js",
   "path": "backend/src/routes/sales.js",
   "label": "sales.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Venda transaccional: valida stock, calcula totais em centavos, gera daily_number sequencial por dia, idempotencia por id e auditoria.",
   "notes": "getNextDailyNumber reinicia a contagem a meia-noite - e a base do nome Recibo_N.",
   "role": "Nucleo do POS.",
   "security": "",
   "planned": false,
   "lines": 430,
   "size": 17908,
   "externals": [
    "express",
    "zod",
    "bcrypt",
    "crypto"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/shiftLock.js",
    "backend/src/utils/tenantRls.js",
    "backend/src/utils/paymentMethods.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "backend/src/routes/shift_closings.js",
   "path": "backend/src/routes/shift_closings.js",
   "label": "shift_closings.js",
   "group": "backend",
   "dir": "backend/src/routes",
   "ext": ".js",
   "status": "ok",
   "summary": "Fecho de turno: o SERVIDOR calcula o esperado (vendas em dinheiro desde o ultimo fecho) e RECUSA qualquer contagem abaixo disso, com auditoria da tentativa falhada.",
   "notes": "Correcao directa do bug 'permite fechar abaixo do que foi vendido'.",
   "role": "Fecho de caixa.",
   "security": "BURACO FECHADO a 26/09: o expected_amount do corpo do pedido e ignorado e a rota esta montada apenas para o dono.",
   "planned": false,
   "lines": 255,
   "size": 9503,
   "externals": [
    "express",
    "zod"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/utils/shiftLock.js"
   ],
   "usedBy": [
    "backend/src/index.js"
   ],
   "inbound": 1,
   "outbound": 2
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
   "lines": 75,
   "size": 2874,
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
   "id": "backend/src/services/deviceKeyService.js",
   "path": "backend/src/services/deviceKeyService.js",
   "label": "deviceKeyService.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Criacao e validacao de chaves de dispositivo.",
   "notes": "",
   "role": "Servico.",
   "security": "",
   "planned": false,
   "lines": 64,
   "size": 2302,
   "externals": [
    "crypto",
    "bcrypt"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/middleware/deviceKeyAuth.js",
    "backend/src/routes/device_keys.js",
    "backend/tests/device_key_service.test.js"
   ],
   "inbound": 3,
   "outbound": 1
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
   "notes": "",
   "role": "Financeiro.",
   "security": "",
   "planned": false,
   "lines": 55,
   "size": 1790,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/owner.js",
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
   "id": "backend/src/services/tenantAlerts.js",
   "path": "backend/src/services/tenantAlerts.js",
   "label": "tenantAlerts.js",
   "group": "backend",
   "dir": "backend/src/services",
   "ext": ".js",
   "status": "ok",
   "summary": "Alertas de stock minimo e validade vencida para o dashboard do dono.",
   "notes": "",
   "role": "Operacoes.",
   "security": "",
   "planned": false,
   "lines": 45,
   "size": 1776,
   "externals": [],
   "dependsOn": [
    "backend/src/utils/prisma.js"
   ],
   "usedBy": [
    "backend/src/routes/owner.js",
    "backend/src/jobs/dailyDigest.js"
   ],
   "inbound": 2,
   "outbound": 1
  },
  {
   "id": "backend/src/utils/dbEngine.js",
   "path": "backend/src/utils/dbEngine.js",
   "label": "dbEngine.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Deteta o motor da base de dados a partir do DATABASE_URL (sqlite vs postgres).",
   "notes": "",
   "role": "Infra de dados.",
   "security": "",
   "planned": false,
   "lines": 247,
   "size": 10869,
   "externals": [
    "path",
    "child_process",
    "fs",
    "net",
    "pg"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
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
   "notes": "Escrito a 26/09 para desbloquear o 'servidor offline'.",
   "role": "Infra de dados.",
   "security": "",
   "planned": false,
   "lines": 154,
   "size": 5648,
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
   "summary": "Canonicalizacao das formas de pagamento (cash, card, mpesa...).",
   "notes": "",
   "role": "Dominio de vendas.",
   "security": "",
   "planned": false,
   "lines": 43,
   "size": 1344,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "backend/src/routes/sales.js"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "backend/src/utils/prisma.js",
   "path": "backend/src/utils/prisma.js",
   "label": "prisma.js",
   "group": "backend",
   "dir": "backend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Cliente Prisma unico (singleton) partilhado por todo o backend.",
   "notes": "CORRIGIDO 28/09: o proxy preguiçoso devolvia uma FUNCAO para tudo enquanto o cliente nao estava pronto, e `prisma.user.findUnique` ficava undefined (TypeError -> 500 opaco em qualquer rota que tocasse na BD antes do arranque). Agora cada acesso e adiado por um Proxy recursivo, que so vai buscar o model delegate no momento da chamada.",
   "role": "Acesso a base de dados.",
   "security": "",
   "planned": false,
   "lines": 93,
   "size": 3676,
   "externals": [
    "@prisma/client"
   ],
   "dependsOn": [
    "backend/src/utils/dbEngine2.js"
   ],
   "usedBy": [
    "backend/scripts/check_sale.js",
    "backend/scripts/create_system_user.js",
    "backend/scripts/create_tenant_7777.js",
    "backend/scripts/create_test_tenant.js",
    "backend/scripts/ensure_device_keys.js",
    "backend/scripts/gerir_contas.js",
    "backend/scripts/insert_product_7777.js",
    "backend/scripts/seed_demo.js",
    "backend/scripts/shift_closing_e2e.js",
    "backend/src/index.js",
    "backend/src/routes/admin.js",
    "backend/src/routes/auth.js",
    "backend/src/routes/catalogs.js",
    "backend/src/routes/dashboard.js",
    "backend/src/routes/demand_captures.js",
    "backend/src/routes/inventory.js",
    "backend/src/routes/master_catalogs.js",
    "backend/src/routes/owner.js",
    "backend/src/routes/products.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/shift_closings.js",
    "backend/src/routes/shrinkage_records.js",
    "backend/src/services/deviceKeyService.js",
    "backend/src/services/tenantAlerts.js",
    "backend/tests/device_key_service.test.js",
    "backend/src/services/report.service.js"
   ],
   "inbound": 26,
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
    "backend/src/routes/owner.js",
    "backend/src/routes/sales.js",
    "backend/src/routes/shift_closings.js"
   ],
   "inbound": 3,
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
   "id": "backend/tests/device_key_service.test.js",
   "path": "backend/tests/device_key_service.test.js",
   "label": "device_key_service.test.js",
   "group": "backend-data",
   "dir": "backend/tests",
   "ext": ".js",
   "status": "ok",
   "summary": "Testes do servico de chaves de dispositivo.",
   "notes": "",
   "role": "Teste.",
   "security": "",
   "planned": false,
   "lines": 78,
   "size": 2223,
   "externals": [
    "node:test",
    "node:assert"
   ],
   "dependsOn": [
    "backend/src/utils/prisma.js",
    "backend/src/services/deviceKeyService.js",
    "backend/src/middleware/deviceKeyAuth.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 3
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
   "lines": 73,
   "size": 2710,
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
   "id": "backend/verify_hash.js",
   "path": "backend/verify_hash.js",
   "label": "verify_hash.js",
   "group": "backend-data",
   "dir": "backend",
   "ext": ".js",
   "status": "ok",
   "summary": "Utilitario de verificacao de hashes de palavra-passe.",
   "notes": "",
   "role": "Diagnostico.",
   "security": "",
   "planned": false,
   "lines": 25,
   "size": 821,
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
   "lines": 40,
   "size": 1729,
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
   "lines": 35,
   "size": 790,
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
   "lines": 131,
   "size": 5176,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/CashierLogin.jsx",
    "frontend/src/pages/ResetPassword.jsx",
    "frontend/src/pages/RequestAccount.jsx",
    "frontend/src/pages/Owner/Dashboard.jsx",
    "frontend/src/pages/Owner/Products.jsx",
    "frontend/src/pages/Owner/Stock.jsx",
    "frontend/src/pages/Owner/Suppliers.jsx",
    "frontend/src/pages/Owner/DeviceKeys.jsx",
    "frontend/src/pages/Owner/Employees.jsx",
    "frontend/src/pages/Owner/Debts.jsx",
    "frontend/src/pages/Owner/Goals.jsx",
    "frontend/src/pages/Owner/Settings.jsx",
    "frontend/src/pages/Owner/AuditLogViewer.jsx",
    "frontend/src/pages/Owner/Reports/DailyReport.jsx",
    "frontend/src/pages/Owner/Reports/WeeklyReport.jsx",
    "frontend/src/pages/Owner/Reports/MonthlyReport.jsx",
    "frontend/src/pages/OnboardingWizard.jsx",
    "frontend/src/components/ProtectedRoute.jsx",
    "frontend/src/components/PosGate.jsx",
    "frontend/src/pages/Hub.jsx",
    "frontend/src/components/ui/index.jsx",
    "frontend/src/layouts/CRMLayout.jsx"
   ],
   "usedBy": [
    "frontend/src/main.jsx"
   ],
   "inbound": 1,
   "outbound": 23
  },
  {
   "id": "frontend/src/components/PosGate.jsx",
   "path": "frontend/src/components/PosGate.jsx",
   "label": "PosGate.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Porta do POS: escolhe entre login de caixista, chave de dispositivo ou perfil bloqueado.",
   "notes": "",
   "role": "Entrada do POS.",
   "security": "",
   "planned": false,
   "lines": 82,
   "size": 3048,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/utils/hubSession.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/components/Printer3D.jsx",
   "path": "frontend/src/components/Printer3D.jsx",
   "label": "Printer3D.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Impressora 3D de verdade: corpo em CSS 3D, fenda escura, dois LEDs e o papel a sair com inclinação que endireita. Ao fim da animação chama onPrinted - é aí que o PDF é gerado e descarregado.",
   "notes": "Substitui o antigo Receipt3D, que era só uma barra de 6px com gradiente. O Receipt3D continua exportado a partir daqui para não partir importes.",
   "role": "Recibo (animação 3D).",
   "security": "",
   "planned": false,
   "lines": 86,
   "size": 3452,
   "externals": [
    "react"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/CashierDashboard.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/components/ProtectedRoute.jsx",
   "path": "frontend/src/components/ProtectedRoute.jsx",
   "label": "ProtectedRoute.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Valida a sessao e o perfil antes de renderizar a pagina; redirecciona para /login.",
   "notes": "",
   "role": "Guardas de rota.",
   "security": "Bloqueio no cliente; o servidor continua a validar cada pedido.",
   "planned": false,
   "lines": 51,
   "size": 1419,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "frontend/src/components/SecurityGateIcon.jsx",
   "path": "frontend/src/components/SecurityGateIcon.jsx",
   "label": "SecurityGateIcon.jsx",
   "group": "frontend",
   "dir": "frontend/src/components",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Sinal de porta para o ecrã de recuperar senha: dois painéis fechados que abrem (com ciano) quando o código do email está confirmado.",
   "notes": "",
   "role": "Indicador de segurança na UI.",
   "security": "",
   "planned": false,
   "lines": 29,
   "size": 1338,
   "externals": [
    "react"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/ResetPassword.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/components/ui/index.jsx",
   "path": "frontend/src/components/ui/index.jsx",
   "label": "index.jsx",
   "group": "frontend",
   "dir": "frontend/src/components/ui",
   "ext": ".jsx",
   "status": "partial",
   "summary": "Kit de UI: Card, Button, Modal, Tag, StatCard, ToastProvider, AmbientLayer, GlowCard, Receipt3D, SheenBar.",
   "notes": "O Receipt3D actual e apenas uma barra de 6px com gradiente: nao ha impressora desenhada. Precisa do Printer3D.",
   "role": "Design system.",
   "security": "",
   "planned": false,
   "lines": 498,
   "size": 19708,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/layouts/CRMLayout.jsx",
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/Owner/AuditLogViewer.jsx",
    "frontend/src/pages/Owner/Dashboard.jsx",
    "frontend/src/pages/Owner/Debts.jsx",
    "frontend/src/pages/Owner/DeviceKeys.jsx",
    "frontend/src/pages/Owner/Employees.jsx",
    "frontend/src/pages/Owner/Goals.jsx",
    "frontend/src/pages/Owner/Products.jsx",
    "frontend/src/pages/Owner/Reports/DailyReport.jsx",
    "frontend/src/pages/Owner/Reports/MonthlyReport.jsx",
    "frontend/src/pages/Owner/Reports/WeeklyReport.jsx",
    "frontend/src/pages/Owner/Settings.jsx",
    "frontend/src/pages/Owner/Stock.jsx",
    "frontend/src/pages/Owner/Suppliers.jsx",
    "frontend/src/pages/ResetPassword.jsx",
    "frontend/src/pages/CodeMap.jsx"
   ],
   "inbound": 19,
   "outbound": 0
  },
  {
   "id": "frontend/src/data/master_catalogs.json",
   "path": "frontend/src/data/master_catalogs.json",
   "label": "master_catalogs.json",
   "group": "frontend",
   "dir": "frontend/src/data",
   "ext": ".json",
   "status": "ok",
   "summary": "Catalogos mestres usados como sugestao no onboarding, sem CDN.",
   "notes": "",
   "role": "Dados.",
   "security": "",
   "planned": false,
   "lines": 16,
   "size": 560,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
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
   "lines": 45,
   "size": 1922,
   "externals": [
    "dexie"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/hooks/useOfflineSync.js",
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/pages/Owner/DeviceKeys.jsx"
   ],
   "inbound": 3,
   "outbound": 0
  },
  {
   "id": "frontend/src/hooks/useAuth.js",
   "path": "frontend/src/hooks/useAuth.js",
   "label": "useAuth.js",
   "group": "frontend",
   "dir": "frontend/src/hooks",
   "ext": ".js",
   "status": "ok",
   "summary": "Hook de sessao: carrega o utilizador e respeita o role.",
   "notes": "",
   "role": "Autenticacao.",
   "security": "",
   "planned": false,
   "lines": 24,
   "size": 535,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/src/hooks/useIsolatedScreen.js",
   "path": "frontend/src/hooks/useIsolatedScreen.js",
   "label": "useIsolatedScreen.js",
   "group": "frontend",
   "dir": "frontend/src/hooks",
   "ext": ".js",
   "status": "ok",
   "summary": "Modo ecra isolado (kiosk) para o balcao.",
   "notes": "",
   "role": "POS.",
   "security": "",
   "planned": false,
   "lines": 33,
   "size": 1455,
   "externals": [
    "react"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/pages/Hub.jsx"
   ],
   "inbound": 2,
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
   "lines": 162,
   "size": 5820,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/db/localDb.js"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 1
  },
  {
   "id": "frontend/src/i18n/index.js",
   "path": "frontend/src/i18n/index.js",
   "label": "index.js",
   "group": "frontend",
   "dir": "frontend/src/i18n",
   "ext": ".js",
   "status": "partial",
   "summary": "Internacionalizacao PT/EN (i18next) com dicionarios do login, POS e reposicao de senha.",
   "notes": "Textos do fluxo antigo ja removidos: agora so existe o modo por codigo com confirmacao separada.",
   "role": "Textos.",
   "security": "",
   "planned": false,
   "lines": 172,
   "size": 7509,
   "externals": [
    "i18next",
    "react-i18next"
   ],
   "dependsOn": [
    "frontend/src/i18n/index.js"
   ],
   "usedBy": [
    "frontend/src/i18n/index.js",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/ResetPassword.jsx"
   ],
   "inbound": 3,
   "outbound": 1
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
   "lines": 930,
   "size": 34297,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/src/layouts/CRMLayout.jsx",
   "path": "frontend/src/layouts/CRMLayout.jsx",
   "label": "CRMLayout.jsx",
   "group": "frontend",
   "dir": "frontend/src/layouts",
   "ext": ".jsx",
   "status": "partial",
   "summary": "Shell do Genesis para donos e caixistas: sidebar recolhivel, topbar, paleta de comandos Ctrl+K, estado online/offline e logout.",
   "notes": "Falta o botao de tema claro/escuro.",
   "role": "Shell.",
   "security": "",
   "planned": false,
   "lines": 292,
   "size": 11646,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx",
    "frontend/src/theme/ThemeToggle.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
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
   "lines": 23,
   "size": 553,
   "externals": [
    "react",
    "react-dom"
   ],
   "dependsOn": [
    "frontend/src/App.jsx",
    "frontend/src/theme/ThemeProvider.jsx"
   ],
   "usedBy": [],
   "inbound": 0,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/CashierDashboard.jsx",
   "path": "frontend/src/pages/CashierDashboard.jsx",
   "label": "CashierDashboard.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "partial",
   "summary": "POS completo: catalogo, carrinho, descontos, varios pagamentos, venda, pre-visualizacao do recibo com QR, fecho de turno cego e hub do balcao.",
   "notes": "O botao 'Imprimir recibo' nao descarrega PDF nem mostra impressora 3D em condicoes.",
   "role": "Caixa.",
   "security": "",
   "planned": false,
   "lines": 934,
   "size": 39082,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react",
    "qrcode"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/db/localDb.js",
    "frontend/src/utils/receiptPrinter.js",
    "frontend/src/utils/money.js",
    "frontend/src/utils/hubSession.js",
    "frontend/src/hooks/useIsolatedScreen.js",
    "frontend/src/components/ui/index.jsx",
    "frontend/src/components/Printer3D.jsx",
    "frontend/src/theme/ThemeToggle.jsx",
    "frontend/src/utils/receiptPdf.js"
   ],
   "usedBy": [
    "frontend/src/components/PosGate.jsx"
   ],
   "inbound": 1,
   "outbound": 10
  },
  {
   "id": "frontend/src/pages/CashierLogin.jsx",
   "path": "frontend/src/pages/CashierLogin.jsx",
   "label": "CashierLogin.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Login do caixista por PIN/utilizador dentro do estabelecimento.",
   "notes": "",
   "role": "Autenticacao.",
   "security": "",
   "planned": false,
   "lines": 7,
   "size": 135,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/pages/Login.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "frontend/src/pages/Hub.jsx",
   "path": "frontend/src/pages/Hub.jsx",
   "label": "Hub.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "partial",
   "summary": "Hub do balcao: criar caixistas, abrir/fechar turnos e entrar no POS de cada perfil.",
   "notes": "Ainda tem cores hex fixas em style inline: nao acompanha o tema claro.",
   "role": "Gestao de caixistas.",
   "security": "",
   "planned": false,
   "lines": 200,
   "size": 13009,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/hubSession.js",
    "frontend/src/hooks/useIsolatedScreen.js",
    "frontend/src/theme/ThemeToggle.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 4
  },
  {
   "id": "frontend/src/pages/Login.jsx",
   "path": "frontend/src/pages/Login.jsx",
   "label": "Login.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "partial",
   "summary": "Login do dono: email/senha, botao Google Identity Services e ligacao para recuperacao de senha.",
   "notes": "Falta o botao de tema. O Google so funciona depois de autorizar a origem no Google Cloud Console. CORRIGIDO 28/09: quando o backend responde code=CLOCK_SKEW, o ecra passa a explicar que a HORA DO COMPUTADOR esta errada em vez de mostrar o generico 'nao foi possivel validar a sessao do Google'.",
   "role": "Autenticacao.",
   "security": "",
   "planned": false,
   "lines": 357,
   "size": 14844,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx",
    "frontend/src/theme/ThemeToggle.jsx",
    "frontend/src/i18n/index.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx",
    "frontend/src/pages/CashierLogin.jsx"
   ],
   "inbound": 2,
   "outbound": 4
  },
  {
   "id": "frontend/src/pages/OnboardingWizard.jsx",
   "path": "frontend/src/pages/OnboardingWizard.jsx",
   "label": "OnboardingWizard.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Wizard de arranque da loja: tipo de negocio, catalogo sugerido e importacao em poucos cliques.",
   "notes": "",
   "role": "Onboarding.",
   "security": "",
   "planned": false,
   "lines": 323,
   "size": 17666,
   "externals": [
    "react",
    "react-router-dom"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/money.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/AuditLogViewer.jsx",
   "path": "frontend/src/pages/Owner/AuditLogViewer.jsx",
   "label": "AuditLogViewer.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Leitor do registo de auditoria do tenant.",
   "notes": "",
   "role": "Auditoria.",
   "security": "",
   "planned": false,
   "lines": 44,
   "size": 2081,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/Dashboard.jsx",
   "path": "frontend/src/pages/Owner/Dashboard.jsx",
   "label": "Dashboard.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Visao geral do dono: KPIs, graficos Recharts, alertas de stock/validade e exportacao CSV.",
   "notes": "",
   "role": "Painel do dono.",
   "security": "",
   "planned": false,
   "lines": 323,
   "size": 16502,
   "externals": [
    "react",
    "react-router-dom",
    "recharts",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/Debts.jsx",
   "path": "frontend/src/pages/Owner/Debts.jsx",
   "label": "Debts.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Chenecas: dividas de clientes, pagamentos parciais e saldo em falta.",
   "notes": "",
   "role": "Credito.",
   "security": "",
   "planned": false,
   "lines": 58,
   "size": 3410,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/DeviceKeys.jsx",
   "path": "frontend/src/pages/Owner/DeviceKeys.jsx",
   "label": "DeviceKeys.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Chaves de dispositivo do POS: emitir, listar e revogar.",
   "notes": "",
   "role": "Dispositivos.",
   "security": "",
   "planned": false,
   "lines": 104,
   "size": 5938,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/db/localDb.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/Owner/Employees.jsx",
   "path": "frontend/src/pages/Owner/Employees.jsx",
   "label": "Employees.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Trabalhadores e salarios mensais (dinheiro convertido para centavos no envio).",
   "notes": "",
   "role": "Recursos humanos.",
   "security": "",
   "planned": false,
   "lines": 109,
   "size": 6985,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/money.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/Owner/Goals.jsx",
   "path": "frontend/src/pages/Owner/Goals.jsx",
   "label": "Goals.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Metas de venda com barra de progresso e cor por percentagem.",
   "notes": "",
   "role": "Vendas.",
   "security": "",
   "planned": false,
   "lines": 85,
   "size": 5105,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/money.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/Owner/Products.jsx",
   "path": "frontend/src/pages/Owner/Products.jsx",
   "label": "Products.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Gestao de produtos: criar/editar, precos, stock minimo e codigos de barras.",
   "notes": "",
   "role": "Catalogo.",
   "security": "",
   "planned": false,
   "lines": 171,
   "size": 9729,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/money.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/Owner/Reports/DailyReport.jsx",
   "path": "frontend/src/pages/Owner/Reports/DailyReport.jsx",
   "label": "DailyReport.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner/Reports",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Relatorio diario de vendas.",
   "notes": "",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 48,
   "size": 2571,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/Reports/MonthlyReport.jsx",
   "path": "frontend/src/pages/Owner/Reports/MonthlyReport.jsx",
   "label": "MonthlyReport.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner/Reports",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Relatorio mensal com o lucro liquido REAL: receita menos custo das mercadorias menos deducoes (salarios e custos fixos), em visual de cascata.",
   "notes": "Vendas canceladas nunca contam na receita.",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 88,
   "size": 5403,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/Reports/WeeklyReport.jsx",
   "path": "frontend/src/pages/Owner/Reports/WeeklyReport.jsx",
   "label": "WeeklyReport.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner/Reports",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Relatorio semanal de vendas.",
   "notes": "",
   "role": "Relatorios.",
   "security": "",
   "planned": false,
   "lines": 58,
   "size": 3250,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/Settings.jsx",
   "path": "frontend/src/pages/Owner/Settings.jsx",
   "label": "Settings.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Definicoes do estabelecimento: horario de funcionamento, dados da loja e preferencias.",
   "notes": "",
   "role": "Configuracao.",
   "security": "",
   "planned": false,
   "lines": 109,
   "size": 5637,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 2
  },
  {
   "id": "frontend/src/pages/Owner/Stock.jsx",
   "path": "frontend/src/pages/Owner/Stock.jsx",
   "label": "Stock.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Entradas de stock e historico de movimentos.",
   "notes": "",
   "role": "Stock.",
   "security": "",
   "planned": false,
   "lines": 177,
   "size": 9309,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/money.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/Owner/Suppliers.jsx",
   "path": "frontend/src/pages/Owner/Suppliers.jsx",
   "label": "Suppliers.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages/Owner",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Gestao de fornecedores.",
   "notes": "",
   "role": "Compras.",
   "security": "",
   "planned": false,
   "lines": 92,
   "size": 4703,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/utils/money.js",
    "frontend/src/components/ui/index.jsx"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 3
  },
  {
   "id": "frontend/src/pages/RequestAccount.jsx",
   "path": "frontend/src/pages/RequestAccount.jsx",
   "label": "RequestAccount.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Pedido publico de conta de loja, aprovado depois no painel de super admin.",
   "notes": "CORRIGIDO 28/09 (backend): o formulario nao avancava porque o POST /api/auth/request-account devolvia 500. Causa: faltava a coluna Tenant.onboarding_completed no Postgres e o tenant.create escreve-a. Validado: devolve 201 'Pedido recebido' e o registo de teste foi apagado.",
   "role": "Aquisicao.",
   "security": "",
   "planned": false,
   "lines": 155,
   "size": 7738,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js"
   ],
   "usedBy": [
    "frontend/src/App.jsx"
   ],
   "inbound": 1,
   "outbound": 1
  },
  {
   "id": "frontend/src/pages/ResetPassword.jsx",
   "path": "frontend/src/pages/ResetPassword.jsx",
   "label": "ResetPassword.jsx",
   "group": "frontend",
   "dir": "frontend/src/pages",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Recuperacao de senha em 3 fases separadas: pedir codigo, confirmar codigo (so com 6 digitos), e so entao escolher a nova senha com repeticao. O cadeado abre no ecra depois do codigo confirmado.",
   "notes": "BUG GRAVE CORRIGIDO 28/09: a cadeia de ternarios do JSX tinha um ramo `: !sent ?` DUPLICADO logo a seguir ao `done ?`, e esse ramo renderizava o ecra de 'Senha redefinida com sucesso'. Como `sent` comeca a false, ao abrir /forgot-password aparecia de imediato a mensagem de sucesso — sem pedir email, sem campo de codigo e sem nunca passar pela fase 1. O ramo duplicado foi removido e a cadeia ficou done ? !sent ? !verified ? (nova senha). Agora, sem SMTP, o codigo devolvido em modo desenvolvimento (DEV_SHOW_RESET_CODE) aparece no ecra para o utilizador poder copiar.",
   "role": "Recuperacao de conta.",
   "security": "A fase da nova senha nem existe no DOM antes do codigo ser confirmado; o servidor continua a exigir { email, code, password } e conta tentativas. A 26/09 o bug que impedia QUALQUER reposicao foi corrigido.",
   "planned": false,
   "lines": 319,
   "size": 13836,
   "externals": [
    "react",
    "react-router-dom",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/utils/api.js",
    "frontend/src/components/ui/index.jsx",
    "frontend/src/components/SecurityGateIcon.jsx",
    "frontend/src/theme/ThemeToggle.jsx",
    "frontend/src/i18n/index.js"
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
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/src/theme/PoolWater.jsx",
   "path": "frontend/src/theme/PoolWater.jsx",
   "label": "PoolWater.jsx",
   "group": "frontend",
   "dir": "frontend/src/theme",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Camada decorativa da piscina: azulejos, quatro ondas e três manchas de luz (causticas) em CSS puro. Só é montada no tema claro.",
   "notes": "aria-hidden + pointer-events:none: nunca interfere com cliques nem com leitores de ecrã. Fica parada em prefers-reduced-motion.",
   "role": "Animação do modo claro.",
   "security": "",
   "planned": false,
   "lines": 26,
   "size": 1143,
   "externals": [
    "react"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/theme/ThemeProvider.jsx"
   ],
   "inbound": 1,
   "outbound": 0
  },
  {
   "id": "frontend/src/theme/ThemeProvider.jsx",
   "path": "frontend/src/theme/ThemeProvider.jsx",
   "label": "ThemeProvider.jsx",
   "group": "frontend",
   "dir": "frontend/src/theme",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Contexto de tema: aplica data-theme no <html>, guarda em localStorage (chave genesis.theme) e monta a camada da piscina quando o tema é claro.",
   "notes": "First choice da ausencia de escolha guardada: respeita prefers-color-scheme. O index.html repete a lógica num script inline para não haver flash branco.",
   "role": "Tema claro/escuro.",
   "security": "",
   "planned": false,
   "lines": 81,
   "size": 2980,
   "externals": [
    "react"
   ],
   "dependsOn": [
    "frontend/src/theme/PoolWater.jsx"
   ],
   "usedBy": [
    "frontend/src/main.jsx",
    "frontend/src/theme/ThemeToggle.jsx"
   ],
   "inbound": 2,
   "outbound": 1
  },
  {
   "id": "frontend/src/theme/ThemeToggle.jsx",
   "path": "frontend/src/theme/ThemeToggle.jsx",
   "label": "ThemeToggle.jsx",
   "group": "frontend",
   "dir": "frontend/src/theme",
   "ext": ".jsx",
   "status": "ok",
   "summary": "Botão lua/sol que alterna o tema. Presente no login, no shell do dono, no POS, no Hub e no ecrã de recuperação de senha.",
   "notes": "",
   "role": "Tema claro/escuro.",
   "security": "aria-pressed + title descrevem o estado para leitores de ecrã.",
   "planned": false,
   "lines": 54,
   "size": 1658,
   "externals": [
    "react",
    "lucide-react"
   ],
   "dependsOn": [
    "frontend/src/theme/ThemeProvider.jsx"
   ],
   "usedBy": [
    "frontend/src/layouts/CRMLayout.jsx",
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/pages/Hub.jsx",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/ResetPassword.jsx"
   ],
   "inbound": 5,
   "outbound": 1
  },
  {
   "id": "frontend/src/ui/animations.css",
   "path": "frontend/src/ui/animations.css",
   "label": "animations.css",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".css",
   "status": "partial",
   "summary": "Animacoes de assinatura: auroras ambiente, spotlight, sheen, recibo 3D e loops de fundo.",
   "notes": "A seccao do recibo e fraca (uma barra de 6px): sera substituida pelo Printer3D.",
   "role": "Estilo.",
   "security": "",
   "planned": false,
   "lines": 338,
   "size": 15730,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/src/ui/primitives.css",
   "path": "frontend/src/ui/primitives.css",
   "label": "primitives.css",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".css",
   "status": "ok",
   "summary": "Icones e primitivos usados por todo o produto.",
   "notes": "",
   "role": "Estilo.",
   "security": "",
   "planned": false,
   "lines": 394,
   "size": 17185,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/src/ui/shell.css",
   "path": "frontend/src/ui/shell.css",
   "label": "shell.css",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".css",
   "status": "ok",
   "summary": "Estilo do shell: sidebar, topbar, paleta de comandos e transicoes de pagina.",
   "notes": "",
   "role": "Estilo.",
   "security": "",
   "planned": false,
   "lines": 289,
   "size": 10102,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/src/ui/theme-light.css",
   "path": "frontend/src/ui/theme-light.css",
   "label": "theme-light.css",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".css",
   "status": "ok",
   "summary": "Tema claro azul-piscina: reescreve os mesmos tokens do tema escuro em [data-theme=\"light\"] (fundos brancos, marca ciano, sombras de luz do dia) e ajusta o brilho ambiente do corpo.",
   "notes": "Trocar o atributo muda a aplicação inteira de uma vez porque nada escreve hex a mao e não existe uma única classe dark: do Tailwind.",
   "role": "Tokens do tema claro.",
   "security": "",
   "planned": false,
   "lines": 99,
   "size": 4056,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/src/ui/theme-toggle.css",
   "path": "frontend/src/ui/theme-toggle.css",
   "label": "theme-toggle.css",
   "group": "frontend",
   "dir": "frontend/src/ui",
   "ext": ".css",
   "status": "ok",
   "summary": "Estilo do botão de tema e das três camadas da piscina (keyframes de deriva, onda e caustica).",
   "notes": "",
   "role": "Estilo do tema claro.",
   "security": "",
   "planned": false,
   "lines": 139,
   "size": 4849,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
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
   "lines": 201,
   "size": 6213,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
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
   "lines": 9,
   "size": 120,
   "externals": [
    "axios"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/PosGate.jsx",
    "frontend/src/components/ProtectedRoute.jsx",
    "frontend/src/hooks/useAuth.js",
    "frontend/src/layouts/CRMLayout.jsx",
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/pages/Hub.jsx",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/OnboardingWizard.jsx",
    "frontend/src/pages/Owner/AuditLogViewer.jsx",
    "frontend/src/pages/Owner/Dashboard.jsx",
    "frontend/src/pages/Owner/Debts.jsx",
    "frontend/src/pages/Owner/DeviceKeys.jsx",
    "frontend/src/pages/Owner/Employees.jsx",
    "frontend/src/pages/Owner/Goals.jsx",
    "frontend/src/pages/Owner/Products.jsx",
    "frontend/src/pages/Owner/Reports/DailyReport.jsx",
    "frontend/src/pages/Owner/Reports/MonthlyReport.jsx",
    "frontend/src/pages/Owner/Reports/WeeklyReport.jsx",
    "frontend/src/pages/Owner/Settings.jsx",
    "frontend/src/pages/Owner/Stock.jsx",
    "frontend/src/pages/Owner/Suppliers.jsx",
    "frontend/src/pages/RequestAccount.jsx",
    "frontend/src/pages/ResetPassword.jsx"
   ],
   "inbound": 23,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/auth.js",
   "path": "frontend/src/utils/auth.js",
   "label": "auth.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Utilitarios de sessao no cliente.",
   "notes": "",
   "role": "Autenticacao.",
   "security": "",
   "planned": false,
   "lines": 42,
   "size": 1148,
   "externals": [],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/hubSession.js",
   "path": "frontend/src/utils/hubSession.js",
   "label": "hubSession.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Sessao do perfil de caixista no Hub do balcao.",
   "notes": "",
   "role": "Estado do POS.",
   "security": "",
   "planned": false,
   "lines": 23,
   "size": 688,
   "externals": [],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/components/PosGate.jsx",
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/pages/Hub.jsx"
   ],
   "inbound": 3,
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
    "frontend/src/pages/CashierDashboard.jsx",
    "frontend/src/pages/OnboardingWizard.jsx",
    "frontend/src/pages/Owner/Employees.jsx",
    "frontend/src/pages/Owner/Goals.jsx",
    "frontend/src/pages/Owner/Products.jsx",
    "frontend/src/pages/Owner/Stock.jsx",
    "frontend/src/pages/Owner/Suppliers.jsx"
   ],
   "inbound": 7,
   "outbound": 0
  },
  {
   "id": "frontend/src/utils/receiptPdf.js",
   "path": "frontend/src/utils/receiptPdf.js",
   "label": "receiptPdf.js",
   "group": "frontend",
   "dir": "frontend/src/utils",
   "ext": ".js",
   "status": "ok",
   "summary": "Gerador do PDF do recibo com jsPDF (offline, sem CDN): rolo de 80mm, tinta escura sobre papel, faixa Genesis com o nº da venda, serreto, QR e totais. Devolve o blob E o nome do ficheiro; o download é feito por quem chama.",
   "notes": "Nome exacto: Recibo_<N>  <DD-MM-YYYY>  <HH:mm:ss>.pdf (dois espaços). N = daily_number do servidor; em venda offline usa o contador local do dia, que reinicia a meia-noite. Todo o texto passa por clean(), por isso um nome de produto com <script> sai literal.",
   "role": "Recibo em PDF.",
   "security": "Sem innerHTML: o PDF é desenhado com texto vectorial, logo não há injecção de HTML no documento impresso.",
   "planned": false,
   "lines": 362,
   "size": 13830,
   "externals": [
    "jspdf"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/CashierDashboard.jsx"
   ],
   "inbound": 1,
   "outbound": 0
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
   "notes": "O que falha em muitos ambientes (sem Web Serial e com o popup bloqueado) ja nao e o caminho principal: o PDF e descarregado sempre antes, com o nome pedido.",
   "role": "Recibo (impressao).",
   "security": "Corrigido a 27/09: todo o texto (nome do produto, loja, caixista) passa por esc() e o src do QR e validado como data URL de imagem. Antes, um produto chamado <img onerror=...> executava dentro do documento do dialogo de impressao.",
   "planned": false,
   "lines": 193,
   "size": 9134,
   "externals": [
    "qrcode"
   ],
   "dependsOn": [],
   "usedBy": [
    "frontend/src/pages/CashierDashboard.jsx"
   ],
   "inbound": 1,
   "outbound": 0
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
   "lines": 159,
   "size": 6104,
   "externals": [
    "tailwindcss"
   ],
   "dependsOn": [],
   "usedBy": [],
   "inbound": 0,
   "outbound": 0
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
   "size": 955,
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
   "outbound": 2
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
   "outbound": 1
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
   "target": "admin-frontend/src/ThemeToggle.jsx"
  },
  {
   "source": "admin-frontend/src/ThemeToggle.jsx",
   "target": "admin-frontend/src/theme.js"
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
   "source": "backend/scripts/check_mail.js",
   "target": "backend/src/utils/mailer.js"
  },
  {
   "source": "backend/scripts/check_sale.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/create_system_user.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/create_tenant_7777.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/create_test_tenant.js",
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
   "source": "backend/scripts/insert_product_7777.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/scripts/seed_demo.js",
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
   "target": "backend/src/routes/shift_closings.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/demand_captures.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/routes/device_keys.js"
  },
  {
   "source": "backend/src/index.js",
   "target": "backend/src/middleware/deviceKeyAuth.js"
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
   "target": "backend/src/middleware/authOrDevice.js"
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
   "source": "backend/src/middleware/authOrDevice.js",
   "target": "backend/src/middleware/auth.js"
  },
  {
   "source": "backend/src/middleware/authOrDevice.js",
   "target": "backend/src/middleware/deviceKeyAuth.js"
  },
  {
   "source": "backend/src/middleware/deviceKeyAuth.js",
   "target": "backend/src/services/deviceKeyService.js"
  },
  {
   "source": "backend/src/routes/admin.js",
   "target": "backend/src/utils/prisma.js"
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
   "source": "backend/src/routes/device_keys.js",
   "target": "backend/src/services/deviceKeyService.js"
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
   "target": "backend/src/services/monthlyDeductions.js"
  },
  {
   "source": "backend/src/routes/owner.js",
   "target": "backend/src/utils/shiftLock.js"
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
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/sales.js",
   "target": "backend/src/utils/shiftLock.js"
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
   "source": "backend/src/routes/shift_closings.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/routes/shift_closings.js",
   "target": "backend/src/utils/shiftLock.js"
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
   "source": "backend/src/services/deviceKeyService.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/services/tenantAlerts.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/src/utils/prisma.js",
   "target": "backend/src/utils/dbEngine2.js"
  },
  {
   "source": "backend/tests/device_key_service.test.js",
   "target": "backend/src/utils/prisma.js"
  },
  {
   "source": "backend/tests/device_key_service.test.js",
   "target": "backend/src/services/deviceKeyService.js"
  },
  {
   "source": "backend/tests/device_key_service.test.js",
   "target": "backend/src/middleware/deviceKeyAuth.js"
  },
  {
   "source": "backend/tests/monthlyDeductions.test.js",
   "target": "backend/src/services/monthlyDeductions.js"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Login.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/CashierLogin.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/ResetPassword.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/RequestAccount.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Dashboard.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Products.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Stock.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Suppliers.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/DeviceKeys.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Employees.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Debts.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Goals.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Settings.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/AuditLogViewer.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Reports/DailyReport.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Reports/WeeklyReport.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Owner/Reports/MonthlyReport.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/OnboardingWizard.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/components/ProtectedRoute.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/components/PosGate.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/pages/Hub.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/App.jsx",
   "target": "frontend/src/layouts/CRMLayout.jsx"
  },
  {
   "source": "frontend/src/components/PosGate.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/components/PosGate.jsx",
   "target": "frontend/src/pages/CashierDashboard.jsx"
  },
  {
   "source": "frontend/src/components/PosGate.jsx",
   "target": "frontend/src/utils/hubSession.js"
  },
  {
   "source": "frontend/src/components/ProtectedRoute.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/hooks/useAuth.js",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/hooks/useOfflineSync.js",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/i18n/index.js",
   "target": "frontend/src/i18n/index.js"
  },
  {
   "source": "frontend/src/layouts/CRMLayout.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/layouts/CRMLayout.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/layouts/CRMLayout.jsx",
   "target": "frontend/src/theme/ThemeToggle.jsx"
  },
  {
   "source": "frontend/src/main.jsx",
   "target": "frontend/src/App.jsx"
  },
  {
   "source": "frontend/src/main.jsx",
   "target": "frontend/src/theme/ThemeProvider.jsx"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/utils/receiptPrinter.js"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/utils/hubSession.js"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/hooks/useIsolatedScreen.js"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/components/Printer3D.jsx"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/theme/ThemeToggle.jsx"
  },
  {
   "source": "frontend/src/pages/CashierDashboard.jsx",
   "target": "frontend/src/utils/receiptPdf.js"
  },
  {
   "source": "frontend/src/pages/CashierLogin.jsx",
   "target": "frontend/src/pages/Login.jsx"
  },
  {
   "source": "frontend/src/pages/Hub.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Hub.jsx",
   "target": "frontend/src/utils/hubSession.js"
  },
  {
   "source": "frontend/src/pages/Hub.jsx",
   "target": "frontend/src/hooks/useIsolatedScreen.js"
  },
  {
   "source": "frontend/src/pages/Hub.jsx",
   "target": "frontend/src/theme/ThemeToggle.jsx"
  },
  {
   "source": "frontend/src/pages/Login.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Login.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Login.jsx",
   "target": "frontend/src/theme/ThemeToggle.jsx"
  },
  {
   "source": "frontend/src/pages/Login.jsx",
   "target": "frontend/src/i18n/index.js"
  },
  {
   "source": "frontend/src/pages/OnboardingWizard.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/OnboardingWizard.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/pages/Owner/AuditLogViewer.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/AuditLogViewer.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Dashboard.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Dashboard.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Debts.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Debts.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/DeviceKeys.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/DeviceKeys.jsx",
   "target": "frontend/src/db/localDb.js"
  },
  {
   "source": "frontend/src/pages/Owner/DeviceKeys.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Employees.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Employees.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/pages/Owner/Employees.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Goals.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Goals.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/pages/Owner/Goals.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Products.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Products.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/pages/Owner/Products.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Reports/DailyReport.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Reports/DailyReport.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Reports/MonthlyReport.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Reports/MonthlyReport.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Reports/WeeklyReport.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Reports/WeeklyReport.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Settings.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Settings.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Stock.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Stock.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/pages/Owner/Stock.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/Owner/Suppliers.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/Owner/Suppliers.jsx",
   "target": "frontend/src/utils/money.js"
  },
  {
   "source": "frontend/src/pages/Owner/Suppliers.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/RequestAccount.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/ResetPassword.jsx",
   "target": "frontend/src/utils/api.js"
  },
  {
   "source": "frontend/src/pages/ResetPassword.jsx",
   "target": "frontend/src/components/ui/index.jsx"
  },
  {
   "source": "frontend/src/pages/ResetPassword.jsx",
   "target": "frontend/src/components/SecurityGateIcon.jsx"
  },
  {
   "source": "frontend/src/pages/ResetPassword.jsx",
   "target": "frontend/src/theme/ThemeToggle.jsx"
  },
  {
   "source": "frontend/src/pages/ResetPassword.jsx",
   "target": "frontend/src/i18n/index.js"
  },
  {
   "source": "frontend/src/theme/ThemeProvider.jsx",
   "target": "frontend/src/theme/PoolWater.jsx"
  },
  {
   "source": "frontend/src/theme/ThemeToggle.jsx",
   "target": "frontend/src/theme/ThemeProvider.jsx"
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
   "source": "backend/prisma/migrations/postgres/0001_init/migration.sql",
   "target": "backend/prisma/rls_policies.sql"
  },
  {
   "source": "frontend/src/pages/CodeMap.jsx",
   "target": "frontend/src/components/ui/index.jsx"
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
