// dashboard-backend/src/routes/multiApiRoutes.js

/**
 * Multi-API Routes
 * REST endpoints for multi-provider market data access
 * 
 * @version 2.3.0
 * @created September 03, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const APIManager = require('../services/api/api-manager');
const HealthMonitor = require('../services/api/health-monitor');
const RateLimiter = require('../services/api/rate-limiter');
const WebSocketManager = require('../services/api/websocket-manager');

// Initialize services (will be done in main server)
let apiManager, healthMonitor, rateLimiter, wsManager;

/**
 * Initialize multi-API services
 */
const initializeServices = async () => {
    try {
        // Initialize API Manager
        apiManager = new APIManager();
        await apiManager.initialize();
        
        // Initialize Health Monitor
        healthMonitor = new HealthMonitor();
        healthMonitor.start();
        
        // Initialize Rate Limiter
        rateLimiter = new RateLimiter();
        rateLimiter.initialize();
        
        // Initialize WebSocket Manager
        wsManager = new WebSocketManager();
        wsManager.start();
        
        // Make services available globally for Phase 3A
        global.apiManager = apiManager;
        global.healthMonitor = healthMonitor;
        global.rateLimiter = rateLimiter;
        global.wsManager = wsManager;
        
        console.log('✅ Multi-API services initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize multi-API services:', error);
        throw error;
    }
};

// Middleware to ensure services are initialized
const ensureServicesInitialized = (req, res, next) => {
    if (!apiManager || !healthMonitor || !rateLimiter || !wsManager) {
        return res.status(503).json({
            success: false,
            error: 'Multi-API services not initialized',
            message: 'Please wait for system initialization to complete'
        });
    }
    next();
};

// Apply middleware to all routes
router.use(ensureServicesInitialized);

/**
 * @route GET /api/multi/health
 * @desc Get health status of all API providers
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const healthSummary = healthMonitor.getHealthSummary();
        const usageStats = rateLimiter.getUsageStats();
        const wsStatus = wsManager.getAllConnectionsStatus();
        
        res.json({
            success: true,
            timestamp: new Date(),
            health: healthSummary,
            usage: usageStats,
            websockets: {
                isActive: wsStatus.isActive,
                activeConnections: Object.keys(wsStatus.connections).length,
                stats: wsStatus.stats
            },
            system: {
                totalProviders: healthSummary.totalProviders,
                healthyProviders: healthSummary.healthyProviders,
                overallCapacity: '730+ req/min',
                failoverEnabled: true
            }
        });
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message
        });
    }
});

/**
 * @route GET /api/multi/providers
 * @desc Get list of available API providers with capabilities
 * @access Private
 */
router.get('/providers', authenticateToken, async (req, res) => {
    try {
        const providers = apiManager.getAvailableProviders();
        const healthSummary = healthMonitor.getHealthSummary();
        
        const providersWithHealth = providers.map(provider => ({
            ...provider,
            health: healthSummary.providers[provider.name] || {
                status: 'unknown',
                availability: 0
            }
        }));
        
        res.json({
            success: true,
            providers: providersWithHealth,
            totalCapacity: providers.reduce((sum, p) => sum + p.limits.requests_per_minute, 0),
            primaryProvider: apiManager.getCurrentProvider()
        });
        
    } catch (error) {
        console.error('Providers list error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get providers list',
            message: error.message
        });
    }
});

/**
 * @route POST /api/multi/quote/:symbol
 * @desc Get quote for symbol using best available provider
 * @access Private
 */
router.post('/quote/:symbol', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { provider, force_provider } = req.body;
        
        if (!symbol) {
            return res.status(400).json({
                success: false,
                error: 'Symbol is required'
            });
        }
        
        const options = {
            preferredProvider: force_provider || provider,
            timeout: 10000,
            retryCount: 2
        };
        
        const result = await apiManager.makeRequest('getQuote', [symbol], options);
        
        res.json({
            success: true,
            data: result.data,
            metadata: {
                provider: result.provider,
                responseTime: result.responseTime,
                timestamp: new Date(),
                symbol: symbol
            }
        });
        
    } catch (error) {
        console.error('Quote request error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get quote',
            message: error.message,
            symbol: req.params.symbol
        });
    }
});

