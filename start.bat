@echo off
title AI VOICE INDIA — Startup Script
echo ========================================================
echo   AI VOICE INDIA — Natural AI voices, made for India
echo   Zero-Cost Development Mode (100%% Free, No Cards/UPI)
echo ========================================================
echo.

echo Starting FastAPI Backend on http://localhost:8000 ...
start "AI Voice India - Backend" cmd /k "backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
cd frontend
start "AI Voice India - Frontend" cmd /k "npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000/docs
echo.
pause
