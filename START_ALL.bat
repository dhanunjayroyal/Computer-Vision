@echo off
echo ==========================================
echo   SmartVision AI - Full Stack Launcher
echo ==========================================
echo Starting Backend on http://localhost:8000
start "SmartVision Backend" cmd /c "cd /d %~dp0backend && python run.py"
timeout /t 3 /nobreak >nul
echo Starting Frontend on http://localhost:5173
start "SmartVision Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo ==========================================
echo   Both servers are starting!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/api/docs
echo ==========================================
start http://localhost:5173
pause
