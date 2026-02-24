@echo off
chcp 65001 >nul 2>nul
setlocal EnableDelayedExpansion
title FundingArb Bot - Update
color 0E

echo.
echo  ============================================================
echo           FUNDINGARB BOT - Update Dependencies
echo  ============================================================
echo.

echo  Stopping bot processes...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
where pm2 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    pm2 stop fundingarb-backend >nul 2>nul
)

echo  Updating npm packages...
call npm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] npm install failed!
    pause
    exit /b 1
)

echo  Building frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  [WARNING] Build had issues, but update completed.
)

echo.
echo  [OK] Update complete!
echo.
set /p "restart=Start the bot now? (y/N): "
if /i "!restart!"=="y" call start-all.bat
