// dashboard-backend/src/controllers/authController.js

/**
 * Simplified Authentication Controller
 * Uses the unified authentication service for all operations
 * Replaces the previous complex controller with clean, maintainable code
 * 
 * @version 2.1.0
 * @created September 01, 2025
 */

const unifiedAuthService = require('../services/auth/unified-auth.service');
const tokenManager = require('../utils/token-manager');

/**
 * Get Flattrade login URL
 * @route GET /api/login/url
 */
const getLoginUrl = async (req, res) => {
    try {
        console.log('🔑 Login URL requested');
        
        const result = await unifiedAuthService.generateLoginUrl();
        
        if (result.success) {
            res.json({
                success: true,
                loginUrl: result.loginUrl,
                message: 'Login URL generated successfully',
                timestamp: result.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                message: 'Failed to generate login URL',
                timestamp: result.timestamp
            });
        }
    } catch (error) {
        console.error('❌ Get login URL error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Internal server error while generating login URL',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Handle authentication callback from Flattrade
 * @route GET /api/login/callback
 */
const handleLoginCallback = async (req, res) => {
    try {
        const requestCode = req.query.code || req.query.request_code;
        
        console.log('🔄 Processing authentication callback');
        
        if (!requestCode) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 8px; }
                        .button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <h1>❌ Authentication Error</h1>
                    <div class="error">
                        <p><strong>Error:</strong> No request code received from Flattrade.</p>
                        <p>Please try the authentication process again.</p>
                    </div>
                    <a href="http://localhost:5173" class="button">Return to Dashboard</a>
                </body>
                </html>
            `);
        }

        const result = await unifiedAuthService.handleAuthCallback(requestCode);
        
        if (result.success) {
            // Update app locals for immediate availability
            req.app.locals.FLATTRADE_TOKEN = result.token;
            
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                        .success { color: #2e7d32; background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                        .button { background: #2e7d32; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin: 10px; }
                        .token-info { font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 4px; margin: 10px 0; }
                    </style>
                    <script>
                        // Notify parent window of successful authentication
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'auth-success',
                                token: '${result.token.substring(0, 10)}...',
                                timestamp: '${result.timestamp}'
                            }, '*');
                        }
                        // Auto-close after 3 seconds
                        setTimeout(() => window.close(), 3000);
                    </script>
                </head>
                <body>
                    <h1>✅ Authentication Successful!</h1>
                    <div class="success">
                        <h2>Welcome to NSE Trading Dashboard</h2>
                        <p>Your authentication has been completed successfully.</p>
                    </div>
                    
                    <div class="info">
                        <h3>📊 Live Data Now Available</h3>
                        <p>• Real-time market data from Flattrade API</p>
                        <p>• F&O analysis with live option chains</p>
                        <p>• BTST scanning with current market conditions</p>
                        <p>• Scalping opportunities with real-time signals</p>
                    </div>
                    
                    <div class="token-info">
                        <strong>Token Expires:</strong> ${new Date(Date.now() + (result.expiresIn * 1000)).toLocaleString('en-IN')}
                    </div>
                    
                    <a href="http://localhost:5173" class="button">Return to Dashboard</a>
                    
                    <p><small>This window will close automatically in 3 seconds...</small></p>
                </body>
                </html>
            `);
        } else {
            res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Failed</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 8px; }
                        .button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 15px; }
                    </style>
                    <script>
                        // Notify parent window of auth failure
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'auth-error',
                                error: '${result.error}'
                            }, '*');
                        }
                    </script>
                </head>
                <body>
                    <h1>❌ Authentication Failed</h1>
                    <div class="error">
                        <p><strong>Error:</strong> ${result.error}</p>
                        <p>Please try the authentication process again.</p>
                    </div>
                    <a href="http://localhost:5173" class="button">Return to Dashboard</a>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('❌ Authentication callback error:', error.message);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Error</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                    .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 8px; }
                    .button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 15px; }
                </style>
            </head>
            <body>
                <h1>❌ Authentication Error</h1>
                <div class="error">
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>An internal server error occurred during authentication.</p>
                </div>
                <a href="http://localhost:5173" class="button">Return to Dashboard</a>
            </body>
            </html>
        `);
    }
};

/**
 * Get current authentication status
 * @route GET /api/auth/status
 */
const getAuthStatus = (req, res) => {
    try {
        console.log('📋 Authentication status requested');
        
        const authStatus = unifiedAuthService.getAuthStatus();
        
        res.json({
            success: true,
            ...authStatus,
            message: authStatus.authenticated ? 'User is authenticated' : 'User is not authenticated'
        });
    } catch (error) {
        console.error('❌ Get auth status error:', error.message);
        res.status(500).json({
            success: false,
            authenticated: false,
            error: error.message,
            message: 'Failed to get authentication status',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Connect to live data (initiate authentication if needed)
 * @route POST /api/connect/live
 */
const connectLiveData = async (req, res) => {
    try {
        console.log('📡 Connect to live data requested');
        
        const result = await unifiedAuthService.connectLiveData();
        
        if (result.success) {
            // Update app locals if authenticated
            if (result.authenticated && req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = tokenManager.getToken();
            }
            
            res.json({
                success: true,
                authenticated: result.authenticated,
                message: result.message,
                loginUrl: result.loginUrl,
                needsLogin: result.needsLogin,
                timestamp: result.timestamp
            });
        } else {
            res.status(400).json({
                success: false,
                authenticated: false,
                error: result.error,
                message: result.message || 'Failed to connect to live data',
                loginUrl: result.loginUrl,
                needsLogin: result.needsLogin,
                timestamp: result.timestamp
            });
        }
    } catch (error) {
        console.error('❌ Connect live data error:', error.message);
        res.status(500).json({
            success: false,
            authenticated: false,
            error: error.message,
            message: 'Internal server error while connecting to live data',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Refresh authentication token
 * @route POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
    try {
        console.log('🔄 Token refresh requested');
        
        const result = await unifiedAuthService.refreshToken();
        
        if (result.success) {
            // Update app locals
            if (req.app.locals) {
                req.app.locals.FLATTRADE_TOKEN = result.token;
            }
            
            res.json({
                success: true,
                message: result.message,
                token: 'Updated successfully',
                timestamp: result.timestamp
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                message: 'Token refresh failed',
                timestamp: result.timestamp
            });
        }
    } catch (error) {
        console.error('❌ Token refresh error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Internal server error during token refresh',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Logout and clear authentication
 * @route POST /api/auth/logout
 */
const logout = (req, res) => {
    try {
        console.log('🚪 Logout requested');
        
        const result = unifiedAuthService.logout();
        
        // Clear app locals
        if (req.app.locals) {
            req.app.locals.FLATTRADE_TOKEN = null;
        }
        
        res.json({
            success: result.success,
            message: result.message,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('❌ Logout error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Internal server error during logout',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Get authentication service health
 * @route GET /api/auth/health
 */
const getAuthHealth = (req, res) => {
    try {
        const healthInfo = unifiedAuthService.getHealthInfo();
        
        res.json({
            success: true,
            ...healthInfo
        });
    } catch (error) {
        console.error('❌ Auth health check error:', error.message);
        res.status(500).json({
            success: false,
            service: 'UnifiedAuthService',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    getLoginUrl,
    handleLoginCallback,
    getAuthStatus,
    connectLiveData,
    refreshToken,
    logout,
    getAuthHealth
};