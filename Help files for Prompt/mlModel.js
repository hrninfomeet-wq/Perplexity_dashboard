// dashboard-backend/src/models/mlModel.js
/**
 * Machine Learning Database Models - Phase 3A Step 5
 * Enhanced models for ML data storage and performance tracking
 */

const mongoose = require('mongoose');

// ML Model Storage Schema
const mlModelSchema = new mongoose.Schema({
    modelName: { type: String, required: true, unique: true, index: true },
    modelType: { 
        type: String, 
        enum: ['neural_network', 'random_forest', 'svm', 'regression', 'ensemble'],
        required: true 
    },
    version: { type: String, required: true },
    
    // Model configuration
    config: {
        architecture: mongoose.Schema.Types.Mixed,
        hyperparameters: mongoose.Schema.Types.Mixed,
        trainingConfig: mongoose.Schema.Types.Mixed
    },
    
    // Serialized model data
    modelData: {
        weights: mongoose.Schema.Types.Mixed,
        biases: mongoose.Schema.Types.Mixed,
        networkStructure: mongoose.Schema.Types.Mixed,
        metadata: mongoose.Schema.Types.Mixed
    },
    
    // Training information
    trainingInfo: {
        trainedOn: { type: Date, default: Date.now },
        trainingDuration: Number, // in milliseconds
        trainingDataSize: Number,
        validationAccuracy: Number,
        trainingAccuracy: Number,
        loss: Number,
        epochs: Number
    },
    
    // Performance metrics
    performance: {
        accuracy: { type: Number, min: 0, max: 1 },
        precision: { type: Number, min: 0, max: 1 },
        recall: { type: Number, min: 0, max: 1 },
        f1Score: { type: Number, min: 0, max: 1 },
        auc: { type: Number, min: 0, max: 1 },
        inferenceTimeMs: Number
    },
    
    // Status and metadata
    status: { 
        type: String, 
        enum: ['training', 'trained', 'deployed', 'deprecated'],
        default: 'training' 
    },
    isActive: { type: Boolean, default: true },
    
    // Features and target information
    features: {
        inputSize: Number,
        featureNames: [String],
        featureTypes: [String], // 'numeric', 'categorical', 'boolean'
        normalization: String
    },
    
    lastUsed: { type: Date, default: Date.now },
    usageCount: { type: Number, default: 0 }
});

// Pattern Performance Tracking Schema
const patternPerformanceSchema = new mongoose.Schema({
    patternId: { type: String, required: true, index: true },
    patternType: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true, index: true },
    
    // Pattern details
    patternData: {
        confidence: { type: Number, min: 0, max: 1 },
        mlEnhancedConfidence: { type: Number, min: 0, max: 1 },
        signal: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
        detectedAt: Date,
        marketConditions: mongoose.Schema.Types.Mixed
    },
    
    // Prediction details
    prediction: {
        direction: { type: String, enum: ['up', 'down', 'neutral'] },
        priceTarget: Number,
        confidence: { type: Number, min: 0, max: 1 },
        timeHorizon: String, // '1m', '5m', '15m', etc.
        predictionMade: Date
    },
    
    // Actual outcome
    outcome: {
        actualDirection: { type: String, enum: ['up', 'down', 'neutral'] },
        actualPriceChange: Number,
        actualPriceChangePercent: Number,
        maxPrice: Number,
        minPrice: Number,
        outcomeRecorded: Date,
        timeToOutcome: Number // milliseconds
    },
    
    // Performance assessment
    assessment: {
        correct: Boolean,
        accuracy: Number, // How close was the prediction
        profitability: Number, // Theoretical profit if traded
        riskReward: Number,
        confidence_calibration: Number // How well calibrated was confidence
    },
    
    // Model information
    modelInfo: {
        modelsUsed: [String], // Model names that contributed
        ensembleWeights: mongoose.Schema.Types.Mixed,
        features: mongoose.Schema.Types.Mixed,
        processingTime: Number
    },
    
    // Market context
    marketContext: {
        volatility: Number,
        volume: Number,
        marketTrend: String,
        sectorPerformance: Number,
        overallMarketCondition: String
    },
    
    timestamp: { type: Date, default: Date.now, index: true }
});

