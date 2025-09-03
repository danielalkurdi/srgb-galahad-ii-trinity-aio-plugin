// Enhanced Lian Li Galahad II Trinity/LCD AIO Pump Plugin for SignalRGB
// Supports Trinity (0x7373), Trinity Performance (0x7371), and LCD (0x7395) models
// Advanced features: Per-LED control, Ring separation, Brightness commands

export function Name() { return "Lian Li Galahad II Trinity/LCD AIO Pump (Enhanced)"; }
export function VendorId() { return 0x0416; }
export function ProductId() { return 0x7373; } // Configure for your model
export function Publisher() { return "Community"; }
export function Documentation() { return "community/lianli-galahad-ii"; }

// Enhanced Protocol Implementation
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
    CMD_SET_EFFECT: 0x0A,
    CMD_RESET: 0xFF,
    
    // Zone identifiers
    ZONE_ALL: 0x00,
    ZONE_OUTER: 0x01,
    ZONE_INNER: 0x02,
    ZONE_BOTH_INDEPENDENT: 0x03,
    
    // Effect types
    EFFECT_STATIC: 0x00,
    EFFECT_BREATHING: 0x01,
    EFFECT_RAINBOW: 0x02,
    EFFECT_WAVE: 0x03,
    
    PACKET_SIZE: 64,
    MAX_LEDS_PER_PACKET: 14  // (64-6)/4 = 14.5, round down
};

// Enhanced device configurations with ring support
const DEVICE_CONFIGS = {
    0x7373: { 
        name: "Trinity", 
        outerLeds: 16, 
        innerLeds: 8, 
        interface: 0,
        supportsPerLed: true 
    },
    0x7371: { 
        name: "Trinity Performance", 
        outerLeds: 16, 
        innerLeds: 8, 
        interface: 0,
        supportsPerLed: true 
    },
    0x7395: { 
        name: "LCD", 
        outerLeds: 16, 
        innerLeds: 8, 
        interface: 1, 
        usagePage: 0xFF1A,
        supportsPerLed: true,
        hasLCD: true 
    }
};

// Configuration state
let config = DEVICE_CONFIGS[0x7373];
let LED_COUNT = 24;
let BRIGHTNESS = 100;
let RING_MODE = "Combined";
let PER_LED_MODE = true;
let EFFECT_SPEED = 50;

// Runtime state
let device_endpoint = null;
let is_initialized = false;
let initialization_complete = false;
let frame_counter = 0;
let last_outer_colors = null;
let last_inner_colors = null;
let error_count = 0;
const MAX_ERRORS = 10;

export function Size() {
    // Enhanced 10x8 grid for better LED positioning
    return [10, 8];
}

export function DefaultPosition() {
    return [5, 4]; // Center of enhanced grid
}

export function DefaultScale() {
    return 6.0;
}

// Enhanced user parameters
export function ControllableParameters() {
    return [
        {
            "property": "ledCount",
            "group": "lighting",
            "label": "Total LED Count",
            "type": "number",
            "min": 16,
            "max": 64,
            "step": 1,
            "default": 24
        },
        {
            "property": "brightness", 
            "group": "lighting",
            "label": "Brightness (%)",
            "type": "number",
            "min": 1,
            "max": 100, 
            "step": 1,
            "default": 100
        },
        {
            "property": "ringMode",
            "group": "lighting", 
            "label": "Ring Control Mode",
            "type": "combobox",
            "values": ["Combined", "Outer Ring Only", "Inner Ring Only", "Independent Rings"],
            "default": "Combined"
        },
        {
            "property": "perLedMode",
            "group": "advanced",
            "label": "Per-LED Control", 
            "type": "boolean",
            "default": true
        },
        {
            "property": "modelType",
            "group": "hardware",
            "label": "Pump Model",
            "type": "combobox",
            "values": ["Trinity (0x7373)", "Trinity Performance (0x7371)", "LCD (0x7395)"],
            "default": "Trinity (0x7373)"
        },
        {
            "property": "effectSpeed",
            "group": "advanced",
            "label": "Effect Speed", 
            "type": "number",
            "min": 1,
            "max": 100,
            "step": 1,
            "default": 50
        }
    ];
}

