// Test script to check if routes can be loaded
console.log('Testing route loading...');

try {
    console.log('Loading marketDataRoutes...');
    const marketDataRoutes = require('./src/routes/marketDataRoutes');
    console.log('✅ marketDataRoutes loaded successfully');
    console.log('Routes available:', marketDataRoutes.stack ? marketDataRoutes.stack.map(layer => layer.route?.path) : 'No stack available');
} catch (error) {
    console.error('❌ Failed to load marketDataRoutes:', error.message);
    console.error('Full error:', error);
}

try {
    console.log('Loading marketDataController...');
    const controller = require('./src/controllers/marketDataController');
    console.log('✅ marketDataController loaded successfully');
    console.log('Available functions:', Object.keys(controller));
} catch (error) {
    console.error('❌ Failed to load marketDataController:', error.message);
    console.error('Full error:', error);
}

console.log('Test complete.');
