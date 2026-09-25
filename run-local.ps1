# Genesis - Script de arranque para Windows (PowerShell)
# Suporta a opcao -Admin ou --admin para abrir duas abas no navegador (Owner/Cashier + Super Admin)

param (
    [switch]$Admin
)

$OpenAdmin = $Admin.IsPresent -or ($args -contains "--admin") -or ($args -contains "-admin") -or ($args -contains "-Admin") -or ($env:ADMIN_OPEN -eq "true")


# Definir directoria do projecto
$RootDir = $PSScriptRoot
if (-not $RootDir) {
    $RootDir = Get-Location
}
Set-Location -Path $RootDir

# Garantir que a pasta logs existe
$LogsDir = Join-Path $RootDir "logs"
if (-not (Test-Path -Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         PROJECTO GENESIS - INICIAR LOCAL         " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Verificar se o Node.js esta no PATH; se nao, tentar detectar automaticamente
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    # Locais comuns onde o Node.js se instala no Windows
    $nodePaths = @(
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs",
        "$env:LOCALAPPDATA\Programs\nodejs",
        "$env:APPDATA\nvm\current"
    )
    $found = $false
    foreach ($np in $nodePaths) {
        if (Test-Path (Join-Path $np "node.exe")) {
            Write-Host "[INFO] Node.js detectado em: $np (a adicionar ao PATH desta sessao)" -ForegroundColor Yellow
            $env:PATH = "$np;$env:PATH"
            $found = $true
            break
        }
    }
    if (-not $found) {
        Write-Host "[ERRO] Node.js NAO foi encontrado neste computador." -ForegroundColor Red
        Write-Host "       Instale a partir de https://nodejs.org e REABRA este terminal." -ForegroundColor Red
        Write-Host "       Sem o Node.js, o Genesis nao pode iniciar." -ForegroundColor Red
        exit 1
    }
}
$nodeVer = & node -v 2>$null
Write-Host "[OK] Node.js $nodeVer detectado." -ForegroundColor Green

# 1. Parar processos anteriores nas portas 4000, 5173 e 5175
Write-Host "`n[1/6] A parar instancias anteriores (portas 4000, 5173, 5175)..." -ForegroundColor Yellow
$ports = @(4000, 5173, 5175)
foreach ($port in $ports) {
    try {
        $netConns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($netConns) {
            foreach ($conn in $netConns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -and $pidToKill -gt 0) {
                    Write-Host "  -> A encerrar processo PID $pidToKill na porta $port..." -ForegroundColor Gray
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}
Start-Sleep -Seconds 1

# 2. Instalar dependencias em falta (npm install)
Write-Host "`n[2/6] A verificar dependencias (node_modules)..." -ForegroundColor Yellow
$projects = @("backend", "frontend", "admin-frontend")
foreach ($proj in $projects) {
    $projDir = Join-Path $RootDir $proj
    $nodeModules = Join-Path $projDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Host "  -> $proj`: node_modules em falta. A executar npm install..." -ForegroundColor Yellow
        $npmResult = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install" -WorkingDirectory $projDir -Wait -PassThru -NoNewWindow
        if ($npmResult.ExitCode -eq 0) {
            Write-Host "  -> $proj`: dependencias instaladas com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "  -> $proj`: ERRO ao instalar dependencias (exit code $($npmResult.ExitCode))" -ForegroundColor Red
        }
    } else {
        Write-Host "  -> $proj`: node_modules presente." -ForegroundColor Gray
    }
}

# 3. Iniciar Backend
Write-Host "`n[3/6] A iniciar Backend (Porta 4000)..." -ForegroundColor Green
$backendLog = Join-Path $LogsDir "backend.log"
$backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c node src/index.js > `"$backendLog`" 2>&1" -WorkingDirectory (Join-Path $RootDir "backend") -WindowStyle Hidden -PassThru
Write-Host "  -> Backend iniciado (PID: $($backendProcess.Id))" -ForegroundColor Gray

# 4. Iniciar Frontend (Owner/Cashier)
Write-Host "`n[4/6] A iniciar Frontend Owner/Cashier (Porta 5173)..." -ForegroundColor Green
$frontendLog = Join-Path $LogsDir "frontend.log"
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev -- --host > `"$frontendLog`" 2>&1" -WorkingDirectory (Join-Path $RootDir "frontend") -WindowStyle Hidden -PassThru
Write-Host "  -> Frontend iniciado (PID: $($frontendProcess.Id))" -ForegroundColor Gray

# 5. Iniciar Admin Frontend (Super Admin)
Write-Host "`n[5/6] A iniciar Admin Frontend (Porta 5175)..." -ForegroundColor Green
$adminLog = Join-Path $LogsDir "admin-frontend.log"
$adminProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev > `"$adminLog`" 2>&1" -WorkingDirectory (Join-Path $RootDir "admin-frontend") -WindowStyle Hidden -PassThru
Write-Host "  -> Admin Frontend iniciado (PID: $($adminProcess.Id))" -ForegroundColor Gray

# 6. Aguardar disponibilidade dos servidores
Write-Host "`n[6/6] A aguardar inicializacao dos servidores..." -ForegroundColor Yellow

function Wait-ForUrl {
    param([string]$url, [string]$name, [int]$maxAttempts = 25)
    Write-Host -NoNewline "  -> Aguardando $name ($url)... "
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($resp -and $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                Write-Host "PRONTO!" -ForegroundColor Green
                return $true
            }
        } catch {}
        Start-Sleep -Seconds 1
    }
    Write-Host "PRONTO (tempo de espera atingido, a prosseguir...)" -ForegroundColor Yellow
    return $false
}

[void](Wait-ForUrl "http://127.0.0.1:4000/" "Backend")
[void](Wait-ForUrl "http://127.0.0.1:5173/" "Frontend Owner/Cashier")
[void](Wait-ForUrl "http://127.0.0.1:5175/" "Admin Frontend")


# Verificar se o parametro --admin foi passado
# $OpenAdmin ja foi calculado no inicio do script

Write-Host "`nA abrir o navegador..." -ForegroundColor Cyan

$UrlFrontend = "http://localhost:5173/login"
$UrlAdmin = "http://localhost:5175/login"

if ($OpenAdmin) {
    Write-Host "[MODO --admin ACTIVADO] A abrir 2 abas no navegador:" -ForegroundColor Magenta
    Write-Host "  1. Portal Owner/Cashier -> $UrlFrontend" -ForegroundColor Magenta
    Write-Host "  2. Portal Super Admin   -> $UrlAdmin" -ForegroundColor Magenta
    Start-Process $UrlFrontend
    Start-Sleep -Milliseconds 800
    Start-Process $UrlAdmin
} else {
    Write-Host "A abrir Portal Owner/Cashier -> $UrlFrontend" -ForegroundColor Green
    Write-Host "(Dica: use .\run-local.ps1 --admin para abrir tambem a aba do Super Admin)" -ForegroundColor Gray
    Start-Process $UrlFrontend
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " Genesis a rodar com sucesso!" -ForegroundColor Green
Write-Host " Frontend Owner/Cashier: http://localhost:5173" -ForegroundColor Gray
Write-Host " Super Admin Frontend:  http://localhost:5175" -ForegroundColor Gray
Write-Host " Backend API:            http://localhost:4000" -ForegroundColor Gray
Write-Host " Logs gravados em:       logs/" -ForegroundColor Gray
Write-Host "==================================================" -ForegroundColor Cyan
