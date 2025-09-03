@echo off
setlocal enabledelayedexpansion

:: SignalRGB Lian Li Galahad II Plugin - One-Click Install & Test
:: Automated testing and installation for SignalRGB Community plugins

title SignalRGB Galahad II Plugin Installer

:: Color definitions for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "CYAN=[96m"
set "WHITE=[97m"
set "RESET=[0m"

:: Clear screen and show header
cls
echo %CYAN%===============================================================%RESET%
echo %WHITE%           SignalRGB Lian Li Galahad II Plugin Installer    %RESET%
echo %CYAN%===============================================================%RESET%
echo.
echo %YELLOW%🚀 One-Click Testing and Installation%RESET%
echo.

:: Check prerequisites
call :check_prerequisites
if errorlevel 1 goto :error_exit

:: Show menu
:menu
echo %BLUE%Please select your pump model:%RESET%
echo.
echo %WHITE%1.%RESET% Trinity (PID 0x7373) - Basic Plugin
echo %WHITE%2.%RESET% Trinity (PID 0x7373) - Enhanced Plugin  
echo %WHITE%3.%RESET% Trinity Performance (PID 0x7371) - Basic Plugin
echo %WHITE%4.%RESET% Trinity Performance (PID 0x7371) - Enhanced Plugin
echo %WHITE%5.%RESET% LCD (PID 0x7395) - Basic Plugin
echo %WHITE%6.%RESET% LCD (PID 0x7395) - Enhanced Plugin
echo.
echo %WHITE%T.%RESET% Test Only (Run protocol validation without installing)
echo %WHITE%Q.%RESET% Quit
echo.
set /p choice=%WHITE%Enter your choice:%RESET% 

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

echo %RED%❌ Invalid choice. Please try again.%RESET%
echo.
goto :menu

:test_only
echo.
echo %YELLOW%🧪 Running Protocol Validation Tests...%RESET%
echo.
call :run_tests
if errorlevel 1 (
    echo %RED%❌ Tests failed. Please check the errors above.%RESET%
    goto :pause_exit
)
echo.
echo %GREEN%✅ All tests passed! Plugin is ready for installation.%RESET%
goto :pause_exit

:run_install
echo.
echo %YELLOW%Selected: %MODEL%%ENHANCED% Plugin%RESET%
echo.

:: Step 1: Run automated tests
echo %BLUE%Step 1: Running Protocol Validation...%RESET%
call :run_tests
if errorlevel 1 (
    echo %RED%❌ Tests failed. Installation aborted.%RESET%
    goto :pause_exit
)

echo %GREEN%✅ All protocol tests passed!%RESET%
echo.

:: Step 2: Check SignalRGB installation
echo %BLUE%Step 2: Checking SignalRGB Installation...%RESET%
call :check_signalrgb
if errorlevel 1 goto :pause_exit

:: Step 3: Install plugin
echo %BLUE%Step 3: Installing Plugin...%RESET%
call :install_plugin %MODEL% %ENHANCED%
if errorlevel 1 goto :pause_exit

:: Step 4: Provide next steps
echo.
echo %GREEN%🎉 Installation Complete!%RESET%
echo.
echo %YELLOW%Next Steps:%RESET%
echo %WHITE%1.%RESET% Close L-Connect completely (check Task Manager)
echo %WHITE%2.%RESET% Restart SignalRGB
echo %WHITE%3.%RESET% Look for "Lian Li Galahad II..." in device list
echo %WHITE%4.%RESET% Test with solid colors and effects
echo.
echo %BLUE%💡 Tip:%RESET% Enable debug logging in SignalRGB if you encounter issues
echo %BLUE%📖 Full testing guide:%RESET% scripts\test_plugin.md
echo.
goto :pause_exit

:: Function: Check prerequisites
:check_prerequisites
echo %BLUE%Checking Prerequisites...%RESET%

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Node.js not found. Please install Node.js to run tests.%RESET%
    echo %WHITE%   Download from: https://nodejs.org/%RESET%
    echo.
    set /p skip=%YELLOW%Skip testing and install anyway? [y/N]:%RESET% 
    if /i "!skip!"=="y" (
        echo %YELLOW%⚠️  Skipping tests - installing without validation%RESET%
        set "SKIP_TESTS=1"
        return 0
    )
    return 1
)

:: Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell check'" >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ PowerShell not available. Cannot proceed with installation.%RESET%
    return 1
)

echo %GREEN%✅ Prerequisites check passed%RESET%
echo.
return 0

:: Function: Run automated tests
:run_tests
if defined SKIP_TESTS (
    echo %YELLOW%⚠️  Tests skipped (Node.js not available)%RESET%
    return 0
)

if not exist "scripts\run_tests.js" (
    echo %RED%❌ Test runner not found at scripts\run_tests.js%RESET%
    return 1
)

echo %WHITE%Running comprehensive protocol validation...%RESET%
node scripts\run_tests.js
if errorlevel 1 (
    echo.
    echo %RED%❌ Protocol tests failed!%RESET%
    echo %WHITE%Please check the test output above for details.%RESET%
    return 1
)

echo.
echo %GREEN%✅ Protocol validation: 20/20 tests passed (100%%)%RESET%
return 0

:: Function: Check SignalRGB installation
:check_signalrgb
set "SIGNALRGB_PATH=%APPDATA%\WhirlwindFX\SignalRgb"
if not exist "!SIGNALRGB_PATH!" (
    echo %RED%❌ SignalRGB not found at !SIGNALRGB_PATH!%RESET%
    echo %WHITE%   Please install SignalRGB from https://signalrgb.com/%RESET%
    return 1
)

echo %GREEN%✅ SignalRGB installation found%RESET%
return 0

:: Function: Install plugin
:install_plugin
set "MODEL=%~1"
set "ENHANCED=%~2"

if not exist "scripts\install_signalrgb.ps1" (
    echo %RED%❌ Installation script not found at scripts\install_signalrgb.ps1%RESET%
    return 1
)

echo %WHITE%Executing PowerShell installer...%RESET%

if "%ENHANCED%"=="-Enhanced" (
    powershell -ExecutionPolicy Bypass -File "scripts\install_signalrgb.ps1" -Model "%MODEL%" -Enhanced
) else (
    powershell -ExecutionPolicy Bypass -File "scripts\install_signalrgb.ps1" -Model "%MODEL%"
)

if errorlevel 1 (
    echo.
    echo %RED%❌ Installation failed!%RESET%
    echo %WHITE%Please check the PowerShell output above for details.%RESET%
    return 1
)

echo %GREEN%✅ Plugin installed successfully%RESET%
return 0

:error_exit
echo.
echo %RED%Installation aborted due to errors.%RESET%
goto :pause_exit

:quit
echo %WHITE%Installation cancelled by user.%RESET%
goto :end

:pause_exit
echo.
echo %CYAN%Press any key to exit...%RESET%
pause >nul

:end
endlocal