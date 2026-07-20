param([string]$ProjectRoot = (Get-Location).Path)
$ErrorActionPreference = "Stop"

$pageTarget = Join-Path $ProjectRoot "app\page.tsx"
$cssTarget = Join-Path $ProjectRoot "app\worldclass-cover.css"
$pageSource = Join-Path $PSScriptRoot "_worldclass-cover\app\page.tsx"
$cssSource = Join-Path $PSScriptRoot "_worldclass-cover\app\worldclass-cover.css"
$publicSource = Join-Path $PSScriptRoot "_worldclass-cover\public"
$publicTarget = Join-Path $ProjectRoot "public"

if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
  throw "Run this script from the frontend repository root."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (Test-Path $pageTarget) {
  Copy-Item $pageTarget "$pageTarget.before-worldclass-cover-$stamp" -Force
}

if (Test-Path $cssTarget) {
  Copy-Item $cssTarget "$cssTarget.before-worldclass-cover-$stamp" -Force
}

if (-not (Test-Path $publicTarget)) {
  New-Item -ItemType Directory -Path $publicTarget | Out-Null
}

Copy-Item $pageSource $pageTarget -Force
Copy-Item $cssSource $cssTarget -Force
Copy-Item (Join-Path $publicSource "*") $publicTarget -Force

$next = Join-Path $ProjectRoot ".next"
if (Test-Path $next) {
  Remove-Item $next -Recurse -Force
}

Write-Host "World-class website cover installed successfully." -ForegroundColor Green
Write-Host "Run: npm run build"
