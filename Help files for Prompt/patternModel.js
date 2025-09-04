// dashboard-backend/src/models/patternModel.js
/**
 * Pattern Recognition Database Models - Phase 3A Step 4
 * Enhanced models for pattern storage with scalping optimization
 */

const mongoose = require('mongoose');

// Main Pattern Analysis Schema
const patternSchema = new mongoose.Schema({
    symbol: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    
    // Multi-timeframe pattern data
    timeframes: {
        '1m': {
            candlesticks: [{ 
                type: String, 
                signal: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
                confidence: { type: Number, min: 0, max: 1 },
                index: Number,
                candle: mongoose.Schema.Types.Mixed
            }],
            chartPatterns: [{ 
                type: String, 
                signal: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
                confidence: { type: Number, min: 0, max: 1 },
                breakoutLevel: Number,
                targetPrice: Number
            }],
            smartMoney: [{ 
                type: String, 
                signal: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
                confidence: { type: Number, min: 0, max: 1 },
                orderBlockPrice: Number,
                liquidityLevel: Number
            }],
            volume: [{ 
                type: String, 
                signal: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
                confidence: { type: Number, min: 0, max: 1 },
                volumeRatio: Number,
                priceChange: Number
            }]
        },
        '3m': { type: mongoose.Schema.Types.Mixed },
        '5m': { type: mongoose.Schema.Types.Mixed },
        '15m': { type: mongoose.Schema.Types.Mixed },
        '1h': { type: mongoose.Schema.Types.Mixed },
        '1d': { type: mongoose.Schema.Types.Mixed }
    },
    
    // Confluence analysis
    confluence: {
        bullishSignals: { type: Number, default: 0 },
        bearishSignals: { type: Number, default: 0 },
        neutralSignals: { type: Number, default: 0 },
        timeframeAgreement: { type: Number, min: 0, max: 1 },
        strongestTimeframe: String,
        conflictingSignals: { type: Boolean, default: false },
        confluenceStrength: { 
            type: String, 
            enum: ['weak', 'medium', 'strong'],
            default: 'weak'
        }
    },
    
    // Overall analysis
    overallSignal: {
        direction: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
        strength: { type: Number, min: 0, max: 1 },
        recommendedAction: { type: String, enum: ['buy', 'sell', 'hold', 'wait'] },
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] }
    },
    
    confidenceScore: { type: Number, min: 0, max: 1 },
    
    // Performance tracking
    processingTime: { type: Number }, // Processing time in milliseconds
    dataQuality: { type: Number, min: 0, max: 1, default: 1 }
});

