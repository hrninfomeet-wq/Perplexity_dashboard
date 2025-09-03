// Quick API Test Script
const axios = require('axios');

async function testAPIs() {
    console.log('🧪 Testing Multi-API System...\n');
    
    const baseURL = 'http://localhost:5000';
    
    try {
        // Test basic health
        console.log('1. Testing basic health endpoint...');
        const health = await axios.get(`${baseURL}/api/health`, { timeout: 5000 });
        console.log('✅ Health:', health.data);
        
        // Test multi-API health
        console.log('\n2. Testing multi-API health...');
        const multiHealth = await axios.get(`${baseURL}/api/multi/health`, { timeout: 5000 });
        console.log('✅ Multi-API Health:', JSON.stringify(multiHealth.data, null, 2));
        
        // Test provider status
        console.log('\n3. Testing provider status...');
        const providers = await axios.get(`${baseURL}/api/providers/status`, { timeout: 5000 });
        console.log('✅ Providers:', JSON.stringify(providers.data, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testAPIs();