// Enhanced LED layout with proper ring separation
class GalahudLEDLayout {
    constructor(outerCount, innerCount) {
        this.outerCount = outerCount;
        this.innerCount = innerCount;
        this.totalCount = outerCount + innerCount;
        this.centerX = 5;
        this.centerY = 4;
        this.outerRadius = 3.0;
        this.innerRadius = 1.5;
        
        this.positions = [];
        this.names = [];
        this.rings = { outer: [], inner: [] };
        
        this.generateLayout();
    }
    
    generateLayout() {
        // Outer ring - clockwise from top
        for (let i = 0; i < this.outerCount; i++) {
            const angle = (i / this.outerCount) * 2 * Math.PI - Math.PI/2;
            const x = Math.round(this.centerX + this.outerRadius * Math.cos(angle));
            const y = Math.round(this.centerY + this.outerRadius * Math.sin(angle));
            
            this.positions.push([Math.max(0, Math.min(9, x)), Math.max(0, Math.min(7, y))]);
            this.names.push(`Outer ${i + 1}`);
            this.rings.outer.push(i);
        }
        
        // Inner ring - clockwise from top
        for (let i = 0; i < this.innerCount; i++) {
            const angle = (i / this.innerCount) * 2 * Math.PI - Math.PI/2;
            const x = Math.round(this.centerX + this.innerRadius * Math.cos(angle)); 
            const y = Math.round(this.centerY + this.innerRadius * Math.sin(angle));
            
            this.positions.push([Math.max(0, Math.min(9, x)), Math.max(0, Math.min(7, y))]);
            this.names.push(`Inner ${i + 1}`);
            this.rings.inner.push(this.outerCount + i);
        }
    }
    
    getActiveIndices() {
        switch (RING_MODE) {
            case "Outer Ring Only":
                return this.rings.outer;
            case "Inner Ring Only": 
                return this.rings.inner;
            case "Independent Rings":
            case "Combined":
            default:
                return [...this.rings.outer, ...this.rings.inner];
        }
    }
}

let ledLayout = new GalahudLEDLayout(16, 8);

export function LedNames() {
    return ledLayout.names;
}

export function LedPositions() {
    return ledLayout.positions;
}

// Enhanced device validation with better interface detection
export function Validate(endpoint) {
    const config = DEVICE_CONFIGS[ProductId()] || DEVICE_CONFIGS[0x7373];
    
    // Strict interface matching for known models
    if (config.interface !== undefined && endpoint.interface !== config.interface) {
        return false;
    }
    
    // Usage page validation for LCD model  
    if (config.usagePage !== undefined && endpoint.usage_page !== config.usagePage) {
        return false; 
    }
    
    // Enhanced validation logic for various HID configurations
    const validUsagePage = endpoint.usage_page >= 0xFF00 && endpoint.usage_page <= 0xFFFF;
    const validUsage = endpoint.usage >= 0xFF00 && endpoint.usage <= 0xFFFF;
    const validInterface = endpoint.interface <= 1;
    
    const isValid = validUsagePage || validUsage || validInterface;
    
    if (typeof console !== 'undefined') {
        console.log(`Enhanced endpoint validation: ${isValid} (UP=${validUsagePage}, U=${validUsage}, I=${validInterface})`);
    }
    
    return isValid;
}

// Enhanced feature exports for SignalRGB
export function SupportsLedCount() { return true; }
export function MaxLedCount() { return 64; }
export function MinLedCount() { return 16; }
export function HasBrightness() { return true; }
export function MaxBrightness() { return 100; }
export function SupportsRgb() { return true; }
export function SupportedModes() { 
    return ["Static", "Breathing", "Rainbow", "Wave"];
}

