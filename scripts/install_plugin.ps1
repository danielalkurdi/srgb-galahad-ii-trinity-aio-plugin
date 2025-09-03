# SignalRGB Plugin Installation Script for Lian Li Galahad II
# Automates plugin installation and configuration

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Trinity", "Performance", "LCD")]
    [string]$Model = "Trinity",
    
    [Parameter(Mandatory=$false)]
    [ValidateRange(16, 64)]
    [int]$LedCount = 24,
    
    [Parameter(Mandatory=$false)]
    [switch]$Enhanced = $false
)

Write-Host "=== Lian Li Galahad II SignalRGB Plugin Installer ===" -ForegroundColor Cyan

# Configuration based on model
$ModelConfigs = @{
    "Trinity" = @{ PID = "0x7373"; Interface = 0 }
    "Performance" = @{ PID = "0x7371"; Interface = 0 }
    "LCD" = @{ PID = "0x7395"; Interface = 1 }
}

$config = $ModelConfigs[$Model]
Write-Host "Installing plugin for $Model model (PID: $($config.PID))" -ForegroundColor Yellow

# Check if SignalRGB is installed
$signalRgbPath = "$env:APPDATA\WhirlwindFX\SignalRgb"
if (-not (Test-Path $signalRgbPath)) {
    Write-Host "ERROR: SignalRGB not found at $signalRgbPath" -ForegroundColor Red
    Write-Host "Please install SignalRGB first." -ForegroundColor Red
    exit 1
}

# Create plugin directory
$pluginDir = "$signalRgbPath\Devices\Community\LianLi_GAII_Pump"
Write-Host "Creating plugin directory: $pluginDir"

if (Test-Path $pluginDir) {
    Write-Host "Plugin directory already exists. Backing up..." -ForegroundColor Yellow
    $backupDir = "$pluginDir.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Move-Item $pluginDir $backupDir
    Write-Host "Backup created: $backupDir" -ForegroundColor Green
}

New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null

# Determine which plugin file to use
$sourceFile = if ($Enhanced) { "device_enhanced.js" } else { "device.js" }
$sourcePath = Join-Path (Split-Path $PSScriptRoot -Parent) "plugin\$sourceFile"

if (-not (Test-Path $sourcePath)) {
    Write-Host "ERROR: Plugin source file not found: $sourcePath" -ForegroundColor Red
    exit 1
}

# Copy and configure plugin
$targetPath = "$pluginDir\device.js"
Write-Host "Copying plugin file: $sourceFile -> device.js"

# Read and modify the plugin file for the specific model
$pluginContent = Get-Content $sourcePath -Raw

# Update ProductId for the selected model
$pluginContent = $pluginContent -replace 'export function ProductId\(\) \{ return 0x7373; \}', "export function ProductId() { return $($config.PID); }"

# Update default LED count if specified
if ($LedCount -ne 24) {
    $pluginContent = $pluginContent -replace 'let LED_COUNT = 24;', "let LED_COUNT = $LedCount;"
}

# Save the configured plugin
Set-Content -Path $targetPath -Value $pluginContent -Encoding UTF8

Write-Host "Plugin installed successfully!" -ForegroundColor Green

# Verify installation
Write-Host "`n=== Installation Verification ===" -ForegroundColor Cyan

$installedSize = (Get-Item $targetPath).Length
Write-Host "Plugin file size: $installedSize bytes"

# Check for JavaScript syntax (basic check)
$syntaxErrors = $pluginContent | Select-String -Pattern '(function \w+\(\)\s*\{)|(export\s+function)' | Measure-Object
Write-Host "Export functions found: $($syntaxErrors.Count)"

if ($syntaxErrors.Count -lt 5) {
    Write-Host "WARNING: Plugin may be incomplete (too few export functions)" -ForegroundColor Yellow
}

# Check SignalRGB is not currently running
$signalRgbProcess = Get-Process -Name "*SignalRgb*" -ErrorAction SilentlyContinue
if ($signalRgbProcess) {
    Write-Host "`nWARNING: SignalRGB is currently running" -ForegroundColor Yellow
    Write-Host "Please restart SignalRGB to load the new plugin" -ForegroundColor Yellow
    
    $restart = Read-Host "Would you like to restart SignalRGB now? (y/N)"
    if ($restart -eq 'y' -or $restart -eq 'Y') {
        Write-Host "Stopping SignalRGB..."
        $signalRgbProcess | Stop-Process -Force
        Start-Sleep -Seconds 3
        
        Write-Host "Starting SignalRGB..."
        Start-Process -FilePath "$env:APPDATA\WhirlwindFX\SignalRgb\SignalRgb.exe" -ErrorAction SilentlyContinue
    }
}

# Check for L-Connect conflicts
$lconnectProcess = Get-Process -Name "*L-Connect*" -ErrorAction SilentlyContinue  
if ($lconnectProcess) {
    Write-Host "`nWARNING: L-Connect is running and may conflict with SignalRGB" -ForegroundColor Yellow
    Write-Host "Consider closing L-Connect before using SignalRGB plugin" -ForegroundColor Yellow
    
    $closeLConnect = Read-Host "Close L-Connect now? (y/N)"
    if ($closeLConnect -eq 'y' -or $closeLConnect -eq 'Y') {
        $lconnectProcess | Stop-Process -Force
        Write-Host "L-Connect closed" -ForegroundColor Green
    }
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Start SignalRGB (if not already running)"
Write-Host "2. Look for 'Lian Li Galahad II Trinity/LCD AIO Pump' in device list"
Write-Host "3. Apply a solid color effect to test functionality"
Write-Host "4. If issues occur, check the troubleshooting guide"

# Display configuration summary
Write-Host "`n=== Plugin Configuration ===" -ForegroundColor Magenta
Write-Host "Model: $Model"
Write-Host "Product ID: $($config.PID)"
Write-Host "Interface: $($config.Interface)"
Write-Host "LED Count: $LedCount"
Write-Host "Enhanced Features: $Enhanced"
Write-Host "Installation Path: $targetPath"

Write-Host "`n=== Device Detection ===" -ForegroundColor Green
Write-Host "Run this command to verify your pump is detected:"
Write-Host "Get-PnpDevice -PresentOnly | Where-Object { `$_.InstanceId -match 'VID_0416&PID_$($config.PID.Substring(2))' }" -ForegroundColor Gray

Write-Host "`nInstallation complete!" -ForegroundColor Green