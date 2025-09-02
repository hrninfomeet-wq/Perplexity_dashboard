// dashboard-backend/src/routes/authRoutes.js

/**
 * Unified Authentication Routes
 * Uses new middleware and simplified controller structure
 * Replaces the previous route configuration with enhanced functionality
 * 
 * @version 2.1.0
 * @created September 01, 2025
 */

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const authController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth.middleware');

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

// Handle authentication callback from Flattrade
router.get('/login/callback', 
    authController.handleLoginCallback
);

// Get current authentication status (public endpoint)
router.get('/auth/status', 
    AuthMiddleware.optionalAuth,
    authController.getAuthStatus
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
router.use('*', (req, res) => {
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
            'GET /api/auth/health'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;