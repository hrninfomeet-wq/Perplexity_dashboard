// dashboard-backend/src/services/api/rate-limiter.js

/**
 * Advanced Rate Limiter Service
 * Global rate limiting coordination across all API providers
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const EventEmitter = require('events');
const { API_CONFIG } = require('../../config/api.config');

class RateLimiter extends EventEmitter {
    constructor() {
        super();
        
        this.providerLimits = new Map();
        this.globalLimits = new Map();
        this.requestQueues = new Map();
        this.isActive = false;
        
        console.log('⏱️ Advanced Rate Limiter initialized');
    }

    /**
     * Initialize rate limiter
     */
    initialize() {
        this.isActive = true;
        this.setupGlobalLimits();
        console.log('⏱️ Rate limiter activated with global coordination');
    }

    /**
     * Setup global rate limits
     */
    setupGlobalLimits() {
        // Global limits across all providers
        this.globalLimits.set('total_per_minute', {
            limit: API_CONFIG.global_rate_limit.requests_per_minute,
            window: 60000, // 1 minute
            requests: [],
            currentCount: 0
        });
        
        this.globalLimits.set('total_per_second', {
            limit: API_CONFIG.global_rate_limit.requests_per_second,
            window: 1000, // 1 second
            requests: [],
            currentCount: 0
        });
        
        // Start cleanup interval
        setInterval(() => {
            this.cleanupExpiredRequests();
        }, 1000);
    }

    /**
     * Register provider with rate limits
     */
    registerProvider(providerName, rateConfig) {
        const limiterConfig = {
            requests_per_minute: {
                limit: rateConfig.requests_per_minute,
                window: 60000,
                requests: [],
                currentCount: 0
            },
            requests_per_second: {
                limit: rateConfig.requests_per_second,
                window: 1000,
                requests: [],
                currentCount: 0
            },
            daily_limit: rateConfig.daily_limit ? {
                limit: rateConfig.daily_limit,
                window: 86400000, // 24 hours
                requests: [],
                currentCount: 0
            } : null,
            buffer_percentage: rateConfig.buffer_percentage || 10,
            priority: rateConfig.priority || 1,
            isEnabled: true
        };
        
        this.providerLimits.set(providerName, limiterConfig);
        this.requestQueues.set(providerName, []);
        
        console.log(`⏱️ Rate limits registered for ${providerName}:`, {
            perMinute: rateConfig.requests_per_minute,
            perSecond: rateConfig.requests_per_second,
            daily: rateConfig.daily_limit || 'unlimited'
        });
    }

    /**
     * Check if request is allowed for provider
     */
    async canMakeRequest(providerName, requestType = 'standard') {
        if (!this.isActive) return true;
        
        const providerConfig = this.providerLimits.get(providerName);
        if (!providerConfig || !providerConfig.isEnabled) {
            return false;
        }
        
        // Check global limits first
        if (!this.checkGlobalLimits()) {
            this.emit('globalLimitExceeded', { providerName, requestType });
            return false;
        }
        
        // Check provider-specific limits
        if (!this.checkProviderLimits(providerName)) {
            this.emit('providerLimitExceeded', { providerName, requestType });
            return false;
        }
        
        return true;
    }

    /**
     * Check global rate limits
     */
    checkGlobalLimits() {
        for (const [limitType, config] of this.globalLimits) {
            const effectiveLimit = Math.floor(config.limit * 0.9); // 10% buffer
            
            if (config.currentCount >= effectiveLimit) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check provider-specific rate limits
     */
    checkProviderLimits(providerName) {
        const providerConfig = this.providerLimits.get(providerName);
        if (!providerConfig) return false;
        
        // Check each limit type
        for (const [limitType, config] of Object.entries(providerConfig)) {
            if (limitType === 'buffer_percentage' || limitType === 'priority' || 
                limitType === 'isEnabled' || !config || !config.limit) {
                continue;
            }
            
            // Apply buffer percentage
            const bufferMultiplier = (100 - providerConfig.buffer_percentage) / 100;
            const effectiveLimit = Math.floor(config.limit * bufferMultiplier);
            
            if (config.currentCount >= effectiveLimit) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Record a request
     */
    recordRequest(providerName, requestType = 'standard') {
        if (!this.isActive) return;
        
        const timestamp = Date.now();
        
        // Record in global limits
        for (const [limitType, config] of this.globalLimits) {
            config.requests.push(timestamp);
            config.currentCount++;
        }
        
        // Record in provider limits
        const providerConfig = this.providerLimits.get(providerName);
        if (providerConfig) {
            for (const [limitType, config] of Object.entries(providerConfig)) {
                if (config && config.limit) {
                    config.requests.push(timestamp);
                    config.currentCount++;
                }
            }
        }
        
        this.emit('requestRecorded', { 
            provider: providerName, 
            type: requestType, 
            timestamp 
        });
    }

    /**
     * Queue request for later execution
     */
    async queueRequest(providerName, requestFunction, priority = 1) {
        const queue = this.requestQueues.get(providerName);
        if (!queue) {
            throw new Error(`Provider ${providerName} not registered`);
        }
        
        return new Promise((resolve, reject) => {
            const queuedRequest = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                function: requestFunction,
                priority: priority,
                timestamp: Date.now(),
                resolve: resolve,
                reject: reject
            };
            
            // Insert based on priority (higher priority first)
            let insertIndex = queue.length;
            for (let i = 0; i < queue.length; i++) {
                if (queue[i].priority < priority) {
                    insertIndex = i;
                    break;
                }
            }
            
            queue.splice(insertIndex, 0, queuedRequest);
            
            this.emit('requestQueued', {
                provider: providerName,
                requestId: queuedRequest.id,
                priority: priority,
                queueSize: queue.length
            });
            
            // Process queue
            this.processQueue(providerName);
        });
    }

    /**
     * Process queued requests for provider
     */
    async processQueue(providerName) {
        const queue = this.requestQueues.get(providerName);
        if (!queue || queue.length === 0) return;
        
        // Check if we can process next request
        if (await this.canMakeRequest(providerName)) {
            const request = queue.shift();
            
            try {
                // Record the request
                this.recordRequest(providerName, 'queued');
                
                // Execute the request
                const result = await request.function();
                request.resolve(result);
                
                this.emit('requestProcessed', {
                    provider: providerName,
                    requestId: request.id,
                    success: true,
                    queueSize: queue.length
                });
                
            } catch (error) {
                request.reject(error);
                
                this.emit('requestProcessed', {
                    provider: providerName,
                    requestId: request.id,
                    success: false,
                    error: error.message,
                    queueSize: queue.length
                });
            }
            
            // Schedule next processing if queue has more items
            if (queue.length > 0) {
                setTimeout(() => {
                    this.processQueue(providerName);
                }, this.getNextProcessingDelay(providerName));
            }
        } else {
            // Schedule retry
            setTimeout(() => {
                this.processQueue(providerName);
            }, this.getRetryDelay(providerName));
        }
    }

    /**
     * Get delay before next queue processing
     */
    getNextProcessingDelay(providerName) {
        const providerConfig = this.providerLimits.get(providerName);
        if (!providerConfig) return 1000;
        
        // Calculate delay based on per-second limit
        const perSecondLimit = providerConfig.requests_per_second?.limit || 1;
        return Math.max(100, Math.floor(1000 / perSecondLimit));
    }

    /**
     * Get retry delay when limits are exceeded
     */
    getRetryDelay(providerName) {
        const baseDelay = 1000; // 1 second base
        const queue = this.requestQueues.get(providerName);
        const queueSize = queue ? queue.length : 0;
        
        // Exponential backoff based on queue size
        return baseDelay * Math.min(Math.pow(2, Math.floor(queueSize / 10)), 32);
    }

    /**
     * Clean up expired requests from tracking
     */
    cleanupExpiredRequests() {
        const now = Date.now();
        
        // Clean global limits
        for (const [limitType, config] of this.globalLimits) {
            const cutoff = now - config.window;
            const beforeCount = config.requests.length;
            
            config.requests = config.requests.filter(timestamp => timestamp > cutoff);
            config.currentCount = config.requests.length;
            
            if (beforeCount !== config.currentCount) {
                this.emit('limitsCleaned', {
                    type: 'global',
                    limitType: limitType,
                    removed: beforeCount - config.currentCount,
                    remaining: config.currentCount
                });
            }
        }
        
        // Clean provider limits
        for (const [providerName, providerConfig] of this.providerLimits) {
            for (const [limitType, config] of Object.entries(providerConfig)) {
                if (!config || !config.requests) continue;
                
                const cutoff = now - config.window;
                const beforeCount = config.requests.length;
                
                config.requests = config.requests.filter(timestamp => timestamp > cutoff);
                config.currentCount = config.requests.length;
                
                if (beforeCount !== config.currentCount) {
                    this.emit('limitsCleaned', {
                        type: 'provider',
                        provider: providerName,
                        limitType: limitType,
                        removed: beforeCount - config.currentCount,
                        remaining: config.currentCount
                    });
                }
            }
        }
    }

    /**
     * Get current usage statistics
     */
    getUsageStats() {
        const stats = {
            timestamp: new Date(),
            global: {},
            providers: {},
            queues: {}
        };
        
        // Global stats
        for (const [limitType, config] of this.globalLimits) {
            stats.global[limitType] = {
                limit: config.limit,
                current: config.currentCount,
                percentage: Math.round((config.currentCount / config.limit) * 100)
            };
        }
        
        // Provider stats
        for (const [providerName, providerConfig] of this.providerLimits) {
            stats.providers[providerName] = {};
            
            for (const [limitType, config] of Object.entries(providerConfig)) {
                if (config && config.limit) {
                    const bufferMultiplier = (100 - providerConfig.buffer_percentage) / 100;
                    const effectiveLimit = Math.floor(config.limit * bufferMultiplier);
                    
                    stats.providers[providerName][limitType] = {
                        limit: config.limit,
                        effectiveLimit: effectiveLimit,
                        current: config.currentCount,
                        percentage: Math.round((config.currentCount / effectiveLimit) * 100)
                    };
                }
            }
        }
        
        // Queue stats
        for (const [providerName, queue] of this.requestQueues) {
            stats.queues[providerName] = {
                size: queue.length,
                oldestRequest: queue.length > 0 ? 
                    new Date(queue[queue.length - 1].timestamp) : null
            };
        }
        
        return stats;
    }

    /**
     * Enable/disable provider rate limiting
     */
    setProviderEnabled(providerName, enabled) {
        const providerConfig = this.providerLimits.get(providerName);
        if (providerConfig) {
            providerConfig.isEnabled = enabled;
            console.log(`⏱️ Provider ${providerName} rate limiting ${enabled ? 'enabled' : 'disabled'}`);
            
            this.emit('providerToggled', { provider: providerName, enabled });
        }
    }

    /**
     * Reset rate limits for provider
     */
    resetProviderLimits(providerName) {
        const providerConfig = this.providerLimits.get(providerName);
        if (providerConfig) {
            for (const [limitType, config] of Object.entries(providerConfig)) {
                if (config && config.requests) {
                    config.requests = [];
                    config.currentCount = 0;
                }
            }
            
            console.log(`⏱️ Rate limits reset for ${providerName}`);
            this.emit('limitsReset', { provider: providerName });
        }
    }

    /**
     * Get next available time for provider
     */
    getNextAvailableTime(providerName) {
        const providerConfig = this.providerLimits.get(providerName);
        if (!providerConfig) return Date.now();
        
        let nextAvailable = Date.now();
        
        for (const [limitType, config] of Object.entries(providerConfig)) {
            if (!config || !config.requests || config.requests.length === 0) continue;
            
            const bufferMultiplier = (100 - providerConfig.buffer_percentage) / 100;
            const effectiveLimit = Math.floor(config.limit * bufferMultiplier);
            
            if (config.currentCount >= effectiveLimit) {
                const oldestRequest = Math.min(...config.requests);
                const nextWindow = oldestRequest + config.window;
                nextAvailable = Math.max(nextAvailable, nextWindow);
            }
        }
        
        return nextAvailable;
    }

    /**
     * Shutdown rate limiter
     */
    shutdown() {
        this.isActive = false;
        
        // Clear all queues
        for (const [providerName, queue] of this.requestQueues) {
            queue.forEach(request => {
                request.reject(new Error('Rate limiter shutting down'));
            });
            queue.length = 0;
        }
        
        console.log('⏱️ Rate limiter shutdown complete');
        this.emit('shutdown');
    }
}

module.exports = RateLimiter;
