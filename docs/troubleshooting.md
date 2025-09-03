# Troubleshooting Guide

Common issues and solutions for the Lian Li Galahad II SignalRGB plugin.

## Device Detection Issues

### Plugin Not Showing in SignalRGB

**Symptoms:**
- Plugin file exists but device doesn't appear in device list
- SignalRGB doesn't recognize the pump

**Causes & Solutions:**

1. **Wrong VID/PID Configuration**
   ```javascript
   // Check your device enumeration results
   export function VendorId() { return 0x0416; }  // Correct for Lian Li
   export function ProductId() { return 0x7373; } // Update for your model
   ```

2. **L-Connect Interference**
   ```powershell
   # Kill all L-Connect processes
   Get-Process | Where-Object {$_.ProcessName -like "*L-Connect*"} | Stop-Process -Force
   ```

3. **Plugin File Errors**
   - Check JavaScript syntax errors
   - Verify all required export functions are present
   - Test with SignalRGB debug logging enabled

### Device Shows as "Not Connected"

**Symptoms:**  
- Plugin appears in device list but shows disconnected status
- No response to color changes

**Causes & Solutions:**

1. **Interface/Endpoint Issues**
   ```javascript
   export function Validate(endpoint) {
       // For LCD models, use interface 1
       if (ProductId() === 0x7395) {
           return endpoint.interface === 1;
       }
       // For Trinity models, usually interface 0
       return endpoint.interface === 0 || endpoint.usage_page >= 0xFF00;
   }
   ```

2. **USB Connection Problems**
   - Try different USB ports
   - Ensure direct motherboard connection (no hubs)
   - Check Device Manager for USB errors

3. **Driver Issues**
   - Update USB/chipset drivers  
   - Reinstall SignalRGB
   - Reboot system

## Color Control Issues

### No Color Changes

**Symptoms:**
- Plugin connects but LEDs don't change color
- LEDs remain in default state

**Debug Steps:**

1. **Enable Debug Logging**
   ```javascript
   export function Render() {
       console.log("Render called"); // Add debug output
       // ... rest of render function
   }
   ```

2. **Test with Simple Colors**
   ```javascript
   function testSolidColor(r, g, b) {
       const packet = new Array(64).fill(0x00);
       // Use protocol from your capture analysis
       packet[0] = 0x00;  // Report ID
       packet[1] = 0xAA;  // Magic byte (replace with actual)
       packet[2] = 0x55;  // Magic byte (replace with actual) 
       packet[3] = 0x10;  // Command (replace with actual)
       packet[4] = r;     // Red (adjust offset)
       packet[5] = g;     // Green (adjust offset)
       packet[6] = b;     // Blue (adjust offset)
       
       device.write(packet, 64);
   }
   ```

3. **Protocol Issues**
   - Verify packet structure matches USB capture
   - Check magic bytes and command values
   - Confirm RGB byte positions and order

### Wrong Colors Displayed

**Symptoms:**
- Colors appear but don't match SignalRGB selection
- Color order is incorrect (red shows as blue, etc.)

**Solutions:**

1. **RGB Byte Order**
   ```javascript
   // Try different orders based on capture analysis:
   packet[offset] = color[0];     // R-G-B order
   packet[offset + 1] = color[1];
   packet[offset + 2] = color[2];
   
   // OR
   packet[offset] = color[1];     // G-R-B order  
   packet[offset + 1] = color[0];
   packet[offset + 2] = color[2];
   
   // OR  
   packet[offset] = color[2];     // B-G-R order
   packet[offset + 1] = color[1];
   packet[offset + 2] = color[0];
   ```

2. **Brightness Scaling**
   ```javascript
   // Apply brightness correction
   const r = Math.round(color[0] * (BRIGHTNESS / 100));
   const g = Math.round(color[1] * (BRIGHTNESS / 100)); 
   const b = Math.round(color[2] * (BRIGHTNESS / 100));
   ```

### Flickering or Stuttering

**Symptoms:**
- LEDs flicker rapidly
- Color changes aren't smooth
- Performance issues

**Solutions:**

1. **Packet Timing**
   ```javascript
   let lastRenderTime = 0;
   export function Render() {
       const now = Date.now();
       if (now - lastRenderTime < 33) { // 30 FPS limit
           return;
       }
       lastRenderTime = now;
       // ... render logic
   }
   ```

2. **Error Handling**
   ```javascript
   try {
       device.write(packet, packetSize);
   } catch (error) {
       console.log("Write error:", error);
       // Don't crash on occasional USB errors
   }
   ```

## Ring Control Issues

### Only Some LEDs Working

**Symptoms:**
- Only outer ring or inner ring lights up
- LED count doesn't match expectations

**Solutions:**

1. **LED Count Configuration**
   ```javascript
   // Verify total LED count matches your pump
   const config = {
       outerLeds: 16,  // Adjust based on your model
       innerLeds: 8,   // Adjust based on your model  
       totalLeds: 24
   };
   ```

