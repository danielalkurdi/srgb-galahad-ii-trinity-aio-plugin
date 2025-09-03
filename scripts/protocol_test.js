// Protocol Testing and Validation Utility
// Test various protocol commands and validate responses
// Run this as part of the SignalRGB plugin for debugging

// Test configuration
const TEST_CONFIG = {
    testColors: [
        { name: "Red", r: 255, g: 0, b: 0 },
        { name: "Green", r: 0, g: 255, b: 0 },
        { name: "Blue", r: 0, g: 0, b: 255 },
        { name: "White", r: 255, g: 255, b: 255 },
        { name: "Purple", r: 255, g: 0, b: 255 },
        { name: "Off", r: 0, g: 0, b: 0 }
    ],
    delayBetweenTests: 2000,
    packetValidation: true
};

// Protocol validation functions
class ProtocolValidator {
    constructor() {
        this.testResults = [];
        this.currentTest = 0;
    }
    
    // Validate packet structure
    validatePacket(packet, expectedCommand) {
        const validation = {
            valid: true,
            errors: []
        };
        
        // Check packet size
        if (packet.length !== 64) {
            validation.valid = false;
            validation.errors.push(`Invalid packet size: ${packet.length}, expected 64`);
        }
        
        // Check report ID
        if (packet[0] !== 0x00) {
            validation.valid = false;
            validation.errors.push(`Invalid report ID: 0x${packet[0].toString(16)}, expected 0x00`);
        }
        
        // Check headers
        if (packet[1] !== 0x16 || packet[2] !== 0x16) {
            validation.valid = false;
            validation.errors.push(`Invalid headers: 0x${packet[1].toString(16)}, 0x${packet[2].toString(16)}, expected 0x16, 0x16`);
        }
        
        // Check command
        if (expectedCommand && packet[3] !== expectedCommand) {
            validation.valid = false;
            validation.errors.push(`Invalid command: 0x${packet[3].toString(16)}, expected 0x${expectedCommand.toString(16)}`);
        }
        
        return validation;
    }
    
    // Test basic color commands
    testColorCommand(r, g, b, colorName = "Unknown") {
        console.log(`Testing color: ${colorName} (${r}, ${g}, ${b})`);
        
        try {
            // Create test packet
            const packet = this.createTestPacket(0x06, [0x00, r, g, b]);
            
            // Validate packet structure
            const validation = this.validatePacket(packet, 0x06);
            if (!validation.valid) {
                console.log(`Validation failed for ${colorName}:`, validation.errors);
                return false;
            }
            
            // Send to device (if available)
            if (typeof device !== 'undefined' && device.write) {
                device.write(packet, 64);
                console.log(`✅ Sent ${colorName} command successfully`);
                return true;
            } else {
                console.log(`⚠️ Device not available, packet structure validated for ${colorName}`);
                return true;
            }
            
        } catch (error) {
            console.log(`❌ Error testing ${colorName}:`, error);
            return false;
        }
    }
    
    // Create test packet
    createTestPacket(command, data = []) {
        const packet = new Array(64).fill(0x00);
        
        packet[0] = 0x00;  // Report ID
        packet[1] = 0x16;  // Header 1
        packet[2] = 0x16;  // Header 2
        packet[3] = command;
        packet[4] = data.length;
        
        for (let i = 0; i < data.length && i < 59; i++) {
            packet[5 + i] = data[i];
        }
        
        return packet;
    }
    
    // Run comprehensive protocol test
    async runFullTest() {
        console.log("🚀 Starting Protocol Validation Test Suite");
        console.log("==========================================");
        
        this.testResults = [];
        
        // Test 1: Initialization sequence
        console.log("\n📋 Test 1: Initialization Commands");
        await this.testInitialization();
        
        // Test 2: Color commands
        console.log("\n🎨 Test 2: Color Commands");
        await this.testColors();
        
        // Test 3: Ring control
        console.log("\n💍 Test 3: Ring Control Commands");
        await this.testRingControl();
        
        // Test 4: Brightness control
        console.log("\n☀️ Test 4: Brightness Commands");
        await this.testBrightness();
        
        // Test 5: Error handling
        console.log("\n⚠️ Test 5: Error Handling");
        await this.testErrorHandling();
        
        // Summary
        this.printTestSummary();
    }
    
    // Test initialization sequence
    async testInitialization() {
        const initTests = [
            { name: "Reset", command: 0xFF, data: [] },
            { name: "Set LED Count", command: 0x02, data: [24] },
            { name: "Initialize RGB", command: 0x01, data: [0x01, 0x00] }
        ];
        
        for (const test of initTests) {
            const success = await this.testCommand(test.name, test.command, test.data);
            this.testResults.push({ test: `Init: ${test.name}`, success });
            
            if (success) {
                await this.delay(500); // Wait for device processing
            }
        }
    }
    
