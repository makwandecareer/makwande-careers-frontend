param([string]$ProjectRoot = (Get-Location).Path)
$ErrorActionPreference = "Stop"

$pagePath = Join-Path $ProjectRoot "app\dashboard\cv-studio\page.tsx"
$cssSource = Join-Path $PSScriptRoot "_cv-studio-polish\app\dashboard\cv-studio\cv-studio-polish.css"
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
  $content = $result -join [Environment]::NewLine
}

if ($content -notmatch 'cv-studio-precision') {
  $m = [regex]::Match($content, '(?ms)(return\s*\(\s*<div\s+className=")([^"]*)(")')
  if (-not $m.Success) { throw "Root CV Studio div not found." }
  $existing = $m.Groups[2].Value
  $newClass = ($existing + " cv-studio-precision").Trim()
  $content = $content.Substring(0, $m.Groups[2].Index) + $newClass + $content.Substring($m.Groups[2].Index + $m.Groups[2].Length)
}

Set-Content $pagePath $content -Encoding utf8

$next = Join-Path $ProjectRoot ".next"
if (Test-Path $next) { Remove-Item $next -Recurse -Force }

Write-Host "CV Studio polish applied successfully." -ForegroundColor Green
