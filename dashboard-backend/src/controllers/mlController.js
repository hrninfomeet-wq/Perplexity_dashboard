/**
 * ML Controller for Phase 3A Step 5
 * 
 * Handles ML-enhanced trading signal API endpoints:
 * - Enhanced pattern confidence
 * - Price predictions
 * - Ensemble signal generation
 * - Model performance metrics
 * - ML health monitoring
 * 
 * API Version: v5 (ML-Enhanced)
 */

const MLSignalEnhancer = require('../services/ml/mlSignalEnhancer');
const { ML_CONFIG } = require('../config/ml/ml.config');

class MLController {
    constructor() {
        this.mlEnhancer = new MLSignalEnhancer();
        
        // Initialize ML enhancer
        this.initializeMLEnhancer();
    }

    async initializeMLEnhancer() {
        try {
            await this.mlEnhancer.initialize();
            console.log('✅ ML Controller initialized with enhanced capabilities');
        } catch (error) {
            console.error('❌ Error initializing ML Controller:', error.message);
        }
    }

    /**
     * GET /api/v5/ml/health
     * ML system health check
     */
    async getMLHealth(req, res) {
        try {
            const healthStatus = await this.mlEnhancer.healthCheck();
            
            res.json({
                success: true,
                data: healthStatus,
                timestamp: new Date(),
                version: 'ML-3A.5.0'
            });
            
        } catch (error) {
            console.error('❌ ML health check error:', error.message);
            res.status(500).json({
                success: false,
                error: 'ML health check failed',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v5/ml/enhanced-signals/:symbol
     * Generate ML-enhanced trading signals
     */
    async getEnhancedSignals(req, res) {
        try {
            const { symbol } = req.params;
            const { timeframe = '5m', limit = 100 } = req.query;
            
            console.log(`🎯 Generating ML-enhanced signals for ${symbol} (${timeframe})`);
            
            const startTime = Date.now();
            
            // For demo purposes, create sample data
            const marketData = this.generateSampleMarketData(symbol, limit);
            const patterns = this.generateSamplePatterns(symbol);
            const technicalIndicators = this.generateSampleIndicators();
            
            // Generate ML-enhanced ensemble signal
            const enhancedSignal = await this.mlEnhancer.generateEnsembleSignal(
                symbol,
                patterns,
                technicalIndicators,
                marketData
            );
            
            const totalProcessingTime = Date.now() - startTime;
            
            // Check performance target
            const performanceTarget = (ML_CONFIG.performance?.maxInferenceTime || 100) * 2; // 200ms target
            if (totalProcessingTime > performanceTarget) {
                console.log(`⚠️ Total processing time ${totalProcessingTime}ms exceeds target ${performanceTarget}ms`);
            }
            
            res.json({
                success: true,
                data: {
                    ...enhancedSignal,
                    marketData: {
                        symbol,
                        timeframe,
                        currentPrice: marketData[marketData.length - 1]?.close,
                        dataPoints: marketData.length
                    },
                    performance: {
                        totalProcessingTime,
                        target: performanceTarget,
                        withinTarget: totalProcessingTime <= performanceTarget
                    }
                },
                timestamp: new Date(),
                version: 'ML-3A.5.0'
            });
            
        } catch (error) {
            console.error('❌ Enhanced signals error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to generate enhanced signals',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v5/ml/predictions/:symbol
     * Generate price predictions using neural networks
     */
    async getPricePredictions(req, res) {
        try {
            const { symbol } = req.params;
            const { timeframe = '5m', horizon = 5 } = req.query;
            
            console.log(`🔮 Generating price predictions for ${symbol}`);
            
            // Generate sample market data
            const marketData = this.generateSampleMarketData(symbol, 100);
            if (marketData.length < 20) {
                return res.status(404).json({
                    success: false,
                    error: 'Insufficient market data for prediction',
                    symbol,
                    required: 20,
                    available: marketData.length
                });
            }
            
            // Generate multiple predictions for different horizons
            const predictions = [];
            for (let i = 1; i <= Math.min(horizon, 10); i++) {
                const prediction = await this.mlEnhancer.generatePricePrediction(symbol, marketData, timeframe);
                if (prediction) {
                    predictions.push({
                        ...prediction,
                        horizon: i,
                        timeAhead: `${i * this.getTimeframeMinutes(timeframe)}m`
                    });
                }
            }
            
            // Calculate prediction summary
            const bullishPredictions = predictions.filter(p => p.direction === 'bullish').length;
            const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
            
            res.json({
                success: true,
                data: {
                    symbol,
                    timeframe,
                    predictions,
                    summary: {
                        totalPredictions: predictions.length,
                        bullishCount: bullishPredictions,
                        bearishCount: predictions.length - bullishPredictions,
                        averageConfidence: Math.round(averageConfidence * 100) / 100,
                        overallDirection: bullishPredictions > predictions.length / 2 ? 'bullish' : 'bearish'
                    },
                    currentPrice: marketData[marketData.length - 1]?.close
                },
                timestamp: new Date(),
                version: 'ML-3A.5.0'
            });
            
        } catch (error) {
            console.error('❌ Price predictions error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to generate price predictions',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v5/ml/pattern-confidence/:symbol
     * Get ML-enhanced pattern confidence scores
     */
    async getPatternConfidence(req, res) {
        try {
            const { symbol } = req.params;
            const { timeframe = '5m' } = req.query;
            
            console.log(`📊 Calculating ML-enhanced pattern confidence for ${symbol}`);
            
            // Generate sample data
            const marketData = this.generateSampleMarketData(symbol, 100);
            const patterns = this.generateSamplePatterns(symbol);
            const technicalIndicators = this.generateSampleIndicators();
            
            // Enhance each pattern with ML confidence
            const enhancedPatterns = await Promise.all(
                patterns.map(async (pattern) => {
                    const originalConfidence = pattern.confidence;
                    const enhancedConfidence = await this.mlEnhancer.enhancePatternConfidence(
                        pattern,
                        marketData,
                        technicalIndicators
                    );
                    
                    return {
                        ...pattern,
                        originalConfidence,
                        enhancedConfidence,
                        improvement: enhancedConfidence - originalConfidence,
                        improvementPercent: Math.round(((enhancedConfidence - originalConfidence) / originalConfidence) * 100)
                    };
                })
            );
            
            // Calculate enhancement statistics
            const improvements = enhancedPatterns.map(p => p.improvement);
            const averageImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
            const positiveImprovements = improvements.filter(imp => imp > 0).length;
            
            res.json({
                success: true,
                data: {
                    symbol,
                    timeframe,
                    patterns: enhancedPatterns,
                    enhancement: {
                        averageImprovement: Math.round(averageImprovement * 100) / 100,
                        positiveEnhancements: positiveImprovements,
                        totalPatterns: enhancedPatterns.length,
                        improvementRate: Math.round((positiveImprovements / enhancedPatterns.length) * 100)
                    }
                },
                timestamp: new Date(),
                version: 'ML-3A.5.0'
            });
            
        } catch (error) {
            console.error('❌ Pattern confidence error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to calculate pattern confidence',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v5/ml/model-performance
     * Get ML model performance metrics
     */
    async getModelPerformance(req, res) {
        try {
            console.log('📈 Retrieving ML model performance metrics');
            
            // Get model status
            const modelStatus = this.mlEnhancer.getModelStatus();
            
            // Calculate mock accuracy metrics for demonstration
            const accuracyMetrics = {
                totalPredictions: 150,
                accuracy: 0.72,
                patternAccuracy: 0.75,
                priceAccuracy: 0.68,
                averageConfidence: 0.71,
                breakdown: {
                    patternPredictions: 90,
                    pricePredictions: 60,
                    ensemblePredictions: 150
                }
            };
            
            // Mock performance trends
            const performanceTrends = [
                { date: '2025-09-01', accuracy: 0.65, totalPredictions: 20 },
                { date: '2025-09-02', accuracy: 0.70, totalPredictions: 25 },
                { date: '2025-09-03', accuracy: 0.72, totalPredictions: 30 }
            ];
            
            res.json({
                success: true,
                data: {
                    modelStatus,
                    performance: {
                        ...accuracyMetrics,
                        trends: performanceTrends,
                        targets: {
                            signalAccuracy: ML_CONFIG.performance?.targetAccuracy || 0.75,
                            processingTime: ML_CONFIG.performance?.maxInferenceTime || 100,
                            minConfidence: ML_CONFIG.performance?.confidenceThreshold || 0.65
                        }
                    },
                    config: ML_CONFIG.performance || {}
                },
                timestamp: new Date(),
                version: 'ML-3A.5.0'
            });
            
        } catch (error) {
            console.error('❌ Model performance error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve model performance',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v5/ml/feedback
     * Submit trading result feedback for model learning
     */
    async submitFeedback(req, res) {
        try {
            const { symbol, signalId, actualResult, profitLoss, confidence } = req.body;
            
            console.log(`📝 Processing ML feedback for ${symbol}`);
            
            // Validate feedback data
            if (!symbol || !signalId || actualResult === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required feedback parameters',
                    required: ['symbol', 'signalId', 'actualResult']
                });
            }
            
            // Update model with performance feedback
            await this.mlEnhancer.updateModelFromPerformance({
                symbol,
                signalId,
                actualResult,
                profitLoss: profitLoss || 0,
                confidence: confidence || 0.5,
                timestamp: new Date()
            });
            
            res.json({
                success: true,
                message: 'Feedback processed successfully',
                data: {
                    symbol,
                    signalId,
                    processingTimestamp: new Date()
                }
            });
            
        } catch (error) {
            console.error('❌ Feedback processing error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to process feedback',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v5/ml/retrain
     * Manually trigger model retraining
     */
    async retrain(req, res) {
        try {
            console.log('🔄 Manual ML model retraining triggered');
            
            const retrainResult = await this.mlEnhancer.trainModelsWithHistoricalData();
            
            if (retrainResult) {
                res.json({
                    success: true,
                    message: 'Model retraining completed successfully',
                    timestamp: new Date()
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Model retraining failed - insufficient data or other error'
                });
            }
            
        } catch (error) {
            console.error('❌ Manual retraining error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrain models',
                message: error.message
            });
        }
    }

    // Helper methods for generating sample data
    generateSampleMarketData(symbol, count) {
        const data = [];
        let basePrice = 1000 + Math.random() * 500; // Random base price
        
        for (let i = 0; i < count; i++) {
            const change = (Math.random() - 0.5) * 20; // Random price change
            basePrice += change;
            
            data.push({
                symbol,
                timestamp: new Date(Date.now() - (count - i) * 60000), // 1 minute intervals
                open: basePrice - Math.random() * 5,
                high: basePrice + Math.random() * 10,
                low: basePrice - Math.random() * 8,
                close: basePrice,
                volume: Math.floor(Math.random() * 10000) + 1000
            });
        }
        
        return data;
    }

    generateSamplePatterns(symbol) {
        const patternTypes = ['hammer', 'engulfing_bullish', 'doji', 'shooting_star'];
        const patterns = [];
        
        for (let i = 0; i < 3; i++) {
            patterns.push({
                type: patternTypes[Math.floor(Math.random() * patternTypes.length)],
                signal: Math.random() > 0.5 ? 'bullish' : 'bearish',
                confidence: 0.5 + Math.random() * 0.4, // 0.5 to 0.9
                timestamp: new Date(),
                symbol
            });
        }
        
        return patterns;
    }

    generateSampleIndicators() {
        return {
            momentum: {
                rsi: { rsi14: 30 + Math.random() * 40 }, // 30-70 range
                macd: { 
                    macd: (Math.random() - 0.5) * 10,
                    signal: (Math.random() - 0.5) * 8
                }
            },
            volatility: {
                bollingerBands: { 
                    position: (Math.random() - 0.5) * 2 // -1 to 1
                }
            }
        };
    }

    getTimeframeMinutes(timeframe) {
        const timeframes = {
            '1m': 1,
            '3m': 3,
            '5m': 5,
            '15m': 15,
            '30m': 30,
            '1h': 60,
            '4h': 240,
            '1d': 1440
        };
        return timeframes[timeframe] || 5;
    }
}

module.exports = MLController;
