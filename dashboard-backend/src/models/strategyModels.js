/**
 * Strategy Models - Phase 3A Step 7
 * Database models for trading strategies system
 */

const mongoose = require('mongoose');

// Strategy Configuration Schema
const strategyConfigSchema = new mongoose.Schema({
    strategyId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['scalping', 'swing', 'btst', 'options', 'fo_arbitrage'],
        required: true 
    },
    version: { type: String, default: '1.0' },
    
    // Basic configuration
    timeframes: [String],
    symbols: [String],
    active: { type: Boolean, default: true },
    
    // Strategy parameters
    parameters: {
        // Risk parameters
        maxPositionSize: { type: Number, default: 0.05 },
        stopLossPercent: Number,
        takeProfitPercent: Number,
        maxDrawdown: Number,
        riskRewardRatio: Number,
        
        // Technical parameters
        rsiOverbought: { type: Number, default: 70 },
        rsiOversold: { type: Number, default: 30 },
        macdThreshold: Number,
        volumeThreshold: Number,
        
        // Pattern parameters
        patternConfidence: { type: Number, default: 0.6 },
        requiredPatterns: [String],
        
        // ML parameters
        mlConfidenceThreshold: { type: Number, default: 0.6 },
        useMLEnhancement: { type: Boolean, default: true }
    },
    
    // Signal weights
    signalWeights: {
        technical: { type: Number, default: 0.25 },
        pattern: { type: Number, default: 0.25 },
        ml: { type: Number, default: 0.30 },
        volume: { type: Number, default: 0.15 },
        momentum: { type: Number, default: 0.05 }
    },
    
    // Performance requirements
    performanceThresholds: {
        minWinRate: { type: Number, default: 0.6 },
        minSharpeRatio: { type: Number, default: 1.0 },
        maxDrawdown: { type: Number, default: 0.1 }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Strategy Execution Schema
const strategyExecutionSchema = new mongoose.Schema({
    executionId: { type: String, unique: true, required: true },
    strategyId: { type: String, required: true, index: true },
    strategyName: { type: String, required: true },
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true },
    
    // Signal generation
    signal: {
        direction: { type: String, enum: ['buy', 'sell'], required: true },
        strength: { type: Number, required: true }, // 0-100
        confidence: { type: Number, required: true }, // 0-1
        
        // Entry/exit prices
        entryPrice: { type: Number, required: true },
        stopLoss: Number,
        takeProfit: Number,
        
        // Position sizing
        positionSize: {
            amount: Number,
            percentage: Number,
            kellyFraction: Number,
            reasoning: String
        }
    },
    
    // Strategy components analysis
    components: {
        technical: {
            score: Number,
            signals: [String],
            strength: Number
        },
        pattern: {
            score: Number,
            patterns: [{
                type: String,
                signal: String,
                confidence: Number
            }],
            strength: Number
        },
        volume: {
            score: Number,
            conditions: [String],
            strength: Number
        },
        ml: {
            ensembleScore: Number,
            confidence: Number,
            overallSignal: String,
            pricePrediction: mongoose.Schema.Types.Mixed
        },
        momentum: {
            score: Number,
            conditions: [String],
            strength: Number
        }
    },
    
    // Risk assessment
    riskMetrics: {
        volatility: Number,
        volatilityRisk: String,
        liquidityRisk: String,
        marketRisk: String,
        overallRisk: String,
        positionVaR: Number
    },
    
    // Market context
    marketConditions: {
        currentPrice: Number,
        priceChange24h: Number,
        volume24h: Number,
        marketTrend: String,
        sectorPerformance: Number
    },
    
    // Execution performance
    performance: {
        processingTime: Number,
        mlProcessingTime: Number,
        riskProcessingTime: Number,
        
        // Actual execution results
        actualEntry: {
            price: Number,
            timestamp: Date,
            slippage: Number
        },
        actualExit: {
            price: Number,
            timestamp: Date,
            reason: String,
            slippage: Number
        },
        
        // Trade results
        actualReturn: Number,
        actualReturnPercent: Number,
        holdingPeriodActual: Number,
        commission: Number,
        netProfit: Number
    },
    
    // Status tracking
    status: { 
        type: String, 
        enum: ['generated', 'executed', 'monitoring', 'closed', 'cancelled'],
        default: 'generated'
    },
    
    timestamp: { type: Date, default: Date.now, index: true },
    expiresAt: Date
});

// Strategy Performance Schema
const strategyPerformanceSchema = new mongoose.Schema({
    performanceId: { type: String, unique: true, required: true },
    strategyName: { type: String, required: true, index: true },
    symbol: { type: String, index: true },
    timeframe: { type: String, index: true },
    
    // Time period
    period: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        duration: String,
        tradingDays: Number
    },
    
    // Trade statistics
    tradeStats: {
        totalTrades: { type: Number, default: 0 },
        winningTrades: { type: Number, default: 0 },
        losingTrades: { type: Number, default: 0 },
        breakEvenTrades: { type: Number, default: 0 },
        
        // Win/Loss analysis
        winRate: Number,
        lossRate: Number,
        averageWin: Number,
        averageLoss: Number,
        largestWin: Number,
        largestLoss: Number,
        
        // Consecutive analysis
        maxConsecutiveWins: Number,
        maxConsecutiveLosses: Number,
        currentStreak: {
            type: String,
            count: Number
        }
    },
    
    // Return analysis
    returnAnalysis: {
        totalReturn: Number,
        totalReturnPercent: Number,
        averageReturn: Number,
        averageReturnPercent: Number,
        
        // Annualized metrics
        annualizedReturn: Number,
        monthlyReturn: Number,
        weeklyReturn: Number,
        dailyReturn: Number,
        
        // Volatility metrics
        returnVolatility: Number,
        sharpeRatio: Number,
        sortinoRatio: Number,
        calmarRatio: Number
    },
    
    // Risk metrics
    riskMetrics: {
        maxDrawdown: Number,
        maxDrawdownPercent: Number,
        maxDrawdownDuration: Number,
        currentDrawdown: Number,
        
        // Value at Risk
        dailyVaR95: Number,
        dailyVaR99: Number,
        monthlyVaR95: Number,
        
        // Risk-adjusted returns
        riskAdjustedReturn: Number,
        informationRatio: Number,
        treynorRatio: Number
    },
    
    // ML enhancement performance
    mlPerformance: {
        mlEnhancedTrades: { type: Number, default: 0 },
        mlWinningTrades: { type: Number, default: 0 },
        mlWinRate: Number,
        mlVsBaselineImprovement: Number,
        
        // Confidence analysis
        averageMLConfidence: Number,
        highConfidenceTrades: Number,
        highConfidenceWinRate: Number,
        
        // ML accuracy tracking
        mlPredictionAccuracy: Number,
        mlSignalAccuracy: Number
    },
    
    timestamp: { type: Date, default: Date.now, index: true }
});

