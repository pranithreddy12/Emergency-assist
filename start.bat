@echo off
setlocal enabledelayedexpansion
title EmergencyAI - Launcher
cd /d "%~dp0"

echo ============================================================
echo   EmergencyAI - starting up
echo ============================================================
echo.

REM ---------------------------------------------------------------
REM 1. Prerequisites
REM ---------------------------------------------------------------
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found on PATH. Install Node 20+ from https://nodejs.org
  pause & exit /b 1
)
where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker not found on PATH. Install Docker Desktop.
  pause & exit /b 1
)

REM ---------------------------------------------------------------
REM 2. Docker engine (auto-start + wait)
REM ---------------------------------------------------------------
echo [1/6] Checking Docker engine...
docker ps >nul 2>&1
if not errorlevel 1 goto docker_ok

echo       Engine not responding - launching Docker Desktop...
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
  start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
)
set /a _tries=0
:wait_docker
timeout /t 5 /nobreak >nul
docker ps >nul 2>&1
if not errorlevel 1 goto docker_ok
set /a _tries+=1
if !_tries! lss 36 (
  echo       waiting for Docker engine... [!_tries!/36]
  goto wait_docker
)
echo.
echo [ERROR] Docker engine did not start.
echo.
echo   The privileged engine service is likely stopped. Fix with EITHER:
echo     a^) Right-click Docker Desktop  -^>  "Run as administrator"
echo     b^) Open PowerShell AS ADMINISTRATOR and run:
echo            Start-Service com.docker.service
echo.
echo   Then re-run this script.
pause & exit /b 1

:docker_ok
echo       Docker engine OK.

REM ---------------------------------------------------------------
REM 3. Database + cache
REM ---------------------------------------------------------------
echo [2/6] Starting PostgreSQL (:5440) and Redis (:56379)...
docker compose up -d
if errorlevel 1 (
  echo [ERROR] docker compose failed.
  pause & exit /b 1
)

echo       Waiting for PostgreSQL to become healthy...
set /a _pg=0
:wait_pg
docker exec emergencyai-postgres pg_isready -U emergencyai >nul 2>&1
if not errorlevel 1 goto pg_ok
timeout /t 2 /nobreak >nul
set /a _pg+=1
if !_pg! lss 30 goto wait_pg
echo [ERROR] PostgreSQL did not become ready in time.
pause & exit /b 1
:pg_ok
echo       PostgreSQL ready.

REM ---------------------------------------------------------------
REM 4. Backend setup
REM ---------------------------------------------------------------
echo [3/6] Preparing backend...
pushd apps\backend
if not exist ".env" (
  echo       Creating .env from .env.example
  copy /y ".env.example" ".env" >nul
)
if not exist "node_modules" (
  echo       Installing backend dependencies ^(first run, may take a few minutes^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 ( echo [ERROR] npm install failed. & popd & pause & exit /b 1 )
)

echo [4/6] Applying database migrations and seeding sample data...
call npx prisma generate >nul 2>&1
call npx prisma migrate deploy
if errorlevel 1 ( echo [ERROR] Migrations failed. & popd & pause & exit /b 1 )
call npm run seed
popd

REM ---------------------------------------------------------------
REM 5. Admin portal setup
REM ---------------------------------------------------------------
echo [5/6] Preparing admin portal...
pushd apps\admin
if not exist "node_modules" (
  echo       Installing admin dependencies ^(first run^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 ( echo [ERROR] npm install failed. & popd & pause & exit /b 1 )
)
popd

REM ---------------------------------------------------------------
REM 6. Launch servers (each in its own window)
REM ---------------------------------------------------------------
echo [6/6] Launching servers...
start "EmergencyAI API" cmd /k "cd /d "%~dp0apps\backend" && npm run start:dev"
timeout /t 8 /nobreak >nul
start "EmergencyAI Admin" cmd /k "cd /d "%~dp0apps\admin" && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ============================================================
echo   EmergencyAI is running
echo ============================================================
echo   API .......... http://localhost:3000/api/v1
echo   Swagger ...... http://localhost:3000/docs
echo   Admin portal . http://localhost:5173
echo   Health ....... http://localhost:3000/api/v1/health
echo.
echo   Two new windows were opened (API + Admin). Closing them stops
echo   the servers. Run stop.bat to also stop the containers.
echo.
echo   First time? Create an admin login:  create-admin.bat
echo ============================================================
echo.
start "" http://localhost:3000/docs
pause
