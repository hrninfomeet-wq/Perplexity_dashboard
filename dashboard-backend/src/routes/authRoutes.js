// dashboard-backend/src/routes/authRoutes.js

/**
 * Enhanced Authentication Routes with Database Integration
 * Integrates MongoDB storage with existing authentication system
 * Maintains backward compatibility while adding persistent session management
 * 
 * @version 2.2.0
 * @created September 02, 2025
 */

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const authController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth.middleware');

// Import database models
const User = require('../models/userModel');
const dbConfig = require('../config/db.config');

// Apply common middleware to all auth routes
router.use(AuthMiddleware.securityHeaders);
router.use(AuthMiddleware.requestLogger);

/**
 * Public Authentication Routes (no auth required)
 */

// Simple redirect endpoint for /login 
router.get('/login', (req, res) => {
    res.redirect('/api/login/url');
});

// Generate Flattrade login URL
router.get('/login/url', 
    AuthMiddleware.optionalAuth,
    authController.getLoginUrl
);

// Alternative POST endpoint for generate-login-url (for frontend compatibility)
router.post('/auth/generate-login-url', 
    AuthMiddleware.optionalAuth,
    authController.getLoginUrl
);

// Handle authentication callback from Flattrade with database integration
router.get('/login/callback', 
    async (req, res, next) => {
        try {
            // First, handle the standard callback
            await authController.handleLoginCallback(req, res, next);
            
            // If successful, also create/update user session in database
            if (req.app.locals.FLATTRADE_TOKEN) {
                await createOrUpdateUserSession(req, res);
            }
        } catch (error) {
            console.error('❌ Database-integrated login callback error:', error.message);
            // Fallback to standard callback behavior
            authController.handleLoginCallback(req, res, next);
        }
    }
);

// Enhanced authentication status with database integration
router.get('/auth/status', 
    AuthMiddleware.optionalAuth,
    async (req, res) => {
        try {
            // Get standard auth status
            const standardStatus = await authController.getAuthStatus(req, res);
            
            // If database is connected, enhance with database info
            if (dbConfig.isConnected && req.authToken) {
                try {
                    const user = await User.findBySessionToken(req.authToken);
                    
                    if (user) {
                        // Enhance response with database user info
                        const enhancedResponse = {
                            ...standardStatus._getData ? JSON.parse(standardStatus._getData()) : {},
                            database: {
                                connected: true,
                                user_id: user._id,
                                username: user.username,
                                email: user.email,
                                is_authenticated: user.isAuthenticated,
                                active_sessions: user.activeSessions.length,
                                last_active: user.last_active_at,
                                preferences: user.getDashboardConfig()
                            }
                        };
                        
                        return res.json(enhancedResponse);
                    }
                } catch (dbError) {
                    console.log('⚠️ Database lookup failed, using standard auth status:', dbError.message);
                }
            }
            
            // Return standard status if database not available or user not found
            if (!res.headersSent) {
                return authController.getAuthStatus(req, res);
            }
            
        } catch (error) {
            console.error('❌ Enhanced auth status error:', error.message);
            return authController.getAuthStatus(req, res);
        }
    }
);

// Connect to live data (may require auth)
router.post('/connect/live', 
    AuthMiddleware.enhancedAuth,
    authController.connectLiveData
);

/**
 * Protected Authentication Routes (auth required)
 */

// Refresh authentication token
router.post('/auth/refresh', 
    AuthMiddleware.requireAuth,
    AuthMiddleware.autoRefresh,
    authController.refreshToken
);

// Logout and clear authentication
router.post('/auth/logout', 
    AuthMiddleware.optionalAuth, // Allow logout even without valid token
    authController.logout
);

/**
 * Health and Monitoring Routes
 */

// Authentication service health check
router.get('/auth/health', 
    AuthMiddleware.healthCheckAuth,
    authController.getAuthHealth
);

/**
 * Advanced Authentication Routes
 */

// Force reload credentials from environment variables
router.post('/auth/reload-credentials', 
    AuthMiddleware.optionalAuth, // Allow this even without valid auth since it's needed for fixing auth
    authController.forceReloadCredentials
);

