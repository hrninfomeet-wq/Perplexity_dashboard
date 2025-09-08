const axios = require('axios');
require('dotenv').config();

async function testTokenValidity() {
    console.log('🔐 Testing Token Validity...\n');
    
    const token = process.env.FLATTRADE_TOKEN;
    const clientCode = process.env.FLATTRADE_CLIENT_CODE;
    
    console.log('🔑 Token (first 20 chars):', token?.substring(0, 20) + '...');
    console.log('👤 Client Code:', clientCode);
    console.log('🌐 Base URL: https://piconnect.flattrade.in/PiConnectTP/\n');
    
    // Test with minimal data - just UserDetails
    try {
        const payload = { uid: clientCode };
        const jDataString = JSON.stringify(payload);
        
        console.log('📝 Testing with minimal payload:', payload);
        console.log('📝 jData string:', jDataString);
        console.log('📝 jData string length:', jDataString.length);
        
        // Manual body construction to avoid any encoding issues
        const body = `jData=${jDataString}&jKey=${token}`;
        console.log('📝 Body length:', body.length);
        console.log('📝 Body preview:', body.substring(0, 100) + '...');
        
        const response = await axios.post('https://piconnect.flattrade.in/PiConnectTP/UserDetails', body, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 15000
        });
        
        console.log('\n✅ SUCCESS! UserDetails API works!');
        console.log('📊 Response:', response.data);
        
        // If UserDetails works, test TopList
        console.log('\n📡 Now testing TopList API...');
        await testTopList();
        
    } catch (error) {
        console.log('\n❌ UserDetails API failed:');
        console.log('Status:', error.response?.status);
        console.log('Status Text:', error.response?.statusText);
        console.log('Response:', error.response?.data);
        console.log('Error Message:', error.message);
        
        if (error.response?.data?.emsg) {
            console.log('\n🔍 API Error Message:', error.response.data.emsg);
            
            if (error.response.data.emsg.includes('Invalid Token')) {
                console.log('\n🚨 TOKEN INVALID! Need to re-authenticate with Flattrade.');
            } else if (error.response.data.emsg.includes('Session expired')) {
                console.log('\n🚨 SESSION EXPIRED! Need to refresh token.');
            }
        }
    }
}

async function testTopList() {
    const token = process.env.FLATTRADE_TOKEN;
    const clientCode = process.env.FLATTRADE_CLIENT_CODE;
    
    try {
        const payload = { 
            uid: clientCode,
            exch: 'NSE',
            tb: 'T',
            bskt: 'BO',
            crt: 'P'
        };
        const jDataString = JSON.stringify(payload);
        const body = `jData=${jDataString}&jKey=${token}`;
        
        console.log('📝 TopList payload:', payload);
        console.log('📝 TopList jData:', jDataString);
        
        const response = await axios.post('https://piconnect.flattrade.in/PiConnectTP/TopList', body, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 15000
        });
        
        console.log('\n✅ TopList API also works!');
        console.log('📊 TopList Response:', response.data);
        
    } catch (error) {
        console.log('\n❌ TopList API failed:');
        console.log('Response:', error.response?.data);
    }
}

testTokenValidity().catch(console.error);
