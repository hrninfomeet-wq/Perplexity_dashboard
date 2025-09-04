/**
 * ML Signal Enhancer Service for Phase 3A Step 5
 * 
 * This service provides machine learning capabilities to enhance trading signal accuracy:
 * - Neural network pattern classification
 * - LSTM price prediction
 * - Ensemble signal generation
 * - Performance-based learning
 * - Real-time ML inference
 * 
 * Success Criteria:
 * - 25% improvement in signal accuracy
 * - <200ms ML processing time
 * - >70% price prediction accuracy
 * - Ensemble outperforming individual models by 15%
 */

const stats = require('simple-statistics');
const _ = require('lodash');
const moment = require('moment');
const synaptic = require('synaptic');
// const tf = require('@tensorflow/tfjs-node'); // Commented out due to native compilation issues
const MLModel = require('../../models/ml/mlModel');
const { ML_CONFIG } = require('../../config/ml/ml.config');

class MLSignalEnhancer {
    constructor() {
        this.models = new Map();
        this.patternClassifier = null;
        this.pricePredictor = null;
        
        // Use fallback ensemble weights if config structure doesn't match
        this.ensembleWeights = ML_CONFIG.models?.ensembleModel?.weights || {
            patterns: 0.4,
            technical: 0.3,
            price_prediction: 0.3
        };
        
        this.performanceData = [];
        this.isInitialized = false;
        
        console.log('🚀 ML Signal Enhancer initialized');
    }

    /**
     * Initialize ML models and load trained weights
     */
    async initialize() {
        try {
            console.log('🎯 Initializing ML Signal Enhancer...');
            
            // Initialize neural network for pattern classification
            await this.initializePatternClassifier();
            
            // Initialize LSTM for price prediction
            await this.initializePricePredictor();
            
            // Load existing model weights if available
            await this.loadTrainedModels();
            
            this.isInitialized = true;
            console.log('✅ ML Signal Enhancer initialization complete');
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing ML Signal Enhancer:', error.message);
            return false;
        }
    }

    /**
     * Initialize neural network for pattern classification
     */
    async initializePatternClassifier() {
        try {
            const config = ML_CONFIG.models?.patternClassifier || {
                architecture: { hiddenLayers: [10, 6] }
            };
            
            // Create neural network architecture
            const Layer = synaptic.Layer;
            const Network = synaptic.Network;
            const Trainer = synaptic.Trainer;
            
            const inputLayer = new Layer(config.features?.inputSize || 15);
            const hiddenLayer1 = new Layer(config.architecture.hiddenLayers[0]);
            const hiddenLayer2 = new Layer(config.architecture.hiddenLayers[1]);
            const outputLayer = new Layer(3); // bullish, bearish, neutral
            
            // Connect layers
            inputLayer.project(hiddenLayer1);
            hiddenLayer1.project(hiddenLayer2);
            hiddenLayer2.project(outputLayer);
            
            this.patternClassifier = new Network({
                input: inputLayer,
                hidden: [hiddenLayer1, hiddenLayer2],
                output: outputLayer
            });
            
            this.patternTrainer = new Trainer(this.patternClassifier);
            
            console.log('✅ Pattern classifier neural network initialized');
        } catch (error) {
            console.error('❌ Error initializing pattern classifier:', error.message);
            throw error;
        }
    }

    /**
     * Initialize simplified neural network for price prediction
     */
    async initializePricePredictor() {
        try {
            const config = ML_CONFIG.models?.pricePredictor?.shortTerm || {
                architecture: {
                    inputSize: 10,
                    hiddenLayers: [20, 10],
                    outputSize: 1
                }
            };
            
            // Create simple neural network for price prediction using Synaptic
            const Layer = synaptic.Layer;
            const Network = synaptic.Network;
            const Trainer = synaptic.Trainer;
            
            const inputLayer = new Layer(config.architecture.inputSize);
            const hiddenLayer1 = new Layer(config.architecture.hiddenLayers[0] || 20);
            const hiddenLayer2 = new Layer(config.architecture.hiddenLayers[1] || 10);
            const outputLayer = new Layer(config.architecture.outputSize);
            
            // Connect layers
            inputLayer.project(hiddenLayer1);
            hiddenLayer1.project(hiddenLayer2);
            hiddenLayer2.project(outputLayer);
            
            this.pricePredictor = new Network({
                input: inputLayer,
                hidden: [hiddenLayer1, hiddenLayer2],
                output: outputLayer
            });
            
            this.priceTrainer = new Trainer(this.pricePredictor);
            
            console.log('✅ Simplified neural network price predictor initialized');
        } catch (error) {
            console.error('❌ Error initializing price predictor:', error.message);
            throw error;
        }
    }

