@echo off
title UnBoring
cd /d "%~dp0"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"
if not exist apps\server\.venv\Scripts\python.exe (
  echo Run setup.bat first.
  pause
  exit /b 1
)
start "UnBoring server (keep open)" cmd /k "cd apps\server && .venv\Scripts\python -m uvicorn main:app --port 8000"
start "UnBoring website (keep open)" cmd /k "cd apps\web && npm run dev"
echo Starting... your browser will open in a few seconds.
timeout /t 6 >nul
start http://localhost:5173
