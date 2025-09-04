// dashboard-backend/src/routes/liveTradingRoutes.js
/**
 * Live Trading API Routes - Phase 3A Step 8
 * API v8 endpoints for live trading management and monitoring
 */

const express = require('express');
const router = express.Router();

/**
 * Live Trading Management APIs (v8)
 * 
 * Endpoints:
 * - GET /api/v8/live/status - Live trading system status and health
 * - GET /api/v8/live/portfolio - Current portfolio positions and P&L
 * - POST /api/v8/live/start-paper-trading - Start paper trading session
 * - POST /api/v8/live/stop-paper-trading - Stop paper trading session
 * - POST /api/v8/live/execute-strategy/:strategy - Execute specific strategy
 * - GET /api/v8/live/performance - Live performance metrics
 * - GET /api/v8/live/data-feeds - Data feed status and prices
 * - GET /api/v8/live/risk-analysis - Risk analysis and recommendations
 * - GET /api/v8/live/trade-history - Trade execution history
 * - POST /api/v8/live/update-settings - Update live trading settings
 */

// Middleware to check if live trading engine is available
const checkLiveTradingEngine = (req, res, next) => {
    if (!req.app.liveTradingEngine) {
        return res.status(503).json({
            success: false,
            error: 'Live Trading Engine not available',
            message: 'Live trading services are currently unavailable'
        });
    }
    next();
};

/**
 * GET /api/v8/live/status
 * Get live trading system status and health
 */
