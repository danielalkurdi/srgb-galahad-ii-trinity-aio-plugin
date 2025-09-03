# Lian Li Galahad II Trinity/LCD AIO Pump - Enhanced SignalRGB Plugin

**Version:** 1.0.0  
**Type:** Community Plugin (Enhanced)  
**Category:** Cooling  
**Supported Models:** Trinity (0x7373), Trinity Performance (0x7371), LCD (0x7395)

## Enhanced Features

✅ **Advanced Ring Control** - Independent inner/outer ring colors  
✅ **Per-LED Addressing** - Individual LED control when supported  
✅ **Protocol Auto-Detection** - Automatic communication optimization  
✅ **Error Recovery** - Advanced error handling and recovery  
✅ **Performance Optimization** - Chunked data transmission for large LED counts  
✅ **Enhanced Configuration** - Extended user customization options  

## Installation

### Automatic Installation
1. Copy the entire `LianLi_GalahadII_Trinity_Enhanced` folder to:
   ```
   %APPDATA%\WhirlwindFX\SignalRgb\Devices\Community\
   ```

2. Restart SignalRGB

3. Your pump should appear in the device list as:
   ```
   "Lian Li Galahad II Trinity/LCD AIO Pump (Enhanced)"
   ```

### Model Configuration
Edit `device.js` for your specific model:

```javascript
// For Trinity Performance
export function ProductId() { return 0x7371; }

// For LCD model
export function ProductId() { return 0x7395; }
```

## Enhanced Configuration Options

### Basic Settings
- **Total LED Count**: 16-64 LEDs (default: 24)
- **Global Brightness**: 1-100% master brightness control
- **Pump Model**: Trinity/Performance/LCD selection

### Advanced Features
- **Ring Control Mode**: 
  - Combined (default)
  - Outer Ring Only
  - Inner Ring Only
  - **Independent Rings** (Enhanced feature)
- **Per-LED Control**: Individual LED addressing
- **Effect Speed**: Built-in effect speed multiplier
- **Auto-Detect Protocol**: Automatic protocol optimization

## Ring Control Modes

### Combined Mode
- Single color/effect applied to all LEDs
- Best performance and compatibility
- Recommended for most users

### Ring-Only Modes
- Control only outer (16 LEDs) or inner (8 LEDs) ring
- Useful for specific lighting designs

### Independent Rings (Enhanced)
- Different colors/effects for each ring
- Requires higher USB bandwidth
- Advanced feature for complex lighting

## Advanced Features

### Per-LED Control
- Individual addressing of up to 64 LEDs
- Enables complex patterns and effects
- Automatic chunking for large LED counts

### Protocol Auto-Detection
- Tests multiple communication protocols
- Automatically selects optimal method
- Fallback support for edge cases

### Enhanced Error Recovery
- Automatic retry on communication errors
- Re-initialization on persistent failures
- Error count tracking and thresholds

## Performance Considerations

### High Performance Mode
- Enable Per-LED Control
- Use Independent Rings mode
- Set higher effect speeds

### Compatibility Mode  
- Disable Per-LED Control
- Use Combined ring mode
- Lower LED count if needed

## Supported Devices

| Model | VID | PID | Interface | LEDs | Per-LED | Rings |
|-------|-----|-----|-----------|------|---------|-------|
| Trinity | 0x0416 | 0x7373 | 0 | 24 | ✅ | ✅ |
| Trinity Performance | 0x0416 | 0x7371 | 0 | 24 | ✅ | ✅ |
| LCD | 0x0416 | 0x7395 | 1 | 24 | ✅ | ✅ |

## Technical Specifications

- **Protocol**: Enhanced HID with auto-detection
- **Packet Size**: 64 bytes with chunked transmission
- **Refresh Rate**: 30 FPS optimized
- **Max LEDs**: 64 individual LEDs
- **Ring Support**: Independent outer (16) + inner (8) control
- **Error Handling**: Multi-level recovery with thresholds

## Troubleshooting

### Enhanced Plugin Issues
- Disable Per-LED Control if experiencing problems
- Try Combined ring mode for better stability
- Enable/disable Auto-Detect Protocol

### Performance Optimization
- Reduce LED count for better frame rates
- Use Combined mode instead of Independent Rings
- Lower effect speed for smoother performance

### Protocol Detection
- The plugin will automatically log protocol detection
- Check SignalRGB logs for communication details
- Try different models if auto-detection fails

## Debug Features

### Console Logging
The enhanced plugin provides detailed logging:
- Protocol detection results
- Initialization sequences
- Error recovery attempts
- Performance metrics

### Validation Tools
- Built-in packet validation
- Communication error tracking
- Protocol auto-detection feedback

## Version History

- **1.0.0**: Initial enhanced release with advanced features

## Support

Enhanced plugin support:
- Review detailed logging output
- Try basic plugin first to isolate issues
- Test protocol auto-detection with different settings
- Use validation tools for diagnostics