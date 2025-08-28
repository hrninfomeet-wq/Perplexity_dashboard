const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 5000;

console.log('Test server starting...');

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    
    // Keep the process alive
    setInterval(() => {
        console.log('Server is alive:', new Date().toISOString());
    }, 10000);
});

// Prevent the process from exiting
process.stdin.resume();
