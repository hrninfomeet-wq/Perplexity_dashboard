// dashboard-backend/src/models/tradingOpportunityModel.js

/**
 * Trading Opportunity Model - Intelligence Engine Storage
 * Phase 3A: Live Market Data Intelligence
 * 
 * @version 3A.1.0
 * @created September 04, 2025
 * @description Model for storing and tracking trading opportunities identified by market analysis
 */

const mongoose = require('mongoose');

/**
 * Trading Opportunity Schema
 * Stores opportunities identified by the market intelligence engine
 */
const tradingOpportunitySchema = new mongoose.Schema({
    // Opportunity identification
    opportunityId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Security details
    symbol: {
        type: String,
        required: true,
        uppercase: true
    },
    
    exchange: {
        type: String,
        enum: ['NSE', 'BSE', 'MCX', 'NCDEX'],
        default: 'NSE'
    },
    
    // Opportunity classification
    classification: {
        type: {
            type: String,
            enum: [
                'BREAKOUT',           // Price breaking resistance/support
                'MOMENTUM',           // Strong momentum plays
                'REVERSAL',           // Trend reversal patterns
                'ARBITRAGE',          // Price discrepancies
                'VOLATILITY',         // Volatility expansion/contraction
                'VOLUME_SPIKE',       // Unusual volume activity
                'PATTERN',            // Technical pattern completion
                'FUNDAMENTAL',        // Fundamental-driven opportunity
                'SECTOR_ROTATION',    // Sector-specific moves
                'EVENT_DRIVEN'        // News/event-based opportunity
            ],
            required: true,
            index: true
        },
        
        subType: {
            type: String,
            enum: [
                // Breakout subtypes
                'RESISTANCE_BREAK', 'SUPPORT_BREAK', 'TRIANGLE_BREAK', 'CHANNEL_BREAK',
                // Momentum subtypes  
                'BULLISH_MOMENTUM', 'BEARISH_MOMENTUM', 'ACCELERATION',
                // Reversal subtypes
                'DOUBLE_TOP', 'DOUBLE_BOTTOM', 'HEAD_SHOULDERS', 'HAMMER', 'DOJI',
                // Pattern subtypes
                'CUP_HANDLE', 'FLAG', 'PENNANT', 'WEDGE'
            ]
        },
        
        confidence: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
            index: true
        },
        
        timeframe: {
            type: String,
            enum: ['1m', '5m', '15m', '1h', '1d'],
            required: true
        }
    },
    
    // Market conditions at discovery
    marketConditions: {
        price: {
            current: { type: Number, required: true },
            dayOpen: { type: Number },
            dayHigh: { type: Number },
            dayLow: { type: Number },
            previousClose: { type: Number }
        },
        
        volume: {
            current: { type: Number },
            average: { type: Number },
            ratio: { type: Number }, // Current vs average
            spike: { type: Boolean, default: false }
        },
        
        technicals: {
            rsi: { type: Number },
            macd: {
                line: Number,
                signal: Number,
                histogram: Number
            },
            bollinger: {
                position: Number, // -1 to 1 (lower to upper band)
                squeeze: Boolean
            },
            adx: { type: Number },
            
            // Support/Resistance levels
            support: [{ price: Number, strength: Number }],
            resistance: [{ price: Number, strength: Number }]
        }
    },
    
    // Trading recommendation
    recommendation: {
        action: {
            type: String,
            enum: ['BUY', 'SELL', 'HOLD', 'WATCH'],
            required: true,
            index: true
        },
        
        strategy: {
            type: String,
            enum: [
                'SCALPING',     // Quick profits (minutes)
                'INTRADAY',     // Same day positions
                'SWING',        // Few days to weeks
                'POSITIONAL',   // Weeks to months
                'BTST',         // Buy today, sell tomorrow
                'HEDGING'       // Risk management
            ],
            required: true
        },
        
        // Entry criteria
        entry: {
            priceRange: {
                min: { type: Number, required: true },
                max: { type: Number, required: true }
            },
            conditions: [String], // Additional entry conditions
            urgency: {
                type: String,
                enum: ['IMMEDIATE', 'TODAY', 'THIS_WEEK', 'FLEXIBLE'],
                default: 'FLEXIBLE'
            }
        },
        
        // Exit criteria
        exit: {
            targets: [{
                price: { type: Number, required: true },
                percentage: { type: Number }, // % of position to exit
                rationale: String
            }],
            
            stopLoss: {
                price: { type: Number, required: true },
                type: { type: String, enum: ['HARD', 'TRAILING', 'TIME'], default: 'HARD' },
                percentage: Number // Distance from entry
            },
            
            timeStop: {
                maxDuration: { type: Number }, // Hours
                inactivityExit: { type: Number } // Exit if no movement (hours)
            }
        },
        
        // Risk assessment
        risk: {
            level: {
                type: String,
                enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
                required: true,
                index: true
            },
            
            factors: [String], // Risk factors identified
            
            riskReward: {
                ratio: { type: Number }, // Risk:Reward ratio
                maxLoss: { type: Number }, // Maximum potential loss
                maxGain: { type: Number }  // Maximum potential gain
            },
            
            positionSize: {
                recommended: { type: Number }, // % of portfolio
                maxAllocation: { type: Number }
            }
        }
    },
    
    // Performance tracking
    performance: {
        status: {
            type: String,
            enum: [
                'IDENTIFIED',    // Just discovered
                'ACTIVE',        // Currently monitoring
                'TRIGGERED',     // Entry conditions met
                'ENTERED',       // Position taken
                'PARTIAL_EXIT',  // Some profits taken
                'COMPLETED',     // Fully exited
                'STOPPED_OUT',   // Stop loss hit
                'EXPIRED',       // Time expired
                'CANCELLED'      // Opportunity invalidated
            ],
            default: 'IDENTIFIED',
            index: true
        },
        
        execution: {
            entryTime: Date,
            entryPrice: Number,
            quantity: Number,
            
            exits: [{
                time: Date,
                price: Number,
                quantity: Number,
                pnl: Number,
                reason: String
            }],
            
            currentPnL: { type: Number, default: 0 },
            realizedPnL: { type: Number, default: 0 },
            
            // Performance metrics
            metrics: {
                holdingPeriod: Number, // Hours
                maxDrawdown: Number,
                maxGain: Number,
                successRate: Number // If part of a strategy
            }
        }
    },
    
    // Analytics and learning
    analytics: {
        // Pattern recognition accuracy
        patternAccuracy: {
            predicted: Boolean,
            actual: Boolean,
            confidence: Number
        },
        
        // Market impact
        marketImpact: {
            volumeIncrease: Number,
            priceMovement: Number,
            followThrough: Boolean
        },
        
        // Similar opportunities
        similarOpportunities: [{
            opportunityId: String,
            similarity: Number,
            outcome: String
        }],
        
        // Learning feedback
        feedback: {
            automated: {
                patternRecognition: Number, // 0-1 score
                timingAccuracy: Number,
                riskAssessment: Number
            },
            
            manual: {
                userRating: { type: Number, min: 1, max: 5 },
                notes: String,
                improvements: [String]
            }
        }
    },
    
    // Source and metadata
    source: {
        scanner: {
            type: String,
            enum: ['TECHNICAL', 'FUNDAMENTAL', 'HYBRID', 'ML_MODEL'],
            required: true
        },
        
        algorithm: String, // Specific algorithm/model used
        version: String,   // Algorithm version
        
        dataProviders: [String], // APIs used for analysis
        
        processingTime: { type: Number }, // ms taken to identify
        
        // Quality metrics
        quality: {
            dataQuality: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
            signalStrength: { type: Number, min: 0, max: 1 },
            marketConditions: { type: String, enum: ['IDEAL', 'GOOD', 'POOR'] }
        }
    },
    
    // Notifications and alerts
    alerts: {
        sent: [{
            type: { type: String, enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK'] },
            recipient: String,
            timestamp: Date,
            status: { type: String, enum: ['SENT', 'DELIVERED', 'FAILED'] }
        }],
        
        triggers: [{
            condition: String,
            triggered: { type: Boolean, default: false },
            triggerTime: Date
        }]
    }
}, {
    timestamps: true,
    collection: 'trading_opportunities'
});

