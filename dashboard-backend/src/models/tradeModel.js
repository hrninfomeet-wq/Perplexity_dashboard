// dashboard-backend/src/models/tradeModel.js

/**
 * Trade Data Model
 * Handles trade signals, analytics, and performance tracking
 * 
 * @version 2.2.0
 * @created September 02, 2025
 */

const mongoose = require('mongoose');

// Trade signal schema
const tradeSchema = new mongoose.Schema({
    // User association
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    
    // Basic trade information
    symbol: {
        type: String,
        required: [true, 'Symbol is required'],
        uppercase: true,
        trim: true,
        index: true
    },
    
    exchange: {
        type: String,
        required: [true, 'Exchange is required'],
        enum: ['NSE', 'BSE', 'MCX', 'NCDEX'],
        default: 'NSE'
    },
    
    segment: {
        type: String,
        required: [true, 'Segment is required'],
        enum: ['equity', 'fno', 'commodity', 'currency'],
        default: 'equity'
    },
    
    // Trade signal details
    signal_type: {
        type: String,
        required: [true, 'Signal type is required'],
        enum: ['btst', 'scalping', 'swing', 'positional', 'intraday', 'options'],
        index: true
    },
    
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: ['BUY', 'SELL'],
        uppercase: true
    },
    
    // Price information
    entry_price: {
        type: Number,
        required: [true, 'Entry price is required'],
        min: [0.01, 'Entry price must be positive']
    },
    
    target_price: {
        type: Number,
        required: [true, 'Target price is required'],
        min: [0.01, 'Target price must be positive']
    },
    
    stop_loss: {
        type: Number,
        required: [true, 'Stop loss is required'],
        min: [0.01, 'Stop loss must be positive']
    },
    
    current_price: {
        type: Number,
        default: function() {
            return this.entry_price;
        }
    },
    
    // Quantity and capital
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    
    capital_required: {
        type: Number,
        required: [true, 'Capital required is required'],
        min: [0, 'Capital required cannot be negative']
    },
    
    // Signal metadata
    signal_strength: {
        type: Number,
        required: [true, 'Signal strength is required'],
        min: [0, 'Signal strength cannot be negative'],
        max: [100, 'Signal strength cannot exceed 100'],
        validate: {
            validator: Number.isInteger,
            message: 'Signal strength must be an integer'
        }
    },
    
    confidence_level: {
        type: String,
        required: [true, 'Confidence level is required'],
        enum: ['Low', 'Medium', 'High', 'Very High'],
        default: 'Medium'
    },
    
    probability: {
        type: Number,
        min: [0, 'Probability cannot be negative'],
        max: [100, 'Probability cannot exceed 100'],
        default: 50
    },
    
    // Technical indicators
    technical_indicators: {
        rsi: {
            value: Number,
            signal: {
                type: String,
                enum: ['oversold', 'overbought', 'neutral']
            }
        },
        macd: {
            value: Number,
            signal: {
                type: String,
                enum: ['bullish', 'bearish', 'neutral']
            }
        },
        bollinger_bands: {
            upper: Number,
            lower: Number,
            position: {
                type: String,
                enum: ['above_upper', 'below_lower', 'in_range']
            }
        },
        moving_averages: {
            sma_50: Number,
            sma_200: Number,
            ema_20: Number,
            trend: {
                type: String,
                enum: ['uptrend', 'downtrend', 'sideways']
            }
        },
        volume: {
            current: Number,
            average: Number,
            ratio: Number
        }
    },
    
    // Market data
    market_data: {
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number,
        vwap: Number,
        change: Number,
        change_percent: Number
    },
    
    // Options specific data (if applicable)
    options_data: {
        option_type: {
            type: String,
            enum: ['CE', 'PE']
        },
        strike_price: Number,
        expiry_date: Date,
        implied_volatility: Number,
        time_to_expiry: Number,
        delta: Number,
        gamma: Number,
        theta: Number,
        vega: Number
    },
    
    // Trade execution status
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled', 'expired', 'stopped'],
        default: 'active',
        index: true
    },
    
    // Execution details
    execution: {
        is_executed: {
            type: Boolean,
            default: false
        },
        executed_price: Number,
        executed_quantity: Number,
        executed_at: Date,
        broker_order_id: String,
        execution_type: {
            type: String,
            enum: ['market', 'limit', 'stop_loss', 'target']
        }
    },
    
    // Performance tracking
    performance: {
        pnl: {
            type: Number,
            default: 0
        },
        pnl_percent: {
            type: Number,
            default: 0
        },
        max_profit: {
            type: Number,
            default: 0
        },
        max_loss: {
            type: Number,
            default: 0
        },
        holding_period: {
            hours: {
                type: Number,
                default: 0
            },
            minutes: {
                type: Number,
                default: 0
            }
        }
    },
    
    // Risk management
    risk_metrics: {
        risk_reward_ratio: {
            type: Number,
            required: true,
            min: [0.1, 'Risk-reward ratio too low']
        },
        max_risk_percent: {
            type: Number,
            default: 2,
            max: [10, 'Maximum risk cannot exceed 10%']
        },
        position_size_percent: {
            type: Number,
            default: 1,
            max: [25, 'Position size cannot exceed 25%']
        }
    },
    
    // Signal source and generation
    source: {
        algorithm: {
            type: String,
            required: [true, 'Algorithm source is required'],
            enum: ['btst_scanner', 'scalping_analyzer', 'technical_analysis', 'manual', 'market_sentiment']
        },
        version: {
            type: String,
            default: '1.0'
        },
        parameters: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    
    // Time tracking
    signal_generated_at: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    
    valid_until: {
        type: Date,
        required: [true, 'Valid until date is required'],
        validate: {
            validator: function(v) {
                return v > this.signal_generated_at;
            },
            message: 'Valid until date must be after signal generation date'
        }
    },
    
    last_updated_at: {
        type: Date,
        default: Date.now
    },
    
    // Notification and alerts
    notifications: {
        entry_alert_sent: {
            type: Boolean,
            default: false
        },
        target_alert_sent: {
            type: Boolean,
            default: false
        },
        stop_loss_alert_sent: {
            type: Boolean,
            default: false
        },
        expiry_alert_sent: {
            type: Boolean,
            default: false
        }
    },
    
    // User notes and tags
    user_notes: {
        type: String,
        maxlength: [500, 'User notes cannot exceed 500 characters']
    },
    
    tags: [{
        type: String,
        trim: true
    }],
    
    // Market conditions when signal was generated
    market_conditions: {
        nifty_level: Number,
        nifty_change: Number,
        banknifty_level: Number,
        banknifty_change: Number,
        vix_level: Number,
        market_sentiment: {
            type: String,
            enum: ['bullish', 'bearish', 'neutral']
        },
        sector_performance: String
    }
}, {
    // Schema options
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    
    collection: 'trades'
});

