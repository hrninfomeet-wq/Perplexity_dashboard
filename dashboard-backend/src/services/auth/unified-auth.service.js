// dashboard-backend/src/services/auth/unified-auth.service.js

/**
 * Unified Authentication Service
 * Consolidates all authentication logic into a single, maintainable service
 * Replaces both authController.js and enhancedAuthController.js
 * 
 * @version 2.1.0
 * @created September 01, 2025
 */

const crypto = require('crypto');
const axios = require('axios');
const authConfig = require('../../config/auth.config');
const tokenManager = require('../../utils/token-manager');
const { updateEnvFile } = require('../../utils/envUtils');

class UnifiedAuthService {
    constructor() {
        this.config = authConfig.flattrade;
        this.rateLimiting = authConfig.rateLimiting;
        this.lastApiCall = 0;
        this.apiCallCount = 0;
        this.retryAttempts = 0;
        this.maxRetries = authConfig.session.maxRetries;

        console.log('🔧 Unified Authentication Service initialized');
    }

    /**
     * Generate Flattrade login URL
     * @returns {Promise<object>} Login URL or error
     */
    async generateLoginUrl() {
        try {
            console.log('🔑 Generating Flattrade login URL...');

            if (!this.config.apiKey || !this.config.redirectUri) {
                throw new Error('Missing API_KEY or REDIRECT_URI in configuration');
            }

            const loginUrl = `${this.config.authPortal}?app_key=${encodeURIComponent(this.config.apiKey)}&redirect_uri=${encodeURIComponent(this.config.redirectUri)}`;
            
            console.log('✅ Login URL generated successfully');
            return {
                success: true,
                loginUrl,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate login URL:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Handle authentication callback and token exchange
     * @param {string} requestCode - Request code from Flattrade callback
     * @returns {Promise<object>} Token exchange result
     */
    async handleAuthCallback(requestCode) {
        try {
            if (!requestCode) {
                throw new Error('No request code received from Flattrade');
            }

            console.log('🔄 Processing authentication callback...');

            // Store request code immediately
            tokenManager.setRequestCode(requestCode);

            // Perform token exchange
            const tokenResult = await this.exchangeToken(requestCode);
            
            if (tokenResult.success) {
                // Update environment variables
                await this.updateEnvironmentVariables(tokenResult.token, requestCode);
                
                console.log('✅ Authentication callback processed successfully');
                return {
                    success: true,
                    message: 'Authentication successful',
                    token: tokenResult.token,
                    expiresIn: tokenResult.expiresIn || 28800,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error(tokenResult.error || 'Token exchange failed');
            }
        } catch (error) {
            console.error('❌ Authentication callback failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Exchange request code for access token
     * @param {string} requestCode - Request code from auth callback
     * @returns {Promise<object>} Token exchange result
     */
    async exchangeToken(requestCode) {
        try {
            console.log('📡 Exchanging request code for token...');

            // Apply rate limiting
            await this.applyRateLimit();

            // Generate SHA-256 hash for API secret
            const hashInput = this.config.apiKey + requestCode + this.config.apiSecret;
            const hashedSecret = crypto.createHash('sha256').update(hashInput).digest('hex');

            console.log('🔐 SHA-256 hash generated for API secret');

            const requestData = {
                api_key: this.config.apiKey,
                api_secret: hashedSecret,
                request_code: requestCode
            };

            // Try multiple endpoints and formats for maximum compatibility
            const exchangeResult = await this.attemptTokenExchange(requestData);
            
            if (exchangeResult.success) {
                // Store token with proper expiry
                const expiresIn = exchangeResult.expiresIn || 28800; // Default 8 hours
                tokenManager.setToken(exchangeResult.token, requestCode, expiresIn);
                
                // Auto-update .env file with new token
                try {
                    await updateEnvFile('FLATTRADE_TOKEN', exchangeResult.token);
                    console.log('🔄 Token automatically updated in .env file');
                    
                    // Also update the process.env for immediate use
                    process.env.FLATTRADE_TOKEN = exchangeResult.token;
                    console.log('🔄 Process environment updated with new token');
                } catch (envError) {
                    console.error('⚠️ Failed to update .env file:', envError.message);
                    // Continue execution even if .env update fails
                }
                
                console.log('✅ Token exchange completed successfully');
                return exchangeResult;
            } else {
                throw new Error(exchangeResult.error || 'All token exchange methods failed');
            }
        } catch (error) {
            console.error('❌ Token exchange failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Attempt token exchange with multiple methods for reliability
     * @param {object} requestData - Token exchange request data
     * @returns {Promise<object>} Exchange result
     */
    async attemptTokenExchange(requestData) {
        const methods = [
            { name: 'Primary JSON', method: this.exchangeTokenJSON.bind(this) },
            { name: 'Alternative Endpoint', method: this.exchangeTokenAlternative.bind(this) },
            { name: 'Form URL-encoded', method: this.exchangeTokenForm.bind(this) }
        ];

        for (const { name, method } of methods) {
            try {
                console.log(`🔄 Attempting token exchange via ${name}...`);
                const result = await method(requestData);
                
                if (result.success) {
                    console.log(`✅ Token exchange successful via ${name}`);
                    return result;
                }
            } catch (error) {
                console.log(`⚠️ ${name} failed: ${error.message}`);
                continue;
            }
        }

        return {
            success: false,
            error: 'All token exchange methods failed'
        };
    }

    /**
     * Primary JSON token exchange method
     * @param {object} requestData - Request data
     * @returns {Promise<object>} Exchange result
     */
    async exchangeTokenJSON(requestData) {
        const response = await axios.post(this.config.tokenEndpoint, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'NSE-Trading-Dashboard/2.1.0'
            },
            timeout: this.config.timeout
        });

        return this.processTokenResponse(response);
    }

    /**
     * Alternative endpoint token exchange method
     * @param {object} requestData - Request data
     * @returns {Promise<object>} Exchange result
     */
    async exchangeTokenAlternative(requestData) {
        const alternativeEndpoint = 'https://auth.flattrade.in/trade/apitoken';
        
        const response = await axios.post(alternativeEndpoint, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'NSE-Trading-Dashboard/2.1.0'
            },
            timeout: this.config.timeout
        });

        return this.processTokenResponse(response);
    }

    /**
     * Form URL-encoded token exchange method
     * @param {object} requestData - Request data
     * @returns {Promise<object>} Exchange result
     */
    async exchangeTokenForm(requestData) {
        const formData = new URLSearchParams();
        Object.entries(requestData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        const response = await axios.post(this.config.tokenEndpoint, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'NSE-Trading-Dashboard/2.1.0'
            },
            timeout: this.config.timeout
        });

        return this.processTokenResponse(response);
    }

    /**
     * Process token exchange response
     * @param {object} response - Axios response
     * @returns {object} Processed result
     */
    processTokenResponse(response) {
        const data = response.data;

        // Check for successful response
        if (data.stat === 'Ok' || data.status === 'Ok') {
            if (!data.token) {
                throw new Error('Token not found in successful response');
            }

            return {
                success: true,
                token: data.token,
                expiresIn: data.expiresIn || 28800,
                data: data
            };
        } else {
            const errorMsg = data.emsg || data.error || 'Unknown error in token exchange';
            throw new Error(errorMsg);
        }
    }

    /**
     * Refresh existing token if possible
     * @returns {Promise<object>} Refresh result
     */
    async refreshToken() {
        try {
            const requestCode = tokenManager.getRequestCode();
            
            if (!requestCode) {
                throw new Error('No request code available for token refresh');
            }

            console.log('🔄 Refreshing authentication token...');
            
            const refreshResult = await this.exchangeToken(requestCode);
            
            if (refreshResult.success) {
                console.log('✅ Token refreshed successfully');
                return {
                    success: true,
                    message: 'Token refreshed successfully',
                    token: refreshResult.token,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error(refreshResult.error);
            }
        } catch (error) {
            console.error('❌ Token refresh failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Check current authentication status
     * @returns {object} Detailed authentication status
     */
    getAuthStatus() {
        const tokenStatus = tokenManager.getAuthStatus();
        const isAuthenticated = tokenStatus.authenticated;

        return {
            authenticated: isAuthenticated,
            token: isAuthenticated ? 'Available' : 'Not Available',
            status: isAuthenticated ? 'Active' : 'Inactive',
            ...tokenStatus,
            service: 'UnifiedAuthService',
            version: '2.1.0'
        };
    }

    /**
     * Connect to live data (initiate auth if needed)
     * @returns {Promise<object>} Connection result
     */
    async connectLiveData() {
        try {
            // Check if already authenticated
            if (tokenManager.isAuthenticated()) {
                console.log('✅ Already connected to live data');
                return {
                    success: true,
                    authenticated: true,
                    message: 'Already connected to live data',
                    timestamp: new Date().toISOString()
                };
            }

            // Try to refresh with existing request code
            const requestCode = tokenManager.getRequestCode();
            if (requestCode) {
                console.log('🔄 Attempting to use existing request code...');
                
                const refreshResult = await this.refreshToken();
                if (refreshResult.success) {
                    return {
                        success: true,
                        authenticated: true,
                        message: 'Connected using existing request code',
                        timestamp: new Date().toISOString()
                    };
                } else {
                    console.log('⚠️ Request code expired, need fresh authentication');
                }
            }

            // Generate new login URL for authentication
            const loginResult = await this.generateLoginUrl();
            if (loginResult.success) {
                return {
                    success: false,
                    authenticated: false,
                    needsLogin: true,
                    loginUrl: loginResult.loginUrl,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error(loginResult.error);
            }
        } catch (error) {
            console.error('❌ Connect live data failed:', error.message);
            return {
                success: false,
                authenticated: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Logout and clear authentication
     * @returns {object} Logout result
     */
    logout() {
        try {
            console.log('🚪 Logging out and clearing authentication...');
            
            tokenManager.clearToken();
            
            // Clear from app locals if available
            if (global.app && global.app.locals) {
                global.app.locals.FLATTRADE_TOKEN = null;
            }

            console.log('✅ Logout completed successfully');
            return {
                success: true,
                message: 'Logged out successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Logout failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Apply rate limiting to API calls
     * @returns {Promise<void>}
     */
    async applyRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        
        // Reset counter every minute
        if (timeSinceLastCall > 60000) {
            this.apiCallCount = 0;
        }

        // Check rate limits
        if (this.apiCallCount >= this.rateLimiting.apiCallsPerMinute) {
            const waitTime = 60000 - timeSinceLastCall;
            console.log(`⏳ Rate limit reached, waiting ${waitTime}ms...`);
            await this.delay(waitTime);
            this.apiCallCount = 0;
        }

        // Apply delay between calls
        if (timeSinceLastCall < this.rateLimiting.apiCallDelay) {
            const delayTime = this.rateLimiting.apiCallDelay - timeSinceLastCall;
            await this.delay(delayTime);
        }

        this.apiCallCount++;
        this.lastApiCall = Date.now();
    }

    /**
     * Update environment variables
     * @param {string} token - Authentication token
     * @param {string} requestCode - Request code
     */
    async updateEnvironmentVariables(token, requestCode) {
        try {
            await updateEnvFile('FLATTRADE_TOKEN', token);
            await updateEnvFile('FLATTRADE_REQUEST_CODE', requestCode);
            
            // Update process.env for immediate use
            process.env.FLATTRADE_TOKEN = token;
            process.env.FLATTRADE_REQUEST_CODE = requestCode;

            console.log('✅ Environment variables updated');
        } catch (error) {
            console.error('❌ Failed to update environment variables:', error.message);
        }
    }

    /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Force reload credentials from environment variables
     * Useful when .env file has been updated and needs to be reloaded
     * @returns {Promise<object>} Success status or error
     */
    async forceReloadCredentials() {
        try {
            console.log('🔃 Force reloading credentials from environment...');
            
            // Reload configuration
            this.config = authConfig.flattrade;
            
            // Force reload credentials in Flattrade API service if available
            const FlattradeAPIService = require('../flattrade-api.service');
            if (FlattradeAPIService && typeof FlattradeAPIService.forceReloadCredentials === 'function') {
                FlattradeAPIService.forceReloadCredentials();
                console.log('✅ Flattrade API service credentials reloaded');
            }
            
            console.log('✅ Credentials force reloaded successfully');
            return {
                success: true,
                message: 'Credentials reloaded from environment variables',
                tokenFound: !!process.env.FLATTRADE_TOKEN,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error force reloading credentials:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get service health information
     * @returns {object} Service health data
     */
    getHealthInfo() {
        const authStatus = this.getAuthStatus();
        
        return {
            service: 'UnifiedAuthService',
            version: '2.1.0',
            status: 'healthy',
            authentication: authStatus,
            apiCallCount: this.apiCallCount,
            rateLimitStatus: `${this.apiCallCount}/${this.rateLimiting.apiCallsPerMinute}`,
            lastActivity: new Date(this.lastApiCall).toISOString(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }
}

// Export singleton instance
module.exports = new UnifiedAuthService();