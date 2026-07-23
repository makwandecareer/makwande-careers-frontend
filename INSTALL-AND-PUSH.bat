@echo off
setlocal EnableExtensions
title Makwande Careers - Restore Billing and Push

cd /d "%~dp0"

echo.
echo ================================================
echo  MAKWANDE CAREERS - RESTORE BILLING AND PUSH
echo ================================================
echo.

if not exist "package.json" (
  echo ERROR: This file must be inside the project root:
  echo E:\Makwande_Careers_Dashboard_1430
  echo.
  pause
  exit /b 1
)

if not exist "payload\sidebar.tsx" (
  echo ERROR: payload\sidebar.tsx is missing.
  echo Extract the full ZIP into the project root.
  echo.
  pause
  exit /b 1
)

if not exist "components" (
  echo ERROR: components folder was not found.
  echo.
  pause
  exit /b 1
)

echo [1/5] Restoring Billing and Plans navigation...
copy /Y "payload\sidebar.tsx" "components\sidebar.tsx" >nul
if errorlevel 1 (
  echo ERROR: Could not update components\sidebar.tsx
  pause
  exit /b 1
)

echo [2/5] Running production build...
call npm run build
if errorlevel 1 (
  echo.
  echo ERROR: Build failed. Nothing will be committed or pushed.
  pause
  exit /b 1
)

echo [3/5] Preparing Git commit...
git restore next-env.d.ts >nul 2>&1
git add components\sidebar.tsx

git diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo Billing navigation is already restored. There is nothing new to commit.
  echo You can push the current branch manually if needed.
  pause
  exit /b 0
)

echo [4/5] Creating commit...
git commit -m "fix: restore live billing navigation"
if errorlevel 1 (
  echo ERROR: Git commit failed.
  pause
  exit /b 1
)

echo [5/5] Pushing to frontend-integration-recovery...
git push origin HEAD:frontend-integration-recovery
if errorlevel 1 (
  echo ERROR: Git push failed.
  pause
  exit /b 1
)

echo.
echo ================================================
echo SUCCESS
echo Billing and Plans was restored and pushed.
echo Render should now deploy the latest commit.
echo ================================================
echo.
pause
exit /b 0
