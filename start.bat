@echo off
echo.
echo  Starting Byters Lead Finder...
echo.

start "Byters Backend" cmd /k "cd /d D:\byterswinnnn-main\engine && node --env-file=../.env server.js"
timeout /t 3 /nobreak >nul
start "Byters Frontend" cmd /k "cd /d D:\byterswinnnn-main && npx vite --host"

echo.
echo  Backend  → http://localhost:3000
echo  Frontend → http://localhost:5173
echo.
echo  Close the two windows to stop.
echo.
