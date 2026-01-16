@echo off
echo ========================================
echo   Restarting Add-in (Quick Test)
echo ========================================
echo.

echo [1/3] Closing Excel...
taskkill /F /IM EXCEL.EXE 2>nul

echo [2/3] Clearing cache...
rd /s /q "%LOCALAPPDATA%\Microsoft\Office\16.0\Wef" 2>nul

echo [3/3] Restarting Excel...
timeout /t 2 /nobreak >nul
start excel.exe

echo.
echo ✅ Done! Click ANCOVA button to test.
echo.
pause
