// dashboard-backend/src/config/market.config.js
/**
 * Market Data Configuration for Phase 3A Implementation
 * Leveraging existing Phase 2.5 Multi-API infrastructure (590+ req/min capacity)
 */

const MARKET_CONFIG = {
    // Core Market Settings
    MARKET_HOURS: {
        MARKET_OPEN: '09:15',
        MARKET_CLOSE: '15:30',
        PRE_MARKET_START: '09:00',
        POST_MARKET_END: '16:00',
        TIMEZONE: 'Asia/Kolkata'
    },

    // Symbol Management
    SYMBOL_LISTS: {
        // NIFTY 50 stocks for primary monitoring
        NIFTY_50: [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
            'HDFC', 'KOTAKBANK', 'HINDUNILVR', 'ITC', 'SBIN',
            'BHARTIARTL', 'ASIANPAINT', 'MARUTI', 'AXISBANK', 'LT',
            'NESTLEIND', 'ULTRACEMCO', 'TITAN', 'HCLTECH', 'BAJFINANCE',
            'POWERGRID', 'M&M', 'NTPC', 'TECHM', 'ONGC',
            'TATAMOTORS', 'SUNPHARMA', 'BAJAJFINSV', 'WIPRO', 'DRREDDY',
            'INDUSINDBK', 'EICHERMOT', 'ADANIPORTS', 'UPL', 'TATASTEEL',
            'GRASIM', 'APOLLOHOSP', 'BPCL', 'BRITANNIA', 'COALINDIA',
            'CIPLA', 'DIVISLAB', 'HEROMOTOCO', 'HINDALCO', 'JSWSTEEL',
            'SHREECEM', 'TATACONSUM', 'IOC', 'BAJAJ-AUTO', 'SBILIFE'
        ],

        // High-volume trading stocks for opportunity detection
        HIGH_VOLUME_STOCKS: [
            'BANKNIFTY', 'NIFTY', 'ADANIGREEN', 'ADANIENT', 'TATASTEEL',
            'SUZLON', 'YESBANK', 'PNB', 'SAIL', 'NMDC',
            'VEDL', 'JINDALSTEEL', 'RPOWER', 'JPASSOCIAT', 'DLF'
        ],

        // F&O Active stocks for derivatives opportunities  
        FO_ACTIVE: [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
            'ITC', 'SBIN', 'BHARTIARTL', 'HINDUNILVR', 'MARUTI',
            'AXISBANK', 'LT', 'ASIANPAINT', 'BAJFINANCE', 'HCLTECH'
        ]
    },

    // Data Ingestion Settings
    INGESTION: {
        BATCH_SIZE: 50,              // Process 50 symbols per batch
        INTERVAL_MS: 5000,           // 5-second intervals
        MAX_SYMBOLS: 1000,           // Maximum symbols to monitor
        PARALLEL_REQUESTS: 10,       // Parallel API requests
        RETRY_ATTEMPTS: 3,           // Retry failed requests
        TIMEOUT_MS: 2000,           // Request timeout

        // API Utilization Strategy
        API_DISTRIBUTION: {
            PRIMARY_PROVIDER: 'upstox',     // 250 req/min
            BACKUP_PROVIDERS: ['fyers', 'flattrade', 'nse_public'],
            FAILOVER_THRESHOLD: 0.8,        // Switch at 80% capacity
            LOAD_BALANCING: true
        }
    },

    // Technical Analysis Configuration  
    TECHNICAL_ANALYSIS: {
        INDICATORS: {
            RSI: { period: 14, overbought: 70, oversold: 30 },
            MACD: { fast: 12, slow: 26, signal: 9 },
            SMA: { periods: [20, 50, 200] },
            EMA: { periods: [9, 21] },
            BOLLINGER: { period: 20, deviation: 2 },
            STOCHASTIC: { k: 14, d: 3 },
            WILLIAMS_R: { period: 14 }
        },

        PATTERNS: {
            // Chart patterns for detection
            BREAKOUT_THRESHOLD: 0.02,       // 2% breakout
            VOLUME_SPIKE_RATIO: 2.0,        // 2x average volume
            MOMENTUM_THRESHOLD: 0.03,       // 3% momentum
            SUPPORT_RESISTANCE_PRECISION: 0.005  // 0.5% precision
        }
    },

    // Opportunity Detection Settings
    OPPORTUNITY_DETECTION: {
        // Volume Analysis
        VOLUME_ANALYSIS: {
            SPIKE_RATIO: 2.0,              // 2x normal volume
            HIGH_VOLUME_RATIO: 1.5,        // 1.5x for high volume flag
            VOLUME_MA_PERIOD: 20           // 20-day volume moving average
        },

        // Price Movement Thresholds
        PRICE_THRESHOLDS: {
            SIGNIFICANT_MOVE: 0.03,        // 3% price movement
            BREAKOUT_MOVE: 0.05,           // 5% breakout movement
            GAP_THRESHOLD: 0.02,           // 2% gap up/down
            INTRADAY_HIGH_LOW: 0.04        // 4% intraday range
        },

        // Strategy-Specific Settings
        STRATEGIES: {
            BTST: {
                MIN_VOLUME_RATIO: 1.5,
                MIN_PRICE_CHANGE: 0.02,
                TIME_WINDOW: '14:30-15:30'  // Last hour analysis
            },
            
            SCALPING: {
                MIN_VOLUME_RATIO: 2.0,
                PRICE_MOVE_THRESHOLD: 0.01,
                TIME_WINDOWS: ['09:15-10:30', '14:00-15:30']
            },

            SWING: {
                RSI_OVERSOLD: 35,
                RSI_OVERBOUGHT: 65,
                TREND_CONFIRMATION_PERIOD: 5
            },

            OPTION_SELLING: {
                IV_THRESHOLD: 25,             // Implied Volatility threshold
                TIME_TO_EXPIRY: 30,          // Days to expiry
                DELTA_RANGE: [0.15, 0.35]    // Delta range for selling
            }
        }
    },

    // Database Configuration
    DATABASE: {
        COLLECTIONS: {
            MARKET_DATA: 'marketdatas',
            OPPORTUNITIES: 'tradingopportunities', 
            ANALYTICS: 'marketanalytics',
            SYMBOL_MASTER: 'symbolmaster'
        },

        RETENTION: {
            MINUTE_DATA: 30,              // 30 days
            HOURLY_DATA: 90,              // 90 days  
            DAILY_DATA: 365,              // 1 year
            OPPORTUNITIES: 60             // 60 days
        },

        INDEXING: {
            COMPOUND_INDEXES: [
                ['symbol', 'timestamp'],
                ['timestamp', 'volumeRatio'],
                ['priceChangePercent', 'timestamp']
            ]
        }
    },

    // WebSocket Streaming
    WEBSOCKET: {
        CHANNELS: {
            LIVE_QUOTES: 'live_quotes',
            OPPORTUNITIES: 'trading_opportunities',
            MARKET_EVENTS: 'market_events',
            ANALYTICS: 'market_analytics'
        },

        THROTTLE: {
            QUOTES_MS: 1000,              // 1 second for live quotes
            OPPORTUNITIES_MS: 500,        // 0.5 seconds for opportunities
            ANALYTICS_MS: 5000            // 5 seconds for analytics
        }
    },

    // Alert System Configuration
    ALERTS: {
        PRIORITY_LEVELS: {
            CRITICAL: 'critical',         // Immediate action required
            HIGH: 'high',                 // Important opportunities
            MEDIUM: 'medium',             // Moderate opportunities
            LOW: 'low'                    // Informational alerts
        },

        NOTIFICATION_CHANNELS: {
            WEBSOCKET: true,
            DATABASE: true,
            EMAIL: false,                 // Can be enabled later
            SMS: false                    // Can be enabled later
        }
    },

    // Performance Monitoring
    PERFORMANCE: {
        METRICS: {
            INGESTION_RATE: 'symbols_per_second',
            PROCESSING_TIME: 'avg_processing_ms',
            API_UTILIZATION: 'requests_per_minute',
            ERROR_RATE: 'error_percentage',
            OPPORTUNITY_RATE: 'opportunities_per_hour'
        },

        THRESHOLDS: {
            MAX_PROCESSING_TIME: 200,     // 200ms maximum
            MAX_ERROR_RATE: 0.01,        // 1% maximum error rate
            MIN_INGESTION_RATE: 100,     // Minimum 100 symbols/second
            API_UTILIZATION_TARGET: 0.8   // 80% API utilization target
        }
    }
};

