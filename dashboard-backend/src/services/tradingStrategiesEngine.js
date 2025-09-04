/**
 * Trading Strategies Engine - Phase 3A Step 7
 * Central orchestrator for all trading strategies with ML and risk integration
 */

const { STRATEGY_CONFIG, STRATEGY_PRIORITY, STRATEGY_RISK_LIMITS } = require('../config/strategies.config');
const { StrategyExecution, StrategyPerformance, TradingOpportunity } = require('../models/strategyModels');

// Import strategy implementations
const ScalpingStrategy = require('./strategies/scalpingStrategy');
const SwingStrategy = require('./strategies/swingStrategy');
const BTSTStrategy = require('./strategies/btstStrategy');
const OptionsStrategy = require('./strategies/optionsStrategy');
const FOArbitrageStrategy = require('./strategies/foArbitrageStrategy');

// Import core engines (mock implementation for now)
// const MLSignalEngine = require('../ml/mlSignalEngine');
// const RiskManagementEngine = require('../risk/riskManagementEngine');
// const TechnicalIndicatorsEngine = require('../technical/technicalIndicatorsEngine');
// const PatternRecognitionEngine = require('../pattern/patternRecognitionEngine');

// Mock engines for testing
const MLSignalEngine = {
    enhanceSignal: async () => ({ ensemble: { confidence: 0.8 } })
};
const RiskManagementEngine = {
    assessRisk: async () => ({ riskScore: 0.3 })
};
const TechnicalIndicatorsEngine = {
    analyze: async () => ({ rsi: 50, macd: { value: 0.1 } })
};
const PatternRecognitionEngine = {
    detectPatterns: async () => ({ patterns: [] })
};

class TradingStrategiesEngine {
    constructor() {
        this.strategies = new Map();
        this.activeExecutions = new Map();
        this.opportunityScanner = null;
        this.performanceTracker = null;
        
        // Initialize strategy instances
        this.initializeStrategies();
        
        // Start background processes
        this.startOpportunityScanning();
        this.startPerformanceTracking();
        
        console.log('✅ Trading Strategies Engine initialized with 5 strategies');
    }
    
    /**
     * Initialize all strategy instances
     */
    initializeStrategies() {
        try {
            // Initialize each strategy with its configuration
            this.strategies.set('scalping', new ScalpingStrategy(STRATEGY_CONFIG.scalping));
            this.strategies.set('swing', new SwingStrategy(STRATEGY_CONFIG.swing));
            this.strategies.set('btst', new BTSTStrategy(STRATEGY_CONFIG.btst));
            this.strategies.set('options', new OptionsStrategy(STRATEGY_CONFIG.options));
            this.strategies.set('foArbitrage', new FOArbitrageStrategy(STRATEGY_CONFIG.foArbitrage));
            
            console.log('✅ All 5 trading strategies initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing strategies:', error);
            throw error;
        }
    }
    
    /**
     * Execute strategy analysis for a specific symbol and timeframe
     * @param {string} symbol - Trading symbol
     * @param {string} timeframe - Time timeframe
     * @param {string} strategyType - Strategy type (optional, runs all if not specified)
     * @returns {Promise<Object>} Strategy execution results
     */
    async executeStrategy(symbol, timeframe, strategyType = null) {
        try {
            const startTime = Date.now();
            
            // Validate inputs
            if (!symbol || !timeframe) {
                throw new Error('Symbol and timeframe are required');
            }
            
            // Get market data first
            const marketData = await this.getMarketData(symbol, timeframe);
            if (!marketData) {
                throw new Error(`No market data available for ${symbol}`);
            }
            
            // Determine which strategies to run
            const strategiesToRun = strategyType ? [strategyType] : this.getActiveStrategies(marketData);
            
            const results = [];
            
            for (const strategy of strategiesToRun) {
                if (!this.strategies.has(strategy)) {
                    console.warn(`⚠️ Strategy ${strategy} not found`);
                    continue;
                }
                
                try {
                    // Execute individual strategy
                    const strategyResult = await this.executeSingleStrategy(
                        strategy, 
                        symbol, 
                        timeframe, 
                        marketData
                    );
                    
                    if (strategyResult) {
                        results.push(strategyResult);
                    }
                } catch (strategyError) {
                    console.error(`❌ Error in ${strategy} strategy:`, strategyError);
                    // Continue with other strategies
                }
            }
            
            // Aggregate and rank results
            const aggregatedResults = await this.aggregateResults(results, symbol, timeframe);
            
            // Log performance
            const totalTime = Date.now() - startTime;
            console.log(`✅ Strategy execution completed in ${totalTime}ms for ${symbol} (${timeframe})`);
            
            return aggregatedResults;
            
        } catch (error) {
            console.error('❌ Error in strategy execution:', error);
            throw error;
        }
    }
    
