# SignalRGB Plugin for Lian Li Galahad II Trinity/LCD AIO Pump

Control the Galahad II pump RGB directly from SignalRGB (30 FPS) without relying on L-Connect for lighting.

## Supported Models

- **Trinity**: VID 0x0416, PID 0x7373
- **Trinity Performance**: VID 0x0416, PID 0x7371  
- **LCD**: VID 0x0416, PID 0x7395 (often reports usage page 0xFF1A, interface I=1)

## Project Structure

```
├── scripts/
│   ├── 1_enumerate_devices.ps1     # PowerShell device enumeration
│   ├── 2_capture_setup.md          # USBPcap + Wireshark setup guide
│   └── test_plugin.md              # Testing instructions
├── plugin/
│   └── device.js                   # SignalRGB plugin implementation
└── docs/
    ├── capture_analysis.md         # USB packet analysis
    └── troubleshooting.md          # Common issues and fixes
```

## Quick Start

1. **Phase 1**: Run `scripts/1_enumerate_devices.ps1` to find your pump
2. **Phase 2**: Follow `scripts/2_capture_setup.md` to capture L-Connect USB traffic  
3. **Phase 3**: Copy `plugin/device.js` to SignalRGB Community folder
4. **Phase 4**: Test using `scripts/test_plugin.md` instructions
5. **Phase 5**: Customize LED count and effects

## Installation Path

Plugin goes to: `%APPDATA%\WhirlwindFX\SignalRgb\Devices\Community\LianLi_GAII_Pump\device.js`

## Important Notes

- Connect pump USB directly to motherboard (avoid splitters during setup)
- Close L-Connect before running SignalRGB to avoid interface conflicts
- USB-C on pump connects to 9-pin USB header on motherboard
- Some controllers may enumerate under ENE (0x0CF2) as well