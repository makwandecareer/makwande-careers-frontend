@echo off
setlocal
cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: Run this file from the GitHub repository root.
  echo Expected package.json in: %CD%
  exit /b 1
)

if not exist "components" mkdir "components"

if exist "components\sidebar.tsx" (
  copy /Y "components\sidebar.tsx" "components\sidebar.tsx.before-sidebar-upgrade" >nul
)

copy /Y "_github-root-patch\components\sidebar.tsx" "components\sidebar.tsx"
copy /Y "_github-root-patch\components\sidebar.module.css" "components\sidebar.module.css"

echo.
echo Sidebar upgrade applied from repository root.
echo Backup: components\sidebar.tsx.before-sidebar-upgrade
echo.
echo Running production build...
call npm run build

if errorlevel 1 (
  echo.
  echo BUILD FAILED. The original sidebar backup is still available.
  exit /b 1
)

echo.
echo BUILD PASSED.
echo.
echo Next commands:
echo git add components/sidebar.tsx components/sidebar.module.css
echo git commit -m "Upgrade dashboard sidebar navigation"
echo git push origin phase-3-cv-management
endlocal
