// dashboard-backend/src/services/live/liveTradingEngine.js
/**
 * Live Trading Engine - Phase 3A Step 8
 * Central orchestrator for paper trading, execution simulation, and portfolio management
 */

const { EventEmitter } = require('events');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const { LIVE_CONFIG } = require('../../config/live.config');
const { 
    PaperTradingSession, 
    TradeExecution, 
    PortfolioPosition, 
    LivePerformance 
} = require('../../models/tradeExecutionModel');

class LiveTradingEngine extends EventEmitter {
    constructor({ tradingStrategiesEngine, riskManagementEngine, mlSignalEngine }) {
        super();
        
        this.tradingStrategiesEngine = tradingStrategiesEngine;
        this.riskManagementEngine = riskManagementEngine;
        this.mlSignalEngine = mlSignalEngine;
        
        // Live trading state
        this.isActive = false;
        this.currentSession = null;
        this.portfolioPositions = new Map();
        this.executionQueue = [];
        
        // Performance tracking
        this.performanceMetrics = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalReturn: 0,
            maxDrawdown: 0,
            currentDrawdown: 0
        };
        
        // Market state
        this.marketHours = {
            nse: false,
            crypto: true // Crypto always available
        };
        
        // Execution modules (will be injected)
        this.dataFeedManager = null;
        this.executionSimulator = null;
        this.portfolioManager = null;
        this.performanceAnalyzer = null;
        