    /**
     * Main method: Enhance pattern confidence using ML
     */
    async enhancePatternConfidence(pattern, marketData, technicalIndicators) {
        try {
            if (!this.isInitialized) {
                console.log('⚠️ ML enhancer not initialized, using original confidence');
                return pattern.confidence || 0.5;
            }
            
            const startTime = Date.now();
            
            // Extract features for pattern classification
            const features = this.extractPatternFeatures(pattern, marketData, technicalIndicators);
            
            // Get ML confidence prediction
            const mlPrediction = this.patternClassifier.activate(features);
            const mlConfidence = this.interpretPatternPrediction(mlPrediction, pattern.type);
            
            // Combine original and ML confidence
            const enhancedConfidence = this.combineConfidenceScores(
                pattern.confidence || 0.5,
                mlConfidence,
                pattern.type
            );
            
            const processingTime = Date.now() - startTime;
            
            // Log performance metrics
            if (processingTime > ML_CONFIG.PERFORMANCE.MAX_INFERENCE_TIME) {
                console.log(`⚠️ ML processing took ${processingTime}ms (target: <${ML_CONFIG.PERFORMANCE.MAX_INFERENCE_TIME}ms)`);
            }
            
            // Store prediction for learning
            await this.storePrediction({
                type: 'pattern_confidence',
                pattern: pattern.type,
                originalConfidence: pattern.confidence,
                mlConfidence,
                enhancedConfidence,
                features,
                processingTime,
                timestamp: new Date()
            });
            
            return enhancedConfidence;
            
        } catch (error) {
            console.error('❌ Error enhancing pattern confidence:', error.message);
            return pattern.confidence || 0.5;
        }
    }

