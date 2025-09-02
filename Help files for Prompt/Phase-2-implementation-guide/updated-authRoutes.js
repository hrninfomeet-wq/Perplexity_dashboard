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

// Generate Flattrade login URL
router.get('/login/url', 
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

// Connect to live data with database session tracking
router.post('/connect/live', 
    AuthMiddleware.enhancedAuth,
    async (req, res) => {
        try {
            // Call standard connect live data
            const result = await authController.connectLiveData(req, res);
            
            // If successful and database is available, track the connection
            if (result && req.app.locals.FLATTRADE_TOKEN && dbConfig.isConnected) {
                try {
                    await trackUserConnection(req);
                } catch (dbError) {
                    console.log('⚠️ Connection tracking failed:', dbError.message);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Enhanced connect live data error:', error.message);
            return authController.connectLiveData(req, res);
        }
    }
);

/**
 * Protected Authentication Routes (auth required)
 */

// Refresh authentication token with database session update
router.post('/auth/refresh', 
    AuthMiddleware.requireAuth,
    AuthMiddleware.autoRefresh,
    async (req, res) => {
        try {
            // Call standard refresh token
            const result = await authController.refreshToken(req, res);
            
            // Update database session if available
            if (req.authToken && dbConfig.isConnected) {
                try {
                    const user = await User.findBySessionToken(req.authToken);
                    if (user) {
                        const session = user.sessions.find(s => s.token === req.authToken);
                        if (session) {
                            await user.updateSessionActivity(session.session_id);
                        }
                    }
                } catch (dbError) {
                    console.log('⚠️ Session update after refresh failed:', dbError.message);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Enhanced token refresh error:', error.message);
            return authController.refreshToken(req, res);
        }
    }
);

// Logout with database session cleanup
router.post('/auth/logout', 
    AuthMiddleware.optionalAuth,
    async (req, res) => {
        try {
            // Clean up database session first
            if (req.authToken && dbConfig.isConnected) {
                try {
                    const user = await User.findBySessionToken(req.authToken);
                    if (user) {
                        const session = user.sessions.find(s => s.token === req.authToken);
                        if (session) {
                            await user.removeSession(session.session_id);
                            console.log('🗑️ Database session cleaned up during logout');
                        }
                    }
                } catch (dbError) {
                    console.log('⚠️ Database session cleanup failed:', dbError.message);
                }
            }
            
            // Perform standard logout
            return authController.logout(req, res);
            
        } catch (error) {
            console.error('❌ Enhanced logout error:', error.message);
            return authController.logout(req, res);
        }
    }
);

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
                status: 'active',
                preferences: {
                    dashboard: {
                        refresh_rate: 5000,
                        default_view: 'full',
                        show_alerts: true,
                        show_btst: true,
                        show_scalping: true,
                        show_fno: true
                    },
                    trading: {
                        risk_tolerance: 'moderate',
                        default_capital: 10000,
                        auto_signals: true,
                        signal_types: ['btst', 'scalping'],
                        preferred_segments: ['equity', 'fno']
                    },
                    notifications: {
                        email_alerts: false,
                        browser_notifications: true,
                        sound_alerts: false
                    }
                }
            });
            
            await newUser.save();
            
            console.log(`✅ New user registered: ${username} (${email})`);
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    preferences: newUser.getDashboardConfig()
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
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }));
                
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Invalid user data',
                    validation_errors: validationErrors,
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

