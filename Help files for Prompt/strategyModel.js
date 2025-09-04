// dashboard-backend/src/models/strategyModel.js
/**
 * Trading Strategy Database Models - Phase 3A Step 7
 * Enhanced models for strategy execution, performance tracking, and optimization
 */

const mongoose = require('mongoose');

// Strategy Configuration Schema
const strategyConfigSchema = new mongoose.Schema({
    strategyId: { type: String, unique: true, required: true, index: true },
    name: { 
        type: String, 
        enum: ['scalping', 'swing', 'btst', 'options', 'fo_arbitrage', 'breakout'],
        required: true,
        index: true
    },
    
    // Strategy parameters
    parameters: {
        timeframes: [String], // ['1m', '3m', '5m']
        minConfidence: { type: Number, default: 0.6 },
        maxPositionSize: { type: Number, default: 0.1 }, // 10% max position
        stopLossPercent: { type: Number, default: 0.02 }, // 2% stop loss
        takeProfitPercent: { type: Number, default: 0.04 }, // 4% take profit
        
        // Strategy-specific parameters
        scalpingParams: {
            minMomentum: { type: Number, default: 0.005 },
            volumeThreshold: { type: Number, default: 1.5 },
            holdingPeriodMinutes: { type: Number, default: 30 }
        },
        
        swingParams: {
            trendConfirmation: { type: Boolean, default: true },
            patternWeight: { type: Number, default: 0.4 },
            holdingPeriodDays: { type: Number, default: 3 }
        },
        
        btstParams: {
            fundamentalWeight: { type: Number, default: 0.3 },
            technicalWeight: { type: Number, default: 0.7 },
            minVolumeRatio: { type: Number, default: 1.2 }
        },
        
        optionsParams: {
            volatilityThreshold: { type: Number, default: 0.25 },
            timeDecayFactor: { type: Number, default: 0.1 },
            maxDTE: { type: Number, default: 30 } // Days to expiration
        }
    },
    
    // Signal weights for strategy combination
    signalWeights: {
        technical: { type: Number, default: 0.25 },
        pattern: { type: Number, default: 0.25 },
        ml: { type: Number, default: 0.30 },
        volume: { type: Number, default: 0.10 },
        momentum: { type: Number, default: 0.10 }
    },
    
    // Risk management integration
    riskSettings: {
        useMLPositionSizing: { type: Boolean, default: true },
        maxDrawdown: { type: Number, default: 0.05 }, // 5% max drawdown
        riskRewardRatio: { type: Number, default: 2.0 },
        correlationLimit: { type: Number, default: 0.7 }
    },
    
    // Strategy status and metadata
    isActive: { type: Boolean, default: true },
    version: { type: String, default: '1.0' },
    lastOptimized: Date,
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Strategy Execution Schema
const strategyExecutionSchema = new mongoose.Schema({
    executionId: { type: String, unique: true, required: true },
    strategyName: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true },
    
    // Execution details
    execution: {
        signal: { type: String, enum: ['buy', 'sell', 'none'], required: true },
        confidence: { type: Number, required: true },
        expectedReturn: Number,
        entryPrice: Number,
        stopLoss: Number,
        takeProfit: Number,
        holdingPeriod: Number, // in minutes
        
        // Position sizing
        positionSize: {
            shares: Number,
            dollarAmount: Number,
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
        
        // Actual execution results (filled when trade completes)
        actualEntry: {
            price: Number,
            timestamp: Date,
            slippage: Number
        },
        actualExit: {
            price: Number,
            timestamp: Date,
            reason: String, // 'stop_loss', 'take_profit', 'time_exit', 'manual'
            slippage: Number
        },
        
        // Trade results
        actualReturn: Number,
        actualReturnPercent: Number,
        holdingPeriodActual: Number,
        commission: Number,
        netProfit: Number
    },
    
    // Strategy validation
    validation: {
        backtested: Boolean,
        forwardTested: Boolean,
        paperTrade: Boolean,
        liveTrade: Boolean
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
        duration: String, // '1d', '1w', '1m', etc.
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
            type: String, // 'winning', 'losing', 'none'
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
        maxDrawdownDuration: Number, // days
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
        highConfidenceTrades: Number, // confidence > 0.8
        highConfidenceWinRate: Number,
        
        // ML accuracy tracking
        mlPredictionAccuracy: Number,
        mlSignalAccuracy: Number
    },
    
    // Position sizing performance
    positionSizingAnalysis: {
        averagePositionSize: Number,
        maxPositionSize: Number,
        positionSizeVolatility: Number,
        
        // Kelly Criterion analysis
        averageKellyFraction: Number,
        kellyAccuracy: Number,
        optimalSizingRate: Number, // how often optimal size was used
        
        // Size vs performance
        sizeReturnCorrelation: Number,
        oversizeCount: Number,
        undersizeCount: Number
    },
    
    // Time-based analysis
    timeAnalysis: {
        bestHour: Number,
        worstHour: Number,
        bestDayOfWeek: String,
        worstDayOfWeek: String,
        
        // Holding period analysis
        averageHoldingPeriod: Number,
        optimalHoldingPeriod: Number,
        holdingPeriodEfficiency: Number
    },
    
    // Market condition performance
    marketConditionPerformance: {
        trendingMarketReturn: Number,
        sidewaysMarketReturn: Number,
        volatileMarketReturn: Number,
        
        highVolumePerformance: Number,
        lowVolumePerformance: Number,
        
        bullMarketPerformance: Number,
        bearMarketPerformance: Number
    },
    
    // Strategy optimization suggestions
    optimizationSuggestions: [{
        parameter: String,
        currentValue: mongoose.Schema.Types.Mixed,
        suggestedValue: mongoose.Schema.Types.Mixed,
        expectedImprovement: Number,
        confidence: Number
    }],
    
    // Benchmark comparison
    benchmark: {
        benchmarkReturn: Number,
        excessReturn: Number,
        trackingError: Number,
        informationRatio: Number,
        beta: Number,
        alpha: Number
    },
    
    timestamp: { type: Date, default: Date.now, index: true }
});

// Trading Opportunities Schema
const tradingOpportunitySchema = new mongoose.Schema({
    opportunityId: { type: String, unique: true, required: true },
    detectionStrategy: { type: String, required: true }, // Which strategy detected it
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true },
    
    // Opportunity details
    opportunity: {
        signal: { type: String, enum: ['buy', 'sell'], required: true },
        probability: { type: Number, required: true }, // 0-1
        expectedReturn: Number,
        confidence: Number,
        
        // Risk assessment
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
        riskRewardRatio: Number,
        maxLoss: Number,
        
        // Timing
        entryPrice: Number,
        entryWindow: Number, // minutes
        holdingPeriod: Number, // expected holding period in minutes
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
        
        // Results (filled when opportunity is realized)
        actualReturn: Number,
        actualHoldingPeriod: Number,
        exitReason: String,
        success: Boolean
    },
    
    // Validation and quality
    validation: {
        qualityScore: Number, // 0-100
        backtestScore: Number,
        similarOpportunitySuccess: Number,
        strategyReliability: Number
    },
    
    // Status and priority
    status: { 
        type: String, 
        enum: ['active', 'expired', 'executed', 'cancelled'],
        default: 'active'
    },
    priority: { type: Number, default: 50 }, // 0-100
    
    detectedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true }
});

