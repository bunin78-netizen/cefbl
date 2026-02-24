@echo off
chcp 65001 >nul 2>nul
setlocal EnableDelayedExpansion
title FundingArb Bot - Install
color 0A

echo.
echo  ============================================================
echo           FUNDINGARB BOT - Installation and Setup
echo  ============================================================
echo.
echo  This script will:
echo  1. Check Node.js
echo  2. Install npm dependencies
echo  3. Create .env.local config file
echo  4. (Optional) Install PM2
echo.
echo  Press any key to continue...
pause >nul

echo.
echo  [Step 1] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0E
    echo.
    echo  [!] Node.js is NOT installed.
    echo.
    echo  Options:
    echo   [1] Open https://nodejs.org/ (recommended LTS)
    echo   [2] Use winget: winget install OpenJS.NodeJS.LTS
    echo   [3] I already installed it, refresh PATH
    echo.
    set /p "nodeChoice=Select option (1/2/3): "
    if "!nodeChoice!"=="1" (
        start https://nodejs.org/en/download/
        echo  Install Node.js and restart this script.
        pause
        exit /b 1
    )
    if "!nodeChoice!"=="2" (
        echo  Running winget...
        winget install OpenJS.NodeJS.LTS
        echo  After installation, RESTART this script!
        pause
        exit /b 1
    )
    where node >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo  Still not found. Open a new cmd window and try again.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js %%v found
for /f "tokens=*" %%v in ('npm --version') do echo  [OK] npm v%%v found

echo.
echo  [Step 2] Installing npm dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    color 0C
    echo  [ERROR] Dependency installation failed! Check your internet connection.
    pause
    exit /b 1
)
echo  [OK] Dependencies installed

echo.
echo  [Step 3] Creating .env.local config file...
if exist ".env.local" (
    echo  File .env.local already exists.
    set /p "overwrite=Overwrite? (y/N): "
    if /i not "!overwrite!"=="y" goto skip_env
)

(
echo # =========================================================
echo # FundingArb Bot - API Keys Configuration
echo # Fill in keys for the exchanges you want to use
echo # =========================================================
echo.
echo # --- BINANCE --- https://www.binance.com/en/my/settings/api-management
echo BINANCE_API_KEY=
echo BINANCE_API_SECRET=
echo.
echo # --- BYBIT --- https://www.bybit.com/app/user/api-management
echo BYBIT_API_KEY=
echo BYBIT_API_SECRET=
echo.
echo # --- OKX --- https://www.okx.com/account/my-api
echo OKX_API_KEY=
echo OKX_API_SECRET=
echo OKX_PASSPHRASE=
echo.
echo # --- BITGET --- https://www.bitget.com/account/apimanage
echo BITGET_API_KEY=
echo BITGET_API_SECRET=
echo BITGET_PASSPHRASE=
echo.
echo # --- MEXC --- https://www.mexc.com/user/openapi
echo MEXC_API_KEY=
echo MEXC_API_SECRET=
echo.
echo # --- TELEGRAM --- Create bot via @BotFather in Telegram
echo TELEGRAM_BOT_TOKEN=
echo TELEGRAM_CHAT_ID=
echo.
echo # --- BOT SETTINGS ---
echo MIN_SPREAD_PERCENT=0.3
echo MAX_POSITION_USDT=100
echo MAX_OPEN_POSITIONS=5
echo LEVERAGE=1
echo CHECK_INTERVAL_MS=5000
echo HOLD_MINUTES=60
echo PORT=3001
) > .env.local

echo  [OK] .env.local created

:skip_env
echo.
echo  Opening .env.local in Notepad...
start notepad .env.local
echo.
echo  [!] FILL IN YOUR API KEYS in the Notepad window!
echo      Save the file (Ctrl+S) and come back here.
echo.
echo  Press any key after saving your keys...
pause >nul

echo.
echo  [Step 4] PM2 - process manager (optional)
echo.
echo  PM2 allows running the bot in background with auto-restart.
echo.
set /p "pm2Choice=Install PM2? (y/N): "
if /i "!pm2Choice!"=="y" (
    echo  Installing PM2...
    call npm install -g pm2
    echo  [OK] PM2 installed
    echo.
    echo  To run via PM2 use: start-pm2.bat
)

echo.
echo  ============================================================
echo                  INSTALLATION COMPLETE
echo  ============================================================
echo.
echo  How to start the bot:
echo.
echo  start-all.bat      - Start Backend + Frontend
echo  start-backend.bat  - Backend only
echo  start-frontend.bat - Frontend only
echo.
echo  Dashboard: http://localhost:5173
echo  API:       http://localhost:3001
echo.
echo  ============================================================
echo.
echo  Press any key to launch the bot...
pause >nul

call start-all.bat
