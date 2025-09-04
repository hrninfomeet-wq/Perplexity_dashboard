// dashboard-backend/src/models/riskModel.js
/**
 * Risk Management Database Models - Phase 3A Step 6
 * Enhanced models for risk assessment, position sizing, and portfolio management
 */

const mongoose = require('mongoose');

// Risk Assessment Schema
const riskAssessmentSchema = new mongoose.Schema({
    assessmentId: { type: String, unique: true, required: true, index: true },
    type: { 
        type: String, 
        enum: ['position_risk', 'portfolio_risk', 'var_calculation', 'position_sizing', 'risk_controls'],
        required: true,
        index: true
    },
    
    // Position/Portfolio information
    symbol: { type: String, index: true },
    symbols: [String], // For portfolio assessments
    
    // Risk calculations
    riskMetrics: {
        var: {
            amount: Number,
            percentage: Number,
            confidenceLevel: Number,
            timeHorizon: Number
        },
        cvar: {
            amount: Number,
            percentage: Number
        },
        volatility: Number,
        correlation: mongoose.Schema.Types.Mixed, // Correlation matrix for portfolio
        
        // Performance metrics
        sharpeRatio: Number,
        sortinoRatio: Number,
        maxDrawdown: Number,
        beta: Number
    },
    
    // Position sizing details
    positionSizing: {
        kellyFraction: Number,
        conservativeScaling: Number,
        finalFraction: Number,
        dollarAmount: Number,
        shares: Number,
        positionPercent: Number,
        
        // ML integration
        mlConfidence: Number,
        mlEnhancement: Boolean,
        confidenceAdjustment: Number
    },
    
    // Risk controls
    riskControls: {
        stopLoss: {
            percentage: Number,
            price: Number,
            reasoning: String,
            dynamicallyAdjusted: Boolean
        },
        takeProfit: {
            percentage: Number,
            price: Number,
            reasoning: String,
            mlBased: Boolean
        },
        riskRewardRatio: Number,
        maxLoss: Number
    },
    
    // Market context
    marketConditions: {
        volatility: Number,
        marketTrend: String,
        correlationEnvironment: String, // 'low', 'medium', 'high'
        liquidityCondition: String
    },
    
    // ML integration details
    mlAnalysis: {
        confidence: Number,
        ensembleScore: Number,
        overallSignal: String,
        pricePrediction: mongoose.Schema.Types.Mixed,
        mlEnhanced: Boolean
    },
    
    // Performance and validation
    performance: {
        processingTime: Number,
        accuracy: Number, // For backtested assessments
        actualOutcome: String,
        profitLoss: Number,
        followedRecommendation: Boolean
    },
    
    // Status and metadata
    status: { 
        type: String, 
        enum: ['active', 'executed', 'expired', 'cancelled'],
        default: 'active'
    },
    isBacktested: { type: Boolean, default: false },
    
    timestamp: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true }
});

// Portfolio Risk Schema
const portfolioRiskSchema = new mongoose.Schema({
    portfolioId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    
    // Portfolio composition
    positions: [{
        symbol: String,
        quantity: Number,
        currentPrice: Number,
        marketValue: Number,
        weight: Number, // Portfolio weight percentage
        beta: Number,
        
        // Position-specific risk metrics
        positionVaR: {
            amount: Number,
            percentage: Number
        },
        contribution: {
            riskContribution: Number, // Risk contribution to portfolio
            returnContribution: Number
        }
    }],
    
    // Portfolio-level metrics
    portfolioMetrics: {
        totalValue: Number,
        positionCount: Number,
        
        // Risk metrics
        portfolioVaR: {
            amount: Number,
            percentage: Number,
            confidenceLevel: Number,
            timeHorizon: Number
        },
        expectedShortfall: Number,
        volatility: Number,
        
        // Performance metrics
        expectedReturn: Number,
        sharpeRatio: Number,
        sortinoRatio: Number,
        informationRatio: Number,
        trackingError: Number,
        maxDrawdown: Number
    },
    
    // Diversification analysis
    diversification: {
        correlationMatrix: mongoose.Schema.Types.Mixed,
        averageCorrelation: Number,
        diversificationRatio: Number,
        concentrationRisk: Number,
        
        // Sector/Industry exposure
        sectorExposure: mongoose.Schema.Types.Mixed,
        industryExposure: mongoose.Schema.Types.Mixed,
        geographicExposure: mongoose.Schema.Types.Mixed
    },
    
    // Risk limits and compliance
    riskLimits: {
        maxPortfolioVaR: Number,
        maxPositionSize: Number,
        maxSectorExposure: Number,
        maxCorrelation: Number,
        
        // Current compliance status
        compliance: {
            isCompliant: Boolean,
            violations: [String],
            riskScore: Number // 0-100 scale
        }
    },
    
    // Optimization suggestions
    optimization: {
        suggestedActions: [String],
        riskReduction: {
            recommendedChanges: mongoose.Schema.Types.Mixed,
            expectedRiskReduction: Number
        },
        returnEnhancement: {
            recommendedChanges: mongoose.Schema.Types.Mixed,
            expectedReturnIncrease: Number
        }
    },
    
    timestamp: { type: Date, default: Date.now, index: true }
});

