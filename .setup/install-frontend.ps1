. "$PSScriptRoot\env.ps1"
$workspace = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $workspace "frontend")

pnpm config set fetch-retries 6
pnpm config set network-concurrency 4

# Clean leftover node_modules (sharp partial dir caused EPERM on rename)
$nm = Join-Path (Get-Location) "node_modules"
if (Test-Path $nm) {
    Write-Host "=== Removing leftover node_modules ===" -ForegroundColor Yellow
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $nm
}

Write-Host "=== Installing base frontend deps ===" -ForegroundColor Green
pnpm install --config.confirmModulesPurge=false
$code1 = $LASTEXITCODE
Write-Host "=== base install exit: $code1 ===" -ForegroundColor Green

Write-Host "=== Installing extra frontend deps ===" -ForegroundColor Green
pnpm add axios zustand @tanstack/react-query
$code2 = $LASTEXITCODE
Write-Host "=== extra deps exit: $code2 ===" -ForegroundColor Green