// Trading Opportunities Schema
const tradingOpportunitySchema = new mongoose.Schema({
    opportunityId: { type: String, unique: true, required: true },
    detectionStrategy: { type: String, required: true },
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true },
    
    // Opportunity details
    opportunity: {
        signal: { type: String, enum: ['buy', 'sell'], required: true },
        probability: { type: Number, required: true },
        expectedReturn: Number,
        confidence: Number,
        
        // Risk assessment
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
        riskRewardRatio: Number,
        maxLoss: Number,
        
        // Timing
        entryPrice: Number,
        entryWindow: Number,
        holdingPeriod: Number,
        expiryTime: Date
    },
    
    // Supporting analysis
    analysis: {
        technicalSupport: [{
            indicator: String,
            signal: String,
            strength: Number
        }],
        
        patternSupport: [{
            pattern: String,
            confidence: Number,
            timeframe: String
        }],
        
        mlSupport: {
            ensembleSignal: String,
            confidence: Number,
            pricePrediction: {
                direction: String,
                targetPrice: Number,
                confidence: Number
            }
        },
        
        volumeAnalysis: {
            volumeRatio: Number,
            volumeTrend: String,
            liquidityScore: Number
        }
    },
    
    // Market context
    marketContext: {
        currentPrice: Number,
        priceChange: Number,
        volume: Number,
        marketTrend: String,
        volatility: Number,
        
        // Sector/market conditions
        sectorPerformance: Number,
        marketSentiment: String,
        newsImpact: String
    },
    
    // Execution tracking
    execution: {
        recommended: Boolean,
        executed: Boolean,
        executionTime: Date,
        executionPrice: Number,
        slippage: Number,
        
        // Results
        actualReturn: Number,
        actualHoldingPeriod: Number,
        exitReason: String,
        success: Boolean
    },
    
    // Status and priority
    status: { 
        type: String, 
        enum: ['active', 'expired', 'executed', 'cancelled'],
        default: 'active'
    },
    priority: { type: Number, default: 50 },
    
    detectedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true }
});

// Indexes for performance
strategyExecutionSchema.index({ strategyId: 1, timestamp: -1 });
strategyExecutionSchema.index({ symbol: 1, timeframe: 1 });
strategyPerformanceSchema.index({ strategyName: 1, 'period.startDate': -1 });
tradingOpportunitySchema.index({ detectionStrategy: 1, detectedAt: -1 });
tradingOpportunitySchema.index({ symbol: 1, status: 1 });

// Models
const StrategyConfig = mongoose.model('StrategyConfig', strategyConfigSchema);
const StrategyExecution = mongoose.model('StrategyExecution', strategyExecutionSchema);
const StrategyPerformance = mongoose.model('StrategyPerformance', strategyPerformanceSchema);
const TradingOpportunity = mongoose.model('TradingOpportunity', tradingOpportunitySchema);

module.exports = {
    StrategyConfig,
    StrategyExecution,
    StrategyPerformance,
    TradingOpportunity
};
