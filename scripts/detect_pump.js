#!/usr/bin/env node

// Simple pump detection without requiring node-hid installation
// Uses Windows system commands to detect the pump

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Known device configurations
const DEVICE_CONFIGS = {
    0x7373: { name: "Trinity", ledCount: 24 },
    0x7371: { name: "Trinity Performance", ledCount: 24 },  
    0x7395: { name: "LCD", ledCount: 24 }
};

async function detectPumpWindows() {
    console.log('🔍 Scanning for Lian Li Galahad II devices...\n');
    
    try {
        // Use PowerShell to query USB devices
        const psCommand = `
Get-PnpDevice -PresentOnly | 
Where-Object { $_.InstanceId -match "VID_0416" } | 
Select-Object FriendlyName, InstanceId, Status | 
ConvertTo-Json
        `;
        
        const { stdout, stderr } = await execAsync(`powershell -Command "${psCommand}"`);
        
        if (stderr) {
            console.log('⚠️ PowerShell warning:', stderr);
        }
        
        if (!stdout.trim()) {
            console.log('❌ No Lian Li devices found (VID 0x0416)');
            console.log('🔧 Troubleshooting:');
            console.log('   1. Ensure pump USB cable is connected to motherboard');
            console.log('   2. Close L-Connect completely (check Task Manager)');
            console.log('   3. Check Windows Device Manager for USB devices');
            console.log('   4. Try different USB ports\n');
            return false;
        }
        
        try {
            const devices = JSON.parse(stdout);
            const deviceArray = Array.isArray(devices) ? devices : [devices];
            
            console.log('✅ Found Lian Li devices:');
            let galahad2Found = false;
            
            deviceArray.forEach((device, index) => {
                console.log(`\n${index + 1}. ${device.FriendlyName || 'Unknown Device'}`);
                console.log(`   Status: ${device.Status}`);
                console.log(`   Instance ID: ${device.InstanceId}`);
                
                // Extract PID from InstanceId
                const pidMatch = device.InstanceId.match(/PID_([0-9A-F]{4})/i);
                if (pidMatch) {
                    const pid = parseInt(pidMatch[1], 16);
                    const config = DEVICE_CONFIGS[pid];
                    
                    if (config) {
                        console.log(`   🎯 MATCH: ${config.name} Galahad II (PID: 0x${pid.toString(16).toUpperCase()})`);
                        galahad2Found = true;
                    } else {
                        console.log(`   ℹ️  PID: 0x${pid.toString(16).toUpperCase()} (not a known Galahad II variant)`);
                    }
                }
                
                // Check if device is working
                if (device.Status !== 'OK') {
                    console.log(`   ⚠️  Device status is not OK: ${device.Status}`);
                }
            });
            
            if (galahad2Found) {
                console.log('\n✅ Galahad II pump detected and ready for testing!');
                console.log('💡 You can now run hardware tests with: node scripts/hardware_test.js');
                console.log('⚠️  Note: You need to install node-hid for actual hardware communication');
                console.log('   Install with: npm install node-hid');
            } else {
                console.log('\n❌ No recognized Galahad II devices found');
                console.log('💡 Found Lian Li devices but with different PIDs');
                console.log('💡 You may need to update the plugin configuration');
            }
            
            return galahad2Found;
            
        } catch (parseError) {
            console.log('⚠️ Could not parse device information:', parseError.message);
            console.log('Raw output:', stdout);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Error detecting devices:', error.message);
        console.log('💡 Make sure you\'re running this on Windows with PowerShell available');
        return false;
    }
}

async function detectPumpGeneric() {
    console.log('🔍 Generic USB device detection...\n');
    
    // Try to use node-hid if available
    try {
        const HID = require('node-hid');
        const devices = HID.devices();
        
        console.log('📱 USB HID devices found:', devices.length);
        
        const lianLiDevices = devices.filter(device => device.vendorId === 0x0416);
        
        if (lianLiDevices.length === 0) {
            console.log('❌ No Lian Li devices found (VID 0x0416)');
            return false;
        }
        
        console.log(`✅ Found ${lianLiDevices.length} Lian Li device(s):`);
        
        let galahad2Found = false;
        lianLiDevices.forEach((device, index) => {
            const config = DEVICE_CONFIGS[device.productId];
            console.log(`\n${index + 1}. ${device.product || 'Unknown Product'}`);
            console.log(`   VID: 0x${device.vendorId.toString(16).toUpperCase()}`);
            console.log(`   PID: 0x${device.productId.toString(16).toUpperCase()}`);
            console.log(`   Interface: ${device.interface}`);
            
            if (config) {
                console.log(`   🎯 MATCH: ${config.name} Galahad II`);
                galahad2Found = true;
            }
        });
        
        return galahad2Found;
        
    } catch (error) {
        console.log('⚠️ node-hid not available:', error.message);
        console.log('💡 Install with: npm install node-hid');
        return false;
    }
}

async function main() {
    console.log('🔍 Lian Li Galahad II Pump Detection\n');
    
    // Detect platform
    const isWindows = process.platform === 'win32';
    
    let found = false;
    
    if (isWindows) {
        found = await detectPumpWindows();
    } else {
        console.log('ℹ️  Non-Windows platform detected, using generic detection...');
        found = await detectPumpGeneric();
    }
    
    if (!found) {
        console.log('\n🔧 Next Steps:');
        console.log('1. Verify pump is physically connected via USB');
        console.log('2. Close L-Connect completely (check Task Manager)');
        console.log('3. Try running as Administrator');
        console.log('4. Check Device Manager → Universal Serial Bus devices');
        console.log('5. Try different USB ports on your motherboard\n');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { detectPumpWindows, detectPumpGeneric };