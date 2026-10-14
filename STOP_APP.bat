@echo off
title Stop Vyapar Memory AI
color 0C

echo ========================================================
echo       Stopping Vyapar Memory AI Servers...
echo ========================================================
echo.

taskkill /f /im python.exe /fi "WINDOWTITLE eq Vyapar Backend API*" 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq Vyapar Frontend UI*" 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo All backend and frontend processes stopped successfully.
echo.
pause
