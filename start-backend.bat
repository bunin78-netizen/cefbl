@echo off
chcp 65001 >nul 2>nul
setlocal
title FundingArb Bot - Backend Server
color 0A

echo.
echo  ============================================================
echo           FUNDINGARB BOT - Backend Server
echo  ============================================================
echo.

:: Check Node.js
echo  [1/4] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Node.js is NOT installed!
    echo.
    echo  Download and install from https://nodejs.org/
    echo  Recommended: LTS version (18.x or 20.x)
    echo.
    echo  Press any key to open the download page...
    pause >nul
    start https://nodejs.org/en/download/
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js %%v
echo.

:: Check npm
echo  [2/4] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo  [ERROR] npm not found! Reinstall Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do echo  [OK] npm v%%v
echo.

:: Install dependencies
echo  [3/4] Checking dependencies...
if not exist "node_modules" (
    echo  Installing packages (first run)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        color 0C
        echo  [ERROR] Dependency installation failed!
        pause
        exit /b 1
    )
) else (
    echo  [OK] node_modules exists (skipping install)
)
echo.

:: Check .env.local
echo  [4/4] Checking configuration...
if not exist ".env.local" (
    color 0E
    echo  [WARNING] .env.local not found!
    echo  Creating from template...
    (
        echo BINANCE_API_KEY=
        echo BINANCE_API_SECRET=
        echo BYBIT_API_KEY=
        echo BYBIT_API_SECRET=
        echo OKX_API_KEY=
        echo OKX_API_SECRET=
        echo OKX_PASSPHRASE=
        echo BITGET_API_KEY=
        echo BITGET_API_SECRET=
        echo BITGET_PASSPHRASE=
        echo MEXC_API_KEY=
        echo MEXC_API_SECRET=
        echo TELEGRAM_BOT_TOKEN=
        echo TELEGRAM_CHAT_ID=
        echo MIN_SPREAD_PERCENT=0.3
        echo MAX_POSITION_USDT=100
        echo MAX_OPEN_POSITIONS=5
        echo LEVERAGE=1
        echo CHECK_INTERVAL_MS=5000
        echo HOLD_MINUTES=60
        echo PORT=3001
    ) > .env.local
    echo.
    echo  [!] IMPORTANT: Open .env.local and add your API keys!
    echo  Opening in Notepad...
    start notepad .env.local
    echo.
    echo  Press any key after saving your keys...
    pause >nul
) else (
    echo  [OK] .env.local found
)
echo.

:: Check port 3001
echo  Checking port 3001...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo  [WARNING] Port 3001 is busy! Stopping PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 /nobreak >nul
echo  [OK] Port 3001 is free
echo.

:: Check backend file exists
if not exist "backend\server.js" (
    color 0C
    echo  [ERROR] backend\server.js not found!
    echo  Make sure you are in the correct directory.
    pause
    exit /b 1
)

:: Start server
echo  ============================================================
echo   Starting FundingArb Backend...
echo   URL: http://localhost:3001
echo   WebSocket: ws://localhost:3001
echo   Press Ctrl+C to stop
echo  ============================================================
echo.

node backend/server.js

if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Server crashed! Check the logs above.
    echo.
)
pause
