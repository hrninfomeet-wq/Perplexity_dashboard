// test-frontend-request.js
// Simulate the exact frontend request to debug the issue

const testFrontendRequest = async () => {
    console.log('🧪 Testing frontend authentication request...');
    
    try {
        // This mimics exactly what the frontend does
        const response = await fetch('http://localhost:5000/api/auth/generate-login-url', {
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
testFrontendRequest()
    .then((result) => {
        console.log('🎉 Test completed successfully!');
        console.log('📊 Final result:', result);
    })
    .catch((error) => {
        console.log('💥 Test failed!');
        console.log('🔍 Error:', error.message);
    });
