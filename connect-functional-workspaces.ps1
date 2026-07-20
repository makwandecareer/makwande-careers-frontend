param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Backup-File([string]$Path) {
  if (-not (Test-Path $Path)) {
    throw "Required file not found: $Path"
  }

  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backup = "$Path.before-functional-connect-$stamp"
  Copy-Item $Path $backup -Force
  Write-Host "Backup created: $backup" -ForegroundColor DarkGray
}

function Add-ReactUseEffectImport([string]$Content) {
  if ($Content -match 'import\s*\{[^}]*\buseEffect\b[^}]*\}\s*from\s*["'']react["''];') {
    return $Content
  }

  if ($Content -match 'import\s*\{([^}]*)\}\s*from\s*["'']react["''];') {
    return [regex]::Replace(
      $Content,
      'import\s*\{([^}]*)\}\s*from\s*["'']react["''];',
      {
        param($m)
        $items = $m.Groups[1].Value.Trim()
        if ([string]::IsNullOrWhiteSpace($items)) {
          return 'import { useEffect } from "react";'
        }

        return 'import { ' + $items.TrimEnd() + ', useEffect } from "react";'
      },
      1
    )
  }

  return 'import { useEffect } from "react";' + [Environment]::NewLine + $Content
}

function Add-SearchParamsImport([string]$Content) {
  if ($Content -match '\buseSearchParams\b') {
    return $Content
  }

  if ($Content -match 'import\s*\{([^}]*)\}\s*from\s*["'']next/navigation["''];') {
    return [regex]::Replace(
      $Content,
      'import\s*\{([^}]*)\}\s*from\s*["'']next/navigation["''];',
      {
        param($m)
        $items = $m.Groups[1].Value.Trim()
        if ([string]::IsNullOrWhiteSpace($items)) {
          return 'import { useSearchParams } from "next/navigation";'
        }

        return 'import { ' + $items.TrimEnd() + ', useSearchParams } from "next/navigation";'
      },
      1
    )
  }

  $lines = $Content -split "`r?`n"
  $insertIndex = 1

  if ($lines.Count -gt 0 -and $lines[0].Trim() -eq '"use client";') {
    $insertIndex = 1
  } elseif ($lines.Count -gt 0 -and $lines[0].Trim() -eq "'use client';") {
    $insertIndex = 1
  } else {
    $insertIndex = 0
  }

  $before = @()
  $after = @()

  if ($insertIndex -gt 0) {
    $before = $lines[0..($insertIndex - 1)]
  }

  if ($insertIndex -lt $lines.Count) {
    $after = $lines[$insertIndex..($lines.Count - 1)]
  }

  return (($before + 'import { useSearchParams } from "next/navigation";' + $after) -join [Environment]::NewLine)
}

