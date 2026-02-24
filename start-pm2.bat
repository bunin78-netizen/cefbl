@echo off
chcp 65001 >nul 2>nul
setlocal EnableDelayedExpansion
title FundingArb Bot - PM2 Manager
color 0D

:menu
cls
echo.
echo  ============================================================
echo           FUNDINGARB BOT - PM2 Process Manager
echo           Background mode with auto-restart
echo  ============================================================
echo.

:: Check PM2
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo  [ERROR] PM2 is not installed!
    echo.
    set /p "installPm2=Install PM2 now? (y/N): "
    if /i "!installPm2!"=="y" (
        call npm install -g pm2
        echo  [OK] PM2 installed
        echo.
    ) else (
        echo  Cannot continue without PM2.
        pause
        exit /b 1
    )
)

echo  Select action:
echo.
echo   [1] Start bot (background)
echo   [2] Stop bot
echo   [3] Restart bot
echo   [4] View logs (live)
echo   [5] Process status
echo   [6] Remove from PM2
echo   [7] Save (auto-start on reboot)
echo   [8] Exit
echo.
set /p "choice=Enter choice (1-8): "

if "!choice!"=="1" goto pm2_start
if "!choice!"=="2" goto pm2_stop
if "!choice!"=="3" goto pm2_restart
if "!choice!"=="4" goto pm2_logs
if "!choice!"=="5" goto pm2_status
if "!choice!"=="6" goto pm2_delete
if "!choice!"=="7" goto pm2_save
if "!choice!"=="8" exit /b 0

echo  Invalid choice. Try again.
timeout /t 2 >nul
goto menu

:pm2_start
echo.
echo  Starting via PM2...
if exist "ecosystem.config.js" (
    pm2 start ecosystem.config.js
) else (
    pm2 start backend/server.js --name fundingarb-backend
)
echo.
pm2 status
echo.
echo  [OK] Bot is running in background!
echo  View logs: pm2 logs fundingarb-backend
echo.
pause
goto menu

:pm2_stop
echo.
pm2 stop fundingarb-backend
echo  [OK] Bot stopped
echo.
pause
goto menu

:pm2_restart
echo.
pm2 restart fundingarb-backend
echo  [OK] Bot restarted
echo.
pause
goto menu

:pm2_logs
echo.
echo  Showing logs (press Ctrl+C to exit)...
echo.
pm2 logs fundingarb-backend
goto menu

:pm2_status
echo.
pm2 status
echo.
pause
goto menu

:pm2_delete
echo.
pm2 delete fundingarb-backend
echo  [OK] Removed from PM2
echo.
pause
goto menu

:pm2_save
echo.
pm2 save
echo  [OK] Auto-start saved. Bot will start on Windows reboot.
echo.
pause
goto menu