// ML Training Data Schema
const trainingDataSchema = new mongoose.Schema({
    datasetName: { type: String, required: true, index: true },
    dataType: { 
        type: String, 
        enum: ['pattern_classification', 'price_prediction', 'ensemble_training'],
        required: true 
    },
    
    // Input features
    features: {
        data: [[Number]], // 2D array of feature vectors
        names: [String],
        types: [String],
        normalized: Boolean,
        normalizationParams: mongoose.Schema.Types.Mixed
    },
    
    // Target labels
    labels: {
        data: mongoose.Schema.Types.Mixed, // Array or 2D array
        type: String, // 'classification', 'regression'
        classes: [String] // For classification
    },
    
    // Metadata
    metadata: {
        sampleCount: Number,
        featureCount: Number,
        dateRange: {
            start: Date,
            end: Date
        },
        symbols: [String],
        timeframes: [String]
    },
    
    // Data quality metrics
    quality: {
        completeness: Number, // Percentage of non-null values
        consistency: Number,
        balance: mongoose.Schema.Types.Mixed, // Class balance for classification
        outlierCount: Number
    },
    
    // Processing information
    processing: {
        rawDataSources: [String],
        transformations: [String],
        filteringRules: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now },
        processedBy: String
    },
    
    // Usage tracking
    usage: {
        timesUsed: { type: Number, default: 0 },
        lastUsed: Date,
        modelsTrainedWith: [String]
    }
});

// ML Signal Predictions Schema
const signalPredictionSchema = new mongoose.Schema({
    predictionId: { type: String, unique: true, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true, index: true },
    
    // Input data
    inputData: {
        patterns: mongoose.Schema.Types.Mixed,
        technicalIndicators: mongoose.Schema.Types.Mixed,
        marketData: mongoose.Schema.Types.Mixed,
        features: [Number]
    },
    
    // ML Predictions
    predictions: {
        // Pattern confidence predictions
        patternConfidence: [{
            patternType: String,
            originalConfidence: Number,
            mlConfidence: Number,
            enhancedConfidence: Number,
            modelUsed: String
        }],
        
        // Price movement predictions
        priceMovement: {
            direction: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
            probability: Number,
            priceTarget: Number,
            volatilityPrediction: Number,
            timeHorizon: String
        },
        
        // Ensemble signal
        ensembleSignal: {
            signal: { type: String, enum: ['buy', 'sell', 'hold'] },
            confidence: Number,
            strength: Number,
            reasoning: String,
            contributingModels: [String]
        }
    },
    
    // Model execution details
    execution: {
        modelsExecuted: [String],
        processingTime: Number,
        memoryUsage: Number,
        timestamp: { type: Date, default: Date.now },
        apiVersion: String
    },
    
    // Performance tracking (filled in later)
    performance: {
        outcome: String,
        accuracy: Number,
        profitability: Number,
        followedBy: String, // 'human', 'algorithm', 'none'
        feedback: mongoose.Schema.Types.Mixed
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'active', 'expired', 'executed', 'cancelled'],
        default: 'pending'
    },
    
    expiresAt: { type: Date, index: true }
});

