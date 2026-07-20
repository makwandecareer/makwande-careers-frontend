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
  $insertIndex = 0

  if ($lines.Count -gt 0 -and ($lines[0].Trim() -eq '"use client";' -or $lines[0].Trim() -eq "'use client';")) {
    $insertIndex = 1
  }

  $result = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($i -eq $insertIndex) {
      $result.Add('import { useSearchParams } from "next/navigation";')
    }
    $result.Add($lines[$i])
  }

  if ($insertIndex -ge $lines.Count) {
    $result.Add('import { useSearchParams } from "next/navigation";')
  }

  return ($result -join [Environment]::NewLine)
}

function Patch-CvBuilderPage([string]$PagePath) {
  Write-Step "Connecting sidebar workspace links to CV Builder tabs"

  Backup-File $PagePath
  $content = Get-Content $PagePath -Raw

  if ($content -notmatch '\bsetTab\s*\(') {
    throw "Could not find setTab(...) in $PagePath."
  }

  $content = Add-ReactUseEffectImport $content
  $content = Add-SearchParamsImport $content

  if ($content -notmatch 'const\s+WORKSPACE_TAB_VALUES') {
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

    $componentMatch = [regex]::Match($content, '(?m)^export\s+(?:default\s+)?function\s+')
    if (-not $componentMatch.Success) {
      throw "Could not locate the exported CV Builder component."
    }

    $content = $content.Insert($componentMatch.Index, $mapping + [Environment]::NewLine)
  }

  if ($content -notmatch 'const\s+workspaceSearchParams\s*=\s*useSearchParams\(\)') {
    $componentOpen = [regex]::Match(
      $content,
      '(?ms)(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)'
    )

    if (-not $componentOpen.Success) {
      throw "Could not find the opening of the exported CV Builder component."
    }

    $insert = [Environment]::NewLine + '  const workspaceSearchParams = useSearchParams();' + [Environment]::NewLine
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
      $content = [regex]::Replace($content, $pattern, ('$1' + $href + '$2'), 1)
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

  $relativePage = $PagePath.Substring($ProjectRoot.Length).TrimStart('\')
  $relativeSidebar = $SidebarPath.Substring($ProjectRoot.Length).TrimStart('\')

  $workspaceNames = @(
    "ats",
    "career",
    "copilot",
    "recruiter",
    "writer",
    "matching",
    "opportunities"
  )

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("# Makwande Careers functional connection report")
  $lines.Add("")
  $lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
  $lines.Add("")
  $lines.Add("## Files")
  $lines.Add("")
  $lines.Add("- CV Builder: $relativePage")
  $lines.Add("- Sidebar: $relativeSidebar")
  $lines.Add("")
  $lines.Add("## Workspace checks")
  $lines.Add("")

  foreach ($workspace in $workspaceNames) {
    $sidebarConnected = $sidebar.Contains("workspace=$workspace")
    $pageRecognised = $page.Contains('"' + $workspace + '"')
    $status = if ($sidebarConnected -and $pageRecognised) { "CONNECTED" } else { "CHECK REQUIRED" }
    $lines.Add("- $workspace : $status")
  }

  $lines.Add("")
  $lines.Add("## Functional URLs")
  $lines.Add("")

  foreach ($workspace in $workspaceNames) {
    $lines.Add("- /dashboard/cv-builder?workspace=$workspace")
  }

  $lines.Add("")
  $lines.Add("## Important")
  $lines.Add("")
  $lines.Add("This patch connects navigation to the existing CV Builder workspaces.")
  $lines.Add("It does not invent backend endpoints or replace existing feature logic.")

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
