// dashboard-backend/src/config/api.config.js

/**
 * Multi-API Configuration for NSE Trading Dashboard
 * Handles configuration for all broker API providers with intelligent failover
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

require('dotenv').config();

/**
 * API Provider Configurations
 * Each provider includes rate limits, endpoints, and authentication details
 */
const API_PROVIDERS = {
    upstox: {
        name: 'Upstox',
        enabled: true,
        priority: 1,
        rate_limits: {
            requests_per_minute: 250,
            requests_per_second: 25,
            daily_limit: 100000,
            websocket_connections: 5
        },
        endpoints: {
            base_url: 'https://api.upstox.com/v2',
            auth_url: 'https://api.upstox.com/v2/login/authorization/dialog',
            token_url: 'https://api.upstox.com/v2/login/authorization/token',
            market_data: '/market-data',
            historical: '/historical-candle',
            options: '/option-chain',
            portfolio: '/portfolio',
            orders: '/order'
        },
        websocket: {
            url: 'wss://ws-api.upstox.com/v2/feed',
            heartbeat_interval: 30000,
            reconnect_interval: 5000,
            max_reconnect_attempts: 10
        },
        authentication: {
            client_id: process.env.UPSTOX_CLIENT_ID,
            client_secret: process.env.UPSTOX_CLIENT_SECRET,
            api_key: process.env.UPSTOX_API_KEY,
            redirect_uri: process.env.UPSTOX_REDIRECT_URI,
            access_token: process.env.UPSTOX_ACCESS_TOKEN
        },
        features: {
            real_time_data: true,
            historical_data: true,
            option_chain: true,
            order_placement: true,
            portfolio_data: true,
            websocket_feed: true
        }
    },

    fyers: {
        name: 'FYERS',
        enabled: true,
        priority: 2,
        rate_limits: {
            requests_per_minute: 200,
            requests_per_second: 10,
            daily_limit: 100000,
            websocket_connections: 3
        },
        endpoints: {
            base_url: 'https://api-t1.fyers.in/api/v3',
            auth_url: 'https://api-t1.fyers.in/api/v3/generate-authcode',
            token_url: 'https://api-t1.fyers.in/api/v3/validate-authcode',
            market_data: '/data/quotes',
            historical: '/data/history',
            options: '/data/optionchain',
            portfolio: '/portfolio/holdings',
            orders: '/orders'
        },
        websocket: {
            url: 'wss://api-t1.fyers.in/socket/v3/dataSock',
            heartbeat_interval: 25000,
            reconnect_interval: 5000,
            max_reconnect_attempts: 8
        },
        authentication: {
            api_id: process.env.FYERS_API_ID,
            api_secret: process.env.FYERS_API_SECRET,
            access_token: process.env.FYERS_ACCESS_TOKEN
        },
        features: {
            real_time_data: true,
            historical_data: true,
            option_chain: true,
            order_placement: true,
            portfolio_data: true,
            websocket_feed: true
        }
    },

    aliceblue: {
        name: 'AliceBlue',
        enabled: true,
        priority: 3,
        rate_limits: {
            requests_per_minute: 120,
            requests_per_second: 5,
            daily_limit: 50000,
            websocket_connections: 2
        },
        endpoints: {
            base_url: 'https://ant.aliceblueonline.com',
            auth_url: 'https://ant.aliceblueonline.com/?appcode=',
            token_url: 'https://ant.aliceblueonline.com/open-api/od-rest/v1/vendor/getUserDetails',
            market_data: '/open-api/od-rest/v1/marketData/instruments',
            historical: '/open-api/od-rest/v1/chart/history',
            options: '/open-api/od-rest/v1/marketData/optionChain',
            portfolio: '/open-api/od-rest/v1/portfolio/holdings',
            orders: '/open-api/od-rest/v1/placeOrder'
        },
        websocket: {
            url: 'wss://ws1.aliceblueonline.com/NorenWS/',
            heartbeat_interval: 20000,
            reconnect_interval: 5000,
            max_reconnect_attempts: 6
        },
        authentication: {
            user_id: process.env.ALICEBLUE_USER_ID,
            app_code: process.env.ALICEBLUE_APP_CODE,
            api_secret: process.env.ALICEBLUE_API_SECRET,
            redirect_uri: process.env.ALICEBLUE_REDIRECT_URI,
            access_token: process.env.ALICEBLUE_ACCESS_TOKEN
        },
        features: {
            real_time_data: true,
            historical_data: true,
            option_chain: true,
            order_placement: true,
            portfolio_data: true,
            websocket_feed: true
        }
    },

    flattrade: {
        name: 'Flattrade',
        enabled: true,
        priority: 4,
        rate_limits: {
            requests_per_minute: 80,
            requests_per_second: 2,
            daily_limit: 10000,
            websocket_connections: 1
        },
        endpoints: {
            base_url: process.env.FLATTRADE_API_URL || 'https://piconnect.flattrade.in/PiConnectTP/',
            auth_url: 'https://auth.flattrade.in/',
            market_data: 'MarketWatch',
            historical: 'TPSeries',
            options: 'GetOptionChain',
            portfolio: 'PositionBook',
            orders: 'PlaceOrder'
        },
        websocket: {
            url: 'wss://piconnect.flattrade.in/PiConnectWSTp/',
            heartbeat_interval: 15000,
            reconnect_interval: 5000,
            max_reconnect_attempts: 5
        },
        authentication: {
            api_key: process.env.FLATTRADE_API_KEY,
            api_secret: process.env.FLATTRADE_API_SECRET,
            client_code: process.env.FLATTRADE_CLIENT_CODE,
            access_token: process.env.FLATTRADE_TOKEN
        },
        features: {
            real_time_data: true,
            historical_data: true,
            option_chain: true,
            order_placement: true,
            portfolio_data: true,
            websocket_feed: true
        }
    },

    nse_public: {
        name: 'NSE Public Data',
        enabled: true,
        priority: 5,
        rate_limits: {
            requests_per_minute: 60,
            requests_per_second: 1,
            daily_limit: 5000,
            websocket_connections: 0
        },
        endpoints: {
            base_url: 'https://www.nseindia.com/api',
            market_data: '/equity-stockIndices',
            historical: '/historical/cm/equity',
            options: '/option-chain-indices',
            indices: '/allIndices'
        },
        authentication: {
            // Public API - no authentication required
            requires_auth: false
        },
        features: {
            real_time_data: true,
            historical_data: true,
            option_chain: true,
            order_placement: false,
            portfolio_data: false,
            websocket_feed: false
        }
    }
};

