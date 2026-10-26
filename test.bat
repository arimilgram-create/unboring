@echo off
title UnBoring tests
cd /d "%~dp0"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"
cd apps\server && .venv\Scripts\python -m pytest -q
cd ..\web && call npx vitest run
pause
