// dashboard-backend/src/models/technicalIndicatorsModel.js

/**
 * Technical Indicators Data Model - Phase 3A Step 3
 * MongoDB schemas for storing and managing technical indicator calculations
 * 
 * @version 3A.3.0
 * @created September 04, 2025 
 * @phase Phase 3A - Live Market Data Intelligence - Step 3
 */

const mongoose = require('mongoose');

/**
 * Technical Indicator Result Schema
 * Stores calculated indicator values with metadata
 */
const TechnicalIndicatorSchema = new mongoose.Schema({
    // Symbol identification
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },
    
    // Indicator metadata
    indicator: {
        type: String,
        required: true,
        enum: [
            'SMA', 'EMA', 'RSI', 'MACD', 'BOLLINGER_BANDS',
            'STOCHASTIC', 'ADX', 'CCI', 'WILLIAMS_R', 'ROC',
            'MFI', 'OBV', 'VWAP', 'PIVOT_POINTS', 'ICHIMOKU'
        ],
        index: true
    },
    
    // Time identification
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    
    timeframe: {
        type: String,
        required: true,
        enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
        default: '5m'
    },
    
    // Indicator parameters
    parameters: {
        period: { type: Number },
        fastPeriod: { type: Number },
        slowPeriod: { type: Number },
        signalPeriod: { type: Number },
        standardDeviations: { type: Number },
        kPeriod: { type: Number },
        dPeriod: { type: Number },
        smooth: { type: Number }
    },
    
    // Calculated values (flexible structure for different indicators)
    values: {
        // Single value indicators (RSI, ADX, CCI, etc.)
        value: { type: Number },
        
        // Multi-value indicators
        upperBand: { type: Number },
        middleBand: { type: Number }, 
        lowerBand: { type: Number },
        
        // MACD specific
        macd: { type: Number },
        signal: { type: Number },
        histogram: { type: Number },
        
        // Stochastic specific
        percentK: { type: Number },
        percentD: { type: Number },
        
        // Ichimoku specific
        tenkanSen: { type: Number },
        kijunSen: { type: Number },
        senkouSpanA: { type: Number },
        senkouSpanB: { type: Number },
        chikouSpan: { type: Number },
        
        // Pivot Points
        pivot: { type: Number },
        r1: { type: Number },
        r2: { type: Number },
        r3: { type: Number },
        s1: { type: Number },
        s2: { type: Number },
        s3: { type: Number }
    },
    
    // Signal information
    signal: {
        type: String,
        enum: ['BUY', 'SELL', 'HOLD', 'NEUTRAL'],
        default: 'NEUTRAL'
    },
    
    strength: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    
    // Calculation metadata
    calculationSource: {
        type: String,
        default: 'real_time',
        enum: ['real_time', 'historical', 'backfill']
    },
    
    dataQuality: {
        completeness: { type: Number, min: 0, max: 100 },
        accuracy: { type: Number, min: 0, max: 100 },
        latency: { type: Number } // milliseconds
    },
    
    // Performance tracking
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    // Schema options
    timestamps: true,
    collection: 'technical_indicators'
});

// Compound indexes for efficient queries
TechnicalIndicatorSchema.index({ symbol: 1, indicator: 1, timeframe: 1, timestamp: -1 });
TechnicalIndicatorSchema.index({ timestamp: -1, symbol: 1 });
TechnicalIndicatorSchema.index({ signal: 1, strength: -1, timestamp: -1 });

// TTL index - keep indicators for 30 days
TechnicalIndicatorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

/**
 * Indicator Alert Schema
 * Stores alert conditions and triggers for technical indicators
 */
const IndicatorAlertSchema = new mongoose.Schema({
    // Alert identification
    alertId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Target details
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },
    
    indicator: {
        type: String,
        required: true,
        enum: [
            'SMA', 'EMA', 'RSI', 'MACD', 'BOLLINGER_BANDS',
            'STOCHASTIC', 'ADX', 'CCI', 'WILLIAMS_R', 'ROC',
            'MFI', 'OBV', 'VWAP', 'PIVOT_POINTS', 'ICHIMOKU'
        ]
    },
    
    timeframe: {
        type: String,
        required: true,
        enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
    },
    
    // Alert conditions
    condition: {
        type: String,
        required: true,
        enum: [
            'CROSSES_ABOVE', 'CROSSES_BELOW', 'GREATER_THAN', 'LESS_THAN',
            'EQUALS', 'BETWEEN', 'DIVERGENCE', 'CONVERGENCE', 'SIGNAL_CHANGE'
        ]
    },
    
    threshold: {
        value: { type: Number },
        upperBound: { type: Number },
        lowerBound: { type: Number }
    },
    
    // Alert status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    lastTriggered: {
        type: Date,
        index: true
    },
    
    triggerCount: {
        type: Number,
        default: 0
    },
    
    // User preferences
    userId: {
        type: String,
        index: true
    },
    
    notificationMethods: [{
        type: String,
        enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK']
    }],
    
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    
    // Metadata
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'indicator_alerts'
});

// Compound indexes for alert management
IndicatorAlertSchema.index({ symbol: 1, indicator: 1, isActive: 1 });
IndicatorAlertSchema.index({ userId: 1, isActive: 1, priority: -1 });

/**
 * Indicator Performance Tracking Schema
 * Tracks accuracy and performance of indicator signals
 */
const IndicatorPerformanceSchema = new mongoose.Schema({
    // Performance identification
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },
    
    indicator: {
        type: String,
        required: true,
        index: true
    },
    
    timeframe: {
        type: String,
        required: true,
        enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
    },
    
    // Performance period
    periodStart: {
        type: Date,
        required: true,
        index: true
    },
    
    periodEnd: {
        type: Date,
        required: true,
        index: true
    },
    
    // Performance metrics
    totalSignals: {
        type: Number,
        default: 0
    },
    
    correctSignals: {
        type: Number,
        default: 0
    },
    
    accuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    
    avgReturnPerSignal: {
        type: Number,
        default: 0
    },
    
    maxDrawdown: {
        type: Number,
        default: 0
    },
    
    sharpeRatio: {
        type: Number,
        default: 0
    },
    
    // Signal breakdown
    signalBreakdown: {
        buySignals: { type: Number, default: 0 },
        sellSignals: { type: Number, default: 0 },
        holdSignals: { type: Number, default: 0 },
        buyAccuracy: { type: Number, default: 0 },
        sellAccuracy: { type: Number, default: 0 }
    },
    
    // Performance ranking
    rank: {
        type: Number,
        index: true
    },
    
    // Metadata
    calculatedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'indicator_performance'
});

// Compound indexes for performance analysis
IndicatorPerformanceSchema.index({ indicator: 1, accuracy: -1, calculatedAt: -1 });
IndicatorPerformanceSchema.index({ symbol: 1, timeframe: 1, periodEnd: -1 });

// Create models
const TechnicalIndicator = mongoose.model('TechnicalIndicator', TechnicalIndicatorSchema);
const IndicatorAlert = mongoose.model('IndicatorAlert', IndicatorAlertSchema);
const IndicatorPerformance = mongoose.model('IndicatorPerformance', IndicatorPerformanceSchema);

module.exports = {
    TechnicalIndicator,
    IndicatorAlert,
    IndicatorPerformance
};
