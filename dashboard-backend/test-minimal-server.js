// Minimal server test to isolate the startup issue
console.log('Testing minimal server startup...');

try {
    const express = require('express');
    console.log('✅ Express imported');
    
    const riskRoutes = require('./src/routes/riskRoutes');
    console.log('✅ Risk routes imported');
    
    const app = express();
    app.use(express.json());
    
    app.use('/api/v6/risk', riskRoutes);
    console.log('✅ Risk routes configured');
    
    const server = app.listen(3002, () => {
        console.log('✅ Server started on port 3002');
        console.log('Testing health endpoint...');
        
        // Test the health endpoint
        const http = require('http');
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/v6/risk/health',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('✅ Health check response:', JSON.parse(data).success);
                server.close();
                console.log('✅ Test completed successfully');
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ Health check failed:', err.message);
            server.close();
        });
        
        req.end();
    });
    
} catch (error) {
    console.error('❌ Server startup error:', error.message);
    console.error('Stack trace:', error.stack);
}
