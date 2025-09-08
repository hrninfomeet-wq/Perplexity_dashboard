require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
    console.log('🔧 Testing Authentication Endpoints...\n');
    
    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${BASE_URL}/api/health`);
        console.log(`   Status: ${healthResponse.status}`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log(`   Response:`, healthData);
        }
        console.log('');
        
        // Test 2: Flattrade auth URL generation
        console.log('2. Testing Flattrade auth URL generation...');
        const authResponse = await fetch(`${BASE_URL}/api/auth/generate-login-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ provider: 'flattrade' })
        });
        console.log(`   Status: ${authResponse.status}`);
        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log(`   Response:`, authData);
            
            if (authData.authUrl) {
                console.log(`   ✅ Auth URL generated: ${authData.authUrl}`);
                console.log(`   🔒 Token Valid: ${authData.tokenValid}`);
                console.log(`   📝 Message: ${authData.message}`);
            }
        } else {
            const errorData = await authResponse.text();
            console.log(`   ❌ Error: ${errorData}`);
        }
        console.log('');
        
        // Test 3: Token exchange (with dummy data - will fail but shows endpoint works)
        console.log('3. Testing token exchange endpoint...');
        const tokenResponse = await fetch(`${BASE_URL}/api/auth/flattrade/exchange-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                request_code: 'DUMMY_CODE_FOR_TESTING'
            })
        });
        console.log(`   Status: ${tokenResponse.status}`);
        const tokenData = await tokenResponse.json();
        console.log(`   Response:`, tokenData);
        console.log('');
        
        // Test 4: Environment variables check
        console.log('4. Checking environment variables...');
        console.log(`   FLATTRADE_API_KEY: ${process.env.FLATTRADE_API_KEY ? '✅ Set' : '❌ Missing'}`);
        console.log(`   FLATTRADE_API_SECRET: ${process.env.FLATTRADE_API_SECRET ? '✅ Set' : '❌ Missing'}`);
        console.log(`   FLATTRADE_CLIENT_CODE: ${process.env.FLATTRADE_CLIENT_CODE ? '✅ Set' : '❌ Missing'}`);
        console.log(`   FLATTRADE_TOKEN: ${process.env.FLATTRADE_TOKEN ? '✅ Set' : '❌ Missing'}`);
        console.log(`   FLATTRADE_REQUEST_CODE: ${process.env.FLATTRADE_REQUEST_CODE ? '✅ Set' : '❌ Missing'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the server is running on http://localhost:5000');
        }
    }
}

// Run the tests
testEndpoints();
