// dashboard-backend/src/controllers/authController.js
const axios = require('axios');
const { updateEnvFile } = require('../utils/envUtils');
const unifiedAuthService = require('../services/auth/unified-auth.service');

const getLoginUrl = async (req, res) => {
    try {
        console.log('🔑 Generating login URL using unified auth service...');
        
        const result = await unifiedAuthService.generateLoginUrl();
        
        if (result.success) {
            console.log('✅ Login URL generated successfully');
            res.json({ loginUrl: result.loginUrl });
        } else {
            console.log('❌ Failed to generate login URL:', result.error);
            res.status(500).json({
                error: result.error || 'Failed to generate login URL'
            });
        }
    } catch (error) {
        console.error('❌ Error generating login URL:', error.message);
        res.status(500).json({
            error: error.message
        });
    }
};

const handleLoginCallback = async (req, res) => {
    try {
        const request_code = req.query.code || req.query.request_code;
        
        if (!request_code) {
            return res.status(400).send(`<html><body><h1>❌ Error</h1><p>No request code received from Flattrade.</p></body></html>`);
        }

        console.log('� Processing login callback using unified auth service...');
        
        const result = await unifiedAuthService.handleAuthCallback(request_code);
        
        if (result.success) {
            console.log('✅ Authentication successful');
            
            // Update in-memory token
            req.app.locals.FLATTRADE_TOKEN = result.token;
            
            // Auto-update .env file with new token
            try {
                await updateEnvFile('FLATTRADE_TOKEN', result.token);
                console.log('🔄 Token automatically updated in .env file');
            } catch (envError) {
                console.error('⚠️ Failed to update .env file:', envError.message);
                // Continue execution even if .env update fails
            }

            res.send(`
                <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>✅ Authentication Successful!</h1>
                    <p>You can now close this window and return to the dashboard.</p>
                    <p>Live data will be available shortly.</p>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'auth-success' }, '*');
                        }
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body></html>
            `);
        } else {
            console.log('❌ Authentication failed:', result.error);
            // Properly escape the error to prevent XSS
            const safeError = String(result.error || 'Unknown error').replace(/[<>&"']/g, function(m) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[m];
            });
            
            res.status(500).send(`
                <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>❌ Authentication Failed</h1>
                    <div id="error-message"></div>
                    <script>
                        // Safely display error message using DOM manipulation
                        const errorElement = document.getElementById('error-message');
                        errorElement.textContent = 'Error: ' + ${JSON.stringify(safeError)};
                        
                        if (window.opener) {
                            // Use JSON.stringify to safely encode the error message
                            window.opener.postMessage({ 
                                type: 'auth-error', 
                                error: ${JSON.stringify(result.error || 'Unknown error')} 
                            }, '*');
                        }
                        }
                    </script>
                </body></html>
            `);
        }
    } catch (error) {
        console.error('❌ Error during login callback:', error.message);
        res.status(500).send(`
            <html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>❌ Authentication Failed</h1>
                <p>Error: ${error.message}</p>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'auth-error', error: '${error.message}' }, '*');
                    }
                </script>
            </body></html>
        `);
    }
};

const getAuthStatus = async (req, res) => {
    try {
        console.log('🔍 Checking authentication status...');
        
        const result = await unifiedAuthService.getAuthStatus();
        
        res.json({
            authenticated: result.authenticated,
            timestamp: new Date().toISOString(),
            data: result.data || {}
        });
    } catch (error) {
        console.error('❌ Error checking auth status:', error.message);
        res.json({
            authenticated: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
};

const connectLiveData = async (req, res) => {
    try {
        // Check if we already have a valid token
        if (req.app.locals.FLATTRADE_TOKEN) {
            return res.json({
                success: true,
                message: 'Already connected to live data',
                authenticated: true
            });
        }

        // Try to use existing request code if available
        const request_code = process.env.FLATTRADE_REQUEST_CODE;
        
        if (request_code) {
            console.log('🔄 Attempting to use existing request code...');
            
            try {
                const response = await axios.post(TOKEN_ENDPOINT, {
                    app_key: process.env.FLATTRADE_API_KEY,
                    app_secret: process.env.FLATTRADE_API_SECRET,
                    request_code
                });

                if (response.data.stat === 'Ok') {
                    const { token } = response.data;
                    console.log('✅ Token obtained using existing request code');

                    // Update .env with the new token
                    await updateEnvFile('FLATTRADE_TOKEN', token);
                    
                    // Update in-memory token
                    req.app.locals.FLATTRADE_TOKEN = token;

                    return res.json({
                        success: true,
                        message: 'Connected to live data successfully',
                        authenticated: true
                    });
                }
            } catch (error) {
                console.log('⚠️ Request code expired or invalid, need fresh login');
            }
        }

        // If no valid token, return login URL
        const API_KEY = process.env.FLATTRADE_API_KEY;
        const REDIRECT_URI = process.env.FLATTRADE_REDIRECT_URI;

        if (!API_KEY || !REDIRECT_URI) {
            return res.status(500).json({
                success: false,
                error: 'Configuration error: Missing API_KEY or REDIRECT_URI'
            });
        }

        const loginUrl = `${AUTH_PORTAL}?app_key=${encodeURIComponent(API_KEY)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
        
        res.json({
            success: false,
            needsLogin: true,
            loginUrl: loginUrl,
            message: 'Authentication required'
        });

    } catch (error) {
        console.error('Error in connectLiveData:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Refresh authentication token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const refreshToken = async (req, res) => {
    try {
        console.log('🔄 Processing token refresh request...');
        
        const result = await unifiedAuthService.refreshToken();
        
        if (result.success) {
            console.log('✅ Token refreshed successfully');
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: result.data
            });
        } else {
            console.log('❌ Token refresh failed:', result.error);
            res.status(400).json({
                success: false,
                error: result.error || 'Token refresh failed'
            });
        }
    } catch (error) {
        console.error('❌ Error refreshing token:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Logout and clear authentication
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const logout = async (req, res) => {
    try {
        console.log('👋 Processing logout request...');
        
        const result = unifiedAuthService.logout();
        
        console.log('✅ Logout completed successfully');
        res.json({
            success: true,
            message: 'Logged out successfully',
            data: result
        });
    } catch (error) {
        console.error('❌ Error during logout:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get authentication health status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getAuthHealth = async (req, res) => {
    try {
        console.log('🏥 Checking authentication health...');
        
        const healthInfo = unifiedAuthService.getHealthInfo();
        
        console.log('✅ Health check completed');
        res.json({
            success: true,
            message: 'Authentication health check completed',
            data: healthInfo
        });
    } catch (error) {
        console.error('❌ Error checking auth health:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const forceReloadCredentials = async (req, res) => {
    try {
        console.log('🔃 Force reloading Flattrade credentials...');
        
        // Force reload credentials in the unified auth service
        const result = await unifiedAuthService.forceReloadCredentials();
        
        if (result.success) {
            console.log('✅ Credentials force reloaded successfully');
            res.json({
                success: true,
                message: 'Credentials reloaded from environment variables',
                tokenFound: !!process.env.FLATTRADE_TOKEN
            });
        } else {
            console.log('❌ Failed to reload credentials:', result.error);
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to reload credentials'
            });
        }
    } catch (error) {
        console.error('❌ Error force reloading credentials:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
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
    getAuthHealth,
    forceReloadCredentials
};