function Patch-CvBuilderPage([string]$PagePath) {
  Write-Step "Connecting sidebar workspace links to CV Builder tabs"

  Backup-File $PagePath
  $content = Get-Content $PagePath -Raw

  if ($content -notmatch '\bsetTab\s*\(') {
    throw "Could not find setTab(...) in $PagePath. The page structure is different from the expected CV Builder implementation."
  }

  if ($content -notmatch 'type\s+\w*Tab\w*\s*=|const\s+\[\s*tab\s*,\s*setTab\s*\]') {
    Write-Host "Warning: tab type declaration was not detected, but setTab exists. Continuing." -ForegroundColor Yellow
  }

  $content = Add-ReactUseEffectImport $content
  $content = Add-SearchParamsImport $content

  if ($content -notmatch 'const\s+WORKSPACE_TAB_VALUES') {
    $anchor = [regex]::Match(
      $content,
      '(?ms)(type\s+\w*Tab\w*\s*=\s*.*?;|const\s+\w*Tabs?\s*=.*?;)'
    )

    $mapping = @'

const WORKSPACE_TAB_VALUES = [
  "ats",
  "career",
  "copilot",
  "recruiter",
  "writer",
  "matching",
  "opportunities",
] as const;

type WorkspaceTab = (typeof WORKSPACE_TAB_VALUES)[number];

function isWorkspaceTab(value: string | null): value is WorkspaceTab {
  return value !== null && WORKSPACE_TAB_VALUES.includes(value as WorkspaceTab);
}
'@

    if ($anchor.Success) {
      $content = $content.Insert($anchor.Index + $anchor.Length, $mapping)
    } else {
      $componentMatch = [regex]::Match($content, '(?m)^export\s+default\s+function\s+')
      if (-not $componentMatch.Success) {
        $componentMatch = [regex]::Match($content, '(?m)^export\s+function\s+')
      }

      if (-not $componentMatch.Success) {
        throw "Could not locate the CV Builder component declaration."
      }

      $content = $content.Insert($componentMatch.Index, $mapping + [Environment]::NewLine)
    }
  }

  if ($content -notmatch 'const\s+workspaceSearchParams\s*=\s*useSearchParams\(\)') {
    $componentOpen = [regex]::Match(
      $content,
      '(?ms)(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)'
    )

    if (-not $componentOpen.Success) {
      throw "Could not find the opening of the exported CV Builder component."
    }

    $insert = @'

  const workspaceSearchParams = useSearchParams();
'@

    $content = $content.Insert($componentOpen.Index + $componentOpen.Length, $insert)
  }

  if ($content -notmatch 'isWorkspaceTab\(requestedWorkspace\)') {
    $tabState = [regex]::Match(
      $content,
      '(?m)^\s*const\s+\[\s*tab\s*,\s*setTab\s*\]\s*=\s*useState(?:<[^>]+>)?\([^;]*\);\s*$'
    )

    if (-not $tabState.Success) {
      throw "Could not find `const [tab, setTab] = useState(...)` in the CV Builder page."
    }

    $effect = @'

  useEffect(() => {
    const requestedWorkspace = workspaceSearchParams.get("workspace");

    if (isWorkspaceTab(requestedWorkspace)) {
      setTab(requestedWorkspace);
    }
  }, [workspaceSearchParams]);
'@

    $content = $content.Insert($tabState.Index + $tabState.Length, $effect)
  }

  Set-Content -Path $PagePath -Value $content -Encoding utf8
  Write-Host "Connected workspace query parameters in: $PagePath" -ForegroundColor Green
}

function Patch-SidebarLinks([string]$SidebarPath) {
  Write-Step "Verifying functional sidebar destinations"

  Backup-File $SidebarPath
  $content = Get-Content $SidebarPath -Raw

  $expected = [ordered]@{
    "ATS Intelligence" = "/dashboard/cv-builder?workspace=ats"
    "Career Intelligence" = "/dashboard/cv-builder?workspace=career"
    "Application Copilot" = "/dashboard/cv-builder?workspace=copilot"
    "Recruiter Simulation" = "/dashboard/cv-builder?workspace=recruiter"
    "AI Resume Writer" = "/dashboard/cv-builder?workspace=writer"
    "Job Matching" = "/dashboard/cv-builder?workspace=matching"
    "Opportunity Dashboard" = "/dashboard/cv-builder?workspace=opportunities"
  }

  foreach ($label in $expected.Keys) {
    $href = $expected[$label]
    $labelPattern = [regex]::Escape($label)

    $pattern = '(?ms)(label:\s*"' + $labelPattern + '"\s*,\s*href:\s*")[^"]+(")'
    if ($content -match $pattern) {
      $content = [regex]::Replace(
        $content,
        $pattern,
        ('$1' + $href + '$2'),
        1
      )
      Write-Host "Connected: $label -> $href"
    } else {
      Write-Host "Warning: sidebar item not found: $label" -ForegroundColor Yellow
    }
  }

  Set-Content -Path $SidebarPath -Value $content -Encoding utf8
  Write-Host "Sidebar destinations verified in: $SidebarPath" -ForegroundColor Green
}