2. **Ring Addressing**
   ```javascript
   // Separate ring control (if supported)
   function sendRingData(ringIndex, colors) {
       const packet = new Array(64).fill(0x00);
       packet[0] = 0x00;           // Report ID
       packet[1] = 0xAA;           // Magic bytes
       packet[2] = 0x55;
       packet[3] = 0x11;           // Ring command
       packet[4] = ringIndex;      // 0=outer, 1=inner
       packet[5] = colors.length;  // LED count for this ring
       
       let offset = 6;
       for (const color of colors) {
           packet[offset++] = color.r;
           packet[offset++] = color.g; 
           packet[offset++] = color.b;
       }
       
       device.write(packet, 64);
   }
   ```

### Independent Ring Control Not Working

**Symptoms:**
- Both rings always show same color
- Ring separation settings have no effect

**Solutions:**

1. **Check Protocol Support**
   - Verify device supports independent ring control
   - May require different command bytes for each ring
   - Some models only support combined mode

2. **Ring Mode Implementation**
   ```javascript
   export function Render() {
       if (RING_MODE === "Independent Rings") {
           sendOuterRing();
           sendInnerRing();
       } else {
           sendCombinedRing();
       }
   }
   ```

## Performance Issues

### High CPU Usage

**Symptoms:**
- SignalRGB uses excessive CPU  
- System becomes sluggish during effects

**Solutions:**

1. **Optimize Render Function**
   ```javascript
   // Cache calculations outside render loop
   let cachedColors = [];
   let lastFrameHash = "";
   
   export function Render() {
       const currentHash = getCurrentFrameHash();
       if (currentHash === lastFrameHash) {
           return; // Skip identical frames
       }
       lastFrameHash = currentHash;
       // ... render logic
   }
   ```

2. **Reduce LED Count**
   - Lower LED count in plugin settings
   - Use zone mode instead of per-LED mode

### USB Communication Errors

**Symptoms:**
- Frequent USB write errors in logs
- Device becomes unresponsive  

**Solutions:**

1. **Add Retry Logic**
   ```javascript
   function writeWithRetry(packet, maxRetries = 3) {
       for (let i = 0; i < maxRetries; i++) {
           try {
               device.write(packet, packet.length);
               return true;
           } catch (error) {
               if (i === maxRetries - 1) {
                   console.log("USB write failed after retries:", error);
               }
           }
       }
       return false;
   }
   ```

2. **USB Reset**
   ```powershell
   # Disconnect and reconnect USB device
   # In Device Manager: Disable → Enable the pump device
   ```

## Model-Specific Issues

### LCD Model (0x7395) Not Working

**Common Issues:**
- Uses interface 1 instead of 0
- Requires usage page 0xFF1A
- May have different packet structure

**Solution:**
```javascript
export function Validate(endpoint) {
    if (ProductId() === 0x7395) { // LCD model
        return endpoint.interface === 1 && endpoint.usage_page === 0xFF1A;
    }
    // Other models...
}
```

### Trinity Performance (0x7371) Different Protocol

**Issues:**
- May use different command bytes
- Different LED count or arrangement

**Solution:**
- Capture USB traffic specifically for Performance model
- Update protocol constants accordingly

## Recovery Procedures

### Complete Reset

If plugin stops working entirely:

1. **Stop SignalRGB**
2. **Kill L-Connect processes**
3. **Disconnect pump USB** (wait 10 seconds)
4. **Reconnect pump USB**
5. **Restart SignalRGB**

### Factory Reset Plugin

```powershell
# Remove plugin completely
Remove-Item "$env:APPDATA\WhirlwindFX\SignalRgb\Devices\Community\LianLi_GAII_Pump" -Recurse -Force

# Clear SignalRGB cache
Remove-Item "$env:APPDATA\WhirlwindFX\SignalRgb\Cache" -Recurse -Force

# Reinstall plugin
# Copy device.js to Community folder again
```

### Debug Information Collection

For reporting issues, collect:

1. **Device Information:**
   ```powershell
   Get-PnpDevice -FriendlyName "*Lian Li*" | Format-List *
   ```

2. **SignalRGB Logs:**
   - Location: `%APPDATA%\WhirlwindFX\SignalRgb\Logs\`
   - Include recent log files

3. **USB Capture:**
   - Fresh USBPcap capture showing the issue
   - Compare with working L-Connect capture

## Getting Help

**Before Reporting Issues:**
- [ ] Verified plugin file syntax
- [ ] Tested with debug logging enabled  
- [ ] Confirmed device works with L-Connect
- [ ] Tried different USB ports
- [ ] Collected debug information

**Support Channels:**
- GitHub Issues (preferred for bugs)
- SignalRGB Discord Community
- Lian Li official forums (hardware issues)