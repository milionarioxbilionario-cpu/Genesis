@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Genesis - Gestao de Contas e Senhas

rem ===========================================================================
rem  GESTAO DE CONTAS E SENHAS - Windows
rem  Duplo clique neste ficheiro, ou "gerir-contas.bat" numa consola.
rem
rem  As senhas do Genesis estao em bcrypt (custo 12): hash de sentido unico,
rem  nao se "desencripta". O script lista as contas, mostra a que conta pertence
rem  cada senha do .env, e deixa verificar/definir/gerar senhas novas.
rem ===========================================================================

rem Vai para a raiz do projecto (este ficheiro esta na raiz).
cd /d "%~dp0"

set "NODE_BIN=node"

rem Se o Node nao estiver no PATH, tenta os locais habituais do Windows.
where node >nul 2>&1
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles%\nodejs\node.exe"
  if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles(x86)%\nodejs\node.exe"
  if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_BIN=%LOCALAPPDATA%\Programs\nodejs\node.exe"
  if exist "%APPDATA%\nvm\current\node.exe" set "NODE_BIN=%APPDATA%\nvm\current\node.exe"
)

"%NODE_BIN%" --version >nul 2>&1
if errorlevel 1 (
  echo.
  echo   ERRO: nao encontrei o Node.js nesta maquina.
  echo   Instala o Node.js 18+ em https://nodejs.org e volta a correr isto.
  echo.
  pause
  exit /b 1
)

if not exist "backend\node_modules\bcrypt" (
  echo.
  echo   ERRO: falta o backend\node_modules. Corre primeiro:
  echo     cd backend ^&^& npm install
  echo.
  pause
  exit /b 1
)

rem O script compara as senhas do .env com TODAS as contas (bcrypt custo 12),
rem e isso sao dezenas de comparacoes. Mais threads = muito mais rapido.
set "UV_THREADPOOL_SIZE=16"

echo.
echo   A ligar a base de dados e a listar as contas...
echo.

pushd backend
"%NODE_BIN%" scripts\gerir_contas.js %*
set "SAIDA=%ERRORLEVEL%"
popd

echo.
if not "%SAIDA%"=="0" (
  echo   O script terminou com o codigo %SAIDA%.
) else (
  echo   Script terminado.
)
echo.
pause
exit /b %SAIDA%
