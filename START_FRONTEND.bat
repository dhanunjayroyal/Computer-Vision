@echo off
echo ==========================================
echo   SmartVision AI - Starting Frontend
echo ==========================================
cd /d "%~dp0frontend"
cmd /c "npm run dev"
pause