// Compound indexes for performance
tradeSchema.index({ user_id: 1, signal_generated_at: -1 });
tradeSchema.index({ user_id: 1, status: 1 });
tradeSchema.index({ symbol: 1, signal_generated_at: -1 });
tradeSchema.index({ signal_type: 1, status: 1 });
tradeSchema.index({ valid_until: 1 }); // For cleanup of expired signals
tradeSchema.index({ 'performance.pnl': -1 }); // For performance queries

// Pre-save middleware
tradeSchema.pre('save', function(next) {
    // Calculate risk-reward ratio
    if (this.isModified('entry_price') || this.isModified('target_price') || this.isModified('stop_loss')) {
        const risk = Math.abs(this.entry_price - this.stop_loss);
        const reward = Math.abs(this.target_price - this.entry_price);
        this.risk_metrics.risk_reward_ratio = risk > 0 ? reward / risk : 0;
    }
    
    // Update last_updated_at
    this.last_updated_at = new Date();
    
    // Calculate capital required if not set
    if (!this.capital_required) {
        this.capital_required = this.entry_price * this.quantity;
    }
    
    next();
});

// Virtual fields
tradeSchema.virtual('is_expired').get(function() {
    return new Date() > this.valid_until;
});

tradeSchema.virtual('time_remaining').get(function() {
    const now = new Date();
    const remaining = this.valid_until - now;
    return remaining > 0 ? remaining : 0;
});

tradeSchema.virtual('unrealized_pnl').get(function() {
    if (!this.current_price || this.status !== 'active') {
        return 0;
    }
    
    const multiplier = this.action === 'BUY' ? 1 : -1;
    return (this.current_price - this.entry_price) * this.quantity * multiplier;
});

tradeSchema.virtual('unrealized_pnl_percent').get(function() {
    const pnl = this.unrealized_pnl;
    return this.capital_required > 0 ? (pnl / this.capital_required) * 100 : 0;
});

