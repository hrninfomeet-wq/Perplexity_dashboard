/**
 * ML Routes for Phase 3A Step 5
 * 
 * API v5 endpoints for ML-enhanced trading signals:
 * - /api/v5/ml/health - ML system health check
 * - /api/v5/ml/enhanced-signals/:symbol - Generate ML-enhanced signals
 * - /api/v5/ml/predictions/:symbol - Price predictions using LSTM
 * - /api/v5/ml/pattern-confidence/:symbol - ML-enhanced pattern confidence
 * - /api/v5/ml/model-performance - ML model performance metrics
 * - /api/v5/ml/feedback - Submit trading result feedback
 * - /api/v5/ml/retrain - Manual model retraining
 * 
 * Target Performance: <200ms ML processing time
 * Success Criteria: 25% improvement in signal accuracy
 */

const express = require('express');
const MLController = require('../controllers/mlController');
const router = express.Router();

// Initialize ML controller
const mlController = new MLController();

/**
 * @route GET /api/v5/ml/health
 * @desc ML system health check and status
 * @access Public
 * @returns {Object} ML system health status
 */
router.get('/health', async (req, res) => {
    await mlController.getMLHealth(req, res);
});

/**
 * @route GET /api/v5/ml/enhanced-signals/:symbol
 * @desc Generate ML-enhanced trading signals using ensemble methods
 * @param {string} symbol - Stock symbol (e.g., RELIANCE, TCS)
 * @query {string} timeframe - Time frame (1m, 3m, 5m, 15m, 30m, 1h, 4h, 1d)
 * @query {number} limit - Number of data points to analyze
 * @access Public
 * @returns {Object} Enhanced trading signals with ML confidence
 */
router.get('/enhanced-signals/:symbol', async (req, res) => {
    await mlController.getEnhancedSignals(req, res);
});

/**
 * @route GET /api/v5/ml/predictions/:symbol
 * @desc Generate price predictions using LSTM neural networks
 * @param {string} symbol - Stock symbol
 * @query {string} timeframe - Time frame for prediction
 * @query {number} horizon - Number of future periods to predict
 * @access Public
 * @returns {Object} Price predictions with confidence scores
 */
router.get('/predictions/:symbol', async (req, res) => {
    await mlController.getPricePredictions(req, res);
});

/**
 * @route GET /api/v5/ml/pattern-confidence/:symbol
 * @desc Get ML-enhanced pattern confidence scores
 * @param {string} symbol - Stock symbol
 * @query {string} timeframe - Time frame for pattern analysis
 * @access Public
 * @returns {Object} Pattern confidence enhancement results
 */
router.get('/pattern-confidence/:symbol', async (req, res) => {
    await mlController.getPatternConfidence(req, res);
});

/**
 * @route GET /api/v5/ml/model-performance
 * @desc Get ML model performance metrics and accuracy statistics
 * @access Public
 * @returns {Object} Model performance metrics and trends
 */
router.get('/model-performance', async (req, res) => {
    await mlController.getModelPerformance(req, res);
});

/**
 * @route POST /api/v5/ml/feedback
 * @desc Submit trading result feedback for model learning
 * @body {Object} feedback - Trading result feedback
 * @body {string} feedback.symbol - Stock symbol
 * @body {string} feedback.signalId - Signal identifier
 * @body {string} feedback.actualResult - Actual trading result (profit/loss)
 * @body {number} feedback.profitLoss - Profit/loss amount
 * @body {number} feedback.confidence - Signal confidence score
 * @access Public
 * @returns {Object} Feedback processing confirmation
 */
router.post('/feedback', async (req, res) => {
    await mlController.submitFeedback(req, res);
});

/**
 * @route POST /api/v5/ml/retrain
 * @desc Manually trigger ML model retraining
 * @access Public
 * @returns {Object} Retraining status and results
 */
router.post('/retrain', async (req, res) => {
    await mlController.retrain(req, res);
});

// Additional utility routes for ML monitoring

/**
 * @route GET /api/v5/ml/status
 * @desc Get detailed ML system status and configuration
 * @access Public
 * @returns {Object} Detailed ML system status
 */
