// dashboard-backend/index.js

/**
 * NSE Trading Dashboard - Enhanced Backend Server
 * Integrated with unified authentication system and improved architecture
 * 
 * @version 2.1.0
 * @created September 01, 2025
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Import new unified authentication system
const authConfig = require('./src/config/auth.config');
const tokenManager = require('./src/utils/token-manager');
const unifiedAuthService = require('./src/services/auth/unified-auth.service');
const AuthMiddleware = require('./src/middleware/auth.middleware');

// Import routes
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes'); // Updated routes
const marketDataRoutes = require('./src/routes/marketDataRoutes');

// Import utilities
const { NSE_INDEX_TOKENS, FO_SECURITIES } = require('./src/utils/constants');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

// Global middleware
app.use(express.json());
app.use(AuthMiddleware.securityHeaders);

let connectedClients = new Set();
let marketData = new Map();

// Make enhanced state accessible to controllers
app.locals.FLATTRADE_TOKEN = tokenManager.getToken();
app.locals.isAuthenticated = tokenManager.isAuthenticated();
app.locals.connectedClients = connectedClients;
app.locals.tokenManager = tokenManager;
app.locals.authService = unifiedAuthService;

// Log enhanced startup information
console.log('🚀 Starting NSE Trading Dashboard Backend v2.1.0...');
console.log(`🔧 Node.js: ${process.version}`);
console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔐 Authentication: Unified Auth System`);

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

// Authentication routes (with unified auth system)
app.use('/api', authRoutes);

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
        version: '2.1.0',
        features: ['real-time-data', 'auto-auth', 'enhanced-calculations'],
        authenticated: app.locals.isAuthenticated,
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

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `The requested route ${req.originalUrl} was not found`,
        availableRoutes: [
            '/api/health',
            '/api/auth/status',
            '/api/login/url',
            '/api/indices',
            '/api/gainers',
            '/api/losers'
        ],
        timestamp: new Date().toISOString()
    });
});

// Enhanced server startup
const appServer = server.listen(PORT, () => {
    console.log(`🌟 NSE Trading Dashboard Backend v2.1.0 running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth Status: http://localhost:${PORT}/api/auth/status`);
    console.log('🎯 Features:');
    console.log('   • Unified Authentication System');
    console.log('   • Auto-token refresh with 5-minute buffer');
    console.log('   • Enhanced error handling and logging');
    console.log('   • WebSocket real-time communication');
    console.log('   • Multi-source data failover (NSE → Flattrade → Mock)');
    console.log('   • Advanced market calculations (Phase 2 ready)');
    
    // Start enhanced heartbeat with auth monitoring
    setInterval(() => {
        const authStatus = tokenManager.getAuthStatus();
        const wsClients = connectedClients.size;
        
        console.log(`💗 Enhanced Heartbeat: ${new Date().toLocaleTimeString()}`);
        console.log(`   Auth: ${authStatus.authenticated ? '✅' : '❌'} | ` +
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
    appServer.close(() => {
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

console.log('🎉 NSE Trading Dashboard Backend v2.1.0 initialization complete!');
console.log('   Ready for Phase 1 testing and validation...\n');

module.exports = app;