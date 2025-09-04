// dashboard-backend/src/services/live/performanceAnalyzer.js
/**
 * Performance Analyzer - Phase 3A Step 8
 * Live win rates, Sharpe ratios, drawdown monitoring, and strategy optimization
 */

const { EventEmitter } = require('events');
const moment = require('moment');
const { LivePerformance, TradeExecution, PortfolioPosition } = require('../../models/tradeExecutionModel');

class PerformanceAnalyzer extends EventEmitter {
    constructor({ liveConfig }) {
        super();
        
        this.liveConfig = liveConfig;
        this.sessionId = null;
        
        // Performance metrics cache
        this.liveMetrics = {
            totalReturn: 0,
            totalReturnPercent: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
            winRate: 0,
            profitFactor: 0,
            averageWin: 0,
            averageLoss: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0
        };
        
        // Strategy-specific performance
        this.strategyMetrics = new Map();
        
        // Historical performance data
        this.performanceHistory = [];
        this.drawdownHistory = [];
        
        // Risk-free rate for Sharpe ratio (annualized)
        this.riskFreeRate = 0.05; // 5% risk-free rate
        
        console.log('📊 Performance Analyzer initialized');
    }

    /**
     * Initialize performance analyzer for a trading session
     */
    async initializeSession(sessionId) {
        try {
            this.sessionId = sessionId;
            
            // Load existing performance data
            await this.loadExistingPerformance();
            
            // Start real-time performance tracking
            this.startRealTimeTracking();
            
            console.log(`📊 Performance tracking initialized for session: ${sessionId}`);
            
            return { success: true, sessionId };
            
        } catch (error) {
            console.error('❌ Failed to initialize performance analyzer:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load existing performance data from database
     */
    async loadExistingPerformance() {
        try {
            // Load trade executions
            const trades = await TradeExecution.find({ sessionId: this.sessionId });
            
            // Load portfolio positions
            const positions = await PortfolioPosition.find({ sessionId: this.sessionId });
            
            // Calculate current metrics
            await this.calculateLiveMetrics(trades, positions);
            
            // Load historical performance records
            const historicalPerformance = await LivePerformance.find({ 
                sessionId: this.sessionId 
            }).sort({ periodStart: 1 });
            
            this.performanceHistory = historicalPerformance;
            
            console.log(`📈 Loaded ${trades.length} trades and ${positions.length} positions`);
            
        } catch (error) {
            console.error('❌ Error loading existing performance:', error);
        }
    }

    /**
     * Calculate live performance metrics
     */
    async calculateLiveMetrics(trades = null, positions = null) {
        try {
            // Load data if not provided
            if (!trades) {
                trades = await TradeExecution.find({ sessionId: this.sessionId });
            }
            if (!positions) {
                positions = await PortfolioPosition.find({ sessionId: this.sessionId });
            }
            
            // Calculate basic trading metrics
            const completedTrades = trades.filter(trade => trade.status === 'executed');
            const openPositions = positions.filter(pos => pos.status === 'open');
            const closedPositions = positions.filter(pos => pos.status === 'closed');
            
            // Trading performance
            const totalTrades = completedTrades.length;
            const winningTrades = closedPositions.filter(pos => pos.realizedPnL > 0).length;
            const losingTrades = closedPositions.filter(pos => pos.realizedPnL < 0).length;
            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
            
            // P&L calculations
            const realizedPnL = closedPositions.reduce((sum, pos) => sum + (pos.realizedPnL || 0), 0);
            const unrealizedPnL = openPositions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0);
            const totalReturn = realizedPnL + unrealizedPnL;
            
            // Get initial capital from session
            const initialCapital = 100000; // Will be loaded from session
            const totalReturnPercent = (totalReturn / initialCapital) * 100;
            
            // Profit/Loss analysis
            const grossProfit = closedPositions.filter(pos => pos.realizedPnL > 0)
                .reduce((sum, pos) => sum + pos.realizedPnL, 0);
            const grossLoss = Math.abs(closedPositions.filter(pos => pos.realizedPnL < 0)
                .reduce((sum, pos) => sum + pos.realizedPnL, 0));
            
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
            const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
            const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
            
            // Drawdown calculation
            const { maxDrawdown, currentDrawdown } = this.calculateDrawdown(closedPositions);
            
            // Risk-adjusted returns
            const sharpeRatio = this.calculateSharpeRatio(closedPositions, initialCapital);
            const sortinoRatio = this.calculateSortinoRatio(closedPositions, initialCapital);
            
            // Update live metrics
            this.liveMetrics = {
                totalReturn,
                totalReturnPercent,
                sharpeRatio,
                sortinoRatio,
                maxDrawdown,
                currentDrawdown,
                winRate,
                profitFactor,
                averageWin,
                averageLoss,
                totalTrades,
                winningTrades,
                losingTrades,
                grossProfit,
                grossLoss,
                realizedPnL,
                unrealizedPnL,
                openPositions: openPositions.length,
                closedPositions: closedPositions.length
            };
            
            // Calculate strategy-specific metrics
            await this.calculateStrategyMetrics(positions);
            
            // Emit metrics update
            this.emit('metricsUpdated', this.liveMetrics);
            
        } catch (error) {
            console.error('❌ Error calculating live metrics:', error);
        }
    }

    /**
     * Calculate strategy-specific performance metrics
     */
    async calculateStrategyMetrics(positions) {
        const strategies = [...new Set(positions.map(pos => pos.strategy))];
        
        for (const strategy of strategies) {
            const strategyPositions = positions.filter(pos => pos.strategy === strategy);
            const closedPositions = strategyPositions.filter(pos => pos.status === 'closed');
            
            if (closedPositions.length > 0) {
                const totalTrades = closedPositions.length;
                const winningTrades = closedPositions.filter(pos => pos.realizedPnL > 0).length;
                const winRate = (winningTrades / totalTrades) * 100;
                const profit = closedPositions.reduce((sum, pos) => sum + (pos.realizedPnL || 0), 0);
                
                // Calculate strategy Sharpe ratio
                const returns = closedPositions.map(pos => (pos.realizedPnL / pos.investedAmount));
                const sharpeRatio = this.calculateSharpeRatioFromReturns(returns);
                
                this.strategyMetrics.set(strategy, {
                    strategy,
                    trades: totalTrades,
                    winRate,
                    profit,
                    sharpeRatio,
                    averageReturn: returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0,
                    bestTrade: Math.max(...closedPositions.map(pos => pos.realizedPnL)),
                    worstTrade: Math.min(...closedPositions.map(pos => pos.realizedPnL))
                });
            }
        }
    }

    /**
     * Calculate maximum drawdown and current drawdown
     */
    calculateDrawdown(positions) {
        if (positions.length === 0) {
            return { maxDrawdown: 0, currentDrawdown: 0 };
        }
        
        // Sort positions by close time
        const sortedPositions = positions
            .filter(pos => pos.closeTime)
            .sort((a, b) => new Date(a.closeTime) - new Date(b.closeTime));
        
        let peak = 0;
        let maxDrawdown = 0;
        let currentValue = 0;
        
        for (const position of sortedPositions) {
            currentValue += position.realizedPnL || 0;
            
            if (currentValue > peak) {
                peak = currentValue;
            }
            
            const drawdown = (peak - currentValue) / peak * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        
        const currentDrawdown = peak > 0 ? (peak - currentValue) / peak * 100 : 0;
        
        return { maxDrawdown, currentDrawdown };
    }

    /**
     * Calculate Sharpe ratio
     */
    calculateSharpeRatio(positions, initialCapital) {
        if (positions.length < 2) return 0;
        
        const returns = positions.map(pos => (pos.realizedPnL / pos.investedAmount));
        return this.calculateSharpeRatioFromReturns(returns);
    }

    /**
     * Calculate Sharpe ratio from returns array
     */
    calculateSharpeRatioFromReturns(returns) {
        if (returns.length < 2) return 0;
        
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
        const standardDeviation = Math.sqrt(variance);
        
        if (standardDeviation === 0) return 0;
        
        // Annualize the Sharpe ratio (assuming daily returns)
        const annualizedReturn = meanReturn * 252; // 252 trading days
        const annualizedStdDev = standardDeviation * Math.sqrt(252);
        
        return (annualizedReturn - this.riskFreeRate) / annualizedStdDev;
    }

    /**
     * Calculate Sortino ratio (downside deviation)
     */
    calculateSortinoRatio(positions, initialCapital) {
        if (positions.length < 2) return 0;
        
        const returns = positions.map(pos => (pos.realizedPnL / pos.investedAmount));
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        
        // Calculate downside deviation
        const downsideReturns = returns.filter(ret => ret < 0);
        if (downsideReturns.length === 0) return Infinity;
        
        const downsideVariance = downsideReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / downsideReturns.length;
        const downsideDeviation = Math.sqrt(downsideVariance);
        
        if (downsideDeviation === 0) return 0;
        
        // Annualize the Sortino ratio
        const annualizedReturn = meanReturn * 252;
        const annualizedDownsideStdDev = downsideDeviation * Math.sqrt(252);
        
        return (annualizedReturn - this.riskFreeRate) / annualizedDownsideStdDev;
    }

    /**
     * Start real-time performance tracking
     */
    startRealTimeTracking() {
        console.log('📊 Starting real-time performance tracking...');
        
        // Update metrics every 5 seconds
        this.trackingInterval = setInterval(async () => {
            await this.calculateLiveMetrics();
        }, this.liveConfig.PERFORMANCE.UPDATE_INTERVAL);
        
        // Generate performance reports every minute
        this.reportingInterval = setInterval(async () => {
            await this.generatePerformanceReport();
        }, this.liveConfig.PERFORMANCE.METRICS_CALCULATION);
        
        this.emit('trackingStarted');
    }

    /**
     * Stop real-time performance tracking
     */
    stopRealTimeTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        
        if (this.reportingInterval) {
            clearInterval(this.reportingInterval);
            this.reportingInterval = null;
        }
        
        console.log('⏹️ Real-time performance tracking stopped');
        this.emit('trackingStopped');
    }

    /**
     * Generate comprehensive performance report
     */
    async generatePerformanceReport() {
        try {
            const now = new Date();
            const reportPeriod = 60000; // 1 minute
            const periodStart = new Date(now.getTime() - reportPeriod);
            
            // Create performance record
            const performanceRecord = new LivePerformance({
                performanceId: `perf_${this.sessionId}_${now.getTime()}`,
                sessionId: this.sessionId,
                periodStart,
                periodEnd: now,
                
                // Portfolio metrics
                startingCapital: 100000, // Will be loaded from session
                endingCapital: 100000 + this.liveMetrics.totalReturn,
                totalReturn: this.liveMetrics.totalReturn,
                totalReturnPercentage: this.liveMetrics.totalReturnPercent,
                
                // Trading metrics
                totalTrades: this.liveMetrics.totalTrades,
                winningTrades: this.liveMetrics.winningTrades,
                losingTrades: this.liveMetrics.losingTrades,
                winRate: this.liveMetrics.winRate,
                
                // Profit/Loss metrics
                grossProfit: this.liveMetrics.grossProfit,
                grossLoss: this.liveMetrics.grossLoss,
                netProfit: this.liveMetrics.totalReturn,
                profitFactor: this.liveMetrics.profitFactor,
                
                // Risk metrics
                maxDrawdown: this.liveMetrics.maxDrawdown,
                maxDrawdownPercentage: this.liveMetrics.maxDrawdown,
                sharpeRatio: this.liveMetrics.sharpeRatio,
                sortinoRatio: this.liveMetrics.sortinoRatio,
                
                // Execution metrics
                averageTradeReturn: this.liveMetrics.totalTrades > 0 ? 
                    this.liveMetrics.totalReturn / this.liveMetrics.totalTrades : 0,
                averageWinReturn: this.liveMetrics.averageWin,
                averageLossReturn: -this.liveMetrics.averageLoss,
                largestWin: this.liveMetrics.averageWin * 3, // Placeholder
                largestLoss: -this.liveMetrics.averageLoss * 3, // Placeholder
                
                // Strategy breakdown
                strategyPerformance: Array.from(this.strategyMetrics.values()),
                
                // Execution quality (placeholders)
                averageSlippage: 0.05,
                averageCommission: 5.0,
                averageLatency: 100
            });
            
            // Save to database
            await performanceRecord.save();
            
            // Add to history
            this.performanceHistory.push(performanceRecord);
            
            // Keep only last 100 records in memory
            if (this.performanceHistory.length > 100) {
                this.performanceHistory.shift();
            }
            
            // Emit performance report
            this.emit('performanceReport', performanceRecord);
            
        } catch (error) {
            console.error('❌ Error generating performance report:', error);
        }
    }

    /**
     * Get current live metrics
     */
    getLiveMetrics() {
        return {
            ...this.liveMetrics,
            strategyMetrics: Array.from(this.strategyMetrics.values()),
            lastUpdated: new Date()
        };
    }

    /**
     * Get performance history
     */
    getPerformanceHistory(limit = 50) {
        return this.performanceHistory.slice(-limit);
    }

    /**
     * Get strategy comparison
     */
    getStrategyComparison() {
        const strategies = Array.from(this.strategyMetrics.values());
        
        return strategies.map(strategy => ({
            ...strategy,
            rank: this.calculateStrategyRank(strategy),
            efficiency: this.calculateStrategyEfficiency(strategy)
        })).sort((a, b) => b.rank - a.rank);
    }

    /**
     * Calculate strategy rank based on multiple factors
     */
    calculateStrategyRank(strategy) {
        const winRateWeight = 0.3;
        const profitWeight = 0.4;
        const sharpeWeight = 0.3;
        
        const normalizedWinRate = strategy.winRate / 100;
        const normalizedProfit = Math.max(-1, Math.min(1, strategy.profit / 10000)); // Normalize to [-1, 1]
        const normalizedSharpe = Math.max(-1, Math.min(1, strategy.sharpeRatio / 3)); // Normalize to [-1, 1]
        
        return (normalizedWinRate * winRateWeight) + 
               (normalizedProfit * profitWeight) + 
               (normalizedSharpe * sharpeWeight);
    }

    /**
     * Calculate strategy efficiency
     */
    calculateStrategyEfficiency(strategy) {
        if (strategy.trades === 0) return 0;
        
        // Profit per trade adjusted for risk
        const profitPerTrade = strategy.profit / strategy.trades;
        const riskAdjustedReturn = strategy.sharpeRatio > 0 ? profitPerTrade * strategy.sharpeRatio : profitPerTrade;
        
        return riskAdjustedReturn;
    }

    /**
     * Get risk analysis
     */
    getRiskAnalysis() {
        return {
            maxDrawdown: this.liveMetrics.maxDrawdown,
            currentDrawdown: this.liveMetrics.currentDrawdown,
            sharpeRatio: this.liveMetrics.sharpeRatio,
            sortinoRatio: this.liveMetrics.sortinoRatio,
            volatility: this.calculateVolatility(),
            riskLevel: this.assessRiskLevel(),
            recommendations: this.generateRiskRecommendations()
        };
    }

    /**
     * Calculate portfolio volatility
     */
    calculateVolatility() {
        if (this.performanceHistory.length < 2) return 0;
        
        const returns = this.performanceHistory.map(record => record.totalReturnPercentage);
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    /**
     * Assess current risk level
     */
    assessRiskLevel() {
        const drawdown = this.liveMetrics.currentDrawdown;
        const volatility = this.calculateVolatility();
        
        if (drawdown > 15 || volatility > 20) return 'HIGH';
        if (drawdown > 8 || volatility > 12) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Generate risk management recommendations
     */
    generateRiskRecommendations() {
        const recommendations = [];
        
        if (this.liveMetrics.currentDrawdown > 10) {
            recommendations.push('Consider reducing position sizes due to high drawdown');
        }
        
        if (this.liveMetrics.winRate < 40) {
            recommendations.push('Review strategy parameters - win rate below 40%');
        }
        
        if (this.liveMetrics.sharpeRatio < 0.5) {
            recommendations.push('Risk-adjusted returns are low - consider strategy optimization');
        }
        
        return recommendations;
    }

    /**
     * Get performance summary for dashboard
     */
    getPerformanceSummary() {
        return {
            overview: {
                totalReturn: this.liveMetrics.totalReturn,
                totalReturnPercent: this.liveMetrics.totalReturnPercent,
                winRate: this.liveMetrics.winRate,
                totalTrades: this.liveMetrics.totalTrades,
                sharpeRatio: this.liveMetrics.sharpeRatio
            },
            risk: this.getRiskAnalysis(),
            strategies: this.getStrategyComparison(),
            timestamp: new Date()
        };
    }

    /**
     * Calculate metrics from trades array for testing
     */
    calculateMetricsFromTrades(trades, initialCapital) {
        if (!trades || trades.length === 0) {
            return {
                totalReturnPercent: 0,
                winRate: 0,
                totalTrades: 0,
                totalReturn: 0
            };
        }

        const totalReturn = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
        const winRate = (winningTrades.length / trades.length) * 100;
        
        return {
            totalReturn,
            totalReturnPercent: (totalReturn / initialCapital) * 100,
            winRate,
            totalTrades: trades.length,
            averageWin: winningTrades.length > 0 ? 
                winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length : 0,
            averageLoss: trades.length - winningTrades.length > 0 ? 
                trades.filter(trade => trade.pnl <= 0).reduce((sum, trade) => sum + trade.pnl, 0) / (trades.length - winningTrades.length) : 0
        };
    }

    /**
     * Calculate Sharpe ratio from daily returns
     */
    calculateSharpeRatio(dailyReturns) {
        if (!dailyReturns || dailyReturns.length < 2) return 0;
        
        const avgReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length;
        const stdDev = Math.sqrt(variance);
        
        return stdDev > 0 ? avgReturn / stdDev : 0;
    }

    /**
     * Calculate maximum drawdown from equity curve
     */
    calculateMaxDrawdown(equityCurve) {
        if (!equityCurve || equityCurve.length < 2) return 0;
        
        let maxDrawdown = 0;
        let peak = equityCurve[0];
        
        for (let i = 1; i < equityCurve.length; i++) {
            if (equityCurve[i] > peak) {
                peak = equityCurve[i];
            } else {
                const drawdown = ((peak - equityCurve[i]) / peak) * 100;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        }
        
        return maxDrawdown;
    }
}

module.exports = PerformanceAnalyzer;