router.get('/status', async (req, res) => {
    try {
        const status = mlController.mlEnhancer.getModelStatus();
        const { ML_CONFIG } = require('../config/ml/ml.config');
        
        res.json({
            success: true,
            data: {
                status,
                config: {
                    models: ML_CONFIG.MODELS,
                    performance: ML_CONFIG.PERFORMANCE,
                    features: ML_CONFIG.FEATURES
                },
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform
            },
            timestamp: new Date(),
            version: 'ML-3A.5.0'
        });
    } catch (error) {
        console.error('❌ Status check error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get ML status',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v5/ml/config
 * @desc Get ML configuration settings
 * @access Public
 * @returns {Object} ML configuration
 */
router.get('/config', async (req, res) => {
    try {
        const { ML_CONFIG } = require('../config/ml/ml.config');
        
        res.json({
            success: true,
            data: ML_CONFIG,
            timestamp: new Date(),
            version: 'ML-3A.5.0'
        });
    } catch (error) {
        console.error('❌ Config retrieval error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get ML config',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v5/ml/models/:modelName/details
 * @desc Get detailed information about a specific ML model
 * @param {string} modelName - Name of the model (pattern_classifier, price_predictor)
 * @access Public
 * @returns {Object} Model details and performance
 */
router.get('/models/:modelName/details', async (req, res) => {
    try {
        const { modelName } = req.params;
        
        // Validate model name
        const validModels = ['pattern_classifier', 'price_predictor', 'ensemble'];
        if (!validModels.includes(modelName)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid model name',
                validModels
            });
        }
        
        const MLModel = require('../models/ml/mlModel');
        const modelInfo = await MLModel.MLModel.findOne({ name: modelName });
        
        if (!modelInfo) {
            return res.status(404).json({
                success: false,
                error: 'Model not found',
                modelName
            });
        }
        
        // Get model performance data
        const performanceData = await MLModel.ModelAnalytics
            .find({ modelName })
            .sort({ timestamp: -1 })
            .limit(100);
        
        res.json({
            success: true,
            data: {
                model: modelInfo,
                performance: performanceData,
                stats: {
                    totalPredictions: performanceData.length,
                    averageAccuracy: performanceData.length > 0 ? 
                        performanceData.reduce((sum, p) => sum + p.accuracy, 0) / performanceData.length : 0,
                    lastUpdated: modelInfo.trainedAt
                }
            },
            timestamp: new Date(),
            version: 'ML-3A.5.0'
        });
        
    } catch (error) {
        console.error('❌ Model details error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get model details',
            message: error.message
        });
    }
});

/**
 * @route GET /api/v5/ml/benchmarks
 * @desc Get ML performance benchmarks and comparison with targets
 * @access Public
 * @returns {Object} Performance benchmarks
 */
router.get('/benchmarks', async (req, res) => {
    try {
        const { ML_CONFIG } = require('../config/ml/ml.config');
        
        // Calculate actual performance vs targets
        const MLModel = require('../models/ml/mlModel');
        const recentPredictions = await MLModel.SignalPrediction
            .find({
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });
        
        const accuratePredictions = recentPredictions.filter(p => p.isAccurate).length;
        const currentAccuracy = recentPredictions.length > 0 ? 
            accuratePredictions / recentPredictions.length : 0;
        
        const averageProcessingTime = recentPredictions.length > 0 ?
            recentPredictions.reduce((sum, p) => sum + (p.processingTime || 0), 0) / recentPredictions.length : 0;
        
        const benchmarks = {
            accuracy: {
                current: Math.round(currentAccuracy * 100) / 100,
                target: ML_CONFIG.PERFORMANCE.TARGET_ACCURACY,
                improvement: Math.round(((currentAccuracy / ML_CONFIG.PERFORMANCE.MIN_ACCURACY) - 1) * 100),
                status: currentAccuracy >= ML_CONFIG.PERFORMANCE.TARGET_ACCURACY ? 'achieved' : 'in_progress'
            },
            processingTime: {
                current: Math.round(averageProcessingTime),
                target: ML_CONFIG.PERFORMANCE.MAX_INFERENCE_TIME,
                status: averageProcessingTime <= ML_CONFIG.PERFORMANCE.MAX_INFERENCE_TIME ? 'achieved' : 'needs_optimization'
            },
            dataPoints: {
                total: recentPredictions.length,
                period: '24 hours',
                minimumRequired: ML_CONFIG.TRAINING.MIN_SAMPLES
            }
        };
        
        res.json({
            success: true,
            data: benchmarks,
            timestamp: new Date(),
            version: 'ML-3A.5.0'
        });
        
    } catch (error) {
        console.error('❌ Benchmarks error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get benchmarks',
            message: error.message
        });
    }
});

module.exports = router;
