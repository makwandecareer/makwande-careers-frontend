@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0connect-functional-workspaces.ps1" -ProjectRoot "%CD%"

if errorlevel 1 (
  echo.
  echo Functional connection failed. Review the error above.
  pause
  exit /b 1
)

echo.
echo Functional connection completed successfully.
pause
