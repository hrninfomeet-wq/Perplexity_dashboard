/**
 * Trading Strategies Configuration - Phase 3A Step 7
 * Configuration for all trading strategies with ML and risk integration
 */

const STRATEGY_CONFIG = {
    // Global strategy settings
    global: {
        maxConcurrentStrategies: 5,
        minConfidenceThreshold: 0.6,
        maxPortfolioRisk: 0.15, // 15% max portfolio risk
        enableMLEnhancement: true,
        enableRiskManagement: true,
        performanceUpdateInterval: 300000, // 5 minutes
        opportunityScanInterval: 60000 // 1 minute
    },
    
    // Scalping Strategy Configuration
    scalping: {
        name: 'High-Frequency Scalping',
        timeframes: ['1m', '3m', '5m'],
        version: '1.0',
        
        // Entry/Exit parameters
        parameters: {
            minMomentum: 0.005, // 0.5% minimum momentum
            volumeThreshold: 1.5, // 1.5x average volume
            holdingPeriodMinutes: 15, // Maximum 15 minutes holding
            maxPositionSize: 0.05, // 5% max position size
            
            // Technical thresholds
            rsiOverbought: 70,
            rsiOversold: 30,
            macdThreshold: 0.002,
            volumeConfirmation: true,
            
            // Pattern requirements
            patternConfidence: 0.7,
            multiTimeframeConfirmation: true,
            requiredPatterns: ['momentum', 'volume_spike', 'breakout']
        },
        
        // Risk management
        risk: {
            stopLossPercent: 0.015, // 1.5% stop loss
            takeProfitPercent: 0.03, // 3% take profit
            maxDrawdown: 0.03, // 3% max drawdown
            riskRewardRatio: 2.0,
            useMLPositionSizing: true
        },
        
        // ML enhancement settings
        ml: {
            useNeuralNetworkPredictions: true,
            minimumMLConfidence: 0.65,
            ensembleWeighting: true,
            patternClassifierWeight: 0.4,
            pricePredictorWeight: 0.6
        },
        
        // Signal weights
        signalWeights: {
            technical: 0.20,
            pattern: 0.25,
            ml: 0.35,
            volume: 0.15,
            momentum: 0.05
        }
    },
    
    // Swing Trading Strategy Configuration
    swing: {
        name: 'Multi-Timeframe Swing Trading',
        timeframes: ['15m', '1h', '1d'],
        version: '1.0',
        
        parameters: {
            trendConfirmation: true,
            minTrendStrength: 0.6,
            patternWeight: 0.4,
            holdingPeriodDays: 3,
            maxPositionSize: 0.08, // 8% max position size
            
            // Technical requirements
            trendMAConfirmation: true,
            supportResistanceWeight: 0.3,
            volumeProfile: true,
            divergenceDetection: true,
            
            // Pattern requirements
            requiredPatterns: ['trend_continuation', 'reversal', 'flag', 'pennant'],
            patternConfidence: 0.6,
            multiTimeframeAlignment: true
        },
        
        risk: {
            stopLossPercent: 0.025, // 2.5% stop loss
            takeProfitPercent: 0.06, // 6% take profit
            maxDrawdown: 0.05, // 5% max drawdown
            riskRewardRatio: 2.4,
            useMLPositionSizing: true,
            trailingStopPercent: 0.02 // 2% trailing stop
        },
        
        ml: {
            useNeuralNetworkPredictions: true,
            minimumMLConfidence: 0.6,
            ensembleWeighting: true,
            trendPredictionWeight: 0.5,
            patternClassifierWeight: 0.5
        },
        
        signalWeights: {
            technical: 0.30,
            pattern: 0.30,
            ml: 0.25,
            volume: 0.10,
            trend: 0.05
        }
    },
    
    // BTST (Buy Today Sell Tomorrow) Strategy Configuration
    btst: {
        name: 'Buy Today Sell Tomorrow Scanner',
        timeframes: ['1h', '1d'],
        version: '1.0',
        
        parameters: {
            fundamentalWeight: 0.3,
            technicalWeight: 0.7,
            minVolumeRatio: 1.2,
            maxPositionSize: 0.06, // 6% max position size
            
            // Screening criteria
            minMarketCap: 1000000000, // 1B minimum market cap
            maxPE: 30,
            minROE: 15,
            debtToEquity: 1.0,
            
            // Technical screening
            nearSupport: true,
            volumeBreakout: true,
            momentumPositive: true,
            technicalScore: 0.7
        },
        
        risk: {
            stopLossPercent: 0.02, // 2% stop loss
            takeProfitPercent: 0.05, // 5% take profit
            maxDrawdown: 0.04, // 4% max drawdown
            riskRewardRatio: 2.5,
            useMLPositionSizing: true,
            overnightRiskFactor: 1.3 // 30% additional risk for overnight positions
        },
        
        ml: {
            useNeuralNetworkPredictions: true,
            minimumMLConfidence: 0.65,
            overnightPredictionWeight: 0.6,
            gapPredictionWeight: 0.4
        },
        
        signalWeights: {
            technical: 0.35,
            fundamental: 0.25,
            ml: 0.25,
            volume: 0.10,
            sentiment: 0.05
        }
    },
    
    // Options Strategy Configuration
    options: {
        name: 'Volatility-Based Options Trading',
        timeframes: ['15m', '1h', '1d'],
        version: '1.0',
        
        parameters: {
            volatilityThreshold: 0.25,
            timeDecayFactor: 0.1,
            maxDTE: 30, // Days to expiration
            minOI: 1000, // Minimum open interest
            maxPositionSize: 0.04, // 4% max position size
            
            // Options-specific
            deltaRange: [0.3, 0.7],
            gammaThreshold: 0.05,
            thetaDecayFactor: 0.1,
            vegaVolatilityWeight: 0.3,
            
            // Strategy types
            enableCoveredCalls: true,
            enableCashSecuredPuts: true,
            enableIronCondors: false, // Advanced strategy
            enableStraddles: true
        },
        
        risk: {
            maxLossPercent: 0.5, // 50% max loss on premium
            profitTargetPercent: 0.3, // 30% profit target
            maxDrawdown: 0.06, // 6% max drawdown
            riskRewardRatio: 1.5, // Lower for options
            useMLPositionSizing: true,
            timeDecayRisk: 0.02 // 2% daily theta decay risk
        },
        
        ml: {
            useNeuralNetworkPredictions: true,
            minimumMLConfidence: 0.7,
            volatilityPredictionWeight: 0.6,
            directionPredictionWeight: 0.4,
            impliedVolatilityAnalysis: true
        },
        
        signalWeights: {
            volatility: 0.40,
            technical: 0.25,
            ml: 0.20,
            timeDecay: 0.10,
            momentum: 0.05
        }
    },
    
    // F&O Arbitrage Strategy Configuration
    fo_arbitrage: {
        name: 'Futures & Options Arbitrage',
        timeframes: ['5m', '15m', '1h'],
        version: '1.0',
        
        parameters: {
            minSpreadPercent: 0.002, // 0.2% minimum spread
            maxPositionSize: 0.03, // 3% max position size
            arbitrageThreshold: 0.001, // 0.1% arbitrage threshold
            
            // Arbitrage types
            futuresCashArbitrage: true,
            calendarSpreads: true,
            volatilityArbitrage: false, // Advanced
            
            // Execution requirements
            maxSlippage: 0.0005, // 0.05% max slippage
            minLiquidity: 10000, // Minimum liquidity
            executionWindow: 30 // 30 seconds execution window
        },
        
        risk: {
            stopLossPercent: 0.01, // 1% stop loss (tight for arbitrage)
            takeProfitPercent: 0.005, // 0.5% take profit
            maxDrawdown: 0.02, // 2% max drawdown
            riskRewardRatio: 0.5, // Lower risk, lower reward
            useMLPositionSizing: false, // Fixed sizing for arbitrage
            correlationLimit: 0.9 // High correlation expected
        },
        
        ml: {
            useNeuralNetworkPredictions: false, // Arbitrage doesn't need predictions
            spreadPrediction: true,
            liquidityAnalysis: true
        },
        
        signalWeights: {
            spread: 0.60,
            liquidity: 0.25,
            execution: 0.10,
            risk: 0.05
        }
    },
    
    // Performance thresholds
    performance: {
        minWinRate: 0.65, // 65% minimum win rate
        minSharpeRatio: 1.5,
        maxDrawdown: 0.10, // 10% maximum drawdown
        minROI: 0.15, // 15% minimum ROI annually
        
        // Optimization triggers
        optimizeAfterTrades: 100,
        optimizeAfterDays: 30,
        underperformanceThreshold: 0.5, // 50% below benchmark
        
        // Alert thresholds
        drawdownAlert: 0.05, // 5% drawdown alert
        winRateAlert: 0.55, // Below 55% win rate alert
        volumeAlert: 0.5 // 50% below average volume alert
    },
    
    // F&O Arbitrage Strategy Configuration
    foArbitrage: {
        name: 'F&O Arbitrage',
        timeframes: ['1m', '5m'],
        version: '1.0',
        
        // Arbitrage parameters
        parameters: {
            arbitrageThreshold: 0.005, // 0.5% minimum spread for arbitrage
            minSpreadPercent: 0.003, // 0.3% minimum spread
            maxSlippage: 0.001, // 0.1% maximum slippage
            executionWindow: 30, // seconds for execution
            
            // Strategy types
            calendarSpreads: true,
            volatilityArbitrage: true,
            cashFuturesArbitrage: true,
            
            // Liquidity requirements
            minLiquidity: 100000, // Minimum daily volume
            minOpenInterest: 500000, // Minimum open interest for futures
            bidAskSpreadThreshold: 0.001, // 0.1% max bid-ask spread
            
            // Correlation requirements
            minCorrelation: 0.85, // Minimum correlation for arbitrage pairs
            maxExecutionTime: 60 // Maximum time to execute arbitrage (seconds)
        },
        
        // Risk management (very conservative for arbitrage)
        risk: {
            stopLossPercent: 0.001, // 0.1% stop loss (very tight)
            takeProfitPercent: 0.005, // 0.5% take profit
            maxPositionSize: 0.05, // 5% max position
            maxConcurrentTrades: 3,
            maxDrawdown: 0.005, // 0.5% max drawdown
            riskRewardRatio: 5.0, // High RR for arbitrage
            useMLPositionSizing: false // Fixed sizing for arbitrage
        },
        
        // ML enhancement
        ml: {
            enabled: true,
            spreadPrediction: true,
            liquidityAnalysis: true,
            correlationModeling: true,
            ensembleWeight: 0.3,
            confidenceThreshold: 0.7
        },
        
        // Signal composition
        signalWeights: {
            arbitrageScore: 0.5,
            liquidityScore: 0.2,
            executionScore: 0.2,
            mlScore: 0.1
        },
        
        // Performance tracking
        performance: {
            trackSpreadCapture: true,
            trackExecutionLatency: true,
            trackSlippageCost: true,
            trackRiskFreeReturn: true,
            benchmarkToRiskFreeRate: true
        },
        
        // Optimization triggers
        optimizeAfterTrades: 50, // More frequent optimization for arbitrage
        optimizeAfterDays: 7,
        underperformanceThreshold: 0.8, // 80% below benchmark
        
        // Alert thresholds (tighter for arbitrage)
        drawdownAlert: 0.001, // 0.1% drawdown alert
        winRateAlert: 0.90, // Below 90% win rate alert (arbitrage should be very high)
        volumeAlert: 0.7 // 70% below average volume alert
    }
};

// Strategy priority matrix
const STRATEGY_PRIORITY = {
    high_volatility: ['scalping', 'options'],
    trending_market: ['swing', 'btst'],
    sideways_market: ['options', 'foArbitrage'],
    low_volatility: ['swing', 'btst', 'foArbitrage'],
    high_volume: ['scalping', 'swing'],
    low_volume: ['btst', 'options']
};

// Risk limits per strategy combination
const STRATEGY_RISK_LIMITS = {
    single_strategy: 0.05, // 5% max risk per single strategy
    combined_strategies: 0.15, // 15% max risk for all strategies combined
    correlation_limit: 0.7, // Maximum correlation between active strategies
    sector_exposure: 0.25, // 25% max exposure to single sector
    max_concurrent: 3 // Maximum 3 concurrent strategies
};

module.exports = {
    STRATEGY_CONFIG,
    STRATEGY_PRIORITY,
    STRATEGY_RISK_LIMITS
};
