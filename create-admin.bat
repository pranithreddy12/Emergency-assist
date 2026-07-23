@echo off
setlocal
title EmergencyAI - Create Admin User
cd /d "%~dp0"

echo ============================================================
echo   Create an ADMIN user for the admin portal
echo ============================================================
echo.
echo The API must be running (start.bat) before you do this.
echo.

set /p EMAIL=Email    :
set /p PASSWORD=Password (min 8, must contain a letter and a number):

if "%EMAIL%"=="" ( echo Email is required. & pause & exit /b 1 )
if "%PASSWORD%"=="" ( echo Password is required. & pause & exit /b 1 )

echo.
echo [1/2] Registering %EMAIL% ...
curl -s -X POST http://localhost:3000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\",\"displayName\":\"Admin\"}" >nul 2>&1

echo [2/2] Promoting to ADMIN ...
pushd apps\backend
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.update({where:{email:process.argv[1]},data:{role:'ADMIN'}}).then(u=>{console.log('   OK - '+u.email+' is now ADMIN');process.exit(0)}).catch(e=>{console.error('   FAILED: '+e.message);process.exit(1)})" "%EMAIL%"
popd

echo.
echo Now sign in at http://localhost:5173 with those credentials.
pause
