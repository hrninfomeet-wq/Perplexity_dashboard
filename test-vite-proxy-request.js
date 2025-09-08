// test-vite-proxy-request.js
// Test the request through the Vite proxy configuration

const testViteProxyRequest = async () => {
    console.log('🧪 Testing request through Vite proxy (port 5174)...');
    
    try {
        // This simulates the frontend request through Vite proxy
        const response = await fetch('http://localhost:5174/api/auth/generate-login-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ provider: 'flattrade' })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Success! Response data:', data);
        
        return data;
        
    } catch (error) {
        console.error('❌ Request failed:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Run the test
testViteProxyRequest()
    .then((result) => {
        console.log('🎉 Vite proxy test completed successfully!');
        console.log('📊 Final result:', result);
    })
    .catch((error) => {
        console.log('💥 Vite proxy test failed!');
        console.log('🔍 Error:', error.message);
    });
