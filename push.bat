@echo off
set MSG=%*
if "%MSG%"=="" set MSG=update

echo =========================================
echo   Vyapar Memory AI - 1-Click Push to Live
echo =========================================

echo 1. Staging all files...
git add .

echo 2. Committing changes: "%MSG%"...
git commit -m "%MSG%"

echo 3. Pushing to GitHub main...
git push origin main

echo.
echo Done! Code pushed to GitHub and live CI/CD pipeline triggered.