    /**
     * Generate price predictions using simplified neural network
     */
    async generatePricePrediction(symbol, marketData, timeframe = '5m') {
        try {
            if (!this.isInitialized || !this.pricePredictor) {
                console.log('⚠️ Price predictor not available');
                return null;
            }
            
            const startTime = Date.now();
            
            // Prepare input data for neural network
            const inputFeatures = this.preparePriceFeatures(marketData);
            if (!inputFeatures) {
                return null;
            }
            
            // Generate prediction using simple neural network
            const prediction = this.pricePredictor.activate(inputFeatures);
            const predictedPrice = prediction[0]; // Single output for price direction
            
            // Calculate prediction confidence based on recent accuracy
            const confidence = await this.calculatePredictionConfidence(symbol, timeframe);
            
            const processingTime = Date.now() - startTime;
            const currentPrice = marketData[marketData.length - 1]?.close;
            
            const result = {
                symbol,
                timeframe,
                predictedPrice: currentPrice * (1 + predictedPrice), // Apply percentage change
                currentPrice,
                direction: predictedPrice > 0 ? 'bullish' : 'bearish',
                confidence,
                processingTime,
                timestamp: new Date()
            };
            
            // Store prediction for learning
            await this.storePrediction({
                type: 'price_prediction',
                ...result
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Error generating price prediction:', error.message);
            return null;
        }
    }

    /**
     * Generate ensemble signal combining multiple ML models
     */
    async generateEnsembleSignal(symbol, patterns, technicalIndicators, marketData) {
        try {
            const startTime = Date.now();
            
            console.log(`🎯 Generating ensemble ML signal for ${symbol}...`);
            
            // Enhance pattern confidences
            const enhancedPatterns = await Promise.all(
                patterns.map(async (pattern) => ({
                    ...pattern,
                    enhancedConfidence: await this.enhancePatternConfidence(pattern, marketData, technicalIndicators)
                }))
            );
            
            // Generate price prediction
            const pricePrediction = await this.generatePricePrediction(symbol, marketData);
            
            // Calculate technical analysis score
            const technicalScore = this.calculateTechnicalScore(technicalIndicators);
            
            // Combine signals using ensemble weights
            const patternScore = this.calculatePatternScore(enhancedPatterns);
            const priceScore = pricePrediction ? (pricePrediction.direction === 'bullish' ? pricePrediction.confidence : -pricePrediction.confidence) : 0;
            
            const ensembleScore = 
                (patternScore * this.ensembleWeights.patterns) +
                (technicalScore * this.ensembleWeights.technical) +
                (priceScore * this.ensembleWeights.price_prediction);
            
            // Determine final signal
            const overallSignal = ensembleScore > this.ensembleWeights.threshold ? 'bullish' :
                                ensembleScore < -this.ensembleWeights.threshold ? 'bearish' : 'neutral';
            
            const confidence = Math.abs(ensembleScore);
            const processingTime = Date.now() - startTime;
            
            const result = {
                symbol,
                timestamp: new Date(),
                overallSignal,
                confidence,
                ensembleScore,
                components: {
                    patterns: patternScore,
                    technical: technicalScore,
                    pricePrediction: priceScore
                },
                enhancedPatterns,
                pricePrediction,
                processingTime,
                version: 'ML-3A.5.0'
            };
            
            // Store ensemble prediction
            await this.storePrediction({
                type: 'ensemble_signal',
                ...result
            });
            
            console.log(`✅ Ensemble signal generated in ${processingTime}ms`);
            return result;
            
        } catch (error) {
            console.error('❌ Error generating ensemble signal:', error.message);
            return {
                symbol,
                timestamp: new Date(),
                overallSignal: 'neutral',
                confidence: 0.5,
                error: error.message
            };
        }
    }

    // Feature extraction methods
    extractPatternFeatures(pattern, marketData, technicalIndicators) {
        const features = [];
        
        // Pattern-specific features
        features.push(pattern.confidence || 0.5);
        features.push(pattern.type === 'bullish' ? 1 : pattern.type === 'bearish' ? -1 : 0);
        
        // Market context features
        if (marketData.length >= 10) {
            const recentPrices = marketData.slice(-10).map(d => d.close);
            const volatility = stats.standardDeviation(recentPrices);
            const trend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
            
            features.push(volatility);
            features.push(trend);
        }
        
        // Technical indicator features
        if (technicalIndicators) {
            features.push(technicalIndicators.momentum?.rsi?.rsi14 || 50);
            features.push(technicalIndicators.momentum?.macd?.macd || 0);
            features.push(technicalIndicators.volatility?.bollingerBands?.position || 0);
        }
        
        // Volume features
        if (marketData.length >= 5) {
            const recentVolumes = marketData.slice(-5).map(d => d.volume);
            const avgVolume = stats.mean(recentVolumes);
            const currentVolume = recentVolumes[recentVolumes.length - 1];
            features.push(currentVolume / avgVolume);
        }
        
        // Normalize features to [0, 1] range
        return this.normalizeFeatures(features);
    }

    extractPredictionFeatures(marketData, patterns) {
        const features = [];
        
        // Price-based features
        if (marketData.length >= 20) {
            const prices = marketData.slice(-20).map(d => d.close);
            const returns = [];
            for (let i = 1; i < prices.length; i++) {
                returns.push((prices[i] - prices[i-1]) / prices[i-1]);
            }
            
            // Statistical features of returns
            features.push(stats.mean(returns));
            features.push(stats.standardDeviation(returns));
            features.push(stats.max(returns));
            features.push(stats.min(returns));
        }
        
        // Pattern strength features
        const patternStrengths = patterns.map(p => p.confidence || 0.5);
        if (patternStrengths.length > 0) {
            features.push(stats.mean(patternStrengths));
            features.push(stats.max(patternStrengths));
        }
        
        return this.normalizeFeatures(features);
    }

    normalizeFeatures(features) {
        // Simple min-max normalization
        return features.map(f => {
            if (typeof f !== 'number' || isNaN(f)) return 0.5;
            return Math.max(0, Math.min(1, f));
        });
    }

    // Training and learning methods
    async trainModelsWithHistoricalData() {
        try {
            console.log('🎯 Starting ML model training with historical data...');
            
            // Get historical pattern performance data
            const historicalData = await this.getHistoricalTrainingData();
            
            const minSamples = ML_CONFIG.training?.minSamples || 100;
            if (historicalData.length < minSamples) {
                console.log(`⚠️ Insufficient training data - need at least ${minSamples} samples`);
                return false;
            }
            
            // Train pattern classifier
            await this.trainPatternClassifier(historicalData);
            
            // Train price predictor
            await this.trainPricePredictor(historicalData);
            
            // Save trained models
            await this.saveTrainedModels();
            
            console.log('✅ ML model training completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error training ML models:', error.message);
            return false;
        }
    }

    async updateModelFromPerformance(tradingResult) {
        try {
            // Store performance feedback
            this.performanceData.push({
                ...tradingResult,
                timestamp: new Date()
            });
            
            // Retrain if enough new data
            const retrainThreshold = ML_CONFIG.training?.retrainThreshold || 50;
            if (this.performanceData.length >= retrainThreshold) {
                await this.retrainModels();
                this.performanceData = []; // Reset after retraining
            }
            
        } catch (error) {
            console.error('❌ Error updating model from performance:', error.message);
        }
    }

    // Helper methods for ML operations
    interpretPatternPrediction(prediction, patternType) {
        // Convert neural network output to confidence score
        const [bullish, bearish, neutral] = prediction;
        
        if (patternType === 'bullish') {
            return Math.max(0.1, Math.min(0.9, bullish));
        } else if (patternType === 'bearish') {
            return Math.max(0.1, Math.min(0.9, bearish));
        } else {
            return Math.max(0.1, Math.min(0.9, neutral));
        }
    }

    preparePriceFeatures(marketData) {
        const inputSize = ML_CONFIG.models?.pricePredictor?.shortTerm?.architecture?.inputSize || 10;
        
        if (marketData.length < inputSize) {
            return null;
        }
        
        const recentData = marketData.slice(-inputSize);
        const features = [];
        
        // Price-based features
        const prices = recentData.map(d => d.close);
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        // Add normalized returns as features
        features.push(...this.normalizeFeatures(returns));
        
        // Volume features
        const volumes = recentData.map(d => d.volume);
        const normalizedVolumes = this.normalizeFeatures(volumes);
        features.push(normalizedVolumes[normalizedVolumes.length - 1]); // Latest volume
        
        // Ensure we have exactly the right number of features
        while (features.length < inputSize) {
            features.push(0.5); // Default neutral value
        }
        
        return features.slice(0, inputSize);
    }

    normalizeTimeSeriesData(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        
        if (range === 0) return data.map(() => 0.5);
        
        return data.map(value => (value - min) / range);
    }

    calculateTechnicalScore(indicators) {
        let score = 0;
        let count = 0;
        
        // RSI contribution
        if (indicators?.momentum?.rsi?.rsi14) {
            const rsi = indicators.momentum.rsi.rsi14;
            if (rsi < 30) score += 0.8; // Oversold - bullish
            else if (rsi > 70) score -= 0.8; // Overbought - bearish
            else score += (50 - rsi) / 50; // Neutral zone
            count++;
        }
        
        // MACD contribution
        if (indicators?.momentum?.macd) {
            const macd = indicators.momentum.macd.macd;
            const signal = indicators.momentum.macd.signal;
            if (macd > signal) score += 0.5;
            else score -= 0.5;
            count++;
        }
        
        // Bollinger Bands position
        if (indicators?.volatility?.bollingerBands?.position !== undefined) {
            const position = indicators.volatility.bollingerBands.position;
            score += position; // Already normalized -1 to 1
            count++;
        }
        
        return count > 0 ? score / count : 0;
    }

    calculatePatternScore(patterns) {
        if (!patterns || patterns.length === 0) return 0;
        
        let totalScore = 0;
        patterns.forEach(pattern => {
            const confidence = pattern.enhancedConfidence || pattern.confidence || 0.5;
            const typeMultiplier = pattern.type === 'bullish' ? 1 : pattern.type === 'bearish' ? -1 : 0;
            totalScore += confidence * typeMultiplier;
        });
        
        return totalScore / patterns.length;
    }

    async calculatePredictionConfidence(symbol, timeframe) {
        try {
            // Get recent prediction accuracy for this symbol
            const recentPredictions = await MLModel.SignalPrediction
                .find({ 
                    symbol, 
                    timeframe,
                    timestamp: { $gte: moment().subtract(24, 'hours').toDate() }
                })
                .sort({ timestamp: -1 })
                .limit(20);
            
            if (recentPredictions.length === 0) return 0.6; // Default confidence
            
            const accurateCount = recentPredictions.filter(p => p.isAccurate).length;
            return Math.max(0.1, Math.min(0.9, accurateCount / recentPredictions.length));
            
        } catch (error) {
            console.error('❌ Error calculating prediction confidence:', error.message);
            return 0.6;
        }
    }

    // Database operations
    async storePrediction(predictionData) {
        try {
            await MLModel.SignalPrediction.create(predictionData);
        } catch (error) {
            console.error('❌ Error storing prediction:', error.message);
        }
    }

    async getHistoricalTrainingData() {
        try {
            const lookback = ML_CONFIG.training?.performanceLookback || 1000;
            return await MLModel.TrainingData
                .find({ isValidated: true })
                .sort({ timestamp: -1 })
                .limit(lookback);
        } catch (error) {
            console.error('❌ Error fetching training data:', error.message);
            return [];
        }
    }

    async saveTrainedModels() {
        try {
            // Save neural network weights
            if (this.patternClassifier) {
                const modelData = {
                    name: 'pattern_classifier',
                    type: 'neural_network',
                    architecture: ML_CONFIG.MODELS.PATTERN_CLASSIFIER,
                    weights: this.patternClassifier.toJSON(),
                    version: '3A.5.0',
                    trainedAt: new Date()
                };
                
                await MLModel.MLModel.findOneAndUpdate(
                    { name: 'pattern_classifier' },
                    modelData,
                    { upsert: true }
                );
            }
            
            // Save LSTM model if needed (TensorFlow.js has its own save method)
            console.log('✅ Trained models saved successfully');
            
        } catch (error) {
            console.error('❌ Error saving trained models:', error.message);
        }
    }

    async loadTrainedModels() {
        try {
            // Load pattern classifier weights
            const savedModel = await MLModel.MLModel.findOne({ name: 'pattern_classifier' });
            if (savedModel && savedModel.weights) {
                this.patternClassifier.fromJSON(savedModel.weights);
                console.log('✅ Loaded saved pattern classifier');
            }
            
        } catch (error) {
            console.error('❌ Error loading trained models:', error.message);
        }
    }

    // Utility and helper methods
    combineConfidenceScores(originalConfidence, mlConfidence, patternType) {
        // Weighted combination based on pattern type reliability
        const patternWeight = this.getPatternTypeWeight(patternType);
        const mlWeight = 1 - patternWeight;
        
        return (originalConfidence * patternWeight) + (mlConfidence * mlWeight);
    }

    getPatternTypeWeight(patternType) {
        // Pattern type reliability weights based on historical performance
        const weights = {
            'hammer': 0.7,
            'engulfing_bullish': 0.8,
            'engulfing_bearish': 0.8,
            'doji': 0.5,
            'shooting_star': 0.7,
            'default': 0.6
        };
        
        return weights[patternType] || weights.default;
    }

    getModelStatus() {
        return {
            isInitialized: this.isInitialized,
            modelsLoaded: {
                patternClassifier: !!this.patternClassifier,
                pricePredictor: !!this.pricePredictor
            },
            performanceDataPoints: this.performanceData.length,
            ensembleWeights: this.ensembleWeights,
            version: '3A.5.0'
        };
    }

    // Health check method
    async healthCheck() {
        return {
            status: this.isInitialized ? 'healthy' : 'initializing',
            models: this.getModelStatus(),
            config: {
                maxInferenceTime: ML_CONFIG.PERFORMANCE.MAX_INFERENCE_TIME,
                targetAccuracy: ML_CONFIG.PERFORMANCE.TARGET_ACCURACY,
                minConfidence: ML_CONFIG.PERFORMANCE.CONFIDENCE_THRESHOLD
            },
            timestamp: new Date()
        };
    }
}

module.exports = MLSignalEnhancer;