router.get('/status', checkLiveTradingEngine, async (req, res) => {
    try {
        const status = req.app.liveTradingEngine.getStatus();
        const dataFeedStatus = req.app.dataFeedManager ? req.app.dataFeedManager.getStatus() : null;
        
        res.json({
            success: true,
            data: {
                liveTradingEngine: status,
                dataFeeds: dataFeedStatus,
                timestamp: new Date(),
                version: '8.0.0'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * POST /api/v8/live/start-paper-trading
 * Start a new paper trading session
 */
router.post('/start-paper-trading', checkLiveTradingEngine, async (req, res) => {
    try {
        const { userId = 'demo_user', initialCapital, strategies, marketType } = req.body;
        
        const result = await req.app.liveTradingEngine.startPaperTradingSession(userId, {
            initialCapital,
            strategies,
            marketType
        });
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Paper trading session started successfully',
                data: result,
                timestamp: new Date()
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                timestamp: new Date()
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * POST /api/v8/live/stop-paper-trading
 * Stop the current paper trading session
 */
router.post('/stop-paper-trading', checkLiveTradingEngine, async (req, res) => {
    try {
        const result = await req.app.liveTradingEngine.stopPaperTradingSession();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Paper trading session stopped successfully',
                data: result,
                timestamp: new Date()
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                timestamp: new Date()
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/portfolio
 * Get current portfolio positions and P&L
 */
router.get('/portfolio', checkLiveTradingEngine, async (req, res) => {
    try {
        const portfolioResult = await req.app.liveTradingEngine.getPortfolioStatus();
        
        if (portfolioResult.success) {
            res.json({
                success: true,
                data: portfolioResult.portfolio,
                timestamp: new Date()
            });
        } else {
            res.status(400).json({
                success: false,
                error: portfolioResult.error,
                timestamp: new Date()
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * POST /api/v8/live/execute-strategy/:strategy
 * Execute a specific trading strategy
 */
router.post('/execute-strategy/:strategy', checkLiveTradingEngine, async (req, res) => {
    try {
        const { strategy } = req.params;
        const { signal } = req.body;
        
        if (!signal) {
            return res.status(400).json({
                success: false,
                error: 'Trading signal is required',
                timestamp: new Date()
            });
        }
        
        const result = await req.app.liveTradingEngine.executeStrategySignal(strategy, signal);
        
        if (result.success) {
            res.json({
                success: true,
                message: `${strategy} strategy executed successfully`,
                data: result,
                timestamp: new Date()
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                timestamp: new Date()
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/performance
 * Get live performance metrics and analytics
 */
router.get('/performance', checkLiveTradingEngine, async (req, res) => {
    try {
        const performanceAnalyzer = req.app.performanceAnalyzer;
        
        if (!performanceAnalyzer) {
            return res.status(503).json({
                success: false,
                error: 'Performance Analyzer not available',
                timestamp: new Date()
            });
        }
        
        const liveMetrics = performanceAnalyzer.getLiveMetrics();
        const performanceHistory = performanceAnalyzer.getPerformanceHistory(20);
        const strategyComparison = performanceAnalyzer.getStrategyComparison();
        const riskAnalysis = performanceAnalyzer.getRiskAnalysis();
        
        res.json({
            success: true,
            data: {
                liveMetrics,
                performanceHistory,
                strategyComparison,
                riskAnalysis
            },
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/data-feeds
 * Get data feed status and current prices
 */
router.get('/data-feeds', async (req, res) => {
    try {
        const dataFeedManager = req.app.dataFeedManager;
        
        if (!dataFeedManager) {
            return res.status(503).json({
                success: false,
                error: 'Data Feed Manager not available',
                timestamp: new Date()
            });
        }
        
        const { symbols } = req.query;
        const symbolList = symbols ? symbols.split(',') : ['BTCUSDT', 'ETHUSDT', 'RELIANCE', 'TCS'];
        
        const feedStatus = dataFeedManager.getStatus();
        const priceData = {};
        
        for (const symbol of symbolList) {
            const latestPrice = dataFeedManager.getLatestPriceData(symbol);
            if (latestPrice) {
                priceData[symbol] = latestPrice;
            }
        }
        
        res.json({
            success: true,
            data: {
                feedStatus,
                priceData,
                subscribedSymbols: symbolList
            },
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/risk-analysis
 * Get comprehensive risk analysis and recommendations
 */
router.get('/risk-analysis', checkLiveTradingEngine, async (req, res) => {
    try {
        const performanceAnalyzer = req.app.performanceAnalyzer;
        
        if (!performanceAnalyzer) {
            return res.status(503).json({
                success: false,
                error: 'Performance Analyzer not available',
                timestamp: new Date()
            });
        }
        
        const riskAnalysis = performanceAnalyzer.getRiskAnalysis();
        const portfolioStatus = await req.app.liveTradingEngine.getPortfolioStatus();
        
        res.json({
            success: true,
            data: {
                riskAnalysis,
                portfolioRisk: portfolioStatus.success ? {
                    totalExposure: portfolioStatus.portfolio.investedAmount,
                    availableCash: portfolioStatus.portfolio.availableCapital,
                    positionCount: portfolioStatus.portfolio.totalPositions,
                    concentrationRisk: portfolioStatus.portfolio.positions.length > 0 ? 
                        Math.max(...portfolioStatus.portfolio.positions.map(p => Math.abs(p.investedAmount / portfolioStatus.portfolio.totalCapital))) : 0
                } : null
            },
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/trade-history
 * Get trade execution history
 */
router.get('/trade-history', checkLiveTradingEngine, async (req, res) => {
    try {
        const { limit = 50, strategy, symbol } = req.query;
        
        const executionSimulator = req.app.liveTradingEngine.executionSimulator;
        
        if (!executionSimulator) {
            return res.status(503).json({
                success: false,
                error: 'Execution Simulator not available',
                timestamp: new Date()
            });
        }
        
        let tradeHistory = executionSimulator.getTradeHistory(parseInt(limit));
        
        // Filter by strategy if specified
        if (strategy) {
            tradeHistory = tradeHistory.filter(trade => trade.strategy === strategy);
        }
        
        // Filter by symbol if specified
        if (symbol) {
            tradeHistory = tradeHistory.filter(trade => trade.symbol === symbol);
        }
        
        const accountStatus = executionSimulator.getAccountStatus();
        
        res.json({
            success: true,
            data: {
                trades: tradeHistory,
                accountStatus,
                filters: { strategy, symbol, limit: parseInt(limit) }
            },
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/market-hours
 * Get current market hours status
 */
router.get('/market-hours', async (req, res) => {
    try {
        const dataFeedManager = req.app.dataFeedManager;
        const liveTradingEngine = req.app.liveTradingEngine;
        
        const marketHours = dataFeedManager ? dataFeedManager.getStatus().marketHours : null;
        const tradingStatus = liveTradingEngine ? liveTradingEngine.getStatus().marketHours : null;
        
        res.json({
            success: true,
            data: {
                marketHours: marketHours || tradingStatus,
                timestamp: new Date(),
                timezone: 'Asia/Kolkata'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/execution-quality
 * Get execution quality metrics
 */
router.get('/execution-quality', checkLiveTradingEngine, async (req, res) => {
    try {
        const executionSimulator = req.app.liveTradingEngine.executionSimulator;
        
        if (!executionSimulator) {
            return res.status(503).json({
                success: false,
                error: 'Execution Simulator not available',
                timestamp: new Date()
            });
        }
        
        const tradeHistory = executionSimulator.getTradeHistory(100);
        
        // Calculate execution quality metrics
        const avgSlippage = tradeHistory.length > 0 ? 
            tradeHistory.reduce((sum, trade) => sum + (trade.slippagePercent || 0), 0) / tradeHistory.length : 0;
        
        const avgCommission = tradeHistory.length > 0 ? 
            tradeHistory.reduce((sum, trade) => sum + (trade.commission || 0), 0) / tradeHistory.length : 0;
        
        const executionLatency = Math.random() * 100 + 50; // Simulated latency
        
        res.json({
            success: true,
            data: {
                averageSlippage: avgSlippage * 100, // Convert to percentage
                averageCommission: avgCommission,
                averageLatency: executionLatency,
                totalExecutions: tradeHistory.length,
                qualityScore: Math.max(0, 100 - (avgSlippage * 10000) - (executionLatency / 10))
            },
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * POST /api/v8/live/test-execution
 * Test trade execution with paper trading
 */
router.post('/test-execution', checkLiveTradingEngine, async (req, res) => {
    try {
        const { symbol = 'BTCUSDT', strategy = 'scalping', signal = 'BUY', dollarAmount = 1000 } = req.body;
        
        const testSignal = {
            symbol,
            action: signal,
            confidence: 0.8,
            expectedReturn: 0.03,
            dollarAmount,
            quantity: Math.floor(dollarAmount / 100), // Simplified quantity calculation
            riskMetrics: {
                riskScore: 0.5,
                volatility: 0.02
            }
        };
        
        const result = await req.app.liveTradingEngine.executeStrategySignal(strategy, testSignal);
        
        res.json({
            success: true,
            message: 'Test execution completed',
            data: {
                testSignal,
                executionResult: result
            },
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * GET /api/v8/live/health
 * Comprehensive health check for live trading system
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            liveTradingEngine: req.app.liveTradingEngine ? req.app.liveTradingEngine.getStatus() : null,
            dataFeedManager: req.app.dataFeedManager ? req.app.dataFeedManager.getStatus() : null,
            performanceAnalyzer: req.app.performanceAnalyzer ? 'active' : 'inactive',
            database: 'connected', // Will be replaced with actual DB health check
            timestamp: new Date()
        };
        
        const overallHealth = health.liveTradingEngine && health.dataFeedManager ? 'healthy' : 'degraded';
        
        res.json({
            success: true,
            status: overallHealth,
            components: health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

module.exports = router;
