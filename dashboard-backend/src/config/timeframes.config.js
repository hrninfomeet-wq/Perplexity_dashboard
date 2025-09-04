// dashboard-backend/src/config/timeframes.config.js
/**
 * Enhanced Timeframe Configuration for Scalping Optimization - Phase 3A Step 4
 * Extended timeframes: 1m, 3m, 5m, 15m, 1h, 1d for comprehensive analysis
 */

const TIMEFRAME_CONFIG = {
    // Enhanced timeframe support for scalping
    SUPPORTED_TIMEFRAMES: {
        '1m': { 
            minutes: 1, 
            scalping: true, 
            priority: 'high',
            description: 'Ultra-fast scalping timeframe'
        },
        '3m': { 
            minutes: 3, 
            scalping: true, 
            priority: 'high',
            description: 'Quick scalping confirmation'
        },
        '5m': { 
            minutes: 5, 
            scalping: true, 
            priority: 'high',
            description: 'Primary scalping timeframe'
        },
        '15m': { 
            minutes: 15, 
            scalping: true, 
            priority: 'medium',
            description: 'Short-term trend confirmation'
        },
        '1h': { 
            minutes: 60, 
            scalping: false, 
            priority: 'medium',
            description: 'Medium-term analysis'
        },
        '1d': { 
            minutes: 1440, 
            scalping: false, 
            priority: 'low',
            description: 'Long-term trend analysis'
        }
    },

    // Scalping-focused timeframes for ultra-fast trading
    SCALPING_TIMEFRAMES: ['1m', '3m', '5m'],
    
    // All enhanced timeframes
    ALL_TIMEFRAMES: ['1m', '3m', '5m', '15m', '1h', '1d'],
    
    // Multi-timeframe confluence combinations for enhanced accuracy
    CONFLUENCE_COMBINATIONS: {
        scalping: ['1m', '3m', '5m'],           // Ultra-fast scalping
        day_trading: ['5m', '15m', '1h'],       // Intraday trading
        swing_trading: ['1h', '4h', '1d'],      // Multi-day positions
        trend_following: ['15m', '1h', '1d']    // Trend confirmation
    },

    // Update intervals for periodic calculations
    UPDATE_INTERVALS: {
        '1m': 60 * 1000,           // 1 minute
        '3m': 3 * 60 * 1000,       // 3 minutes  
        '5m': 5 * 60 * 1000,       // 5 minutes
        '15m': 15 * 60 * 1000,     // 15 minutes
        '1h': 60 * 60 * 1000,      // 1 hour
        '1d': 24 * 60 * 60 * 1000  // 1 day
    },

    // Performance settings for high-frequency processing
    PERFORMANCE: {
        MAX_PARALLEL_CALCULATIONS: 6,    // Increased for more timeframes
        BATCH_SIZE: 25,                  // Optimized batch size
        SCALPING_BATCH_SIZE: 50,         // Larger batches for scalping timeframes
        
        // Cache duration for each timeframe (in milliseconds)
        CACHE_DURATION: {
            '1m': 2 * 60 * 1000,        // 2 minutes cache
            '3m': 5 * 60 * 1000,        // 5 minutes cache  
            '5m': 10 * 60 * 1000,       // 10 minutes cache
            '15m': 30 * 60 * 1000,      // 30 minutes cache
            '1h': 60 * 60 * 1000,       // 1 hour cache
            '1d': 4 * 60 * 60 * 1000    // 4 hours cache
        },
        
        // Processing priorities (higher number = higher priority)
        PROCESSING_PRIORITY: {
            '1m': 10,    // Highest priority for ultra-fast scalping
            '3m': 9,     // Very high priority
            '5m': 8,     // High priority
            '15m': 6,    // Medium-high priority
            '1h': 4,     // Medium priority
            '1d': 2      // Low priority
        }
    },

    // Scalping-specific configuration
    SCALPING: {
        // Enhanced signal generation for scalping
        SIGNAL_SENSITIVITY: {
            '1m': 0.8,     // High sensitivity for 1-minute signals
            '3m': 0.7,     // Medium-high sensitivity
            '5m': 0.6,     // Medium sensitivity
            '15m': 0.5     // Standard sensitivity
        },
        
        // Confluence requirements for scalping signals
        CONFLUENCE_REQUIREMENTS: {
            minimum_timeframes: 2,        // At least 2 timeframes must agree
            scalping_weight: 0.7,         // Weight for scalping timeframes
            confirmation_weight: 0.3      // Weight for confirmation timeframes
        },
        
        // Risk management for ultra-fast trading
        RISK_MANAGEMENT: {
            max_position_hold_time: 5,    // Maximum 5 minutes for scalping
            stop_loss_pips: 5,            // Tight 5-pip stop loss
            take_profit_pips: 10,         // Quick 10-pip profit target
            risk_reward_ratio: 2.0        // Minimum 1:2 risk-reward
        }
    },

    // Market session timing for optimal scalping
    MARKET_SESSIONS: {
        PRE_MARKET: {
            start: '09:00',
            end: '09:15',
            scalping: false,              // Low liquidity, avoid scalping
            description: 'Pre-market session'
        },
        OPENING: {
            start: '09:15',
            end: '10:00', 
            scalping: true,               // High volatility, good for scalping
            description: 'Market opening volatility'
        },
        MID_SESSION: {
            start: '10:00',
            end: '14:30',
            scalping: true,               // Steady liquidity
            description: 'Mid-session trading'
        },
        CLOSING: {
            start: '14:30',
            end: '15:30',
            scalping: true,               // End-of-day volatility
            description: 'Market closing volatility'
        },
        POST_MARKET: {
            start: '15:30',
            end: '16:00',
            scalping: false,              // Lower liquidity
            description: 'Post-market session'
        }
    },

    // Symbol categories for scalping suitability
    SYMBOL_CATEGORIES: {
        SCALPING_SUITABLE: {
            description: 'High liquidity symbols ideal for scalping',
            criteria: {
                min_volume: 1000000,       // Minimum daily volume
                max_spread: 0.05,          // Maximum spread percentage
                min_price: 50,             // Minimum price for meaningful pip movement
                volatility_range: [0.5, 3.0] // Optimal volatility range
            },
            examples: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK']
        },
        TRENDING: {
            description: 'Strong trending symbols for momentum scalping',
            criteria: {
                trend_strength: 0.7,       // Strong trend requirement
                momentum_score: 0.6,       // Good momentum
                breakout_frequency: 0.3    // Regular breakout patterns
            }
        },
        RANGE_BOUND: {
            description: 'Range-bound symbols for reversal scalping',
            criteria: {
                range_efficiency: 0.8,     // Clear range boundaries
                bounce_reliability: 0.7,   // Reliable support/resistance
                false_breakout_rate: 0.3   // Low false breakout rate
            }
        }
    },

    // Data validation for enhanced timeframes
    DATA_VALIDATION: {
        MIN_DATA_POINTS: {
            '1m': 100,    // Minimum 100 1-minute candles
            '3m': 80,     // Minimum 80 3-minute candles
            '5m': 60,     // Minimum 60 5-minute candles
            '15m': 40,    // Minimum 40 15-minute candles
            '1h': 24,     // Minimum 24 hourly candles
            '1d': 20      // Minimum 20 daily candles
        },
        
        QUALITY_THRESHOLDS: {
            completeness: 0.95,           // 95% data completeness required
            timeliness: 30,               // Data must be within 30 seconds
            accuracy: 0.99                // 99% accuracy requirement
        },
        
        OUTLIER_DETECTION: {
            price_change_limit: 0.10,     // 10% maximum price change per candle
            volume_spike_limit: 5.0,      // 5x volume spike detection
            gap_limit: 0.03               // 3% maximum gap between candles
        }
    }
};

// Utility functions for timeframe operations
const TimeframeUtils = {
    /**
     * Check if a timeframe is suitable for scalping
     */
    isScalpingTimeframe(timeframe) {
        return TIMEFRAME_CONFIG.SCALPING_TIMEFRAMES.includes(timeframe);
    },
    
    /**
     * Get update interval for a timeframe
     */
    getUpdateInterval(timeframe) {
        return TIMEFRAME_CONFIG.UPDATE_INTERVALS[timeframe] || 5 * 60 * 1000;
    },
    
    /**
     * Get processing priority for a timeframe
     */
    getProcessingPriority(timeframe) {
        return TIMEFRAME_CONFIG.PERFORMANCE.PROCESSING_PRIORITY[timeframe] || 1;
    },
    
    /**
     * Get confluence timeframes for a strategy
     */
    getConfluenceTimeframes(strategy = 'scalping') {
        return TIMEFRAME_CONFIG.CONFLUENCE_COMBINATIONS[strategy] || 
               TIMEFRAME_CONFIG.CONFLUENCE_COMBINATIONS.scalping;
    },
    
    /**
     * Validate timeframe support
     */
    validateTimeframe(timeframe) {
        return TIMEFRAME_CONFIG.ALL_TIMEFRAMES.includes(timeframe);
    },
    
    /**
     * Get minimum data points required for timeframe
     */
    getMinDataPoints(timeframe) {
        return TIMEFRAME_CONFIG.DATA_VALIDATION.MIN_DATA_POINTS[timeframe] || 50;
    },
    
    /**
     * Check if current time is suitable for scalping
     */
    isScalpingTime() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const sessions = TIMEFRAME_CONFIG.MARKET_SESSIONS;
        for (const [sessionName, session] of Object.entries(sessions)) {
            if (currentTime >= session.start && currentTime <= session.end) {
                return session.scalping;
            }
        }
        return false; // Outside market hours
    }
};

module.exports = {
    TIMEFRAME_CONFIG,
    TimeframeUtils
};