    /**
     * Execute a single strategy
     * @param {string} strategyName - Strategy name
     * @param {string} symbol - Trading symbol
     * @param {string} timeframe - Time timeframe
     * @param {Object} marketData - Market data
     * @returns {Promise<Object>} Strategy result
     */
    async executeSingleStrategy(strategyName, symbol, timeframe, marketData) {
        try {
            const strategy = this.strategies.get(strategyName);
            const config = STRATEGY_CONFIG[strategyName];
            
            // Check if strategy supports this timeframe
            if (!config.timeframes.includes(timeframe)) {
                console.log(`⚠️ ${strategyName} doesn't support ${timeframe} timeframe`);
                return null;
            }
            
            const startTime = Date.now();
            
            // 1. Get technical analysis
            const technicalAnalysis = await TechnicalIndicatorsEngine.analyzeSymbol(symbol, timeframe);
            
            // 2. Get pattern recognition
            const patternAnalysis = await PatternRecognitionEngine.analyzePatterns(symbol, timeframe);
            
            // 3. Get ML predictions
            let mlAnalysis = null;
            if (config.ml.useNeuralNetworkPredictions) {
                mlAnalysis = await MLSignalEngine.generateSignal({
                    symbol,
                    timeframe,
                    technicalData: technicalAnalysis,
                    patternData: patternAnalysis,
                    marketData
                });
            }
            
            // 4. Execute strategy logic
            const strategySignal = await strategy.analyzeOpportunity({
                symbol,
                timeframe,
                marketData,
                technicalAnalysis,
                patternAnalysis,
                mlAnalysis
            });
            
            if (!strategySignal || strategySignal.confidence < config.ml.minimumMLConfidence) {
                return null;
            }
            
            // 5. Risk assessment
            const riskAssessment = await RiskManagementEngine.assessTrade({
                symbol,
                signal: strategySignal,
                strategy: strategyName,
                marketData,
                technicalData: technicalAnalysis
            });
            
            if (riskAssessment.overallRisk === 'high' && riskAssessment.riskScore > 0.7) {
                console.log(`⚠️ High risk detected for ${strategyName} on ${symbol}, skipping`);
                return null;
            }
            
            // 6. Position sizing
            const positionSize = await RiskManagementEngine.calculateOptimalPositionSize({
                symbol,
                signal: strategySignal,
                riskAssessment,
                strategy: strategyName
            });
            
            // 7. Create execution record
            const execution = await this.createExecutionRecord({
                strategyName,
                symbol,
                timeframe,
                signal: strategySignal,
                technicalAnalysis,
                patternAnalysis,
                mlAnalysis,
                riskAssessment,
                positionSize,
                processingTime: Date.now() - startTime
            });
            
            return execution;
            
        } catch (error) {
            console.error(`❌ Error executing ${strategyName} strategy:`, error);
            throw error;
        }
    }
    
