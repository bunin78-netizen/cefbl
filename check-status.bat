@echo off
chcp 65001 >nul 2>nul
setlocal
title FundingArb Bot - System Check
color 0B

echo.
echo  ============================================================
echo           FUNDINGARB BOT - System Diagnostics
echo  ============================================================
echo.

:: Node.js
echo  [Node.js]
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo    [ERROR] NOT INSTALLED - download from https://nodejs.org/
) else (
    for /f "tokens=*" %%v in ('node --version') do echo    [OK] Installed: %%v
)

:: npm
echo.
echo  [npm]
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo    [ERROR] NOT FOUND
) else (
    for /f "tokens=*" %%v in ('npm --version') do echo    [OK] Installed: v%%v
)

:: node_modules
echo.
echo  [Dependencies]
if exist "node_modules" (
    echo    [OK] node_modules exists
) else (
    echo    [ERROR] node_modules NOT found - run install.bat
)

:: backend/server.js
echo.
echo  [Backend file]
if exist "backend\server.js" (
    echo    [OK] backend\server.js exists
) else (
    echo    [ERROR] backend\server.js NOT found
)

:: .env.local
echo.
echo  [Configuration .env.local]
if exist ".env.local" (
    echo    [OK] File exists
    echo.
    echo    Checking API keys:
    findstr /c:"BINANCE_API_KEY=" .env.local | findstr /v "=$" >nul 2>nul
    if %ERRORLEVEL% equ 0 (echo      BINANCE:  configured) else (echo      BINANCE:  not set)
    findstr /c:"BYBIT_API_KEY=" .env.local | findstr /v "=$" >nul 2>nul
    if %ERRORLEVEL% equ 0 (echo      BYBIT:    configured) else (echo      BYBIT:    not set)
    findstr /c:"OKX_API_KEY=" .env.local | findstr /v "=$" >nul 2>nul
    if %ERRORLEVEL% equ 0 (echo      OKX:      configured) else (echo      OKX:      not set)
    findstr /c:"BITGET_API_KEY=" .env.local | findstr /v "=$" >nul 2>nul
    if %ERRORLEVEL% equ 0 (echo      BITGET:   configured) else (echo      BITGET:   not set)
    findstr /c:"MEXC_API_KEY=" .env.local | findstr /v "=$" >nul 2>nul
    if %ERRORLEVEL% equ 0 (echo      MEXC:     configured) else (echo      MEXC:     not set)
    findstr /c:"TELEGRAM_BOT_TOKEN=" .env.local | findstr /v "=$" >nul 2>nul
    if %ERRORLEVEL% equ 0 (echo      TELEGRAM: configured) else (echo      TELEGRAM: not set)
) else (
    echo    [ERROR] .env.local NOT found - run install.bat
)

:: Ports
echo.
echo  [Network Ports]
netstat -aon 2>nul | findstr ":3001" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo    Port 3001 (Backend):  ACTIVE - server is running
) else (
    echo    Port 3001 (Backend):  free - server not running
)

netstat -aon 2>nul | findstr ":5173" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo    Port 5173 (Frontend): ACTIVE - Vite is running
) else (
    echo    Port 5173 (Frontend): free - Vite not running
)

:: PM2
echo.
echo  [PM2]
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo    PM2 not installed (optional)
) else (
    for /f "tokens=*" %%v in ('pm2 --version 2^>nul') do echo    [OK] PM2 v%%v installed
    echo.
    pm2 status 2>nul
)

:: Backend API check
echo.
echo  [Backend API]
where curl >nul 2>nul
if %ERRORLEVEL% equ 0 (
    curl -s --max-time 3 http://localhost:3001/api/status >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo    [OK] Backend responds at http://localhost:3001
    ) else (
        echo    Backend not reachable (start start-backend.bat)
    )
) else (
    echo    curl not available, skipping API check
)

echo.
echo  ============================================================
echo.
echo  Commands:
echo   install.bat       - First-time setup
echo   start-all.bat     - Start Backend + Frontend
echo   start-pm2.bat     - PM2 manager
echo   stop-all.bat      - Stop everything
echo.
pause
