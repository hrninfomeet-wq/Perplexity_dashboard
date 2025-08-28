@echo off
echo Starting NSE Trading Dashboard...

REM Kill any existing Node processes
taskkill /F /IM node.exe 2>nul

REM Start Backend
echo Starting Enhanced Backend...
start /D "C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\dashboard-backend" cmd /k "npm run start-enhanced"

REM Wait a moment for backend to start
timeout /t 5 /nobreak > nul

REM Start Frontend
echo Starting Frontend...
start /D "C:\Users\haroo\OneDrive\Documents\My Projects\Perplexity_dashboard\frontend" cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 10 /nobreak > nul

REM Open in Edge
echo Opening in Microsoft Edge...
start microsoft-edge:http://localhost:5173/

echo NSE Trading Dashboard started successfully!
pause
