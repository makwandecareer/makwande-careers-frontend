@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apply-cv-studio-polish.ps1" -ProjectRoot "%CD%"
if errorlevel 1 pause
