param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

function Backup-File([string]$Path) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backup = "$Path.before-ui-alignment-$stamp"
  Copy-Item $Path $backup -Force
  Write-Host "Backup created: $backup" -ForegroundColor DarkGray
}

$packageJson = Join-Path $ProjectRoot "package.json"
$pagePath = Join-Path $ProjectRoot "app\dashboard\cv-builder\page.tsx"
$cssTarget = Join-Path $ProjectRoot "app\dashboard\cv-builder\workspace-alignment.css"
$cssSource = Join-Path $PSScriptRoot "_ui-patch\app\dashboard\cv-builder\workspace-alignment.css"

if (-not (Test-Path $packageJson)) {
  throw "Run this script from the repository root containing package.json."
}

if (-not (Test-Path $pagePath)) {
  throw "CV Builder page not found: $pagePath"
}

if (-not (Test-Path $cssSource)) {
  throw "Patch stylesheet not found: $cssSource"
}

Write-Host ""
Write-Host "==> Applying CV Builder workspace alignment" -ForegroundColor Cyan

Backup-File $pagePath
Copy-Item $cssSource $cssTarget -Force

$content = Get-Content $pagePath -Raw
$importLine = 'import "./workspace-alignment.css";'

if ($content -notmatch [regex]::Escape($importLine)) {
  $lines = $content -split "`r?`n"
  $result = New-Object System.Collections.Generic.List[string]
  $inserted = $false

  foreach ($line in $lines) {
    $result.Add($line)

    if (-not $inserted -and $line -match '^import .* from ["'']react["''];$') {
      $result.Add($importLine)
      $inserted = $true
    }
  }

  if (-not $inserted) {
    $result.Insert(1, $importLine)
  }

  Set-Content -Path $pagePath -Value ($result -join [Environment]::NewLine) -Encoding utf8
  Write-Host "Added stylesheet import to page.tsx" -ForegroundColor Green
} else {
  Write-Host "Stylesheet import already exists." -ForegroundColor Yellow
}

$nextPath = Join-Path $ProjectRoot ".next"
if (Test-Path $nextPath) {
  Remove-Item $nextPath -Recurse -Force
}

Write-Host ""
Write-Host "UI alignment patch applied." -ForegroundColor Green
Write-Host ""
Write-Host "Run these commands:"
Write-Host "  npm run build"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then test all seven workspace links before committing."
