// dashboard-backend/src/config/risk.config.js
/**
 * Risk Management Configuration - Phase 3A Step 6
 * Configuration settings for comprehensive risk management system
 */

const riskConfig = {
    // Value at Risk (VaR) settings
    var: {
        confidenceLevels: [0.95, 0.99, 0.999], // 95%, 99%, 99.9%
        timeHorizons: [1, 5, 10, 20], // Days
        defaultConfidence: 0.95,
        defaultTimeHorizon: 1,
        historicalDays: 252, // Trading days for historical analysis
        monteCarloSimulations: 10000
    },
    
    // Position sizing configuration
    positionSizing: {
        kelly: {
            maxFraction: 0.25, // Maximum Kelly fraction (25%)
            conservativeScaling: 0.5, // Scale down Kelly by 50% for safety
            minFraction: 0.01, // Minimum position size (1%)
            mlConfidenceThreshold: 0.6 // Minimum ML confidence for enhancement
        },
        
        // ML enhancement factors
        mlEnhancement: {
            confidenceMultiplier: {
                high: 1.2,    // >80% confidence: increase position by 20%
                medium: 1.0,  // 60-80% confidence: no change
                low: 0.7      // <60% confidence: reduce position by 30%
            },
            ensembleBonus: 0.1, // 10% bonus for ensemble agreement
            maxEnhancement: 1.5, // Maximum 50% enhancement
            minEnhancement: 0.5  // Minimum 50% of original size
        }
    },
    
    // Portfolio risk limits
    portfolio: {
        maxVaR: 0.05, // Maximum 5% portfolio VaR
        maxPositionSize: 0.15, // Maximum 15% in single position
        maxSectorExposure: 0.30, // Maximum 30% in single sector
        maxCorrelation: 0.8, // Maximum correlation between positions
        minDiversification: 5, // Minimum number of positions
        
        // Risk tolerance levels
        riskTolerance: {
            conservative: { maxVaR: 0.02, maxPosition: 0.10 },
            moderate: { maxVaR: 0.05, maxPosition: 0.15 },
            aggressive: { maxVaR: 0.10, maxPosition: 0.25 }
        }
    },
    
    // Stop-loss and take-profit settings
    riskControls: {
        stopLoss: {
            default: 0.02, // 2% default stop-loss
            volatilityBased: {
                multiplier: 2.0, // 2x daily volatility
                minStopLoss: 0.01, // Minimum 1%
                maxStopLoss: 0.05  // Maximum 5%
            },
            mlBased: {
                confidenceAdjustment: true,
                highConfidence: 0.03, // 3% for high confidence trades
                lowConfidence: 0.015  // 1.5% for low confidence trades
            }
        },
        
        takeProfit: {
            default: 0.04, // 2:1 risk-reward ratio
            mlBased: {
                confidenceMultiplier: 1.5, // Extend targets for high confidence
                pricePredictionBased: true
            },
            trailingStop: {
                enabled: true,
                threshold: 0.02, // Start trailing after 2% profit
                step: 0.005 // 0.5% trailing step
            }
        }
    },
    
    // Performance benchmarks
    benchmarks: {
        riskAdjustedReturns: {
            targetSharpeRatio: 1.5,
            targetSortinoRatio: 2.0,
            maxDrawdownLimit: 0.10 // 10% maximum drawdown
        },
        
        processingTime: {
            riskCalculation: 200, // <200ms for risk calculations
            positionSizing: 100,  // <100ms for position sizing
            portfolioAnalysis: 500 // <500ms for full portfolio analysis
        }
    },
    
    // Correlation and volatility settings
    marketAnalysis: {
        volatility: {
            lookbackPeriod: 30, // 30-day volatility calculation
            ewmaAlpha: 0.94, // EWMA decay factor
            minimumObservations: 20
        },
        
        correlation: {
            lookbackPeriod: 60, // 60-day correlation
            minimumCorrelation: -0.5, // For diversification benefits
            updateFrequency: 'daily'
        },
        
        // Market regime detection
        regimes: {
            volatilityThresholds: {
                low: 0.15,    // <15% annualized volatility
                medium: 0.25, // 15-25% volatility
                high: 0.25    // >25% volatility
            }
        }
    },
    
    // Error handling and fallbacks
    errorHandling: {
        dataQuality: {
            minimumPriceHistory: 20, // Minimum price points required
            maxMissingData: 0.05, // Maximum 5% missing data points
            outlierDetection: true
        },
        
        fallbacks: {
            defaultVolatility: 0.20, // 20% if calculation fails
            defaultCorrelation: 0.3, // 30% if correlation unavailable
            emergencyStopLoss: 0.05  // 5% emergency stop-loss
        }
    },
    
    // Backtesting and validation
    backtesting: {
        period: 252, // 1 year of trading days
        rebalanceFrequency: 5, // Every 5 days
        transactionCosts: 0.001, // 0.1% transaction costs
        slippage: 0.0005 // 0.05% slippage
    },
    
    // API rate limiting for risk calculations
    rateLimiting: {
        riskCalculationsPerMinute: 100,
        portfolioAnalysisPerHour: 20,
        intensiveCalculationsPerDay: 100
    },
    
    // Real-time monitoring
    monitoring: {
        alertThresholds: {
            varBreach: 0.8, // Alert at 80% of VaR limit
            correlationSpike: 0.7, // Alert if correlation >70%
            drawdownAlert: 0.05 // Alert at 5% drawdown
        },
        
        updateFrequency: {
            realtime: 1000, // 1 second for active positions
            portfolio: 60000, // 1 minute for portfolio metrics
            historical: 300000 // 5 minutes for historical updates
        }
    }
};

module.exports = riskConfig;
