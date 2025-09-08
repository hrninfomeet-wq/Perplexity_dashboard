// dashboard-backend/src/utils/token-manager.js

/**
 * Centralized Token Management Utility
 * Handles token storage, retrieval, validation, and refresh operations
 * 
 * @version 2.1.0
 * @created September 01, 2025
 */

const fs = require('fs');
const crypto = require('crypto');
const authConfig = require('../config/auth.config');

class TokenManager {
    constructor() {
        this.currentToken = null;
        this.tokenExpiry = null;
        this.requestCode = null;
        this.sessionFile = authConfig.session.sessionFile;
        this.refreshBuffer = authConfig.session.refreshBuffer;
        
        // Load existing session on startup
        this.loadSession();
    }

    /**
     * Set authentication token with expiry
     * @param {string} token - Authentication token
     * @param {string} requestCode - Request code used to obtain token
     * @param {number} expiresIn - Token expiry in seconds (default 8 hours)
     */
    setToken(token, requestCode = null, expiresIn = 28800) {
        this.currentToken = token;
        this.requestCode = requestCode || this.requestCode;
        this.tokenExpiry = Date.now() + (expiresIn * 1000);

        console.log(`🔑 Token set successfully. Expires: ${new Date(this.tokenExpiry).toLocaleString('en-IN')}`);
        
        // Persist session
        this.saveSession();
        return true;
    }

    /**
     * Get current authentication token
     * @returns {string|null} Current token or null if not available
     */
    getToken() {
        if (!this.currentToken) {
            return null;
        }

        // Check if token is still valid
        if (this.isTokenExpired()) {
            console.log('⚠️ Token has expired');
            this.clearToken();
            return null;
        }

        return this.currentToken;
    }

    /**
     * Check if current token is expired
     * @returns {boolean} True if token is expired or about to expire
     */
    isTokenExpired() {
        if (!this.tokenExpiry) {
            return true;
        }

        // Check if token expires within refresh buffer time
        return Date.now() >= (this.tokenExpiry - this.refreshBuffer);
    }

    /**
     * Check if token needs refresh (within refresh buffer)
     * @returns {boolean} True if token should be refreshed
     */
    needsRefresh() {
        if (!this.tokenExpiry) {
            return true;
        }

        const timeUntilExpiry = this.tokenExpiry - Date.now();
        return timeUntilExpiry <= this.refreshBuffer && timeUntilExpiry > 0;
    }

    /**
     * Get time until token expiry in milliseconds
     * @returns {number} Milliseconds until expiry, 0 if expired
     */
    getTimeUntilExpiry() {
        if (!this.tokenExpiry) {
            return 0;
        }

        const timeLeft = this.tokenExpiry - Date.now();
        return Math.max(0, timeLeft);
    }