    /**
     * Get active strategies based on market conditions
     * @param {Object} marketData - Current market data
     * @returns {Array} Array of strategy names to execute
     */
    getActiveStrategies(marketData) {
        const strategies = [];
        
        // Determine market conditions
        const volatility = marketData.volatility || 0;
        const volume = marketData.volume24h || 0;
        const avgVolume = marketData.averageVolume || volume;
        const trend = marketData.trend || 'sideways';
        
        // High volatility conditions
        if (volatility > 0.03) { // 3%+ volatility
            strategies.push(...STRATEGY_PRIORITY.high_volatility);
        }
        // Low volatility conditions
        else if (volatility < 0.01) { // <1% volatility
            strategies.push(...STRATEGY_PRIORITY.low_volatility);
        }
        
        // Volume-based selection
        if (volume > avgVolume * 1.5) {
            strategies.push(...STRATEGY_PRIORITY.high_volume);
        } else if (volume < avgVolume * 0.7) {
            strategies.push(...STRATEGY_PRIORITY.low_volume);
        }
        
        // Trend-based selection
        if (trend === 'uptrend' || trend === 'downtrend') {
            strategies.push(...STRATEGY_PRIORITY.trending_market);
        } else {
            strategies.push(...STRATEGY_PRIORITY.sideways_market);
        }
        
        // Remove duplicates and limit concurrent strategies
        const uniqueStrategies = [...new Set(strategies)];
        
        // Ensure we don't exceed max concurrent strategies
        return uniqueStrategies.slice(0, STRATEGY_RISK_LIMITS.max_concurrent);
    }
    
    /**
     * Aggregate results from multiple strategies
     * @param {Array} results - Array of strategy results
     * @param {string} symbol - Trading symbol
     * @param {string} timeframe - Time timeframe
     * @returns {Promise<Object>} Aggregated results
     */
    async aggregateResults(results, symbol, timeframe) {
        if (!results || results.length === 0) {
            return {
                symbol,
                timeframe,
                recommendation: 'hold',
                confidence: 0,
                strategies: [],
                message: 'No trading opportunities found'
            };
        }
        
        // Sort by confidence
        results.sort((a, b) => b.signal.confidence - a.signal.confidence);
        
        // Calculate aggregate confidence
        const totalConfidence = results.reduce((sum, result) => sum + result.signal.confidence, 0);
        const averageConfidence = totalConfidence / results.length;
        
        // Determine consensus
        const buySignals = results.filter(r => r.signal.direction === 'buy').length;
        const sellSignals = results.filter(r => r.signal.direction === 'sell').length;
        
        let recommendation = 'hold';
        if (buySignals > sellSignals && averageConfidence > 0.6) {
            recommendation = 'buy';
        } else if (sellSignals > buySignals && averageConfidence > 0.6) {
            recommendation = 'sell';
        }
        
        // Calculate risk metrics
        const aggregateRisk = await this.calculateAggregateRisk(results);
        
        return {
            symbol,
            timeframe,
            recommendation,
            confidence: Math.round(averageConfidence * 100) / 100,
            aggregateRisk,
            strategies: results.map(r => ({
                name: r.strategyName,
                signal: r.signal.direction,
                confidence: r.signal.confidence,
                expectedReturn: r.signal.expectedReturn,
                riskLevel: r.riskMetrics.overallRisk
            })),
            topStrategy: results[0],
            timestamp: new Date(),
            executionCount: results.length
        };
    }
    
