@echo off
setlocal
if not exist "D:\tools\jdk-21\bin\java.exe" (
  echo Missing D:\tools\jdk-21. Install or extract JDK 21 before building.
  exit /b 1
)
if not exist "D:\tools\maven\bin\mvn.cmd" (
  echo Missing D:\tools\maven. Install or extract Maven before building.
  exit /b 1
)
if not exist "D:\tools\nodejs\npm.cmd" (
  echo Missing D:\tools\nodejs. Install or extract Node.js before building.
  exit /b 1
)
set "JAVA_HOME=D:\tools\jdk-21"
set "PATH=D:\tools\jdk-21\bin;D:\tools\maven\bin;D:\tools\nodejs;D:\tools\mingit\cmd;%PATH%"
cd /d "%~dp0backend"
call mvn clean package || exit /b %ERRORLEVEL%
cd /d "%~dp0frontend"
call "D:\tools\nodejs\npm.cmd" install || exit /b %ERRORLEVEL%
call "D:\tools\nodejs\npm.cmd" run build || exit /b %ERRORLEVEL%
