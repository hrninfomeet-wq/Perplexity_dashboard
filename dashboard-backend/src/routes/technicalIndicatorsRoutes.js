// dashboard-backend/src/routes/technicalIndicatorsRoutes.js

/**
 * Technical Indicators API Routes - Phase 3A Step 3
 * REST endpoints for technical analysis and indicators
 * 
 * @version 3A.3.0
 * @created September 04, 2025
 * @phase Phase 3A - Step 3: Technical Indicators Engine
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

// Import models
const { TechnicalIndicator, IndicatorAlert } = require('../models/technicalIndicatorsModel');

/**
 * @route GET /api/v3/indicators/health
 * @desc Get Technical Indicators Engine health status
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const engine = global.technicalIndicatorsEngine;
        
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Technical Indicators Engine not initialized',
                timestamp: new Date()
            });
        }
        
        const status = engine.getStatus();
        
        // Get recent indicators count
        const recentCount = await TechnicalIndicator.countDocuments({
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        // Get active alerts count
        const activeAlerts = await IndicatorAlert.countDocuments({
            status: 'active',
            triggered: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        
        res.json({
            success: true,
            engine: status,
            metrics: {
                recentIndicators: recentCount,
                activeAlerts,
                lastUpdate: new Date()
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Technical Indicators health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v3/indicators/:symbol
 * @desc Get latest technical indicators for a symbol
 * @access Private
 */
