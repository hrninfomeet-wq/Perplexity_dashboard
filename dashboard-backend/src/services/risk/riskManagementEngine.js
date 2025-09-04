// dashboard-backend/src/services/risk/riskManagementEngine.js
/**
 * Risk Management Engine - Phase 3A Step 6
 * Comprehensive risk assessment, position sizing, and portfolio management
 * Integrates with Phase 3A Step 5 ML Signal Enhancement
 */

const math = require('mathjs');
const stats = require('simple-statistics');
const _ = require('lodash');
const moment = require('moment');
const { Matrix } = require('ml-matrix');
const financial = require('financial');

const riskConfig = require('../../config/risk.config');

class RiskManagementEngine {
    constructor() {
        this.config = riskConfig;
        this.cache = new Map();
        this.correlationMatrix = new Map();
        this.volatilityCache = new Map();
    }

    /**
     * Calculate Value at Risk (VaR) for a position or portfolio
     * @param {Object} options - VaR calculation options
     * @returns {Object} VaR calculation results
     */
    async calculateVaR(options) {
        const startTime = Date.now();
        
        try {
            const {
                prices,
                confidenceLevel = this.config.var.defaultConfidence,
                timeHorizon = this.config.var.defaultTimeHorizon,
                method = 'historical'
            } = options;

            // Calculate returns
            const returns = this.calculateReturns(prices);
            
            let var95, cvar;
            
            switch (method) {
                case 'historical':
                    var95 = this.historicalVaR(returns, confidenceLevel);
                    cvar = this.conditionalVaR(returns, confidenceLevel);
                    break;
                    
                case 'parametric':
                    var95 = this.parametricVaR(returns, confidenceLevel);
                    cvar = this.parametricCVaR(returns, confidenceLevel);
                    break;
                    
                case 'montecarlo':
                    const simulation = this.monteCarloVaR(returns, confidenceLevel);
                    var95 = simulation.var;
                    cvar = simulation.cvar;
                    break;
                    
                default:
                    var95 = this.historicalVaR(returns, confidenceLevel);
                    cvar = this.conditionalVaR(returns, confidenceLevel);
            }

            // Adjust for time horizon
            const timeAdjustedVaR = var95 * Math.sqrt(timeHorizon);
            const timeAdjustedCVaR = cvar * Math.sqrt(timeHorizon);

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                data: {
                    var: {
                        percentage: timeAdjustedVaR,
                        confidenceLevel,
                        timeHorizon,
                        method
                    },
                    cvar: {
                        percentage: timeAdjustedCVaR,
                        confidenceLevel
                    },
                    volatility: stats.standardDeviation(returns),
                    processingTime
                }
            };

        } catch (error) {
            console.error('VaR calculation error:', error);
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackVaR()
            };
        }
    }

    /**
     * Calculate optimal position size using enhanced Kelly Criterion
     * @param {Object} trade - Trade information with ML analysis
     * @returns {Object} Position sizing recommendation
     */
    async calculatePositionSize(trade) {
        const startTime = Date.now();
        
        try {
            const {
                symbol,
                entryPrice,
                stopLoss,
                takeProfit,
                winProbability,
                mlAnalysis,
                portfolioValue,
                maxRisk = 0.02 // 2% max risk per trade
            } = trade;

            // Calculate basic Kelly fraction
            const winRate = winProbability || 0.6; // Default 60% if not provided
            const avgWin = Math.abs(takeProfit - entryPrice) / entryPrice;
            const avgLoss = Math.abs(entryPrice - stopLoss) / entryPrice;
            
            const kellyFraction = this.calculateKellyFraction(winRate, avgWin, avgLoss);
            
            // Apply conservative scaling
            const conservativeKelly = kellyFraction * this.config.positionSizing.kelly.conservativeScaling;
            
            // ML enhancement
            let finalFraction = conservativeKelly;
            let mlEnhancement = false;
            let confidenceAdjustment = 1.0;
            
            if (mlAnalysis && mlAnalysis.confidence >= this.config.positionSizing.kelly.mlConfidenceThreshold) {
                mlEnhancement = true;
                confidenceAdjustment = this.calculateMLAdjustment(mlAnalysis);
                finalFraction = conservativeKelly * confidenceAdjustment;
            }
            
            // Apply position limits
            finalFraction = Math.min(finalFraction, this.config.positionSizing.kelly.maxFraction);
            finalFraction = Math.max(finalFraction, this.config.positionSizing.kelly.minFraction);
            
            // Calculate dollar amounts
            const dollarAmount = portfolioValue * finalFraction;
            const shares = Math.floor(dollarAmount / entryPrice);
            const actualDollarAmount = shares * entryPrice;
            const actualFraction = actualDollarAmount / portfolioValue;

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                data: {
                    kellyFraction,
                    conservativeScaling: this.config.positionSizing.kelly.conservativeScaling,
                    finalFraction,
                    dollarAmount: actualDollarAmount,
                    shares,
                    positionPercent: actualFraction * 100,
                    mlEnhancement,
                    mlConfidence: mlAnalysis?.confidence || null,
                    confidenceAdjustment,
                    maxLoss: actualDollarAmount * avgLoss,
                    riskRewardRatio: avgWin / avgLoss,
                    processingTime
                }
            };

        } catch (error) {
            console.error('Position sizing error:', error);
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackPositionSize(trade)
            };
        }
    }

    /**
     * Analyze portfolio risk and diversification
     * @param {Object} portfolio - Portfolio positions and data
     * @returns {Object} Portfolio risk analysis
     */
    async analyzePortfolioRisk(portfolio) {
        const startTime = Date.now();
        
        try {
            const { positions, totalValue } = portfolio;
            
            // Calculate individual position metrics
            const positionMetrics = await Promise.all(
                positions.map(position => this.calculatePositionMetrics(position))
            );
            
            // Build correlation matrix
            const correlationMatrix = await this.buildCorrelationMatrix(
                positions.map(p => p.symbol)
            );
            
            // Calculate portfolio VaR
            const portfolioVaR = await this.calculatePortfolioVaR(
                positionMetrics,
                correlationMatrix,
                totalValue
            );
            
            // Diversification analysis
            const diversification = this.analyzeDiversification(
                positionMetrics,
                correlationMatrix
            );
            
            // Risk compliance check
            const compliance = this.checkRiskCompliance(portfolio, portfolioVaR);
            
            // Generate optimization suggestions
            const optimization = this.generateOptimizationSuggestions(
                positionMetrics,
                correlationMatrix,
                compliance
            );

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                data: {
                    portfolioMetrics: {
                        totalValue,
                        positionCount: positions.length,
                        portfolioVaR,
                        volatility: this.calculatePortfolioVolatility(positionMetrics, correlationMatrix),
                        expectedReturn: this.calculateExpectedReturn(positionMetrics),
                        sharpeRatio: this.calculateSharpeRatio(positionMetrics, correlationMatrix)
                    },
                    diversification,
                    compliance,
                    optimization,
                    processingTime
                }
            };

        } catch (error) {
            console.error('Portfolio risk analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate dynamic stop-loss and take-profit levels
     * @param {Object} trade - Trade information with ML analysis
     * @returns {Object} Risk control recommendations
     */
    async generateRiskControls(trade) {
        const startTime = Date.now();
        
        try {
            const {
                symbol,
                entryPrice,
                mlAnalysis,
                marketConditions,
                historicalVolatility
            } = trade;

            // Calculate volatility-based stop-loss
            const volatility = historicalVolatility || await this.getVolatility(symbol);
            const volatilityStopLoss = this.calculateVolatilityBasedStopLoss(volatility);
            
            // ML-enhanced stop-loss
            let stopLossPercentage = volatilityStopLoss;
            let takeProfitPercentage = volatilityStopLoss * 2; // 2:1 ratio default
            
            if (mlAnalysis && mlAnalysis.confidence >= 0.7) {
                // Adjust based on ML confidence
                const confidence = mlAnalysis.confidence;
                
                if (confidence >= 0.8) {
                    // High confidence: wider stop-loss, higher take-profit
                    stopLossPercentage = Math.max(volatilityStopLoss, this.config.riskControls.stopLoss.mlBased.highConfidence);
                    takeProfitPercentage = stopLossPercentage * 2.5;
                } else {
                    // Medium confidence: tighter stop-loss
                    stopLossPercentage = Math.min(volatilityStopLoss, this.config.riskControls.stopLoss.mlBased.lowConfidence);
                    takeProfitPercentage = stopLossPercentage * 2;
                }
                
                // Use ML price prediction if available
                if (mlAnalysis.pricePrediction) {
                    const predictedPrice = mlAnalysis.pricePrediction.predictedPrice;
                    const direction = mlAnalysis.overallSignal;
                    
                    if (direction === 'BUY' && predictedPrice > entryPrice) {
                        takeProfitPercentage = Math.max(takeProfitPercentage, (predictedPrice - entryPrice) / entryPrice * 0.8);
                    } else if (direction === 'SELL' && predictedPrice < entryPrice) {
                        takeProfitPercentage = Math.max(takeProfitPercentage, (entryPrice - predictedPrice) / entryPrice * 0.8);
                    }
                }
            }
            
            const stopLossPrice = entryPrice * (1 - stopLossPercentage);
            const takeProfitPrice = entryPrice * (1 + takeProfitPercentage);

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                data: {
                    stopLoss: {
                        percentage: stopLossPercentage,
                        price: stopLossPrice,
                        reasoning: mlAnalysis ? 'ML-enhanced volatility-based' : 'Volatility-based',
                        dynamicallyAdjusted: true
                    },
                    takeProfit: {
                        percentage: takeProfitPercentage,
                        price: takeProfitPrice,
                        reasoning: mlAnalysis ? 'ML prediction-based with 2:1 ratio' : '2:1 risk-reward ratio',
                        mlBased: !!mlAnalysis
                    },
                    riskRewardRatio: takeProfitPercentage / stopLossPercentage,
                    maxLoss: entryPrice * stopLossPercentage,
                    processingTime
                }
            };

        } catch (error) {
            console.error('Risk controls generation error:', error);
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackRiskControls(trade)
            };
        }
    }

    // Helper Methods

    calculateReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        return returns;
    }

    historicalVaR(returns, confidenceLevel) {
        const sortedReturns = returns.slice().sort((a, b) => a - b);
        const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
        return Math.abs(sortedReturns[index]);
    }

    conditionalVaR(returns, confidenceLevel) {
        const var95 = this.historicalVaR(returns, confidenceLevel);
        const tailReturns = returns.filter(r => r <= -var95);
        return tailReturns.length > 0 ? Math.abs(stats.mean(tailReturns)) : var95;
    }

    parametricVaR(returns, confidenceLevel) {
        const mean = stats.mean(returns);
        const std = stats.standardDeviation(returns);
        const zScore = this.getZScore(confidenceLevel);
        return Math.abs(mean - zScore * std);
    }

    calculateKellyFraction(winRate, avgWin, avgLoss) {
        if (avgLoss === 0) return 0;
        const b = avgWin / avgLoss; // Win/loss ratio
        const p = winRate;
        const q = 1 - winRate;
        return (b * p - q) / b;
    }

    calculateMLAdjustment(mlAnalysis) {
        const confidence = mlAnalysis.confidence;
        const enhancement = this.config.positionSizing.mlEnhancement;
        
        let multiplier;
        if (confidence >= 0.8) {
            multiplier = enhancement.confidenceMultiplier.high;
        } else if (confidence >= 0.6) {
            multiplier = enhancement.confidenceMultiplier.medium;
        } else {
            multiplier = enhancement.confidenceMultiplier.low;
        }
        
        // Ensemble bonus
        if (mlAnalysis.ensembleScore && mlAnalysis.ensembleScore >= 0.8) {
            multiplier += enhancement.ensembleBonus;
        }
        
        // Apply limits
        return Math.min(Math.max(multiplier, enhancement.minEnhancement), enhancement.maxEnhancement);
    }

    calculateVolatilityBasedStopLoss(volatility) {
        const multiplier = this.config.riskControls.stopLoss.volatilityBased.multiplier;
        const stopLoss = volatility * multiplier;
        
        return Math.min(
            Math.max(stopLoss, this.config.riskControls.stopLoss.volatilityBased.minStopLoss),
            this.config.riskControls.stopLoss.volatilityBased.maxStopLoss
        );
    }

    async getVolatility(symbol) {
        // Cache volatility calculations
        if (this.volatilityCache.has(symbol)) {
            const cached = this.volatilityCache.get(symbol);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes
                return cached.volatility;
            }
        }
        
        // Calculate volatility (placeholder - would integrate with price data)
        const volatility = this.config.errorHandling.fallbacks.defaultVolatility;
        this.volatilityCache.set(symbol, { volatility, timestamp: Date.now() });
        
        return volatility;
    }

    getZScore(confidenceLevel) {
        const zScores = {
            0.90: 1.282,
            0.95: 1.645,
            0.99: 2.326,
            0.995: 2.576,
            0.999: 3.090
        };
        return zScores[confidenceLevel] || 1.645;
    }

    getFallbackVaR() {
        return {
            var: { percentage: 0.02, confidenceLevel: 0.95 },
            cvar: { percentage: 0.03 },
            volatility: this.config.errorHandling.fallbacks.defaultVolatility
        };
    }

    getFallbackPositionSize(trade) {
        const { portfolioValue, maxRisk = 0.02 } = trade;
        return {
            finalFraction: maxRisk,
            dollarAmount: portfolioValue * maxRisk,
            shares: Math.floor(portfolioValue * maxRisk / trade.entryPrice),
            reasoning: 'Fallback: 2% max risk'
        };
    }

    getFallbackRiskControls(trade) {
        const { entryPrice } = trade;
        const stopLossPercentage = this.config.riskControls.stopLoss.default;
        const takeProfitPercentage = this.config.riskControls.takeProfit.default;
        
        return {
            stopLoss: {
                percentage: stopLossPercentage,
                price: entryPrice * (1 - stopLossPercentage),
                reasoning: 'Fallback: Default 2% stop-loss'
            },
            takeProfit: {
                percentage: takeProfitPercentage,
                price: entryPrice * (1 + takeProfitPercentage),
                reasoning: 'Fallback: Default 4% take-profit'
            },
            riskRewardRatio: 2
        };
    }

    // Additional helper methods for portfolio analysis would be implemented here
    async calculatePositionMetrics(position) {
        // Implementation for individual position risk metrics
        return {
            symbol: position.symbol,
            weight: position.weight,
            volatility: await this.getVolatility(position.symbol),
            beta: position.beta || 1,
            expectedReturn: 0.1 // Placeholder
        };
    }

    async buildCorrelationMatrix(symbols) {
        // Implementation for correlation matrix calculation
        // This would integrate with historical price data
        return new Matrix.zeros(symbols.length, symbols.length);
    }

    async calculatePortfolioVaR(positions, correlationMatrix, totalValue) {
        // Implementation for portfolio-level VaR calculation
        return {
            amount: totalValue * 0.02,
            percentage: 0.02,
            confidenceLevel: 0.95,
            timeHorizon: 1
        };
    }
}

module.exports = RiskManagementEngine;