// Ensemble Model Configuration Schema
const ensembleConfigSchema = new mongoose.Schema({
    ensembleName: { type: String, required: true, unique: true },
    version: { type: String, required: true },
    
    // Component models
    componentModels: [{
        modelName: String,
        modelType: String,
        weight: { type: Number, min: 0, max: 1 },
        isActive: Boolean,
        performanceWeight: Number // Dynamic weight based on recent performance
    }],
    
    // Ensemble method
    combiningMethod: {
        type: String,
        enum: ['weighted_average', 'voting', 'stacking', 'dynamic_weighting'],
        default: 'weighted_average'
    },
    
    // Performance and adaptation
    performance: {
        overallAccuracy: Number,
        componentAccuracies: mongoose.Schema.Types.Mixed,
        lastEvaluation: Date,
        improvementTrend: Number
    },
    
    // Adaptive learning configuration
    adaptiveLearning: {
        enabled: Boolean,
        reweightingFrequency: Number, // How often to adjust weights
        performanceLookback: Number, // How many recent predictions to consider
        minWeight: Number,
        maxWeight: Number
    },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

// Model Performance Analytics Schema
const modelAnalyticsSchema = new mongoose.Schema({
    modelName: { type: String, required: true, index: true },
    analysisDate: { type: Date, required: true, index: true },
    period: { 
        type: String, 
        enum: ['1h', '1d', '1w', '1m'],
        required: true 
    },
    
    // Performance metrics
    metrics: {
        // Basic metrics
        accuracy: Number,
        precision: Number,
        recall: Number,
        f1Score: Number,
        
        // Trading-specific metrics
        winRate: Number,
        averageProfit: Number,
        averageLoss: Number,
        profitFactor: Number,
        sharpeRatio: Number,
        maxDrawdown: Number,
        
        // Model-specific metrics
        avgConfidence: Number,
        calibrationError: Number,
        overconfidenceRate: Number,
        underconfidenceRate: Number
    },
    
    // Performance by category
    breakdown: {
        bySymbol: mongoose.Schema.Types.Mixed,
        byTimeframe: mongoose.Schema.Types.Mixed,
        byPatternType: mongoose.Schema.Types.Mixed,
        byMarketCondition: mongoose.Schema.Types.Mixed
    },
    
    // Trend analysis
    trends: {
        accuracyTrend: String, // 'improving', 'declining', 'stable'
        confidenceTrend: String,
        performanceRegression: mongoose.Schema.Types.Mixed
    },
    
    // Recommendations
    recommendations: {
        shouldRetrain: Boolean,
        suggestedImprovements: [String],
        riskLevel: String,
        confidenceInModel: Number
    }
});

// Indexes for performance optimization
mlModelSchema.index({ modelName: 1, version: 1 });
mlModelSchema.index({ modelType: 1, status: 1 });
mlModelSchema.index({ 'performance.accuracy': -1 });

patternPerformanceSchema.index({ symbol: 1, patternType: 1, timestamp: -1 });
patternPerformanceSchema.index({ 'assessment.correct': 1, timestamp: -1 });
patternPerformanceSchema.index({ 'patternData.confidence': -1, timestamp: -1 });

trainingDataSchema.index({ datasetName: 1, dataType: 1 });
trainingDataSchema.index({ 'metadata.dateRange.start': 1, 'metadata.dateRange.end': 1 });

signalPredictionSchema.index({ symbol: 1, timeframe: 1, 'execution.timestamp': -1 });
signalPredictionSchema.index({ status: 1, expiresAt: 1 });

ensembleConfigSchema.index({ ensembleName: 1, version: 1 });

modelAnalyticsSchema.index({ modelName: 1, analysisDate: -1 });
modelAnalyticsSchema.index({ period: 1, analysisDate: -1 });

// TTL indexes for automatic cleanup
patternPerformanceSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days
signalPredictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
trainingDataSchema.index({ 'processing.createdAt': 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

// Export models
const MLModel = mongoose.model('MLModel', mlModelSchema);
const PatternPerformance = mongoose.model('PatternPerformance', patternPerformanceSchema);
const TrainingData = mongoose.model('TrainingData', trainingDataSchema);
const SignalPrediction = mongoose.model('SignalPrediction', signalPredictionSchema);
const EnsembleConfig = mongoose.model('EnsembleConfig', ensembleConfigSchema);
const ModelAnalytics = mongoose.model('ModelAnalytics', modelAnalyticsSchema);

module.exports = {
    MLModel,
    PatternPerformance,
    TrainingData,
    SignalPrediction,
    EnsembleConfig,
    ModelAnalytics
};