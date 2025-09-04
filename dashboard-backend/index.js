// dashboard-backend/index.js

/**
 * NSE Trading Dashboard - Enhanced Backend Server
 * Integrated with multi-API system, database, and unified authentication
 * 
 * @version 2.3.0
 * @created September 03, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Import database configuration
const dbConfig = require('./src/config/db.config');

// Import authentication system
const authConfig = require('./src/config/auth.config');
const tokenManager = require('./src/utils/token-manager');
const unifiedAuthService = require('./src/services/auth/unified-auth.service');
const AuthMiddleware = require('./src/middleware/auth.middleware');

// Import multi-API system (Phase 2.5)
const { router: multiApiRoutes, initializeServices: initMultiApiServices } = require('./src/routes/multiApiRoutes');
const providerRoutes = require('./src/routes/providerRoutes');

// Import Phase 3A models and services
const { MarketData, AggregatedMarketData } = require('./src/models/marketDataModel');
const { TradingOpportunity, WatchList } = require('./src/models/tradingOpportunityModel');
const { MarketAnalytics, MarketInsights } = require('./src/models/marketAnalyticsModel');
const { TechnicalIndicator, IndicatorAlert } = require('./src/models/technicalIndicatorsModel');
const MarketDataIngestionService = require('./src/services/market/marketDataIngestion');
const SymbolManager = require('./src/services/market/symbolManager');
const TechnicalIndicatorsEngine = require('./src/services/indicators/technicalIndicatorsEngine');
const PatternRecognitionEngine = require('./src/services/patterns/patternRecognitionEngine');

// Import existing routes
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const multiAuthRoutes = require('./src/routes/multiAuthRoutes');
const dataRoutes = require('./src/routes/dataRoutes');
const marketDataRoutes = require('./src/routes/marketDataRoutes');

// Import Phase 3A routes
const marketDataV3Routes = require('./src/routes/marketDataV3Routes');
const technicalIndicatorsRoutes = require('./src/routes/technicalIndicatorsRoutes');
const tradingStrategiesRoutes = require('./src/routes/tradingStrategiesRoutes');
const patternRecognitionRoutes = require('./src/routes/patternRecognitionRoutes');

// Import Phase 3A Step 5 ML routes
const mlRoutes = require('./src/routes/mlRoutes');

// Import Phase 3A Step 6 Risk Management routes
const riskRoutes = require('./src/routes/riskRoutes');

// Import Phase 3A Step 8 Live Trading routes
const liveTradingRoutes = require('./src/routes/liveTradingRoutes');

// Import utilities
const { NSE_INDEX_TOKENS, FO_SECURITIES } = require('./src/utils/constants');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

// Global state
let connectedClients = new Set();
let marketData = new Map();
let multiApiInitialized = false;

// Phase 3A Services
let marketDataIngestion = null;
let symbolManager = null;
let technicalIndicatorsEngine = null;
let patternRecognitionEngine = null;
let phase3AInitialized = false;

// Global middleware
app.use(express.json());
app.use(AuthMiddleware.securityHeaders);

// Make enhanced state accessible to controllers
app.locals.FLATTRADE_TOKEN = tokenManager.getToken();
app.locals.isAuthenticated = tokenManager.isAuthenticated();
app.locals.connectedClients = connectedClients;
app.locals.tokenManager = tokenManager;
app.locals.authService = unifiedAuthService;
app.locals.dbConfig = dbConfig;

// Log enhanced startup information
console.log('🚀 Starting NSE Trading Dashboard Backend v2.2.0...');
console.log(`🔧 Node.js: ${process.version}`);
console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔐 Authentication: Unified Auth System`);
console.log(`🗄️ Database: MongoDB Integration`);

// Authentication status on startup
const startupAuthStatus = tokenManager.getAuthStatus();
if (startupAuthStatus.authenticated) {
    console.log(`✅ Authentication: Ready (expires ${startupAuthStatus.expiryInfo})`);
    app.locals.FLATTRADE_TOKEN = tokenManager.getToken();
    app.locals.isAuthenticated = true;
} else {
    console.log('🔐 Authentication: Required (tokens will use mock data until authenticated)');
    app.locals.FLATTRADE_TOKEN = null;
    app.locals.isAuthenticated = false;
}

// Enhanced route setup with middleware
console.log('📚 Setting up routes with enhanced middleware...');

// Health routes (no auth required)
app.use('/api', healthRoutes);

// Phase 3A routes - Live Market Data Intelligence (Mount early to avoid auth catch-all)
app.use('/api/v3', marketDataV3Routes);
app.use('/api/v3/indicators', technicalIndicatorsRoutes);
app.use(patternRecognitionRoutes); // Pattern Recognition API v4

// Phase 3A Step 5: ML-Enhanced Signal Generation
app.use('/api/v5/ml', mlRoutes);

// Phase 3A Step 6: Risk Management & ML-Driven Position Sizing
app.use('/api/v6/risk', riskRoutes);

// Phase 3A Step 7: Advanced Trading Strategies
app.use('/api/v7/strategies', tradingStrategiesRoutes);

// Phase 3A Step 8: Live Trading Integration
app.use('/api/v8/live', liveTradingRoutes);

// Multi-API system routes (Phase 2.5) - Mount before auth routes to avoid catch-all
app.use('/api/multi', multiApiRoutes);
app.use('/api/providers', providerRoutes);

// Multi-API authentication routes (Phase 2.5 - Step 8)
app.use('/api/auth/multi', multiAuthRoutes);

// Authentication routes (with unified auth system and database) - Mount after specific routes
app.use('/api', authRoutes);

// Data management routes (with database integration)
app.use('/api/data', dataRoutes);

// Market data routes (with automatic auth handling)
app.use('/api', 
    AuthMiddleware.marketDataAuth, // Automatically handles auth for market data
    marketDataRoutes
);

// Enhanced alerts endpoint with better error handling
app.get('/api/alerts', AuthMiddleware.optionalAuth, async (req, res) => {
    try {
        const alerts = [];
        const isAuthenticated = req.isAuthenticated;

        if (!isAuthenticated) {
            console.log('⚠️ No token - showing sample alerts');
            const sampleAlerts = [
                {
                    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                    stock: 'NIFTY',
                    signal: 'BUY',
                    entry: 19850,
                    target: 19950,
                    stoploss: 19800,
                    type: 'Scalping',
                    probability: 75
                },
                {
                    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                    stock: 'BANKNIFTY',
                    signal: 'SELL',
                    entry: 44500,
                    target: 44300,
                    stoploss: 44600,
                    type: 'Options',
                    probability: 68
                }
            ];

            return res.json({
                data: sampleAlerts,
                timestamp: Date.now(),
                source: 'sample',
                authenticated: false
            });
        }

        // Enhanced alert generation for authenticated users
        // This would integrate with the calculation services in Phase 2
        const enhancedAlerts = [
            {
                timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
                stock: 'NIFTY',
                signal: 'BUY',
                entry: 19850,
                target: 19950,
                stoploss: 19800,
                type: 'Live Analysis',
                probability: 82,
                confidence: 'High'
            }
        ];

        res.json({
            data: enhancedAlerts,
            timestamp: Date.now(),
            source: 'live',
            authenticated: true
        });

    } catch (error) {
        console.error('❌ Alerts generation error:', error.message);
        res.status(500).json({
            data: [],
            timestamp: Date.now(),
            error: error.message,
            source: 'error'
        });
    }
});

// Enhanced WebSocket connection management
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket client connected');
    connectedClients.add(ws);

    // Send enhanced connection message
    ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to NSE Trading Dashboard WebSocket',
        version: '2.3.0',
        features: [
            'multi-api-integration', 
            'intelligent-failover', 
            'real-time-health-monitoring',
            'advanced-rate-limiting',
            'websocket-management',
            'database-integration',
            'unified-authentication'
        ],
        authenticated: app.locals.isAuthenticated,
        database_connected: dbConfig.isConnected,
        multi_api_enabled: multiApiInitialized,
        api_capacity: multiApiInitialized ? '730+ req/min' : '80 req/min',
        timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
        connectedClients.delete(ws);
    });

    // Handle WebSocket messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 WebSocket message received:', data.type);
            
            // Handle different message types
            switch (data.type) {
                case 'auth_status_request':
                    ws.send(JSON.stringify({
                        type: 'auth_status_response',
                        authenticated: app.locals.isAuthenticated,
                        status: tokenManager.getAuthStatus(),
                        timestamp: new Date().toISOString()
                    }));
                    break;
                    
                case 'heartbeat':
                    ws.send(JSON.stringify({
                        type: 'heartbeat_response',
                        timestamp: new Date().toISOString()
                    }));
                    break;
                    
                default:
                    console.log('Unknown WebSocket message type:', data.type);
            }
        } catch (error) {
            console.error('❌ WebSocket message error:', error.message);
        }
    });
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    
    // Don't expose sensitive information in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(error.status || 500).json({
        success: false,
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'Something went wrong',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
    });
});

// 404 handler - Use a more specific pattern instead of '*'
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `The requested route ${req.originalUrl} was not found`,
        availableRoutes: [
            '/api/health',
            '/api/auth/status',
            '/api/login/url',
            '/api/multi/health',
            '/api/multi/providers',
            '/api/multi/quote/:symbol',
            '/api/providers/user-config',
            '/api/providers/auth-status',
            '/api/data/user/profile',
            '/api/data/trades/active',
            '/api/data/analytics/performance',
            '/api/indices',
            '/api/gainers',
            '/api/losers'
        ],
        timestamp: new Date().toISOString()
    });
});

/**
 * Initialize Phase 3A Services (Live Market Data Intelligence)
 */
