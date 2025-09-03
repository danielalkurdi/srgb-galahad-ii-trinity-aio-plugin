# USB Capture Analysis Guide

This document helps analyze USBPcap captures to implement the RGB protocol correctly.

## Required Analysis Steps

After capturing USB traffic from L-Connect (see Phase 2), use this guide to extract the RGB protocol.

### 1. Filter and Identify RGB Traffic

**Wireshark Filters:**
```
# Show only your device traffic
usb.idVendor == 0x0416 && usb.idProduct == 0x7373

# Show only outgoing HID reports  
usb.idVendor == 0x0416 && usb.endpoint_address.direction == 0 && usb.transfer_type == 0x01

# Show data payload only
usbhid.data && frame contains "aa:55"  # If you find magic bytes
```

### 2. Packet Structure Analysis

Look for patterns when L-Connect sends solid colors:

**Red (255, 0, 0):**
```
Packet: 00 AA 55 01 FF 00 00 ...
        ↑  ↑  ↑  ↑  ↑  ↑  ↑
        │  │  │  │  │  │  └─ Blue component
        │  │  │  │  │  └──── Green component  
        │  │  │  │  └─────── Red component
        │  │  │  └────────── Command/Mode byte
        │  │  └───────────── Magic byte 2
        │  └──────────────── Magic byte 1
        └─────────────────── Report ID
```

### 3. Common Protocol Patterns

#### HID Output Reports (Most Common)
- Report ID: Usually 0x00
- Packet size: 64 or 65 bytes
- Structure: [Report ID][Header][Command][Data][Padding]

#### HID Feature Reports  
- Longer initialization sequences
- Device configuration commands
- May require `device.get_feature_report()` / `device.send_feature_report()`

#### Control Transfers
- Less common for RGB
- Used for device enumeration and setup

### 4. Protocol Reverse Engineering Checklist

- [ ] **Report ID**: First byte of HID packets
- [ ] **Magic Bytes**: Consistent header bytes (e.g., 0xAA, 0x55)
- [ ] **Command Bytes**: Different values for different operations
- [ ] **RGB Data Location**: Byte offsets for R, G, B values
- [ ] **LED Addressing**: Per-LED vs zone-based control
- [ ] **Brightness Control**: Separate command or RGB scaling
- [ ] **Initialization Sequence**: Commands sent at startup
- [ ] **Ring Control**: Separate inner/outer ring commands

### 5. Extraction Template

Fill this template based on your captures:

```javascript
// Protocol Constants (from capture analysis)
const REPORT_ID = 0x00;           // First byte
const MAGIC_BYTE_1 = 0xAA;        // Header byte 1  
const MAGIC_BYTE_2 = 0x55;        // Header byte 2
const CMD_RGB_UPDATE = 0x10;      // RGB update command
const CMD_BRIGHTNESS = 0x20;      // Brightness command (if separate)
const CMD_INIT = 0x01;           // Initialization command

// Packet offsets
const OFFSET_REPORT_ID = 0;
const OFFSET_HEADER_1 = 1;
const OFFSET_HEADER_2 = 2; 
const OFFSET_COMMAND = 3;
const OFFSET_LED_COUNT = 4;       // If per-LED mode
const OFFSET_RGB_DATA = 5;        // Start of RGB data

// RGB data format
const RGB_FORMAT = "SEQUENTIAL";   // "SEQUENTIAL" or "INTERLEAVED"
const BYTES_PER_LED = 3;          // R,G,B = 3 bytes
const MAX_LEDS_PER_PACKET = 20;   // Based on packet size limits
```

### 6. Testing Your Protocol

Create a test function in your plugin:

```javascript
function testProtocol() {
    const PACKET_SIZE = 64;
    
    // Test 1: Solid Red
    let redPacket = new Array(PACKET_SIZE).fill(0x00);
    redPacket[OFFSET_REPORT_ID] = REPORT_ID;
    redPacket[OFFSET_HEADER_1] = MAGIC_BYTE_1;
    redPacket[OFFSET_HEADER_2] = MAGIC_BYTE_2;
    redPacket[OFFSET_COMMAND] = CMD_RGB_UPDATE;
    redPacket[OFFSET_RGB_DATA] = 255;     // Red
    redPacket[OFFSET_RGB_DATA + 1] = 0;   // Green  
    redPacket[OFFSET_RGB_DATA + 2] = 0;   // Blue
    
    device.write(redPacket, PACKET_SIZE);
}
```

### 7. Advanced Protocol Features

#### Per-LED Addressing
If the device supports individual LED control:

```
Packet format: [Header][Command][LED_Count][LED1_R][LED1_G][LED1_B][LED2_R]...
```

#### Ring Separation  
For devices with inner/outer rings:

```
Ring modes:
- 0x00: Combined (all LEDs same color)
- 0x01: Outer ring only
- 0x02: Inner ring only  
- 0x03: Independent rings
```

#### Brightness Commands
Some devices have separate brightness control:

```
Brightness packet: [Header][CMD_BRIGHTNESS][Brightness_0-100][Padding]
```

### 8. Validation Steps

1. **Solid Color Test**: Send red/green/blue and verify correct colors
2. **Brightness Test**: Send different brightness levels  
3. **Per-LED Test**: Send different colors to each LED (if supported)
4. **Ring Test**: Control inner/outer rings separately
5. **Performance Test**: Send packets at 30 FPS without errors

### 9. Common Issues and Solutions

#### Wrong Colors
- Check RGB byte order (RGB vs GRB vs BGR)
- Verify brightness scaling/gamma correction

#### Flickering  
- Packet timing too fast/slow
- Missing initialization sequence
- Wrong report type (Output vs Feature)

#### Partial LEDs
- Incorrect LED count in packet
- Wrong addressing mode
- Insufficient packet data

#### Device Not Responding
- Wrong interface selected
- Missing initialization commands
- Incorrect report ID or magic bytes

### 10. Documentation Template

Document your findings:

```markdown
## Lian Li Galahad II [Model] Protocol

**Device ID:** VID 0x0416, PID 0x7xxx
**Interface:** X  
**Report Type:** HID Output Report
**Packet Size:** 64 bytes

### Packet Structure:
```
Byte 0: Report ID (0x00)
Byte 1: Magic 1 (0xAA)  
Byte 2: Magic 2 (0x55)
Byte 3: Command (0x10 = RGB)
Byte 4: LED Count
Bytes 5+: RGB Data (3 bytes per LED)
```

### Commands:
- 0x01: Initialize
- 0x10: RGB Update
- 0x20: Brightness  
- 0xFF: Shutdown

### LED Layout:
- Total LEDs: 24
- Outer Ring: 16 LEDs (indices 0-15)
- Inner Ring: 8 LEDs (indices 16-23)
```

This documented protocol can then be implemented in the SignalRGB plugin.