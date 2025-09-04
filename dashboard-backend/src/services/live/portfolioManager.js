// dashboard-backend/src/services/live/portfolioManager.js
/**
 * Portfolio Manager - Phase 3A Step 8
 * Real-time position tracking with comprehensive P&L calculation
 */

const { EventEmitter } = require('events');
const { PortfolioPosition, PaperTradingSession } = require('../../models/tradeExecutionModel');

class PortfolioManager extends EventEmitter {
    constructor({ liveConfig }) {
        super();
        
        this.liveConfig = liveConfig;
        this.positions = new Map();
        this.sessionPortfolio = null;
        
        // Performance tracking
        this.portfolioMetrics = {
            totalValue: 0,
            totalCost: 0,
            unrealizedPnL: 0,
            realizedPnL: 0,
            totalReturn: 0,
            totalReturnPercent: 0
        };
        
        console.log('📊 Portfolio Manager initialized');
    }

    /**
     * Initialize portfolio for a trading session
     */
    async initializePortfolio(sessionId) {
        try {
            this.sessionId = sessionId;
            
            // Load existing positions for session
            const existingPositions = await PortfolioPosition.find({
                sessionId,
                status: 'open'
            });
            
            // Populate positions map
            this.positions.clear();
            for (const position of existingPositions) {
                this.positions.set(position.positionId, position);
            }
            
            // Load session information
            this.sessionPortfolio = await PaperTradingSession.findOne({ sessionId });
            
            console.log(`📊 Portfolio initialized for session ${sessionId}`);
            console.log(`📈 Loaded ${existingPositions.length} existing positions`);
            
            // Calculate initial metrics
            await this.calculatePortfolioMetrics();
            
            return {
                success: true,
                sessionId,
                positionsCount: existingPositions.length,
                portfolioValue: this.portfolioMetrics.totalValue
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize portfolio:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add or update a position from trade execution
     */
    async updatePosition(tradeExecution) {
        try {
            const { symbol, strategy, signal, quantity, executedPrice, dollarAmount, tradeId } = tradeExecution;
            
            // Check if position exists for this symbol and strategy
            let position = Array.from(this.positions.values()).find(
                pos => pos.symbol === symbol && pos.strategy === strategy && pos.status === 'open'
            );
            
            if (position) {
                // Update existing position
                await this.updateExistingPosition(position, tradeExecution);
            } else {
                // Create new position
                await this.createNewPosition(tradeExecution);
            }
            
            // Recalculate portfolio metrics
            await this.calculatePortfolioMetrics();
            
            // Emit position update event
            this.emit('positionUpdated', {
                symbol,
                strategy,
                action: position ? 'updated' : 'created',
                position: position || this.getPositionBySymbol(symbol, strategy)
            });
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Failed to update position:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new position
     */
    async createNewPosition(tradeExecution) {
        const { symbol, strategy, signal, quantity, executedPrice, dollarAmount, tradeId } = tradeExecution;
        
        const positionQuantity = signal === 'BUY' ? quantity : -quantity; // Negative for short positions
        
        const position = new PortfolioPosition({
            positionId: `pos_${tradeId}`,
            sessionId: this.sessionId,
            symbol,
            strategy,
            quantity: positionQuantity,
            averagePrice: executedPrice,
            currentPrice: executedPrice,
            investedAmount: dollarAmount,
            currentValue: dollarAmount,
            unrealizedPnL: 0,
            openTime: new Date(),
            status: 'open'
        });
        
        await position.save();
        this.positions.set(position.positionId, position);
        
        console.log(`📈 New position created: ${symbol} (${strategy}) - ${positionQuantity} shares at $${executedPrice}`);
    }

    /**
     * Update existing position (averaging)
     */
    async updateExistingPosition(position, tradeExecution) {
        const { signal, quantity, executedPrice, dollarAmount } = tradeExecution;
        
        const newQuantity = signal === 'BUY' ? quantity : -quantity;
        const totalQuantity = position.quantity + newQuantity;
        
        if (totalQuantity === 0) {
            // Position closed
            position.status = 'closed';
            position.closeTime = new Date();
            position.realizedPnL = position.unrealizedPnL;
            
            // Update session realized P&L
            if (this.sessionPortfolio) {
                this.sessionPortfolio.currentCapital += position.realizedPnL;
                await this.sessionPortfolio.save();
            }
            
            console.log(`🔄 Position closed: ${position.symbol} - Realized P&L: $${position.realizedPnL.toFixed(2)}`);
        } else {
            // Update average price (weighted average)
            const totalCost = (position.quantity * position.averagePrice) + (newQuantity * executedPrice);
            position.averagePrice = Math.abs(totalCost / totalQuantity);
            position.quantity = totalQuantity;
            position.investedAmount = Math.abs(totalQuantity * position.averagePrice);
            
            console.log(`📊 Position updated: ${position.symbol} - New quantity: ${totalQuantity}, Avg price: $${position.averagePrice.toFixed(4)}`);
        }
        
        await position.save();
    }

    /**
     * Update all positions with current market prices
     */
    async updateMarketPrices() {
        try {
            for (const [positionId, position] of this.positions) {
                if (position.status === 'open') {
                    // Get current market price (will be replaced with real data feed)
                    const currentPrice = await this.getCurrentMarketPrice(position.symbol);
                    
                    if (currentPrice && currentPrice !== position.currentPrice) {
                        // Update position with new price
                        position.currentPrice = currentPrice;
                        position.currentValue = Math.abs(position.quantity) * currentPrice;
                        
                        // Calculate unrealized P&L
                        if (position.quantity > 0) {
                            // Long position
                            position.unrealizedPnL = (currentPrice - position.averagePrice) * position.quantity;
                        } else {
                            // Short position
                            position.unrealizedPnL = (position.averagePrice - currentPrice) * Math.abs(position.quantity);
                        }
                        
                        // Update return percentage
                        position.returnPercentage = (position.unrealizedPnL / position.investedAmount) * 100;
                        
                        // Track max gains/losses
                        if (position.unrealizedPnL > position.maxUnrealizedGain) {
                            position.maxUnrealizedGain = position.unrealizedPnL;
                        }
                        if (position.unrealizedPnL < position.maxUnrealizedLoss) {
                            position.maxUnrealizedLoss = position.unrealizedPnL;
                        }
                        
                        await position.save();
                        
                        // Check stop-loss and take-profit levels
                        await this.checkRiskLevels(position);
                    }
                }
            }
            
            // Recalculate portfolio metrics
            await this.calculatePortfolioMetrics();
            
        } catch (error) {
            console.error('❌ Error updating market prices:', error);
        }
    }

    /**
     * Calculate comprehensive portfolio metrics
     */
    async calculatePortfolioMetrics() {
        const openPositions = Array.from(this.positions.values()).filter(pos => pos.status === 'open');
        
        let totalValue = 0;
        let totalCost = 0;
        let unrealizedPnL = 0;
        
        for (const position of openPositions) {
            totalValue += position.currentValue;
            totalCost += position.investedAmount;
            unrealizedPnL += position.unrealizedPnL;
        }
        
        // Get realized P&L from session
        let realizedPnL = 0;
        if (this.sessionPortfolio) {
            realizedPnL = this.sessionPortfolio.currentCapital - this.sessionPortfolio.initialCapital + totalCost;
        }
        
        const totalReturn = unrealizedPnL + realizedPnL;
        const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
        
        this.portfolioMetrics = {
            totalValue,
            totalCost,
            unrealizedPnL,
            realizedPnL,
            totalReturn,
            totalReturnPercent,
            availableCash: this.sessionPortfolio ? this.sessionPortfolio.availableCapital : 0,
            totalCapital: this.sessionPortfolio ? this.sessionPortfolio.currentCapital : 0,
            positionsCount: openPositions.length
        };
        
        // Emit metrics update
        this.emit('metricsUpdated', this.portfolioMetrics);
    }

    /**
     * Check risk levels (stop-loss, take-profit)
     */
    async checkRiskLevels(position) {
        try {
            // Check stop-loss
            if (position.stopLoss) {
                const shouldTriggerStopLoss = position.quantity > 0 ? 
                    position.currentPrice <= position.stopLoss :
                    position.currentPrice >= position.stopLoss;
                
                if (shouldTriggerStopLoss) {
                    this.emit('stopLossTriggered', {
                        positionId: position.positionId,
                        symbol: position.symbol,
                        currentPrice: position.currentPrice,
                        stopLoss: position.stopLoss,
                        unrealizedPnL: position.unrealizedPnL
                    });
                }
            }
            
            // Check take-profit
            if (position.takeProfit) {
                const shouldTriggerTakeProfit = position.quantity > 0 ? 
                    position.currentPrice >= position.takeProfit :
                    position.currentPrice <= position.takeProfit;
                
                if (shouldTriggerTakeProfit) {
                    this.emit('takeProfitTriggered', {
                        positionId: position.positionId,
                        symbol: position.symbol,
                        currentPrice: position.currentPrice,
                        takeProfit: position.takeProfit,
                        unrealizedPnL: position.unrealizedPnL
                    });
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking risk levels:', error);
        }
    }

    /**
     * Get current portfolio status
     */
    getPortfolioStatus() {
        const openPositions = Array.from(this.positions.values())
            .filter(pos => pos.status === 'open')
            .map(pos => ({
                symbol: pos.symbol,
                strategy: pos.strategy,
                quantity: pos.quantity,
                averagePrice: pos.averagePrice,
                currentPrice: pos.currentPrice,
                investedAmount: pos.investedAmount,
                currentValue: pos.currentValue,
                unrealizedPnL: pos.unrealizedPnL,
                returnPercentage: pos.returnPercentage,
                stopLoss: pos.stopLoss,
                takeProfit: pos.takeProfit
            }));
        
        return {
            sessionId: this.sessionId,
            metrics: this.portfolioMetrics,
            positions: openPositions,
            timestamp: new Date()
        };
    }

    /**
     * Get position by symbol and strategy
     */
    getPositionBySymbol(symbol, strategy) {
        return Array.from(this.positions.values()).find(
            pos => pos.symbol === symbol && pos.strategy === strategy && pos.status === 'open'
        );
    }

    /**
     * Get current market price (placeholder - will be replaced with real data feed)
     */
    async getCurrentMarketPrice(symbol) {
        // Simulate realistic price movement
        const basePrice = this.getBasePriceForSymbol(symbol);
        const volatility = 0.02; // 2% volatility
        const randomChange = (Math.random() - 0.5) * volatility;
        
        return basePrice * (1 + randomChange);
    }

    /**
     * Get base price for symbol (simulation)
     */
    getBasePriceForSymbol(symbol) {
        const prices = {
            'BTC': 45000, 'BTCUSDT': 45000,
            'ETH': 3000, 'ETHUSDT': 3000,
            'SOL': 150, 'SOLUSDT': 150,
            'DOGE': 0.08, 'DOGEUSDT': 0.08,
            'RELIANCE': 2500,
            'TCS': 3500,
            'HDFCBANK': 1600,
            'INFY': 1800
        };
        
        return prices[symbol] || 1000;
    }

    /**
     * Start real-time portfolio monitoring
     */
    startMonitoring() {
        console.log('📊 Starting portfolio monitoring...');
        
        // Update prices every 5 seconds
        this.monitoringInterval = setInterval(async () => {
            await this.updateMarketPrices();
        }, this.liveConfig.PERFORMANCE.UPDATE_INTERVAL);
        
        this.emit('monitoringStarted');
    }

    /**
     * Stop portfolio monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️ Portfolio monitoring stopped');
            this.emit('monitoringStopped');
        }
    }

    /**
     * Get portfolio performance summary
     */
    getPerformanceSummary() {
        const openPositions = Array.from(this.positions.values()).filter(pos => pos.status === 'open');
        const closedPositions = Array.from(this.positions.values()).filter(pos => pos.status === 'closed');
        
        const winningPositions = closedPositions.filter(pos => pos.realizedPnL > 0);
        const losingPositions = closedPositions.filter(pos => pos.realizedPnL < 0);
        
        return {
            totalPositions: this.positions.size,
            openPositions: openPositions.length,
            closedPositions: closedPositions.length,
            winningPositions: winningPositions.length,
            losingPositions: losingPositions.length,
            winRate: closedPositions.length > 0 ? (winningPositions.length / closedPositions.length) * 100 : 0,
            averageWin: winningPositions.length > 0 ? 
                winningPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0) / winningPositions.length : 0,
            averageLoss: losingPositions.length > 0 ? 
                losingPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0) / losingPositions.length : 0,
            portfolioMetrics: this.portfolioMetrics
        };
    }

    /**
     * Calculate position update for testing
     */
    calculatePositionUpdate(tradeExecution) {
        const { symbol, quantity, executedPrice, dollarAmount } = tradeExecution;
        
        return {
            symbol,
            totalQuantity: quantity,
            averagePrice: executedPrice,
            totalValue: dollarAmount,
            unrealizedPnL: 0,
            status: 'open'
        };
    }

    /**
     * Calculate unrealized P&L for testing
     */
    calculateUnrealizedPnL(position, currentPrice) {
        const { totalQuantity, averagePrice } = position;
        return (currentPrice - averagePrice) * totalQuantity;
    }

    /**
     * Assess risk level for testing
     */
    assessRiskLevel(position, totalCapital) {
        const positionValue = position.totalValue || 0;
        const exposure = positionValue / totalCapital;
        
        if (exposure > 0.15) return 'HIGH';
        if (exposure > 0.10) return 'MEDIUM';
        return 'LOW';
    }
}

module.exports = PortfolioManager;