// Indexes for optimal query performance
tradingOpportunitySchema.index({ symbol: 1, createdAt: -1 });
tradingOpportunitySchema.index({ 'classification.type': 1, 'classification.confidence': -1 });
tradingOpportunitySchema.index({ 'recommendation.action': 1, 'recommendation.risk.level': 1 });
tradingOpportunitySchema.index({ 'performance.status': 1, createdAt: -1 });
tradingOpportunitySchema.index({ 'source.scanner': 1, createdAt: -1 });

// TTL index - remove completed opportunities after 6 months
tradingOpportunitySchema.index({ updatedAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 180,
    partialFilterExpression: { 
        'performance.status': { $in: ['COMPLETED', 'STOPPED_OUT', 'EXPIRED', 'CANCELLED'] }
    }
});

// Virtual fields
tradingOpportunitySchema.virtual('ageInHours').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

tradingOpportunitySchema.virtual('isActive').get(function() {
    return ['IDENTIFIED', 'ACTIVE', 'TRIGGERED', 'ENTERED', 'PARTIAL_EXIT'].includes(this.performance.status);
});

// Static methods
tradingOpportunitySchema.statics.getActiveOpportunities = function(filters = {}) {
    return this.find({
        'performance.status': { $in: ['IDENTIFIED', 'ACTIVE', 'TRIGGERED', 'ENTERED'] },
        ...filters
    }).sort({ 'classification.confidence': -1, createdAt: -1 });
};

