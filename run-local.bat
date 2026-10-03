@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local.ps1" %*
if errorlevel 1 (
  echo.
  echo O Genesis nao arrancou. Leia a mensagem acima.
  pause
)
