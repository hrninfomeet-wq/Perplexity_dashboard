// Test script to debug Flattrade API call format
const https = require('https');
const { URLSearchParams } = require('url');
require('dotenv').config();

const testFlattradeAPI = async () => {
    const baseURL = 'https://piconnect.flattrade.in/PiConnectTP/';
    const clientCode = process.env.FLATTRADE_CLIENT_CODE;
    const jKey = process.env.FLATTRADE_TOKEN;
    
    console.log('🔧 Debug Information:');
    console.log('📋 Client Code:', clientCode);
    console.log('🔑 Token (first 10 chars):', jKey ? jKey.substring(0, 10) + '...' : 'NOT SET');
    console.log('🌐 Base URL:', baseURL);
    
    // Test 1: Basic structure check
    const jDataObject = {
        uid: clientCode,
        exch: 'NSE',
        tb: 'T',
        bskt: 'BO',
        crt: 'P'
    };
    
    console.log('\n📝 jData Object:', jDataObject);
    
    const jDataString = JSON.stringify(jDataObject);
    console.log('📝 jData String:', jDataString);
    console.log('📝 jData String Length:', jDataString.length);
    
    // Test 2: Check URLSearchParams encoding
    const params = new URLSearchParams();
    params.append('jData', jDataString);
    params.append('jKey', jKey);
    
    console.log('\n🔧 URL Encoded Body:');
    console.log(params.toString());
    
    // Test 3: Try the actual API call
    try {
        console.log('\n📡 Making API call to TopList...');
        
        const postData = params.toString();
        const options = {
            hostname: 'piconnect.flattrade.in',
            path: '/PiConnectTP/TopList',
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
                res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
        
        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Headers:', response.headers);
        
        const data = JSON.parse(response.data);
        console.log('\n📊 Response Data:', JSON.stringify(data, null, 2));
        
        if (data.stat !== 'Ok') {
            console.error('\n❌ API Error Details:');
            console.error('Status:', data.stat);
            console.error('Error Message:', data.emsg);
            console.error('Full Response:', data);
        } else {
            console.log('\n✅ API call successful!');
        }
        
    } catch (error) {
        console.error('\n💥 Network/Parse Error:', error.message);
    }
    
    // Test 4: Try a simpler API call (if TopList fails)
    try {
        console.log('\n🔄 Trying alternate format...');
        
        // Try with minimal jData
        const simpleJData = JSON.stringify({ uid: clientCode });
        const simpleParams = new URLSearchParams();
        simpleParams.append('jData', simpleJData);
        simpleParams.append('jKey', jKey);
        
        console.log('📝 Simple jData:', simpleJData);
        
        const postData2 = simpleParams.toString();
        const options2 = {
            hostname: 'piconnect.flattrade.in',
            path: '/PiConnectTP/GetLimits',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData2)
            }
        };
        
        const response2 = await new Promise((resolve, reject) => {
            const req = https.request(options2, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            });
            req.on('error', reject);
            req.write(postData2);
            req.end();
        });
        
        const data2 = JSON.parse(response2.data);
        console.log('\n📊 GetLimits Response:', JSON.stringify(data2, null, 2));
        
    } catch (error) {
        console.error('\n💥 Secondary test error:', error.message);
    }
};

testFlattradeAPI().catch(console.error);
