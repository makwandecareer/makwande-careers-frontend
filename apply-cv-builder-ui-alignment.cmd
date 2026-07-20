@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apply-cv-builder-ui-alignment.ps1" -ProjectRoot "%CD%"

if errorlevel 1 (
  echo.
  echo UI alignment patch failed.
  pause
  exit /b 1
)

echo.
echo Patch applied. Run npm run build next.
pause