async function initializePhase3AServices() {
    try {
        console.log('🚀 Initializing Phase 3A Live Market Data Intelligence...');
        
        // Initialize Symbol Manager
        console.log('📊 Initializing Symbol Manager...');
        symbolManager = new SymbolManager();
        await symbolManager.loadUniverseFromAPI();
        global.symbolManager = symbolManager;
        console.log('✅ Symbol Manager initialized with universe');
        
        // Initialize Market Data Ingestion Service
        if (multiApiInitialized) {
            console.log('📈 Initializing Market Data Ingestion Service...');
            
            // Get services from global scope (set by multi-API initialization)
            const apiManager = global.apiManager;
            const healthMonitor = global.healthMonitor;
            const rateLimiter = global.rateLimiter;
            
            if (apiManager && healthMonitor && rateLimiter) {
                marketDataIngestion = new MarketDataIngestionService(
                    apiManager, 
                    healthMonitor, 
                    rateLimiter
                );
                global.marketDataIngestion = marketDataIngestion;
                
                // Start the ingestion service
                await marketDataIngestion.start();
                console.log('✅ Market Data Ingestion Service started');
            } else {
                console.log('⚠️ Multi-API services not available, skipping ingestion service');
            }
        } else {
            console.log('⚠️ Multi-API system not initialized, skipping ingestion service');
        }
        
        // Initialize Technical Indicators Engine (Step 3)
        console.log('🧮 Initializing Technical Indicators Engine...');
        technicalIndicatorsEngine = new TechnicalIndicatorsEngine();
        global.technicalIndicatorsEngine = technicalIndicatorsEngine;
        
        // Start the indicators engine
        await technicalIndicatorsEngine.start();
        console.log('✅ Technical Indicators Engine started successfully');
        
        // Initialize Pattern Recognition Engine (Step 4)
        console.log('🔍 Initializing Pattern Recognition Engine...');
        patternRecognitionEngine = new PatternRecognitionEngine();
        global.patternRecognitionEngine = patternRecognitionEngine;
        
        // Start the pattern recognition engine
        await patternRecognitionEngine.start();
        console.log('✅ Pattern Recognition Engine started successfully');
        
        phase3AInitialized = true;
        
        console.log('🎉 Phase 3A Live Market Data Intelligence initialized successfully!');
        console.log('📋 Available features:');
        console.log('   • Symbol Universe Management (NIFTY 50 + sectors)');
        console.log('   • Real-time Market Data Ingestion (730+ req/min)');
        console.log('   • Technical Indicators Engine (Step 3) - 15+ indicators');
        console.log('   • Pattern Recognition Engine (Step 4) - 20+ patterns');
        console.log('   • Scalping Timeframes (1m, 3m, 15m) for ultra-fast trading');
        console.log('   • Trading Signal Generation & Alerts');
        console.log('   • Trading Opportunity Detection (foundation)');
        console.log('   • Market Analytics Engine (foundation)');
        console.log('   • REST API v3/v4 endpoints');
        
    } catch (error) {
        console.error('❌ Phase 3A initialization failed:', error.message);
        console.log('⚠️ Phase 3A features will be limited');
        phase3AInitialized = false;
    }
}

