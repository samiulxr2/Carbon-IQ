@echo off
title CarbonIQ-MRV Launcher
echo ======================================================================
echo           CarbonIQ-MRV: AI-Powered Digital MRV & Net-Zero Platform
echo                     ClimateSphere AI / CarbonIQ Challenge
echo ======================================================================
echo.
echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CarbonIQ-MRV Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [2/3] Starting Next.js Frontend on http://localhost:3000 ...
start "CarbonIQ-MRV Frontend (Next.js 14)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [3/3] Waiting for services to initialize...
timeout /t 5 /nobreak > nul

echo.
echo ======================================================================
echo  CarbonIQ-MRV is now running!
echo.
echo  * Frontend UI:       http://localhost:3000
echo  * Backend Swagger:   http://127.0.0.1:8000/docs
echo  * Telemetry Stream:  http://127.0.0.1:8000/telemetry/live
echo  * Ledger Endpoint:   http://127.0.0.1:8000/ledger
echo.
echo  Press any key to open the dashboard in your browser...
echo ======================================================================
pause > nul
start http://localhost:3000
