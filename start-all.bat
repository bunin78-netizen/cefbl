@echo off
chcp 65001 >nul 2>nul
setlocal
cd /d "%~dp0"
title FundingArb Bot - Launcher
color 0A

echo.
echo  ============================================================
echo           FUNDINGARB BOT - Full Launch
echo           Starting Backend + Frontend
echo  ============================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo  [ERROR] Node.js is NOT installed!
    echo  Run install.bat first.
    pause
    exit /b 1
)

:: Install deps if needed
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo.
)

:: Check .env.local
if not exist ".env.local" (
    color 0E
    echo  [WARNING] .env.local not found!
    echo  Run install.bat first to create it.
    echo.
    pause
    exit /b 1
)

:: Kill existing processes on ports 3001 and 5173
echo  Checking ports...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo  Stopping process on port 3001 (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo  Stopping process on port 5173 (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 /nobreak >nul

echo.
echo  Starting two windows:
echo  1) Backend  - http://localhost:3001
echo  2) Frontend - http://localhost:5173
echo.

if not exist "start-backend.bat" (
    color 0C
    echo  [ERROR] start-backend.bat not found!
    pause
    exit /b 1
)
if not exist "start-frontend.bat" (
    color 0C
    echo  [ERROR] start-frontend.bat not found!
    pause
    exit /b 1
)

:: Start backend in new window (via dedicated script)
start "FundingArb-Backend" "%~dp0start-backend.bat"

:: Wait for backend to initialize
echo  Waiting for backend to start...
timeout /t 3 /nobreak >nul

:: Start frontend in new window (via dedicated script)
start "FundingArb-Frontend" "%~dp0start-frontend.bat"

:: Wait and open browser
echo  Waiting for frontend to start...
timeout /t 5 /nobreak >nul
echo  Opening browser...
start http://localhost:5173

echo.
echo  ============================================================
echo  [OK] Everything is running!
echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo  To stop: close the Backend and Frontend windows
echo           or run stop-all.bat
echo  ============================================================
echo.
echo  This window can be closed.
pause
