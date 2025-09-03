// dashboard-backend/src/routes/marketDataV3Routes.js

/**
 * Market Data V3 Routes - Phase 3A Live Market Data Intelligence
 * REST endpoints for enhanced market data, symbols, and opportunities
 * 
 * @version 3A.2.0
 * @created September 04, 2025
 * @phase Phase 3A - Live Market Data Intelligence
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

// Import Phase 3A models and services
const { MarketData, AggregatedMarketData } = require('../models/marketDataModel');
const { TradingOpportunity, WatchList } = require('../models/tradingOpportunityModel');
const { MarketAnalytics, MarketInsights } = require('../models/marketAnalyticsModel');

/**
 * @route GET /api/v3/market/health
 * @desc Get Phase 3A market data system health
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            success: true,
            timestamp: new Date(),
            phase: '3A',
            components: {
                database: {
                    status: 'connected',
                    models: ['MarketData', 'TradingOpportunity', 'MarketAnalytics']
                },
                ingestion: {
                    status: global.marketDataIngestion ? 
                        (global.marketDataIngestion.isRunning ? 'running' : 'stopped') : 'not_initialized',
                    metrics: global.marketDataIngestion ? global.marketDataIngestion.getMetrics() : null
                },
                symbolManager: {
                    status: global.symbolManager ? 'initialized' : 'not_initialized',
                    universeSize: global.symbolManager ? global.symbolManager.symbolUniverse.size : 0
                }
            },
            capabilities: [
                'real_time_data_ingestion',
                'symbol_universe_management', 
                'trading_opportunity_detection',
                'market_analytics_engine',
                'multi_api_data_sources'
            ]
        };
        
        res.json(health);
        
    } catch (error) {
        console.error('Phase 3A health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v3/market/symbols
 * @desc Get symbol universe and metadata
 * @access Private
 */
