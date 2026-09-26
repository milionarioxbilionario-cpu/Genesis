@echo off
REM ============================================================
REM  Genesis — reinicio limpo do backend (duplo clique).
REM  1. Mata o processo na porta 4020 (se existir).
REM  2. Regenera o cliente Prisma SQLite (dev).
REM  3. Arranca o backend com FORCE_DB=sqlite em background.
REM ============================================================
cd /d c:\Users\CMM\Desktop\Genesis\backend
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4020" ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 3 /nobreak >nul
call npx.cmd prisma generate --schema prisma/schema.sqlite.prisma
set PORT=4020
set NODE_ENV=development
set DB_ALLOW_SQLITE_FALLBACK=true
set FORCE_DB=sqlite
start "genesis-4020" /min node src/index.js ^> _srv.log 2^>^&1
echo Backend a arrancar na porta 4020. Ver _srv.log em ~5s.