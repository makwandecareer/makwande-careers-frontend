@echo off
setlocal
set "PROJECT=E:\Makwande_Careers_Dashboard_1430"
if not exist "%PROJECT%\package.json" (echo ERROR: Project not found at %PROJECT% & pause & exit /b 1)
cd /d "%PROJECT%"
copy /Y "%~dp0app\dashboard\billing\page.tsx" "%PROJECT%\app\dashboard\billing\page.tsx" >nul || goto :failed
findstr /C:"MAKWANDE ACTIVE ACCESS STATUS V1" "%PROJECT%\app\globals.css" >nul 2>&1
if errorlevel 1 (echo.>> "%PROJECT%\app\globals.css" & type "%~dp0ACTIVE-ACCESS-STATUS.css" >> "%PROJECT%\app\globals.css")
call npm run lint || goto :failed
call npm run build || goto :failed
git add app/dashboard/billing/page.tsx app/globals.css
git commit -m "feat: clarify trial and premium access communication"
git push origin frontend-integration-recovery || goto :failed
echo SUCCESS: Active payment status installed and pushed.
pause
exit /b 0
:failed
echo INSTALLATION STOPPED. Review the error above.
pause
exit /b 1
