@echo off
title Check Meta API key
cd /d "%~dp0apps\server"
.venv\Scripts\python check_meta.py
pause
