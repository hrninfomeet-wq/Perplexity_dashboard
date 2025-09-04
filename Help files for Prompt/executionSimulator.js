// dashboard-backend/src/services/live/executionSimulator.js
/**
 * Execution Simulator - Phase 3A Step 8
 * Realistic paper trading execution with slippage, commission, and market impact modeling
 */

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { LIVE_CONFIG } = require('../../config/live.config');

class ExecutionSimulator {
    constructor({ riskManager, initialCapital = 100000 }) {
        this.riskManager = riskManager;
        this.initialCapital = initialCapital;
        this.currentCapital = initialCapital;
        
        // Execution tracking
        this.executedTrades = new Map();
        this.executionQueue = [];
        
        // Market impact modeling
        this.marketImpactFactors = {
            low: 0.0005,    // 0.05% market impact
            medium: 0.001,  // 0.1% market impact
            high: 0.002     // 0.2% market impact
        };
        
        // Slippage modeling based on market conditions
        this.slippageModel = {
            crypto: {
                low: 0.0005,     // 0.05% slippage
                medium: 0.001,   // 0.1% slippage
                high: 0.002      // 0.2% slippage
            },
            nse: {
                low: 0.0002,     // 0.02% slippage
                medium: 0.0005,  // 0.05% slippage
                high: 0.001      // 0.1% slippage
            }
        };
        
        console.log('🎯 Execution Simulator initialized with $' + initialCapital.toLocaleString());
    }

    /**
     * Execute a simulated trade with realistic market conditions
     */
    async executeTrade(tradeRequest) {
        try {
            const {
                strategy,
                symbol,
                signal,
                quantity,
                dollarAmount,
                confidence,
                expectedReturn,
                riskMetrics
            } = tradeRequest;

            const tradeId = uuidv4();
            const timestamp = new Date();
            
            console.log(`📈 Executing ${signal} trade: ${symbol} - $${dollarAmount.toFixed(2)}`);
            
            // Get current market price (simulated with realistic price action)
            const currentPrice = await this.getCurrentMarketPrice(symbol);
            
            if (!currentPrice) {
                return {
                    success: false,
                    error: 'Unable to get current market price',
                    tradeId
                };
            }
            
            // Calculate execution details
            const executionDetails = this.calculateExecutionDetails(
                symbol,
                signal,
                currentPrice,
                quantity,
                dollarAmount,
                strategy
            );
            
            // Check if we have sufficient capital
            if (dollarAmount > this.currentCapital * LIVE_CONFIG.RISK_LIMITS.MAX_POSITION_SIZE) {
                return {
                    success: false,
                    error: 'Position size exceeds maximum allowed',
                    tradeId,
                    maxAllowed: this.currentCapital * LIVE_CONFIG.RISK_LIMITS.MAX_POSITION_SIZE
                };
            }
            
            // Execute the trade
            const trade = {
                tradeId,
                symbol,
                strategy,
                signal,
                timestamp,
                
                // Execution details
                entryPrice: executionDetails.executionPrice,
                quantity: executionDetails.actualQuantity,
                dollarAmount: executionDetails.actualDollarAmount,
                
                // Costs and slippage
                commission: executionDetails.commission,
                slippage: executionDetails.slippage,
                slippagePercent: executionDetails.slippagePercent,
                
                // Risk management
                stopLoss: this.calculateStopLoss(executionDetails.executionPrice, signal, strategy),
                takeProfit: this.calculateTakeProfit(executionDetails.executionPrice, signal, strategy, expectedReturn),
                
                // Strategy context
                confidence,
                expectedReturn,
                riskMetrics,
                
                // Position status
                status: 'open',
                unrealizedPnL: 0
            };
            
            // Update capital allocation
            this.currentCapital -= trade.dollarAmount + trade.commission;
            
            // Store executed trade
            this.executedTrades.set(tradeId, trade);
            
            console.log(`✅ Trade executed successfully: ${tradeId}`);
            console.log(`   Entry Price: $${trade.entryPrice.toFixed(4)}`);
            console.log(`   Slippage: ${(trade.slippagePercent * 100).toFixed(3)}%`);
            console.log(`   Commission: $${trade.commission.toFixed(2)}`);
            
            return {
                success: true,
                tradeId,
                ...trade
            };
            
        } catch (error) {
            console.error('❌ Error executing trade:', error.message);
            return {
                success: false,
                error: error.message,
                tradeId: tradeRequest.tradeId || 'unknown'
            };
        }
    }

