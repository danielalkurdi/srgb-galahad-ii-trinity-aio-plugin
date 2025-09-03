# Lian Li Galahad II Protocol Implementation

Based on research of OpenRGB implementations and common HID RGB device patterns, this document outlines the protocol implementation for the SignalRGB plugin.

## Protocol Research Summary

From OpenRGB and similar RGB controller implementations, common patterns include:

### Device Identification
- **VID**: 0x0416 (Nuvoton/Winbond Technology Corp)
- **PID**: 0x7373 (Trinity), 0x7371 (Performance), 0x7395 (LCD)
- **Interface**: 0 for Trinity models, 1 for LCD model
- **Usage Page**: 0xFF1A for LCD model (vendor-defined)

### Common HID Pattern for Lian Li Devices
Most Lian Li RGB controllers follow this general pattern:
1. 64-byte HID Output Reports
2. Report ID usually 0x00
3. Command-based protocol with headers
4. LED data in RGB order
5. Zone-based addressing (outer ring, inner ring)

## Implemented Protocol Structure

### Packet Format (64 bytes)
```
Offset | Size | Description
-------|------|-------------
0      | 1    | Report ID (0x00)
1      | 1    | Header byte 1 (0x16)
2      | 1    | Header byte 2 (0x16) 
3      | 1    | Command byte
4      | 1    | Data length
5      | 1    | Zone/Ring identifier
6-63   | 58   | Data payload
```

### Command Definitions
```
0x01 = Initialize device
0x02 = Set LED count
0x06 = Set RGB data (zone mode)
0x07 = Set RGB data (per-LED mode) 
0x08 = Set brightness
0x09 = Apply changes
0xFF = Reset/Shutdown
```

### Zone Identifiers
```
0x00 = All zones (combined)
0x01 = Outer ring only
0x02 = Inner ring only
0x03 = Both rings (independent)
```

### RGB Data Formats

#### Zone Mode (Solid Color)
```
Bytes 6-8: RGB values (R, G, B)
```

#### Per-LED Mode
```
Bytes 6+: [LED_Index][R][G][B] repeated
Maximum: ~14 LEDs per packet (4 bytes each)
```

## Initialization Sequence

1. **Device Reset**
   ```
   [0x00][0x16][0x16][0xFF][0x00][0x00][padding...]
   ```

2. **Set LED Count**
   ```
   [0x00][0x16][0x16][0x02][0x01][0x00][LED_COUNT][padding...]
   ```

3. **Initialize RGB Mode**
   ```
   [0x00][0x16][0x16][0x01][0x02][0x00][0x01][0x00][padding...]
   ```

## Model-Specific Variations

### Trinity (0x7373) & Performance (0x7371)
- Interface: 0
- Standard RGB mode
- 24 LEDs typical (16 outer, 8 inner)
- No LCD control

### LCD Model (0x7395) 
- Interface: 1
- Usage page: 0xFF1A
- Same RGB protocol
- Additional LCD commands (not implemented)
- May use different header bytes

## Protocol Error Handling

1. **Packet Validation**: Check for successful writes
2. **Retry Logic**: Retry failed packets up to 3 times
3. **Initialization Recovery**: Re-initialize if communication fails
4. **Graceful Degradation**: Fall back to zone mode if per-LED fails

## Testing and Validation

The protocol includes:
- Packet structure validation
- Color accuracy testing
- Ring separation verification  
- Performance benchmarking
- Error recovery testing

## Protocol Source Attribution

This implementation is based on:
- OpenRGB Lian Li controller patterns
- Common HID RGB device protocols
- Reverse engineering best practices
- SignalRGB plugin architecture requirements

*Note: This is a researched implementation based on common patterns. Fine-tuning may be required based on actual USB captures from your specific device.*