// Force token refresh (admin only)
router.post('/auth/force-refresh', 
    AuthMiddleware.requireAdminAuth,
    async (req, res) => {
        try {
            console.log('🔧 Force token refresh requested (admin)');
            
            const result = await require('../services/auth/unified-auth.service').refreshToken();
            
            if (result.success) {
                // Update app locals
                if (req.app.locals) {
                    req.app.locals.FLATTRADE_TOKEN = result.token;
                }
                
                res.json({
                    success: true,
                    message: 'Token force refreshed successfully',
                    timestamp: result.timestamp,
                    admin: true
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                    message: 'Force refresh failed',
                    timestamp: result.timestamp,
                    admin: true
                });
            }
        } catch (error) {
            console.error('❌ Force refresh error:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Internal server error during force refresh',
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Clear authentication session (admin only)
router.post('/auth/clear-session', 
    AuthMiddleware.requireAdminAuth,
    (req, res) => {
        try {
            console.log('🗑️ Clear session requested (admin)');
            
            const tokenManager = require('../utils/token-manager');
            tokenManager.clearToken();
            
            // Clear app locals
            if (req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = null;
            }
            
            res.json({
                success: true,
                message: 'Authentication session cleared successfully',
                timestamp: new Date().toISOString(),
                admin: true
            });
        } catch (error) {
            console.error('❌ Clear session error:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to clear session',
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get detailed token information (admin only)
router.get('/auth/token-info', 
    AuthMiddleware.requireAdminAuth,
    (req, res) => {
        try {
            const tokenManager = require('../utils/token-manager');
            const authStatus = tokenManager.getAuthStatus();
            
            res.json({
                success: true,
                tokenInfo: {
                    ...authStatus,
                    hasRequestCode: !!tokenManager.getRequestCode(),
                    requestCodePreview: tokenManager.getRequestCode() ? 
                        tokenManager.getRequestCode().substring(0, 8) + '...' : null
                },
                admin: true,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Token info error:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to get token information',
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Development and Testing Routes (only in development)
 */

if (process.env.NODE_ENV === 'development') {
    // Test authentication flow
    router.get('/auth/test', 
        AuthMiddleware.optionalAuth,
        (req, res) => {
            res.json({
                success: true,
                message: 'Authentication test endpoint',
                environment: 'development',
                authToken: req.authToken ? 'Present' : 'Not Present',
                isAuthenticated: req.isAuthenticated,
                authStatus: req.authStatus,
                timestamp: new Date().toISOString()
            });
        }
    );

    // Simulate authentication success (for testing)
    router.post('/auth/simulate-success', 
        (req, res) => {
            try {
                const mockToken = 'mock_token_' + Date.now();
                const mockRequestCode = 'mock_request_' + Date.now();
                
                const tokenManager = require('../utils/token-manager');
                tokenManager.setToken(mockToken, mockRequestCode, 3600); // 1 hour
                
                // Update app locals
                if (req.app.locals) {
                    req.app.locals.FLATTRADE_TOKEN = mockToken;
                }
                
                res.json({
                    success: true,
                    message: 'Mock authentication successful',
                    token: mockToken.substring(0, 15) + '...',
                    environment: 'development',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    message: 'Mock authentication failed',
                    timestamp: new Date().toISOString()
                });
            }
        }
    );
}

/**
 * Database-Enhanced Routes
 */

// User registration endpoint
router.post('/register', 
    AuthMiddleware.securityHeaders,
    async (req, res) => {
        try {
            const { username, email, password } = req.body;
            
            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'Username, email, and password are required',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Check if database is connected
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    message: 'User registration requires database connection',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Create new user
            const newUser = new User({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password_hash: password, // Will be hashed by pre-save middleware
                status: 'active'
            });
            
            await newUser.save();
            
            console.log(`✅ New user registered: ${username} (${email})`);
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ User registration error:', error.message);
            
            // Handle duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                return res.status(409).json({
                    success: false,
                    error: 'Duplicate field',
                    message: `${field} already exists`,
                    field: field,
                    timestamp: new Date().toISOString()
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Registration failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Helper Functions
 */

async function createOrUpdateUserSession(req, res) {
    try {
        if (!dbConfig.isConnected || !req.app.locals.FLATTRADE_TOKEN) {
            return;
        }
        
        // Create a default user for Flattrade authentication
        const defaultEmail = 'trader@nse-dashboard.local';
        const defaultUsername = 'NSETrader';
        
        let user = await User.findOne({ email: defaultEmail });
        
        if (!user) {
            user = new User({
                username: defaultUsername,
                email: defaultEmail,
                flattrade: {
                    is_authenticated: true,
                    last_token_refresh: new Date()
                },
                status: 'active'
            });
        }
        
        // Update Flattrade auth info
        await user.updateFlattradeAuth({
            is_authenticated: true,
            last_token_refresh: new Date(),
            token_expires_at: new Date(Date.now() + (8 * 60 * 60 * 1000)) // 8 hours
        });
        
        // Create session
        const deviceInfo = {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip || req.connection.remoteAddress
        };
        
        await user.createSession(req.app.locals.FLATTRADE_TOKEN, deviceInfo);
        
        console.log('✅ Database session created for authenticated user');
        
    } catch (error) {
        console.error('❌ Session creation error:', error.message);
    }
}

/**
 * Error handling middleware for auth routes
 */
router.use((error, req, res, next) => {
    console.error('❌ Auth route error:', error.message);
    
    res.status(error.status || 500).json({
        success: false,
        error: error.message,
        message: 'Authentication route error',
        route: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

/**
 * Route not found handler - Only handle auth-related routes, avoid catching market data routes
 */
router.use((req, res, next) => {
    // Only handle auth-related routes, let other API versions and market data routes pass through
    if (req.originalUrl.startsWith('/api/v3') || 
        req.originalUrl.startsWith('/api/multi') || 
        req.originalUrl.startsWith('/api/data') ||
        req.originalUrl.startsWith('/api/health') ||
        req.originalUrl.startsWith('/api/indices') ||
        req.originalUrl.startsWith('/api/gainers') ||
        req.originalUrl.startsWith('/api/losers') ||
        req.originalUrl.startsWith('/api/nse-direct') ||
        req.originalUrl.startsWith('/api/sectors') ||
        req.originalUrl.startsWith('/api/fno-analysis') ||
        req.originalUrl.startsWith('/api/options-chain') ||
        req.originalUrl.startsWith('/api/btst') ||
        req.originalUrl.startsWith('/api/scalping') ||
        req.originalUrl.startsWith('/api/trading-alerts') ||
        req.originalUrl.startsWith('/api/trend') ||
        req.originalUrl.startsWith('/api/scalping-signals') ||
        req.originalUrl.startsWith('/api/major-indices')) {
        return next(); // Pass through to market data routes
    }
    
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Authentication route ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /api/login/url',
            'GET /api/login/callback',
            'GET /api/auth/status',
            'POST /api/auth/generate-login-url',
            'POST /api/connect/live',
            'POST /api/auth/refresh',
            'POST /api/auth/logout',
            'GET /api/auth/health',
            'POST /api/auth/reload-credentials'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;