router.get('/:symbol', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframe = '5m', limit = 1 } = req.query;
        
        const indicators = await TechnicalIndicator.find({
            symbol: symbol.toUpperCase(),
            timeframe
        })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean();
        
        if (!indicators.length) {
            return res.status(404).json({
                success: false,
                error: 'No indicators found',
                message: `No technical indicators found for ${symbol} on ${timeframe} timeframe`,
                timestamp: new Date()
            });
        }
        
        res.json({
            success: true,
            symbol,
            timeframe,
            count: indicators.length,
            data: indicators,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error(`Error fetching indicators for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch indicators',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v3/indicators/:symbol/signals
 * @desc Get trading signals for a symbol
 * @access Private
 */
router.get('/:symbol/signals', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframe = '5m' } = req.query;
        
        const latest = await TechnicalIndicator.findOne({
            symbol: symbol.toUpperCase(),
            timeframe
        })
        .sort({ timestamp: -1 })
        .select('signals timestamp')
        .lean();
        
        if (!latest) {
            return res.status(404).json({
                success: false,
                error: 'No signals found',
                message: `No signals available for ${symbol}`,
                timestamp: new Date()
            });
        }
        
        res.json({
            success: true,
            symbol,
            timeframe,
            signals: latest.signals,
            calculatedAt: latest.timestamp,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error(`Error fetching signals for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch signals',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route POST /api/v3/indicators/:symbol/calculate
 * @desc Trigger manual calculation of indicators for a symbol
 * @access Private
 */
router.post('/:symbol/calculate', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframe = '5m', force = false } = req.body;
        
        const engine = global.technicalIndicatorsEngine;
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Technical Indicators Engine not available',
                timestamp: new Date()
            });
        }
        
        // Check if recent calculation exists (unless forced)
        if (!force) {
            const recent = await TechnicalIndicator.findOne({
                symbol: symbol.toUpperCase(),
                timeframe,
                timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes
            });
            
            if (recent) {
                return res.json({
                    success: true,
                    message: 'Recent calculation exists',
                    data: recent,
                    timestamp: new Date()
                });
            }
        }
        
        // Trigger calculation
        const indicators = await engine.calculateIndicators(symbol.toUpperCase(), timeframe);
        
        res.json({
            success: true,
            message: 'Indicators calculated successfully',
            symbol,
            timeframe,
            data: indicators,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error(`Error calculating indicators for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Calculation failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v3/indicators/alerts/active
 * @desc Get active indicator alerts
 * @access Private
 */
router.get('/alerts/active', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, severity, symbol } = req.query;
        
        const filter = {
            status: 'active',
            triggered: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        };
        
        if (severity) filter.severity = severity;
        if (symbol) filter.symbol = symbol.toUpperCase();
        
        const alerts = await IndicatorAlert.find(filter)
            .sort({ triggered: -1 })
            .limit(parseInt(limit))
            .lean();
        
        // Group by severity
        const grouped = alerts.reduce((acc, alert) => {
            if (!acc[alert.severity]) acc[alert.severity] = [];
            acc[alert.severity].push(alert);
            return acc;
        }, {});
        
        res.json({
            success: true,
            count: alerts.length,
            grouped,
            alerts,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alerts',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v3/indicators/market/overview
 * @desc Get market-wide technical overview
 * @access Private
 */
router.get('/market/overview', authenticateToken, async (req, res) => {
    try {
        const { timeframe = '1d' } = req.query;
        
        // Get latest indicators for top symbols
        const pipeline = [
            {
                $match: {
                    timeframe,
                    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            },
            {
                $sort: { symbol: 1, timestamp: -1 }
            },
            {
                $group: {
                    _id: '$symbol',
                    latest: { $first: '$$ROOT' }
                }
            },
            {
                $limit: 50
            }
        ];
        
        const results = await TechnicalIndicator.aggregate(pipeline);
        const indicators = results.map(r => r.latest);
        
        // Calculate market statistics
        const stats = {
            total: indicators.length,
            bullish: indicators.filter(i => i.signals?.overall?.signal?.includes('buy')).length,
            bearish: indicators.filter(i => i.signals?.overall?.signal?.includes('sell')).length,
            neutral: indicators.filter(i => i.signals?.overall?.signal === 'hold').length,
            avgRSI: indicators.reduce((sum, i) => sum + (i.momentum?.rsi?.rsi14 || 50), 0) / indicators.length,
            overbought: indicators.filter(i => (i.momentum?.rsi?.rsi14 || 50) >= 70).length,
            oversold: indicators.filter(i => (i.momentum?.rsi?.rsi14 || 50) <= 30).length
        };
        
        res.json({
            success: true,
            timeframe,
            marketStats: stats,
            symbols: indicators.map(i => ({
                symbol: i.symbol,
                signal: i.signals?.overall?.signal,
                score: i.signals?.overall?.score,
                rsi: i.momentum?.rsi?.rsi14,
                trend: i.signals?.trend?.direction
            })),
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error generating market overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate market overview',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v3/indicators/screener
 * @desc Screen symbols based on technical criteria
 * @access Private
 */
router.get('/screener', authenticateToken, async (req, res) => {
    try {
        const {
            timeframe = '1d',
            minRSI,
            maxRSI,
            signal,
            trend,
            limit = 20
        } = req.query;
        
        // Build filter criteria
        const filter = {
            timeframe,
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        };
        
        if (minRSI) filter['momentum.rsi.rsi14'] = { $gte: parseFloat(minRSI) };
        if (maxRSI) {
            if (filter['momentum.rsi.rsi14']) {
                filter['momentum.rsi.rsi14'].$lte = parseFloat(maxRSI);
            } else {
                filter['momentum.rsi.rsi14'] = { $lte: parseFloat(maxRSI) };
            }
        }
        if (signal) filter['signals.overall.signal'] = signal;
        if (trend) filter['signals.trend.direction'] = trend;
        
        // Get latest for each symbol
        const pipeline = [
            { $match: filter },
            { $sort: { symbol: 1, timestamp: -1 } },
            {
                $group: {
                    _id: '$symbol',
                    latest: { $first: '$$ROOT' }
                }
            },
            { $limit: parseInt(limit) },
            {
                $project: {
                    symbol: '$latest.symbol',
                    signals: '$latest.signals',
                    rsi: '$latest.momentum.rsi.rsi14',
                    macd: '$latest.momentum.macd',
                    timestamp: '$latest.timestamp'
                }
            }
        ];
        
        const results = await TechnicalIndicator.aggregate(pipeline);
        
        res.json({
            success: true,
            criteria: { timeframe, minRSI, maxRSI, signal, trend },
            count: results.length,
            results,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error running screener:', error);
        res.status(500).json({
            success: false,
            error: 'Screener failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

module.exports = router;
