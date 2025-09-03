const axios = require('axios');

async function testEnhancedProviders() {
    try {
        console.log('🔍 Testing Enhanced Provider Features...\n');
        
        // Test 1: Multi-API Health
        console.log('1. Testing Multi-API Health...');
        const healthResponse = await axios.get('http://localhost:5001/api/multi/health');
        console.log('✅ Multi-API Health:', JSON.stringify(healthResponse.data, null, 2));
        
        // Test 2: FYERS Provider Status (Enhanced feature - daily usage tracking)
        console.log('\n2. Testing FYERS Enhanced Status...');
        try {
            const fyersResponse = await axios.get('http://localhost:5001/api/multi/providers/fyers/status');
            console.log('✅ FYERS Enhanced Status:', JSON.stringify(fyersResponse.data, null, 2));
        } catch (error) {
            console.log('❌ FYERS Status Error:', error.response?.status, error.response?.data || error.message);
        }
        
        // Test 3: AliceBlue Provider Status (Enhanced feature - OAuth 2.0)
        console.log('\n3. Testing AliceBlue Enhanced Status...');
        try {
            const aliceblueResponse = await axios.get('http://localhost:5001/api/multi/providers/aliceblue/status');
            console.log('✅ AliceBlue Enhanced Status:', JSON.stringify(aliceblueResponse.data, null, 2));
        } catch (error) {
            console.log('❌ AliceBlue Status Error:', error.response?.status, error.response?.data || error.message);
        }
        
        // Test 4: All Providers Status
        console.log('\n4. Testing All Providers Status...');
        try {
            const allProvidersResponse = await axios.get('http://localhost:5001/api/multi/providers/status');
            console.log('✅ All Providers Status:', JSON.stringify(allProvidersResponse.data, null, 2));
        } catch (error) {
            console.log('❌ All Providers Status Error:', error.response?.status, error.response?.data || error.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEnhancedProviders();
