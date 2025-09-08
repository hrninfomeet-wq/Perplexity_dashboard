// dashboard-backend/src/models/marketDataModel.js

/**
 * Market Data Model - Time-Series Optimized Storage
 * Phase 3A: Live Market Data Intelligence
 * 
 * @version 3A.1.0
 * @created September 04, 2025
 * @description Time-series optimized model for high-frequency market data storage
 */

const mongoose = require('mongoose');

/**
 * Real-time Market Data Schema
 * Optimized for high-frequency data ingestion and fast queries
 */
const marketDataSchema = new mongoose.Schema({
    // Primary identifiers
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
    
    // Time-series data
    timestamp: {
        type: Date,
        required: true
    },
    
    // OHLCV Data
    ohlcv: {
        open: { type: Number, required: true },
        high: { type: Number, required: true },
        low: { type: Number, required: true },
        close: { type: Number, required: true },
        volume: { type: Number, required: true, default: 0 },
        value: { type: Number, default: 0 } // Trading value
    },
    
    // Market microstructure
    marketData: {
        bid: { type: Number },
        ask: { type: Number },
        lastTradePrice: { type: Number },
        lastTradeTime: { type: Date },
        totalTradedVolume: { type: Number },
        totalTradedValue: { type: Number },
        averagePrice: { type: Number },
        
        // Order book depth (Top 5)
        depth: {
            buy: [{
                price: Number,
                quantity: Number,
                orders: Number
            }],
            sell: [{
                price: Number,
                quantity: Number,
                orders: Number
            }]
        }
    },
    
    // Technical indicators (pre-calculated)
    indicators: {
        sma: {
            sma_5: Number,
            sma_10: Number,
            sma_20: Number,
            sma_50: Number
        },
        ema: {
            ema_5: Number,
            ema_10: Number,
            ema_20: Number,
            ema_50: Number
        },
        rsi: {
            rsi_14: Number
        },
        macd: {
            macd_line: Number,
            signal_line: Number,
            histogram: Number
        },
        bollinger: {
            upper: Number,
            middle: Number,
            lower: Number
        }
    },
    
    // Market analytics
    analytics: {
        percentChange: { type: Number },
        absoluteChange: { type: Number },
        dayRange: {
            high: Number,
            low: Number
        },
        
        // Volume analytics
        volumeProfile: {
            averageVolume: Number,
            volumeRatio: Number, // Current vs average
            unusualVolume: { type: Boolean, default: false }
        },
        
        // Price action
        priceAction: {
            trend: { type: String, enum: ['BULLISH', 'BEARISH', 'SIDEWAYS'] },
            strength: { type: Number, min: 0, max: 100 },
            momentum: { type: String, enum: ['STRONG', 'MODERATE', 'WEAK'] }
        }
    },
    
    // Data source and quality
    source: {
        provider: { 
            type: String, 
            enum: ['upstox', 'flattrade', 'fyers', 'aliceblue', 'nse_public'],
            required: true 
        },
        responseTime: { type: Number }, // milliseconds
        dataQuality: {
            type: String,
            enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
            default: 'GOOD'
        }
    },
    
    // Metadata
    metadata: {
        instrumentType: {
            type: String,
            enum: ['EQUITY', 'INDEX', 'FUTURES', 'OPTIONS', 'COMMODITY'],
            default: 'EQUITY'
        },
        sector: String,
        marketCap: { type: String, enum: ['LARGE', 'MID', 'SMALL', 'MICRO'] },
        isin: String,
        
        // Options specific
        optionDetails: {
            strikePrice: Number,
            expiry: Date,
            optionType: { type: String, enum: ['CE', 'PE'] },
            underlying: String
        }
    }
}, {
    timestamps: true,
    collection: 'market_data'
});

// Compound indexes for optimal query performance
marketDataSchema.index({ symbol: 1, timestamp: -1 }); // Most common query
marketDataSchema.index({ exchange: 1, timestamp: -1 });
marketDataSchema.index({ 'source.provider': 1, timestamp: -1 });
marketDataSchema.index({ 'metadata.instrumentType': 1, timestamp: -1 });
marketDataSchema.index({ 'analytics.priceAction.trend': 1, timestamp: -1 });

// TTL index for data retention (keep 90 days of minute data)
marketDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Virtual for real-time calculations
marketDataSchema.virtual('spreadPercentage').get(function() {
    if (this.marketData.bid && this.marketData.ask) {
        return ((this.marketData.ask - this.marketData.bid) / this.marketData.ask) * 100;
    }
    return null;
});

