// dashboard-backend/src/services/api/health-monitor.js

/**
 * API Health Monitor Service
 * Real-time monitoring and alerting for all API providers
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const EventEmitter = require('events');
const { API_CONFIG } = require('../../config/api.config');

class HealthMonitor extends EventEmitter {
    constructor() {
        super();
        
        this.healthMetrics = new Map();
        this.alertRules = new Map();
        this.isMonitoring = false;
        this.monitoringInterval = null;
        
        console.log('💗 API Health Monitor initialized');
    }

    /**
     * Start health monitoring
     */
    start() {
        if (this.isMonitoring) {
            console.log('⚠️ Health monitoring already active');
            return;
        }
        
        this.isMonitoring = true;
        console.log(`💗 Starting health monitoring (${API_CONFIG.health_check_interval}ms interval)`);
        
        // Start monitoring loop
        this.monitoringInterval = setInterval(() => {
            this.performHealthChecks();
        }, API_CONFIG.health_check_interval);
        
        this.emit('monitoringStarted');
    }

    /**
     * Stop health monitoring
     */
    stop() {
        if (!this.isMonitoring) {
            return;
        }
        
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('💗 Health monitoring stopped');
        this.emit('monitoringStopped');
    }

    /**
     * Register provider for monitoring
     */
    registerProvider(providerName, provider) {
        if (!this.healthMetrics.has(providerName)) {
            this.healthMetrics.set(providerName, {
                provider: provider,
                status: 'unknown',
                lastCheck: null,
                responseTime: null,
                errorCount: 0,
                successCount: 0,
                totalRequests: 0,
                averageResponseTime: 0,
                uptime: 0,
                lastError: null,
                healthHistory: [],
                performanceMetrics: {
                    requestsPerMinute: 0,
                    errorRate: 0,
                    availabilityPercent: 0
                }
            });
            
            console.log(`📊 Health monitoring registered for ${providerName}`);
        }
    }

    /**
     * Perform health checks on all registered providers
     */
    async performHealthChecks() {
        const promises = Array.from(this.healthMetrics.keys()).map(providerName => 
            this.checkProviderHealth(providerName)
        );
        
        await Promise.allSettled(promises);
        
        // Update performance metrics
        this.updatePerformanceMetrics();
        
        // Check alert conditions
        this.checkAlertConditions();
        
        // Emit health update event
        this.emit('healthUpdate', this.getHealthSummary());
    }

    /**
     * Check health of specific provider
     */
    async checkProviderHealth(providerName) {
        const metrics = this.healthMetrics.get(providerName);
        if (!metrics || !metrics.provider) {
            return;
        }
        
        const startTime = Date.now();
        
        try {
            // Perform health check
            await metrics.provider.healthCheck();
            
            const responseTime = Date.now() - startTime;
            
            // Update success metrics
            metrics.status = 'healthy';
            metrics.lastCheck = new Date();
            metrics.responseTime = responseTime;
            metrics.successCount++;
            metrics.totalRequests++;
            metrics.lastError = null;
            
            // Update average response time
            metrics.averageResponseTime = this.calculateAverage(
                metrics.averageResponseTime,
                responseTime,
                metrics.successCount
            );
            
            // Add to health history
            this.addHealthHistory(providerName, 'healthy', responseTime);
            
            // Emit healthy event
            this.emit('providerHealthy', { provider: providerName, responseTime });
            
        } catch (error) {
            // Update error metrics
            metrics.status = 'unhealthy';
            metrics.lastCheck = new Date();
            metrics.errorCount++;
            metrics.totalRequests++;
            metrics.lastError = error.message;
            
            // Add to health history
            this.addHealthHistory(providerName, 'unhealthy', null, error.message);
            
            // Emit unhealthy event
            this.emit('providerUnhealthy', { 
                provider: providerName, 
                error: error.message 
            });
            
            console.warn(`❌ Health check failed for ${providerName}: ${error.message}`);
        }
    }

    /**
     * Add entry to health history
     */
    addHealthHistory(providerName, status, responseTime = null, error = null) {
        const metrics = this.healthMetrics.get(providerName);
        if (!metrics) return;
        
        const entry = {
            timestamp: new Date(),
            status,
            responseTime,
            error
        };
        
        metrics.healthHistory.push(entry);
        
        // Keep only last 100 entries
        if (metrics.healthHistory.length > 100) {
            metrics.healthHistory.shift();
        }
    }

    /**
     * Update performance metrics for all providers
     */
    updatePerformanceMetrics() {
        for (const [providerName, metrics] of this.healthMetrics) {
            // Calculate error rate
            if (metrics.totalRequests > 0) {
                metrics.performanceMetrics.errorRate = 
                    (metrics.errorCount / metrics.totalRequests) * 100;
            }
            
            // Calculate availability percentage (last 20 checks)
            const recentHistory = metrics.healthHistory.slice(-20);
            if (recentHistory.length > 0) {
                const healthyCount = recentHistory.filter(h => h.status === 'healthy').length;
                metrics.performanceMetrics.availabilityPercent = 
                    (healthyCount / recentHistory.length) * 100;
            }
            
            // Calculate requests per minute (estimate based on health checks)
            const oneMinuteAgo = new Date(Date.now() - 60000);
            const recentRequests = metrics.healthHistory.filter(h => h.timestamp > oneMinuteAgo);
            metrics.performanceMetrics.requestsPerMinute = recentRequests.length;
        }
    }

    /**
     * Check alert conditions
     */
    checkAlertConditions() {
        for (const [providerName, metrics] of this.healthMetrics) {
            // High error rate alert
            if (metrics.performanceMetrics.errorRate > 20) {
                this.triggerAlert('high_error_rate', providerName, {
                    errorRate: metrics.performanceMetrics.errorRate,
                    threshold: 20
                });
            }
            
            // Low availability alert
            if (metrics.performanceMetrics.availabilityPercent < 80) {
                this.triggerAlert('low_availability', providerName, {
                    availability: metrics.performanceMetrics.availabilityPercent,
                    threshold: 80
                });
            }
            
            // High response time alert
            if (metrics.averageResponseTime > 5000) {
                this.triggerAlert('high_response_time', providerName, {
                    responseTime: metrics.averageResponseTime,
                    threshold: 5000
                });
            }
            
            // Consecutive failures alert
            const recentFailures = this.getConsecutiveFailures(providerName);
            if (recentFailures >= API_CONFIG.failover.failover_error_threshold) {
                this.triggerAlert('consecutive_failures', providerName, {
                    failures: recentFailures,
                    threshold: API_CONFIG.failover.failover_error_threshold
                });
            }
        }
    }

    /**
     * Get consecutive failures for a provider
     */
    getConsecutiveFailures(providerName) {
        const metrics = this.healthMetrics.get(providerName);
        if (!metrics || !metrics.healthHistory.length) return 0;
        
        let consecutiveFailures = 0;
        
        // Check from most recent backwards
        for (let i = metrics.healthHistory.length - 1; i >= 0; i--) {
            if (metrics.healthHistory[i].status === 'unhealthy') {
                consecutiveFailures++;
            } else {
                break;
            }
        }
        
        return consecutiveFailures;
    }

    /**
     * Trigger alert
     */
    triggerAlert(alertType, providerName, data) {
        const alertKey = `${alertType}_${providerName}`;
        const now = Date.now();
        
        // Prevent duplicate alerts within 5 minutes
        if (this.alertRules.has(alertKey)) {
            const lastAlert = this.alertRules.get(alertKey);
            if (now - lastAlert < 300000) { // 5 minutes
                return;
            }
        }
        
        this.alertRules.set(alertKey, now);
        
        const alert = {
            type: alertType,
            provider: providerName,
            timestamp: new Date(),
            data: data,
            severity: this.getAlertSeverity(alertType)
        };
        
        console.warn(`🚨 Health Alert [${alert.severity}]: ${alertType} for ${providerName}`, data);
        
        this.emit('healthAlert', alert);
    }

    /**
     * Get alert severity level
     */
    getAlertSeverity(alertType) {
        const severityMap = {
            'high_error_rate': 'warning',
            'low_availability': 'critical',
            'high_response_time': 'warning',
            'consecutive_failures': 'critical'
        };
        
        return severityMap[alertType] || 'info';
    }

    /**
     * Calculate running average
     */
    calculateAverage(currentAverage, newValue, count) {
        if (count <= 1) return newValue;
        return ((currentAverage * (count - 1)) + newValue) / count;
    }

    /**
     * Get health summary for all providers
     */
    getHealthSummary() {
        const summary = {
            timestamp: new Date(),
            totalProviders: this.healthMetrics.size,
            healthyProviders: 0,
            unhealthyProviders: 0,
            averageResponseTime: 0,
            overallAvailability: 0,
            providers: {}
        };
        
        let totalResponseTime = 0;
        let totalAvailability = 0;
        let healthyCount = 0;
        
        for (const [providerName, metrics] of this.healthMetrics) {
            const providerSummary = {
                status: metrics.status,
                lastCheck: metrics.lastCheck,
                responseTime: metrics.responseTime,
                averageResponseTime: metrics.averageResponseTime,
                errorRate: metrics.performanceMetrics.errorRate,
                availability: metrics.performanceMetrics.availabilityPercent,
                totalRequests: metrics.totalRequests,
                successCount: metrics.successCount,
                errorCount: metrics.errorCount,
                lastError: metrics.lastError
            };
            
            summary.providers[providerName] = providerSummary;
            
            if (metrics.status === 'healthy') {
                summary.healthyProviders++;
                healthyCount++;
            } else {
                summary.unhealthyProviders++;
            }
            
            if (metrics.averageResponseTime > 0) {
                totalResponseTime += metrics.averageResponseTime;
            }
            
            totalAvailability += metrics.performanceMetrics.availabilityPercent;
        }
        
        // Calculate averages
        if (this.healthMetrics.size > 0) {
            summary.averageResponseTime = totalResponseTime / this.healthMetrics.size;
            summary.overallAvailability = totalAvailability / this.healthMetrics.size;
        }
        
        return summary;
    }

    /**
     * Get detailed metrics for specific provider
     */
    getProviderMetrics(providerName) {
        return this.healthMetrics.get(providerName) || null;
    }

    /**
     * Reset metrics for provider
     */
    resetProviderMetrics(providerName) {
        const metrics = this.healthMetrics.get(providerName);
        if (metrics) {
            metrics.errorCount = 0;
            metrics.successCount = 0;
            metrics.totalRequests = 0;
            metrics.averageResponseTime = 0;
            metrics.healthHistory = [];
            metrics.lastError = null;
            
            console.log(`🔄 Metrics reset for ${providerName}`);
            this.emit('metricsReset', { provider: providerName });
        }
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            monitoringInterval: API_CONFIG.health_check_interval,
            registeredProviders: Array.from(this.healthMetrics.keys()),
            healthSummary: this.getHealthSummary()
        };
    }
}

module.exports = HealthMonitor;
