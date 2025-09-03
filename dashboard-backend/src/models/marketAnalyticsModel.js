// dashboard-backend/src/models/marketAnalyticsModel.js

/**
 * Market Analytics Model - Intelligence & Insights Storage
 * Phase 3A: Live Market Data Intelligence
 * 
 * @version 3A.1.0
 * @created September 04, 2025
 * @description Model for storing market analytics, insights, and aggregated intelligence
 */

const mongoose = require('mongoose');

/**
 * Market Analytics Schema
 * Stores processed market insights and analytics
 */
const marketAnalyticsSchema = new mongoose.Schema({
    // Analysis identification
    analysisId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Scope of analysis
    scope: {
        type: {
            type: String,
            enum: ['SYMBOL', 'SECTOR', 'INDEX', 'MARKET', 'CROSS_MARKET'],
            required: true,
            index: true
        },
        
        // Target details
        targets: [{
            symbol: String,
            exchange: String,
            weight: Number // Importance in analysis
        }],
        
        // Time scope
        timeframe: {
            type: String,
            enum: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
            required: true
        },
        
        period: {
            start: { type: Date, required: true },
            end: { type: Date, required: true }
        }
    },
    
    // Market Overview Analytics
    marketOverview: {
        // Breadth indicators
        breadth: {
            advancers: Number,
            decliners: Number,
            unchanged: Number,
            advanceDeclineRatio: Number,
            
            // Volume breadth
            advancingVolume: Number,
            decliningVolume: Number,
            volumeRatio: Number
        },
        
        // Market sentiment
        sentiment: {
            score: { type: Number, min: -100, max: 100 }, // -100 (extreme fear) to +100 (extreme greed)
            classification: {
                type: String,
                enum: ['EXTREME_FEAR', 'FEAR', 'NEUTRAL', 'GREED', 'EXTREME_GREED']
            },
            
            indicators: {
                vix: Number,              // Volatility index
                putCallRatio: Number,     // Options sentiment
                highLowIndex: Number,     // % stocks near 52-week highs
                
                // Money flow indicators
                moneyFlowIndex: Number,
                accumulationDistribution: Number
            }
        },
        
        // Sector performance
        sectorPerformance: [{
            sector: String,
            performance: {
                change: Number,
                volume: Number,
                leaders: [String],        // Top performing stocks
                laggards: [String]        // Worst performing stocks
            },
            
            strength: {
                relative: Number,         // Relative to market
                momentum: Number,         // Sector momentum score
                rotation: String          // IN_FAVOR, OUT_OF_FAVOR, NEUTRAL
            }
        }],
        
        // Index analysis
        indices: [{
            symbol: String,
            analysis: {
                trend: { type: String, enum: ['BULLISH', 'BEARISH', 'SIDEWAYS'] },
                strength: { type: Number, min: 0, max: 100 },
                
                support: [Number],
                resistance: [Number],
                
                technicals: {
                    rsi: Number,
                    macd: {
                        line: Number,
                        signal: Number,
                        histogram: Number
                    },
                    bollinger: {
                        position: Number,
                        squeeze: Boolean
                    }
                }
            }
        }]
    },
    
    // Statistical Analysis
    statistics: {
        // Price statistics
        priceStats: {
            correlation: [{
                symbol1: String,
                symbol2: String,
                coefficient: Number,
                significance: Number
            }],
            
            volatility: {
                market: Number,
                sectoral: [{
                    sector: String,
                    volatility: Number
                }],
                
                // Volatility clustering
                clusters: [{
                    symbols: [String],
                    avgVolatility: Number,
                    riskLevel: String
                }]
            },
            
            // Distribution analysis
            returns: {
                mean: Number,
                median: Number,
                standardDeviation: Number,
                skewness: Number,
                kurtosis: Number,
                
                // Percentiles
                percentiles: {
                    p25: Number,
                    p50: Number,
                    p75: Number,
                    p90: Number,
                    p95: Number
                }
            }
        },
        
        // Volume analysis
        volumeStats: {
            totalVolume: Number,
            averageVolume: Number,
            volumeDistribution: [{
                priceRange: { min: Number, max: Number },
                volume: Number,
                percentage: Number
            }],
            
            // Unusual volume
            volumeAnomalies: [{
                symbol: String,
                normalVolume: Number,
                currentVolume: Number,
                ratio: Number,
                significance: String
            }]
        }
    },
    
    // Pattern Recognition Results
    patterns: {
        // Technical patterns found
        technical: [{
            pattern: {
                type: String,
                name: String,
                reliability: Number
            },
            
            symbols: [String],
            timeframe: String,
            
            completion: {
                status: { type: String, enum: ['FORMING', 'COMPLETED', 'FAILED'] },
                confidence: Number,
                expectedMove: {
                    direction: String,
                    magnitude: Number,
                    timeframe: String
                }
            }
        }],
        
        // Market structure patterns
        structure: {
            trendPatterns: [{
                type: String, // 'UPTREND', 'DOWNTREND', 'RANGE_BOUND'
                strength: Number,
                duration: Number,
                symbols: [String]
            }],
            
            cyclicalPatterns: [{
                cycle: String,
                phase: String,
                nextPhaseExpected: Date,
                historicalAccuracy: Number
            }]
        }
    },
    
    // Risk Analytics
    riskAnalytics: {
        // Market risk measures
        marketRisk: {
            valueAtRisk: {
                var95: Number,    // 95% VaR
                var99: Number,    // 99% VaR
                timeHorizon: String
            },
            
            expectedShortfall: Number,
            
            // Stress testing
            stressScenarios: [{
                scenario: String,
                probability: Number,
                impact: {
                    priceImpact: Number,
                    volumeImpact: Number,
                    correlationChange: Number
                }
            }]
        },
        
        // Concentration risk
        concentration: {
            sectorConcentration: [{
                sector: String,
                weight: Number,
                riskContribution: Number
            }],
            
            topHoldings: [{
                symbol: String,
                weight: Number,
                riskContribution: Number
            }]
        },
        
        // Liquidity risk
        liquidity: {
            marketDepth: {
                average: Number,
                minimum: Number,
                symbols: [{ symbol: String, depth: Number }]
            },
            
            bidAskSpreads: {
                average: Number,
                maximum: Number,
                widestSpreads: [{ symbol: String, spread: Number }]
            }
        }
    },
    
    // Predictive Analytics
    predictions: {
        // Short-term predictions (next session)
        shortTerm: {
            direction: {
                bullish: Number,    // Probability %
                bearish: Number,    // Probability %
                neutral: Number     // Probability %
            },
            
            priceTargets: [{
                symbol: String,
                target: Number,
                confidence: Number,
                timeframe: String
            }],
            
            volatilityForecast: {
                expected: Number,
                range: { min: Number, max: Number },
                confidence: Number
            }
        },
        
        // Medium-term outlook
        mediumTerm: {
            trends: [{
                trend: String,
                probability: Number,
                duration: String,
                catalysts: [String]
            }],
            
            sectorRotation: [{
                fromSector: String,
                toSector: String,
                probability: Number,
                timeframe: String
            }]
        }
    },
    
    // Alert Conditions
    alerts: {
        // Critical market conditions
        critical: [{
            condition: String,
            severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            message: String,
            triggered: { type: Boolean, default: false },
            triggerTime: Date
        }],
        
        // Opportunity alerts
        opportunities: [{
            type: String,
            description: String,
            symbols: [String],
            urgency: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            expiresAt: Date
        }]
    },
    
    // Processing metadata
    processing: {
        algorithm: {
            name: String,
            version: String,
            parameters: mongoose.Schema.Types.Mixed
        },
        
        dataQuality: {
            completeness: Number,   // % of expected data available
            accuracy: Number,       // Data accuracy score
            timeliness: Number,     // How current is the data
            sources: [String]       // Data providers used
        },
        
        performance: {
            processingTime: Number, // ms
            memoryUsage: Number,    // MB
            cpuUsage: Number,       // %
            
            accuracy: {
                predictions: Number,  // Historical prediction accuracy
                patterns: Number,     // Pattern recognition accuracy
                alerts: Number        // Alert accuracy
            }
        }
    }
}, {
    timestamps: true,
    collection: 'market_analytics'
});

