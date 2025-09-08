// Simple token validation test
const https = require('https');
const { URLSearchParams } = require('url');
require('dotenv').config();

const validateToken = async () => {
    const clientCode = process.env.FLATTRADE_CLIENT_CODE;
    const jKey = process.env.FLATTRADE_TOKEN;
    
    console.log('🔧 Token Validation Test');
    console.log('📋 Client Code:', clientCode);
    console.log('🔑 Token:', jKey);
    
    // Test with the simplest possible API call - GetUserDetails
    const jData = JSON.stringify({ uid: clientCode });
    const params = new URLSearchParams();
    params.append('jData', jData);
    params.append('jKey', jKey);
    
    console.log('\n📝 Testing with GetUserDetails endpoint...');
    console.log('📝 jData:', jData);
    
    try {
        const postData = params.toString();
        const options = {
            hostname: 'piconnect.flattrade.in',
            path: '/PiConnectTP/GetUserDetails',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
        
        console.log('\n📊 Response Status:', response.status);
        
        try {
            const data = JSON.parse(response.data);
            console.log('📊 Response Data:', JSON.stringify(data, null, 2));
            
            if (data.stat === 'Ok') {
                console.log('\n✅ Token is VALID - Authentication successful!');
                console.log('📋 User Details:', data);
            } else {
                console.log('\n❌ Token is INVALID or API call failed');
                console.log('📋 Error:', data.emsg);
                
                if (data.emsg && data.emsg.includes('Session Expired')) {
                    console.log('\n🔄 SOLUTION: The token has expired. You need to:');
                    console.log('1. Log in to Flattrade again');
                    console.log('2. Generate a new token');
                    console.log('3. Update the .env file with the new token');
                }
            }
        } catch (parseError) {
            console.log('\n💥 Failed to parse response as JSON');
            console.log('📄 Raw response:', response.data);
        }
        
    } catch (error) {
        console.error('\n💥 Network error:', error.message);
    }
};

validateToken().catch(console.error);
