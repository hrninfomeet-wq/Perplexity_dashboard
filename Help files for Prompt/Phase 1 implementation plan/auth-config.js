// dashboard-backend/src/config/auth.config.js

/**
 * Authentication Configuration Service
 * Centralized configuration for all authentication-related settings
 * 
 * @version 2.1.0
 * @created September 01, 2025
 */

const path = require('path');

class AuthConfig {
    constructor() {
        this.validateEnvironment();
    }

    /**
     * Validate required environment variables
     */
    validateEnvironment() {
        const required = [
            'FLATTRADE_API_KEY',
            'FLATTRADE_API_SECRET', 
            'FLATTRADE_CLIENT_CODE',
            'FLATTRADE_REDIRECT_URI'
        ];

        const missing = required.filter(key => !process.env[key]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    /**
     * Get Flattrade API configuration
     */
    get flattrade() {
        return {
            apiKey: process.env.FLATTRADE_API_KEY,
            apiSecret: process.env.FLATTRADE_API_SECRET,
            clientCode: process.env.FLATTRADE_CLIENT_CODE,
            redirectUri: process.env.FLATTRADE_REDIRECT_URI,
            authPortal: 'https://auth.flattrade.in/',
            tokenEndpoint: 'https://authapi.flattrade.in/trade/apitoken',
            baseUrl: 'https://piconnect.flattrade.in/PiConnectTP/',
            timeout: 15000
        };
    }

    /**
     * Get session configuration
     */
    get session() {
        return {
            sessionFile: path.join(__dirname, '../../.auth-session'),
            refreshBuffer: parseInt(process.env.TOKEN_REFRESH_BUFFER) || 300000, // 5 minutes
            maxRetries: parseInt(process.env.AUTO_RETRY_COUNT) || 3,
            clearOnShutdown: process.env.CLEAR_SESSION_ON_SHUTDOWN === 'true'
        };
    }

    /**
     * Get rate limiting configuration
     */
    get rateLimiting() {
        return {
            apiCallsPerMinute: 100,
            apiCallDelay: 200,
            maxConcurrent: 5
        };
    }

    /**
     * Get security configuration
     */
    get security() {
        return {
            tokenEncryption: true,
            sessionEncryption: true,
            saltRounds: 12,
            jwtSecret: process.env.JWT_SECRET || 'nse-trading-dashboard-secret'
        };
    }
}

module.exports = new AuthConfig();