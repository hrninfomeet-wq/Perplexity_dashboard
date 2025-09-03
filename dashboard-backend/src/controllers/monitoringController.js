// dashboard-backend/src/controllers/monitoringController.js

/**
 * Advanced Monitoring Controller
 * Real-time monitoring and analytics for multi-API system
 * 
 * @version 2.3.0
 * @created September 03, 2025
 * @phase Phase 2.5 - Step 9 Enhanced Monitoring
 */

const { APIHealthSummary, APIHealthCheck, APIDowntimeEvent } = require('../models/apiHealthModel');

class MonitoringController {
    constructor() {
        this.metricsCache = new Map();
        this.alertThresholds = {
            errorRate: 5, // 5% error rate
            responseTime: 2000, // 2 seconds
            availabilityRate: 95 // 95% availability
        };
    }

    /**
     * Get comprehensive system dashboard
     */
    async getDashboard(req, res) {
        try {
            const apiManager = require('../services/api/api-manager');
            const dashboard = {
                timestamp: new Date().toISOString(),
                system: {
                    status: 'operational',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    capacity: {
                        total: 0,
                        active: 0,
                        utilization: 0
                    }
                },
                providers: {},
                alerts: [],
                performance: {
                    avgResponseTime: 0,
                    totalRequests: 0,
                    successRate: 0,
                    errorRate: 0
                },
                trends: {
                    last24h: await this.getLast24HoursTrends(),
                    lastWeek: await this.getWeeklyTrends()
                }
            };

            // Collect provider metrics
            let totalRequests = 0;
            let totalErrors = 0;
            let totalResponseTime = 0;
            let activeProviders = 0;

            for (const [providerName, provider] of apiManager.providers) {
                const healthStatus = await provider.healthCheck();
                const capacity = provider.config?.rate_limits?.requests_per_minute || 0;
                const isActive = provider.isAuthenticated && healthStatus.status === 'healthy';

                const providerMetrics = {
                    name: provider.config?.name || providerName,
                    status: healthStatus.status,
                    authenticated: provider.isAuthenticated || false,
                    capacity: capacity,
                    utilization: provider.requestsThisMinute || 0,
                    responseTime: healthStatus.latency || 0,
                    errorRate: this.calculateErrorRate(provider),
                    uptime: this.calculateUptime(provider),
                    lastError: provider.lastError || null
                };

                dashboard.providers[providerName] = providerMetrics;
                dashboard.system.capacity.total += capacity;

                if (isActive) {
                    dashboard.system.capacity.active += capacity;
                    activeProviders++;
                }

                totalRequests += provider.requestsToday || 0;
                totalErrors += provider.errorsToday || 0;
                totalResponseTime += providerMetrics.responseTime;

                // Check for alerts
                const alerts = this.checkProviderAlerts(providerName, providerMetrics);
                dashboard.alerts.push(...alerts);
            }

            // Calculate overall performance
            dashboard.performance.totalRequests = totalRequests;
            dashboard.performance.errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
            dashboard.performance.successRate = 100 - dashboard.performance.errorRate;
            dashboard.performance.avgResponseTime = activeProviders > 0 ? totalResponseTime / activeProviders : 0;

            dashboard.system.capacity.utilization = dashboard.system.capacity.active > 0 
                ? (dashboard.system.capacity.active / dashboard.system.capacity.total) * 100 
                : 0;

            // Determine system status
            if (dashboard.performance.errorRate > 10 || activeProviders === 0) {
                dashboard.system.status = 'critical';
            } else if (dashboard.performance.errorRate > 5 || activeProviders < 2) {
                dashboard.system.status = 'degraded';
            }

            res.json({
                success: true,
                data: dashboard
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate dashboard'
            });
        }
    }