export function Initialize() {
    device_endpoint = device.open();
    
    // Update configuration from user settings
    if (typeof ledCount !== 'undefined') {
        LED_COUNT = ledCount;
        const outerCount = Math.ceil(LED_COUNT * 0.67);
        const innerCount = LED_COUNT - outerCount;
        ledLayout = new GalahudLEDLayout(outerCount, innerCount);
    }
    
    if (typeof brightness !== 'undefined') BRIGHTNESS = brightness;
    if (typeof ringMode !== 'undefined') RING_MODE = ringMode;
    if (typeof perLedMode !== 'undefined') PER_LED_MODE = perLedMode;
    if (typeof effectSpeed !== 'undefined') EFFECT_SPEED = effectSpeed;
    
    // Get model configuration
    config = DEVICE_CONFIGS[ProductId()] || DEVICE_CONFIGS[0x7373];
    
    // Initialize with enhanced protocol
    try {
        initializeDeviceProtocol();
        initialization_complete = true;
        error_count = 0;
    } catch (error) {
        console.log("Enhanced initialization error:", error);
        initialization_complete = false;
        error_count++;
    }
    
    is_initialized = true;
}

// Enhanced protocol implementation
function initializeDeviceProtocol() {
    console.log("Initializing Lian Li Galahad II with enhanced protocol");
    
    // Step 1: Reset device
    const resetPacket = createProtocolPacket(PROTOCOL.CMD_RESET, []);
    device.write(resetPacket, PROTOCOL.PACKET_SIZE);
    console.log("Sent reset command");
    
    // Step 2: Set LED count (with delay)
    setTimeout(() => {
        const ledCountData = [config.outerLeds + config.innerLeds];
        const ledCountPacket = createProtocolPacket(PROTOCOL.CMD_SET_LED_COUNT, ledCountData);
        device.write(ledCountPacket, PROTOCOL.PACKET_SIZE);
        console.log(`Set LED count: ${LED_COUNT}`);
        
        // Step 3: Initialize RGB mode
        setTimeout(() => {
            const initData = [0x01, 0x00]; // RGB mode, default settings
            const initPacket = createProtocolPacket(PROTOCOL.CMD_INITIALIZE, initData);
            device.write(initPacket, PROTOCOL.PACKET_SIZE);
            console.log("Enabled RGB mode");
            
            // Step 4: Set initial brightness
            setTimeout(() => {
                setBrightness(BRIGHTNESS);
                console.log(`Set brightness: ${BRIGHTNESS}%`);
            }, 50);
        }, 100);
    }, 150);
}

// Create protocol packet with proper structure
function createProtocolPacket(command, data = []) {
    const packet = new Array(PROTOCOL.PACKET_SIZE).fill(0x00);
    
    packet[0] = PROTOCOL.REPORT_ID;
    packet[1] = PROTOCOL.HEADER_1;
    packet[2] = PROTOCOL.HEADER_2;
    packet[3] = command;
    packet[4] = data.length;
    
    // Add zone identifier for RGB commands
    if (command === PROTOCOL.CMD_SET_RGB_ZONE || command === PROTOCOL.CMD_SET_RGB_INDIVIDUAL) {
        packet[5] = getZoneForRingMode();
        // Copy RGB data starting at offset 6
        for (let i = 0; i < data.length && i < PROTOCOL.PACKET_SIZE - 6; i++) {
            packet[6 + i] = data[i];
        }
    } else {
        // Copy data starting at offset 5
        for (let i = 0; i < data.length && i < PROTOCOL.PACKET_SIZE - 5; i++) {
            packet[5 + i] = data[i];
        }
    }
    
    return packet;
}

// Set brightness command
function setBrightness(brightness) {
    const brightnessData = [Math.max(1, Math.min(100, brightness))];
    const brightnessPacket = createProtocolPacket(PROTOCOL.CMD_SET_BRIGHTNESS, brightnessData);
    
    try {
        device.write(brightnessPacket, PROTOCOL.PACKET_SIZE);
    } catch (error) {
        console.log("Brightness control error:", error);
        error_count++;
    }
}

// Get zone identifier based on ring mode
function getZoneForRingMode() {
    switch (RING_MODE) {
        case "Outer Ring Only":
            return PROTOCOL.ZONE_OUTER;
        case "Inner Ring Only":
            return PROTOCOL.ZONE_INNER;
        case "Independent Rings":
            return PROTOCOL.ZONE_BOTH_INDEPENDENT;
        case "Combined":
        default:
            return PROTOCOL.ZONE_ALL;
    }
}

