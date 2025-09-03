# Phase 4: SignalRGB Plugin Testing Guide

This guide covers installing, testing, and debugging the Lian Li Galahad II plugin.

## Prerequisites

- [ ] Completed Phase 1: Device enumeration (know your VID/PID)
- [ ] Completed Phase 2: USB capture analysis (have protocol details)  
- [ ] SignalRGB installed and running
- [ ] L-Connect closed (to avoid device conflicts)

## Installation Steps

### 1. Create Plugin Directory

Create the Community plugin folder:
```
%APPDATA%\WhirlwindFX\SignalRgb\Devices\Community\LianLi_GAII_Pump\
```

**PowerShell command:**
```powershell
$pluginPath = "$env:APPDATA\WhirlwindFX\SignalRgb\Devices\Community\LianLi_GAII_Pump"
New-Item -ItemType Directory -Path $pluginPath -Force
```

### 2. Install Plugin File

Copy `device.js` to the plugin directory:
```
%APPDATA%\WhirlwindFX\SignalRgb\Devices\Community\LianLi_GAII_Pump\device.js
```

### 3. Configure for Your Model

Edit `device.js` and update the `ProductId()` function for your pump:

```javascript
// For Trinity (default)
export function ProductId() { return 0x7373; }

// For Trinity Performance  
export function ProductId() { return 0x7371; }

// For LCD model
export function ProductId() { return 0x7395; }
```

## Testing Procedure

### Step 1: Basic Detection Test

1. **Close L-Connect completely** (check Task Manager)
2. **Restart SignalRGB** (or use "Scan for devices")
3. **Check the device list** for "Lian Li Galahad II Trinity/LCD AIO Pump"

**Expected Results:**
- ✅ Device appears in SignalRGB device list
- ✅ No error messages in SignalRGB logs
- ✅ Device shows as "Connected"

### Step 2: Static Color Test

1. **Apply a Solid effect** (Red, Green, Blue)
2. **Observe the pump RGB**
3. **Try different brightness levels**

**Expected Results:**
- ✅ Pump LEDs change to the selected color
- ✅ Brightness control works
- ✅ Color changes are immediate (no delay)

### Step 3: Dynamic Effect Test

1. **Apply Rainbow effect** or similar animated effect
2. **Verify 30 FPS smooth animation**
3. **Test different effect speeds**

**Expected Results:**
- ✅ Smooth color transitions
- ✅ No flickering or stuttering
- ✅ Effect speed controls work

## Troubleshooting

### Device Not Detected

**Check Device Manager:**
```powershell
# Verify pump is connected and recognized
Get-PnpDevice -FriendlyName "*Lian Li*" -PresentOnly
```

**Common Issues:**
- Wrong VID/PID in plugin file
- L-Connect still running (blocks device access)
- USB connection issue (try different port)
- Wrong interface selected in `Validate()` function

**Fix Steps:**
1. Verify VID/PID from Phase 1 enumeration
2. Kill all L-Connect processes: `taskkill /f /im "L-Connect*"`
3. Check SignalRGB logs for device errors

### Device Detected But No Color Change  

**Common Issues:**
- Protocol not implemented correctly
- Wrong packet structure or size
- Missing initialization sequence
- Incorrect HID report type

**Debug Steps:**
1. **Enable SignalRGB debug logging**
2. **Check Windows Event Viewer** for USB errors
3. **Compare with your USB capture** from Phase 2
4. **Verify interface and endpoint settings**

### Partial Functionality

**Issues:**
- Only some LEDs light up → Check LED count configuration
- Wrong colors → Verify RGB byte order in protocol  
- Flickering → Check packet timing or initialization

## Debug Tools

### SignalRGB Logs

Enable debug logging in SignalRGB settings:
```
Settings → Debugging → Enable Plugin Debug Logging
```

Log location: `%APPDATA%\WhirlwindFX\SignalRgb\Logs\`

### Windows USB Debugging

Monitor USB events:
```powershell
# Enable USB ETW logging (requires admin)
logman create trace usb -p Microsoft-Windows-USB-USBPORT -o usb.etl -ets
# Stop logging
logman stop usb -ets
```

### Protocol Verification

Create a test script to manually send packets:
```javascript
// Add to device.js for testing
function debugSendTestPacket(r, g, b) {
    const packet = new Array(64).fill(0);
    // Set your protocol bytes here
    packet[0] = 0x00; // Report ID
    packet[4] = r;    // Red
    packet[5] = g;    // Green  
    packet[6] = b;    // Blue
    device.write(packet, 64);
}
```

## Performance Validation

### Frame Rate Test
- Use animated effects and verify smooth 30 FPS rendering
- No dropped frames or stuttering
- CPU usage should remain reasonable

### Stability Test  
- Run effects for extended periods (30+ minutes)
- No memory leaks or crashes
- Device remains responsive

### Power Test
- Verify pump functionality isn't affected
- Temperature monitoring still works
- Only RGB is controlled by SignalRGB

## Plugin Customization

### Adjusting LED Count
```javascript
// In ControllableParameters()
"min": 12,    // Minimum LEDs
"max": 48,    // Maximum LEDs  
"default": 24 // Your pump's actual count
```

### Adding Model Support
```javascript
// Add new model configuration
const DEVICE_CONFIGS = {
    0x7373: { name: "Trinity", ledCount: 24, interface: 0 },
    0x7371: { name: "Trinity Performance", ledCount: 24, interface: 0 },
    0x7395: { name: "LCD", ledCount: 24, interface: 1, usagePage: 0xFF1A },
    0x7XXX: { name: "New Model", ledCount: XX, interface: X } // Add your model
};
```

## Success Criteria

Plugin is working correctly when:

- [x] **Device Detection**: Shows up in SignalRGB device list
- [x] **Color Control**: All colors display correctly  
- [x] **Brightness Control**: Brightness slider works
- [x] **Effect Support**: Animated effects work smoothly
- [x] **Stability**: No crashes or freezes
- [x] **Performance**: 30 FPS rendering without stuttering
- [x] **Compatibility**: Works with existing SignalRGB layouts

## Next Steps

Once basic functionality works:
- Proceed to Phase 5 for enhancements
- Add per-LED control if supported
- Implement ring separation (inner/outer)  
- Add device-specific effects
- Create documentation for other users