/**
 * @route POST /api/multi/quotes
 * @desc Get quotes for multiple symbols
 * @access Private
 */
router.post('/quotes', authenticateToken, async (req, res) => {
    try {
        const { symbols, provider, batch_size = 50 } = req.body;
        
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Symbols array is required'
            });
        }
        
        if (symbols.length > 200) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 200 symbols allowed per request'
            });
        }
        
        const options = {
            preferredProvider: provider,
            timeout: 15000,
            retryCount: 1
        };
        
        // Split into batches if needed
        const batches = [];
        for (let i = 0; i < symbols.length; i += batch_size) {
            batches.push(symbols.slice(i, i + batch_size));
        }
        
        const results = [];
        const errors = [];
        
        for (const batch of batches) {
            try {
                const result = await apiManager.makeRequest('getMultipleQuotes', [batch], options);
                if (result.data) {
                    results.push(...(Array.isArray(result.data) ? result.data : [result.data]));
                }
            } catch (error) {
                errors.push({
                    batch: batch,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            data: results,
            metadata: {
                totalRequested: symbols.length,
                successfullyFetched: results.length,
                errors: errors.length,
                batchCount: batches.length,
                timestamp: new Date()
            },
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        console.error('Multiple quotes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get quotes',
            message: error.message
        });
    }
});

/**
 * @route POST /api/multi/historical/:symbol
 * @desc Get historical data for symbol
 * @access Private
 */
router.post('/historical/:symbol', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { 
            from_date, 
            to_date, 
            interval = '1D', 
            provider,
            force_provider 
        } = req.body;
        
        if (!symbol || !from_date || !to_date) {
            return res.status(400).json({
                success: false,
                error: 'Symbol, from_date, and to_date are required'
            });
        }
        
        const options = {
            preferredProvider: force_provider || provider,
            timeout: 30000, // Historical data can take longer
            retryCount: 2
        };
        
        const result = await apiManager.makeRequest(
            'getHistoricalData', 
            [symbol, from_date, to_date, interval], 
            options
        );
        
        res.json({
            success: true,
            data: result.data,
            metadata: {
                provider: result.provider,
                responseTime: result.responseTime,
                timestamp: new Date(),
                symbol: symbol,
                period: {
                    from: from_date,
                    to: to_date,
                    interval: interval
                },
                dataPoints: result.data ? result.data.length : 0
            }
        });
        
    } catch (error) {
        console.error('Historical data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get historical data',
            message: error.message,
            symbol: req.params.symbol
        });
    }
});

/**
 * @route POST /api/multi/option-chain/:symbol
 * @desc Get option chain for symbol
 * @access Private
 */
router.post('/option-chain/:symbol', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { expiry_date, provider, force_provider } = req.body;
        
        if (!symbol) {
            return res.status(400).json({
                success: false,
                error: 'Symbol is required'
            });
        }
        
        const options = {
            preferredProvider: force_provider || provider,
            timeout: 20000,
            retryCount: 2
        };
        
        const args = expiry_date ? [symbol, expiry_date] : [symbol];
        const result = await apiManager.makeRequest('getOptionChain', args, options);
        
        res.json({
            success: true,
            data: result.data,
            metadata: {
                provider: result.provider,
                responseTime: result.responseTime,
                timestamp: new Date(),
                symbol: symbol,
                expiryDate: expiry_date || 'nearest',
                optionCount: result.data && result.data.options ? result.data.options.length : 0
            }
        });
        
    } catch (error) {
        console.error('Option chain error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get option chain',
            message: error.message,
            symbol: req.params.symbol
        });
    }
});

/**
 * @route GET /api/multi/market-status
 * @desc Get market status from best available provider
 * @access Private
 */
router.get('/market-status', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.query;
        
        const options = {
            preferredProvider: provider,
            timeout: 10000,
            retryCount: 1
        };
        
        const result = await apiManager.makeRequest('getMarketStatus', [], options);
        
        res.json({
            success: true,
            data: result.data,
            metadata: {
                provider: result.provider,
                responseTime: result.responseTime,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error('Market status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get market status',
            message: error.message
        });
    }
});

