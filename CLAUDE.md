# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SignalRGB plugin project for Lian Li Galahad II Trinity/LCD AIO pump controllers. It provides direct USB control of pump RGB lighting without requiring L-Connect software, targeting 30 FPS smooth animation within the SignalRGB ecosystem.

**Supported Models**: Trinity (0x7373), Trinity Performance (0x7371), LCD (0x7395)

## Development Commands

### Plugin Installation and Testing
```powershell
# Install basic plugin for Trinity model
.\scripts\install_signalrgb.ps1 -Model Trinity

# Install enhanced plugin with advanced features  
.\scripts\install_signalrgb.ps1 -Model Trinity -Enhanced

# Test protocol implementation
node scripts\protocol_test.js

# Enumerate USB devices to verify pump connection
.\scripts\1_enumerate_devices.ps1
```

### Plugin Development Workflow
```bash
# Test plugin in SignalRGB (after installation)
# 1. Close L-Connect completely
# 2. Restart SignalRGB
# 3. Check device list for "Lian Li Galahad II..."
# 4. Apply effects and verify RGB response

# Debug protocol issues
# Check SignalRGB logs: %APPDATA%\WhirlwindFX\SignalRgb\Logs\
# Enable debug logging in SignalRGB settings
```

### File Management
- Production plugins: `signalrgb-plugin/` directory (SignalRGB-compliant structure)
- Development plugins: `plugin/` directory (working versions)
- Install scripts: `scripts/install_*.ps1` (automated deployment)

## Architecture Overview

### Plugin Structure
The project implements a **dual-plugin architecture**:

**Basic Plugin** (`signalrgb-plugin/LianLi_GalahadII_Trinity/`):
- Zone-based RGB control (All/Outer/Inner rings)
- Standard SignalRGB export functions
- 30 FPS rendering with 64-byte HID packets
- Model-specific configuration via PID switching

**Enhanced Plugin** (`signalrgb-plugin/LianLi_GalahadII_Trinity_Enhanced/`):
- Per-LED individual control (up to 64 LEDs)
- Independent ring color management
- Protocol auto-detection and optimization
- Advanced error recovery and retry logic

### Protocol Implementation
**HID Communication Pattern**:
```javascript
// 64-byte packet structure
[ReportID][Header1][Header2][Command][DataLen][Zone][...RGB Data...]
   0x00     0x16     0x16      0xXX      0xXX   0xXX   ...58 bytes

// Command sequence for RGB updates
1. CMD_INITIALIZE (0x01) - Enter RGB mode
2. CMD_SET_LED_COUNT (0x02) - Configure LED count
3. CMD_SET_RGB_ZONE (0x06) - Zone control OR
   CMD_SET_RGB_INDIVIDUAL (0x07) - Per-LED control
4. CMD_APPLY (0x09) - Apply changes to hardware
```

### SignalRGB Integration
**Required Export Functions** (implemented in both plugins):
- Core: `Name()`, `VendorId()`, `ProductId()`, `Publisher()`
- Layout: `Size()`, `LedNames()`, `LedPositions()` 
- Device: `Initialize()`, `Render()`, `Validate()`, `Shutdown()`
- Configuration: `ControllableParameters()`, `Channels()`

**Plugin Installation Path**:
```
%APPDATA%\WhirlwindFX\SignalRgb\Devices\Community\[PluginName]\device.js
```

### Multi-Model Support Architecture
The plugins use **model-specific configuration objects**:
```javascript
const DEVICE_CONFIGS = {
    0x7373: { name: "Trinity", ledCount: 24, interface: 0 },
    0x7371: { name: "Trinity Performance", ledCount: 24, interface: 0 },  
    0x7395: { name: "LCD", ledCount: 24, interface: 1, usagePage: 0xFF1A }
};
```

Model selection via `ProductId()` function modification for target device.

### Error Handling Strategy
**Three-tier approach**:
1. **HID Validation**: Interface and endpoint verification in `Validate()`
2. **Protocol Validation**: Packet structure and command verification
3. **Retry Logic**: Automatic retry with exponential backoff for failed communications

### Development vs Production Separation
- `plugin/` - Development workspace with `device.js` and `device_enhanced.js`
- `signalrgb-plugin/` - Production-ready SignalRGB Community plugin structure
- `scripts/` - Automated installation and testing utilities
- `docs/` - Technical implementation details and protocol documentation

## Key Technical Constraints

### USB Communication Requirements
- Must close L-Connect before SignalRGB to avoid device interface conflicts
- LCD model (0x7395) requires interface 1 and usage page 0xFF1A
- Trinity models use interface 0 with standard HID communication
- Maximum 14 LEDs per packet due to 64-byte limit: `(64-6)/4 = 14.5`

### SignalRGB Performance Requirements  
- 30 FPS rendering pipeline with optimized packet batching
- LED count validation (16-64 range with model-specific defaults)
- Brightness control integration with SignalRGB's global brightness system
- Effect compatibility with SignalRGB's animation framework

### Protocol Timing Constraints
- Initialization sequence required before RGB commands accepted
- CMD_APPLY required after RGB data to commit changes to hardware
- Packet timing optimized for USB bulk transfer rates

## Important Development Notes

- **Never commit secrets**: All USB protocol research is based on common HID patterns, not reverse-engineered proprietary data
- **Model configuration**: Always update `ProductId()` function when testing different pump models
- **Interface selection**: LCD models require different HID interface/usage page than Trinity models
- **Testing dependencies**: SignalRGB must be installed and L-Connect closed for plugin testing
- **Installation automation**: Use provided PowerShell scripts for consistent plugin deployment