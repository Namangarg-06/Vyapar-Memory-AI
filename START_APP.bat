@echo off
title Vyapar Memory AI Launcher
color 0A

echo ========================================================
echo       Vyapar Memory AI — 1-Click App Launcher
echo ========================================================
echo.
echo 1. Starting FastAPI Backend on http://localhost:8000...
start "Vyapar Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

echo 2. Starting React Frontend on http://localhost:5173...
start "Vyapar Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo 3. Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo 4. Opening your browser automatically...
start http://localhost:5173

echo.
echo ========================================================
echo   Vyapar Memory AI is now running!
echo   - Browser URL: http://localhost:5173
echo   - API Swagger Docs: http://localhost:8000/docs
echo   - To stop the application anytime, double-click STOP_APP.bat
echo ========================================================
echo.
echo You can close this small launcher window anytime.
pause
