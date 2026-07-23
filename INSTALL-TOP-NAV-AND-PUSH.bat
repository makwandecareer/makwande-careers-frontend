@echo off
setlocal EnableExtensions
title Makwande Careers - Install Top Navigation

cd /d "%~dp0"

echo.
echo =================================================
echo  MAKWANDE CAREERS - TOP NAVIGATION INSTALLER
echo =================================================
echo.

if not exist "package.json" (
  echo ERROR: Extract this ZIP directly into:
  echo E:\Makwande_Careers_Dashboard_1430
  pause
  exit /b 1
)

if not exist "payload\components\dashboard-topbar.tsx" (
  echo ERROR: Installation payload is incomplete.
  pause
  exit /b 1
)

echo [1/6] Installing professional top navigation...
copy /Y "payload\components\dashboard-topbar.tsx" "components\dashboard-topbar.tsx" >nul
if errorlevel 1 goto copyerror

copy /Y "payload\app\dashboard\layout.tsx" "app\dashboard\layout.tsx" >nul
if errorlevel 1 goto copyerror

copy /Y "payload\app\dashboard\dashboard-topbar.css" "app\dashboard\dashboard-topbar.css" >nul
if errorlevel 1 goto copyerror

echo [2/6] Running lint...
call npm run lint
if errorlevel 1 (
  echo ERROR: Lint failed. Nothing will be committed.
  pause
  exit /b 1
)

echo [3/6] Running production build...
call npm run build
if errorlevel 1 (
  echo ERROR: Build failed. Nothing will be committed.
  pause
  exit /b 1
)

echo [4/6] Preparing Git commit...
git restore next-env.d.ts >nul 2>&1
git add components\dashboard-topbar.tsx app\dashboard\layout.tsx app\dashboard\dashboard-topbar.css

git diff --cached --quiet
if not errorlevel 1 (
  echo No new changes were detected.
  pause
  exit /b 0
)

echo [5/6] Creating commit...
git commit -m "feat: restore professional dashboard top navigation"
if errorlevel 1 (
  echo ERROR: Git commit failed.
  pause
  exit /b 1
)

echo [6/6] Pushing to frontend-integration-recovery...
git push origin HEAD:frontend-integration-recovery
if errorlevel 1 (
  echo ERROR: Git push failed.
  pause
  exit /b 1
)

echo.
echo =================================================
echo SUCCESS
echo Top navigation installed, tested and pushed.
echo =================================================
pause
exit /b 0

:copyerror
echo ERROR: Could not copy one or more files.
pause
exit /b 1
