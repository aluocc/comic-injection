# Environment setup for pnpm/node in TRAE sandbox (workspace-relative)
# Derive workspace from this script location to avoid hardcoded non-ASCII paths
$setupDir = $PSScriptRoot
if (-not $setupDir) { $setupDir = Get-Location }
$workspace = Split-Path $setupDir -Parent

$env:COREPACK_HOME = Join-Path $workspace ".corepack"
$env:APPDATA = Join-Path $workspace ".appdata\Roaming"
$env:LOCALAPPDATA = Join-Path $workspace ".appdata\Local"
$env:NODE_OPTIONS = ""
$nodeTools = "C:\Users\Administrator\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\node"
if ($env:PATH -notlike "*$nodeTools*") { $env:PATH = "$nodeTools;$env:PATH" }

$dirs = @($env:APPDATA, $env:LOCALAPPDATA, $env:COREPACK_HOME)
foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null } }

$pnpm = Join-Path $nodeTools "pnpm.CMD"
& $pnpm config set cache-dir (Join-Path $workspace ".pnpm-cache")
& $pnpm config set store-dir (Join-Path $workspace ".pnpm-store")
& $pnpm config set state-dir (Join-Path $workspace ".pnpm-state")
& $pnpm config set global-bin-dir (Join-Path $workspace ".pnpm-bin")

function global:pnpm { & (Join-Path $nodeTools "pnpm.CMD") @args }
function global:npx { & (Join-Path $nodeTools "npx.cmd") @args }
function global:node { & (Join-Path $nodeTools "node.exe") @args }

Write-Host ("ENV_READY pnpm=" + (pnpm --version) + " node=" + (node --version)) -ForegroundColor Cyan