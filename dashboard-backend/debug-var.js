// Simple test for VaR endpoint to debug the issue
const http = require('http');

const testData = JSON.stringify({
    prices: [100, 102, 98, 101, 97, 105, 103, 99]
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v6/risk/var',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
    },
    timeout: 10000
};

console.log('🧪 Testing VaR endpoint...');
console.log('📊 Test data:', testData);

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`📈 Status Code: ${res.statusCode}`);
        console.log('📊 Response Headers:', res.headers);
        console.log('💾 Response Body:', data);
        
        if (res.statusCode === 200) {
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ VaR Calculation Success:', JSON.stringify(jsonData, null, 2));
            } catch (error) {
                console.log('❌ JSON Parse Error:', error.message);
            }
        } else {
            console.log('❌ VaR Calculation Failed');
            try {
                const errorData = JSON.parse(data);
                console.log('🚨 Error Details:', JSON.stringify(errorData, null, 2));
            } catch (error) {
                console.log('🚨 Raw Error:', data);
            }
        }
    });
});

req.on('error', (error) => {
    console.log('🔥 Request Error:', error.message);
});

req.on('timeout', () => {
    console.log('⏰ Request Timeout');
    req.destroy();
});

req.write(testData);
req.end();
