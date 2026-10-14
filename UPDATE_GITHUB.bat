@echo off
title Vyapar Memory AI - 1-Click GitHub Live Deploy
color 0B

echo ========================================================
echo       Vyapar Memory AI — 1-Click Push to Live
echo ========================================================
echo.

set /p MSG="Kya update kiya? (Enter dabayein 'update' ke liye): "
if "%MSG%"=="" set MSG=update

echo.
echo 1. Changes stage ho rahe hain...
git add .

echo 2. Commit ho raha hai: "%MSG%"...
git commit -m "%MSG%"

echo 3. GitHub par push aur live deploy ho raha hai...
git push origin main

echo.
echo ========================================================
echo   Sab kuch GitHub par live push ho gaya!
echo ========================================================
echo.
pause
