// quick-test.js - Simple test for multi-API endpoints
const http = require('http');

function testEndpoint(path, description) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        console.log(`\n🧪 Testing ${description}: ${path}`);
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`✅ ${description} - Status: ${res.statusCode}`);
                    console.log(`📊 Response:`, JSON.stringify(jsonData, null, 2));
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    console.log(`✅ ${description} - Status: ${res.statusCode}`);
                    console.log(`📄 Raw Response:`, data.substring(0, 200));
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${description} - Error: ${error.message}`);
            reject(error);
        });

        req.on('timeout', () => {
            console.log(`⏰ ${description} - Request timeout`);
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('🚀 Phase 2.5 Multi-API System Testing\n');
    
    const tests = [
        ['/api/health', 'Basic Health Check'],
        ['/api/multi/health', 'Multi-API Health Check'],
        ['/api/auth/status', 'Authentication Status'],
        ['/api/multi/providers', 'Available Providers (needs auth)']
    ];
    
    for (const [path, description] of tests) {
        try {
            await testEndpoint(path, description);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        } catch (error) {
            // Continue with next test
        }
    }
    
    console.log('\n🎯 Testing completed!');
    console.log('📋 Check server logs for request handling details');
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
});