// Risk Events Schema for tracking risk-related events
const riskEventSchema = new mongoose.Schema({
    eventId: { type: String, unique: true, required: true },
    type: { 
        type: String, 
        enum: ['stop_loss_trigger', 'take_profit_hit', 'var_breach', 'correlation_spike', 'position_limit_breach'],
        required: true
    },
    
    severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    
    // Event details
    details: {
        symbol: String,
        portfolioId: String,
        triggerValue: Number,
        thresholdValue: Number,
        description: String,
        action: String
    },
    
    // Response and resolution
    response: {
        automated: Boolean,
        action: String,
        timestamp: Date,
        result: String
    },
    
    // Performance impact
    impact: {
        profitLoss: Number,
        riskReduction: Number,
        portfolioImpact: Number
    },
    
    timestamp: { type: Date, default: Date.now, index: true },
    resolved: { type: Boolean, default: false }
});

// Risk Performance Tracking Schema
const riskPerformanceSchema = new mongoose.Schema({
    performanceId: { type: String, unique: true, required: true },
    portfolioId: { type: String, required: true, index: true },
    period: {
        start: Date,
        end: Date,
        days: Number
    },
    
    // Performance metrics
    metrics: {
        totalReturn: Number,
        volatility: Number,
        sharpeRatio: Number,
        sortinoRatio: Number,
        maxDrawdown: Number,
        calmarRatio: Number,
        
        // Risk-adjusted metrics
        informationRatio: Number,
        trackingError: Number,
        beta: Number,
        alpha: Number
    },
    
    // Risk management effectiveness
    riskManagement: {
        stopLossesTriggered: Number,
        takeProfitsHit: Number,
        averageHoldingPeriod: Number,
        winRate: Number,
        avgWin: Number,
        avgLoss: Number,
        profitFactor: Number
    },
    
    // ML enhancement performance
    mlPerformance: {
        enhancedPositions: Number,
        mlWinRate: Number,
        improvementOverBaseline: Number,
        confidenceAccuracy: Number
    },
    
    timestamp: { type: Date, default: Date.now }
});

// Risk Configuration Schema for user-specific risk settings
const riskConfigurationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    portfolioId: { type: String, index: true },
    
    // Risk tolerance and limits
    riskTolerance: {
        level: { type: String, enum: ['conservative', 'moderate', 'aggressive'], default: 'moderate' },
        maxPortfolioVaR: { type: Number, default: 0.05 },
        maxPositionSize: { type: Number, default: 0.15 },
        maxDrawdown: { type: Number, default: 0.10 }
    },
    
    // Position sizing preferences
    positionSizing: {
        method: { type: String, enum: ['fixed', 'kelly', 'ml_enhanced'], default: 'ml_enhanced' },
        kellyScaling: { type: Number, default: 0.5 },
        mlEnhancement: { type: Boolean, default: true },
        maxEnhancement: { type: Number, default: 1.5 }
    },
    
    // Risk control preferences
    riskControls: {
        autoStopLoss: { type: Boolean, default: true },
        autoTakeProfit: { type: Boolean, default: true },
        dynamicAdjustment: { type: Boolean, default: true },
        mlBasedControls: { type: Boolean, default: true }
    },
    
    // Notification preferences
    notifications: {
        riskAlerts: { type: Boolean, default: true },
        stopLossAlerts: { type: Boolean, default: true },
        portfolioAlerts: { type: Boolean, default: true },
        performanceReports: { type: Boolean, default: true }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add indexes for performance
riskAssessmentSchema.index({ symbol: 1, timestamp: -1 });
riskAssessmentSchema.index({ type: 1, status: 1 });
portfolioRiskSchema.index({ portfolioId: 1, timestamp: -1 });
riskEventSchema.index({ type: 1, severity: 1, timestamp: -1 });
riskPerformanceSchema.index({ portfolioId: 1, 'period.start': -1 });
riskConfigurationSchema.index({ userId: 1, portfolioId: 1 });

// Create models
const RiskAssessment = mongoose.model('RiskAssessment', riskAssessmentSchema);
const PortfolioRisk = mongoose.model('PortfolioRisk', portfolioRiskSchema);
const RiskEvent = mongoose.model('RiskEvent', riskEventSchema);
const RiskPerformance = mongoose.model('RiskPerformance', riskPerformanceSchema);
const RiskConfiguration = mongoose.model('RiskConfiguration', riskConfigurationSchema);

module.exports = {
    RiskAssessment,
    PortfolioRisk,
    RiskEvent,
    RiskPerformance,
    RiskConfiguration
};
