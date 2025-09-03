# SignalRGB Plugin Installation Script for Lian Li Galahad II
# Installs plugins in proper SignalRGB Community folder structure

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Trinity", "Performance", "LCD")]
    [string]$Model = "Trinity",
    
    [Parameter(Mandatory=$false)]
    [ValidateRange(16, 64)]
    [int]$LedCount = 24,
    
    [Parameter(Mandatory=$false)]
    [switch]$Enhanced = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

Write-Host "=== SignalRGB Plugin Installer for Lian Li Galahad II ===" -ForegroundColor Cyan
Write-Host "Installing SignalRGB-compliant plugin structure" -ForegroundColor Yellow

# Configuration based on model
$ModelConfigs = @{
    "Trinity" = @{ PID = "0x7373"; Interface = 0 }
    "Performance" = @{ PID = "0x7371"; Interface = 0 }
    "LCD" = @{ PID = "0x7395"; Interface = 1 }
}

$config = $ModelConfigs[$Model]
Write-Host "Installing plugin for $Model model (PID: $($config.PID))" -ForegroundColor Yellow

# Verify SignalRGB installation
$signalRgbPath = "$env:APPDATA\WhirlwindFX\SignalRgb"
if (-not (Test-Path $signalRgbPath)) {
    Write-Host "ERROR: SignalRGB not found at $signalRgbPath" -ForegroundColor Red
    Write-Host "Please install SignalRGB from https://signalrgb.com/" -ForegroundColor Red
    exit 1
}

# Create Community plugins directory if it doesn't exist
$communityPath = "$signalRgbPath\Devices\Community"
if (-not (Test-Path $communityPath)) {
    Write-Host "Creating Community plugins directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $communityPath -Force | Out-Null
}

# Determine plugin source and target
$pluginVariant = if ($Enhanced) { "Enhanced" } else { "Basic" }
$sourceFolder = if ($Enhanced) { "LianLi_GalahadII_Trinity_Enhanced" } else { "LianLi_GalahadII_Trinity" }
$targetFolder = "$communityPath\$sourceFolder"

Write-Host "Installing $pluginVariant plugin variant" -ForegroundColor Green

# Check if plugin already exists
if (Test-Path $targetFolder) {
    if ($Force) {
        Write-Host "Force flag specified, removing existing plugin..." -ForegroundColor Yellow
        Remove-Item $targetFolder -Recurse -Force
    } else {
        Write-Host "Plugin already exists at $targetFolder" -ForegroundColor Yellow
        $overwrite = Read-Host "Overwrite existing plugin? (y/N)"
        if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
            Write-Host "Installation cancelled" -ForegroundColor Yellow
            exit 0
        }
        Remove-Item $targetFolder -Recurse -Force
    }
}

# Copy plugin files
$scriptDir = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $scriptDir "signalrgb-plugin\$sourceFolder"

if (-not (Test-Path $sourcePath)) {
    Write-Host "ERROR: Plugin source not found: $sourcePath" -ForegroundColor Red
    exit 1
}

Write-Host "Copying plugin files from $sourcePath to $targetFolder" -ForegroundColor Green
Copy-Item -Path $sourcePath -Destination $targetFolder -Recurse -Force

# Configure plugin for specific model
$deviceJsPath = "$targetFolder\device.js"
if (Test-Path $deviceJsPath) {
    Write-Host "Configuring plugin for $Model model..." -ForegroundColor Green
    
    # Read plugin content
    $pluginContent = Get-Content $deviceJsPath -Raw
    
    # Update ProductId for the selected model
    $pluginContent = $pluginContent -replace 'export function ProductId\(\) \{ return 0x7373; \}', "export function ProductId() { return $($config.PID); }"
    
    # Update LED count if specified
    if ($LedCount -ne 24) {
        $pluginContent = $pluginContent -replace 'let LED_COUNT = 24;', "let LED_COUNT = $LedCount;"
    }
    
    # Save updated plugin
    Set-Content -Path $deviceJsPath -Value $pluginContent -Encoding UTF8
    Write-Host "Plugin configured for $Model with $LedCount LEDs" -ForegroundColor Green
} else {
    Write-Host "WARNING: device.js not found, manual configuration may be needed" -ForegroundColor Yellow
}