// Strategy Optimization Schema
const strategyOptimizationSchema = new mongoose.Schema({
    optimizationId: { type: String, unique: true, required: true },
    strategyName: { type: String, required: true, index: true },
    
    // Optimization details
    optimization: {
        type: String, // 'parameter_tuning', 'ml_enhancement', 'risk_adjustment'
        method: String, // 'genetic_algorithm', 'grid_search', 'bayesian'
        objective: String, // 'maximize_return', 'maximize_sharpe', 'minimize_drawdown'
        
        // Parameter ranges tested
        parameterRanges: mongoose.Schema.Types.Mixed,
        totalCombinations: Number,
        testedCombinations: Number
    },
    
    // Historical performance used for optimization
    trainingPeriod: {
        startDate: Date,
        endDate: Date,
        totalTrades: Number,
        dataQuality: String
    },
    
    // Optimization results
    results: {
        bestParameters: mongoose.Schema.Types.Mixed,
        bestPerformance: {
            totalReturn: Number,
            sharpeRatio: Number,
            maxDrawdown: Number,
            winRate: Number
        },
        
        improvementMetrics: {
            returnImprovement: Number,
            sharpeImprovement: Number,
            drawdownReduction: Number,
            winRateImprovement: Number
        },
        
        // Statistical significance
        statisticalSignificance: Number,
        confidenceInterval: {
            lower: Number,
            upper: Number
        }
    },
    
    // Validation results
    validation: {
        outOfSampleTesting: {
            period: { startDate: Date, endDate: Date },
            performance: mongoose.Schema.Types.Mixed,
            overfit: Boolean
        },
        
        walkForwardAnalysis: {
            periods: Number,
            averagePerformance: Number,
            consistency: Number
        }
    },
    
    // Implementation status
    implementation: {
        implemented: Boolean,
        implementationDate: Date,
        rollbackDate: Date,
        livePerformance: mongoose.Schema.Types.Mixed
    },
    
    // Optimization metadata
    computationTime: Number, // seconds
    resourceUsage: {
        cpuTime: Number,
        memoryUsage: Number,
        apiCalls: Number
    },
    
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
});