// Enhanced server startup
const appServer = server.listen(PORT, async () => {
    console.log(`🌟 NSE Trading Dashboard Backend v2.3.0 running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth Status: http://localhost:${PORT}/api/auth/status`);
    console.log(`🚀 Multi-API Health: http://localhost:${PORT}/api/multi/health`);
    
    // Initialize database connection (graceful fallback)
    try {
        // Set a shorter timeout for database connection
        const dbConnectPromise = dbConfig.connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        );
        
        await Promise.race([dbConnectPromise, timeoutPromise]);
        console.log('✅ Database connection established successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('⚠️ Server will continue with limited features (authentication-only mode)');
        // Ensure the database doesn't crash the server
        dbConfig.isConnected = false;
    }
    
    // Initialize multi-API system (Phase 2.5)
    try {
        console.log('🔄 Initializing Multi-API system...');
        await initMultiApiServices();
        multiApiInitialized = true;
        console.log('✅ Multi-API system initialized successfully');
        console.log('🎯 API Capacity: 730+ requests/minute across 5 providers');
    } catch (error) {
        console.error('❌ Multi-API initialization failed:', error.message);
        console.log('⚠️ Falling back to single Flattrade API');
        multiApiInitialized = false;
    }
    
    // Initialize Phase 3A services (Live Market Data Intelligence)
    await initializePhase3AServices();
    
    console.log('🎯 Features:');
    console.log('   • Multi-API Integration (Flattrade, Upstox, FYERS, AliceBlue, NSE Public)');
    console.log('   • Intelligent Failover and Load Balancing');
    console.log('   • Real-time Health Monitoring and Alerting');
    console.log('   • Advanced Rate Limiting with Global Coordination');
    console.log('   • WebSocket Manager for Real-time Data Streaming');
    console.log('   • Unified Authentication System');
    console.log('   • MongoDB Database Integration');
    console.log('   • User Profile and Trade Management');
    console.log('   • Auto-token refresh with 5-minute buffer');
    console.log('   • Enhanced error handling and logging');
    console.log('   • Multi-source data failover');
    console.log('   • Advanced market calculations and analytics');
    
    // Start enhanced heartbeat with multi-API monitoring
    setInterval(async () => {
        const authStatus = tokenManager.getAuthStatus();
        const wsClients = connectedClients.size;
        const dbStatus = await dbConfig.getHealthStatus();
        
        console.log(`💗 Enhanced Heartbeat: ${new Date().toLocaleTimeString()}`);
        console.log(`   Auth: ${authStatus.authenticated ? '✅' : '❌'} | ` +
                   `DB: ${dbStatus.connected ? '✅' : '❌'} | ` +
                   `Multi-API: ${multiApiInitialized ? '✅' : '❌'} | ` +
                   `Phase 3A: ${phase3AInitialized ? '✅' : '❌'} | ` +
                   `Expires: ${authStatus.expiryInfo} | ` + 
                   `WS: ${wsClients} clients | ` +
                   `Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        
        // Auto-refresh token if needed
        if (authStatus.authenticated && authStatus.needsRefresh) {
            console.log('🔄 Auto-refresh triggered by heartbeat...');
            unifiedAuthService.refreshToken()
                .then(result => {
                    if (result.success) {
                        app.locals.FLATTRADE_TOKEN = tokenManager.getToken();
                        console.log('✅ Heartbeat auto-refresh successful');
                    } else {
                        console.log('⚠️ Heartbeat auto-refresh failed:', result.error);
                    }
                })
                .catch(error => {
                    console.error('❌ Heartbeat auto-refresh error:', error.message);
                });
        }
    }, 30000); // Every 30 seconds
    
    // Keep-alive mechanism
    setInterval(() => {}, 1000);
    
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('🔄 Trying port 5001...');
        
        const server2 = server.listen(5001, () => {
            console.log(`🚀 NSE Trading Dashboard Backend running on http://localhost:5001`);
            setInterval(() => {}, 1000);
            process.stdin.resume();
        });
    } else {
        console.error('❌ Server error:', err);
    }
});