# Verify installation
Write-Host "`n=== Installation Verification ===" -ForegroundColor Cyan

$installedFiles = Get-ChildItem $targetFolder -Recurse
Write-Host "Installed files:" -ForegroundColor White
$installedFiles | ForEach-Object { 
    $relativePath = $_.FullName.Replace($targetFolder, "")
    Write-Host "  $relativePath" -ForegroundColor Gray
}

# Check SignalRGB process
$signalRgbProcess = Get-Process -Name "*SignalRgb*" -ErrorAction SilentlyContinue
if ($signalRgbProcess) {
    Write-Host "`nWARNING: SignalRGB is currently running" -ForegroundColor Yellow
    Write-Host "Please restart SignalRGB to load the new plugin" -ForegroundColor Yellow
    
    $restart = Read-Host "Restart SignalRGB now? (y/N)"
    if ($restart -eq 'y' -or $restart -eq 'Y') {
        Write-Host "Stopping SignalRGB..." -ForegroundColor Yellow
        $signalRgbProcess | Stop-Process -Force
        Start-Sleep -Seconds 3
        
        # Look for SignalRGB executable
        $signalRgbExe = @(
            "$env:APPDATA\WhirlwindFX\SignalRgb\SignalRgb.exe",
            "$env:ProgramFiles\WhirlwindFX\SignalRGB\SignalRGB.exe",
            "$env:ProgramFiles(x86)\WhirlwindFX\SignalRGB\SignalRGB.exe"
        ) | Where-Object { Test-Path $_ } | Select-Object -First 1
        
        if ($signalRgbExe) {
            Write-Host "Starting SignalRGB..." -ForegroundColor Green
            Start-Process -FilePath $signalRgbExe -ErrorAction SilentlyContinue
        } else {
            Write-Host "Could not find SignalRGB executable, please start manually" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`nSignalRGB is not currently running" -ForegroundColor Green
    Write-Host "Start SignalRGB to test the plugin" -ForegroundColor Green
}

# Check for L-Connect conflicts
$lconnectProcess = Get-Process -Name "*L-Connect*" -ErrorAction SilentlyContinue  
if ($lconnectProcess) {
    Write-Host "`nWARNING: L-Connect is running" -ForegroundColor Yellow
    Write-Host "L-Connect may conflict with SignalRGB plugin" -ForegroundColor Yellow
    
    $closeLConnect = Read-Host "Close L-Connect now? (y/N)"
    if ($closeLConnect -eq 'y' -or $closeLConnect -eq 'Y') {
        $lconnectProcess | Stop-Process -Force
        Write-Host "L-Connect closed" -ForegroundColor Green
    }
}

Write-Host "`n=== SignalRGB Plugin Installation Complete ===" -ForegroundColor Green

# Installation summary
Write-Host "`n=== Installation Summary ===" -ForegroundColor Cyan
Write-Host "Plugin Type: $pluginVariant" -ForegroundColor White
Write-Host "Model: $Model (PID: $($config.PID))" -ForegroundColor White
Write-Host "LED Count: $LedCount" -ForegroundColor White
Write-Host "Install Path: $targetFolder" -ForegroundColor White
Write-Host "Files Installed: $($installedFiles.Count)" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Magenta
Write-Host "1. Start SignalRGB (if not already running)" -ForegroundColor White
Write-Host "2. Look for 'Lian Li Galahad II...' in the device list" -ForegroundColor White
Write-Host "3. Apply effects to test functionality" -ForegroundColor White
Write-Host "4. Adjust plugin settings if needed" -ForegroundColor White

if ($Enhanced) {
    Write-Host "`n=== Enhanced Plugin Features ===" -ForegroundColor Magenta
    Write-Host "• Independent ring control" -ForegroundColor Gray
    Write-Host "• Per-LED addressing" -ForegroundColor Gray
    Write-Host "• Protocol auto-detection" -ForegroundColor Gray
    Write-Host "• Advanced error recovery" -ForegroundColor Gray
}

Write-Host "`nInstallation successful! 🎉" -ForegroundColor Green