/**
 * Aggregated Market Data Schema
 * For minute/hourly/daily aggregations
 */
const aggregatedDataSchema = new mongoose.Schema({
    symbol: { type: String, required: true, uppercase: true },
    exchange: { type: String, enum: ['NSE', 'BSE', 'MCX', 'NCDEX'], default: 'NSE' },
    
    // Time period
    timeframe: {
        type: String,
        enum: ['1m', '5m', '15m', '1h', '1d'],
        required: true
    },
    
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    
    // Aggregated OHLCV
    ohlcv: {
        open: { type: Number, required: true },
        high: { type: Number, required: true },
        low: { type: Number, required: true },
        close: { type: Number, required: true },
        volume: { type: Number, required: true },
        value: { type: Number, required: true },
        vwap: { type: Number } // Volume Weighted Average Price
    },
    
    // Aggregated analytics
    analytics: {
        trades: { type: Number },
        averageTradeSize: { type: Number },
        buyVolume: { type: Number },
        sellVolume: { type: Number },
        
        // Price movements
        higherHighs: { type: Number, default: 0 },
        lowerLows: { type: Number, default: 0 },
        
        // Volume profile
        volumeDistribution: [{
            price: Number,
            volume: Number,
            percentage: Number
        }]
    },
    
    // Pre-calculated indicators for this timeframe
    indicators: {
        sma: {
            sma_5: Number,
            sma_10: Number,
            sma_20: Number,
            sma_50: Number,
            sma_200: Number
        },
        ema: {
            ema_5: Number,
            ema_10: Number,
            ema_20: Number,
            ema_50: Number,
            ema_200: Number
        },
        rsi: {
            rsi_14: Number
        },
        macd: {
            macd_line: Number,
            signal_line: Number,
            histogram: Number
        },
        bollinger: {
            upper: Number,
            middle: Number,
            lower: Number,
            bandwidth: Number
        },
        adx: {
            adx: Number,
            plus_di: Number,
            minus_di: Number
        }
    }
}, {
    timestamps: true,
    collection: 'aggregated_market_data'
});

// Compound indexes for aggregated data
aggregatedDataSchema.index({ symbol: 1, timeframe: 1, startTime: -1 });
aggregatedDataSchema.index({ exchange: 1, timeframe: 1, startTime: -1 });

// TTL for aggregated data (keep longer - 1 year for daily, 6 months for intraday)
aggregatedDataSchema.index({ startTime: 1 }, { 
    expireAfterSeconds: 60 * 60 * 24 * 365,
    partialFilterExpression: { timeframe: '1d' }
});

aggregatedDataSchema.index({ startTime: 1 }, { 
    expireAfterSeconds: 60 * 60 * 24 * 180,
    partialFilterExpression: { timeframe: { $in: ['1m', '5m', '15m', '1h'] } }
});

// Static methods for data queries
marketDataSchema.statics.getLatestPrice = function(symbol, exchange = 'NSE') {
    return this.findOne(
        { symbol: symbol.toUpperCase(), exchange },
        { 'ohlcv.close': 1, timestamp: 1, 'analytics.percentChange': 1 }
    ).sort({ timestamp: -1 });
};

marketDataSchema.statics.getPriceHistory = function(symbol, timeframe = '1d', limit = 100) {
    const AggregatedData = mongoose.model('AggregatedMarketData');
    return AggregatedData.find(
        { symbol: symbol.toUpperCase(), timeframe }
    )
    .sort({ startTime: -1 })
    .limit(limit)
    .select('ohlcv startTime indicators analytics');
};

marketDataSchema.statics.getMarketSummary = function(exchange = 'NSE') {
    return this.aggregate([
        { $match: { exchange, timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } } },
        { $group: {
            _id: '$symbol',
            latestPrice: { $last: '$ohlcv.close' },
            percentChange: { $last: '$analytics.percentChange' },
            volume: { $last: '$ohlcv.volume' },
            lastUpdate: { $last: '$timestamp' }
        }},
        { $sort: { percentChange: -1 } }
    ]);
};

// Export models
const MarketData = mongoose.model('MarketData', marketDataSchema);
const AggregatedMarketData = mongoose.model('AggregatedMarketData', aggregatedDataSchema);

module.exports = {
    MarketData,
    AggregatedMarketData,
    marketDataSchema,
    aggregatedDataSchema
};