/**
 * Global API Configuration
 */
const API_CONFIG = {
    // Multi-API Settings
    multi_api_enabled: process.env.MULTI_API_ENABLED === 'true',
    primary_provider: process.env.PRIMARY_API_PROVIDER || 'upstox',
    fallback_order: (process.env.FALLBACK_ORDER || 'upstox,fyers,aliceblue,flattrade,nse_public').split(','),
    
    // Global Rate Limiting
    global_rate_limit: {
        requests_per_minute: 650, // Combined capacity across all providers
        requests_per_second: 15,  // Conservative burst rate
        daily_limit: 500000       // Combined daily limit
    },
    
    // Rate Limiting
    rate_limit_buffer: parseInt(process.env.RATE_LIMIT_BUFFER) || 80, // % of limit to use
    global_timeout: parseInt(process.env.API_TIMEOUT) || 10000,
    
    // Health Monitoring
    health_check_interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    failover_error_threshold: parseInt(process.env.FAILOVER_ERROR_THRESHOLD) || 5,
    recovery_check_interval: 300000, // 5 minutes
    
    // Load Balancing
    load_balancing_strategy: 'priority_weighted', // priority_weighted, round_robin, least_loaded
    request_distribution: {
        market_data: ['upstox', 'fyers'],
        historical_data: ['fyers', 'upstox'],
        option_chain: ['upstox', 'aliceblue'],
        orders: ['upstox', 'fyers', 'aliceblue', 'flattrade'],
        portfolio: ['upstox', 'fyers', 'aliceblue', 'flattrade']
    },
    
    // Failover Configuration
    failover: {
        enabled: true,
        automatic: true,
        max_retry_attempts: 3,
        retry_delay: 1000, // ms
        circuit_breaker_timeout: 60000, // 1 minute
        health_recovery_checks: 5
    },
    
    // WebSocket Configuration
    websocket: {
        enabled: true,
        max_concurrent_connections: 10,
        heartbeat_timeout: 60000,
        reconnect_on_failure: true,
        data_validation: true
    },
    
    // Data Validation
    validation: {
        cross_reference_enabled: true,
        min_providers_for_validation: 2,
        price_variance_threshold: 0.01, // 1%
        volume_variance_threshold: 0.05 // 5%
    },
    
    // Caching
    cache: {
        enabled: true,
        market_data_ttl: 1000, // 1 second
        historical_data_ttl: 300000, // 5 minutes
        option_chain_ttl: 5000, // 5 seconds
        portfolio_ttl: 30000 // 30 seconds
    }
};

