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
set "BACKUP=%PROJECT%\phase20-backup-%DATESTAMP%-%TIMESTAMP%"
mkdir "%BACKUP%\app\dashboard\cv-builder" >nul 2>&1
mkdir "%PROJECT%\components\cv-builder" >nul 2>&1
mkdir "%PROJECT%\lib" >nul 2>&1
if exist "%PROJECT%\app\dashboard\cv-builder\page.tsx" copy /Y "%PROJECT%\app\dashboard\cv-builder\page.tsx" "%BACKUP%\app\dashboard\cv-builder\page.tsx" >nul
copy /Y "%PACKAGE%app\dashboard\cv-builder\page.tsx" "%PROJECT%\app\dashboard\cv-builder\page.tsx" >nul || goto :error
copy /Y "%PACKAGE%components\cv-builder\CareerOperatingSystem.tsx" "%PROJECT%\components\cv-builder\CareerOperatingSystem.tsx" >nul || goto :error
copy /Y "%PACKAGE%components\cv-builder\CareerOperatingSystem.module.css" "%PROJECT%\components\cv-builder\CareerOperatingSystem.module.css" >nul || goto :error
copy /Y "%PACKAGE%lib\career-operating-system.ts" "%PROJECT%\lib\career-operating-system.ts" >nul || goto :error
echo Phase 20 installed successfully.
echo Backup available at %BACKUP%
pause
exit /b 0
:error
echo ERROR: Installation failed.
echo Backup available at %BACKUP%
pause
exit /b 1
