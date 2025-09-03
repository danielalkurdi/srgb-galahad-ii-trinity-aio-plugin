#!/usr/bin/env node

// Hardware Testing for SignalRGB Plugin
// Detects and tests with actual Galahad II hardware

const { ProtocolValidator, TEST_CONFIG } = require('./protocol_test.js');

// Try to require node-hid for hardware access
let HID;
try {
    HID = require('node-hid');
} catch (error) {
    console.log('⚠️  node-hid not installed. Install with: npm install node-hid');
    console.log('ℹ️  Running in simulation mode only...\n');
}

// Known device configurations
const DEVICE_CONFIGS = {
    0x7373: { name: "Trinity", ledCount: 24, interface: 0 },
    0x7371: { name: "Trinity Performance", ledCount: 24, interface: 0 },
    0x7395: { name: "LCD", ledCount: 24, interface: 1, usagePage: 0xFF1A }
};

class HardwareTestRunner extends ProtocolValidator {
    constructor() {
        super();
        this.connectedDevice = null;
        this.deviceInfo = null;
    }

    // Detect connected Galahad II devices
    detectHardware() {
        console.log('🔍 Scanning for Lian Li Galahad II devices...\n');
        
        if (!HID) {
            console.log('❌ Cannot detect hardware without node-hid package');
            console.log('💡 Install with: npm install node-hid');
            console.log('🔄 Continuing with simulation mode...\n');
            return false;
        }

        try {
            const devices = HID.devices();
            const lianLiDevices = devices.filter(device => device.vendorId === 0x0416);
            
            console.log('🔍 Raw device scan results:');
            lianLiDevices.forEach(device => {
                const pidHex = device.productId.toString(16).toUpperCase().padStart(4, '0');
                console.log(`   Found: VID_0416&PID_${pidHex} - ${device.product || 'Unknown'}`);
                console.log(`   Interface: ${device.interface || 'N/A'}, Usage: ${device.usage || 'N/A'}, UsagePage: ${device.usagePage || 'N/A'}`);
            });
            
            const galahadDevices = lianLiDevices.filter(device => {
                const pid = device.productId;
                return Object.keys(DEVICE_CONFIGS).map(k => parseInt(k, 16)).includes(pid);
            });

            if (galahadDevices.length === 0) {
                console.log('❌ No recognized Galahad II devices detected');
                if (lianLiDevices.length > 0) {
                    console.log('ℹ️  Found Lian Li devices with different PIDs or interfaces:');
                    lianLiDevices.forEach(device => {
                        const pidHex = device.productId.toString(16).toUpperCase().padStart(4, '0');
                        console.log(`   PID: 0x${pidHex} - ${device.product || 'Unknown'}`);
                        console.log(`   Path: ${device.path || 'N/A'}`);
                        console.log(`   Interface: ${device.interface}, UsagePage: 0x${(device.usagePage || 0).toString(16)}`);
                    });
                    console.log('💡 Trying to connect to available interfaces...\n');
                    
                    // Try to connect to the first available device anyway
                    if (lianLiDevices.length > 0) {
                        this.deviceInfo = lianLiDevices[0];
                        console.log('🔧 Attempting connection to first available interface...');
                        return true;
                    }
                } else {
                    console.log('❌ No Lian Li devices found at all');
                    console.log('🔧 Troubleshooting steps:');
                    console.log('   1. Ensure pump USB is connected to motherboard');
                    console.log('   2. Close L-Connect completely');
                    console.log('   3. Check Device Manager for USB devices');
                    console.log('   4. Try different USB ports\n');
                }
                return false;
            }

            // Found device(s) - use galahadDevices for classification
            console.log('✅ Found Galahad II device(s):');
            galahadDevices.forEach((device, index) => {
                const pidHex = device.productId.toString(16).toUpperCase().padStart(4, '0');
                const config = DEVICE_CONFIGS[device.productId];  // Use numeric PID directly
                console.log(`   ${index + 1}. ${config?.name || 'Unknown'} (PID: 0x${pidHex})`);
                console.log(`      Product: ${device.product || 'Unknown'}`);
                console.log(`      Interface: ${device.interface || 'Unknown'}`);
                console.log(`      Path: ${device.path}`);
            });

            // Use the first recognized device found
            this.deviceInfo = galahadDevices[0];
            const pidHex = this.deviceInfo.productId.toString(16).toUpperCase().padStart(4, '0');
            
            console.log(`\n🎯 Selected: ${DEVICE_CONFIGS[this.deviceInfo.productId]?.name} (0x${pidHex})`);
            
            return true;
            
        } catch (error) {
            console.log('❌ Error detecting hardware:', error.message);
            return false;
        }
    }

