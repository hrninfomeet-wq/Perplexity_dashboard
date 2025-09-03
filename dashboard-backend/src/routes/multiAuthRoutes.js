// dashboard-backend/src/routes/multiAuthRoutes.js

/**
 * Multi-API Authentication Routes
 * Enhanced authentication management for all API providers
 * 
 * @version 2.3.0
 * @created September 03, 2025
 * @phase Phase 2.5 - Step 8 Authentication Enhancement
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const multiAuthController = require('../controllers/multiAuthController');

/**
 * @route GET /api/auth/multi/status
 * @desc Get unified authentication status across all providers
 * @access Private
 */
router.get('/status', authenticateToken, multiAuthController.getUnifiedAuthStatus);

/**
 * @route POST /api/auth/multi/initiate/:provider
 * @desc Initiate authentication for a specific provider
 * @access Private
 */
router.post('/initiate/:provider', authenticateToken, multiAuthController.initiateProviderAuth);

/**
 * @route POST /api/auth/multi/complete/:provider
 * @desc Complete authentication for a provider
 * @access Private
 */
router.post('/complete/:provider', authenticateToken, multiAuthController.completeProviderAuth);

/**
 * @route POST /api/auth/multi/refresh
 * @desc Refresh tokens for all authenticated providers
 * @access Private
 */
router.post('/refresh', authenticateToken, multiAuthController.refreshAllTokens);

/**
 * @route POST /api/auth/multi/disconnect/:provider
 * @desc Disconnect a specific provider
 * @access Private
 */
router.post('/disconnect/:provider', authenticateToken, multiAuthController.disconnectProvider);

/**
 * @route GET /api/auth/multi/stats
 * @desc Get authentication statistics
 * @access Private
 */
router.get('/stats', authenticateToken, multiAuthController.getAuthStats);

/**
 * @route GET /api/auth/multi/health
 * @desc Get authentication health status
 * @access Private
 */
router.get('/health', authenticateToken, async (req, res) => {
    try {
        const apiManager = require('../services/api/api-manager');
        const healthStatus = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            providers: {},
            summary: {
                total: 0,
                healthy: 0,
                authenticated: 0,
                capacity: 0
            }
        };

        for (const [providerName, provider] of apiManager.providers) {
            const status = await provider.healthCheck();
            healthStatus.providers[providerName] = {
                status: status.status,
                authenticated: provider.isAuthenticated || false,
                capacity: provider.config?.rate_limits?.requests_per_minute || 0,
                latency: status.latency || null,
                error: status.error || null
            };

            healthStatus.summary.total++;
            if (status.status === 'healthy') {
                healthStatus.summary.healthy++;
            }
            if (provider.isAuthenticated) {
                healthStatus.summary.authenticated++;
                healthStatus.summary.capacity += healthStatus.providers[providerName].capacity;
            }
        }

        // Overall health determination
        const healthRatio = healthStatus.summary.healthy / healthStatus.summary.total;
        if (healthRatio < 0.5) {
            healthStatus.status = 'critical';
        } else if (healthRatio < 0.8) {
            healthStatus.status = 'degraded';
        }

        res.json({
            success: true,
            data: healthStatus
        });

    } catch (error) {
        console.error('Multi-auth health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check authentication health'
        });
    }
});

/**
 * @route GET /api/auth/multi/capacity
 * @desc Get current API capacity across all providers
 * @access Private
 */
router.get('/capacity', authenticateToken, async (req, res) => {
    try {
        const apiManager = require('../services/api/api-manager');
        const capacity = {
            timestamp: new Date().toISOString(),
            totalCapacity: 0,
            activeCapacity: 0,
            providers: {},
            utilization: {
                current: 0,
                percentage: 0,
                remaining: 0
            }
        };

        for (const [providerName, provider] of apiManager.providers) {
            const providerCapacity = provider.config?.rate_limits?.requests_per_minute || 0;
            const isActive = provider.isAuthenticated && provider.isHealthy;
            
            capacity.providers[providerName] = {
                capacity: providerCapacity,
                active: isActive,
                used: provider.requestsThisMinute || 0,
                remaining: isActive ? Math.max(0, providerCapacity - (provider.requestsThisMinute || 0)) : 0
            };

            capacity.totalCapacity += providerCapacity;
            if (isActive) {
                capacity.activeCapacity += providerCapacity;
                capacity.utilization.current += provider.requestsThisMinute || 0;
                capacity.utilization.remaining += capacity.providers[providerName].remaining;
            }
        }

        capacity.utilization.percentage = capacity.activeCapacity > 0 
            ? (capacity.utilization.current / capacity.activeCapacity) * 100 
            : 0;

        res.json({
            success: true,
            data: capacity
        });

    } catch (error) {
        console.error('Capacity check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check API capacity'
        });
    }
});

/**
 * @route POST /api/auth/multi/test/:provider
 * @desc Test authentication for a specific provider
 * @access Private
 */
router.post('/test/:provider', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.params;
        const apiManager = require('../services/api/api-manager');
        
        const providerInstance = apiManager.providers.get(provider);
        if (!providerInstance) {
            return res.status(404).json({
                success: false,
                error: `Provider ${provider} not found`
            });
        }

        const startTime = Date.now();
        const healthCheck = await providerInstance.healthCheck();
        const endTime = Date.now();

        const testResult = {
            provider: provider,
            authenticated: providerInstance.isAuthenticated || false,
            healthy: healthCheck.status === 'healthy',
            latency: endTime - startTime,
            capacity: providerInstance.config?.rate_limits?.requests_per_minute || 0,
            error: healthCheck.error || null,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: testResult
        });

    } catch (error) {
        console.error('Provider test error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to test ${req.params.provider}: ${error.message}`
        });
    }
});

module.exports = router;
