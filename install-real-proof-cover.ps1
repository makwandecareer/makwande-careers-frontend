param([string]$ProjectRoot = (Get-Location).Path)
$ErrorActionPreference = "Stop"
$pageTarget = Join-Path $ProjectRoot "app\page.tsx"
$cssTarget = Join-Path $ProjectRoot "app\worldclass-cover.css"
$sourceRoot = Join-Path $PSScriptRoot "_real-proof-cover"
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) { throw "Run from frontend repository root." }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (Test-Path $pageTarget) { Copy-Item $pageTarget "$pageTarget.before-real-proof-cover-$stamp" -Force }
if (Test-Path $cssTarget) { Copy-Item $cssTarget "$cssTarget.before-real-proof-cover-$stamp" -Force }
Copy-Item (Join-Path $sourceRoot "app\page.tsx") $pageTarget -Force
Copy-Item (Join-Path $sourceRoot "app\worldclass-cover.css") $cssTarget -Force
Copy-Item (Join-Path $sourceRoot "public\*") (Join-Path $ProjectRoot "public") -Recurse -Force
$next = Join-Path $ProjectRoot ".next"
if (Test-Path $next) { Remove-Item $next -Recurse -Force }
Write-Host "Real-proof website cover installed successfully." -ForegroundColor Green
Write-Host "Run: npm run build"