// Indexes for optimal performance
marketAnalyticsSchema.index({ 'scope.type': 1, createdAt: -1 });
marketAnalyticsSchema.index({ 'scope.timeframe': 1, 'scope.period.start': -1 });
marketAnalyticsSchema.index({ 'marketOverview.sentiment.classification': 1, createdAt: -1 });
marketAnalyticsSchema.index({ 'alerts.critical.severity': 1, 'alerts.critical.triggered': 1 });

// TTL index - remove old analytics after 1 year
marketAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

/**
 * Market Insights Schema
 * Stores actionable insights and recommendations
 */
const marketInsightsSchema = new mongoose.Schema({
    // Insight identification
    insightId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Insight classification
    classification: {
        category: {
            type: String,
            enum: [
                'TREND_CHANGE',       // Major trend shifts
                'MOMENTUM_SHIFT',     // Momentum changes
                'VOLUME_ANOMALY',     // Unusual volume patterns
                'CORRELATION_BREAK',  // Correlation breakdowns
                'VOLATILITY_SPIKE',   // Volatility events
                'SECTOR_ROTATION',    // Sector preference changes
                'TECHNICAL_SIGNAL',   // Technical analysis signals
                'FUNDAMENTAL_SHIFT',  // Fundamental changes
                'MARKET_STRUCTURE',   // Market structure insights
                'RISK_WARNING'        // Risk management alerts
            ],
            required: true,
            index: true
        },
        
        priority: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            required: true,
            index: true
        },
        
        confidence: {
            type: Number,
            min: 0,
            max: 100,
            required: true
        },
        
        timeframe: {
            type: String,
            enum: ['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'],
            required: true
        }
    },
    
    // Insight content
    content: {
        title: { type: String, required: true },
        summary: { type: String, required: true },
        description: String,
        
        // Key findings
        keyFindings: [String],
        
        // Supporting evidence
        evidence: [{
            type: String,
            description: String,
            data: mongoose.Schema.Types.Mixed,
            strength: { type: String, enum: ['WEAK', 'MODERATE', 'STRONG'] }
        }],
        
        // Implications
        implications: {
            market: [String],     // Market implications
            sectors: [String],    // Sector implications
            trading: [String],    // Trading implications
            risk: [String]        // Risk implications
        }
    },
    
    // Affected entities
    affected: {
        symbols: [{
            symbol: String,
            exchange: String,
            impact: { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] },
            magnitude: { type: Number, min: 0, max: 10 }
        }],
        
        sectors: [{
            sector: String,
            impact: { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] },
            magnitude: { type: Number, min: 0, max: 10 }
        }],
        
        indices: [{
            index: String,
            impact: { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] },
            magnitude: { type: Number, min: 0, max: 10 }
        }]
    },
    
    // Actionable recommendations
    recommendations: [{
        action: {
            type: String,
            enum: ['BUY', 'SELL', 'HOLD', 'HEDGE', 'MONITOR', 'EXIT'],
            required: true
        },
        
        target: {
            type: String, // Symbol, sector, or strategy
            required: true
        },
        
        rationale: String,
        
        timing: {
            urgency: { type: String, enum: ['IMMEDIATE', 'TODAY', 'THIS_WEEK', 'FLEXIBLE'] },
            duration: String,
            expiresAt: Date
        },
        
        riskLevel: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']
        }
    }],
    
    // Validation and tracking
    validation: {
        status: {
            type: String,
            enum: ['PENDING', 'VALIDATED', 'INVALIDATED', 'EXPIRED'],
            default: 'PENDING'
        },
        
        accuracy: {
            predicted: mongoose.Schema.Types.Mixed,
            actual: mongoose.Schema.Types.Mixed,
            score: Number // 0-100 accuracy score
        },
        
        followUp: {
            nextReview: Date,
            notes: [String]
        }
    },
    
    // Source and generation
    source: {
        generator: {
            type: String,
            enum: ['ALGORITHM', 'ML_MODEL', 'HYBRID', 'MANUAL'],
            required: true
        },
        
        algorithm: String,
        version: String,
        
        dataInputs: [String],   // Data sources used
        processingTime: Number, // ms
        
        quality: {
            dataQuality: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
            algorithmConfidence: Number,
            marketConditions: { type: String, enum: ['IDEAL', 'GOOD', 'POOR'] }
        }
    }
}, {
    timestamps: true,
    collection: 'market_insights'
});