// Instance methods
tradeSchema.methods = {
    /**
     * Update current price and calculate PnL
     */
    async updatePrice(newPrice) {
        try {
            this.current_price = newPrice;
            
            if (this.status === 'active') {
                // Update market data
                this.market_data.close = newPrice;
                this.market_data.change = newPrice - this.entry_price;
                this.market_data.change_percent = ((newPrice - this.entry_price) / this.entry_price) * 100;
                
                // Update performance metrics
                const currentPnl = this.unrealized_pnl;
                this.performance.pnl = currentPnl;
                this.performance.pnl_percent = this.unrealized_pnl_percent;
                
                // Update max profit/loss
                if (currentPnl > this.performance.max_profit) {
                    this.performance.max_profit = currentPnl;
                }
                
                if (currentPnl < this.performance.max_loss) {
                    this.performance.max_loss = currentPnl;
                }
            }
            
            await this.save();
            return true;
        } catch (error) {
            console.error('Price update error:', error);
            return false;
        }
    },

    /**
     * Check if target or stop loss is hit
     */
    checkTriggers(currentPrice = null) {
        const price = currentPrice || this.current_price;
        
        if (!price || this.status !== 'active') {
            return { triggered: false };
        }
        
        const triggers = {
            triggered: false,
            type: null,
            price: price
        };
        
        if (this.action === 'BUY') {
            if (price >= this.target_price) {
                triggers.triggered = true;
                triggers.type = 'target';
            } else if (price <= this.stop_loss) {
                triggers.triggered = true;
                triggers.type = 'stop_loss';
            }
        } else { // SELL
            if (price <= this.target_price) {
                triggers.triggered = true;
                triggers.type = 'target';
            } else if (price >= this.stop_loss) {
                triggers.triggered = true;
                triggers.type = 'stop_loss';
            }
        }
        
        return triggers;
    },

    /**
     * Get safe trade data for client
     */
    toClientObject() {
        const tradeObj = this.toObject();
        
        // Remove sensitive internal data
        delete tradeObj.source.parameters;
        
        // Add computed fields
        tradeObj.is_expired = this.is_expired;
        tradeObj.time_remaining = this.time_remaining;
        tradeObj.unrealized_pnl = this.unrealized_pnl;
        tradeObj.unrealized_pnl_percent = this.unrealized_pnl_percent;
        
        return tradeObj;
    }
};

// Static methods
tradeSchema.statics = {
    /**
     * Get active trades for user
     */
    async getActiveTrades(userId, limit = 50) {
        try {
            return await this.find({
                user_id: userId,
                status: 'active',
                valid_until: { $gt: new Date() }
            })
            .sort({ signal_generated_at: -1 })
            .limit(limit)
            .populate('user_id', 'username email');
        } catch (error) {
            console.error('Get active trades error:', error);
            return [];
        }
    },

    /**
     * Get trade history for user
     */
    async getTradeHistory(userId, filters = {}, limit = 100) {
        try {
            const query = { user_id: userId };
            
            // Apply filters
            if (filters.symbol) {
                query.symbol = filters.symbol.toUpperCase();
            }
            
            if (filters.signal_type) {
                query.signal_type = filters.signal_type;
            }
            
            if (filters.status) {
                query.status = filters.status;
            }
            
            if (filters.date_from || filters.date_to) {
                query.signal_generated_at = {};
                if (filters.date_from) {
                    query.signal_generated_at.$gte = new Date(filters.date_from);
                }
                if (filters.date_to) {
                    query.signal_generated_at.$lte = new Date(filters.date_to);
                }
            }
            
            return await this.find(query)
                .sort({ signal_generated_at: -1 })
                .limit(limit)
                .populate('user_id', 'username email');
        } catch (error) {
            console.error('Get trade history error:', error);
            return [];
        }
    },

    /**
     * Clean up expired trades
     */
    async cleanupExpiredTrades() {
        try {
            const result = await this.updateMany(
                {
                    status: 'active',
                    valid_until: { $lt: new Date() }
                },
                {
                    $set: { status: 'expired' }
                }
            );
            
            console.log(`🗑️ Expired ${result.modifiedCount} trades`);
            return result.modifiedCount;
        } catch (error) {
            console.error('Cleanup expired trades error:', error);
            return 0;
        }
    }
};

// Export the model
const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;
