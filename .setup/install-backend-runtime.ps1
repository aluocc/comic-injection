. "$PSScriptRoot\env.ps1"
$workspace = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $workspace "backend")

pnpm config set fetch-retries 6
pnpm config set network-concurrency 4

Write-Host "=== Re-installing backend runtime deps (bcrypt stubbed) ===" -ForegroundColor Green
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @prisma/client ioredis
$code1 = $LASTEXITCODE
Write-Host "=== runtime deps exit: $code1 ===" -ForegroundColor Green

Write-Host "=== prisma generate ===" -ForegroundColor Green
pnpm exec prisma generate
$code3 = $LASTEXITCODE
Write-Host "=== prisma generate exit: $code3 ===" -ForegroundColor Green
