// Lian Li Galahad II Trinity/LCD AIO Pump Plugin for SignalRGB
// Official Community Plugin - Version 1.0.0
// Supports Trinity (0x7373), Trinity Performance (0x7371), and LCD (0x7395) models
// Direct USB control without L-Connect dependency

// === SIGNALRGB PLUGIN EXPORTS ===
// Required exports for SignalRGB plugin system

export function Name() { return "Lian Li Galahad II Trinity/LCD AIO Pump"; }
export function VendorId() { return 0x0416; }  // Nuvoton/Winbond Technology Corp
export function ProductId() { return 0x7373; } // Trinity (modify for your model: 0x7371=Performance, 0x7395=LCD)
export function Publisher() { return "Community"; }
export function Documentation() { return "community/lianli-galahad-ii"; }
export function Version() { return "1.0.0"; }
export function Type() { return "Hid"; }
export function SupportedDevices() { 
    return [
        "Lian Li Galahad II Trinity",
        "Lian Li Galahad II Trinity Performance", 
        "Lian Li Galahad II LCD"
    ];
}

// Protocol Constants (based on common Lian Li HID patterns)
const PROTOCOL = {
    REPORT_ID: 0x00,
    HEADER_1: 0x16,
    HEADER_2: 0x16,
    
    // Commands
    CMD_INITIALIZE: 0x01,
    CMD_SET_LED_COUNT: 0x02,
    CMD_SET_RGB_ZONE: 0x06,
    CMD_SET_RGB_INDIVIDUAL: 0x07,
    CMD_SET_BRIGHTNESS: 0x08,
    CMD_APPLY: 0x09,
    CMD_RESET: 0xFF,
    
    // Zone identifiers
    ZONE_ALL: 0x00,
    ZONE_OUTER: 0x01,
    ZONE_INNER: 0x02,
    ZONE_BOTH: 0x03,
    
    PACKET_SIZE: 64
};

// Configuration
const DEVICE_CONFIGS = {
    0x7373: { name: "Trinity", ledCount: 24, interface: 0 },
    0x7371: { name: "Trinity Performance", ledCount: 24, interface: 0 },
    0x7395: { name: "LCD", ledCount: 24, interface: 1, usagePage: 0xFF1A }
};

// Default settings - will be overridden by user configuration
let LED_COUNT = 24;
let BRIGHTNESS = 100;
let CURRENT_MODEL = "Trinity";
let RING_MODE = "Combined";

// Runtime state
let last_colors = null;
let frame_counter = 0;
let initialization_complete = false;

// === SIGNALRGB LAYOUT EXPORTS ===
// LED layout - circular arrangement with inner/outer rings
export function Size() { 
    return [8, 6]; // 8x6 grid to approximate circular pump layout
}

export function DefaultPosition() {
    return [4, 3]; // Center of the grid
}

export function DefaultScale() {
    return 8.0;
}

// SignalRGB image path (if available)
export function Image() {
    return "";
}

// Device category for SignalRGB
export function Category() {
    return "Cooling";
}

// === SIGNALRGB CONFIGURATION EXPORTS ===
// User-configurable parameters for SignalRGB interface
export function ControllableParameters() {
    return [
        {
            "property": "ledCount", 
            "group": "lighting", 
            "label": "LED Count", 
            "type": "number", 
            "min": 12, 
            "max": 48, 
            "step": 1, 
            "default": LED_COUNT,
            "tooltip": "Total number of LEDs on your pump (typically 24)"
        },
        {
            "property": "brightness",
            "group": "lighting", 
            "label": "Brightness (%)", 
            "type": "number", 
            "min": 1, 
            "max": 100, 
            "step": 1, 
            "default": BRIGHTNESS,
            "tooltip": "Global brightness control for all LEDs"
        },
        {
            "property": "modelType",
            "group": "hardware",
            "label": "Pump Model",
            "type": "combobox", 
            "values": ["Trinity (0x7373)", "Trinity Performance (0x7371)", "LCD (0x7395)"],
            "default": "Trinity (0x7373)",
            "tooltip": "Select your specific Galahad II model"
        },
        {
            "property": "ringMode",
            "group": "lighting",
            "label": "Ring Control", 
            "type": "combobox",
            "values": ["Combined", "Outer Ring Only", "Inner Ring Only"],
            "default": "Combined",
            "tooltip": "Choose which LED rings to control"
        }
    ];
}

