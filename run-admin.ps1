# Genesis - Script auxiliar para iniciar e abrir o Super Admin no Windows

$RootDir = $PSScriptRoot
if (-not $RootDir) {
    $RootDir = Get-Location
}

& (Join-Path $RootDir "run-local.ps1") -Admin