    /**
     * Get human-readable time until expiry
     * @returns {string} Formatted time string
     */
    getExpiryInfo() {
        const timeLeft = this.getTimeUntilExpiry();
        
        if (timeLeft === 0) {
            return 'Expired';
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Clear current token and session
     */
    clearToken() {
        this.currentToken = null;
        this.tokenExpiry = null;
        this.requestCode = null;
        
        // Remove session file
        if (fs.existsSync(this.sessionFile)) {
            fs.unlinkSync(this.sessionFile);
        }

        console.log('🗑️ Token cleared and session removed');
    }

    /**
     * Get current request code
     * @returns {string|null} Current request code
     */
    getRequestCode() {
        return this.requestCode;
    }

    /**
     * Set request code
     * @param {string} requestCode - Request code from auth callback
     */
    setRequestCode(requestCode) {
        this.requestCode = requestCode;
        this.saveSession();
        console.log('📝 Request code updated');
    }

    /**
     * Check if authentication is valid and ready
     * @returns {boolean} True if authenticated with valid token
     */
    isAuthenticated() {
        return this.getToken() !== null;
    }

    /**
     * Get authentication status info
     * @returns {object} Detailed auth status
     */
    getAuthStatus() {
        const token = this.getToken();
        const isValid = token !== null;
        
        return {
            authenticated: isValid,
            hasToken: this.currentToken !== null,
            hasRequestCode: this.requestCode !== null,
            tokenExpiry: this.tokenExpiry,
            expiryInfo: this.getExpiryInfo(),
            needsRefresh: this.needsRefresh(),
            timeUntilExpiry: this.getTimeUntilExpiry(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Save current session to encrypted file
     */
    saveSession() {
        if (!this.currentToken) {
            return;
        }

        try {
            const sessionData = {
                token: this.encryptData(this.currentToken),
                requestCode: this.requestCode ? this.encryptData(this.requestCode) : null,
                tokenExpiry: this.tokenExpiry,
                timestamp: Date.now()
            };

            fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
            console.log('💾 Session saved successfully');
        } catch (error) {
            console.error('❌ Failed to save session:', error.message);
        }
    }

    /**
     * Load session from encrypted file
     */
    loadSession() {
        if (!fs.existsSync(this.sessionFile)) {
            console.log('📂 No existing session file found');
            // Try to load from environment variables
            this.loadFromEnvironment();
            return;
        }

        try {
            const sessionData = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
            
            // Validate session data
            if (!sessionData.token || !sessionData.tokenExpiry) {
                console.log('⚠️ Invalid session data, removing file');
                fs.unlinkSync(this.sessionFile);
                // Try to load from environment variables
                this.loadFromEnvironment();
                return;
            }

            // Decrypt token data
            this.currentToken = this.decryptData(sessionData.token);
            this.requestCode = sessionData.requestCode ? this.decryptData(sessionData.requestCode) : null;
            this.tokenExpiry = sessionData.tokenExpiry;

            // Check if session is still valid
            if (this.isTokenExpired()) {
                console.log('⚠️ Loaded session has expired, clearing...');
                this.clearToken();
                // Try to load from environment variables as fallback
                this.loadFromEnvironment();
                return;
            }

            console.log(`✅ Session loaded successfully. Expires: ${this.getExpiryInfo()}`);
        } catch (error) {
            console.error('❌ Failed to load session:', error.message);
            // Remove corrupted session file
            if (fs.existsSync(this.sessionFile)) {
                fs.unlinkSync(this.sessionFile);
            }
            // Try to load from environment variables as fallback
            this.loadFromEnvironment();
        }
    }

    /**
     * Load tokens from environment variables
     */
    loadFromEnvironment() {
        const envToken = process.env.FLATTRADE_TOKEN;
        const envRequestCode = process.env.FLATTRADE_REQUEST_CODE;

        if (envToken) {
            console.log('🔑 Loading authentication from environment variables...');
            
            // Assume tokens from .env are valid for 8 hours from now (default Flattrade session)
            // In a real scenario, you might want to validate the token first
            this.currentToken = envToken;
            this.requestCode = envRequestCode || null;
            this.tokenExpiry = Date.now() + (8 * 60 * 60 * 1000); // 8 hours
            
            console.log(`✅ Token loaded from environment. Expires: ${new Date(this.tokenExpiry).toLocaleString('en-IN')}`);
            
            // Save session for future use
            this.saveSession();
            
            return true;
        } else {
            console.log('🔍 No authentication tokens found in environment variables');
            return false;
        }
    }

    /**
     * Encrypt sensitive data for storage
     * @param {string} data - Data to encrypt
     * @returns {string} Encrypted data
     */
    encryptData(data) {
        if (!authConfig.security.sessionEncryption) {
            return data;
        }

        const algorithm = 'aes-256-gcm';
        const secret = authConfig.security.jwtSecret;
        const key = crypto.scryptSync(secret, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        cipher.setAAD(Buffer.from('nse-dashboard', 'utf8'));
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt stored data
     * @param {string} encryptedData - Encrypted data string
     * @returns {string} Decrypted data
     */
    decryptData(encryptedData) {
        if (!authConfig.security.sessionEncryption) {
            return encryptedData;
        }

        try {
            const algorithm = 'aes-256-gcm';
            const secret = authConfig.security.jwtSecret;
            const key = crypto.scryptSync(secret, 'salt', 32);
            
            const parts = encryptedData.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            
            const decipher = crypto.createDecipher(algorithm, key);
            decipher.setAAD(Buffer.from('nse-dashboard', 'utf8'));
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('❌ Decryption failed:', error.message);
            return null;
        }
    }

    /**
     * Update environment variables with current token info
     */
    updateEnvironment() {
        if (this.currentToken) {
            process.env.FLATTRADE_TOKEN = this.currentToken;
        }
        if (this.requestCode) {
            process.env.FLATTRADE_REQUEST_CODE = this.requestCode;
        }
    }
}

// Export singleton instance
module.exports = new TokenManager();