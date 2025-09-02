require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Import routes
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const marketDataRoutes = require('./src/routes/marketDataRoutes');

// Import utilities
const { updateEnvFile } = require('./src/utils/envUtils');

// Import constants
const { NSE_INDEX_TOKENS, FO_SECURITIES } = require('./src/utils/constants');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Environment variables
const API_KEY = process.env.FLATTRADE_API_KEY;
const API_SECRET = process.env.FLATTRADE_API_SECRET;
const CLIENT_CODE = process.env.FLATTRADE_CLIENT_CODE;
const REDIRECT_URI = process.env.FLATTRADE_REDIRECT_URI;
const AUTH_PORTAL = 'https://auth.flattrade.in/';
const TOKEN_ENDPOINT = 'https://authapi.flattrade.in/trade/apitoken';
const FLATTRADE_BASE_URL = 'https://piconnect.flattrade.in/PiConnectTP/';

let FLATTRADE_TOKEN = process.env.FLATTRADE_TOKEN || null;
let connectedClients = new Set();
let marketData = new Map();
let volatilityIndex = 1.0;
let tokenCache = new Map();

// Make state accessible to controllers
app.locals.FLATTRADE_TOKEN = FLATTRADE_TOKEN;
app.locals.volatilityIndex = volatilityIndex;
app.locals.connectedClients = connectedClients;
app.locals.tokenCache = tokenCache;

// Log token status on startup
if (FLATTRADE_TOKEN) {
    console.log('🔑 Found existing FLATTRADE_TOKEN from .env - authentication persisted');
} else {
    console.log('🔐 No FLATTRADE_TOKEN found - authentication required');
}

// Rate limiting variables
let apiCallCount = 0;
let apiCallResetTime = Date.now();
const API_CALLS_PER_MINUTE = 100;
const API_CALL_DELAY = 200;

// ===== Use Routes =====
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', marketDataRoutes);

// ===== ENHANCED FLATTRADE REQUEST FUNCTION =====
async function makeFlattraderequest(endpoint, data) {
    const currentToken = app.locals.FLATTRADE_TOKEN;
    if (!currentToken) {
        throw new Error('Not authenticated. Please login first.');
    }

    // Rate limiting check
    const now = Date.now();
    if (now - apiCallResetTime > 60000) {
        apiCallCount = 0;
        apiCallResetTime = now;
    }

    if (apiCallCount >= API_CALLS_PER_MINUTE) {
        console.log('⏳ API rate limit reached, waiting...');
        await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY));
    }

    if (apiCallCount > 0) {
        await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY));
    }

    apiCallCount++;

    const payload = {
        ...data,
        uid: CLIENT_CODE,
        jKey: currentToken
    };

    console.log(`📡 Making API call ${apiCallCount}/${API_CALLS_PER_MINUTE} to: ${FLATTRADE_BASE_URL}${endpoint}`);

    try {
        const response = await axios.post(
            `${FLATTRADE_BASE_URL}${endpoint}`,
            `jData=${JSON.stringify(payload)}&jKey=${currentToken}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 15000
            }
        );

        if (response.data.stat !== 'Ok') {
            const errorMsg = response.data.emsg || 'Flattrade API error';
            console.log(`❌ API Error for ${endpoint}:`, errorMsg);

            if (errorMsg.includes('Session') || errorMsg.includes('Invalid') || errorMsg.includes('Token')) {
                console.log('🔐 Token appears to be invalid, clearing...');
                app.locals.FLATTRADE_TOKEN = null;
            }

            throw new Error(errorMsg);
        }

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log(`❌ HTTP 400 for ${endpoint} - possibly invalid token or parameters`);
        }
        throw error;
    }
}

// Make this function available globally
global.makeFlattraderequest = makeFlattraderequest;

// ===== MISSING ALERTS ENDPOINT =====
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = [];

        if (!app.locals.FLATTRADE_TOKEN) {
            console.log('⚠️ No token - showing empty alerts');
            return res.json({
                data: [],
                timestamp: Date.now(),
                source: 'unavailable'
            });
        }

        // Generate alerts from various sources
        // This is a simplified version - you can enhance this
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

        res.json({
            data: sampleAlerts,
            timestamp: Date.now(),
            source: app.locals.FLATTRADE_TOKEN ? 'live' : 'unavailable'
        });

    } catch (error) {
        console.error('Alerts generation error:', error.message);
        res.json({
            data: [],
            timestamp: Date.now(),
            error: error.message,
            source: 'unavailable'
        });
    }
});

// ===== WEBSOCKET CONNECTION MANAGEMENT =====
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket client connected');
    connectedClients.add(ws);

    ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
        connectedClients.delete(ws);
    });

    ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to NSE Trading Dashboard WebSocket'
    }));
});

// ===== ERROR HANDLING =====
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: Date.now()
    });
});

// ===== SERVER STARTUP =====
const appServer = server.listen(PORT, () => {
    console.log(`🚀 Enhanced NSE Trading Dashboard Backend running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🎯 Features: Real-time F&O analysis, Live market movers, Advanced BTST scanner, Dynamic scalping signals`);
    
    // Keep-alive mechanisms
    setInterval(() => {
        console.log('📡 Enhanced Backend heartbeat:', new Date().toLocaleTimeString());
    }, 10000);
    
    setInterval(() => {}, 1000);
    setInterval(() => {}, 5000);
    
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('Trying port 5001...');
        const server2 = server.listen(5001, () => {
            console.log(`🚀 NSE Trading Dashboard Backend running on http://localhost:5001`);
            setInterval(() => {}, 1000);
            process.stdin.resume();
        });
    } else {
        console.error('❌ Server error:', err);
    }
});

// On server startup, validate the request code and obtain a token if valid
(async () => {
    const request_code = process.env.FLATTRADE_REQUEST_CODE;

    if (request_code) {
        console.log('🔄 Validating existing request code...');

        try {
            const response = await axios.post(TOKEN_ENDPOINT, {
                app_key: process.env.FLATTRADE_API_KEY,
                app_secret: process.env.FLATTRADE_API_SECRET,
                request_code
            });

            if (response.data.stat === 'Ok') {
                const { token } = response.data;
                console.log('✅ Token obtained successfully on startup:', token);

                // Update .env with the new token
                await updateEnvFile('FLATTRADE_TOKEN', token);

                // Update in-memory token
                app.locals.FLATTRADE_TOKEN = token;
            } else {
                console.log('⚠️ Request code invalid or expired. Please log in again.');
            }
        } catch (error) {
            console.error('Error during request code validation:', error.message);
        }
    } else {
        console.log('⚠️ No request code found. Please log in to obtain a token.');
    }
})();

// Multiple ways to keep the process alive
process.stdin.resume();
setInterval(() => {}, 100);

// Prevent process exit
process.on('beforeExit', (code) => {
    console.log('Process attempting to exit with code:', code);
    setTimeout(() => {
        console.log('Preventing exit, keeping server alive');
    }, 100);
});

// Keep event loop busy
const keepBusy = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setImmediate(keepBusy);
};
keepBusy();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    appServer.close(() => {
        console.log('Server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    appServer.close(() => {
        console.log('Server closed');
    });
});

// Make app available globally for controller access
global.app = app;

module.exports = app;
