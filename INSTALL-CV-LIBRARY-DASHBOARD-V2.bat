@echo off
setlocal EnableExtensions

title Makwande Careers - Install CV Library Dashboard v2

echo.
echo ============================================================
echo   MAKWANDE CAREERS - CV LIBRARY DASHBOARD V2
echo ============================================================
echo.
echo This installer will:
echo   1. Back up your current CV library page
echo   2. Install the new dashboard page and styles
echo   3. Run lint and production build
echo   4. Commit and push the changes
echo.

set "PROJECT=E:\Makwande_Careers_Dashboard_1430"

if not exist "%PROJECT%\package.json" (
  echo ERROR: Frontend project was not found at:
  echo %PROJECT%
  echo.
  set /p PROJECT=Enter the full frontend project path: 
)

if not exist "%PROJECT%\package.json" (
  echo ERROR: package.json was not found. Installation stopped.
  pause
  exit /b 1
)

set "SOURCE=%~dp0"
set "TARGET=%PROJECT%\app\dashboard\cvs"
set "BACKUP=%PROJECT%\_backups\cv-library-dashboard-v2-%RANDOM%"

echo.
echo [1/7] Preparing folders...
if not exist "%TARGET%" mkdir "%TARGET%"
mkdir "%BACKUP%" >nul 2>&1

echo [2/7] Backing up current files...
if exist "%TARGET%\page.tsx" copy /Y "%TARGET%\page.tsx" "%BACKUP%\page.tsx" >nul
if exist "%TARGET%\cv-library-dashboard.css" copy /Y "%TARGET%\cv-library-dashboard.css" "%BACKUP%\cv-library-dashboard.css" >nul

echo [3/7] Installing dashboard files...
copy /Y "%SOURCE%app\dashboard\cvs\page.tsx" "%TARGET%\page.tsx" >nul
if errorlevel 1 goto :copy_failed
copy /Y "%SOURCE%app\dashboard\cvs\cv-library-dashboard.css" "%TARGET%\cv-library-dashboard.css" >nul
if errorlevel 1 goto :copy_failed

cd /d "%PROJECT%"

echo [4/7] Running ESLint...
call npm run lint
if errorlevel 1 goto :quality_failed

echo [5/7] Running production build...
call npm run build
if errorlevel 1 goto :quality_failed

echo [6/7] Creating Git commit...
git add app/dashboard/cvs/page.tsx app/dashboard/cvs/cv-library-dashboard.css
git diff --cached --quiet
if not errorlevel 1 (
  echo No new file changes were detected. Skipping commit.
  goto :push
)

git commit -m "feat: upgrade CV library dashboard"
if errorlevel 1 goto :git_failed

:push
echo [7/7] Pushing current branch to GitHub...
git push
if errorlevel 1 (
  echo.
  echo The files are installed and tested, but Git push failed.
  echo Run this command later from the project folder:
  echo git push
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   SUCCESS - CV LIBRARY DASHBOARD V2 INSTALLED
echo ============================================================
echo.
echo Backup saved in:
echo %BACKUP%
echo.
echo Open:
echo https://makwandecareer.co.za/dashboard/cvs
echo.
pause
exit /b 0

:copy_failed
echo.
echo ERROR: One or more files could not be copied.
echo Your original files are available in:
echo %BACKUP%
pause
exit /b 1

:quality_failed
echo.
echo ERROR: Lint or production build failed.
echo No Git commit was created.
echo Restore your previous files from:
echo %BACKUP%
pause
exit /b 1

:git_failed
echo.
echo ERROR: Git could not create the commit.
echo The files passed testing and remain installed locally.
pause
exit /b 1