// User login endpoint
router.post('/login', 
    AuthMiddleware.securityHeaders,
    async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing credentials',
                    message: 'Email and password are required',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Check if database is connected
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    message: 'User login requires database connection',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Find user with password hash
            const user = await User.findOne({ 
                email: email.trim().toLowerCase(),
                status: 'active'
            }).select('+password_hash');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Generate session token
            const sessionToken = require('crypto').randomBytes(32).toString('hex');
            
            // Create session in database
            const deviceInfo = {
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip || req.connection.remoteAddress
            };
            
            const sessionId = await user.createSession(sessionToken, deviceInfo);
            
            // Update login activity
            user.activity.last_login = new Date();
            user.activity.login_count += 1;
            user.last_active_at = new Date();
            await user.save();
            
            console.log(`✅ User login successful: ${user.username} (${user.email})`);
            
            res.json({
                success: true,
                message: 'Login successful',
                token: sessionToken,
                session_id: sessionId,
                user: user.toSafeObject(),
                dashboard_config: user.getDashboardConfig(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ User login error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Login failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get user profile
router.get('/profile', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    message: 'User session not found',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                user: user.toSafeObject(),
                dashboard_config: user.getDashboardConfig(),
                activity: user.activity,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Get user profile error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Profile retrieval failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Update user preferences
router.put('/preferences', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }
            
            const success = await user.updatePreferences(req.body);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Preferences updated successfully',
                    preferences: user.getDashboardConfig(),
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Preferences update failed',
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('❌ Update preferences error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Preferences update failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Health and Monitoring Routes
 */

// Enhanced authentication service health check
router.get('/auth/health', 
    AuthMiddleware.healthCheckAuth,
    async (req, res) => {
        try {
            // Get standard health info
            const standardHealth = await authController.getAuthHealth(req, res);
            
            // Add database health information
            const dbHealth = await dbConfig.getHealthStatus();
            
            // Get user statistics
            let userStats = {};
            if (dbConfig.isConnected) {
                try {
                    const activeUsers = await User.getActiveUsersCount();
                    const totalUsers = await User.countDocuments({ status: 'active' });
                    
                    userStats = {
                        total_users: totalUsers,
                        active_users: activeUsers,
                        active_sessions: await User.aggregate([
                            { $unwind: '$sessions' },
                            { $match: { 'sessions.is_active': true, 'sessions.expires_at': { $gt: new Date() } } },
                            { $count: 'active_sessions' }
                        ]).then(result => result[0]?.active_sessions || 0)
                    };
                } catch (error) {
                    console.error('Error getting user stats:', error.message);
                }
            }
            
            const enhancedHealth = {
                ...standardHealth,
                database: dbHealth,
                user_statistics: userStats,
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                ...enhancedHealth
            });
            
        } catch (error) {
            console.error('❌ Enhanced auth health error:', error.message);
            return authController.getAuthHealth(req, res);
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
        
        // For now, we'll create a default user for Flattrade authentication
        // In production, this would be linked to actual user registration
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

async function trackUserConnection(req) {
    try {
        if (!dbConfig.isConnected || !req.authToken) {
            return;
        }
        
        const user = await User.findBySessionToken(req.authToken);
        
        if (user) {
            user.last_active_at = new Date();
            await user.save();
            console.log('📊 User connection tracked in database');
        }
        
    } catch (error) {
        console.error('❌ Connection tracking error:', error.message);
    }
}

/**
 * Advanced Authentication Routes
 */

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
                
                // Update database sessions if connected
                if (dbConfig.isConnected) {
                    try {
                        await User.updateMany(
                            { 'flattrade.is_authenticated': true },
                            { 
                                $set: { 
                                    'flattrade.last_token_refresh': new Date(),
                                    'flattrade.token_expires_at': new Date(Date.now() + (8 * 60 * 60 * 1000))
                                }
                            }
                        );
                        console.log('🗃️ Database sessions updated with new token info');
                    } catch (dbError) {
                        console.log('⚠️ Database session update failed:', dbError.message);
                    }
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

// Clear authentication session (admin only) with database cleanup
router.post('/auth/clear-session', 
    AuthMiddleware.requireAdminAuth,
    async (req, res) => {
        try {
            console.log('🗑️ Clear session requested (admin)');
            
            const tokenManager = require('../utils/token-manager');
            tokenManager.clearToken();
            
            // Clear app locals
            if (req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = null;
            }
            
            // Clear all database sessions if connected
            if (dbConfig.isConnected) {
                try {
                    const result = await User.updateMany(
                        {},
                        { 
                            $set: { 
                                sessions: [],
                                'flattrade.is_authenticated': false
                            }
                        }
                    );
                    console.log(`🗃️ Cleared database sessions for ${result.modifiedCount} users`);
                } catch (dbError) {
                    console.log('⚠️ Database session clearing failed:', dbError.message);
                }
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
    async (req, res) => {
        try {
            const tokenManager = require('../utils/token-manager');
            const authStatus = tokenManager.getAuthStatus();
            
            // Get database session info if connected
            let dbSessionInfo = {};
            if (dbConfig.isConnected) {
                try {
                    const sessionStats = await User.aggregate([
                        { $unwind: '$sessions' },
                        {
                            $group: {
                                _id: null,
                                total_sessions: { $sum: 1 },
                                active_sessions: {
                                    $sum: {
                                        $cond: [
                                            { 
                                                $and: [
                                                    { $eq: ['$sessions.is_active', true] },
                                                    { $gt: ['$sessions.expires_at', new Date()] }
                                                ]
                                            },
                                            1, 0
                                        ]
                                    }
                                },
                                expired_sessions: {
                                    $sum: {
                                        $cond: [
                                            { $lt: ['$sessions.expires_at', new Date()] },
                                            1, 0
                                        ]
                                    }
                                }
                            }
                        }
                    ]);
                    
                    dbSessionInfo = sessionStats[0] || {
                        total_sessions: 0,
                        active_sessions: 0,
                        expired_sessions: 0
                    };
                } catch (dbError) {
                    console.error('Database session stats error:', dbError.message);
                }
            }
            
            res.json({
                success: true,
                tokenInfo: {
                    ...authStatus,
                    hasRequestCode: !!tokenManager.getRequestCode(),
                    requestCodePreview: tokenManager.getRequestCode() ? 
                        tokenManager.getRequestCode().substring(0, 8) + '...' : null
                },
                database_sessions: dbSessionInfo,
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
    // Test authentication flow with database
    router.get('/auth/test', 
        AuthMiddleware.optionalAuth,
        async (req, res) => {
            let dbTestResult = {};
            
            if (dbConfig.isConnected) {
                try {
                    await dbConfig.testConnection();
                    const userCount = await User.countDocuments();
                    
                    dbTestResult = {
                        database_connected: true,
                        test_ping: true,
                        total_users: userCount
                    };
                } catch (dbError) {
                    dbTestResult = {
                        database_connected: true,
                        test_ping: false,
                        error: dbError.message
                    };
                }
            } else {
                dbTestResult = {
                    database_connected: false,
                    message: 'Database not connected'
                };
            }
            
            res.json({
                success: true,
                message: 'Authentication test endpoint with database integration',
                environment: 'development',
                authToken: req.authToken ? 'Present' : 'Not Present',
                isAuthenticated: req.isAuthenticated,
                authStatus: req.authStatus,
                database: dbTestResult,
                timestamp: new Date().toISOString()
            });
        }
    );

    // Simulate authentication success with database user creation
    router.post('/auth/simulate-success', 
        async (req, res) => {
            try {
                const mockToken = 'mock_token_' + Date.now();
                const mockRequestCode = 'mock_request_' + Date.now();
                
                const tokenManager = require('../utils/token-manager');
                tokenManager.setToken(mockToken, mockRequestCode, 3600); // 1 hour
                
                // Update app locals
                if (req.app.locals) {
                    req.app.locals.FLATTRADE_TOKEN = mockToken;
                }
                
                // Create mock database user if database is connected
                let dbUser = null;
                if (dbConfig.isConnected) {
                    try {
                        const mockEmail = `test_${Date.now()}@mock.local`;
                        const mockUsername = `MockUser_${Date.now()}`;
                        
                        dbUser = new User({
                            username: mockUsername,
                            email: mockEmail,
                            flattrade: {
                                is_authenticated: true,
                                last_token_refresh: new Date()
                            },
                            status: 'active'
                        });
                        
                        await dbUser.save();
                        
                        // Create session
                        const deviceInfo = {
                            userAgent: req.get('User-Agent'),
                            ipAddress: req.ip || '127.0.0.1'
                        };
                        
                        await dbUser.createSession(mockToken, deviceInfo);
                        
                        console.log(`✅ Mock database user created: ${mockUsername}`);
                        
                    } catch (dbError) {
                        console.error('Mock user creation error:', dbError.message);
                    }
                }
                
                res.json({
                    success: true,
                    message: 'Mock authentication successful with database integration',
                    token: mockToken.substring(0, 15) + '...',
                    database_user: dbUser ? {
                        id: dbUser._id,
                        username: dbUser.username,
                        email: dbUser.email
                    } : null,
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
 * Route not found handler
 */
router.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Authentication route ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /api/login/url',
            'GET /api/login/callback',
            'GET /api/auth/status',
            'POST /api/connect/live',
            'POST /api/auth/refresh',
            'POST /api/auth/logout',
            'GET /api/auth/health',
            'POST /api/register',
            'POST /api/login',
            'GET /api/profile',
            'PUT /api/preferences'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;