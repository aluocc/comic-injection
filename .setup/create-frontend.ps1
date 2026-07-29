. "$PSScriptRoot\env.ps1"
$workspace = Split-Path $PSScriptRoot -Parent
Set-Location $workspace
Write-Host "=== Creating Next.js frontend ===" -ForegroundColor Green
pnpm create next-app@latest frontend --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --use-pnpm --no-turbopack --yes
Write-Host "=== Frontend exit code: $LASTEXITCODE ===" -ForegroundColor Green
