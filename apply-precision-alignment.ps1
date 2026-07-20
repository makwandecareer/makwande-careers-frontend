param([string]$ProjectRoot = (Get-Location).Path)
$ErrorActionPreference = "Stop"

function Backup-File([string]$Path) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  Copy-Item $Path "$Path.before-precision-fix-$stamp" -Force
}

function Ensure-Import([string]$FilePath, [string]$ImportLine) {
  $content = Get-Content $FilePath -Raw
  if ($content -match [regex]::Escape($ImportLine)) { return }
  $lines = $content -split "`r?`n"
  $result = New-Object System.Collections.Generic.List[string]
  $done = $false
  foreach ($line in $lines) {
    $result.Add($line)
    if (-not $done -and $line -match '^import ') {
      $result.Add($ImportLine)
      $done = $true
    }
  }
  if (-not $done) { $result.Insert(0, $ImportLine) }
  Set-Content $FilePath ($result -join [Environment]::NewLine) -Encoding utf8
}

$layoutPath = Join-Path $ProjectRoot "app\dashboard\layout.tsx"
$pagePath = Join-Path $ProjectRoot "app\dashboard\cv-builder\page.tsx"
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) { throw "Run from repository root." }
if (-not (Test-Path $layoutPath)) { throw "Missing dashboard layout." }
if (-not (Test-Path $pagePath)) { throw "Missing CV Builder page." }

Backup-File $layoutPath
Backup-File $pagePath

Copy-Item (Join-Path $PSScriptRoot "_precision-patch\app\dashboard\dashboard-shell-fix.css") (Join-Path $ProjectRoot "app\dashboard\dashboard-shell-fix.css") -Force
Copy-Item (Join-Path $PSScriptRoot "_precision-patch\app\dashboard\cv-builder\precision-alignment.css") (Join-Path $ProjectRoot "app\dashboard\cv-builder\precision-alignment.css") -Force

Ensure-Import $layoutPath 'import "./dashboard-shell-fix.css";'
Ensure-Import $pagePath 'import "./precision-alignment.css";'

$page = Get-Content $pagePath -Raw
$page = $page.Replace("Phase 13 Â· AI Career Copilot", "Phase 13 · AI Career Copilot")
$page = $page.Replace("Phase 13 Ã‚Â· AI Career Copilot", "Phase 13 · AI Career Copilot")
Set-Content $pagePath $page -Encoding utf8

$next = Join-Path $ProjectRoot ".next"
if (Test-Path $next) { Remove-Item $next -Recurse -Force }

Write-Host "Precision alignment applied successfully." -ForegroundColor Green
Write-Host "Now run: npm run build"
