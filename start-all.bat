@echo off
cd /d "%~dp0"
echo Starting Rupee Mind with the required ML service.
echo Ensure MongoDB is running and rupeemind-ml\.venv is installed.
call npm run dev