// Indexes for market insights
marketInsightsSchema.index({ 'classification.category': 1, 'classification.priority': -1 });
marketInsightsSchema.index({ 'classification.timeframe': 1, createdAt: -1 });
marketInsightsSchema.index({ 'affected.symbols.symbol': 1, createdAt: -1 });
marketInsightsSchema.index({ 'validation.status': 1, createdAt: -1 });

// TTL index for expired insights
marketInsightsSchema.index({ 'recommendations.timing.expiresAt': 1 }, { 
    expireAfterSeconds: 0 
});

// Static methods for analytics
marketAnalyticsSchema.statics.getLatestAnalysis = function(type, limit = 1) {
    return this.find({ 'scope.type': type })
        .sort({ createdAt: -1 })
        .limit(limit);
};

marketAnalyticsSchema.statics.getMarketSentiment = function() {
    return this.findOne(
        { 'scope.type': 'MARKET' },
        { 'marketOverview.sentiment': 1, createdAt: 1 }
    ).sort({ createdAt: -1 });
};

marketInsightsSchema.statics.getActiveInsights = function(priority = null) {
    const filter = { 'validation.status': 'PENDING' };
    if (priority) {
        filter['classification.priority'] = priority;
    }
    
    return this.find(filter)
        .sort({ 'classification.priority': -1, createdAt: -1 });
};

marketInsightsSchema.statics.getInsightsBySymbol = function(symbol, limit = 10) {
    return this.find({ 'affected.symbols.symbol': symbol.toUpperCase() })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Export models
const MarketAnalytics = mongoose.model('MarketAnalytics', marketAnalyticsSchema);
const MarketInsights = mongoose.model('MarketInsights', marketInsightsSchema);

module.exports = {
    MarketAnalytics,
    MarketInsights,
    marketAnalyticsSchema,
    marketInsightsSchema
};
