// dashboard-backend/src/services/api/providers/base-provider.js

/**
 * Base Provider Class
 * Abstract base class for all API providers with common functionality
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const axios = require('axios');
const { utils } = require('../../../config/api.config');

class BaseProvider {
    constructor(providerName) {
        this.name = providerName;
        this.config = utils.getProvider(providerName);
        this.isAuthenticated = false;
        this.accessToken = null;
        this.lastRequestTime = 0;
        this.requestQueue = [];
        
        if (!this.config) {
            throw new Error(`Provider configuration not found: ${providerName}`);
        }
        
        console.log(`🔧 Initializing ${this.config.name} provider...`);
    }

    /**
     * Initialize provider (override in subclasses)
     */
    async initialize() {
        throw new Error('initialize() method must be implemented by provider subclass');
    }

    /**
     * Health check (override in subclasses)
     */
    async healthCheck() {
        throw new Error('healthCheck() method must be implemented by provider subclass');
    }

    /**
     * Authentication (override in subclasses)
     */
    async authenticate() {
        throw new Error('authenticate() method must be implemented by provider subclass');
    }

    /**
     * Make HTTP request with rate limiting and error handling
     */
    async makeRequest(endpoint, options = {}) {
        try {
            // Rate limiting
            await this.enforceRateLimit();
            
            // Build request configuration
            const requestConfig = this.buildRequestConfig(endpoint, options);
            
            // Make request
            const response = await axios(requestConfig);
            
            // Process response
            return this.processResponse(response);
            
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Build request configuration
     */
    buildRequestConfig(endpoint, options) {
        const baseURL = this.config.endpoints.base_url;
        const url = `${baseURL}${endpoint}`;
        
        return {
            url,
            method: options.method || 'GET',
            headers: this.getHeaders(options),
            params: options.params || {},
            data: options.data || {},
            timeout: options.timeout || 10000
        };
    }

    /**
     * Get request headers (override in subclasses)
     */
    getHeaders(options = {}) {
        return {
            'Content-Type': 'application/json',
            'User-Agent': 'NSE-Trading-Dashboard/2.3.0',
            ...options.headers
        };
    }

    /**
     * Process API response (override in subclasses)
     */
    processResponse(response) {
        return response.data;
    }

    /**
     * Handle API errors
     */
    handleError(error) {
        if (error.response) {
            // HTTP error response
            const status = error.response.status;
            const message = error.response.data?.message || error.message;
            
            return new Error(`API Error ${status}: ${message}`);
        } else if (error.request) {
            // Network error
            return new Error(`Network Error: ${error.message}`);
        } else {
            // Other error
            return new Error(`Request Error: ${error.message}`);
        }
    }

    /**
     * Enforce rate limiting
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / (this.config.rate_limits.requests_per_second || 1);
        
        if (timeSinceLastRequest < minInterval) {
            const delay = minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Get symbol in provider format
     */
    formatSymbol(symbol) {
        return utils.getSymbolForProvider(symbol, this.name) || symbol;
    }

    /**
     * Check if provider supports feature
     */
    supportsFeature(feature) {
        return utils.supportsFeature(this.name, feature);
    }

    /**
     * Get provider status
     */
    getStatus() {
        return {
            name: this.config.name,
            authenticated: this.isAuthenticated,
            rateLimits: this.config.rate_limits,
            features: this.config.features,
            lastRequestTime: this.lastRequestTime
        };
    }

    /**
     * Disconnect provider (override in subclasses)
     */
    async disconnect() {
        console.log(`🔌 Disconnecting ${this.config.name} provider...`);
    }
}

module.exports = BaseProvider;