// Scalping Signals Schema (optimized for high-frequency access)
const scalpingSignalSchema = new mongoose.Schema({
    symbol: { type: String, required: true, index: true },
    timeframe: { 
        type: String, 
        required: true, 
        enum: ['1m', '3m', '5m'],
        index: true 
    },
    timestamp: { type: Date, required: true, index: true },
    
    // Entry signals
    entrySignals: [{
        type: { 
            type: String, 
            enum: ['candlestick_entry', 'chart_pattern_entry', 'smart_money_entry', 'volume_entry']
        },
        pattern: String,
        direction: { type: String, enum: ['bullish', 'bearish'] },
        confidence: { type: Number, min: 0, max: 1 },
        entryPrice: Number,
        stopLoss: Number,
        takeProfit: Number,
        riskRewardRatio: Number
    }],
    
    // Exit signals
    exitSignals: [{
        type: { 
            type: String, 
            enum: ['profit_target', 'stop_loss', 'trailing_stop', 'pattern_exit']
        },
        exitPrice: Number,
        confidence: { type: Number, min: 0, max: 1 },
        reason: String
    }],
    
    // Scalping-specific metrics
    confluenceScore: { type: Number, min: 0, max: 1 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    expectedProfitTarget: { type: Number },
    maxDrawdown: { type: Number },
    timeToTarget: { type: Number }, // Expected time to reach profit target (minutes)
    
    // Performance tracking
    isActive: { type: Boolean, default: true },
    executionStatus: {
        type: String,
        enum: ['pending', 'executed', 'profit', 'loss', 'expired'],
        default: 'pending'
    },
    actualResult: {
        entryPrice: Number,
        exitPrice: Number,
        profit: Number,
        profitPercent: Number,
        executionTime: Date
    }
});

// Pattern Performance Tracking Schema
const patternPerformanceSchema = new mongoose.Schema({
    patternType: { type: String, required: true, index: true },
    timeframe: { type: String, required: true, index: true },
    
    // Performance statistics
    totalSignals: { type: Number, default: 0 },
    successfulSignals: { type: Number, default: 0 },
    failedSignals: { type: Number, default: 0 },
    
    successRate: { type: Number, min: 0, max: 1 },
    averageProfit: { type: Number },
    averageLoss: { type: Number },
    profitFactor: { type: Number },
    
    // Risk metrics
    maxDrawdown: { type: Number },
    sharpeRatio: { type: Number },
    
    // Time-based analysis
    lastUpdated: { type: Date, default: Date.now },
    performancePeriod: { type: String, enum: ['1d', '7d', '30d'], default: '7d' }
});

// Confluence Analysis Schema
const confluenceAnalysisSchema = new mongoose.Schema({
    symbol: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    
    // Timeframe analysis
    timeframeData: {
        '1m': {
            signal: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
            strength: { type: Number, min: 0, max: 1 },
            patternCount: Number,
            dominantPattern: String
        },
        '3m': { type: mongoose.Schema.Types.Mixed },
        '5m': { type: mongoose.Schema.Types.Mixed },
        '15m': { type: mongoose.Schema.Types.Mixed },
        '1h': { type: mongoose.Schema.Types.Mixed },
        '1d': { type: mongoose.Schema.Types.Mixed }
    },
    
    // Confluence metrics
    overallConfluence: {
        direction: { type: String, enum: ['bullish', 'bearish', 'neutral', 'mixed'] },
        strength: { type: Number, min: 0, max: 1 },
        agreementPercentage: { type: Number, min: 0, max: 1 },
        conflictingTimeframes: [String],
        dominantTimeframes: [String]
    },
    
    // Scalping-specific confluence
    scalpingConfluence: {
        shortTermAlignment: { type: Number, min: 0, max: 1 }, // 1m, 3m, 5m alignment
        mediumTermSupport: { type: Number, min: 0, max: 1 }, // 15m, 1h alignment
        overallScore: { type: Number, min: 0, max: 1 }
    }
});

// Market Scanning Results Schema
const marketScanResultSchema = new mongoose.Schema({
    scanType: { 
        type: String, 
        enum: ['scalping_scan', 'pattern_scan', 'confluence_scan'],
        required: true,
        index: true
    },
    timestamp: { type: Date, required: true, index: true },
    
    // Scan parameters
    timeframes: [String],
    symbols: [String],
    minConfidence: { type: Number, min: 0, max: 1 },
    
    // Results
    opportunities: [{
        symbol: String,
        patterns: [String],
        signals: [String],
        confidence: { type: Number, min: 0, max: 1 },
        timeframe: String,
        entryPrice: Number,
        targetPrice: Number,
        stopLoss: Number,
        riskReward: Number,
        priority: { type: String, enum: ['low', 'medium', 'high'] }
    }],
    
    // Scan statistics
    totalSymbolsScanned: Number,
    opportunitiesFound: Number,
    averageConfidence: Number,
    scanDuration: Number, // Scan time in milliseconds
    
    // Market conditions during scan
    marketCondition: {
        volatility: { type: String, enum: ['low', 'medium', 'high'] },
        trend: { type: String, enum: ['uptrend', 'downtrend', 'sideways'] },
        volume: { type: String, enum: ['low', 'normal', 'high'] }
    }
});

// Indexes for performance optimization
patternSchema.index({ symbol: 1, timestamp: -1 });
patternSchema.index({ 'confluence.confluenceStrength': 1, timestamp: -1 });
patternSchema.index({ confidenceScore: -1, timestamp: -1 });

scalpingSignalSchema.index({ symbol: 1, timeframe: 1, timestamp: -1 });
scalpingSignalSchema.index({ confluenceScore: -1, timestamp: -1 });
scalpingSignalSchema.index({ isActive: 1, executionStatus: 1 });

patternPerformanceSchema.index({ patternType: 1, timeframe: 1 });
patternPerformanceSchema.index({ successRate: -1, lastUpdated: -1 });

confluenceAnalysisSchema.index({ symbol: 1, timestamp: -1 });
confluenceAnalysisSchema.index({ 'overallConfluence.strength': -1 });

marketScanResultSchema.index({ scanType: 1, timestamp: -1 });
marketScanResultSchema.index({ 'opportunities.confidence': -1 });

// TTL (Time To Live) indexes for automatic cleanup
patternSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days
scalpingSignalSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days
confluenceAnalysisSchema.index({ timestamp: 1 }, { expireAfterSeconds: 15 * 24 * 60 * 60 }); // 15 days
marketScanResultSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days

// Export models
const Pattern = mongoose.model('Pattern', patternSchema);
const ScalpingSignal = mongoose.model('ScalpingSignal', scalpingSignalSchema);
const PatternPerformance = mongoose.model('PatternPerformance', patternPerformanceSchema);
const ConfluenceAnalysis = mongoose.model('ConfluenceAnalysis', confluenceAnalysisSchema);
const MarketScanResult = mongoose.model('MarketScanResult', marketScanResultSchema);

module.exports = {
    Pattern,
    ScalpingSignal,
    PatternPerformance,
    ConfluenceAnalysis,
    MarketScanResult
};