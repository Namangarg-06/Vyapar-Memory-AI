@echo off
title Vyapar Memory AI — Control Center
:menu
cls
color 0B
echo ========================================================
echo         VYAPAR MEMORY AI — CONTROL CENTER
echo ========================================================
echo.
echo   [1] RUN APPLICATION (Start Backend, Frontend & Open Browser)
echo   [2] STOP APPLICATION (Close all running servers)
echo   [3] RUN AUTOMATED TESTS (Verify backend & frontend tests)
echo   [4] UPDATE GITHUB (Commit and deploy changes)
echo   [5] EXIT
echo.
echo ========================================================
set /p choice="Apna option select karein [1, 2, 3, 4, 5]: "

if "%choice%"=="1" goto run_app
if "%choice%"=="2" goto stop_app
if "%choice%"=="3" goto run_tests
if "%choice%"=="4" goto update_git
if "%choice%"=="5" goto exit_menu
echo Invalid choice. Kripya 1 se 5 ke beech number chunein.
timeout /t 2 >nul
goto menu

:run_app
cls
color 0A
echo ========================================================
echo   Starting Vyapar Memory AI...
echo ========================================================
echo.
echo 1. Starting Backend API on http://localhost:8000...
start "Vyapar Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

echo 2. Starting Frontend UI on http://localhost:5173...
start "Vyapar Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo 3. Waiting 3 seconds for boot...
timeout /t 3 /nobreak >nul

echo 4. Opening Browser to http://localhost:5173...
start http://localhost:5173

echo.
echo App chal rahi hai!
pause
goto menu

:stop_app
cls
color 0C
echo ========================================================
echo   Stopping Vyapar Memory AI...
echo ========================================================
taskkill /f /im python.exe /fi "WINDOWTITLE eq Vyapar Backend API*" 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq Vyapar Frontend UI*" 2>nul
taskkill /f /im uvicorn.exe 2>nul
echo All servers stopped!
pause
goto menu

:run_tests
cls
color 0E
echo ========================================================
echo   Running Automated Test Suite...
echo ========================================================
python -m pytest backend/tests -v
echo.
pause
goto menu

:update_git
cls
color 0D
echo ========================================================
echo   Updating GitHub & Triggering Live Deploy...
echo ========================================================
set /p commit_msg="Commit message (Enter for 'update'): "
if "%commit_msg%"=="" set commit_msg=update
git add .
git commit -m "%commit_msg%"
git push origin main
echo Done! Code pushed to GitHub.
pause
goto menu

:exit_menu
exit
