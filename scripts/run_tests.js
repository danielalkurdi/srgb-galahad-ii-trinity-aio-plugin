#!/usr/bin/env node

// Test Runner for SignalRGB Plugin Protocol Validation
// Executes protocol tests in Node.js environment

const { ProtocolValidator, TEST_CONFIG } = require('./protocol_test.js');

async function runAllTests() {
    console.log('🚀 SignalRGB Plugin Protocol Test Suite');
    console.log('======================================\n');
    
    const validator = new ProtocolValidator();
    
    // Run the full test suite
    await validator.runFullTest();
    
    console.log('\n✅ Test execution completed!');
    console.log('Note: Tests run in simulation mode since no physical device is connected.');
    console.log('For hardware testing, run tests within SignalRGB environment.');
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };