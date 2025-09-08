// dashboard-backend/src/config/live.config.js
/**
 * Live Trading Configuration - Phase 3A Step 8
 * Complete configuration for paper trading, execution simulation, and risk management
 */

const LIVE_CONFIG = {
    // Paper Trading Settings
    PAPER_TRADING: {
        INITIAL_CAPITAL: 100000,          // $100,000 starting capital
        CURRENCY: 'USD',
        ENABLE_COMMISSION: true,
        ENABLE_SLIPPAGE: true,
        ENABLE_MARKET_IMPACT: true,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000  // 24 hours
    },

    // Market Hours Configuration
    MARKET_HOURS: {
        NSE: {
            TIMEZONE: 'Asia/Kolkata',
            TRADING_HOURS: {
                START: '09:15',           // 9:15 AM IST
                END: '15:30'              // 3:30 PM IST
            },
            WEEKENDS: [0, 6],            // Sunday = 0, Saturday = 6
            HOLIDAYS: []                 // Will be populated with NSE holidays
        },
        CRYPTO: {
            ENABLED: true,
            TIMEZONE: 'UTC',
            TRADING_HOURS: '24/7'        // Always available
        }
    },

    // Risk Management Settings
    RISK_LIMITS: {
        MAX_POSITION_SIZE: 0.2,         // 20% of capital per position
        MAX_DAILY_LOSS: 0.05,           // 5% daily loss limit
        MAX_TOTAL_EXPOSURE: 0.8,        // 80% total exposure limit
        STOP_LOSS_BUFFER: 0.02,         // 2% buffer for stop-loss
        TAKE_PROFIT_RATIO: 2.0          // 2:1 risk-reward ratio
    },

    // Execution Settings
    EXECUTION: {
        SLIPPAGE: {
            CRYPTO: {
                LOW_VOLATILITY: 0.0005,   // 0.05%
                MEDIUM_VOLATILITY: 0.001, // 0.10%
                HIGH_VOLATILITY: 0.002    // 0.20%
            },
            NSE: {
                LOW_VOLATILITY: 0.0002,   // 0.02%
                MEDIUM_VOLATILITY: 0.0005,// 0.05%
                HIGH_VOLATILITY: 0.001    // 0.10%
            }
        },
        COMMISSION: {
            CRYPTO: 0.001,               // 0.1% per trade
            NSE: 0.0005                  // 0.05% per trade
        },
        MARKET_IMPACT: {
            SMALL_ORDER: 0.0001,         // 0.01%
            MEDIUM_ORDER: 0.0005,        // 0.05%
            LARGE_ORDER: 0.001           // 0.10%
        }
    },

    // Data Feed Configuration
    DATA_FEEDS: {
        CRYPTO: {
            PRIMARY: 'binance',
            BACKUP: 'coinbase',
            WEBSOCKET_TIMEOUT: 30000,    // 30 seconds
            RECONNECT_ATTEMPTS: 5,
            SYMBOLS: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT']
        },
        NSE: {
            PRIMARY: 'flattrade',
            BACKUP: 'upstox',
            UPDATE_INTERVAL: 1000,       // 1 second
            SYMBOLS: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR']
        }
    },

    // Performance Tracking
    PERFORMANCE: {
        UPDATE_INTERVAL: 5000,           // 5 seconds
        METRICS_CALCULATION: 60000,      // 1 minute
        HISTORY_RETENTION: 30,           // 30 days
        BENCHMARK_SYMBOL: 'NIFTY50'
    },

    // Alert Configuration
    ALERTS: {
        PROFIT_THRESHOLD: 0.05,          // 5% profit alert
        LOSS_THRESHOLD: 0.03,            // 3% loss alert
        UNUSUAL_VOLUME: 2.0,             // 2x average volume
        PRICE_MOVEMENT: 0.02             // 2% price movement
    },

    // Database Settings
    DATABASE: {
        BATCH_SIZE: 100,
        RETENTION_DAYS: 90,
        PERFORMANCE_CACHE: true
    },

    // WebSocket Configuration
    WEBSOCKET: {
        PORT: 8080,
        HEARTBEAT_INTERVAL: 30000,       // 30 seconds
        MAX_CONNECTIONS: 100,
        BUFFER_SIZE: 1000
    },

    // Strategy Integration
    STRATEGIES: {
        ENABLED: ['scalping', 'swing', 'btst', 'options', 'fo_arbitrage'],
        MAX_CONCURRENT: 5,
        SIGNAL_TIMEOUT: 10000,           // 10 seconds
        CONFIDENCE_THRESHOLD: 0.6        // 60% minimum confidence
    }
};

module.exports = { LIVE_CONFIG };