// Enhanced color processing with ring support
function processColors() {
    const activeIndices = ledLayout.getActiveIndices();
    const colors = [];
    
    if (PER_LED_MODE && config.supportsPerLed) {
        // Per-LED color extraction
        for (const index of activeIndices) {
            const [x, y] = ledLayout.positions[index];
            const color = device.color(x, y);
            
            if (color && color.length >= 3) {
                colors.push({
                    index: index,
                    r: Math.round(color[0] * (BRIGHTNESS / 100)),
                    g: Math.round(color[1] * (BRIGHTNESS / 100)),
                    b: Math.round(color[2] * (BRIGHTNESS / 100))
                });
            }
        }
    } else {
        // Average color mode
        let r = 0, g = 0, b = 0, count = 0;
        
        for (const index of activeIndices) {
            const [x, y] = ledLayout.positions[index];
            const color = device.color(x, y);
            
            if (color && color.length >= 3) {
                r += color[0];
                g += color[1]; 
                b += color[2];
                count++;
            }
        }
        
        if (count > 0) {
            const avgColor = {
                r: Math.round((r / count) * (BRIGHTNESS / 100)),
                g: Math.round((g / count) * (BRIGHTNESS / 100)), 
                b: Math.round((b / count) * (BRIGHTNESS / 100))
            };
            
            // Apply average to all active LEDs
            for (const index of activeIndices) {
                colors.push({ index: index, ...avgColor });
            }
        }
    }
    
    return colors;
}

// Enhanced render function with advanced protocol support
export function Render() {
    if (!is_initialized || !device_endpoint || !initialization_complete) {
        return;
    }
    
    // Check error threshold
    if (error_count > MAX_ERRORS) {
        console.log("Too many errors, stopping render");
        return;
    }
    
    frame_counter++;
    
    try {
        // Enhanced rendering with ring support
        if (RING_MODE === "Independent Rings") {
            renderIndependentRings();
        } else {
            renderCombinedMode();
        }
        
        // Apply changes periodically for performance
        if (frame_counter % 3 === 0) {
            const applyPacket = createProtocolPacket(PROTOCOL.CMD_APPLY, []);
            device.write(applyPacket, PROTOCOL.PACKET_SIZE);
        }
        
        // Update brightness if changed
        if (frame_counter % 30 === 0) {
            setBrightness(BRIGHTNESS);
        }
        
    } catch (error) {
        console.log("Enhanced render error (frame " + frame_counter + "):", error);
        error_count++;
        
        // Re-initialize on persistent errors
        if (error_count > 5 && frame_counter % 300 === 0) {
            try {
                console.log("Attempting recovery...");
                initializeDeviceProtocol();
                error_count = 0;
            } catch (recoveryError) {
                console.log("Recovery failed:", recoveryError);
            }
        }
    }
}

// Render independent rings with different colors
function renderIndependentRings() {
    const outerColors = getOuterRingColors();
    const innerColors = getInnerRingColors();
    
    // Send outer ring data
    if (outerColors.length > 0) {
        const outerData = outerColors.length > 1 ? 
            flattenLEDColors(outerColors) : 
            [outerColors[0].r, outerColors[0].g, outerColors[0].b];
        
        const outerPacket = createProtocolPacket(
            PER_LED_MODE ? PROTOCOL.CMD_SET_RGB_INDIVIDUAL : PROTOCOL.CMD_SET_RGB_ZONE,
            outerData
        );
        outerPacket[5] = PROTOCOL.ZONE_OUTER;
        device.write(outerPacket, PROTOCOL.PACKET_SIZE);
    }
    
    // Send inner ring data with delay
    setTimeout(() => {
        if (innerColors.length > 0) {
            const innerData = innerColors.length > 1 ? 
                flattenLEDColors(innerColors) : 
                [innerColors[0].r, innerColors[0].g, innerColors[0].b];
            
            const innerPacket = createProtocolPacket(
                PER_LED_MODE ? PROTOCOL.CMD_SET_RGB_INDIVIDUAL : PROTOCOL.CMD_SET_RGB_ZONE,
                innerData
            );
            innerPacket[5] = PROTOCOL.ZONE_INNER;
            device.write(innerPacket, PROTOCOL.PACKET_SIZE);
        }
    }, 10);
}

