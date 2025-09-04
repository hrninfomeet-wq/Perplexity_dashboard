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
        // Minimum confidence thresholds for scalping signals
        MIN_CONFIDENCE: {
            '1m': 0.6,   // 60% minimum for 1m signals
            '3m': 0.65,  // 65% minimum for 3m signals
            '5m': 0.7    // 70% minimum for 5m signals
        },
        
        // Maximum signal age before considered stale (in milliseconds)
        MAX_SIGNAL_AGE: {
            '1m': 2 * 60 * 1000,    // 2 minutes
            '3m': 5 * 60 * 1000,    // 5 minutes
            '5m': 10 * 60 * 1000    // 10 minutes
        },
        
        // Expected profit targets for scalping (in percentage)
        PROFIT_TARGETS: {
            '1m': 0.3,   // 0.3% target for 1m trades
            '3m': 0.5,   // 0.5% target for 3m trades
            '5m': 0.8    // 0.8% target for 5m trades
        },
        
        // Risk management for scalping
        RISK_MANAGEMENT: {
            MAX_STOP_LOSS: 0.5,     // Maximum 0.5% stop loss
            MIN_RISK_REWARD: 1.5,   // Minimum 1:1.5 risk/reward ratio
            MAX_CONCURRENT_SIGNALS: 5 // Maximum concurrent scalping signals per symbol
        }
    }
};

// Timeframe utility functions
const TIMEFRAME_UTILS = {
    /**
     * Check if timeframe is scalping-focused
     */
    isScalpingTimeframe(timeframe) {
        return TIMEFRAME_CONFIG.SCALPING_TIMEFRAMES.includes(timeframe);
    },

    /**
     * Get timeframe priority (higher number = higher priority)
     */
    getTimeframePriority(timeframe) {
        return TIMEFRAME_CONFIG.PERFORMANCE.PROCESSING_PRIORITY[timeframe] || 1;
    },

    /**
     * Get optimal update interval for timeframe
     */
    getUpdateInterval(timeframe) {
        return TIMEFRAME_CONFIG.UPDATE_INTERVALS[timeframe] || 60 * 1000;
    },

    /**
     * Get cache duration for timeframe
     */
    getCacheDuration(timeframe) {
        return TIMEFRAME_CONFIG.PERFORMANCE.CACHE_DURATION[timeframe] || 60 * 1000;
    },

    /**
     * Get scalping timeframes sorted by priority
     */
    getScalpingTimeframesByPriority() {
        return TIMEFRAME_CONFIG.SCALPING_TIMEFRAMES.sort((a, b) => 
            this.getTimeframePriority(b) - this.getTimeframePriority(a)
        );
    },

    /**
     * Get all timeframes sorted by priority
     */
    getAllTimeframesByPriority() {
        return TIMEFRAME_CONFIG.ALL_TIMEFRAMES.sort((a, b) => 
            this.getTimeframePriority(b) - this.getTimeframePriority(a)
        );
    },

    /**
     * Get confluence combination for strategy
     */
    getConfluenceTimeframes(strategy = 'scalping') {
        return TIMEFRAME_CONFIG.CONFLUENCE_COMBINATIONS[strategy] || 
               TIMEFRAME_CONFIG.SCALPING_TIMEFRAMES;
    },

    /**
     * Check if signal is fresh for timeframe
     */
    isSignalFresh(signalTimestamp, timeframe) {
        const maxAge = TIMEFRAME_CONFIG.SCALPING.MAX_SIGNAL_AGE[timeframe] || 
                      TIMEFRAME_CONFIG.SCALPING.MAX_SIGNAL_AGE['5m'];
        const age = Date.now() - new Date(signalTimestamp).getTime();
        return age <= maxAge;
    },

    /**
     * Get expected profit target for timeframe
     */
    getProfitTarget(timeframe) {
        return TIMEFRAME_CONFIG.SCALPING.PROFIT_TARGETS[timeframe] || 0.5;
    },

    /**
     * Get minimum confidence for timeframe
     */
    getMinConfidence(timeframe) {
        return TIMEFRAME_CONFIG.SCALPING.MIN_CONFIDENCE[timeframe] || 0.6;
    },

    /**
     * Convert minutes to timeframe string
     */
    minutesToTimeframe(minutes) {
        if (minutes === 1) return '1m';
        if (minutes === 3) return '3m';
        if (minutes === 5) return '5m';
        if (minutes === 15) return '15m';
        if (minutes === 60) return '1h';
        if (minutes === 1440) return '1d';
        return '5m'; // default
    },

    /**
     * Convert timeframe string to minutes
     */
    timeframeToMinutes(timeframe) {
        const config = TIMEFRAME_CONFIG.SUPPORTED_TIMEFRAMES[timeframe];
        return config ? config.minutes : 5; // default to 5 minutes
    },

    /**
     * Get next higher timeframe for confluence
     */
    getNextHigherTimeframe(timeframe) {
        const timeframes = ['1m', '3m', '5m', '15m', '1h', '1d'];
        const currentIndex = timeframes.indexOf(timeframe);
        return currentIndex >= 0 && currentIndex < timeframes.length - 1 
            ? timeframes[currentIndex + 1] 
            : null;
    },

    /**
     * Get previous lower timeframe for confluence
     */
    getPreviousLowerTimeframe(timeframe) {
        const timeframes = ['1m', '3m', '5m', '15m', '1h', '1d'];
        const currentIndex = timeframes.indexOf(timeframe);
        return currentIndex > 0 
            ? timeframes[currentIndex - 1] 
            : null;
    }
};

module.exports = {
    TIMEFRAME_CONFIG,
    TIMEFRAME_UTILS
};