// SignalRGB channel configuration
export function Channels() {
    return [
        {
            "name": "Outer Ring", 
            "description": "16 LEDs on outer ring",
            "ledCount": Math.ceil(LED_COUNT * 0.67)
        },
        {
            "name": "Inner Ring", 
            "description": "8 LEDs on inner ring", 
            "ledCount": LED_COUNT - Math.ceil(LED_COUNT * 0.67)
        }
    ];
}

// Generate LED positions in circular arrangement
function generateLEDLayout() {
    const positions = [];
    const names = [];
    const centerX = 4, centerY = 3;
    
    // Outer ring (16-20 LEDs)
    const outerRadius = 2.5;
    const outerLEDs = Math.ceil(LED_COUNT * 0.7);
    
    for (let i = 0; i < outerLEDs; i++) {
        const angle = (i / outerLEDs) * 2 * Math.PI - Math.PI/2; // Start from top
        const x = Math.round(centerX + outerRadius * Math.cos(angle));
        const y = Math.round(centerY + outerRadius * Math.sin(angle));
        positions.push([x, y]);
        names.push(`Outer ${i + 1}`);
    }
    
    // Inner ring (4-8 LEDs) 
    const innerRadius = 1.2;
    const innerLEDs = LED_COUNT - outerLEDs;
    
    for (let i = 0; i < innerLEDs; i++) {
        const angle = (i / innerLEDs) * 2 * Math.PI - Math.PI/2;
        const x = Math.round(centerX + innerRadius * Math.cos(angle));
        const y = Math.round(centerY + innerRadius * Math.sin(angle));
        positions.push([x, y]);
        names.push(`Inner ${i + 1}`);
    }
    
    return { positions, names };
}

const ledLayout = generateLEDLayout();

export function LedNames() {
    return ledLayout.names;
}

export function LedPositions() { 
    return ledLayout.positions;
}

// === SIGNALRGB DEVICE DETECTION ===
// HID endpoint validation for SignalRGB device detection
export function Validate(endpoint) {
    // Get configuration for current model
    const config = DEVICE_CONFIGS[ProductId()] || DEVICE_CONFIGS[0x7373];
    
    // Strict interface matching for known models
    if (config.interface !== undefined) {
        if (endpoint.interface !== config.interface) {
            return false;
        }
    }
    
    // Usage page validation for LCD model (interface 1, usage page 0xFF1A)
    if (config.usagePage !== undefined) {
        if (endpoint.usage_page !== config.usagePage) {
            return false;
        }
    }
    
    // Accept HID devices with vendor usage pages as fallback
    // This covers most RGB devices that use vendor-defined HID reports
    return endpoint.usage_page >= 0xFF00 || endpoint.interface <= 1;
}

// SignalRGB device information
export function DeviceInfo() {
    const config = DEVICE_CONFIGS[ProductId()] || DEVICE_CONFIGS[0x7373];
    return {
        "model": config.name,
        "interface": config.interface,
        "ledCount": config.ledCount,
        "hasRings": true,
        "supportsPerLed": false, // Basic plugin uses zone control
        "refreshRate": 30
    };
}

let device_endpoint = null;
let is_initialized = false;

export function Initialize() {
    device_endpoint = device.open();
    
    // Update LED count from user configuration if available
    if (typeof ledCount !== 'undefined') {
        LED_COUNT = ledCount;
    }
    
    if (typeof brightness !== 'undefined') {
        BRIGHTNESS = brightness;
    }
    
    // Get user configuration
    if (typeof ringMode !== 'undefined') {
        RING_MODE = ringMode;
    }
    
    // Initialize device with proper protocol sequence
    try {
        initializeDevice();
        initialization_complete = true;
    } catch (error) {
        console.log("Initialization error:", error);
        initialization_complete = false;
    }
    
    is_initialized = true;
}

// Device initialization sequence
function initializeDevice() {
    // Step 1: Reset device
    const resetPacket = createPacket(PROTOCOL.CMD_RESET, []);
    device.write(resetPacket, PROTOCOL.PACKET_SIZE);
    
    // Small delay for device processing
    setTimeout(() => {
        // Step 2: Set LED count
        const ledCountPacket = createPacket(PROTOCOL.CMD_SET_LED_COUNT, [LED_COUNT]);
        device.write(ledCountPacket, PROTOCOL.PACKET_SIZE);
        
        // Step 3: Initialize RGB mode
        setTimeout(() => {
            const initPacket = createPacket(PROTOCOL.CMD_INITIALIZE, [0x01, 0x00]);
            device.write(initPacket, PROTOCOL.PACKET_SIZE);
        }, 50);
    }, 100);
}

