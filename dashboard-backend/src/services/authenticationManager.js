// dashboard-backend/src/services/authenticationManager.js
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { updateEnvFile } = require('../utils/envUtils');

class AuthenticationManager {
    constructor() {
        this.tokenFilePath = path.join(__dirname, '../../.auth-session');
        this.AUTH_PORTAL = 'https://auth.flattrade.in/';
        this.TOKEN_ENDPOINT = 'https://authapi.flattrade.in/trade/apitoken';
        this.VALIDATE_ENDPOINT = 'https://piconnect.flattrade.in/PiConnectTP/UserDetails';
        
        // Authentication state
        this.isAuthenticated = false;
        this.currentToken = null;
        this.tokenExpiry = null;
        this.sessionData = null;
        
        // Auto-refresh settings
        this.refreshInterval = null;
        this.refreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiry
        
        console.log('🔐 Authentication Manager initialized');
    }

    /**
     * Initialize authentication on server startup
     */
    async initialize() {
        console.log('🚀 Initializing authentication system...');
        
        try {
            // Try to load existing session
            await this.loadStoredSession();
            
            // Validate current token if available
            if (this.currentToken) {
                const isValid = await this.validateToken(this.currentToken);
                
                if (isValid) {
                    console.log('✅ Existing token is valid, authentication ready');
                    this.isAuthenticated = true;
                    this.scheduleTokenRefresh();
                    return { success: true, message: 'Auto-authenticated successfully' };
                } else {
                    console.log('⚠️ Existing token invalid, clearing session');
                    await this.clearSession();
                }
            }
            
            // Try to refresh using stored request code
            const refreshed = await this.attemptTokenRefresh();
            if (refreshed) {
                console.log('✅ Token refreshed successfully');
                this.isAuthenticated = true;
                this.scheduleTokenRefresh();
                return { success: true, message: 'Token refreshed automatically' };
            }
            
            console.log('🔐 Manual authentication required');
            return { success: false, message: 'Manual authentication required' };
            
        } catch (error) {
            console.error('❌ Authentication initialization failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load stored session data
     */
    async loadStoredSession() {
        try {
            const sessionExists = await this.fileExists(this.tokenFilePath);
            if (!sessionExists) {
                console.log('📄 No stored session found');
                return false;
            }

            const sessionData = await fs.readFile(this.tokenFilePath, 'utf8');
            this.sessionData = JSON.parse(sessionData);
            
            this.currentToken = this.sessionData.token || process.env.FLATTRADE_TOKEN;
            this.tokenExpiry = this.sessionData.expiry ? new Date(this.sessionData.expiry) : null;
            
            if (this.tokenExpiry && new Date() >= this.tokenExpiry) {
                console.log('⏰ Stored token has expired');
                return false;
            }
            
            console.log('📄 Loaded stored session successfully');
            return true;
            
        } catch (error) {
            console.log('⚠️ Failed to load stored session:', error.message);
            return false;
        }
    }

    /**
     * Save session data to file
     */
    async saveSession(token, requestCode = null) {
        try {
            // Flattrade tokens typically expire at end of trading day
            const expiry = new Date();
            expiry.setHours(15, 30, 0, 0); // 3:30 PM market close
            if (expiry <= new Date()) {
                expiry.setDate(expiry.getDate() + 1); // Next trading day
            }

            const sessionData = {
                token,
                requestCode: requestCode || this.sessionData?.requestCode,
                expiry: expiry.toISOString(),
                createdAt: new Date().toISOString(),
                apiKey: process.env.FLATTRADE_API_KEY,
                clientCode: process.env.FLATTRADE_CLIENT_CODE
            };

            await fs.writeFile(this.tokenFilePath, JSON.stringify(sessionData, null, 2));
            
            // Update environment file
            await updateEnvFile('FLATTRADE_TOKEN', token);
            if (requestCode) {
                await updateEnvFile('FLATTRADE_REQUEST_CODE', requestCode);
            }

            this.sessionData = sessionData;
            this.currentToken = token;
            this.tokenExpiry = expiry;
            
            console.log('💾 Session saved successfully, expires at:', expiry.toLocaleString());
            
        } catch (error) {
            console.error('❌ Failed to save session:', error.message);
        }
    }

    /**
     * Validate if token is still active
     */
    async validateToken(token) {
        try {
            console.log('🔍 Validating token...');
            
            const payload = {
                uid: process.env.FLATTRADE_CLIENT_CODE,
                jKey: token
            };

            const response = await axios.post(
                this.VALIDATE_ENDPOINT,
                `jData=${JSON.stringify(payload)}&jKey=${token}`,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 10000
                }
            );

            const isValid = response.data.stat === 'Ok';
            console.log(`🔍 Token validation result: ${isValid ? 'Valid' : 'Invalid'}`);
            
            return isValid;
            
        } catch (error) {
            console.log('🔍 Token validation failed:', error.message);
            return false;
        }
    }

    /**
     * Attempt to refresh token using stored request code
     */
    async attemptTokenRefresh() {
        try {
            const requestCode = this.sessionData?.requestCode || process.env.FLATTRADE_REQUEST_CODE;
            
            if (!requestCode) {
                console.log('🔄 No request code available for refresh');
                return false;
            }

            console.log('🔄 Attempting token refresh with stored request code...');

            const API_KEY = process.env.FLATTRADE_API_KEY;
            const API_SECRET = process.env.FLATTRADE_API_SECRET;

            // Create hash as per Flattrade API requirements
            const hashInput = API_KEY + requestCode + API_SECRET;
            const hashedSecret = crypto.createHash('sha256').update(hashInput).digest('hex');

            const requestData = {
                api_key: API_KEY,
                api_secret: hashedSecret,
                request_code: requestCode
            };

            const response = await axios.post(this.TOKEN_ENDPOINT, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (response.data.stat === 'Ok' || response.data.status === 'Ok') {
                const newToken = response.data.token;
                console.log('✅ Token refreshed successfully');
                
                await this.saveSession(newToken, requestCode);
                this.currentToken = newToken;
                this.isAuthenticated = true;
                
                return true;
            } else {
                console.log('❌ Token refresh failed:', response.data.emsg || 'Unknown error');
                return false;
            }

        } catch (error) {
            console.log('❌ Token refresh error:', error.message);
            return false;
        }
    }

    /**
     * Handle new authentication flow
     */
    async handleAuthentication(requestCode) {
        try {
            const API_KEY = process.env.FLATTRADE_API_KEY;
            const API_SECRET = process.env.FLATTRADE_API_SECRET;

            const hashInput = API_KEY + requestCode + API_SECRET;
            const hashedSecret = crypto.createHash('sha256').update(hashInput).digest('hex');

            const requestData = {
                api_key: API_KEY,
                api_secret: hashedSecret,
                request_code: requestCode
            };

            const response = await axios.post(this.TOKEN_ENDPOINT, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (response.data.stat === 'Ok' || response.data.status === 'Ok') {
                const token = response.data.token;
                console.log('✅ New authentication successful');
                
                await this.saveSession(token, requestCode);
                this.currentToken = token;
                this.isAuthenticated = true;
                this.scheduleTokenRefresh();
                
                return { success: true, token };
            } else {
                throw new Error(response.data.emsg || 'Authentication failed');
            }

        } catch (error) {
            console.error('❌ Authentication error:', error.message);
            throw error;
        }
    }

    /**
     * Schedule automatic token refresh
     */
    scheduleTokenRefresh() {
        // Clear existing refresh timer
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        if (!this.tokenExpiry) return;

        const timeUntilExpiry = this.tokenExpiry.getTime() - Date.now();
        const refreshTime = Math.max(timeUntilExpiry - this.refreshBuffer, 60000); // At least 1 minute

        console.log(`⏰ Token refresh scheduled in ${Math.round(refreshTime / 60000)} minutes`);

        this.refreshInterval = setTimeout(async () => {
            console.log('⏰ Attempting scheduled token refresh...');
            const refreshed = await this.attemptTokenRefresh();
            
            if (refreshed) {
                console.log('✅ Scheduled token refresh successful');
                this.scheduleTokenRefresh(); // Schedule next refresh
            } else {
                console.log('❌ Scheduled token refresh failed, manual auth required');
                this.isAuthenticated = false;
            }
        }, refreshTime);
    }

    /**
     * Clear authentication session
     */
    async clearSession() {
        try {
            this.isAuthenticated = false;
            this.currentToken = null;
            this.tokenExpiry = null;
            this.sessionData = null;

            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }

            // Remove session file
            const sessionExists = await this.fileExists(this.tokenFilePath);
            if (sessionExists) {
                await fs.unlink(this.tokenFilePath);
            }

            // Clear from environment
            await updateEnvFile('FLATTRADE_TOKEN', '');

            console.log('🗑️ Authentication session cleared');

        } catch (error) {
            console.error('❌ Error clearing session:', error.message);
        }
    }

    /**
     * Get authentication status
     */
    getStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            hasToken: !!this.currentToken,
            tokenExpiry: this.tokenExpiry,
            timeUntilExpiry: this.tokenExpiry ? this.tokenExpiry.getTime() - Date.now() : null
        };
    }

    /**
     * Get current valid token
     */
    async getValidToken() {
        if (!this.isAuthenticated || !this.currentToken) {
            throw new Error('Not authenticated');
        }

        // Check if token is close to expiry
        if (this.tokenExpiry && (this.tokenExpiry.getTime() - Date.now()) < this.refreshBuffer) {
            console.log('🔄 Token near expiry, attempting refresh...');
            const refreshed = await this.attemptTokenRefresh();
            
            if (!refreshed) {
                this.isAuthenticated = false;
                throw new Error('Token expired and refresh failed');
            }
        }

        return this.currentToken;
    }

    /**
     * Generate login URL for manual authentication
     */
    getLoginUrl() {
        const API_KEY = process.env.FLATTRADE_API_KEY;
        const REDIRECT_URI = process.env.FLATTRADE_REDIRECT_URI;

        if (!API_KEY || !REDIRECT_URI) {
            throw new Error('Missing API configuration');
        }

        return `${this.AUTH_PORTAL}?app_key=${encodeURIComponent(API_KEY)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    }

    /**
     * Utility function to check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Health check for authentication system
     */
    async healthCheck() {
        const status = this.getStatus();
        
        if (status.isAuthenticated) {
            try {
                const isValid = await this.validateToken(this.currentToken);
                return {
                    status: 'healthy',
                    authenticated: true,
                    tokenValid: isValid,
                    expiryTime: this.tokenExpiry,
                    timeUntilExpiry: status.timeUntilExpiry
                };
            } catch (error) {
                return {
                    status: 'degraded',
                    authenticated: false,
                    error: error.message
                };
            }
        }

        return {
            status: 'unauthenticated',
            authenticated: false,
            requiresLogin: true
        };
    }
}

module.exports = AuthenticationManager;
