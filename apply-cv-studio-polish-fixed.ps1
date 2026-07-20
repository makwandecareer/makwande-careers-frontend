param([string]$ProjectRoot = (Get-Location).Path)
$ErrorActionPreference = "Stop"

$pagePath = Join-Path $ProjectRoot "app\dashboard\cv-studio\page.tsx"
$cssSource = Join-Path $PSScriptRoot "_cv-studio-polish-fixed\app\dashboard\cv-studio\cv-studio-polish.css"
$cssTarget = Join-Path $ProjectRoot "app\dashboard\cv-studio\cv-studio-polish.css"

if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) { throw "Run from repository root." }
if (-not (Test-Path $pagePath)) { throw "CV Studio page not found." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $pagePath "$pagePath.before-cv-studio-polish-$stamp" -Force
Copy-Item $cssSource $cssTarget -Force

$content = Get-Content $pagePath -Raw
$importLine = 'import "./cv-studio-polish.css";'

if ($content -notmatch [regex]::Escape($importLine)) {
  $lines = $content -split "`r?`n"
  $result = New-Object System.Collections.Generic.List[string]
  $added = $false

  foreach ($line in $lines) {
    $result.Add($line)
    if (-not $added -and $line -match '^import ') {
      $result.Add($importLine)
      $added = $true
    }
  }

  if (-not $added) {
    $result.Insert(1, $importLine)
  }

  Set-Content $pagePath ($result -join [Environment]::NewLine) -Encoding utf8
}

$next = Join-Path $ProjectRoot ".next"
if (Test-Path $next) { Remove-Item $next -Recurse -Force }

Write-Host "CV Studio polish applied successfully." -ForegroundColor Green
Write-Host "Now run: npm run build"