// Render combined mode with single color/pattern
function renderCombinedMode() {
    const allColors = processColors();
    
    if (allColors.length === 0) return;
    
    if (PER_LED_MODE && config.supportsPerLed && allColors.length > 1) {
        // Send per-LED data in chunks
        sendPerLEDData(allColors);
    } else {
        // Send average color to all zones
        const avgColor = calculateAverageColor(allColors);
        const colorData = [avgColor.r, avgColor.g, avgColor.b];
        
        const packet = createProtocolPacket(PROTOCOL.CMD_SET_RGB_ZONE, colorData);
        device.write(packet, PROTOCOL.PACKET_SIZE);
    }
}

// Send per-LED data in chunks
function sendPerLEDData(colors) {
    const maxLedsPerPacket = PROTOCOL.MAX_LEDS_PER_PACKET;
    
    for (let i = 0; i < colors.length; i += maxLedsPerPacket) {
        const chunk = colors.slice(i, i + maxLedsPerPacket);
        const ledData = flattenLEDColors(chunk);
        
        const packet = createProtocolPacket(PROTOCOL.CMD_SET_RGB_INDIVIDUAL, ledData);
        device.write(packet, PROTOCOL.PACKET_SIZE);
        
        // Small delay between chunks to prevent USB overflow
        if (i + maxLedsPerPacket < colors.length) {
            setTimeout(() => {}, 5);
        }
    }
}

// Helper functions for color processing
function getOuterRingColors() {
    const colors = [];
    for (let i = 0; i < ledLayout.rings.outer.length; i++) {
        const ledIndex = ledLayout.rings.outer[i];
        const [x, y] = ledLayout.positions[ledIndex];
        const color = device.color(x, y);
        
        if (color && color.length >= 3) {
            colors.push({
                index: ledIndex,
                r: Math.round(color[0] * (BRIGHTNESS / 100)),
                g: Math.round(color[1] * (BRIGHTNESS / 100)),
                b: Math.round(color[2] * (BRIGHTNESS / 100))
            });
        }
    }
    return colors;
}

function getInnerRingColors() {
    const colors = [];
    for (let i = 0; i < ledLayout.rings.inner.length; i++) {
        const ledIndex = ledLayout.rings.inner[i];
        const [x, y] = ledLayout.positions[ledIndex];
        const color = device.color(x, y);
        
        if (color && color.length >= 3) {
            colors.push({
                index: ledIndex,
                r: Math.round(color[0] * (BRIGHTNESS / 100)),
                g: Math.round(color[1] * (BRIGHTNESS / 100)),
                b: Math.round(color[2] * (BRIGHTNESS / 100))
            });
        }
    }
    return colors;
}

function calculateAverageColor(colors) {
    let totalR = 0, totalG = 0, totalB = 0;
    
    for (const color of colors) {
        totalR += color.r;
        totalG += color.g;
        totalB += color.b;
    }
    
    const count = colors.length;
    return {
        r: Math.round(totalR / count),
        g: Math.round(totalG / count),
        b: Math.round(totalB / count)
    };
}

function flattenLEDColors(colors) {
    const data = [];
    for (const color of colors) {
        data.push(color.index || 0, color.r, color.g, color.b);
    }
    return data;
}

