# Lian Li Galahad II Trinity/LCD AIO Pump - SignalRGB Plugin

**Version:** 1.0.0  
**Type:** Community Plugin  
**Category:** Cooling  
**Supported Models:** Trinity (0x7373), Trinity Performance (0x7371), LCD (0x7395)

## Features

✅ **Direct USB Control** - No L-Connect dependency  
✅ **Ring Control** - Outer ring, inner ring, or combined  
✅ **Model Support** - Trinity, Performance, and LCD variants  
✅ **30 FPS Rendering** - Smooth color transitions  
✅ **User Configuration** - LED count, brightness, ring modes  

## Installation

### Automatic Installation
1. Copy the entire `LianLi_GalahadII_Trinity` folder to:
   ```
   %APPDATA%\WhirlwindFX\SignalRgb\Devices\Community\
   ```

2. Restart SignalRGB

3. Your pump should appear in the device list as:
   ```
   "Lian Li Galahad II Trinity/LCD AIO Pump"
   ```

### Manual Configuration
If your model is not Trinity (0x7373), edit `device.js`:

```javascript
// For Trinity Performance
export function ProductId() { return 0x7371; }

// For LCD model
export function ProductId() { return 0x7395; }
```

## Configuration Options

- **LED Count**: Adjust for your specific pump (typically 24)
- **Brightness**: Global brightness control (1-100%)
- **Pump Model**: Select Trinity/Performance/LCD variant
- **Ring Control**: Combined, Outer Only, or Inner Only

## Supported Devices

| Model | VID | PID | Interface | LEDs |
|-------|-----|-----|-----------|------|
| Trinity | 0x0416 | 0x7373 | 0 | 24 |
| Trinity Performance | 0x0416 | 0x7371 | 0 | 24 |
| LCD | 0x0416 | 0x7395 | 1 | 24 |

## Troubleshooting

### Plugin Not Detected
- Verify VID/PID matches your pump model
- Ensure L-Connect is closed
- Check USB connection to motherboard (not hub)

### No Color Changes
- Verify pump works with L-Connect first
- Check plugin configuration matches your model
- Try different ring control modes

### Performance Issues
- Reduce LED count in settings
- Close unnecessary RGB software
- Use "Combined" ring mode for better performance

## Technical Details

- **Protocol**: Custom HID implementation
- **Packet Size**: 64 bytes
- **Refresh Rate**: 30 FPS
- **USB Interface**: Direct HID communication
- **Error Recovery**: Automatic retry and re-initialization

## Support

For issues and feedback:
- Check the main project documentation
- Review troubleshooting guides
- Test with L-Connect to verify hardware functionality

## Version History

- **1.0.0**: Initial release with basic functionality