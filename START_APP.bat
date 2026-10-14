@echo off
title Vyapar Memory AI
color 0A

cd /d "%~dp0"
set PATH=C:\Users\Hp\AppData\Local\Programs\Python\Python313;C:\Users\Hp\AppData\Local\Programs\Python\Python313\Scripts;C:\Program Files\nodejs;%PATH%

python run.py
if errorlevel 1 (
    "C:\Users\Hp\AppData\Local\Programs\Python\Python313\python.exe" run.py
)
pause