        console.log('🚀 Live Trading Engine initialized');
    }

    /**
     * Initialize all live trading components
     */
    async initialize() {
        try {
            console.log('🔄 Initializing Live Trading Engine components...');
            
            // Initialize execution simulator
            this.executionSimulator = await this.createExecutionSimulator();
            
            // Initialize portfolio manager
            this.portfolioManager = await this.createPortfolioManager();
            
            // Initialize performance analyzer
            this.performanceAnalyzer = await this.createPerformanceAnalyzer();
            
            // Setup market hours monitoring
            this.setupMarketHoursMonitoring();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Live Trading Engine initialization complete');
            this.emit('initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ Live Trading Engine initialization failed:', error);
            this.emit('error', { type: 'initialization', error });
            return false;
        }
    }

    /**
     * Start a new paper trading session
     */
    async startPaperTradingSession(userId, options = {}) {
        try {
            if (this.isActive) {
                throw new Error('Paper trading session already active');
            }

            const sessionId = uuidv4();
            const initialCapital = options.initialCapital || LIVE_CONFIG.PAPER_TRADING.INITIAL_CAPITAL;
            
            console.log(`🎯 Starting paper trading session: ${sessionId}`);
            console.log(`💰 Initial capital: $${initialCapital.toLocaleString()}`);
            
            // Create session record
            const session = new PaperTradingSession({
                sessionId,
                userId,
                startTime: new Date(),
                status: 'active',
                initialCapital,
                currentCapital: initialCapital,
                availableCapital: initialCapital,
                maxDailyLoss: initialCapital * LIVE_CONFIG.RISK_LIMITS.MAX_DAILY_LOSS,
                maxPositionSize: initialCapital * LIVE_CONFIG.RISK_LIMITS.MAX_POSITION_SIZE,
                enabledStrategies: options.strategies || LIVE_CONFIG.STRATEGIES.ENABLED,
                marketType: options.marketType || 'mixed'
            });
            
            await session.save();
            
            // Set current session
            this.currentSession = session;
            this.isActive = true;
            
            // Reset performance metrics
            this.resetPerformanceMetrics();
            
            // Start live trading processes
            await this.startLiveTradingProcesses();
            
            this.emit('sessionStarted', { sessionId, initialCapital });
            
            return {
                success: true,
                sessionId,
                initialCapital,
                status: 'active'
            };
            
        } catch (error) {
            console.error('❌ Failed to start paper trading session:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop the current paper trading session
     */
    async stopPaperTradingSession() {
        try {
            if (!this.isActive || !this.currentSession) {
                throw new Error('No active paper trading session');
            }

            console.log('⏹️ Stopping paper trading session...');
            
            // Close all open positions
            await this.closeAllPositions('session_end');
            
            // Update session status
            this.currentSession.status = 'completed';
            this.currentSession.endTime = new Date();
            await this.currentSession.save();
            
            // Generate final performance report
            const finalPerformance = await this.generatePerformanceReport();
            
            // Stop live trading processes
            await this.stopLiveTradingProcesses();
            
            // Reset state
            this.isActive = false;
            const sessionId = this.currentSession.sessionId;
            this.currentSession = null;
            this.portfolioPositions.clear();
            
            this.emit('sessionStopped', { sessionId, finalPerformance });
            
            return {
                success: true,
                sessionId,
                finalPerformance
            };
            
        } catch (error) {
            console.error('❌ Failed to stop paper trading session:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute a trading strategy signal
     */
    async executeStrategySignal(strategyName, signal) {
        try {
            if (!this.isActive) {
                return { success: false, error: 'No active trading session' };
            }

            const {
                symbol,
                action,
                confidence,
                expectedReturn,
                riskMetrics,
                dollarAmount,
                quantity
            } = signal;

            console.log(`📈 Processing ${strategyName} signal: ${action} ${symbol} (${confidence}% confidence)`);
            
            // Validate signal confidence
            if (confidence < LIVE_CONFIG.STRATEGIES.CONFIDENCE_THRESHOLD) {
                return {
                    success: false,
                    error: `Signal confidence ${confidence} below threshold ${LIVE_CONFIG.STRATEGIES.CONFIDENCE_THRESHOLD}`
                };
            }
            
            // Risk management validation
            const riskValidation = await this.validateRiskLimits(signal);
            if (!riskValidation.valid) {
                return {
                    success: false,
                    error: `Risk validation failed: ${riskValidation.reason}`
                };
            }
            
            // Execute trade through simulator
            const executionResult = await this.executionSimulator.executeTrade({
                strategy: strategyName,
                symbol,
                signal: action,
                quantity,
                dollarAmount,
                confidence,
                expectedReturn,
                riskMetrics
            });
            
            if (executionResult.success) {
                // Update portfolio
                await this.updatePortfolio(executionResult.trade);
                
                // Update performance metrics
                this.updatePerformanceMetrics(executionResult.trade);
                
                // Emit trade execution event
                this.emit('tradeExecuted', executionResult.trade);
            }
            
            return executionResult;
            
        } catch (error) {
            console.error(`❌ Strategy signal execution failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current portfolio status
     */
    async getPortfolioStatus() {
        try {
            if (!this.isActive) {
                return { success: false, error: 'No active trading session' };
            }

            const positions = await PortfolioPosition.find({
                sessionId: this.currentSession.sessionId,
                status: 'open'
            });

            const portfolioSummary = {
                sessionId: this.currentSession.sessionId,
                totalCapital: this.currentSession.currentCapital,
                availableCapital: this.currentSession.availableCapital,
                investedAmount: 0,
                unrealizedPnL: 0,
                realizedPnL: 0,
                totalPositions: positions.length,
                positions: []
            };

            for (const position of positions) {
                // Update position with current market price
                const currentPrice = await this.getCurrentMarketPrice(position.symbol);
                if (currentPrice) {
                    position.currentPrice = currentPrice;
                    position.currentValue = position.quantity * currentPrice;
                    position.unrealizedPnL = position.currentValue - position.investedAmount;
                    await position.save();
                }

                portfolioSummary.investedAmount += position.investedAmount;
                portfolioSummary.unrealizedPnL += position.unrealizedPnL;
                portfolioSummary.realizedPnL += position.realizedPnL;
                
                portfolioSummary.positions.push({
                    symbol: position.symbol,
                    strategy: position.strategy,
                    quantity: position.quantity,
                    averagePrice: position.averagePrice,
                    currentPrice: position.currentPrice,
                    investedAmount: position.investedAmount,
                    currentValue: position.currentValue,
                    unrealizedPnL: position.unrealizedPnL,
                    returnPercentage: (position.unrealizedPnL / position.investedAmount) * 100
                });
            }

            return {
                success: true,
                portfolio: portfolioSummary
            };
            
        } catch (error) {
            console.error('❌ Failed to get portfolio status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Setup market hours monitoring
     */
    setupMarketHoursMonitoring() {
        // Check market hours every minute
        setInterval(() => {
            this.updateMarketHours();
        }, 60000);
        
        // Initial check
        this.updateMarketHours();
    }

    /**
     * Update market hours status
     */
    updateMarketHours() {
        const now = moment.tz('Asia/Kolkata');
        const currentTime = now.format('HH:mm');
        const isWeekend = [0, 6].includes(now.day()); // Sunday = 0, Saturday = 6
        
        // NSE market hours: 9:15 AM - 3:30 PM IST, Monday-Friday
        this.marketHours.nse = !isWeekend && 
                                currentTime >= '09:15' && 
                                currentTime <= '15:30';
        
        // Crypto always available
        this.marketHours.crypto = true;
        
        this.emit('marketHoursUpdate', this.marketHours);
    }

    /**
     * Create execution simulator instance
     */
    async createExecutionSimulator() {
        const ExecutionSimulator = require('./executionSimulator');
        return new ExecutionSimulator({
            riskManager: this.riskManagementEngine,
            initialCapital: LIVE_CONFIG.PAPER_TRADING.INITIAL_CAPITAL
        });
    }

    /**
     * Create portfolio manager instance
     */
    async createPortfolioManager() {
        const PortfolioManager = require('./portfolioManager');
        return new PortfolioManager({
            liveConfig: LIVE_CONFIG
        });
    }

    /**
     * Create performance analyzer instance
     */
    async createPerformanceAnalyzer() {
        const PerformanceAnalyzer = require('./performanceAnalyzer');
        return new PerformanceAnalyzer({
            liveConfig: LIVE_CONFIG
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Strategy engine events
        if (this.tradingStrategiesEngine) {
            this.tradingStrategiesEngine.on('opportunityDetected', async (opportunity) => {
                if (this.isActive) {
                    await this.executeStrategySignal(opportunity.strategy, opportunity.signal);
                }
            });
        }
    }

    /**
     * Start live trading processes
     */
    async startLiveTradingProcesses() {
        console.log('🚀 Starting live trading processes...');
        
        // Start strategy monitoring
        if (this.tradingStrategiesEngine) {
            await this.tradingStrategiesEngine.startLiveMonitoring();
        }
        
        // Start performance tracking
        this.startPerformanceTracking();
    }

    /**
     * Stop live trading processes
     */
    async stopLiveTradingProcesses() {
        console.log('⏹️ Stopping live trading processes...');
        
        // Stop strategy monitoring
        if (this.tradingStrategiesEngine) {
            await this.tradingStrategiesEngine.stopLiveMonitoring();
        }
        
        // Stop performance tracking
        this.stopPerformanceTracking();
    }

    /**
     * Start performance tracking
     */
    startPerformanceTracking() {
        this.performanceInterval = setInterval(async () => {
            if (this.isActive) {
                await this.updateLivePerformance();
            }
        }, LIVE_CONFIG.PERFORMANCE.UPDATE_INTERVAL);
    }

    /**
     * Stop performance tracking
     */
    stopPerformanceTracking() {
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = null;
        }
    }

    /**
     * Get live trading status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            sessionId: this.currentSession?.sessionId || null,
            marketHours: this.marketHours,
            performanceMetrics: this.performanceMetrics,
            activePositions: this.portfolioPositions.size,
            queuedExecutions: this.executionQueue.length
        };
    }

    // Helper methods (simplified for brevity)
    async validateRiskLimits(signal) {
        // Implementation will be added
        return { valid: true };
    }

    async updatePortfolio(trade) {
        // Implementation will be added
    }

    updatePerformanceMetrics(trade) {
        // Implementation will be added
    }

    async getCurrentMarketPrice(symbol) {
        // Implementation will be added - returns simulated price
        return 100 + (Math.random() - 0.5) * 10; // Placeholder
    }

    async closeAllPositions(reason) {
        // Implementation will be added
    }

    async generatePerformanceReport() {
        // Implementation will be added
        return { summary: 'Performance report generated' };
    }

    async updateLivePerformance() {
        // Implementation will be added
    }

    resetPerformanceMetrics() {
        this.performanceMetrics = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalReturn: 0,
            maxDrawdown: 0,
            currentDrawdown: 0
        };
    }

    /**
     * Generate session ID for testing
     */
    generateSessionId(userId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${userId}_session_${timestamp}_${random}`;
    }

    /**
     * Validate signal structure for testing
     */
    validateSignal(signal) {
        const requiredFields = ['symbol', 'action', 'confidence', 'dollarAmount'];
        const errors = [];
        
        for (const field of requiredFields) {
            if (!signal[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        if (signal.action && !['BUY', 'SELL'].includes(signal.action)) {
            errors.push('Invalid action - must be BUY or SELL');
        }
        
        if (signal.confidence && (signal.confidence < 0 || signal.confidence > 1)) {
            errors.push('Invalid confidence - must be between 0 and 1');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate risk limits for testing
     */
    validateRiskLimits(signal, availableCapital) {
        const { dollarAmount, riskMetrics } = signal;
        const maxPositionSize = availableCapital * 0.2; // 20% max
        
        if (dollarAmount > maxPositionSize) {
            return {
                isValid: false,
                reason: `Position size ${dollarAmount} exceeds maximum ${maxPositionSize} (20% of capital)`
            };
        }
        
        if (riskMetrics && riskMetrics.riskScore > 0.7) {
            return {
                isValid: false,
                reason: `Risk score ${riskMetrics.riskScore} exceeds maximum 0.7`
            };
        }
        
        return {
            isValid: true,
            reason: 'Risk limits passed'
        };
    }
}

module.exports = LiveTradingEngine;
