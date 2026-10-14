@echo off
title Vyapar Memory AI Launcher
color 0A

echo ========================================================
echo       Vyapar Memory AI — App Launcher
echo ========================================================
echo.
echo 1. Starting Backend API on http://localhost:8000...
start "Vyapar Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000"

echo 2. Starting Frontend on http://localhost:5173...
start "Vyapar Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo 3. Waiting 3 seconds for server boot...
timeout /t 3 /nobreak >nul

echo 4. Opening Browser...
start http://localhost:5173

echo.
echo App chal chuki hai! Browser check kijiye.
echo Server windows ko minimize kar sakte hain.
pause
