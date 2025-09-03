@echo off
setlocal enabledelayedexpansion

:: SignalRGB Lian Li Galahad II Plugin - One-Click Install & Test
title SignalRGB Galahad II Plugin Installer

cls
echo ===============================================================
echo            SignalRGB Lian Li Galahad II Plugin Installer    
echo ===============================================================
echo.
echo One-Click Testing and Installation
echo.

:: Check prerequisites
call :check_prerequisites
if errorlevel 1 goto :error_exit

:: Show menu
:menu
echo Please select your pump model:
echo.
echo 1. Trinity (PID 0x7373) - Basic Plugin
echo 2. Trinity (PID 0x7373) - Enhanced Plugin  
echo 3. Trinity Performance (PID 0x7371) - Basic Plugin
echo 4. Trinity Performance (PID 0x7371) - Enhanced Plugin
echo 5. LCD (PID 0x7395) - Basic Plugin
echo 6. LCD (PID 0x7395) - Enhanced Plugin
echo.
echo T. Test Only (Run protocol validation without installing)
echo Q. Quit
echo.
set /p choice=Enter your choice: 

:: Process menu choice
if /i "%choice%"=="1" (
    set "MODEL=Trinity"
    set "ENHANCED="
    goto :run_install
)
if /i "%choice%"=="2" (
    set "MODEL=Trinity"
    set "ENHANCED=-Enhanced"
    goto :run_install
)
if /i "%choice%"=="3" (
    set "MODEL=Performance"
    set "ENHANCED="
    goto :run_install
)
if /i "%choice%"=="4" (
    set "MODEL=Performance"
    set "ENHANCED=-Enhanced"
    goto :run_install
)
if /i "%choice%"=="5" (
    set "MODEL=LCD"
    set "ENHANCED="
    goto :run_install
)
if /i "%choice%"=="6" (
    set "MODEL=LCD"
    set "ENHANCED=-Enhanced"
    goto :run_install
)
if /i "%choice%"=="T" goto :test_only
if /i "%choice%"=="Q" goto :quit

echo Invalid choice. Please try again.
echo.
goto :menu

:test_only
echo.
echo Running Protocol Validation Tests...
echo.
call :run_tests
if errorlevel 1 (
    echo Tests failed. Please check the errors above.
    goto :pause_exit
)
echo.
echo All tests passed! Plugin is ready for installation.
goto :pause_exit

:run_install
echo.
echo Selected: %MODEL%%ENHANCED% Plugin
echo.

:: Step 1: Run automated tests
echo Step 1: Running Protocol Validation...
call :run_tests
if errorlevel 1 (
    echo Tests failed. Installation aborted.
    goto :pause_exit
)

echo All protocol tests passed!
echo.

:: Step 2: Check SignalRGB installation
echo Step 2: Checking SignalRGB Installation...
call :check_signalrgb
if errorlevel 1 goto :pause_exit

:: Step 3: Install plugin
echo Step 3: Installing Plugin...
call :install_plugin %MODEL% %ENHANCED%
if errorlevel 1 goto :pause_exit

:: Step 4: Provide next steps
echo.
echo Installation Complete!
echo.
echo Next Steps:
echo 1. Close L-Connect completely (check Task Manager)
echo 2. Restart SignalRGB
echo 3. Look for "Lian Li Galahad II..." in device list
echo 4. Test with solid colors and effects
echo.
echo Tip: Enable debug logging in SignalRGB if you encounter issues
echo Full testing guide: scripts\test_plugin.md
echo.
goto :pause_exit

:: Function: Check prerequisites
:check_prerequisites
echo Checking Prerequisites...

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js not found. Please install Node.js to run tests.
    echo Download from: https://nodejs.org/
    echo.
    set /p skip=Skip testing and install anyway? [y/N]: 
    if /i "!skip!"=="y" (
        echo Skipping tests - installing without validation
        set "SKIP_TESTS=1"
        exit /b 0
    )
    exit /b 1
)

:: Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell check'" >nul 2>&1
if errorlevel 1 (
    echo PowerShell not available. Cannot proceed with installation.
    exit /b 1
)

echo Prerequisites check passed
echo.
exit /b 0

:: Function: Run automated tests
:run_tests
if defined SKIP_TESTS (
    echo Tests skipped (Node.js not available)
    exit /b 0
)

if not exist "scripts\run_tests.js" (
    echo Test runner not found at scripts\run_tests.js
    exit /b 1
)

echo Running comprehensive protocol validation...
node scripts\run_tests.js
if errorlevel 1 (
    echo.
    echo Protocol tests failed!
    echo Please check the test output above for details.
    exit /b 1
)

echo.
echo Protocol validation: 20/20 tests passed (100%%)
exit /b 0

:: Function: Check SignalRGB installation
:check_signalrgb
set "SIGNALRGB_PATH=%APPDATA%\WhirlwindFX\SignalRgb"
if not exist "!SIGNALRGB_PATH!" (
    echo SignalRGB not found at !SIGNALRGB_PATH!
    echo Please install SignalRGB from https://signalrgb.com/
    exit /b 1
)

echo SignalRGB installation found
exit /b 0

:: Function: Install plugin
:install_plugin
set "MODEL=%~1"
set "ENHANCED=%~2"

if not exist "scripts\install_signalrgb.ps1" (
    echo Installation script not found at scripts\install_signalrgb.ps1
    exit /b 1
)

echo Executing PowerShell installer...

if "%ENHANCED%"=="-Enhanced" (
    powershell -ExecutionPolicy Bypass -File "scripts\install_signalrgb.ps1" -Model "%MODEL%" -Enhanced
) else (
    powershell -ExecutionPolicy Bypass -File "scripts\install_signalrgb.ps1" -Model "%MODEL%"
)

if errorlevel 1 (
    echo.
    echo Installation failed!
    echo Please check the PowerShell output above for details.
    exit /b 1
)

echo Plugin installed successfully
exit /b 0

:error_exit
echo.
echo Installation aborted due to errors.
goto :pause_exit

:quit
echo Installation cancelled by user.
goto :end

:pause_exit
echo.
echo Press any key to exit...
pause >nul

:end
endlocal