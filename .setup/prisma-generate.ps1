. "$PSScriptRoot\env.ps1"
$workspace = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $workspace "backend")

# Sync the lockfile with the file: override (resolves slash mismatch on Windows)
Write-Host "=== Syncing backend lockfile ===" -ForegroundColor Green
pnpm install --no-frozen-lockfile
Write-Host "=== sync exit: $LASTEXITCODE ===" -ForegroundColor Green

# Disable pnpm's pre-run deps verification (it trips on the file: override path separator)
pnpm config set verify-deps-before-run false
pnpm config set verifyDepsBeforeRun false

Write-Host "=== prisma generate ===" -ForegroundColor Green
pnpm exec prisma generate
$code = $LASTEXITCODE
Write-Host "=== prisma generate exit: $code ===" -ForegroundColor Green