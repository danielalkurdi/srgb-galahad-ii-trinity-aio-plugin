# Lian Li Galahad II Device Enumeration Script
# Finds USB/HID devices with known VID/PID combinations for the pump

Write-Host "=== Lian Li Galahad II Device Enumeration ===" -ForegroundColor Cyan
Write-Host ""

# Known VIDs for Lian Li devices
$targetVids = @('VID_0416', 'VID_0CF2')  # Nuvoton/Winbond, ENE
Write-Host "Scanning for VIDs: $($targetVids -join ', ')" -ForegroundColor Yellow

# Known PIDs for Galahad II variants
$knownPids = @{
    '7373' = 'Trinity'
    '7371' = 'Trinity Performance'  
    '7395' = 'LCD'
}

Write-Host ""
Write-Host "=== All Present USB Devices with Target VIDs ===" -ForegroundColor Green

$foundDevices = Get-PnpDevice -PresentOnly | 
    Where-Object { 
        $deviceId = $_.InstanceId
        $targetVids | ForEach-Object { 
            if ($deviceId -match $_) { 
                return $true 
            }
        }
        return $false
    }

if ($foundDevices) {
    $foundDevices | Format-Table -AutoSize -Property FriendlyName, InstanceId, Status
} else {
    Write-Host "No devices found with target VIDs" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== HID Interfaces for Target Devices ===" -ForegroundColor Green

$hidDevices = Get-PnpDevice -PresentOnly |
    Where-Object { $_.InstanceId -match '^HID\\VID_(0416|0CF2)' }

if ($hidDevices) {
    $hidDevices | Format-Table -AutoSize -Property FriendlyName, InstanceId, Status
    
    Write-Host ""
    Write-Host "=== Device Analysis ===" -ForegroundColor Magenta
    
    foreach ($device in $hidDevices) {
        $instanceId = $device.InstanceId
        
        # Extract VID/PID
        if ($instanceId -match 'VID_([0-9A-F]{4})&PID_([0-9A-F]{4})') {
            $vid = $matches[1]
            $pid = $matches[2]
            
            $modelName = "Unknown"
            if ($knownPids.ContainsKey($pid)) {
                $modelName = $knownPids[$pid]
            }
            
            Write-Host "Device: $($device.FriendlyName)" -ForegroundColor White
            Write-Host "  VID: 0x$vid ($(if($vid -eq '0416'){'Nuvoton/Winbond'}elseif($vid -eq '0CF2'){'ENE'}else{'Unknown'}))"
            Write-Host "  PID: 0x$pid ($modelName)"
            Write-Host "  Instance: $instanceId"
            
            # Extract interface if present  
            if ($instanceId -match 'MI_([0-9]{2})') {
                $interface = [int]"0x$($matches[1])"
                Write-Host "  Interface: $interface"
            }
            
            Write-Host ""
        }
    }
} else {
    Write-Host "No HID devices found with target VIDs" -ForegroundColor Red
}

Write-Host "=== Additional System Information ===" -ForegroundColor Cyan
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)"
Write-Host "Execution Time: $(Get-Date)"

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Note the VID/PID of your pump model from the output above"
Write-Host "2. If using LCD model, note the interface number (typically 1)"  
Write-Host "3. Proceed to Phase 2: USB packet capture with USBPcap + Wireshark"
Write-Host "4. Use the VID/PID values in the SignalRGB plugin configuration"