router.get('/symbols', authenticateToken, async (req, res) => {
    try {
        if (!global.symbolManager) {
            return res.status(503).json({
                success: false,
                error: 'Symbol Manager not initialized',
                message: 'Please wait for system initialization'
            });
        }
        
        const {
            exchange,
            sector,
            marketCap,
            limit = 100,
            type = 'LIQUID'
        } = req.query;
        
        let symbols;
        
        if (type === 'CRITERIA') {
            symbols = global.symbolManager.getSymbolsByCriteria({
                exchange,
                sector,
                marketCapCategory: marketCap,
                limit: parseInt(limit)
            });
        } else {
            symbols = global.symbolManager.getSymbolsForScanning(type, parseInt(limit));
        }
        
        const stats = global.symbolManager.getUniverseStats();
        
        res.json({
            success: true,
            data: {
                symbols,
                stats,
                query: { exchange, sector, marketCap, limit, type }
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Symbols endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch symbols',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v3/market/symbols/:symbol
 * @desc Get detailed symbol information
 * @access Private
 */
router.get('/symbols/:symbol', authenticateToken, async (req, res) => {
    try {
        if (!global.symbolManager) {
            return res.status(503).json({
                success: false,
                error: 'Symbol Manager not initialized'
            });
        }
        
        const { symbol } = req.params;
        const symbolData = global.symbolManager.getSymbol(symbol);
        
        if (!symbolData) {
            return res.status(404).json({
                success: false,
                error: 'Symbol not found',
                symbol: symbol.toUpperCase()
            });
        }
        
        // Get recent market data
        const recentData = await MarketData.findOne(
            { symbol: symbol.toUpperCase() },
            null,
            { sort: { timestamp: -1 } }
        );
        
        res.json({
            success: true,
            data: {
                metadata: symbolData,
                recentData,
                lastUpdate: recentData?.timestamp
            }
        });
        
    } catch (error) {
        console.error('Symbol detail error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch symbol details',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v3/market/data/latest
 * @desc Get latest market data for symbols
 * @access Private
 */
router.get('/data/latest', authenticateToken, async (req, res) => {
    try {
        const { symbols, limit = 50 } = req.query;
        
        let query = {};
        if (symbols) {
            const symbolList = symbols.split(',').map(s => s.toUpperCase());
            query.symbol = { $in: symbolList };
        }
        
        // Get latest data for each symbol
        const pipeline = [
            { $match: query },
            { $sort: { symbol: 1, timestamp: -1 } },
            { $group: {
                _id: '$symbol',
                latestData: { $first: '$$ROOT' }
            }},
            { $replaceRoot: { newRoot: '$latestData' } },
            { $limit: parseInt(limit) }
        ];
        
        const latestData = await MarketData.aggregate(pipeline);
        
        res.json({
            success: true,
            data: latestData,
            count: latestData.length,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Latest data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch latest data',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v3/market/data/history/:symbol
 * @desc Get historical data for a symbol
 * @access Private
 */
router.get('/data/history/:symbol', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { 
            timeframe = '1d',
            limit = 100,
            from,
            to
        } = req.query;
        
        let query = { symbol: symbol.toUpperCase() };
        
        // Add time filters if provided
        if (from || to) {
            query.timestamp = {};
            if (from) query.timestamp.$gte = new Date(from);
            if (to) query.timestamp.$lte = new Date(to);
        }
        
        // For aggregated data, use AggregatedMarketData
        if (['1m', '5m', '15m', '1h', '1d'].includes(timeframe)) {
            const aggregatedData = await AggregatedMarketData.find({
                symbol: symbol.toUpperCase(),
                timeframe,
                ...query.timestamp ? { startTime: query.timestamp } : {}
            })
            .sort({ startTime: -1 })
            .limit(parseInt(limit));
            
            return res.json({
                success: true,
                data: aggregatedData,
                symbol: symbol.toUpperCase(),
                timeframe,
                count: aggregatedData.length
            });
        }
        
        // For raw data
        const rawData = await MarketData.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        
        res.json({
            success: true,
            data: rawData,
            symbol: symbol.toUpperCase(),
            timeframe: 'raw',
            count: rawData.length
        });
        
    } catch (error) {
        console.error('Historical data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch historical data',
            message: error.message
        });
    }
});

/**
 * @route POST /api/v3/market/ingestion/start
 * @desc Start market data ingestion for symbols
 * @access Private
 */
router.post('/ingestion/start', authenticateToken, async (req, res) => {
    try {
        if (!global.marketDataIngestion) {
            return res.status(503).json({
                success: false,
                error: 'Market Data Ingestion service not initialized'
            });
        }
        
        const { 
            symbols = [],
            priority = 'NORMAL',
            frequency = 1000
        } = req.body;
        
        if (!symbols || symbols.length === 0) {
            // Use default liquid symbols
            const defaultSymbols = global.symbolManager ? 
                global.symbolManager.getSymbolsForScanning('LIQUID', 50) : 
                ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
            
            symbols.push(...defaultSymbols);
        }
        
        const results = await global.marketDataIngestion.subscribeToSymbols(symbols, {
            priority,
            frequency: parseInt(frequency)
        });
        
        res.json({
            success: true,
            message: 'Market data ingestion started',
            data: {
                subscribed: results.filter(r => r.status === 'SUBSCRIBED').length,
                failed: results.filter(r => r.status === 'FAILED').length,
                results
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Ingestion start error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start ingestion',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v3/market/ingestion/status
 * @desc Get market data ingestion status and metrics
 * @access Private
 */
router.get('/ingestion/status', authenticateToken, async (req, res) => {
    try {
        if (!global.marketDataIngestion) {
            return res.status(503).json({
                success: false,
                error: 'Market Data Ingestion service not initialized'
            });
        }
        
        const metrics = global.marketDataIngestion.getMetrics();
        const isRunning = global.marketDataIngestion.isRunning;
        
        res.json({
            success: true,
            data: {
                isRunning,
                metrics,
                subscriptions: Array.from(global.marketDataIngestion.subscriptions.keys())
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Ingestion status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get ingestion status',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v3/opportunities
 * @desc Get trading opportunities
 * @access Private
 */
router.get('/opportunities', authenticateToken, async (req, res) => {
    try {
        const {
            status = 'ACTIVE',
            type,
            riskLevel,
            limit = 20
        } = req.query;
        
        let filter = {};
        
        if (status !== 'ALL') {
            if (status === 'ACTIVE') {
                filter['performance.status'] = { $in: ['IDENTIFIED', 'ACTIVE', 'TRIGGERED', 'ENTERED'] };
            } else {
                filter['performance.status'] = status;
            }
        }
        
        if (type) {
            filter['classification.type'] = type;
        }
        
        if (riskLevel) {
            filter['recommendation.risk.level'] = riskLevel;
        }
        
        const opportunities = await TradingOpportunity.find(filter)
            .sort({ 'classification.confidence': -1, createdAt: -1 })
            .limit(parseInt(limit));
        
        res.json({
            success: true,
            data: opportunities,
            count: opportunities.length,
            filters: { status, type, riskLevel, limit }
        });
        
    } catch (error) {
        console.error('Opportunities error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch opportunities',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v3/analytics/market-summary
 * @desc Get market analytics summary
 * @access Private
 */
router.get('/analytics/market-summary', authenticateToken, async (req, res) => {
    try {
        // Get latest market analytics
        const latestAnalytics = await MarketAnalytics.findOne({
            'scope.type': 'MARKET'
        }).sort({ createdAt: -1 });
        
        // Get active insights
        const activeInsights = await MarketInsights.find({
            'validation.status': 'PENDING'
        })
        .sort({ 'classification.priority': -1, createdAt: -1 })
        .limit(10);
        
        // Get market summary stats
        const marketStats = await MarketData.aggregate([
            {
                $match: {
                    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
                }
            },
            {
                $group: {
                    _id: null,
                    totalSymbols: { $addToSet: '$symbol' },
                    avgVolume: { $avg: '$ohlcv.volume' },
                    totalValue: { $sum: '$ohlcv.value' }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                analytics: latestAnalytics,
                insights: activeInsights,
                marketStats: marketStats[0] || {},
                summary: {
                    totalSymbols: marketStats[0]?.totalSymbols?.length || 0,
                    activeInsights: activeInsights.length,
                    lastUpdate: latestAnalytics?.createdAt
                }
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Market summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market summary',
            message: error.message
        });
    }
});

module.exports = router;
