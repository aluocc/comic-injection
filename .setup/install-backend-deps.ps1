. "$PSScriptRoot\env.ps1"
$workspace = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $workspace "backend")

Write-Host "=== Installing backend runtime deps ===" -ForegroundColor Green
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @prisma/client ioredis
$code1 = $LASTEXITCODE
Write-Host "=== runtime deps exit: $code1 ===" -ForegroundColor Green

Write-Host "=== Installing backend dev deps ===" -ForegroundColor Green
pnpm add -D prisma
$code2 = $LASTEXITCODE
Write-Host "=== dev deps exit: $code2 ===" -ForegroundColor Green

Write-Host "=== prisma generate ===" -ForegroundColor Green
pnpm exec prisma generate
$code3 = $LASTEXITCODE
Write-Host "=== prisma generate exit: $code3 ===" -ForegroundColor Green
