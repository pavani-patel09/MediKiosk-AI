@echo off
title MediKiosk AI Launcher
echo ========================================================
echo           Launching MediKiosk AI Platform
echo ========================================================
echo.

echo [1/3] Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "MediKiosk AI - Backend" cmd /k "cd /d "%~dp0backend" && python run_backend.py"

echo [2/3] Starting Frontend (Vite on http://localhost:5173)...
start "MediKiosk AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening MediKiosk AI in default web browser...
start http://localhost:5173

echo.
echo ========================================================
echo MediKiosk AI is now running!
echo - Web App:        http://localhost:5173
echo - API Base URL:   http://127.0.0.1:8000/api
echo - Swagger Docs:   http://127.0.0.1:8000/docs
echo ========================================================
echo.
echo Leave this window or the minimized server windows open while using the app.
pause