    /**
     * Calculate realistic execution details including slippage and commission
     */
    calculateExecutionDetails(symbol, signal, currentPrice, quantity, dollarAmount, strategy) {
        // Determine market type
        const marketType = this.isCryptoSymbol(symbol) ? 'crypto' : 'nse';
        
        // Calculate base slippage based on strategy and market conditions
        const baseSlippage = this.calculateSlippage(strategy, marketType, dollarAmount);
        
        // Add random component to slippage (realistic market conditions)
        const randomFactor = (Math.random() - 0.5) * 0.5; // ±25% variation
        const totalSlippage = baseSlippage * (1 + randomFactor);
        
        // Calculate execution price with slippage
        let executionPrice;
        if (signal === 'buy') {
            executionPrice = currentPrice * (1 + totalSlippage); // Buy higher due to slippage
        } else {
            executionPrice = currentPrice * (1 - totalSlippage); // Sell lower due to slippage
        }
        
        // Calculate actual quantity and dollar amount
        const actualQuantity = Math.floor(dollarAmount / executionPrice);
        const actualDollarAmount = actualQuantity * executionPrice;
        
        // Calculate commission
        const commission = Math.max(
            LIVE_CONFIG.PAPER_TRADING.COMMISSION_PER_TRADE,
            actualDollarAmount * 0.001 // 0.1% commission or minimum $5
        );
        
        return {
            executionPrice,
            actualQuantity,
            actualDollarAmount,
            slippage: Math.abs(executionPrice - currentPrice),
            slippagePercent: totalSlippage,
            commission
        };
    }

    /**
     * Calculate slippage based on strategy, market type, and position size
     */
    calculateSlippage(strategy, marketType, dollarAmount) {
        const baseSlippage = this.slippageModel[marketType];
        
        // Determine liquidity condition based on position size
        let liquidityCondition;
        if (dollarAmount < 5000) {
            liquidityCondition = 'low';
        } else if (dollarAmount < 20000) {
            liquidityCondition = 'medium';
        } else {
            liquidityCondition = 'high';
        }
        
        // Strategy-specific slippage adjustments
        const strategyMultipliers = {
            scalping: 1.2,     // Higher slippage due to speed requirements
            swing: 0.8,        // Lower slippage due to patient execution
            btst: 1.0,         // Standard slippage
            options: 1.5,      // Higher slippage due to wider spreads
            fo_arbitrage: 2.0  // Highest slippage due to timing sensitivity
        };
        
        const strategyMultiplier = strategyMultipliers[strategy] || 1.0;
        
        return baseSlippage[liquidityCondition] * strategyMultiplier;
    }

