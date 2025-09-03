// dashboard-backend/src/services/api/api-manager.js

/**
 * Multi-API Manager - Core Orchestration Service
 * Handles intelligent failover, load balancing, and unified API interface
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const axios = require('axios');
const EventEmitter = require('events');
const { API_PROVIDERS, API_CONFIG, utils } = require('../../config/api.config');

class APIManager extends EventEmitter {
    constructor() {
        super();
        
        this.providers = new Map();
        this.currentProvider = null;
        this.healthStatus = new Map();
        this.requestCounts = new Map();
        this.lastRequests = new Map();
        this.circuitBreakers = new Map();
        this.isInitialized = false;
        
        console.log('🔧 Multi-API Manager initializing...');
    }

    /**
     * Initialize the API Manager
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Multi-API Manager...');
            
            // Initialize provider services
            await this.initializeProviders();
            
            // Set primary provider
            this.setPrimaryProvider();
            
            // Initialize health monitoring
            this.initializeHealthMonitoring();
            
            // Initialize rate limiting
            this.initializeRateLimiting();
            
            // Start health checks
            this.startHealthChecks();
            
            this.isInitialized = true;
            console.log('✅ Multi-API Manager initialized successfully');
            
            this.emit('initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Multi-API Manager initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Initialize all provider services
     */
    async initializeProviders() {
        const enabledProviders = utils.getEnabledProviders();
        
        for (const providerName of enabledProviders) {
            try {
                const ProviderService = this.loadProviderService(providerName);
                const provider = new ProviderService();
                
                this.providers.set(providerName, provider);
                this.healthStatus.set(providerName, {
                    status: 'unknown',
                    lastCheck: null,
                    errorCount: 0,
                    successCount: 0,
                    responseTime: null,
                    lastError: null
                });
                
                this.requestCounts.set(providerName, {
                    minute: 0,
                    second: 0,
                    daily: 0,
                    resetTime: Date.now()
                });
                
                console.log(`✅ Provider initialized: ${providerName}`);
                
            } catch (error) {
                console.error(`❌ Failed to initialize provider ${providerName}:`, error.message);
                this.healthStatus.set(providerName, {
                    status: 'error',
                    lastCheck: new Date(),
                    errorCount: 1,
                    lastError: error.message
                });
            }
        }
    }

    /**
     * Load provider service dynamically
     */
    loadProviderService(providerName) {
        try {
            const ProviderService = require(`./providers/${providerName}`);
            return ProviderService;
        } catch (error) {
            console.warn(`⚠️ Provider service not found: ${providerName}, using base provider`);
            return require('./providers/base-provider');
        }
    }

    /**
     * Set primary provider based on configuration and health
     */
    setPrimaryProvider() {
        const preferredProvider = API_CONFIG.primary_provider;
        
        if (this.providers.has(preferredProvider) && this.isProviderHealthy(preferredProvider)) {
            this.currentProvider = preferredProvider;
            console.log(`🎯 Primary provider set: ${preferredProvider}`);
        } else {
            // Fallback to first healthy provider
            for (const provider of API_CONFIG.fallback_order) {
                if (this.providers.has(provider) && this.isProviderHealthy(provider)) {
                    this.currentProvider = provider;
                    console.log(`🔄 Fallback provider set: ${provider}`);
                    break;
                }
            }
        }
        
        if (!this.currentProvider) {
            console.warn('⚠️ No healthy providers available, using first available');
            this.currentProvider = Array.from(this.providers.keys())[0];
        }
    }

    /**
     * Initialize health monitoring for all providers
     */
    initializeHealthMonitoring() {
        console.log('💗 Initializing provider health monitoring...');
        
        for (const [providerName] of this.providers) {
            this.healthStatus.set(providerName, {
                status: 'checking',
                lastCheck: null,
                errorCount: 0,
                successCount: 0,
                responseTime: null,
                lastError: null,
                circuitBreakerOpen: false
            });
        }
    }

    /**
     * Initialize rate limiting tracking
     */
    initializeRateLimiting() {
        console.log('📊 Initializing rate limiting...');
        
        // Reset rate limit counters every minute
        setInterval(() => {
            for (const [providerName, counts] of this.requestCounts) {
                counts.minute = 0;
                counts.resetTime = Date.now();
            }
        }, 60000);
        
        // Reset second counters every second
        setInterval(() => {
            for (const [providerName, counts] of this.requestCounts) {
                counts.second = 0;
            }
        }, 1000);
    }

    /**
     * Start periodic health checks
     */
    startHealthChecks() {
        console.log(`🏥 Starting health checks every ${API_CONFIG.health_check_interval}ms`);
        
        setInterval(async () => {
            await this.performHealthChecks();
        }, API_CONFIG.health_check_interval);
        
        // Perform initial health check
        setTimeout(() => this.performHealthChecks(), 2000);
    }

    /**
     * Perform health checks on all providers
     */
    async performHealthChecks() {
        const promises = Array.from(this.providers.keys()).map(provider => 
            this.checkProviderHealth(provider)
        );
        
        await Promise.allSettled(promises);
        
        // Check if current provider is still healthy
        if (this.currentProvider && !this.isProviderHealthy(this.currentProvider)) {
            console.log(`⚠️ Current provider ${this.currentProvider} unhealthy, switching...`);
            await this.switchToHealthyProvider();
        }
    }

    /**
     * Check health of a specific provider
     */
    async checkProviderHealth(providerName) {
        const startTime = Date.now();
        const health = this.healthStatus.get(providerName);
        
        try {
            const provider = this.providers.get(providerName);
            
            if (!provider) {
                throw new Error('Provider not initialized');
            }
            
            // Perform health check (implement in each provider)
            await provider.healthCheck();
            
            const responseTime = Date.now() - startTime;
            
            // Update health status
            health.status = 'healthy';
            health.lastCheck = new Date();
            health.responseTime = responseTime;
            health.successCount++;
            health.errorCount = Math.max(0, health.errorCount - 1); // Decay error count
            health.lastError = null;
            health.circuitBreakerOpen = false;
            
        } catch (error) {
            health.status = 'unhealthy';
            health.lastCheck = new Date();
            health.errorCount++;
            health.lastError = error.message;
            
            // Circuit breaker logic
            if (health.errorCount >= API_CONFIG.failover.failover_error_threshold) {
                health.circuitBreakerOpen = true;
                console.warn(`🔌 Circuit breaker opened for ${providerName}: ${health.errorCount} errors`);
            }
        }
        
        this.healthStatus.set(providerName, health);
    }

    /**
     * Check if provider is healthy
     */
    isProviderHealthy(providerName) {
        const health = this.healthStatus.get(providerName);
        return health && health.status === 'healthy' && !health.circuitBreakerOpen;
    }

    /**
     * Switch to a healthy provider
     */
    async switchToHealthyProvider() {
        for (const provider of API_CONFIG.fallback_order) {
            if (this.providers.has(provider) && this.isProviderHealthy(provider)) {
                const oldProvider = this.currentProvider;
                this.currentProvider = provider;
                
                console.log(`🔄 Provider switched: ${oldProvider} → ${provider}`);
                this.emit('providerSwitched', { from: oldProvider, to: provider });
                return true;
            }
        }
        
        console.error('❌ No healthy providers available for failover');
        this.emit('allProvidersDown');
        return false;
    }

    /**
     * Check rate limits before making request
     */
    canMakeRequest(providerName, requestType = 'requests_per_minute') {
        const counts = this.requestCounts.get(providerName);
        const limit = utils.getEffectiveRateLimit(providerName, requestType);
        
        if (!counts || !limit) return true;
        
        switch (requestType) {
            case 'requests_per_minute':
                return counts.minute < limit;
            case 'requests_per_second':
                return counts.second < limit;
            default:
                return true;
        }
    }

    /**
     * Record request for rate limiting
     */
    recordRequest(providerName) {
        const counts = this.requestCounts.get(providerName);
        if (counts) {
            counts.minute++;
            counts.second++;
            counts.daily++;
        }
    }

    /**
     * Make API request with automatic failover
     */
    async makeRequest(endpoint, options = {}, operation = 'market_data') {
        const maxRetries = API_CONFIG.failover.max_retry_attempts;
        let lastError = null;
        
        // Try providers in order until successful
        for (const providerName of this.getProvidersForOperation(operation)) {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    // Check rate limits
                    if (!this.canMakeRequest(providerName)) {
                        console.warn(`⚠️ Rate limit reached for ${providerName}, trying next provider`);
                        break;
                    }
                    
                    // Check provider health
                    if (!this.isProviderHealthy(providerName)) {
                        console.warn(`⚠️ Provider ${providerName} unhealthy, trying next provider`);
                        break;
                    }
                    
                    // Make request
                    const provider = this.providers.get(providerName);
                    const startTime = Date.now();
                    
                    this.recordRequest(providerName);
                    
                    const result = await provider.makeRequest(endpoint, options);
                    
                    // Update success metrics
                    const health = this.healthStatus.get(providerName);
                    health.responseTime = Date.now() - startTime;
                    health.successCount++;
                    
                    return {
                        success: true,
                        data: result,
                        provider: providerName,
                        responseTime: health.responseTime
                    };
                    
                } catch (error) {
                    lastError = error;
                    
                    // Update error metrics
                    const health = this.healthStatus.get(providerName);
                    health.errorCount++;
                    health.lastError = error.message;
                    
                    console.warn(`❌ Request failed for ${providerName} (attempt ${attempt + 1}): ${error.message}`);
                    
                    // Wait before retry
                    if (attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, API_CONFIG.failover.retry_delay));
                    }
                }
            }
        }
        
        // All providers failed
        throw new Error(`All API providers failed. Last error: ${lastError?.message}`);
    }

    /**
     * Get providers for specific operation type
     */
    getProvidersForOperation(operation) {
        const preferred = API_CONFIG.request_distribution[operation] || API_CONFIG.fallback_order;
        return preferred.filter(provider => this.providers.has(provider));
    }

    /**
     * Get current provider status
     */
    getStatus() {
        const status = {
            initialized: this.isInitialized,
            currentProvider: this.currentProvider,
            totalProviders: this.providers.size,
            healthyProviders: 0,
            providers: {}
        };
        
        for (const [name, health] of this.healthStatus) {
            status.providers[name] = {
                ...health,
                rateLimits: this.requestCounts.get(name),
                config: utils.getProvider(name)?.rate_limits
            };
            
            if (health.status === 'healthy') {
                status.healthyProviders++;
            }
        }
        
        return status;
    }

    /**
     * Force switch provider (manual override)
     */
    async forceSwitch(providerName) {
        if (!this.providers.has(providerName)) {
            throw new Error(`Provider ${providerName} not available`);
        }
        
        const oldProvider = this.currentProvider;
        this.currentProvider = providerName;
        
        console.log(`🔧 Manual provider switch: ${oldProvider} → ${providerName}`);
        this.emit('providerSwitched', { from: oldProvider, to: providerName, manual: true });
        
        return true;
    }

    /**
     * Get provider-specific data methods
     */
    async getMarketData(symbol, provider = null) {
        provider = provider || this.currentProvider;
        return this.makeRequest('/market-data', { symbol }, 'market_data');
    }

    async getHistoricalData(symbol, timeframe = '1D', provider = null) {
        provider = provider || this.currentProvider;
        return this.makeRequest('/historical', { symbol, timeframe }, 'historical_data');
    }

    async getOptionChain(symbol, provider = null) {
        provider = provider || this.currentProvider;
        return this.makeRequest('/option-chain', { symbol }, 'option_chain');
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Multi-API Manager...');
        
        // Close all provider connections
        for (const [name, provider] of this.providers) {
            try {
                if (provider.disconnect) {
                    await provider.disconnect();
                }
            } catch (error) {
                console.warn(`⚠️ Error disconnecting ${name}: ${error.message}`);
            }
        }
        
        this.providers.clear();
        this.healthStatus.clear();
        this.requestCounts.clear();
        
        console.log('✅ Multi-API Manager shutdown complete');
    }
}

module.exports = APIManager;
