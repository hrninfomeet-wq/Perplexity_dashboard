// dashboard-backend/src/controllers/enhancedAuthController.js
const AuthenticationManager = require('../services/authenticationManager');

class EnhancedAuthController {
    constructor() {
        this.authManager = new AuthenticationManager();
        this.initialized = false;
    }

    /**
     * Initialize authentication system
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🔐 Initializing enhanced authentication controller...');
        const result = await this.authManager.initialize();
        this.initialized = true;
        
        return result;
    }

    /**
     * Get authentication status
     */
    getAuthStatus = (req, res) => {
        try {
            const status = this.authManager.getStatus();
            const healthCheck = this.authManager.healthCheck();
            
            res.json({
                authenticated: status.isAuthenticated,
                hasToken: status.hasToken,
                tokenExpiry: status.tokenExpiry,
                timeUntilExpiry: status.timeUntilExpiry,
                health: healthCheck,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get auth status',
                message: error.message
            });
        }
    };

    /**
     * Get login URL for manual authentication
     */
    getLoginUrl = (req, res) => {
        try {
            const loginUrl = this.authManager.getLoginUrl();
            
            res.json({
                success: true,
                loginUrl,
                message: 'Login URL generated successfully'
            });
        } catch (error) {
            console.error('❌ Error generating login URL:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to generate login URL',
                message: error.message
            });
        }
    };

    /**
     * Handle login callback from Flattrade
     */
    handleLoginCallback = async (req, res) => {
        const requestCode = req.query.code || req.query.request_code;

        if (!requestCode) {
            return res.status(400).send(`
                <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>❌ Error</h1>
                    <p>No request code received from Flattrade.</p>
                    <p>Please try the authentication process again.</p>
                </body></html>
            `);
        }

        try {
            console.log('🔑 Processing authentication callback...');
            
            const result = await this.authManager.handleAuthentication(requestCode);
            
            if (result.success) {
                // Update app locals for backward compatibility
                req.app.locals.FLATTRADE_TOKEN = result.token;
                
                res.send(`
                    <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>✅ Authentication Successful!</h1>
                        <p>Your session has been established and will auto-refresh.</p>
                        <p>You can now close this window and return to the dashboard.</p>
                        <p>Live data will be available shortly.</p>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ 
                                    type: 'auth-success',
                                    autoRefresh: true,
                                    expiry: '${this.authManager.tokenExpiry}'
                                }, '*');
                            }
                            setTimeout(() => window.close(), 3000);
                        </script>
                    </body></html>
                `);
            } else {
                throw new Error('Authentication failed');
            }

        } catch (error) {
            console.error('❌ Authentication callback error:', error.message);
            
            res.status(500).send(`
                <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>❌ Authentication Failed</h1>
                    <p>Error: ${error.message}</p>
                    <p>Please try again or contact support if the issue persists.</p>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ 
                                type: 'auth-error', 
                                error: '${error.message}' 
                            }, '*');
                        }
                        setTimeout(() => window.close(), 5000);
                    </script>
                </body></html>
            `);
        }
    };

    /**
     * Connect to live data (enhanced with auto-auth)
     */
    connectLiveData = async (req, res) => {
        try {
            // Initialize if not already done
            if (!this.initialized) {
                await this.initialize();
            }

            const status = this.authManager.getStatus();
            
            // If already authenticated and token is valid
            if (status.isAuthenticated) {
                try {
                    const validToken = await this.authManager.getValidToken();
                    req.app.locals.FLATTRADE_TOKEN = validToken;
                    
                    return res.json({
                        success: true,
                        message: 'Already connected to live data',
                        authenticated: true,
                        autoAuthenticated: true,
                        tokenExpiry: this.authManager.tokenExpiry
                    });
                } catch (error) {
                    console.log('⚠️ Token validation failed, requiring fresh login');
                }
            }

            // Try auto-refresh first
            const refreshed = await this.authManager.attemptTokenRefresh();
            if (refreshed) {
                req.app.locals.FLATTRADE_TOKEN = this.authManager.currentToken;
                
                return res.json({
                    success: true,
                    message: 'Connected to live data via auto-refresh',
                    authenticated: true,
                    autoAuthenticated: true,
                    tokenExpiry: this.authManager.tokenExpiry
                });
            }

            // If auto-refresh failed, provide login URL
            const loginUrl = this.authManager.getLoginUrl();
            
            res.json({
                success: false,
                needsLogin: true,
                loginUrl: loginUrl,
                message: 'Manual authentication required',
                autoRefreshFailed: true
            });

        } catch (error) {
            console.error('❌ Error in connectLiveData:', error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                needsLogin: true
            });
        }
    };

    /**
     * Force refresh token
     */
    refreshToken = async (req, res) => {
        try {
            const refreshed = await this.authManager.attemptTokenRefresh();
            
            if (refreshed) {
                req.app.locals.FLATTRADE_TOKEN = this.authManager.currentToken;
                
                res.json({
                    success: true,
                    message: 'Token refreshed successfully',
                    tokenExpiry: this.authManager.tokenExpiry
                });
            } else {
                res.json({
                    success: false,
                    message: 'Token refresh failed, manual authentication required',
                    needsLogin: true,
                    loginUrl: this.authManager.getLoginUrl()
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * Logout and clear session
     */
    logout = async (req, res) => {
        try {
            await this.authManager.clearSession();
            req.app.locals.FLATTRADE_TOKEN = null;
            
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * Get current valid token (for internal use)
     */
    async getValidToken() {
        if (!this.initialized) {
            await this.initialize();
        }
        
        return await this.authManager.getValidToken();
    }

    /**
     * Check if authenticated (for internal use)
     */
    isAuthenticated() {
        return this.authManager.getStatus().isAuthenticated;
    }

    /**
     * Authentication health check endpoint
     */
    healthCheck = async (req, res) => {
        try {
            const health = await this.authManager.healthCheck();
            
            res.json({
                ...health,
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    };
}

// Create singleton instance
const enhancedAuthController = new EnhancedAuthController();

module.exports = enhancedAuthController;
