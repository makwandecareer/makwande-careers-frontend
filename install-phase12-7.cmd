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
set "BACKUP=%PROJECT%\phase12-7-backup-%DATESTAMP%-%TIMESTAMP%"

echo Installing Phase 12.7...
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

copy /Y "%PACKAGE%components\cv-builder\PressureInterviewEngine.tsx" "%PROJECT%\components\cv-builder\PressureInterviewEngine.tsx" >nul
if errorlevel 1 goto :error

copy /Y "%PACKAGE%components\cv-builder\PressureInterviewEngine.module.css" "%PROJECT%\components\cv-builder\PressureInterviewEngine.module.css" >nul
if errorlevel 1 goto :error

copy /Y "%PACKAGE%lib\pressure-interview.ts" "%PROJECT%\lib\pressure-interview.ts" >nul
if errorlevel 1 goto :error

echo Phase 12.7 installed successfully.
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
