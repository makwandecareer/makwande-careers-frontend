param(
  [string]$ProjectRoot = "E:\Makwande_Careers_Frontend"
)

$ErrorActionPreference = "Stop"
$Source = Join-Path $PSScriptRoot "Sidebar.tsx"

if (-not (Test-Path $ProjectRoot)) {
  throw "Project folder not found: $ProjectRoot"
}

$matches = Get-ChildItem -Path $ProjectRoot -Filter "*.tsx" -Recurse -File |
  Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "export function Sidebar\(\)" -and
    $content -match "sidebar-logo"
  }

if ($matches.Count -eq 0) {
  throw "No existing Sidebar component was found. Copy Sidebar.tsx manually into your sidebar component location."
}

if ($matches.Count -gt 1) {
  Write-Host "More than one Sidebar component was found:" -ForegroundColor Yellow
  $matches | ForEach-Object { Write-Host " - $($_.FullName)" }
  throw "Installation stopped to avoid replacing the wrong file."
}

$Target = $matches[0].FullName
$Backup = "$Target.phase10-backup"

Copy-Item $Target $Backup -Force
Copy-Item $Source $Target -Force

Write-Host ""
Write-Host "Sidebar updated successfully." -ForegroundColor Green
Write-Host "Target: $Target"
Write-Host "Backup: $Backup"
Write-Host ""
Write-Host "Next:"
Write-Host "1. Add sidebar-styles.css to your global/dashboard stylesheet."
Write-Host "2. Run npm run build."
