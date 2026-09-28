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

echo [1/4] Installing backend Python dependencies...
cd backend
"%PYTHON_EXE%" -m pip install -r requirements.txt
if errorlevel 1 goto fail

echo [2/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 goto fail

echo [3/4] Preparing configuration...
cd ..\backend
if not exist .env copy .env.example .env >nul

echo [4/4] Done.
echo.
echo You can now double-click start.bat.
pause
exit /b 0

:fail
echo.
echo Installation failed. Check the error above.
pause
exit /b 1
