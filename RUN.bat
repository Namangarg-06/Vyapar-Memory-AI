@echo off
title Vyapar Memory AI
color 0A

echo Starting Vyapar Memory AI...
start "Backend" /min cmd /c "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000"
start "Frontend" /min cmd /c "cd /d %~dp0frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173

echo.
echo App chal gayi hai! Browser check karein.
exit
