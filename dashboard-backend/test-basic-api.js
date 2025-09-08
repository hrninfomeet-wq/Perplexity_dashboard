const axios = require('axios');
require('dotenv').config();

async function testBasicAPI() {
    console.log('🧪 Testing Basic Flattrade API...\n');
    
    const token = process.env.FLATTRADE_TOKEN;
    const clientCode = process.env.FLATTRADE_CLIENT_CODE;
    
    console.log('🔑 Token (first 20 chars):', token?.substring(0, 20) + '...');
    console.log('👤 Client Code:', clientCode);
    
    // Test 1: Simple UserDetails API
    console.log('\n📡 Test 1: UserDetails API');
    try {
        const userDetailsPayload = { uid: clientCode };
        const userDetailsBody = `jData=${JSON.stringify(userDetailsPayload)}&jKey=${token}`;
        
        console.log('📝 UserDetails jData:', JSON.stringify(userDetailsPayload));
        console.log('📝 Body length:', userDetailsBody.length);
        
        const userResponse = await axios.post('https://authapi.flattrade.in/UserDetails', userDetailsBody, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });
        
        console.log('✅ UserDetails Success:', userResponse.data);
    } catch (error) {
        console.log('❌ UserDetails Error:', error.response?.data || error.message);
    }
    
    // Test 2: Limits API
    console.log('\n📡 Test 2: Limits API');
    try {
        const limitsPayload = { 
            uid: clientCode,
            actid: clientCode
        };
        const limitsBody = `jData=${JSON.stringify(limitsPayload)}&jKey=${token}`;
        
        console.log('📝 Limits jData:', JSON.stringify(limitsPayload));
        console.log('📝 Body length:', limitsBody.length);
        
        const limitsResponse = await axios.post('https://authapi.flattrade.in/Limits', limitsBody, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });
        
        console.log('✅ Limits Success:', limitsResponse.data);
    } catch (error) {
        console.log('❌ Limits Error:', error.response?.data || error.message);
    }
    
    // Test 3: Holdings API
    console.log('\n📡 Test 3: Holdings API');
    try {
        const holdingsPayload = { 
            uid: clientCode,
            actid: clientCode
        };
        const holdingsBody = `jData=${JSON.stringify(holdingsPayload)}&jKey=${token}`;
        
        console.log('📝 Holdings jData:', JSON.stringify(holdingsPayload));
        console.log('📝 Body length:', holdingsBody.length);
        
        const holdingsResponse = await axios.post('https://authapi.flattrade.in/Holdings', holdingsBody, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });
        
        console.log('✅ Holdings Success:', holdingsResponse.data);
    } catch (error) {
        console.log('❌ Holdings Error:', error.response?.data || error.message);
    }
    
    // Test 4: TopList API (the problematic one)
    console.log('\n📡 Test 4: TopList API');
    try {
        const topListPayload = { 
            uid: clientCode,
            exch: 'NSE',
            tb: 'T',
            bskt: 'BO',
            crt: 'P'
        };
        const topListBody = `jData=${JSON.stringify(topListPayload)}&jKey=${token}`;
        
        console.log('📝 TopList jData:', JSON.stringify(topListPayload));
        console.log('📝 Body length:', topListBody.length);
        
        const topListResponse = await axios.post('https://authapi.flattrade.in/TopList', topListBody, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });
        
        console.log('✅ TopList Success:', topListResponse.data);
    } catch (error) {
        console.log('❌ TopList Error:', error.response?.data || error.message);
    }
}

testBasicAPI().catch(console.error);