function Write-ConnectionReport([string]$ProjectRoot, [string]$PagePath, [string]$SidebarPath) {
  Write-Step "Writing connection report"

  $page = Get-Content $PagePath -Raw
  $sidebar = Get-Content $SidebarPath -Raw

  $workspaceNames = @(
    "ats",
    "career",
    "copilot",
    "recruiter",
    "writer",
    "matching",
    "opportunities"
  )

  $lines = @(
    "# Makwande Careers functional connection report",
    "",
    "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "",
    "## Files",
    "",
    "- CV Builder: `$($PagePath.Replace($ProjectRoot + '\', ''))`",
    "- Sidebar: `$($SidebarPath.Replace($ProjectRoot + '\', ''))`",
    "",
    "## Workspace checks",
    ""
  )

  foreach ($workspace in $workspaceNames) {
    $sidebarConnected = $sidebar.Contains("workspace=$workspace")
    $pageRecognised = $page.Contains('"' + $workspace + '"')
    $status = if ($sidebarConnected -and $pageRecognised) { "CONNECTED" } else { "CHECK REQUIRED" }

    $lines += "- `$workspace`: $status"
  }

  $lines += @(
    "",
    "## Functional URLs",
    "",
    "- `/dashboard/cv-builder?workspace=ats`",
    "- `/dashboard/cv-builder?workspace=career`",
    "- `/dashboard/cv-builder?workspace=copilot`",
    "- `/dashboard/cv-builder?workspace=recruiter`",
    "- `/dashboard/cv-builder?workspace=writer`",
    "- `/dashboard/cv-builder?workspace=matching`",
    "- `/dashboard/cv-builder?workspace=opportunities`",
    "",
    "## Important",
    "",
    "This patch connects navigation to the existing CV Builder workspaces.",
    "It does not invent backend endpoints or replace existing feature logic."
  )

  $reportPath = Join-Path $ProjectRoot "FUNCTIONAL_CONNECTION_REPORT.md"
  Set-Content -Path $reportPath -Value ($lines -join [Environment]::NewLine) -Encoding utf8
  Write-Host "Report: $reportPath" -ForegroundColor Green
}

Write-Step "Validating GitHub repository root"

$packageJson = Join-Path $ProjectRoot "package.json"
if (-not (Test-Path $packageJson)) {
  throw "package.json was not found. Run this script from E:\Makwande_Careers_Frontend."
}

$pagePath = Join-Path $ProjectRoot "app\dashboard\cv-builder\page.tsx"
$sidebarPath = Join-Path $ProjectRoot "components\sidebar.tsx"

Patch-CvBuilderPage $pagePath
Patch-SidebarLinks $sidebarPath
Write-ConnectionReport $ProjectRoot $pagePath $sidebarPath

Write-Step "Clearing Next.js build cache"
$nextPath = Join-Path $ProjectRoot ".next"
if (Test-Path $nextPath) {
  Remove-Item $nextPath -Recurse -Force
}

Write-Step "Running production build"
Push-Location $ProjectRoot
try {
  & npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "FUNCTIONAL CONNECTION BUILD PASSED" -ForegroundColor Green
Write-Host ""
Write-Host "Test these URLs:"
Write-Host "  http://localhost:3000/dashboard/cv-builder?workspace=ats"
Write-Host "  http://localhost:3000/dashboard/cv-builder?workspace=career"
Write-Host "  http://localhost:3000/dashboard/cv-builder?workspace=copilot"
Write-Host "  http://localhost:3000/dashboard/cv-builder?workspace=recruiter"
Write-Host "  http://localhost:3000/dashboard/cv-builder?workspace=writer"
Write-Host "  http://localhost:3000/dashboard/cv-builder?workspace=matching"
Write-Host "  http://localhost:3000/dashboard/cv-builder?workspace=opportunities"
Write-Host ""
Write-Host "Commit after testing:"
Write-Host "  git add app/dashboard/cv-builder/page.tsx components/sidebar.tsx FUNCTIONAL_CONNECTION_REPORT.md"
Write-Host '  git commit -m "Connect AI sidebar navigation to functional workspaces"'
Write-Host "  git push origin HEAD:phase-3-cv-management"