    /**
     * Calculate aggregate risk across multiple strategies
     * @param {Array} results - Strategy results
     * @returns {Promise<Object>} Aggregate risk metrics
     */
    async calculateAggregateRisk(results) {
        const riskLevels = results.map(r => r.riskMetrics.overallRisk);
        const varValues = results.map(r => r.riskMetrics.positionVaR || 0);
        
        // Calculate aggregate VaR (simple sum for now, could use correlation)
        const totalVaR = varValues.reduce((sum, var_) => sum + var_, 0);
        
        // Determine overall risk level
        const highRiskCount = riskLevels.filter(r => r === 'high').length;
        const mediumRiskCount = riskLevels.filter(r => r === 'medium').length;
        
        let overallRisk = 'low';
        if (highRiskCount > 0 || totalVaR > STRATEGY_CONFIG.global.maxPortfolioRisk) {
            overallRisk = 'high';
        } else if (mediumRiskCount > results.length / 2) {
            overallRisk = 'medium';
        }
        
        return {
            overallRisk,
            totalVaR,
            riskScore: totalVaR / STRATEGY_CONFIG.global.maxPortfolioRisk,
            strategyCount: results.length,
            recommendation: overallRisk === 'high' ? 'reduce_position_size' : 'proceed'
        };
    }
    
    /**
     * Create execution record in database
     * @param {Object} params - Execution parameters
     * @returns {Promise<Object>} Created execution record
     */
    async createExecutionRecord(params) {
        try {
            const executionId = `${params.strategyName}_${params.symbol}_${Date.now()}`;
            
            const execution = new StrategyExecution({
                executionId,
                strategyId: params.strategyName,
                strategyName: params.strategyName,
                symbol: params.symbol,
                timeframe: params.timeframe,
                
                signal: {
                    direction: params.signal.direction,
                    strength: params.signal.strength,
                    confidence: params.signal.confidence,
                    entryPrice: params.signal.entryPrice,
                    stopLoss: params.signal.stopLoss,
                    takeProfit: params.signal.takeProfit,
                    positionSize: params.positionSize
                },
                
                components: {
                    technical: params.technicalAnalysis,
                    pattern: params.patternAnalysis,
                    ml: params.mlAnalysis
                },
                
                riskMetrics: params.riskAssessment,
                
                performance: {
                    processingTime: params.processingTime
                },
                
                status: 'generated'
            });
            
            await execution.save();
            
            // Add to active executions
            this.activeExecutions.set(executionId, execution);
            
            return execution;
            
        } catch (error) {
            console.error('❌ Error creating execution record:', error);
            throw error;
        }
    }
    