// Forward Testing Schema
const forwardTestingSchema = new mongoose.Schema({
    testId: { type: String, unique: true, required: true },
    strategyName: { type: String, required: true, index: true },
    
    // Testing configuration
    testConfig: {
        startDate: { type: Date, required: true },
        endDate: Date,
        paperTrade: { type: Boolean, default: true },
        maxPositions: { type: Number, default: 5 },
        initialCapital: { type: Number, default: 100000 },
        
        // Risk limits for testing
        maxDailyLoss: Number,
        maxDrawdown: Number,
        stopTestOnLoss: Boolean
    },
    
    // Real-time performance tracking
    livePerformance: {
        currentCapital: Number,
        totalTrades: Number,
        winningTrades: Number,
        currentDrawdown: Number,
        
        // Daily tracking
        dailyReturns: [{
            date: Date,
            return: Number,
            trades: Number,
            capital: Number
        }],
        
        // Current positions
        openPositions: [{
            symbol: String,
            side: String,
            quantity: Number,
            entryPrice: Number,
            entryTime: Date,
            unrealizedPL: Number
        }]
    },
    
    // Comparison with backtest
    backtestComparison: {
        backtestReturn: Number,
        liveTestReturn: Number,
        performanceDifference: Number,
        
        backtestSharpe: Number,
        liveTestSharpe: Number,
        
        slippageImpact: Number,
        executionDifference: Number
    },
    
    // Test status
    status: { 
        type: String, 
        enum: ['running', 'paused', 'completed', 'stopped'],
        default: 'running'
    },
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
});

// Indexes for performance optimization
strategyConfigSchema.index({ name: 1, isActive: 1 });
strategyExecutionSchema.index({ strategyName: 1, symbol: 1, timestamp: -1 });
strategyExecutionSchema.index({ 'execution.signal': 1, 'execution.confidence': -1 });
strategyExecutionSchema.index({ status: 1, timestamp: -1 });

strategyPerformanceSchema.index({ strategyName: 1, 'period.endDate': -1 });
strategyPerformanceSchema.index({ 'returnAnalysis.sharpeRatio': -1 });
strategyPerformanceSchema.index({ 'tradeStats.winRate': -1 });

tradingOpportunitySchema.index({ detectionStrategy: 1, symbol: 1, detectedAt: -1 });
tradingOpportunitySchema.index({ 'opportunity.probability': -1, status: 1 });
tradingOpportunitySchema.index({ priority: -1, detectedAt: -1 });

strategyOptimizationSchema.index({ strategyName: 1, createdAt: -1 });
forwardTestingSchema.index({ strategyName: 1, status: 1 });

// TTL indexes for automatic cleanup
strategyExecutionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tradingOpportunitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
strategyExecutionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

// Export models
const StrategyConfig = mongoose.model('StrategyConfig', strategyConfigSchema);
const StrategyExecution = mongoose.model('StrategyExecution', strategyExecutionSchema);
const StrategyPerformance = mongoose.model('StrategyPerformance', strategyPerformanceSchema);
const TradingOpportunity = mongoose.model('TradingOpportunity', tradingOpportunitySchema);
const StrategyOptimization = mongoose.model('StrategyOptimization', strategyOptimizationSchema);
const ForwardTesting = mongoose.model('ForwardTesting', forwardTestingSchema);

module.exports = {
    StrategyConfig,
    StrategyExecution,
    StrategyPerformance,
    TradingOpportunity,
    StrategyOptimization,
    ForwardTesting
};