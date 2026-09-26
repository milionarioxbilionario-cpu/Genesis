@echo off
REM ============================================================
REM  Genesis — correr o teste de fecho de turno (duplo clique).
REM  Pre-req: backend a correr na porta 4020 (ver _restart4020.cmd).
REM  IMPORTANTE: executar _restart4020.cmd primeiro — o npm install
REM  substituiu o cliente sqlite pelo postgresql (postinstall), por isso
REM  o restart regenera o cliente sqlite ANTES de testar.
REM ============================================================
cd /d c:\Users\CMM\Desktop\Genesis\backend
set API_BASE=http://localhost:4020
set FORCE_DB=sqlite
set DB_ALLOW_SQLITE_FALLBACK=true
set NODE_ENV=development
node scripts\shift_closing_e2e.js > _test_out.txt 2>&1
echo.
echo ===== RESULTADO =====
type _test_out.txt