    /**
     * Exit a trade with realistic execution modeling
     */
    async exitTrade(exitRequest) {
        try {
            const { tradeId, exitPrice, exitReason } = exitRequest;
            
            const trade = this.executedTrades.get(tradeId);
            if (!trade) {
                return {
                    success: false,
                    error: 'Trade not found',
                    tradeId
                };
            }
            
            if (trade.status !== 'open') {
                return {
                    success: false,
                    error: 'Trade is not open',
                    tradeId,
                    currentStatus: trade.status
                };
            }
            
            const exitTimestamp = new Date();
            
            // Calculate exit execution details
            const exitExecutionDetails = this.calculateExecutionDetails(
                trade.symbol,
                trade.signal === 'buy' ? 'sell' : 'buy', // Opposite signal for exit
                exitPrice,
                trade.quantity,
                trade.quantity * exitPrice,
                trade.strategy
            );
            
            // Calculate P&L
            const grossPnL = this.calculatePnL(
                trade.entryPrice,
                exitExecutionDetails.executionPrice,
                trade.quantity,
                trade.signal
            );
            
            const netPnL = grossPnL - trade.commission - exitExecutionDetails.commission;
            const pnlPercent = (netPnL / trade.dollarAmount) * 100;
            
            // Update trade record
            trade.status = 'closed';
            trade.exitPrice = exitExecutionDetails.executionPrice;
            trade.exitTimestamp = exitTimestamp;
            trade.exitReason = exitReason;
            trade.exitCommission = exitExecutionDetails.commission;
            trade.exitSlippage = exitExecutionDetails.slippage;
            trade.exitSlippagePercent = exitExecutionDetails.slippagePercent;
            trade.holdingPeriod = Math.round((exitTimestamp - trade.timestamp) / (1000 * 60)); // minutes
            trade.grossPnL = grossPnL;
            trade.netPnL = netPnL;
            trade.pnlPercent = pnlPercent;
            
            // Return capital and P&L to available capital
            this.currentCapital += trade.dollarAmount + netPnL;
            
            console.log(`🔄 Trade closed: ${tradeId}`);
            console.log(`   Exit Price: $${trade.exitPrice.toFixed(4)}`);
            console.log(`   Holding Period: ${trade.holdingPeriod} minutes`);
            console.log(`   Net P&L: $${netPnL.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
            console.log(`   Exit Reason: ${exitReason}`);
            
            return {
                success: true,
                tradeId,
                symbol: trade.symbol,
                strategy: trade.strategy,
                holdingPeriod: trade.holdingPeriod,
                grossPnL,
                netPnL,
                pnl: netPnL, // For backwards compatibility
                pnlPercent,
                exitReason,
                exitPrice: exitExecutionDetails.executionPrice,
                totalCommissions: trade.commission + exitExecutionDetails.commission,
                totalSlippage: trade.slippage + exitExecutionDetails.slippage
            };
            
        } catch (error) {
            console.error('❌ Error exiting trade:', error.message);
            return {
                success: false,
                error: error.message,
                tradeId: exitRequest.tradeId
            };
        }
    }

    /**
     * Calculate P&L based on entry/exit prices and position direction
     */
    calculatePnL(entryPrice, exitPrice, quantity, signal) {
        if (signal === 'buy') {
            // Long position: profit when exit price > entry price
            return (exitPrice - entryPrice) * quantity;
        } else {
            // Short position: profit when exit price < entry price
            return (entryPrice - exitPrice) * quantity;
        }
    }

    /**
     * Calculate dynamic stop loss based on strategy and market conditions
     */
    calculateStopLoss(entryPrice, signal, strategy) {
        const strategyStopLoss = {
            scalping: 0.015,     // 1.5% stop loss
            swing: 0.025,        // 2.5% stop loss
            btst: 0.02,          // 2% stop loss
            options: 0.50,       // 50% stop loss (premium based)
            fo_arbitrage: 0.01   // 1% stop loss
        };
        
        const stopLossPercent = strategyStopLoss[strategy] || 0.02;
        
        if (signal === 'buy') {
            return entryPrice * (1 - stopLossPercent);
        } else {
            return entryPrice * (1 + stopLossPercent);
        }
    }

    /**
     * Calculate dynamic take profit based on strategy and expected return
     */
    calculateTakeProfit(entryPrice, signal, strategy, expectedReturn = 0.04) {
        const strategyTakeProfit = {
            scalping: Math.max(0.03, expectedReturn),      // 3% or expected return
            swing: Math.max(0.06, expectedReturn * 1.5),   // 6% or 1.5x expected return
            btst: Math.max(0.05, expectedReturn * 1.2),    // 5% or 1.2x expected return
            options: Math.max(0.25, expectedReturn * 2),   // 25% or 2x expected return
            fo_arbitrage: Math.max(0.005, expectedReturn)  // 0.5% or expected return
        };
        
        const takeProfitPercent = strategyTakeProfit[strategy] || 0.04;
        
        if (signal === 'buy') {
            return entryPrice * (1 + takeProfitPercent);
        } else {
            return entryPrice * (1 - takeProfitPercent);
        }
    }

    /**
     * Get simulated current market price with realistic price action
     */
    async getCurrentMarketPrice(symbol) {
        try {
            // Simulate realistic market prices with volatility
            const basePrice = this.getBasePriceForSymbol(symbol);
            const volatility = this.getVolatilityForSymbol(symbol);
            
            // Generate realistic price movement using random walk
            const randomChange = this.generateRandomPriceChange(volatility);
            const currentPrice = basePrice * (1 + randomChange);
            
            return Math.max(currentPrice, 0.01); // Ensure positive price
            
        } catch (error) {
            console.error(`❌ Error getting market price for ${symbol}:`, error.message);
            return null;
        }
    }

    /**
     * Generate realistic random price change based on market volatility
     */
    generateRandomPriceChange(volatility) {
        // Use normal distribution for realistic price movements
        const u1 = Math.random();
        const u2 = Math.random();
        
        // Box-Muller transformation for normal distribution
        const standardNormal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        // Scale by volatility (annualized to minute-level)
        const minuteVolatility = volatility / Math.sqrt(365 * 24 * 60);
        
        return standardNormal * minuteVolatility;
    }

    /**
     * Get base price for symbol (for simulation)
     */
    getBasePriceForSymbol(symbol) {
        // Crypto prices (in USD)
        const cryptoPrices = {
            'BTC': 45000,
            'ETH': 3000,
            'SOL': 150,
            'DOGE': 0.08,
            'ADA': 0.50,
            'DOT': 8.00
        };
        
        // NSE stock prices (in INR)
        const nsePrices = {
            'RELIANCE': 2500,
            'TCS': 3500,
            'HDFC': 1600,
            'INFY': 1800,
            'ITC': 450,
            'SBIN': 750,
            'BHARTIARTL': 900,
            'KOTAKBANK': 1800,
            'LT': 3200,
            'HCLTECH': 1200,
            'WIPRO': 650,
            'ASIANPAINT': 3000,
            'MARUTI': 9500,
            'BAJFINANCE': 7500,
            'TITAN': 2800
        };
        
        return cryptoPrices[symbol] || nsePrices[symbol] || 1000;
    }

    /**
     * Get annualized volatility for symbol
     */
    getVolatilityForSymbol(symbol) {
        // Higher volatility for crypto, lower for established stocks
        const cryptoVolatility = {
            'BTC': 0.60,    // 60% annual volatility
            'ETH': 0.70,    // 70% annual volatility
            'SOL': 0.90,    // 90% annual volatility
            'DOGE': 1.20,   // 120% annual volatility
            'ADA': 0.80,    // 80% annual volatility
            'DOT': 0.85     // 85% annual volatility
        };
        
        const nseVolatility = {
            'RELIANCE': 0.25,
            'TCS': 0.20,
            'HDFC': 0.22,
            'INFY': 0.25,
            'ITC': 0.18,
            'SBIN': 0.35,
            'BHARTIARTL': 0.28,
            'KOTAKBANK': 0.30,
            'LT': 0.25,
            'HCLTECH': 0.30,
            'WIPRO': 0.28,
            'ASIANPAINT': 0.20,
            'MARUTI': 0.25,
            'BAJFINANCE': 0.40,
            'TITAN': 0.30
        };
        
        return cryptoVolatility[symbol] || nseVolatility[symbol] || 0.25;
    }

    /**
     * Check if symbol is cryptocurrency
     */
    isCryptoSymbol(symbol) {
        const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'DOT'];
        return cryptoSymbols.includes(symbol);
    }

    /**
     * Get current account status
     */
    getAccountStatus() {
        const openTrades = Array.from(this.executedTrades.values()).filter(trade => trade.status === 'open');
        const closedTrades = Array.from(this.executedTrades.values()).filter(trade => trade.status === 'closed');
        
        const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0);
        const unrealizedPnL = openTrades.reduce((sum, trade) => sum + (trade.unrealizedPnL || 0), 0);
        
        return {
            initialCapital: this.initialCapital,
            currentCapital: this.currentCapital,
            totalPnL,
            unrealizedPnL,
            totalTrades: this.executedTrades.size,
            openPositions: openTrades.length,
            closedTrades: closedTrades.length,
            winningTrades: closedTrades.filter(t => (t.netPnL || 0) > 0).length,
            losingTrades: closedTrades.filter(t => (t.netPnL || 0) < 0).length,
            winRate: closedTrades.length > 0 ? 
                    closedTrades.filter(t => (t.netPnL || 0) > 0).length / closedTrades.length : 0
        };
    }

    /**
     * Update unrealized P&L for open positions
     */
    async updateUnrealizedPnL() {
        try {
            for (const [tradeId, trade] of this.executedTrades) {
                if (trade.status === 'open') {
                    const currentPrice = await this.getCurrentMarketPrice(trade.symbol);
                    if (currentPrice) {
                        trade.unrealizedPnL = this.calculatePnL(
                            trade.entryPrice,
                            currentPrice,
                            trade.quantity,
                            trade.signal
                        );
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error updating unrealized P&L:', error.message);
        }
    }

    /**
     * Get all open positions
     */
    getOpenPositions() {
        return Array.from(this.executedTrades.values()).filter(trade => trade.status === 'open');
    }

    /**
     * Get trade execution history
     */
    getTradeHistory(limit = 50) {
        const trades = Array.from(this.executedTrades.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return limit ? trades.slice(0, limit) : trades;
    }

    /**
     * Health check method
     */
    healthCheck() {
        const accountStatus = this.getAccountStatus();
        
        return {
            status: 'healthy',
            accountStatus,
            executionQueue: this.executionQueue.length,
            lastActivity: this.executedTrades.size > 0 ? 
                          Math.max(...Array.from(this.executedTrades.values()).map(t => new Date(t.timestamp))) : null,
            timestamp: new Date()
        };
    }
}

module.exports = ExecutionSimulator;