// Create protocol packet
function createPacket(command, data = []) {
    const packet = new Array(PROTOCOL.PACKET_SIZE).fill(0x00);
    
    packet[0] = PROTOCOL.REPORT_ID;
    packet[1] = PROTOCOL.HEADER_1;
    packet[2] = PROTOCOL.HEADER_2;
    packet[3] = command;
    packet[4] = data.length;
    
    // Copy data payload
    for (let i = 0; i < data.length && i < PROTOCOL.PACKET_SIZE - 5; i++) {
        packet[5 + i] = data[i];
    }
    
    return packet;
}

// Get zone identifier based on ring mode
function getZoneForRingMode() {
    switch (RING_MODE) {
        case "Outer Ring Only":
            return PROTOCOL.ZONE_OUTER;
        case "Inner Ring Only":
            return PROTOCOL.ZONE_INNER;
        case "Combined":
        default:
            return PROTOCOL.ZONE_ALL;
    }
}

// Utility function to get average color from frame
function getAverageColor() {
    let r = 0, g = 0, b = 0;
    let validPixels = 0;
    
    for (let i = 0; i < ledLayout.positions.length; i++) {
        const [x, y] = ledLayout.positions[i];
        const color = device.color(x, y);
        
        if (color && color.length >= 3) {
            r += color[0];
            g += color[1]; 
            b += color[2];
            validPixels++;
        }
    }
    
    if (validPixels === 0) return [0, 0, 0];
    
    return [
        Math.round((r / validPixels) * (BRIGHTNESS / 100)),
        Math.round((g / validPixels) * (BRIGHTNESS / 100)),
        Math.round((b / validPixels) * (BRIGHTNESS / 100))
    ];
}

// Main render function - called at 30 FPS by SignalRGB
export function Render() {
    if (!is_initialized || !device_endpoint || !initialization_complete) {
        return;
    }
    
    frame_counter++;
    
    try {
        // Get current colors
        const [r, g, b] = getAverageColor();
        const currentColors = `${r},${g},${b}`;
        
        // Skip if colors haven't changed (optimization)
        if (last_colors === currentColors && frame_counter % 10 !== 0) {
            return;
        }
        last_colors = currentColors;
        
        // Send RGB data based on ring mode
        sendRGBData(r, g, b);
        
        // Apply changes every few frames for performance
        if (frame_counter % 5 === 0) {
            const applyPacket = createPacket(PROTOCOL.CMD_APPLY, []);
            device.write(applyPacket, PROTOCOL.PACKET_SIZE);
        }
        
    } catch (error) {
        console.log("Render error (frame " + frame_counter + "):", error);
        
        // Re-initialize on communication errors
        if (frame_counter % 300 === 0) { // Every 10 seconds at 30 FPS
            try {
                initializeDevice();
            } catch (initError) {
                console.log("Re-initialization failed:", initError);
            }
        }
    }
}

// Send RGB data to device
function sendRGBData(r, g, b) {
    const zone = getZoneForRingMode();
    
    // Create RGB packet for zone-based control
    const rgbData = [zone, r, g, b];
    const rgbPacket = createPacket(PROTOCOL.CMD_SET_RGB_ZONE, rgbData);
    
    device.write(rgbPacket, PROTOCOL.PACKET_SIZE);
    
    // For independent ring control
    if (RING_MODE === "Combined" && LED_COUNT >= 16) {
        // Send to both rings with slight delay
        setTimeout(() => {
            const innerData = [PROTOCOL.ZONE_INNER, r, g, b];
            const innerPacket = createPacket(PROTOCOL.CMD_SET_RGB_ZONE, innerData);
            device.write(innerPacket, PROTOCOL.PACKET_SIZE);
        }, 5);
    }
}

export function Shutdown() {
    if (!is_initialized || !device_endpoint) {
        return;
    }
    
    try {
        // Turn off all LEDs
        const offData = [PROTOCOL.ZONE_ALL, 0, 0, 0];
        const offPacket = createPacket(PROTOCOL.CMD_SET_RGB_ZONE, offData);
        device.write(offPacket, PROTOCOL.PACKET_SIZE);
        
        // Apply the changes
        setTimeout(() => {
            const applyPacket = createPacket(PROTOCOL.CMD_APPLY, []);
            device.write(applyPacket, PROTOCOL.PACKET_SIZE);
            
            // Reset device to default state
            setTimeout(() => {
                const resetPacket = createPacket(PROTOCOL.CMD_RESET, []);
                device.write(resetPacket, PROTOCOL.PACKET_SIZE);
            }, 50);
        }, 50);
        
    } catch (error) {
        console.log("Shutdown error:", error);
    }
    
    is_initialized = false;
    initialization_complete = false;
    frame_counter = 0;
    last_colors = null;
}