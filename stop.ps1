# Genesis - Script para parar servicos no Windows (PowerShell)

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "       A PARAR SERVICOS DO PROJECTO GENESIS       " -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

$ports = @(4000, 5173, 5175)
foreach ($port in $ports) {
    try {
        $netConns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($netConns) {
            foreach ($conn in $netConns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -and $pidToKill -gt 0) {
                    Write-Host "A encerrar processo PID $pidToKill na porta $port..." -ForegroundColor Gray
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}

Write-Host "`nServicos do Genesis encerrados com sucesso!" -ForegroundColor Green
