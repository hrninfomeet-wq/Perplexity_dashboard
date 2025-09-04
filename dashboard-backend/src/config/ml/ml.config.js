// dashboard-backend/src/config/ml/ml.config.js
/**
 * Machine Learning Configuration - Phase 3A Step 5
 * Central configuration for ML models, parameters, and system settings
 */

const ML_CONFIG = {
    // Model Architecture Configuration
    models: {
        patternClassifier: {
            type: 'neural_network',
            architecture: {
                hiddenLayers: [10, 6],
                activation: 'sigmoid',
                learningRate: 0.3,
                iterations: 20000,
                errorThresh: 0.005
            },
            features: {
                inputSize: 15,
                featureNames: [
                    'pattern_confidence', 'volume_ratio', 'volatility',
                    'trend_strength', 'support_resistance_proximity',
                    'rsi', 'macd_signal', 'bollinger_position',
                    'market_sentiment', 'sector_performance',
                    'timeframe_confluence', 'price_action_quality',
                    'market_structure', 'momentum', 'mean_reversion'
                ]
            },
            performance: {
                targetAccuracy: 0.75,
                retrainingThreshold: 0.65,
                validationSplit: 0.2
            }
        },

        pricePredictor: {
            shortTerm: {
                type: 'lstm',
                architecture: {
                    inputSize: 20,
                    hiddenLayers: [50, 25],
                    outputSize: 1,
                    learningRate: 0.01,
                    iterations: 1000
                },
                timeHorizon: '5m',
                features: [
                    'price_change', 'volume_change', 'volatility',
                    'technical_indicators', 'pattern_signals',
                    'market_microstructure', 'order_flow',
                    'price_levels', 'momentum_indicators'
                ]
            },
            mediumTerm: {
                type: 'regression',
                method: 'polynomial',
                degree: 3,
                timeHorizon: '15m',
                features: [
                    'trend_analysis', 'support_resistance',
                    'pattern_completion', 'volume_profile',
                    'market_regime', 'correlation_analysis'
                ]
            }
        },

        ensembleModel: {
            type: 'ensemble',
            combiningMethod: 'weighted_average',
            componentWeights: {
                patternClassifier: 0.4,
                pricePredictor: 0.3,
                technicalIndicators: 0.3
            },
            dynamicWeighting: {
                enabled: true,
                adaptationRate: 0.1,
                performanceLookback: 100, // Last 100 predictions
                rebalanceFrequency: '1h'
            }
        }
    },

    // Training Configuration
    training: {
        dataRequirements: {
            minSamples: 1000,
            maxAge: 90, // days
            qualityThreshold: 0.8
        },
        validation: {
            method: 'time_series_split',
            testSize: 0.2,
            validationSize: 0.2,
            crossValidationFolds: 5
        },
        retraining: {
            schedule: 'daily',
            triggerConditions: [
                'accuracy_drop_threshold',
                'new_data_availability',
                'market_regime_change'
            ],
            accuracyThreshold: 0.7
        }
    },

    // Performance Metrics Configuration
    performance: {
        metrics: [
            'accuracy', 'precision', 'recall', 'f1_score',
            'auc_roc', 'calibration_error', 'profit_factor',
            'sharpe_ratio', 'max_drawdown', 'win_rate'
        ],
        thresholds: {
            acceptable_accuracy: 0.70,
            good_accuracy: 0.75,
            excellent_accuracy: 0.80,
            max_inference_time: 200, // milliseconds
            min_confidence: 0.6
        },
        tracking: {
            rolling_window: 100, // predictions
            analysis_periods: ['1h', '1d', '1w', '1m'],
            benchmark_comparison: true
        }
    },

    // Feature Engineering Configuration
    features: {
        normalization: {
            method: 'z_score', // 'min_max', 'robust', 'z_score'
            clip_outliers: true,
            outlier_threshold: 3 // standard deviations
        },
        selection: {
            method: 'correlation_filter',
            max_correlation: 0.95,
            min_importance: 0.01,
            feature_count_limit: 50
        },
        engineering: {
            polynomial_features: false,
            interaction_features: true,
            lag_features: {
                enabled: true,
                max_lag: 5,
                features: ['price', 'volume', 'volatility']
            }
        }
    },

    // Real-time Processing Configuration
    realtime: {
        inference: {
            batch_size: 1,
            max_latency: 200, // milliseconds
            cache_predictions: true,
            cache_duration: 60 // seconds
        },
        streaming: {
            buffer_size: 100,
            update_frequency: 30, // seconds
            async_processing: true
        }
    },

    // Database Configuration
    database: {
        collections: {
            ml_models: 'ml_models',
            pattern_performance: 'pattern_performance',
            training_data: 'training_data',
            signal_predictions: 'signal_predictions',
            model_analytics: 'model_analytics'
        },
        retention: {
            training_data: 365, // days
            predictions: 90, // days
            performance_data: 180, // days
            model_versions: 10 // keep last N versions
        },
        indexes: [
            { fields: { symbol: 1, timestamp: -1 } },
            { fields: { model_name: 1, version: 1 } },
            { fields: { pattern_type: 1, timestamp: -1 } },
            { fields: { prediction_id: 1 }, unique: true }
        ]
    },

    // API Configuration
    api: {
        endpoints: {
            enhanced_signals: '/api/v5/ml/enhanced-signals',
            predictions: '/api/v5/ml/predictions',
            pattern_confidence: '/api/v5/ml/pattern-confidence',
            market_analysis: '/api/v5/ml/market-analysis',
            performance_feedback: '/api/v5/ml/performance-feedback',
            model_performance: '/api/v5/ml/model-performance',
            health: '/api/v5/ml/health'
        },
        rate_limiting: {
            enhanced_signals: 60, // per minute
            predictions: 100, // per minute
            health: 300 // per minute
        },
        caching: {
            enabled: true,
            ttl: 30, // seconds
            vary_by: ['symbol', 'timeframe']
        }
    },

    // Logging and Monitoring Configuration
    monitoring: {
        logging: {
            level: 'info', // 'debug', 'info', 'warn', 'error'
            ml_operations: true,
            performance_metrics: true,
            prediction_tracking: true
        },
        alerts: {
            accuracy_drop: {
                threshold: 0.1, // 10% drop
                window: '1h',
                notify: true
            },
            inference_latency: {
                threshold: 300, // milliseconds
                window: '5m',
                notify: true
            },
            model_errors: {
                threshold: 5, // errors per hour
                notify: true
            }
        },
        health_checks: {
            model_availability: true,
            inference_speed: true,
            memory_usage: true,
            prediction_accuracy: true
        }
    },

    // Security Configuration
    security: {
        model_protection: {
            encrypt_stored_models: false, // For development
            access_control: true,
            audit_logging: true
        },
        data_protection: {
            sanitize_inputs: true,
            validate_features: true,
            prevent_data_leakage: true
        }
    },

    // Development Configuration
    development: {
        debug_mode: process.env.NODE_ENV === 'development',
        mock_predictions: false,
        detailed_logging: true,
        feature_importance_tracking: true,
        model_explainability: true
    },

    // Environment-specific Settings
    environment: {
        production: {
            model_validation: 'strict',
            error_handling: 'graceful',
            performance_monitoring: 'enhanced'
        },
        development: {
            model_validation: 'lenient',
            error_handling: 'verbose',
            performance_monitoring: 'basic'
        }
    }
};