    // Connect to the physical device
    connectToDevice() {
        if (!this.deviceInfo) {
            console.log('❌ No device info available');
            return false;
        }

        try {
            console.log('🔌 Connecting to device...');
            this.connectedDevice = new HID.HID(this.deviceInfo.path);
            
            console.log('✅ Successfully connected to hardware!');
            console.log('⚠️  CAUTION: Testing with real hardware - RGB will change!\n');
            
            return true;
            
        } catch (error) {
            console.log('❌ Failed to connect to device:', error.message);
            console.log('💡 Make sure L-Connect is completely closed');
            console.log('💡 Try running as Administrator\n');
            return false;
        }
    }

    // Override test command to use real hardware
    async testCommand(name, command, data, expectError = false) {
        console.log(`Testing: ${name}`);
        
        try {
            const packet = this.createTestPacket(command, data);
            const validation = this.validatePacket(packet, command);
            
            if (!validation.valid && !expectError) {
                console.log(`❌ ${name}: Validation failed -`, validation.errors);
                return false;
            }
            
            if (this.connectedDevice) {
                // Send to real hardware!
                this.connectedDevice.write(packet);
                
                if (expectError) {
                    console.log(`⚠️ ${name}: Expected error, but no exception thrown`);
                    return false;
                } else {
                    console.log(`✅ ${name}: SUCCESS - Command sent to hardware!`);
                    return true;
                }
            } else {
                console.log(`ℹ️ ${name}: Device not connected, structure validated`);
                return true;
            }
            
        } catch (error) {
            if (expectError) {
                console.log(`✅ ${name}: Expected error caught -`, error.message);
                return true;
            } else {
                console.log(`❌ ${name}: Hardware error -`, error.message);
                return false;
            }
        }
    }

    // Enhanced test with hardware delays
    async testColors() {
        const colors = TEST_CONFIG.testColors;
        
        for (const color of colors) {
            const success = this.testColorCommand(color.r, color.g, color.b, color.name);
            this.testResults.push({ test: `Color: ${color.name}`, success });
            
            if (success && this.connectedDevice) {
                // Give time to see the color change on hardware
                console.log(`   → RGB should now be ${color.name} - waiting 2 seconds...`);
                await this.delay(2000);
            }
        }
    }

    // Cleanup
    disconnect() {
        if (this.connectedDevice) {
            try {
                console.log('🔌 Disconnecting from device...');
                this.connectedDevice.close();
                console.log('✅ Device disconnected');
            } catch (error) {
                console.log('⚠️ Error during disconnect:', error.message);
            }
        }
    }
}

async function runHardwareTests() {
    console.log('🧪 SignalRGB Hardware Test Suite');
    console.log('================================\n');
    
    const tester = new HardwareTestRunner();
    
    try {
        // Step 1: Detect hardware
        const hardwareFound = tester.detectHardware();
        
        if (hardwareFound) {
            // Step 2: Connect to device
            const connected = tester.connectToDevice();
            
            if (connected) {
                console.log('🚨 HARDWARE MODE: Your pump RGB will change during testing!');
                console.log('Press Ctrl+C to abort if needed\n');
                
                // Give user a chance to abort
                await tester.delay(3000);
            }
        }
        
        // Step 3: Run tests (hardware or simulation mode)
        await tester.runFullTest();
        
        // Step 4: Cleanup
        tester.disconnect();
        
    } catch (error) {
        console.error('🚨 Test suite error:', error);
        tester.disconnect();
        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n🛑 Test interrupted by user');
    process.exit(0);
});

// Run if called directly
if (require.main === module) {
    runHardwareTests().catch(error => {
        console.error('❌ Hardware test failed:', error);
        process.exit(1);
    });
}

module.exports = { HardwareTestRunner, runHardwareTests };