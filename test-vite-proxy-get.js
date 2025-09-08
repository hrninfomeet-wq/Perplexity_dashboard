// test-vite-proxy-get.js
// Test GET requests through the Vite proxy

const testViteProxyGet = async () => {
    console.log('🧪 Testing GET request through Vite proxy (port 5174)...');
    
    try {
        // Test a simple GET request first
        const response = await fetch('http://localhost:5174/api/test-connection', {
            method: 'GET'
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
testViteProxyGet()
    .then((result) => {
        console.log('🎉 Vite proxy GET test completed successfully!');
        console.log('📊 Final result:', result);
    })
    .catch((error) => {
        console.log('💥 Vite proxy GET test failed!');
        console.log('🔍 Error:', error.message);
    });
