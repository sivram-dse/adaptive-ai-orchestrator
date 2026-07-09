@echo off
setlocal
if not exist "D:\tools\nodejs\npm.cmd" (
  echo Missing D:\tools\nodejs. Install or extract Node.js before running the frontend.
  exit /b 1
)
set "PATH=D:\tools\nodejs;D:\tools\mingit\cmd;%PATH%"
cd /d "%~dp0frontend"
if not exist "node_modules" (
  call "D:\tools\nodejs\npm.cmd" install || exit /b %ERRORLEVEL%
)
"D:\tools\nodejs\npm.cmd" run dev -- --host 127.0.0.1
