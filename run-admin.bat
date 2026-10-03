@echo off
setlocal
cd /d "%~dp0"

rem Arranca backend + painel do dono + Super Admin e abre as duas abas.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local.ps1" --admin
if errorlevel 1 (
  echo.
  echo O Genesis nao arrancou. Leia a mensagem acima.
  pause
)
