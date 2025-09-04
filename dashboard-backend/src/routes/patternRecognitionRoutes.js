// dashboard-backend/src/routes/patternRecognitionRoutes.js

/**
 * Pattern Recognition API Routes - Phase 3A Step 4
 * REST endpoints for advanced pattern recognition and scalping signals
 * 
 * @version 3A.4.0
 * @created September 04, 2025
 * @phase Phase 3A - Step 4: Advanced Pattern Recognition + Scalping Timeframes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route GET /api/v4/patterns/health
 * @desc Get Pattern Recognition Engine health status
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const engine = global.patternRecognitionEngine;
        
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Pattern Recognition Engine not initialized',
                timestamp: new Date()
            });
        }
        
        const status = engine.getStatus();
        
        res.json({
            success: true,
            engine: status,
            capabilities: [
                'candlestick_patterns',
                'chart_patterns', 
                'scalping_signals',
                'multi_timeframe_analysis',
                'smart_money_concepts'
            ],
            timeframes: ['1m', '3m', '5m', '15m', '1h', '1d'],
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Pattern Recognition health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v4/patterns/:symbol/detect
 * @desc Detect patterns for a symbol across multiple timeframes
 * @access Private
 */
router.get('/:symbol/detect', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframes = '1m,5m,15m', limit = 100 } = req.query;
        
        const engine = global.patternRecognitionEngine;
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Pattern Recognition Engine not available'
            });
        }
        
        const timeframeArray = timeframes.split(',');
        const results = {};
        
        for (const timeframe of timeframeArray) {
            try {
                const patterns = await engine.detectPatterns(symbol, timeframe, parseInt(limit));
                results[timeframe] = patterns;
            } catch (error) {
                console.warn(`Pattern detection failed for ${symbol} ${timeframe}:`, error.message);
                results[timeframe] = { error: error.message, patterns: [] };
            }
        }
        
        res.json({
            success: true,
            symbol,
            timeframes: timeframeArray,
            results,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error(`Error detecting patterns for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Pattern detection failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v4/patterns/:symbol/candlesticks
 * @desc Get candlestick patterns for a symbol
 * @access Private
 */
router.get('/:symbol/candlesticks', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframe = '5m', limit = 50 } = req.query;
        
        const engine = global.patternRecognitionEngine;
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Pattern Recognition Engine not available'
            });
        }
        
        const candlestickPatterns = await engine.detectCandlestickPatterns(symbol, timeframe, parseInt(limit));
        
        res.json({
            success: true,
            symbol,
            timeframe,
            patterns: candlestickPatterns,
            count: candlestickPatterns.length,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error(`Error detecting candlestick patterns for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Candlestick pattern detection failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v4/scalping/signals/:symbol
 * @desc Get scalping signals for ultra-fast timeframes
 * @access Private
 */
router.get('/signals/:symbol', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframes = '1m,3m,5m' } = req.query;
        
        const engine = global.patternRecognitionEngine;
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Pattern Recognition Engine not available'
            });
        }
        
        const timeframeArray = timeframes.split(',');
        const scalpingSignals = {};
        
        for (const timeframe of timeframeArray) {
            try {
                const signals = await engine.generateScalpingSignals(symbol, timeframe);
                scalpingSignals[timeframe] = signals;
            } catch (error) {
                console.warn(`Scalping signal generation failed for ${symbol} ${timeframe}:`, error.message);
                scalpingSignals[timeframe] = { error: error.message, signals: [] };
            }
        }
        
        // Multi-timeframe confluence
        const confluence = engine.analyzeMultiTimeframeConfluence(scalpingSignals);
        
        res.json({
            success: true,
            symbol,
            timeframes: timeframeArray,
            signals: scalpingSignals,
            confluence,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error(`Error generating scalping signals for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Scalping signal generation failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v4/patterns/market/scan
 * @desc Scan market for patterns across multiple symbols
 * @access Private
 */
router.get('/market/scan', authenticateToken, async (req, res) => {
    try {
        const { 
            timeframe = '5m', 
            patternTypes = 'candlestick,chart', 
            limit = 20,
            minConfidence = 0.7 
        } = req.query;
        
        const engine = global.patternRecognitionEngine;
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Pattern Recognition Engine not available'
            });
        }
        
        // Get symbols from symbol manager
        const symbolManager = global.symbolManager;
        if (!symbolManager) {
            return res.status(503).json({
                success: false,
                error: 'Symbol Manager not available'
            });
        }
        
        const symbols = symbolManager.getSymbolsForScanning('LIQUID', parseInt(limit));
        const patternTypeArray = patternTypes.split(',');
        
        const marketScan = await engine.scanMarket(symbols, timeframe, {
            patternTypes: patternTypeArray,
            minConfidence: parseFloat(minConfidence)
        });
        
        res.json({
            success: true,
            timeframe,
            symbols: symbols.length,
            patterns: marketScan,
            summary: {
                totalPatterns: marketScan.length,
                highConfidence: marketScan.filter(p => p.confidence >= 0.8).length,
                bullishPatterns: marketScan.filter(p => p.signal === 'bullish').length,
                bearishPatterns: marketScan.filter(p => p.signal === 'bearish').length
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error scanning market for patterns:', error);
        res.status(500).json({
            success: false,
            error: 'Market pattern scan failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

/**
 * @route GET /api/v4/scalping/opportunities
 * @desc Get real-time scalping opportunities across all liquid symbols
 * @access Private
 */
router.get('/opportunities', authenticateToken, async (req, res) => {
    try {
        const { 
            timeframe = '1m',
            minScore = 0.75,
            limit = 10 
        } = req.query;
        
        const engine = global.patternRecognitionEngine;
        if (!engine) {
            return res.status(503).json({
                success: false,
                error: 'Pattern Recognition Engine not available'
            });
        }
        
        const opportunities = await engine.findScalpingOpportunities({
            timeframe,
            minScore: parseFloat(minScore),
            limit: parseInt(limit)
        });
        
        res.json({
            success: true,
            timeframe,
            opportunities,
            count: opportunities.length,
            criteria: { minScore, limit },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error finding scalping opportunities:', error);
        res.status(500).json({
            success: false,
            error: 'Scalping opportunities search failed',
            message: error.message,
            timestamp: new Date()
        });
    }
});

module.exports = router;
