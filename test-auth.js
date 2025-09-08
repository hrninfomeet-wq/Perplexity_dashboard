// Simple test script for authentication endpoint
const fs = require('fs');
const crypto = require('crypto');

console.log('🧪 Testing Authentication System...\n');

// Read environment variables
const envPath = 'C:\\Users\\haroo\\OneDrive\\Documents\\My Projects\\Perplexity_dashboard\\dashboard-backend\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

console.log('📋 Environment Variables:');
console.log('FLATTRADE_API_KEY:', envVars.FLATTRADE_API_KEY);
console.log('FLATTRADE_API_SECRET:', envVars.FLATTRADE_API_SECRET);
console.log('FLATTRADE_TOKEN:', envVars.FLATTRADE_TOKEN);
console.log('FLATTRADE_REQUEST_CODE:', envVars.FLATTRADE_REQUEST_CODE);
console.log('FLATTRADE_REDIRECT_URI:', envVars.FLATTRADE_REDIRECT_URI);

// Test URL generation
const baseUrl = 'https://auth.flattrade.in';
const redirectUri = encodeURIComponent(envVars.FLATTRADE_REDIRECT_URI);
const expectedUrl = `${baseUrl}/?app_key=${envVars.FLATTRADE_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;

console.log('\n🔗 Expected Authentication URL:');
console.log(expectedUrl);

// Test token validation logic
if (envVars.FLATTRADE_TOKEN) {
    console.log('\n🔍 Testing Token Validation...');
    
    // Simulate UserDetails API call
    const jKey = envVars.FLATTRADE_TOKEN;
    console.log('JWT Token for validation:', jKey);
    
    // This would be the actual API call in the server
    console.log('UserDetails API URL: https://piconnect.flattrade.in/PiConnectTP/UserDetails');
    console.log('POST Body: { "uid": "' + envVars.FLATTRADE_API_KEY + '", "actid": "' + envVars.FLATTRADE_API_KEY + '", "jKey": "' + jKey + '" }');
}

// Test token exchange logic
if (envVars.FLATTRADE_REQUEST_CODE) {
    console.log('\n🔄 Testing Token Exchange...');
    
    const requestCode = envVars.FLATTRADE_REQUEST_CODE;
    const apiKey = envVars.FLATTRADE_API_KEY;
    const apiSecret = envVars.FLATTRADE_API_SECRET;
    
    // Generate SHA-256 hash
    const hashString = apiKey + requestCode + apiSecret;
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');
    
    console.log('Request Code:', requestCode);
    console.log('API Key:', apiKey);
    console.log('Hash String:', hashString);
    console.log('SHA-256 Hash:', hash);
    
    console.log('\nToken Exchange API URL: https://authapi.flattrade.in/trade/apitoken');
    console.log('POST Body:', {
        api_key: apiKey,
        request_code: requestCode,
        api_secret_hash: hash
    });
}

console.log('\n✅ Test Complete!');