// ML Model Templates
const MODEL_TEMPLATES = {
    pattern_classifier: {
        input_features: 15,
        output_classes: ['bullish', 'bearish', 'neutral'],
        architecture: 'feedforward',
        optimization: 'adam'
    },
    price_predictor: {
        input_sequence_length: 20,
        prediction_horizon: 1,
        architecture: 'lstm',
        loss_function: 'mse'
    },
    volatility_predictor: {
        input_features: 10,
        prediction_type: 'regression',
        target_range: [0, 1],
        architecture: 'polynomial'
    }
};

// Feature Importance Weights (learned from historical data)
const FEATURE_IMPORTANCE = {
    pattern_confidence: 0.25,
    volume_ratio: 0.18,
    volatility: 0.15,
    trend_strength: 0.12,
    technical_indicators: 0.10,
    market_sentiment: 0.08,
    support_resistance: 0.07,
    timeframe_confluence: 0.05
};

// Export configuration
module.exports = {
    ML_CONFIG,
    MODEL_TEMPLATES,
    FEATURE_IMPORTANCE,
    
    // Utility functions
    getModelConfig: (modelName) => ML_CONFIG.models[modelName],
    getPerformanceThresholds: () => ML_CONFIG.performance.thresholds,
    getFeatureConfig: () => ML_CONFIG.features,
    getDatabaseConfig: () => ML_CONFIG.database,
    getAPIConfig: () => ML_CONFIG.api,
    
    // Environment checks
    isProduction: () => process.env.NODE_ENV === 'production',
    isDevelopment: () => process.env.NODE_ENV === 'development',
    
    // Configuration validation
    validateConfig: () => {
        const required = ['models', 'training', 'performance', 'features'];
        const missing = required.filter(key => !ML_CONFIG[key]);
        if (missing.length > 0) {
            throw new Error(`Missing required ML config sections: ${missing.join(', ')}`);
        }
        return true;
    }
};
