@echo off
chcp 65001 >nul 2>nul
setlocal
title FundingArb Bot - Frontend Dev Server
color 0B

echo.
echo  ============================================================
echo           FUNDINGARB BOT - Frontend Dev Server
echo  ============================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo  [ERROR] Node.js is NOT installed!
    echo  Download from https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

:: Check port 5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo  Stopping process on port 5173 (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 /nobreak >nul

echo  Starting Vite dev server...
echo  URL: http://localhost:5173
echo.
call npm run dev

pause
