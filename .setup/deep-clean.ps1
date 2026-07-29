$root = "C:\Users\Administrator\Desktop\画布00"
$paths = @(
  "$root\node_modules",
  "$root\apps\web\node_modules",
  "$root\apps\api-gateway\node_modules",
  "$root\packages\shared-types\node_modules",
  "$root\.pnpm-store",
  "$root\.pnpm-cache"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Host "Removing $p"
    Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
  }
}
Write-Host "Deep clean done"
