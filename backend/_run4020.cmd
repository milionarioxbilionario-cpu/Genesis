@echo off
REM Arranque auxiliar de desenvolvimento. Ficheiro TEMPORARIO.
REM
REM FORCE_DB=sqlite e DELIBERADO: o probe a "pg" provou que o Postgres do
REM Supabase responde, mas o esquema nunca foi aplicado la (nem as politicas
REM RLS). Sem FORCE_DB o servidor passaria a usar Postgres e TODAS as queries
REM falhariam com "table does not exist". Manter SQLite ate o fundador decidir
REM aplicar o esquema no Supabase.
cd /d c:\Users\CMM\Desktop\Genesis\backend
set PORT=4020
set NODE_ENV=development
set DB_ALLOW_SQLITE_FALLBACK=true
set FORCE_DB=sqlite
set RESET_IMMEDIATE=false
node src/index.js > _srv.log 2>&1