tradingOpportunitySchema.statics.getTopOpportunities = function(limit = 10, riskLevel = null) {
    const filter = {};
    if (riskLevel) {
        filter['recommendation.risk.level'] = riskLevel;
    }
    
    return this.find(filter)
        .sort({ 'classification.confidence': -1, 'recommendation.risk.riskReward.ratio': -1 })
        .limit(limit);
};

tradingOpportunitySchema.statics.getPerformanceStats = function(timeframe = 30) {
    const since = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
    
    return this.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
            _id: '$classification.type',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$classification.confidence' },
            successful: {
                $sum: { $cond: [{ $gt: ['$performance.execution.realizedPnL', 0] }, 1, 0] }
            },
            totalPnL: { $sum: '$performance.execution.realizedPnL' }
        }},
        { $addFields: {
            successRate: { $multiply: [{ $divide: ['$successful', '$count'] }, 100] }
        }}
    ]);
};

// Methods for opportunity lifecycle management
tradingOpportunitySchema.methods.updateStatus = function(newStatus, additionalData = {}) {
    this.performance.status = newStatus;
    if (additionalData.price && additionalData.time) {
        if (newStatus === 'ENTERED') {
            this.performance.execution.entryTime = additionalData.time;
            this.performance.execution.entryPrice = additionalData.price;
            this.performance.execution.quantity = additionalData.quantity;
        } else if (['COMPLETED', 'STOPPED_OUT'].includes(newStatus)) {
            this.performance.execution.exits.push({
                time: additionalData.time,
                price: additionalData.price,
                quantity: additionalData.quantity || this.performance.execution.quantity,
                pnl: additionalData.pnl,
                reason: additionalData.reason
            });
        }
    }
    return this.save();
};

tradingOpportunitySchema.methods.calculateCurrentPnL = function(currentPrice) {
    if (this.performance.execution.entryPrice && this.performance.execution.quantity) {
        const pnl = (currentPrice - this.performance.execution.entryPrice) * this.performance.execution.quantity;
        this.performance.execution.currentPnL = pnl;
        return pnl;
    }
    return 0;
};

/**
 * Opportunity Watch List Schema
 * For tracking symbols and conditions to monitor
 */
const watchListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    
    symbols: [{
        symbol: { type: String, required: true, uppercase: true },
        exchange: { type: String, default: 'NSE' },
        addedAt: { type: Date, default: Date.now },
        reason: String,
        
        // Monitoring criteria
        criteria: {
            priceTargets: [{ price: Number, direction: String }],
            volumeThreshold: Number,
            technicalConditions: [String]
        }
    }],
    
    // Scan settings
    scanConfig: {
        enabled: { type: Boolean, default: true },
        frequency: { type: Number, default: 60 }, // seconds
        timeframes: [{ type: String, enum: ['1m', '5m', '15m', '1h', '1d'] }],
        
        // Alert conditions
        alertConditions: [{
            type: String,
            condition: String,
            threshold: Number,
            enabled: { type: Boolean, default: true }
        }]
    },
    
    // Performance
    performance: {
        opportunitiesGenerated: { type: Number, default: 0 },
        successfulTrades: { type: Number, default: 0 },
        totalPnL: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'watch_lists'
});

// Export models
const TradingOpportunity = mongoose.model('TradingOpportunity', tradingOpportunitySchema);
const WatchList = mongoose.model('WatchList', watchListSchema);

module.exports = {
    TradingOpportunity,
    WatchList,
    tradingOpportunitySchema,
    watchListSchema
};