// Market Utility Functions
const MARKET_UTILS = {
    // Check if market is currently open
    isMarketOpen() {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', {
            timeZone: MARKET_CONFIG.MARKET_HOURS.TIMEZONE,
            hour12: false
        });
        
        const openTime = MARKET_CONFIG.MARKET_HOURS.MARKET_OPEN;
        const closeTime = MARKET_CONFIG.MARKET_HOURS.MARKET_CLOSE;
        
        return currentTime >= openTime && currentTime <= closeTime;
    },

    // Get active symbols list based on strategy
    getSymbolsForStrategy(strategy = 'ALL') {
        switch (strategy.toUpperCase()) {
            case 'NIFTY':
                return MARKET_CONFIG.SYMBOL_LISTS.NIFTY_50;
            case 'HIGH_VOLUME':
                return MARKET_CONFIG.SYMBOL_LISTS.HIGH_VOLUME_STOCKS;
            case 'FO':
                return MARKET_CONFIG.SYMBOL_LISTS.FO_ACTIVE;
            case 'ALL':
                return [
                    ...MARKET_CONFIG.SYMBOL_LISTS.NIFTY_50,
                    ...MARKET_CONFIG.SYMBOL_LISTS.HIGH_VOLUME_STOCKS,
                    ...MARKET_CONFIG.SYMBOL_LISTS.FO_ACTIVE
                ];
            default:
                return MARKET_CONFIG.SYMBOL_LISTS.NIFTY_50;
        }
    },

    // Calculate optimal batch size based on API capacity
    getOptimalBatchSize(totalSymbols, apiCapacityPerMinute = 590) {
        const requestsPerSecond = apiCapacityPerMinute / 60;
        const intervalSeconds = MARKET_CONFIG.INGESTION.INTERVAL_MS / 1000;
        const maxRequestsPerInterval = requestsPerSecond * intervalSeconds;
        
        return Math.min(
            MARKET_CONFIG.INGESTION.BATCH_SIZE,
            Math.floor(maxRequestsPerInterval),
            totalSymbols
        );
    },

    // Get market session type
    getMarketSession() {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', {
            timeZone: MARKET_CONFIG.MARKET_HOURS.TIMEZONE,
            hour12: false
        });
        
        if (currentTime < MARKET_CONFIG.MARKET_HOURS.MARKET_OPEN) {
            return 'PRE_MARKET';
        } else if (currentTime <= MARKET_CONFIG.MARKET_HOURS.MARKET_CLOSE) {
            return 'MARKET_HOURS';
        } else if (currentTime <= MARKET_CONFIG.MARKET_HOURS.POST_MARKET_END) {
            return 'POST_MARKET';
        } else {
            return 'CLOSED';
        }
    }
};

module.exports = {
    MARKET_CONFIG,
    MARKET_UTILS
};