/**
 * @route POST /api/multi/provider/switch
 * @desc Manually switch to specific provider
 * @access Private
 */
router.post('/provider/switch', authenticateToken, async (req, res) => {
    try {
        const { provider, reason = 'manual_switch' } = req.body;
        
        if (!provider) {
            return res.status(400).json({
                success: false,
                error: 'Provider name is required'
            });
        }
        
        const previousProvider = apiManager.getCurrentProvider();
        const success = await apiManager.switchToProvider(provider, reason);
        
        if (success) {
            res.json({
                success: true,
                message: `Switched to provider: ${provider}`,
                metadata: {
                    previousProvider: previousProvider,
                    newProvider: provider,
                    reason: reason,
                    timestamp: new Date()
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: `Failed to switch to provider: ${provider}`,
                message: 'Provider may not be available or healthy'
            });
        }
        
    } catch (error) {
        console.error('Provider switch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to switch provider',
            message: error.message
        });
    }
});

/**
 * @route GET /api/multi/usage-stats
 * @desc Get detailed usage statistics
 * @access Private
 */
router.get('/usage-stats', authenticateToken, async (req, res) => {
    try {
        const usageStats = rateLimiter.getUsageStats();
        const healthSummary = healthMonitor.getHealthSummary();
        
        res.json({
            success: true,
            timestamp: new Date(),
            usage: usageStats,
            performance: {
                averageResponseTime: healthSummary.averageResponseTime,
                overallAvailability: healthSummary.overallAvailability,
                healthyProviders: healthSummary.healthyProviders,
                totalProviders: healthSummary.totalProviders
            },
            recommendations: generateUsageRecommendations(usageStats, healthSummary)
        });
        
    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get usage statistics',
            message: error.message
        });
    }
});

/**
 * @route POST /api/multi/websocket/subscribe
 * @desc Subscribe to real-time data via WebSocket
 * @access Private
 */
router.post('/websocket/subscribe', authenticateToken, async (req, res) => {
    try {
        const { symbols, connection_id, subscription_type = 'quotes' } = req.body;
        
        if (!symbols || !Array.isArray(symbols)) {
            return res.status(400).json({
                success: false,
                error: 'Symbols array is required'
            });
        }
        
        if (!connection_id) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        
        const results = [];
        const errors = [];
        
        for (const symbol of symbols) {
            try {
                await wsManager.subscribe(connection_id, symbol, subscription_type);
                results.push({ symbol: symbol, status: 'subscribed' });
            } catch (error) {
                errors.push({ symbol: symbol, error: error.message });
            }
        }
        
        res.json({
            success: true,
            message: `Subscription processed for ${symbols.length} symbols`,
            results: results,
            errors: errors.length > 0 ? errors : undefined,
            metadata: {
                connectionId: connection_id,
                subscriptionType: subscription_type,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error('WebSocket subscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process subscription',
            message: error.message
        });
    }
});

/**
 * Generate usage recommendations based on current stats
 */
function generateUsageRecommendations(usageStats, healthSummary) {
    const recommendations = [];
    
    // Check global usage
    if (usageStats.global.total_per_minute?.percentage > 80) {
        recommendations.push({
            type: 'warning',
            message: 'Approaching global rate limit. Consider enabling additional providers.',
            action: 'Enable more API providers or implement request batching'
        });
    }
    
    // Check provider health
    if (healthSummary.healthyProviders < 2) {
        recommendations.push({
            type: 'critical',
            message: 'Low provider redundancy detected.',
            action: 'Ensure multiple providers are configured and healthy'
        });
    }
    
    // Check response times
    if (healthSummary.averageResponseTime > 3000) {
        recommendations.push({
            type: 'warning',
            message: 'High average response time detected.',
            action: 'Check network connectivity and provider performance'
        });
    }
    
    // Check availability
    if (healthSummary.overallAvailability < 95) {
        recommendations.push({
            type: 'warning',
            message: 'Provider availability below optimal threshold.',
            action: 'Review provider health and enable failover mechanisms'
        });
    }
    
    return recommendations;
}

module.exports = { router, initializeServices };
