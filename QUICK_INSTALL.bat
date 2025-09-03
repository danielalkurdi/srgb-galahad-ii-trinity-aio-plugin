@echo off
:: Quick Install - SignalRGB Lian Li Galahad II Plugin
title Quick Install - SignalRGB Galahad II Plugin

echo.
echo SignalRGB Galahad II Plugin - QUICK INSTALL
echo ============================================
echo.
echo This will:
echo  - Run automated tests (20 protocol validations)
echo  - Install Enhanced Trinity plugin (most common)
echo  - Set up SignalRGB Community plugin structure
echo.

set /p confirm=Continue? [Y/n]: 
if /i "%confirm%"=="n" goto :end

echo.
echo Running tests...
node scripts\run_tests.js
if errorlevel 1 (
    echo Tests failed! Check errors above.
    pause
    goto :end
)

echo Tests passed!
echo.
echo Installing Enhanced Trinity plugin...
powershell -ExecutionPolicy Bypass -File "scripts\install_signalrgb.ps1" -Model Trinity -Enhanced

if errorlevel 1 (
    echo Installation failed!
    pause
    goto :end
)

echo.
echo SUCCESS! Plugin installed.
echo.
echo Next steps:
echo 1. Close L-Connect
echo 2. Restart SignalRGB  
echo 3. Look for "Lian Li Galahad II..." in device list
echo.
echo For other models or troubleshooting, run: INSTALL.bat
echo.
pause

:end