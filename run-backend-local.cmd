@echo off
setlocal
if not exist "D:\tools\jdk-21\bin\java.exe" (
  echo Missing D:\tools\jdk-21. Install or extract JDK 21 before running the backend.
  exit /b 1
)
if not exist "D:\tools\maven\bin\mvn.cmd" (
  echo Missing D:\tools\maven. Install or extract Maven before running the backend.
  exit /b 1
)
set "JAVA_HOME=D:\tools\jdk-21"
set "PATH=D:\tools\jdk-21\bin;D:\tools\maven\bin;D:\tools\mingit\cmd;%PATH%"
set "EXCLUDES=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration,org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration"
cd /d "%~dp0backend"
if not exist "target\adaptive-ai-orchestrator-0.0.1-SNAPSHOT.jar" (
  call mvn package || exit /b %ERRORLEVEL%
)
"D:\tools\jdk-21\bin\java.exe" -jar target\adaptive-ai-orchestrator-0.0.1-SNAPSHOT.jar --spring.autoconfigure.exclude=%EXCLUDES%
