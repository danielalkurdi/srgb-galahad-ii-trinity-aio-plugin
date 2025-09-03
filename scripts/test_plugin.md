# SignalRGB Plugin Testing Guide

This guide covers installing, testing, and debugging the Lian Li Galahad II plugin with automated protocol validation.

## Prerequisites

- [ ] SignalRGB installed and running
- [ ] L-Connect closed (to avoid device conflicts)
- [ ] Node.js installed (for automated testing)
- [ ] Know your pump model: Trinity (0x7373), Performance (0x7371), or LCD (0x7395)

## 🚀 SUPER EASY - One-Click Installation

### **Fastest Method** - Just Double-Click:
- **Windows**: `INSTALL.bat` (full menu) or `QUICK_INSTALL.bat` (instant Trinity Enhanced)
- **Linux/macOS**: `./install.sh` or `./install.sh --quick`

**What it does automatically:**
- ✅ Runs all 20 protocol tests
- ✅ Validates plugin syntax
- ✅ Installs to correct SignalRGB folder
- ✅ Provides next-step guidance

---

## Advanced Installation Options

### Automated PowerShell Installation
Use the provided PowerShell installer for manual control:

```powershell
# Install Basic Plugin for Trinity
.\scripts\install_signalrgb.ps1 -Model Trinity

# Install Enhanced Plugin for Trinity with advanced features
.\scripts\install_signalrgb.ps1 -Model Trinity -Enhanced

# Install for other models
.\scripts\install_signalrgb.ps1 -Model Performance
.\scripts\install_signalrgb.ps1 -Model LCD
```

### Manual Installation (Alternative)

1. **Navigate to SignalRGB Community folder**:
   ```
   %APPDATA%\WhirlwindFX\SignalRgb\Devices\Community\
   ```

2. **Copy plugin folder**:
   - For basic features: Copy `signalrgb-plugin/LianLi_GalahadII_Trinity/`
   - For enhanced features: Copy `signalrgb-plugin/LianLi_GalahadII_Trinity_Enhanced/`

3. **Restart SignalRGB**

## Automated Testing

### Protocol Validation Suite
Before installing to SignalRGB, validate the plugin protocol:

```bash
# Run comprehensive protocol tests
node scripts/run_tests.js
```

**Expected Output**: 20/20 tests passed (100% success rate)
- ✅ Initialization Commands (3 tests)
- ✅ Color Commands (6 tests)  
- ✅ Ring Control Commands (4 tests)
- ✅ Brightness Commands (4 tests)
- ✅ Error Handling (3 tests)

### Syntax Validation
Verify all plugin files have valid JavaScript syntax:

```bash
# Validate plugin syntax
node -c plugin/device.js
node -c plugin/device_enhanced.js
node -c signalrgb-plugin/*/device.js
```

## SignalRGB Integration Testing

### Step 1: Pre-Installation Validation

1. **Run automated tests first**:
   ```bash
   node scripts/run_tests.js
   ```
   Ensure all 20 tests pass before proceeding.

2. **Install plugin using automation**:
   ```powershell
   .\scripts\install_signalrgb.ps1 -Model [Trinity/Performance/LCD]
   ```

### Step 2: Basic Detection Test

1. **Close L-Connect completely** (check Task Manager)
2. **Restart SignalRGB** (or use "Scan for devices")
3. **Check the device list** for "Lian Li Galahad II Trinity/LCD AIO Pump"

**Expected Results:**
- ✅ Device appears in SignalRGB device list
- ✅ No error messages in SignalRGB logs
- ✅ Device shows as "Connected"
- ✅ Plugin metadata displays correctly (version 1.0.0)

### Step 3: Static Color Test

1. **Apply a Solid effect** (Red, Green, Blue)
2. **Observe the pump RGB**
3. **Try different brightness levels**

**Expected Results:**
- ✅ Pump LEDs change to the selected color
- ✅ Brightness control works
- ✅ Color changes are immediate (no delay)

### Step 4: Dynamic Effect Test

1. **Apply Rainbow effect** or similar animated effect
2. **Verify 30 FPS smooth animation**
3. **Test different effect speeds**

**Expected Results:**
- ✅ Smooth color transitions
- ✅ No flickering or stuttering
- ✅ Effect speed controls work

### Step 5: Enhanced Features Test (Enhanced Plugin Only)

If using the Enhanced plugin, test advanced features:

1. **Ring Control**: Configure different colors for inner/outer rings
2. **Per-LED Control**: Test individual LED addressing
3. **Protocol Auto-Detection**: Verify automatic optimization
4. **Advanced Error Recovery**: Test plugin stability under various conditions

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

Use the automated protocol testing suite:
```bash
# Run comprehensive protocol validation
node scripts/run_tests.js

# Check specific protocol commands
node scripts/protocol_test.js  # (with browser environment fixes)
```

**Advanced Manual Testing** (if needed):
```javascript
// Add to device.js for testing
function debugSendTestPacket(r, g, b) {
    const packet = new Array(64).fill(0);
    packet[0] = 0x00; // Report ID
    packet[1] = 0x16; // Header 1
    packet[2] = 0x16; // Header 2  
    packet[3] = 0x06; // RGB Command
    packet[4] = 0x04; // Data Length
    packet[5] = 0x00; // Zone (All)
    packet[6] = r;    // Red
    packet[7] = g;    // Green  
    packet[8] = b;    // Blue
    device.write(packet, 64);
}

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

Plugin is working correctly when all automated and manual tests pass:

### ✅ Automated Testing (Must Pass)
- [x] **Protocol Validation**: 20/20 tests pass (100% success rate)
- [x] **Syntax Validation**: All plugin files have valid JavaScript
- [x] **Installation Automation**: PowerShell installer works correctly

### ✅ Manual Testing (SignalRGB Environment) 
- [x] **Device Detection**: Shows up in SignalRGB device list
- [x] **Color Control**: All colors display correctly  
- [x] **Brightness Control**: Brightness slider works
- [x] **Effect Support**: Animated effects work smoothly
- [x] **Stability**: No crashes or freezes
- [x] **Performance**: 30 FPS rendering without stuttering
- [x] **Compatibility**: Works with existing SignalRGB layouts

### ✅ Enhanced Features (Enhanced Plugin Only)
- [x] **Ring Independence**: Separate inner/outer ring control
- [x] **Per-LED Control**: Individual LED addressing works
- [x] **Protocol Auto-Detection**: Automatic optimization functions
- [x] **Advanced Error Recovery**: Robust error handling

## Testing Workflow Summary

```bash
# 1. Run automated validation
node scripts/run_tests.js

# 2. Install plugin
.\scripts\install_signalrgb.ps1 -Model Trinity

# 3. Test in SignalRGB
# - Device detection
# - Color control  
# - Effects testing
# - Performance validation

# 4. Verify enhanced features (if applicable)
```

Your plugin is **production-ready** when all criteria above are met! 🎉