    /**
     * Get market data for symbol and timeframe
     * @param {string} symbol - Trading symbol
     * @param {string} timeframe - Time timeframe
     * @returns {Promise<Object>} Market data
     */
    async getMarketData(symbol, timeframe) {
        try {
            // Crypto symbols for 24/7 testing
            const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'MATIC', 'AVAX', 'DOT'];
            const isCrypto = cryptoSymbols.some(crypto => symbol.toUpperCase().includes(crypto));
            
            // Mock data with realistic values based on symbol type
            let mockData;
            
            if (isCrypto) {
                // Crypto data - higher volatility
                mockData = {
                    symbol,
                    timeframe,
                    currentPrice: symbol.includes('BTC') ? 65000 + (Math.random() * 10000 - 5000) :
                                 symbol.includes('ETH') ? 3500 + (Math.random() * 1000 - 500) :
                                 symbol.includes('SOL') ? 140 + (Math.random() * 40 - 20) :
                                 symbol.includes('DOGE') ? 0.35 + (Math.random() * 0.1 - 0.05) :
                                 100 + (Math.random() * 50 - 25),
                    volume24h: 1000000000 + (Math.random() * 2000000000), // High volume for crypto
                    averageVolume: 800000000,
                    priceChange24h: (Math.random() * 10 - 5), // ±5% daily change
                    volatility: 0.03 + (Math.random() * 0.05), // 3-8% volatility
                    trend: Math.random() > 0.5 ? 'uptrend' : 'downtrend',
                    marketCap: 50000000000,
                    timestamp: new Date()
                };
            } else {
                // Indian stock data - lower volatility, market hours consideration
                const isMarketHours = this.isIndianMarketHours();
                mockData = {
                    symbol,
                    timeframe,
                    currentPrice: 1000 + (Math.random() * 500 - 250),
                    volume24h: isMarketHours ? 50000000 + (Math.random() * 100000000) : 5000000, // Lower volume when market closed
                    averageVolume: 40000000,
                    priceChange24h: (Math.random() * 4 - 2), // ±2% daily change
                    volatility: 0.015 + (Math.random() * 0.02), // 1.5-3.5% volatility
                    trend: Math.random() > 0.6 ? 'uptrend' : Math.random() > 0.3 ? 'downtrend' : 'sideways',
                    marketCap: 10000000000,
                    sector: ['Technology', 'Banking', 'Pharma', 'Auto', 'FMCG'][Math.floor(Math.random() * 5)],
                    timestamp: new Date(),
                    marketStatus: isMarketHours ? 'open' : 'closed'
                };
            }
            
            console.log(`📊 Mock market data for ${symbol}: Price=${mockData.currentPrice.toFixed(2)}, Vol=${(mockData.volume24h/1000000).toFixed(1)}M, Change=${mockData.priceChange24h.toFixed(2)}%`);
            return mockData;
            
        } catch (error) {
            console.error('❌ Error getting market data:', error);
            return null;
        }
    }
    
    /**
     * Check if Indian stock market is open
     * @returns {boolean} True if market is open
     */
    isIndianMarketHours() {
        const now = new Date();
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
        const hour = istTime.getHours();
        const minute = istTime.getMinutes();
        const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Market is closed on weekends
        if (day === 0 || day === 6) return false;
        
        // Market hours: 9:15 AM to 3:30 PM IST
        const marketOpen = (hour === 9 && minute >= 15) || hour > 9;
        const marketClose = hour < 15 || (hour === 15 && minute <= 30);
        
        return marketOpen && marketClose;
    }
    
    /**
     * Start background opportunity scanning
     */
    startOpportunityScanning() {
        const scanInterval = STRATEGY_CONFIG.global.opportunityScanInterval;
        
        this.opportunityScanner = setInterval(async () => {
            try {
                await this.scanForOpportunities();
            } catch (error) {
                console.error('❌ Error in opportunity scanning:', error);
            }
        }, scanInterval);
        
        console.log(`✅ Opportunity scanning started (every ${scanInterval}ms)`);
    }
    
    /**
     * Start background performance tracking
     */
    startPerformanceTracking() {
        const updateInterval = STRATEGY_CONFIG.global.performanceUpdateInterval;
        
        this.performanceTracker = setInterval(async () => {
            try {
                await this.updatePerformanceMetrics();
            } catch (error) {
                console.error('❌ Error in performance tracking:', error);
            }
        }, updateInterval);
        
        console.log(`✅ Performance tracking started (every ${updateInterval}ms)`);
    }
    
    /**
     * Scan for trading opportunities across all strategies
     */
    async scanForOpportunities() {
        try {
            // This would scan multiple symbols/timeframes
            // For now, implementing basic structure
            console.log('🔍 Scanning for trading opportunities...');
            
            // Scan implementation would go here
            // - Get list of symbols to monitor
            // - Run strategies on each symbol/timeframe
            // - Store opportunities in database
            
        } catch (error) {
            console.error('❌ Error scanning opportunities:', error);
        }
    }
    
    /**
     * Update performance metrics for all strategies
     */
    async updatePerformanceMetrics() {
        try {
            console.log('📊 Updating strategy performance metrics...');
            
            // Performance update implementation would go here
            // - Calculate returns for closed positions
            // - Update win rates, Sharpe ratios, etc.
            // - Store performance data
            
        } catch (error) {
            console.error('❌ Error updating performance:', error);
        }
    }
    
    /**
     * Stop all background processes
     */
    stopBackgroundProcesses() {
        if (this.opportunityScanner) {
            clearInterval(this.opportunityScanner);
            console.log('✅ Opportunity scanning stopped');
        }
        
        if (this.performanceTracker) {
            clearInterval(this.performanceTracker);
            console.log('✅ Performance tracking stopped');
        }
    }
    
    /**
     * Get available strategies
     * @returns {Array} List of available strategies
     */
    getAvailableStrategies() {
        return Array.from(this.strategies.keys()).map(strategyName => ({
            name: strategyName,
            displayName: STRATEGY_CONFIG[strategyName].name,
            timeframes: STRATEGY_CONFIG[strategyName].timeframes,
            active: true
        }));
    }
    
    /**
     * Analyze opportunity using the engine
     * @param {string} symbol - Trading symbol
     * @param {string} timeframe - Timeframe
     * @param {string} strategy - Strategy type (optional)
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeOpportunity(symbol, timeframe, strategy = null) {
        return await this.executeStrategy(symbol, timeframe, strategy);
    }
    
    /**
     * Get current opportunities
     * @returns {Promise<Array>} Current trading opportunities
     */
    async getCurrentOpportunities() {
        try {
            const opportunities = await TradingOpportunity.find({ 
                status: 'active',
                expiresAt: { $gt: new Date() }
            }).sort({ priority: -1, detectedAt: -1 }).limit(20);
            
            return opportunities;
        } catch (error) {
            console.error('❌ Error getting opportunities:', error);
            return [];
        }
    }
    
    /**
     * Get performance metrics
     * @param {string} strategyName - Strategy name (optional)
     * @returns {Promise<Object>} Performance metrics
     */
    async getPerformanceMetrics(strategyName = null) {
        try {
            const query = strategyName ? { strategyName } : {};
            const performance = await StrategyPerformance.find(query)
                .sort({ timestamp: -1 })
                .limit(10);
            
            return {
                strategies: performance,
                summary: {
                    totalStrategies: this.strategies.size,
                    activeExecutions: this.activeExecutions.size,
                    avgPerformance: performance.length > 0 ? 
                        performance.reduce((sum, p) => sum + (p.returnAnalysis?.totalReturn || 0), 0) / performance.length : 0
                }
            };
        } catch (error) {
            console.error('❌ Error getting performance metrics:', error);
            return { strategies: [], summary: {} };
        }
    }
    
    /**
     * Get risk metrics
     * @returns {Promise<Object>} Risk metrics
     */
    async getRiskMetrics() {
        try {
            const activeExecutions = Array.from(this.activeExecutions.values());
            const totalRisk = activeExecutions.reduce((sum, exec) => 
                sum + (exec.riskMetrics?.positionVaR || 0), 0);
            
            return {
                totalPortfolioRisk: totalRisk,
                maxAllowedRisk: STRATEGY_CONFIG.global.maxPortfolioRisk,
                riskUtilization: totalRisk / STRATEGY_CONFIG.global.maxPortfolioRisk,
                activePositions: activeExecutions.length,
                riskLevel: totalRisk > STRATEGY_CONFIG.global.maxPortfolioRisk * 0.8 ? 'high' : 
                          totalRisk > STRATEGY_CONFIG.global.maxPortfolioRisk * 0.5 ? 'medium' : 'low'
            };
        } catch (error) {
            console.error('❌ Error getting risk metrics:', error);
            return { totalPortfolioRisk: 0, riskLevel: 'unknown' };
        }
    }

    /**
     * Get strategy status and statistics
     * @returns {Object} Strategy engine status
     */
    getStatus() {
        return {
            strategiesLoaded: this.strategies.size,
            activeExecutions: this.activeExecutions.size,
            backgroundProcesses: {
                opportunityScanning: !!this.opportunityScanner,
                performanceTracking: !!this.performanceTracker
            },
            lastUpdate: new Date(),
            config: {
                maxConcurrentStrategies: STRATEGY_CONFIG.global.maxConcurrentStrategies,
                minConfidenceThreshold: STRATEGY_CONFIG.global.minConfidenceThreshold,
                maxPortfolioRisk: STRATEGY_CONFIG.global.maxPortfolioRisk
            }
        };
    }
}

module.exports = TradingStrategiesEngine;