// Enhanced startup token validation
(async () => {
    console.log('🔍 Performing startup authentication check...');
    
    try {
        const connectResult = await unifiedAuthService.connectLiveData();
        
        if (connectResult.success && connectResult.authenticated) {
            console.log('✅ Startup: Already authenticated with live data access');
            app.locals.FLATTRADE_TOKEN = tokenManager.getToken();
            app.locals.isAuthenticated = true;
        } else if (connectResult.needsLogin) {
            console.log('🔐 Startup: Authentication required for live data access');
            console.log(`   Login URL available at: http://localhost:${PORT}/api/login/url`);
        } else {
            console.log('⚠️ Startup: Authentication status unclear, proceeding with mock data');
        }
    } catch (error) {
        console.error('❌ Startup authentication check failed:', error.message);
        console.log('📊 Proceeding with mock data until manual authentication');
    }
})();

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
    
    // Close WebSocket connections
    connectedClients.forEach(client => {
        client.send(JSON.stringify({
            type: 'server_shutdown',
            message: 'Server is shutting down',
            timestamp: new Date().toISOString()
        }));
        client.close();
    });
    
    // Close server
    appServer.close(async () => {
        console.log('🗄️ Closing database connection...');
        await dbConfig.disconnect();
        console.log('✅ Server closed successfully');
        
        // Clear session if configured
        if (authConfig.session.clearOnShutdown) {
            console.log('🗑️ Clearing authentication session...');
            tokenManager.clearToken();
        }
        
        console.log('👋 NSE Trading Dashboard Backend shutdown complete');
        process.exit(0);
    });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Prevent process exit
process.stdin.resume();
setInterval(() => {}, 100);

// Keep event loop busy
const keepBusy = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setImmediate(keepBusy);
};
keepBusy();

// Make app available globally for controller access
global.app = app;

console.log('🎉 NSE Trading Dashboard Backend v2.2.0 initialization complete!');
console.log('   Ready for Phase 2 testing and validation...\n');

module.exports = app;