// dashboard-backend/src/models/tradeExecutionModel.js
/**
 * Trade Execution Database Models - Phase 3A Step 8
 * Complete schemas for live trading, paper trading, and performance tracking
 */

const mongoose = require('mongoose');

// Paper Trading Session Schema
const paperTradingSessionSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true, required: true, index: true },
    userId: { type: String, required: true, index: true },
    
    // Session details
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, index: true },
    status: { 
        type: String, 
        enum: ['active', 'paused', 'completed', 'terminated'],
        default: 'active',
        index: true
    },
    
    // Capital tracking
    initialCapital: { type: Number, required: true },
    currentCapital: { type: Number, required: true },
    availableCapital: { type: Number, required: true },
    
    // Performance metrics
    totalTrades: { type: Number, default: 0 },
    winningTrades: { type: Number, default: 0 },
    losingTrades: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    totalLoss: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 },
    
    // Risk metrics
    maxDailyLoss: { type: Number, required: true },
    maxPositionSize: { type: Number, required: true },
    riskLimitsBreached: { type: Number, default: 0 },
    
    // Configuration
    enabledStrategies: [String],
    marketType: { 
        type: String, 
        enum: ['crypto', 'nse', 'mixed'],
        default: 'mixed'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Trade Execution Schema
const tradeExecutionSchema = new mongoose.Schema({
    tradeId: { type: String, unique: true, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    
    // Trade details
    symbol: { type: String, required: true, index: true },
    strategy: { type: String, required: true, index: true },
    signal: { 
        type: String, 
        enum: ['BUY', 'SELL', 'HOLD'],
        required: true,
        index: true
    },
    
    // Execution details
    requestedQuantity: { type: Number, required: true },
    executedQuantity: { type: Number, required: true },
    requestedPrice: { type: Number, required: true },
    executedPrice: { type: Number, required: true },
    
    // Market conditions
    marketPrice: { type: Number, required: true },
    slippage: { type: Number, required: true },
    commission: { type: Number, required: true },
    marketImpact: { type: Number, required: true },
    
    // Financial details
    dollarAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true }, // After slippage + commission
    
    // Timing
    signalTime: { type: Date, required: true },
    executionTime: { type: Date, required: true },
    latency: { type: Number, required: true }, // Execution latency in ms
    
    // Risk and ML data
    confidence: { type: Number, required: true },
    expectedReturn: { type: Number },
    riskScore: { type: Number },
    
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'executed', 'partially_executed', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    
    // Performance tracking
    unrealizedPnL: { type: Number, default: 0 },
    realizedPnL: { type: Number, default: 0 },
    
    // Metadata
    executionDetails: {
        marketCondition: String,
        volatility: Number,
        volume: Number,
        bidAskSpread: Number
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Portfolio Position Schema
const portfolioPositionSchema = new mongoose.Schema({
    positionId: { type: String, unique: true, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    
    // Position details
    symbol: { type: String, required: true, index: true },
    strategy: { type: String, required: true, index: true },
    
    // Position tracking
    quantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    
    // Financial tracking
    investedAmount: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    unrealizedPnL: { type: Number, required: true },
    realizedPnL: { type: Number, default: 0 },
    
    // Risk management
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    
    // Timing
    openTime: { type: Date, required: true, index: true },
    closeTime: { type: Date, index: true },
    
    // Status
    status: {
        type: String,
        enum: ['open', 'closed', 'partial'],
        default: 'open',
        index: true
    },
    
    // Performance tracking
    holdingPeriod: { type: Number }, // In hours
    returnPercentage: { type: Number },
    maxUnrealizedGain: { type: Number, default: 0 },
    maxUnrealizedLoss: { type: Number, default: 0 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Live Performance Schema
const livePerformanceSchema = new mongoose.Schema({
    performanceId: { type: String, unique: true, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    
    // Time period
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    
    // Portfolio metrics
    startingCapital: { type: Number, required: true },
    endingCapital: { type: Number, required: true },
    totalReturn: { type: Number, required: true },
    totalReturnPercentage: { type: Number, required: true },
    
    // Trading metrics
    totalTrades: { type: Number, required: true },
    winningTrades: { type: Number, required: true },
    losingTrades: { type: Number, required: true },
    winRate: { type: Number, required: true },
    
    // Profit/Loss metrics
    grossProfit: { type: Number, required: true },
    grossLoss: { type: Number, required: true },
    netProfit: { type: Number, required: true },
    profitFactor: { type: Number, required: true },
    
    // Risk metrics
    maxDrawdown: { type: Number, required: true },
    maxDrawdownPercentage: { type: Number, required: true },
    sharpeRatio: { type: Number },
    sortinoRatio: { type: Number },
    calmarRatio: { type: Number },
    
    // Execution metrics
    averageTradeReturn: { type: Number, required: true },
    averageWinReturn: { type: Number, required: true },
    averageLossReturn: { type: Number, required: true },
    largestWin: { type: Number, required: true },
    largestLoss: { type: Number, required: true },
    
    // Strategy breakdown
    strategyPerformance: [{
        strategy: String,
        trades: Number,
        winRate: Number,
        profit: Number,
        sharpeRatio: Number
    }],
    
    // Execution quality
    averageSlippage: { type: Number, required: true },
    averageCommission: { type: Number, required: true },
    averageLatency: { type: Number, required: true }, // In milliseconds
    
    // Market analysis
    marketConditions: {
        averageVolatility: Number,
        trendDirection: String,
        marketType: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Market Data Schema for live feeds
const liveMarketDataSchema = new mongoose.Schema({
    symbol: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    
    // Price data
    price: { type: Number, required: true },
    bid: { type: Number },
    ask: { type: Number },
    volume: { type: Number },
    
    // Market type
    marketType: {
        type: String,
        enum: ['crypto', 'nse'],
        required: true,
        index: true
    },
    
    // Data source
    provider: { type: String, required: true },
    
    // Quality metrics
    latency: { type: Number }, // Data latency in ms
    confidence: { type: Number, default: 1.0 }
}, {
    timestamps: true,
    index: { symbol: 1, timestamp: -1 } // Compound index for efficient queries
});

// Add indexes for performance
paperTradingSessionSchema.index({ userId: 1, startTime: -1 });
tradeExecutionSchema.index({ sessionId: 1, executionTime: -1 });
portfolioPositionSchema.index({ sessionId: 1, symbol: 1, status: 1 });
livePerformanceSchema.index({ sessionId: 1, periodStart: -1 });
liveMarketDataSchema.index({ symbol: 1, timestamp: -1 });

// Create models with existence checks
const PaperTradingSession = mongoose.models.PaperTradingSession || mongoose.model('PaperTradingSession', paperTradingSessionSchema);
const TradeExecution = mongoose.models.TradeExecution || mongoose.model('TradeExecution', tradeExecutionSchema);
const PortfolioPosition = mongoose.models.PortfolioPosition || mongoose.model('PortfolioPosition', portfolioPositionSchema);
const LivePerformance = mongoose.models.LivePerformance || mongoose.model('LivePerformance', livePerformanceSchema);
const LiveMarketData = mongoose.models.LiveMarketData || mongoose.model('LiveMarketData', liveMarketDataSchema);

module.exports = {
    PaperTradingSession,
    TradeExecution,
    PortfolioPosition,
    LivePerformance,
    LiveMarketData
};