/**
 * Symbol Mapping Configuration
 * Maps internal symbols to provider-specific formats
 */
const SYMBOL_MAPPING = {
    // NSE Stocks
    'RELIANCE': {
        upstox: 'NSE_EQ|INE002A01018',
        fyers: 'NSE:RELIANCE-EQ',
        aliceblue: 'RELIANCE',
        flattrade: 'RELIANCE',
        nse_public: 'RELIANCE'
    },
    'TCS': {
        upstox: 'NSE_EQ|INE467B01029',
        fyers: 'NSE:TCS-EQ',
        aliceblue: 'TCS',
        flattrade: 'TCS',
        nse_public: 'TCS'
    },
    'INFY': {
        upstox: 'NSE_EQ|INE009A01021',
        fyers: 'NSE:INFY-EQ',
        aliceblue: 'INFY',
        flattrade: 'INFY',
        nse_public: 'INFY'
    },
    // Indices
    'NIFTY': {
        upstox: 'NSE_INDEX|Nifty 50',
        fyers: 'NSE:NIFTY50-INDEX',
        aliceblue: 'NIFTY',
        flattrade: 'NIFTY',
        nse_public: 'NIFTY 50'
    },
    'BANKNIFTY': {
        upstox: 'NSE_INDEX|Nifty Bank',
        fyers: 'NSE:NIFTYBANK-INDEX',
        aliceblue: 'BANKNIFTY',
        flattrade: 'BANKNIFTY',
        nse_public: 'NIFTY BANK'
    }
};

/**
 * Error Code Mapping
 * Maps provider-specific error codes to standardized responses
 */
const ERROR_MAPPING = {
    common: {
        rate_limit_exceeded: 'RATE_LIMIT_EXCEEDED',
        authentication_failed: 'AUTH_FAILED',
        invalid_symbol: 'INVALID_SYMBOL',
        market_closed: 'MARKET_CLOSED',
        network_error: 'NETWORK_ERROR'
    },
    upstox: {
        '429': 'RATE_LIMIT_EXCEEDED',
        '401': 'AUTH_FAILED',
        '400': 'INVALID_SYMBOL',
        '500': 'SERVER_ERROR'
    },
    fyers: {
        '10003': 'RATE_LIMIT_EXCEEDED',
        '10001': 'AUTH_FAILED',
        '10006': 'INVALID_SYMBOL'
    },
    aliceblue: {
        'Rate limit exceeded': 'RATE_LIMIT_EXCEEDED',
        'Invalid session': 'AUTH_FAILED'
    },
    flattrade: {
        'Rate limit exceeded': 'RATE_LIMIT_EXCEEDED',
        'Invalid token': 'AUTH_FAILED'
    }
};

/**
 * Utility Functions
 */
const utils = {
    /**
     * Get provider configuration by name
     */
    getProvider(providerName) {
        return API_PROVIDERS[providerName] || null;
    },

    /**
     * Get enabled providers in priority order
     */
    getEnabledProviders() {
        return Object.keys(API_PROVIDERS)
            .filter(key => API_PROVIDERS[key].enabled)
            .sort((a, b) => API_PROVIDERS[a].priority - API_PROVIDERS[b].priority);
    },

    /**
     * Get symbol for specific provider
     */
    getSymbolForProvider(symbol, provider) {
        return SYMBOL_MAPPING[symbol]?.[provider] || symbol;
    },

    /**
     * Map provider error to standardized error
     */
    mapError(provider, error) {
        const errorString = error.toString();
        const providerMapping = ERROR_MAPPING[provider] || {};
        
        for (const [providerError, standardError] of Object.entries(providerMapping)) {
            if (errorString.includes(providerError)) {
                return standardError;
            }
        }
        
        return 'UNKNOWN_ERROR';
    },

    /**
     * Check if provider supports feature
     */
    supportsFeature(provider, feature) {
        return API_PROVIDERS[provider]?.features?.[feature] || false;
    },

    /**
     * Get rate limit for provider
     */
    getRateLimit(provider, type = 'requests_per_minute') {
        return API_PROVIDERS[provider]?.rate_limits?.[type] || 0;
    },

    /**
     * Calculate effective rate limit with buffer
     */
    getEffectiveRateLimit(provider, type = 'requests_per_minute') {
        const limit = this.getRateLimit(provider, type);
        return Math.floor(limit * (API_CONFIG.rate_limit_buffer / 100));
    }
};

module.exports = {
    API_PROVIDERS,
    API_CONFIG,
    SYMBOL_MAPPING,
    ERROR_MAPPING,
    utils
};
