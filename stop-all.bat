@echo off
chcp 65001 >nul 2>nul
setlocal
title FundingArb Bot - Stop All
color 0C

echo.
echo  ============================================================
echo           FUNDINGARB BOT - Stopping all processes
echo  ============================================================
echo.

echo  Stopping processes on port 3001 (Backend)...
set "found3001=0"
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo    Killing PID %%a...
    taskkill /F /PID %%a >nul 2>nul
    set "found3001=1"
)
if "%found3001%"=="0" echo    No process found on port 3001

echo.
echo  Stopping processes on port 5173 (Frontend)...
set "found5173=0"
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo    Killing PID %%a...
    taskkill /F /PID %%a >nul 2>nul
    set "found5173=1"
)
if "%found5173%"=="0" echo    No process found on port 5173

echo.
echo  Stopping PM2 (if running)...
where pm2 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    pm2 stop fundingarb-backend >nul 2>nul
    echo    PM2 process stopped
) else (
    echo    PM2 not installed (skipping)
)

echo.
echo  ============================================================
echo  [OK] All processes stopped.
echo  ============================================================
echo.
pause
