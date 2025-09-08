// dashboard-backend/src/controllers/healthController.js
const FlattradeAPIService = require('../services/flattrade-api.service');

const getHealthStatus = (req, res) => {
    // Accessing state attached to the app object in the main index.js
    const {
        FLATTRADE_TOKEN,
        volatilityIndex,
        connectedClients,
        tokenCache
    } = req.app.locals;

    res.json({
        status: 'healthy',
        message: 'NSE Trading Dashboard Backend is running',
        version: '6.0.0',
        phase: 'Phase 3A Step 6 - Risk Management & ML-Driven Position Sizing',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        
        // Authentication status
        authenticated: !!FLATTRADE_TOKEN,
        
        // System metrics
        volatilityIndex: volatilityIndex || 0,
        connectedClients: connectedClients ? connectedClients.size : 0,
        cachedTokens: tokenCache ? tokenCache.size : 0,
        
        // Enhanced system capabilities
        capabilities: {
            'Multi-API Integration': '5 providers operational',
            'Technical Indicators': '15+ indicators with real-time calculations',
            'Pattern Recognition': '20+ patterns with ML confidence scoring',
            'ML Signal Enhancement': 'Neural networks with <100ms processing',
            'Risk Management': 'VaR, position sizing, and portfolio protection',
            'Position Sizing': 'ML-enhanced Kelly Criterion optimization'
        },
        
        // Performance metrics
        performance: {
            'API Capacity': '730+ requests/minute',
            'Pattern Detection': '<200ms processing time',
            'ML Enhancement': '<100ms signal processing',
            'Risk Calculation': '<200ms VaR and position sizing',
            'System Uptime': '99.9% availability target'
        },
        
        // Operational APIs
        apiEndpoints: {
            'Health Check': '/api/health',
            'Multi-API System': '/api/multi/*',
            'Technical Indicators': '/api/v3/indicators/*',
            'Pattern Recognition': '/api/v4/patterns/*',
            'ML Signal Enhancement': '/api/v5/ml/*',
            'Risk Management': '/api/v6/risk/*'
        }
    });
};

const testFlattradeSession = async (req, res) => {
    try {
        console.log('🧪 Testing Flattrade API session...');
        
        const flattradeAPI = new FlattradeAPIService();
        
        // Test 1: Validate session
        const isSessionValid = await flattradeAPI.validateSession();
        
        let testResults = {
            timestamp: new Date().toISOString(),
            sessionValid: isSessionValid,
            tests: {}
        };

        if (isSessionValid) {
            // Test 2: Get NIFTY quote
            try {
                const niftyQuote = await flattradeAPI.getSingleQuote('26000', 'NSE');
                testResults.tests.niftyQuote = {
                    success: true,
                    data: {
                        price: parseFloat(niftyQuote.lp) || 0,
                        change: parseFloat(niftyQuote.c) || 0,
                        token: '26000'
                    }
                };
                console.log('✅ NIFTY quote test successful');
            } catch (error) {
                testResults.tests.niftyQuote = {
                    success: false,
                    error: error.message
                };
                console.log('❌ NIFTY quote test failed:', error.message);
            }

            // Test 3: Get Index List
            try {
                const indexList = await flattradeAPI.getIndexList();
                testResults.tests.indexList = {
                    success: true,
                    count: indexList.length || 0
                };
                console.log('✅ Index list test successful');
            } catch (error) {
                testResults.tests.indexList = {
                    success: false,
                    error: error.message
                };
                console.log('❌ Index list test failed:', error.message);
            }
        } else {
            testResults.message = 'Session validation failed - token may be expired';
            testResults.authUrl = 'http://localhost:5000/api/login/url';
            testResults.instructions = 'Visit the auth URL to re-authenticate with Flattrade';
        }

        res.json(testResults);
        
    } catch (error) {
        console.error('❌ Flattrade session test error:', error.message);
        res.status(500).json({
            timestamp: new Date().toISOString(),
            sessionValid: false,
            error: error.message,
            authUrl: 'http://localhost:5000/api/login/url',
            instructions: 'Session test failed - please re-authenticate with Flattrade'
        });
    }
};

module.exports = {
    getHealthStatus,
    testFlattradeSession
};
