// dashboard-backend/src/models/apiHealthModel.js

/**
 * API Health Database Model
 * Stores health metrics and monitoring data for all API providers
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const mongoose = require('mongoose');

// API Health Check Schema
const apiHealthCheckSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        enum: ['flattrade', 'upstox', 'fyers', 'aliceblue', 'nse-public'],
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['healthy', 'unhealthy', 'degraded', 'maintenance'],
        index: true
    },
    responseTime: {
        type: Number,
        default: null,
        min: 0,
        max: 60000 // Max 60 seconds
    },
    endpoint: {
        type: String,
        required: true
    },
    errorMessage: {
        type: String,
        default: null
    },
    httpStatusCode: {
        type: Number,
        default: null
    },
    requestId: {
        type: String,
        default: null
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true,
    collection: 'api_health_checks'
});

// API Health Summary Schema
const apiHealthSummarySchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        unique: true,
        enum: ['flattrade', 'upstox', 'fyers', 'aliceblue', 'nse-public']
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    currentStatus: {
        type: String,
        required: true,
        enum: ['healthy', 'unhealthy', 'degraded', 'maintenance'],
        default: 'unknown'
    },
    averageResponseTime: {
        type: Number,
        default: 0,
        min: 0
    },
    uptime: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    totalRequests: {
        type: Number,
        default: 0,
        min: 0
    },
    successfulRequests: {
        type: Number,
        default: 0,
        min: 0
    },
    failedRequests: {
        type: Number,
        default: 0,
        min: 0
    },
    errorRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastErrorTime: {
        type: Date,
        default: null
    },
    lastErrorMessage: {
        type: String,
        default: null
    },
    consecutiveFailures: {
        type: Number,
        default: 0,
        min: 0
    },
    rateLimitInfo: {
        requestsPerMinute: {
            type: Number,
            default: 0
        },
        requestsPerSecond: {
            type: Number,
            default: 0
        },
        dailyLimit: {
            type: Number,
            default: null
        },
        currentUsage: {
            perMinute: { type: Number, default: 0 },
            perSecond: { type: Number, default: 0 },
            daily: { type: Number, default: 0 }
        }
    },
    performanceMetrics: {
        minResponseTime: { type: Number, default: null },
        maxResponseTime: { type: Number, default: null },
        p95ResponseTime: { type: Number, default: null },
        p99ResponseTime: { type: Number, default: null }
    }
}, {
    timestamps: true,
    collection: 'api_health_summary'
});

// API Downtime Event Schema
const apiDowntimeEventSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        enum: ['flattrade', 'upstox', 'fyers', 'aliceblue', 'nse-public'],
        index: true
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        default: null
    },
    duration: {
        type: Number,
        default: null,
        min: 0
    },
    reason: {
        type: String,
        enum: ['api_error', 'network_error', 'authentication_error', 'rate_limit', 'maintenance', 'unknown'],
        default: 'unknown'
    },
    impact: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    affectedEndpoints: [{
        type: String
    }],
    errorDetails: {
        type: Object,
        default: {}
    },
    recoveryActions: [{
        action: String,
        timestamp: Date,
        success: Boolean
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'api_downtime_events'
});

// Indexes for performance
apiHealthCheckSchema.index({ provider: 1, timestamp: -1 });
apiHealthCheckSchema.index({ timestamp: -1 });
apiHealthCheckSchema.index({ status: 1, timestamp: -1 });

apiHealthSummarySchema.index({ provider: 1 });
apiHealthSummarySchema.index({ currentStatus: 1 });
apiHealthSummarySchema.index({ lastUpdated: -1 });

apiDowntimeEventSchema.index({ provider: 1, startTime: -1 });
apiDowntimeEventSchema.index({ isActive: 1 });
apiDowntimeEventSchema.index({ impact: 1, startTime: -1 });

// Static methods for APIHealthCheck
apiHealthCheckSchema.statics.getRecentHealthChecks = function(provider, minutes = 60) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.find({
        provider: provider,
        timestamp: { $gte: since }
    }).sort({ timestamp: -1 });
};

apiHealthCheckSchema.statics.getHealthTrend = function(provider, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.aggregate([
        {
            $match: {
                provider: provider,
                timestamp: { $gte: since }
            }
        },
        {
            $group: {
                _id: {
                    hour: { $hour: '$timestamp' },
                    day: { $dayOfMonth: '$timestamp' }
                },
                totalChecks: { $sum: 1 },
                healthyChecks: {
                    $sum: { $cond: [{ $eq: ['$status', 'healthy'] }, 1, 0] }
                },
                averageResponseTime: { $avg: '$responseTime' }
            }
        },
        {
            $project: {
                _id: 1,
                totalChecks: 1,
                healthyChecks: 1,
                successRate: {
                    $multiply: [{ $divide: ['$healthyChecks', '$totalChecks'] }, 100]
                },
                averageResponseTime: { $round: ['$averageResponseTime', 2] }
            }
        },
        { $sort: { '_id.day': 1, '_id.hour': 1 } }
    ]);
};

// Static methods for APIHealthSummary
apiHealthSummarySchema.statics.updateProviderHealth = async function(provider, healthData) {
    const update = {
        $set: {
            lastUpdated: new Date(),
            currentStatus: healthData.status,
            averageResponseTime: healthData.averageResponseTime || 0,
            uptime: healthData.uptime || 0,
            errorRate: healthData.errorRate || 0,
            consecutiveFailures: healthData.consecutiveFailures || 0
        },
        $inc: {
            totalRequests: healthData.requestIncrement || 0,
            successfulRequests: healthData.successIncrement || 0,
            failedRequests: healthData.failureIncrement || 0
        }
    };
    
    if (healthData.errorMessage) {
        update.$set.lastErrorMessage = healthData.errorMessage;
        update.$set.lastErrorTime = new Date();
    }
    
    if (healthData.rateLimitInfo) {
        update.$set.rateLimitInfo = healthData.rateLimitInfo;
    }
    
    if (healthData.performanceMetrics) {
        update.$set.performanceMetrics = healthData.performanceMetrics;
    }
    
    return this.findOneAndUpdate(
        { provider: provider },
        update,
        { upsert: true, new: true }
    );
};

apiHealthSummarySchema.statics.getAllProvidersHealth = function() {
    return this.find({}).sort({ provider: 1 });
};

apiHealthSummarySchema.statics.getHealthyProviders = function() {
    return this.find({ 
        currentStatus: { $in: ['healthy', 'degraded'] },
        consecutiveFailures: { $lt: 3 }
    }).sort({ uptime: -1, averageResponseTime: 1 });
};

// Static methods for APIDowntimeEvent
apiDowntimeEventSchema.statics.recordDowntime = function(provider, reason, impact = 'medium') {
    return this.create({
        provider: provider,
        startTime: new Date(),
        reason: reason,
        impact: impact,
        isActive: true
    });
};

apiDowntimeEventSchema.statics.endDowntime = function(eventId, recoveryActions = []) {
    const endTime = new Date();
    return this.findByIdAndUpdate(
        eventId,
        {
            $set: {
                endTime: endTime,
                isActive: false,
                recoveryActions: recoveryActions
            }
        },
        { new: true }
    ).then(doc => {
        if (doc) {
            doc.duration = endTime - doc.startTime;
            return doc.save();
        }
        return doc;
    });
};

apiDowntimeEventSchema.statics.getActiveDowntimes = function() {
    return this.find({ isActive: true }).sort({ startTime: -1 });
};

apiDowntimeEventSchema.statics.getDowntimeHistory = function(provider, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.find({
        provider: provider,
        startTime: { $gte: since }
    }).sort({ startTime: -1 });
};

// Instance methods
apiHealthCheckSchema.methods.toSummary = function() {
    return {
        provider: this.provider,
        timestamp: this.timestamp,
        status: this.status,
        responseTime: this.responseTime,
        endpoint: this.endpoint
    };
};

apiDowntimeEventSchema.methods.getDurationMinutes = function() {
    if (!this.endTime) {
        return Math.round((Date.now() - this.startTime) / (1000 * 60));
    }
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
};

// Pre-save middleware
apiHealthSummarySchema.pre('save', function(next) {
    // Calculate error rate
    if (this.totalRequests > 0) {
        this.errorRate = Math.round((this.failedRequests / this.totalRequests) * 100 * 100) / 100;
    }
    
    // Calculate uptime percentage
    if (this.totalRequests > 0) {
        this.uptime = Math.round((this.successfulRequests / this.totalRequests) * 100 * 100) / 100;
    }
    
    next();
});

// TTL index for health checks (keep for 7 days)
apiHealthCheckSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Create models
const APIHealthCheck = mongoose.model('APIHealthCheck', apiHealthCheckSchema);
const APIHealthSummary = mongoose.model('APIHealthSummary', apiHealthSummarySchema);
const APIDowntimeEvent = mongoose.model('APIDowntimeEvent', apiDowntimeEventSchema);

module.exports = {
    APIHealthCheck,
    APIHealthSummary,
    APIDowntimeEvent
};
