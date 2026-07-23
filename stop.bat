@echo off
setlocal
title EmergencyAI - Stop
cd /d "%~dp0"

echo Stopping EmergencyAI...
echo.

echo [1/2] Stopping API (port 3000) and Admin (port 5173)...
for %%P in (3000 5173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    echo       killing PID %%A on port %%P
    taskkill /PID %%A /F >nul 2>&1
  )
)

echo [2/2] Stopping containers...
docker compose down

echo.
echo Stopped. (Database data is preserved in the Docker volume.)
echo To wipe the database too:  docker compose down -v
pause
