# Phase 2: USBPcap + Wireshark Setup Guide

This guide walks through capturing USB traffic from L-Connect to reverse engineer the RGB control protocol.

## Prerequisites

1. **USBPcap** - Bundled with Wireshark 4.0+ 
2. **Wireshark** - Download from [wireshark.org](https://www.wireshark.org/download.html)
3. **L-Connect 3** - Official Lian Li software
4. **Admin privileges** - Required for USB packet capture

## Important Setup Notes

- **Close SignalRGB completely** before starting
- **Connect pump USB directly** to motherboard (no hubs/splitters)  
- **Ensure L-Connect can control RGB** before capturing
- **Use only one RGB control app** at a time to avoid conflicts

## Step-by-Step Capture Process

### 1. Install Software
```bash
# Download and install Wireshark (includes USBPcap)
# Verify USBPcap is available in capture interfaces
```

### 2. Identify USB Root Hub
1. Open **Device Manager** → **Universal Serial Bus controllers**
2. Locate the root hub where your Galahad II pump is connected
3. Note the hub name (e.g., "USB Root Hub (USB 3.0)")

### 3. Start Capture
1. Open **Wireshark**
2. Look for **USBPcap** interfaces in the capture list
3. Select the interface corresponding to your pump's root hub
4. Click **Start capturing packets**

### 4. Generate Test Traffic
1. Open **L-Connect 3**
2. Navigate to pump RGB settings
3. Apply the following colors in sequence (hold each for 5-10 seconds):
   - **Solid Red** (RGB: 255, 0, 0)
   - **Solid Green** (RGB: 0, 255, 0) 
   - **Solid Blue** (RGB: 0, 0, 255)
   - **Solid White** (RGB: 255, 255, 255)
   - **Off/Black** (RGB: 0, 0, 0)

### 5. Stop and Save Capture
1. Stop the Wireshark capture
2. Save as `galahad_color_test.pcapng`
3. Close L-Connect

## Analysis Checklist

When examining the capture, look for:

### Device Communication Pattern
- [ ] **Device enumeration** - Initial USB descriptor requests
- [ ] **Interface selection** - Which interface is used for RGB control
- [ ] **Endpoint usage** - HID Output Reports vs Feature Reports vs Control Transfers

### RGB Control Protocol  
- [ ] **Report ID** - First byte of HID reports (often 0x00)
- [ ] **Packet length** - Typically 64 or 65 bytes for HID
- [ ] **RGB byte positions** - Where R, G, B values appear in packets
- [ ] **Brightness control** - Separate brightness commands or RGB scaling
- [ ] **LED addressing** - Individual LED control vs zone/solid color

### Initialization Sequence
- [ ] **Startup handshake** - Commands sent when L-Connect starts
- [ ] **Mode setting** - Commands to enable RGB control mode
- [ ] **Default state** - What happens when app disconnects

## Common Packet Patterns

### Trinity Models (PID 0x7373, 0x7371)
```
Expected interface: 0 or 1
Expected usage page: 0xFF00-0xFFFF (vendor-defined)
Report structure: [Report ID][Header][RGB Data][Padding]
```

### LCD Model (PID 0x7395)
```
Expected interface: 1 (confirmed from OpenRGB)  
Expected usage page: 0xFF1A
Report structure: [Report ID][Header][RGB Data][LCD Data?][Padding]
```

## Filter Examples for Wireshark

```
# Show only USB traffic for your device (replace with actual VID/PID)
usb.idVendor == 0x0416 && usb.idProduct == 0x7373

# Show only HID reports  
usb.transfer_type == 0x01

# Show only outgoing data (host to device)
usb.endpoint_address.direction == 0
```

## Troubleshooting

### No Traffic Captured
- Verify USBPcap is capturing the correct root hub
- Ensure L-Connect has exclusive access to the device
- Try different USB ports if pump doesn't enumerate properly

### Too Much Traffic
- Apply USB filters for your specific VID/PID
- Focus on URB_INTERRUPT packets for HID reports
- Look for repeated patterns when changing colors

### L-Connect Won't Connect
- Disconnect pump USB and reconnect
- Restart L-Connect with admin privileges  
- Verify pump shows up in Device Manager

## Next Steps

After successful capture:
1. Export interesting packets to text/hex format
2. Document the RGB control protocol patterns
3. Note any initialization sequences
4. Proceed to Phase 3: SignalRGB plugin implementation

## Files Generated
- `galahad_color_test.pcapng` - Raw capture file
- `rgb_protocol_notes.txt` - Your analysis notes
- `init_sequence.hex` - Initialization commands (if any)