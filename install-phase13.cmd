@echo off
setlocal EnableExtensions

set "PROJECT=E:\Makwande_Careers_Frontend"
set "PACKAGE=%~dp0"

if not exist "%PROJECT%\package.json" (
  echo ERROR: Project not found at %PROJECT%
  pause
  exit /b 1
)

for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "DATESTAMP=%%d%%b%%c"
for /f "tokens=1-3 delims=:., " %%a in ("%time%") do set "TIMESTAMP=%%a%%b%%c"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP=%PROJECT%\phase13-backup-%DATESTAMP%-%TIMESTAMP%"

echo Installing Phase 13...
echo Project: %PROJECT%
echo Backup: %BACKUP%

mkdir "%BACKUP%\app\dashboard\cv-builder" >nul 2>&1
mkdir "%PROJECT%\components\cv-builder" >nul 2>&1
mkdir "%PROJECT%\lib" >nul 2>&1

if exist "%PROJECT%\app\dashboard\cv-builder\page.tsx" (
  copy /Y "%PROJECT%\app\dashboard\cv-builder\page.tsx" "%BACKUP%\app\dashboard\cv-builder\page.tsx" >nul
)

copy /Y "%PACKAGE%app\dashboard\cv-builder\page.tsx" "%PROJECT%\app\dashboard\cv-builder\page.tsx" >nul
if errorlevel 1 goto :error

copy /Y "%PACKAGE%components\cv-builder\CareerCopilotEngine.tsx" "%PROJECT%\components\cv-builder\CareerCopilotEngine.tsx" >nul
if errorlevel 1 goto :error

copy /Y "%PACKAGE%components\cv-builder\CareerCopilotEngine.module.css" "%PROJECT%\components\cv-builder\CareerCopilotEngine.module.css" >nul
if errorlevel 1 goto :error

copy /Y "%PACKAGE%lib\career-copilot.ts" "%PROJECT%\lib\career-copilot.ts" >nul
if errorlevel 1 goto :error

echo Phase 13 installed successfully.
echo.
echo Next:
echo cd /d %PROJECT%
echo npm run build
pause
exit /b 0

:error
echo ERROR: Installation failed.
echo Backup available at %BACKUP%
pause
exit /b 1
