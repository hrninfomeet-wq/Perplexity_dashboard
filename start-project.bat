@echo off
echo ====================================================
echo NSE Trading Dashboard - Phase 2.5 Multi-API System
echo ====================================================
echo.

REM Kill any existing Node processes
echo [1/4] Stopping existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start Backend Server
echo [2/4] Starting Multi-API Backend Server (Phase 2.5)...
cd /d "%~dp0dashboard-backend"
start "Backend Server" cmd /k "npm start"
timeout /t 5 /nobreak >nul

REM Start Frontend Server
echo [3/4] Starting Frontend Development Server...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "npx vite --host 0.0.0.0 --port 3000"
timeout /t 3 /nobreak >nul

REM Open Browser
echo [4/4] Opening application in browser...
timeout /t 5 /nobreak >nul
start msedge "http://localhost:3000"

echo.
echo ====================================================
echo Application started successfully!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ====================================================
echo.
echo Press any key to close this window...
pause >nul