    /**
     * Get real-time metrics
     */
    async getRealTimeMetrics(req, res) {
        try {
            const apiManager = require('../services/api/api-manager');
            const metrics = {
                timestamp: new Date().toISOString(),
                requests: {
                    current: 0,
                    perMinute: 0,
                    perHour: 0
                },
                providers: {},
                capacity: {
                    total: 0,
                    available: 0,
                    percentage: 0
                },
                health: {
                    healthy: 0,
                    total: 0,
                    percentage: 0
                }
            };

            for (const [providerName, provider] of apiManager.providers) {
                const healthStatus = await provider.healthCheck();
                const capacity = provider.config?.rate_limits?.requests_per_minute || 0;
                
                metrics.providers[providerName] = {
                    requestsThisMinute: provider.requestsThisMinute || 0,
                    requestsThisHour: provider.requestsThisHour || 0,
                    capacity: capacity,
                    available: Math.max(0, capacity - (provider.requestsThisMinute || 0)),
                    healthy: healthStatus.status === 'healthy',
                    responseTime: healthStatus.latency || 0
                };

                metrics.requests.current += provider.requestsThisMinute || 0;
                metrics.requests.perMinute += provider.requestsThisMinute || 0;
                metrics.requests.perHour += provider.requestsThisHour || 0;
                
                metrics.capacity.total += capacity;
                if (provider.isAuthenticated && healthStatus.status === 'healthy') {
                    metrics.capacity.available += metrics.providers[providerName].available;
                    metrics.health.healthy++;
                }
                metrics.health.total++;
            }

            metrics.capacity.percentage = metrics.capacity.total > 0 
                ? (metrics.capacity.available / metrics.capacity.total) * 100 
                : 0;

            metrics.health.percentage = metrics.health.total > 0 
                ? (metrics.health.healthy / metrics.health.total) * 100 
                : 0;

            res.json({
                success: true,
                data: metrics
            });

        } catch (error) {
            console.error('Real-time metrics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get real-time metrics'
            });
        }
    }

    /**
     * Get performance analytics
     */
    async getPerformanceAnalytics(req, res) {
        try {
            const { period = '24h' } = req.query;
            const endTime = new Date();
            let startTime = new Date();

            switch (period) {
                case '1h':
                    startTime.setHours(endTime.getHours() - 1);
                    break;
                case '24h':
                    startTime.setHours(endTime.getHours() - 24);
                    break;
                case '7d':
                    startTime.setDate(endTime.getDate() - 7);
                    break;
                case '30d':
                    startTime.setDate(endTime.getDate() - 30);
                    break;
                default:
                    startTime.setHours(endTime.getHours() - 24);
            }

            const healthChecks = await APIHealthCheck.find({
                timestamp: { $gte: startTime, $lte: endTime }
            }).sort({ timestamp: 1 });

            const analytics = {
                period: period,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                totalChecks: healthChecks.length,
                providers: {},
                summary: {
                    avgResponseTime: 0,
                    totalRequests: 0,
                    totalErrors: 0,
                    availability: 0
                }
            };

            // Group by provider
            const providerData = {};
            healthChecks.forEach(check => {
                if (!providerData[check.provider]) {
                    providerData[check.provider] = {
                        checks: [],
                        responseTimes: [],
                        successCount: 0,
                        totalCount: 0
                    };
                }
                
                providerData[check.provider].checks.push(check);
                providerData[check.provider].responseTimes.push(check.response_time);
                providerData[check.provider].totalCount++;
                
                if (check.status === 'healthy') {
                    providerData[check.provider].successCount++;
                }
            });

            // Calculate provider analytics
            let totalResponseTime = 0;
            let totalSuccessChecks = 0;
            let totalChecks = 0;

            Object.keys(providerData).forEach(provider => {
                const data = providerData[provider];
                const avgResponseTime = data.responseTimes.length > 0 
                    ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length 
                    : 0;
                
                const availability = data.totalCount > 0 
                    ? (data.successCount / data.totalCount) * 100 
                    : 0;

                analytics.providers[provider] = {
                    totalChecks: data.totalCount,
                    successfulChecks: data.successCount,
                    availability: availability,
                    avgResponseTime: avgResponseTime,
                    minResponseTime: Math.min(...data.responseTimes),
                    maxResponseTime: Math.max(...data.responseTimes)
                };

                totalResponseTime += avgResponseTime;
                totalSuccessChecks += data.successCount;
                totalChecks += data.totalCount;
            });

            // Calculate summary
            const providerCount = Object.keys(providerData).length;
            analytics.summary.avgResponseTime = providerCount > 0 ? totalResponseTime / providerCount : 0;
            analytics.summary.availability = totalChecks > 0 ? (totalSuccessChecks / totalChecks) * 100 : 0;

            res.json({
                success: true,
                data: analytics
            });

        } catch (error) {
            console.error('Performance analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get performance analytics'
            });
        }
    }

    /**
     * Get system alerts
     */
    async getAlerts(req, res) {
        try {
            const { severity, limit = 50 } = req.query;
            const apiManager = require('../services/api/api-manager');
            
            const alerts = [];
            const currentTime = new Date();

            for (const [providerName, provider] of apiManager.providers) {
                const healthStatus = await provider.healthCheck();
                const errorRate = this.calculateErrorRate(provider);
                const responseTime = healthStatus.latency || 0;

                // Check error rate
                if (errorRate > this.alertThresholds.errorRate) {
                    alerts.push({
                        id: `${providerName}-error-rate`,
                        provider: providerName,
                        type: 'error_rate',
                        severity: errorRate > 10 ? 'critical' : 'warning',
                        message: `High error rate: ${errorRate.toFixed(2)}%`,
                        value: errorRate,
                        threshold: this.alertThresholds.errorRate,
                        timestamp: currentTime.toISOString()
                    });
                }

                // Check response time
                if (responseTime > this.alertThresholds.responseTime) {
                    alerts.push({
                        id: `${providerName}-response-time`,
                        provider: providerName,
                        type: 'response_time',
                        severity: responseTime > 5000 ? 'critical' : 'warning',
                        message: `High response time: ${responseTime}ms`,
                        value: responseTime,
                        threshold: this.alertThresholds.responseTime,
                        timestamp: currentTime.toISOString()
                    });
                }

                // Check availability
                if (healthStatus.status !== 'healthy' && provider.isAuthenticated) {
                    alerts.push({
                        id: `${providerName}-unavailable`,
                        provider: providerName,
                        type: 'availability',
                        severity: 'critical',
                        message: `Provider unavailable: ${healthStatus.error || 'Unknown error'}`,
                        timestamp: currentTime.toISOString()
                    });
                }
            }

            // Filter by severity if requested
            let filteredAlerts = alerts;
            if (severity) {
                filteredAlerts = alerts.filter(alert => alert.severity === severity);
            }

            // Sort by severity (critical first) and limit
            filteredAlerts.sort((a, b) => {
                const severityOrder = { critical: 3, warning: 2, info: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            });

            filteredAlerts = filteredAlerts.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: {
                    alerts: filteredAlerts,
                    total: filteredAlerts.length,
                    timestamp: currentTime.toISOString()
                }
            });

        } catch (error) {
            console.error('Alerts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get alerts'
            });
        }
    }

    /**
     * Helper method to calculate error rate
     */
    calculateErrorRate(provider) {
        const totalRequests = provider.requestsToday || 0;
        const errors = provider.errorsToday || 0;
        return totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
    }

    /**
     * Helper method to calculate uptime
     */
    calculateUptime(provider) {
        // This would ideally come from stored metrics
        return provider.isAuthenticated && provider.isHealthy ? 99.9 : 0;
    }

    /**
     * Helper method to check provider alerts
     */
    checkProviderAlerts(providerName, metrics) {
        const alerts = [];
        
        if (metrics.errorRate > this.alertThresholds.errorRate) {
            alerts.push({
                provider: providerName,
                type: 'error_rate',
                severity: metrics.errorRate > 10 ? 'critical' : 'warning',
                message: `High error rate: ${metrics.errorRate.toFixed(2)}%`
            });
        }

        if (metrics.responseTime > this.alertThresholds.responseTime) {
            alerts.push({
                provider: providerName,
                type: 'response_time',
                severity: metrics.responseTime > 5000 ? 'critical' : 'warning',
                message: `High response time: ${metrics.responseTime}ms`
            });
        }

        return alerts;
    }

    /**
     * Get last 24 hours trends
     */
    async getLast24HoursTrends() {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        
        try {
            const summary = await APIHealthSummary.findOne({
                date: { $gte: startTime, $lte: endTime }
            }).sort({ date: -1 });

            return summary ? {
                requests: summary.total_requests,
                errors: summary.total_errors,
                avgResponseTime: summary.avg_response_time,
                availability: summary.availability_percentage
            } : null;
        } catch (error) {
            console.error('24h trends error:', error);
            return null;
        }
    }

    /**
     * Get weekly trends
     */
    async getWeeklyTrends() {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        try {
            const summaries = await APIHealthSummary.find({
                date: { $gte: startTime, $lte: endTime }
            }).sort({ date: -1 }).limit(7);

            return summaries.map(summary => ({
                date: summary.date,
                requests: summary.total_requests,
                errors: summary.total_errors,
                avgResponseTime: summary.avg_response_time,
                availability: summary.availability_percentage
            }));
        } catch (error) {
            console.error('Weekly trends error:', error);
            return [];
        }
    }
}

module.exports = new MonitoringController();