    // Test color commands
    async testColors() {
        for (const color of TEST_CONFIG.testColors) {
            const success = this.testColorCommand(color.r, color.g, color.b, color.name);
            this.testResults.push({ test: `Color: ${color.name}`, success });
            
            if (success) {
                await this.delay(TEST_CONFIG.delayBetweenTests);
            }
        }
    }
    
    // Test ring control
    async testRingControl() {
        const ringTests = [
            { name: "All Zones Red", zone: 0x00, r: 255, g: 0, b: 0 },
            { name: "Outer Ring Green", zone: 0x01, r: 0, g: 255, b: 0 },
            { name: "Inner Ring Blue", zone: 0x02, r: 0, g: 0, b: 255 },
            { name: "Both Rings White", zone: 0x03, r: 255, g: 255, b: 255 }
        ];
        
        for (const test of ringTests) {
            const success = await this.testCommand(test.name, 0x06, [test.zone, test.r, test.g, test.b]);
            this.testResults.push({ test: `Ring: ${test.name}`, success });
            
            if (success) {
                await this.delay(TEST_CONFIG.delayBetweenTests);
            }
        }
    }
    
    // Test brightness control
    async testBrightness() {
        const brightnessLevels = [25, 50, 75, 100];\n        \n        for (const level of brightnessLevels) {\n            const success = await this.testCommand(`Brightness ${level}%`, 0x08, [level]);\n            this.testResults.push({ test: `Brightness: ${level}%`, success });\n            \n            if (success) {\n                // Set white color to see brightness effect\n                await this.testCommand(\"White for brightness\", 0x06, [0x00, 255, 255, 255]);\n                await this.delay(1500);\n            }\n        }\n    }\n    \n    // Test error handling\n    async testErrorHandling() {\n        const errorTests = [\n            { name: \"Invalid Command\", command: 0xAA, data: [0x01], expectError: true },\n            { name: \"Invalid Zone\", command: 0x06, data: [0xFF, 255, 0, 0], expectError: true },\n            { name: \"Oversized Data\", command: 0x06, data: new Array(60).fill(0xFF), expectError: true }\n        ];\n        \n        for (const test of errorTests) {\n            const success = await this.testCommand(test.name, test.command, test.data, test.expectError);\n            this.testResults.push({ test: `Error: ${test.name}`, success });\n        }\n    }\n    \n    // Test individual command\n    async testCommand(name, command, data, expectError = false) {\n        console.log(`Testing: ${name}`);\n        \n        try {\n            const packet = this.createTestPacket(command, data);\n            const validation = this.validatePacket(packet, command);\n            \n            if (!validation.valid && !expectError) {\n                console.log(`❌ ${name}: Validation failed -`, validation.errors);\n                return false;\n            }\n            \n            if (typeof device !== 'undefined' && device.write) {\n                device.write(packet, 64);\n                \n                if (expectError) {\n                    console.log(`⚠️ ${name}: Expected error, but no exception thrown`);\n                    return false;\n                } else {\n                    console.log(`✅ ${name}: Success`);\n                    return true;\n                }\n            } else {\n                console.log(`ℹ️ ${name}: Device not available, structure validated`);\n                return true;\n            }\n            \n        } catch (error) {\n            if (expectError) {\n                console.log(`✅ ${name}: Expected error caught -`, error.message);\n                return true;\n            } else {\n                console.log(`❌ ${name}: Unexpected error -`, error);\n                return false;\n            }\n        }\n    }\n    \n    // Print test summary\n    printTestSummary() {\n        console.log(\"\\n📊 Test Results Summary\");\n        console.log(\"========================\");\n        \n        const passed = this.testResults.filter(r => r.success).length;\n        const total = this.testResults.length;\n        const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;\n        \n        console.log(`Total Tests: ${total}`);\n        console.log(`Passed: ${passed}`);\n        console.log(`Failed: ${total - passed}`);\n        console.log(`Success Rate: ${percentage}%`);\n        \n        console.log(\"\\n📋 Individual Results:\");\n        this.testResults.forEach((result, index) => {\n            const status = result.success ? \"✅\" : \"❌\";\n            console.log(`${index + 1}. ${status} ${result.test}`);\n        });\n        \n        console.log(\"\\n🏁 Protocol validation complete!\");\n    }\n    \n    // Utility delay function\n    delay(ms) {\n        return new Promise(resolve => setTimeout(resolve, ms));\n    }\n}\n\n// Export for use in SignalRGB plugin\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = { ProtocolValidator, TEST_CONFIG };\n}\n\n// Auto-run if in browser/plugin environment\nif (typeof window !== 'undefined' || typeof global !== 'undefined') {\n    // Can be triggered from SignalRGB plugin for testing\n    window.runProtocolTest = function() {\n        const validator = new ProtocolValidator();\n        validator.runFullTest();\n    };\n    \n    console.log(\"Protocol testing utilities loaded. Call runProtocolTest() to start.\");\n}