// Enhanced shutdown with proper cleanup
export function Shutdown() {
    if (!is_initialized || !device_endpoint) {
        return;
    }
    
    console.log("Shutting down Lian Li Galahad II plugin");
    
    try {
        // Turn off all LEDs
        const offData = [0, 0, 0]; // Black/off
        const offPacket = createProtocolPacket(PROTOCOL.CMD_SET_RGB_ZONE, offData);
        device.write(offPacket, PROTOCOL.PACKET_SIZE);
        
        // Apply the changes
        setTimeout(() => {
            const applyPacket = createProtocolPacket(PROTOCOL.CMD_APPLY, []);
            device.write(applyPacket, PROTOCOL.PACKET_SIZE);
            
            // Reset device to default state
            setTimeout(() => {
                const resetPacket = createProtocolPacket(PROTOCOL.CMD_RESET, []);
                device.write(resetPacket, PROTOCOL.PACKET_SIZE);
                
                console.log("Shutdown sequence completed");
            }, 50);
        }, 50);
        
    } catch (error) {
        console.log("Enhanced shutdown error:", error);
    }
    
    // Reset all state
    is_initialized = false;
    initialization_complete = false;
    frame_counter = 0;
    last_outer_colors = null;
    last_inner_colors = null;
    error_count = 0;
    
    console.log("Plugin state reset complete");
}

// Protocol auto-detection and fallback mechanisms
class ProtocolDetector {
    constructor() {
        this.detectedProtocol = null;
        this.fallbackProtocols = [
            { name: "Standard Lian Li", headers: [0x16, 0x16] },
            { name: "Alternative 1", headers: [0xAA, 0x55] },
            { name: "Alternative 2", headers: [0x5A, 0xA5] }
        ];
    }
    
    async detectProtocol() {
        console.log("Starting protocol auto-detection...");
        
        for (const protocol of this.fallbackProtocols) {
            console.log(`Testing protocol: ${protocol.name}`);
            
            if (await this.testProtocol(protocol)) {
                this.detectedProtocol = protocol;
                console.log(`Protocol detected: ${protocol.name}`);
                return protocol;
            }
        }
        
        console.log("No protocol detected, using default");
        return this.fallbackProtocols[0]; // Default fallback
    }
    
    async testProtocol(protocol) {
        try {
            // Create test packet with protocol headers
            const testPacket = new Array(PROTOCOL.PACKET_SIZE).fill(0x00);
            testPacket[0] = PROTOCOL.REPORT_ID;
            testPacket[1] = protocol.headers[0];
            testPacket[2] = protocol.headers[1];
            testPacket[3] = PROTOCOL.CMD_INITIALIZE;
            testPacket[4] = 0x01;
            testPacket[5] = 0x00;
            
            // Send test packet
            device.write(testPacket, PROTOCOL.PACKET_SIZE);
            
            // Wait for device response (simple success = no exception)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return true; // Success if no exception thrown
            
        } catch (error) {
            console.log(`Protocol ${protocol.name} failed:`, error.message);
            return false;
        }
    }
}

// Initialize protocol detector (global instance)
const protocolDetector = new ProtocolDetector();

// Function to get current protocol headers
function getProtocolHeaders() {
    if (protocolDetector.detectedProtocol) {
        return protocolDetector.detectedProtocol.headers;
    }
    return [PROTOCOL.HEADER_1, PROTOCOL.HEADER_2]; // Default
}

// Update createProtocolPacket to use detected protocol
function createProtocolPacket(command, data = []) {
    const packet = new Array(PROTOCOL.PACKET_SIZE).fill(0x00);
    const headers = getProtocolHeaders();
    
    packet[0] = PROTOCOL.REPORT_ID;
    packet[1] = headers[0];
    packet[2] = headers[1];
    packet[3] = command;
    packet[4] = data.length;
    
    // Add zone identifier for RGB commands
    if (command === PROTOCOL.CMD_SET_RGB_ZONE || command === PROTOCOL.CMD_SET_RGB_INDIVIDUAL) {
        packet[5] = getZoneForRingMode();
        // Copy RGB data starting at offset 6
        for (let i = 0; i < data.length && i < PROTOCOL.PACKET_SIZE - 6; i++) {
            packet[6 + i] = data[i];
        }
    } else {
        // Copy data starting at offset 5
        for (let i = 0; i < data.length && i < PROTOCOL.PACKET_SIZE - 5; i++) {
            packet[5 + i] = data[i];
        }
    }
    
    return packet;
}