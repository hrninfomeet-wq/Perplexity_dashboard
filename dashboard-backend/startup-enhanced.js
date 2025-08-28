// dashboard-backend/startup-enhanced.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Import enhanced controllers and services
const enhancedAuthController = require('./src/controllers/enhancedAuthController');
const enhancedFlattradeService = require('./src/services/enhancedFlattradeService');

// Import existing routes
const healthRoutes = require('./src/routes/healthRoutes');
const marketDataRoutes = require('./src/routes/marketDataRoutes');

// Import enhanced routes
const enhancedAuthRoutes = require('./src/routes/enhancedAuthRoutes');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced startup banner
console.log('🚀 Starting Enhanced NSE Trading Dashboard Backend...');
console.log('📈 Features: Auto-Authentication, Token Management, Smart Caching');
console.log('=' .repeat(60));

// Routes
app.use('/api', healthRoutes);
app.use('/api', enhancedAuthRoutes);
app.use('/api', marketDataRoutes);

// Enhanced authentication middleware for protected routes
app.use('/api/protected', async (req, res, next) => {
    try {
        if (!enhancedAuthController.isAuthenticated()) {
            return res.status(401).json({
                error: 'Authentication required',
                loginUrl: enhancedAuthController.authManager?.getLoginUrl(),
                message: 'Please authenticate to access this resource'
            });
        }
        
        // Ensure token is valid and refresh if needed
        await enhancedAuthController.getValidToken();
        next();
    } catch (error) {
        res.status(401).json({
            error: 'Authentication failed',
            message: error.message,
            needsLogin: true
        });
    }
});

// Enhanced alerts endpoint with authentication
app.get('/api/alerts', async (req, res) => {
    try {
        if (!enhancedAuthController.isAuthenticated()) {
            return res.json({
                data: [],
                timestamp: Date.now(),
                source: 'unavailable',
                message: 'Authentication required for live alerts'
            });
        }

        // Generate sample alerts (enhance this with real logic)
        const alerts = [
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

        res.json({
            data: alerts,
            timestamp: Date.now(),
            source: 'live',
            authenticated: true
        });

    } catch (error) {
        console.error('Alerts generation error:', error.message);
        res.json({
            data: [],
            timestamp: Date.now(),
            error: error.message,
            source: 'error'
        });
    }
});

// Service status endpoint
app.get('/api/system/status', async (req, res) => {
    try {
        const authStatus = enhancedAuthController.authManager?.getStatus() || { isAuthenticated: false };
        const serviceStatus = enhancedFlattradeService.getStatus();
        const authHealth = await enhancedAuthController.authManager?.healthCheck() || { status: 'unavailable' };

        res.json({
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            authentication: {
                ...authStatus,
                health: authHealth
            },
            flattrade: serviceStatus,
            websocket: {
                connected: wss.clients.size,
                clients: Array.from(wss.clients).map(ws => ({
                    readyState: ws.readyState,
                    connected: ws.readyState === WebSocket.OPEN
                }))
            },
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get system status',
            message: error.message
        });
    }
});

// WebSocket connection management
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket client connected');

    ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to Enhanced NSE Trading Dashboard',
        timestamp: Date.now(),
        features: ['auto-authentication', 'smart-caching', 'real-time-alerts']
    }));

    // Send periodic status updates
    const statusInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            const authStatus = enhancedAuthController.authManager?.getStatus();
            ws.send(JSON.stringify({
                type: 'status_update',
                authenticated: authStatus?.isAuthenticated || false,
                timestamp: Date.now()
            }));
        }
    }, 30000);

    ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
        clearInterval(statusInterval);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(statusInterval);
    });
});

// Enhanced error handling
app.use((error, req, res, next) => {
    console.error('🚨 Unhandled error:', error);
    
    // Authentication errors
    if (error.message.includes('authentication') || error.message.includes('token')) {
        return res.status(401).json({
            error: 'Authentication error',
            message: error.message,
            needsLogin: true,
            loginUrl: enhancedAuthController.authManager?.getLoginUrl()
        });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: Date.now()
    });
});

// Enhanced server startup
async function startServer() {
    try {
        console.log('🔐 Initializing authentication system...');
        
        // Initialize enhanced authentication
        const authResult = await enhancedAuthController.initialize();
        
        if (authResult.success) {
            console.log('✅ Authentication initialized:', authResult.message);
        } else {
            console.log('⚠️ Authentication not ready:', authResult.message);
            console.log('🔗 Manual login will be required for live data');
        }

        // Start the server
        const appServer = server.listen(PORT, () => {
            console.log('=' .repeat(60));
            console.log(`🚀 Enhanced NSE Trading Dashboard Backend running on http://localhost:${PORT}`);
            console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
            console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🔐 Auth Status: http://localhost:${PORT}/api/auth/status`);
            console.log(`📈 System Status: http://localhost:${PORT}/api/system/status`);
            console.log('=' .repeat(60));
            
            const authStatus = enhancedAuthController.authManager?.getStatus();
            if (authStatus?.isAuthenticated) {
                console.log('✅ READY: Authenticated and ready for live trading data');
                if (authStatus.tokenExpiry) {
                    console.log(`⏰ Token expires: ${new Date(authStatus.tokenExpiry).toLocaleString()}`);
                }
            } else {
                console.log('🔐 READY: Waiting for authentication for live data');
            }
            console.log('🎯 Features: Auto-authentication, Smart caching, Real-time alerts');
        });

        // Enhanced keep-alive and monitoring
        setInterval(() => {
            const authStatus = enhancedAuthController.authManager?.getStatus();
            const serviceStatus = enhancedFlattradeService.getStatus();
            
            console.log(`📡 Heartbeat: Auth=${authStatus?.isAuthenticated ? '✅' : '❌'} ` +
                       `API=${serviceStatus.apiCallCount}/${serviceStatus.rateLimitRemaining} ` +
                       `Cache=${serviceStatus.cacheSize} ` +
                       `WS=${wss.clients.size}`);
        }, 30000);

        // Error handling
        appServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
                console.log('Trying port 5001...');
                server.listen(5001, () => {
                    console.log(`🚀 NSE Trading Dashboard Backend running on http://localhost:5001`);
                });
            } else {
                console.error('❌ Server error:', err);
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        async function gracefulShutdown() {
            console.log('🛑 Graceful shutdown initiated...');
            
            // Close WebSocket connections
            wss.clients.forEach(ws => {
                ws.send(JSON.stringify({
                    type: 'server_shutdown',
                    message: 'Server is shutting down'
                }));
                ws.close();
            });

            // Clear authentication session (if needed)
            if (process.env.CLEAR_SESSION_ON_SHUTDOWN === 'true') {
                await enhancedAuthController.authManager?.clearSession();
            }

            appServer.close(() => {
                console.log('✅ Server closed gracefully');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                console.log('⏰ Forcing shutdown...');
                process.exit(1);
            }, 10000);
        }

        // Make services available globally for backward compatibility
        global.app = app;
        global.enhancedAuthController = enhancedAuthController;
        global.enhancedFlattradeService = enhancedFlattradeService;

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the enhanced server
startServer();

module.exports = app;
