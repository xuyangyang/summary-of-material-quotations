@echo off
cd /d %~dp0

set "PYTHON_EXE=python"
if exist "C:\Users\dis\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" set "PYTHON_EXE=C:\Users\dis\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PYTHON_EXE%" (
  set "PYTHON_EXE=python"
  where python >nul 2>nul
  if errorlevel 1 (
    for /f "tokens=*" %%i in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do set "PYTHON_EXE=%%i"
  )
)
if not exist "%PYTHON_EXE%" (
  echo [ERROR] Python was not found. Install Python 3.10+ and add it to PATH.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  set "PATH=%PATH%;C:\Program Files\nodejs;D:\Program Files\nodejs;C:\Users\%USERNAME%\AppData\Roaming\npm"
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js / npm was not found. Install Node.js and add it to PATH.
  pause
  exit /b 1
)

cd backend
if not exist .env copy .env.example .env >nul

"%PYTHON_EXE%" -c "import fastapi, uvicorn, sqlalchemy, pandas, openpyxl" >nul 2>nul
if errorlevel 1 (
  echo Backend dependencies are missing. Run install.bat first.
  pause
  exit /b 1
)

start "Material Backend" "%PYTHON_EXE%" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd ..\frontend
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    echo Frontend install failed. See the window above.
    pause
    exit /b 1
  )
)

start "Material Frontend" cmd /k "npm run dev -- --host 0.0.0.0"

set /a WAIT_COUNT=0
:wait_frontend
timeout /t 1 >nul
set /a WAIT_COUNT+=1
curl -s -o nul http://127.0.0.1:5173/ && goto open_browser
if %WAIT_COUNT% LSS 30 goto wait_frontend

:open_browser
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -notlike '127.*' | Where-Object IPAddress -notlike '169.254.*' | Select-Object -First 1 -ExpandProperty IPAddress)"') do set "LAN_IP=%%i"
echo.
echo Local: http://127.0.0.1:5173
if defined LAN_IP echo LAN:   http://%LAN_IP%:5173
start http://127.0.0.1:5173
