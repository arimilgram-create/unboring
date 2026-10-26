@echo off
title UnBoring setup
cd /d "%~dp0"
echo.
echo === UnBoring setup (run once) ===
echo Installing Python, Node and ffmpeg. Click Yes on any pop-ups. This can take a few minutes.
echo.
winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements

rem New installs aren't on this window's PATH yet, so add their usual folders by hand.
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%ProgramFiles%\Python312;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"

set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not exist "%PY%" set "PY=%ProgramFiles%\Python312\python.exe"
if not exist "%PY%" set "PY=python"

echo.
echo === Setting up the server ===
cd apps\server
if not exist .venv\Scripts\python.exe "%PY%" -m venv .venv
if not exist .venv\Scripts\python.exe (
  echo Could not create the Python environment. Close this window, open a new one, and run setup.bat again.
  pause
  exit /b 1
)
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements.txt
if not exist .env copy .env.example .env >nul

echo.
echo === Setting up the website ===
cd ..\web
call npm install

cd ..\..
echo.
echo Done! Now double-click start.bat to run UnBoring.
pause
