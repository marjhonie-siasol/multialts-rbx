@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0multialts.ps1" start
    echo.
    echo [OK] MultiAlts Engine is running in the background.
    echo You can now use the Chrome extension.
    echo.
    pause
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0multialts.ps1" %*
)
endlocal
