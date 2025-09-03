// dashboard-backend/src/controllers/multiAuthController.js

/**
 * Multi-API Authentication Controller
 * Unified authentication management for all API providers
 * 
 * @version 2.3.0
 * @created September 03, 2025
 * @phase Phase 2.5 - Steps 7-10 Enhancements
 */

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { APIHealthSummary } = require('../models/apiHealthModel');

class MultiAuthController {
    constructor() {
        this.providers = new Map();
        this.authStatus = new Map();
        this.tokenStore = new Map();
    }

    /**
     * Get unified authentication status across all providers
     */
    async getUnifiedAuthStatus(req, res) {
        try {
            const userId = req.user?.id;
            const status = {
                timestamp: new Date().toISOString(),
                user: userId,
                providers: {},
                summary: {
                    total: 0,
                    authenticated: 0,
                    capacity: 0,
                    healthy: 0
                }
            };

            // Get API Manager instance
            const apiManager = require('../services/api/api-manager');
            
            for (const [providerName, provider] of apiManager.providers) {
                const providerStatus = {
                    name: provider.config?.name || providerName,
                    isAuthenticated: provider.isAuthenticated || false,
                    isHealthy: provider.isHealthy || false,
                    capacity: provider.config?.rate_limits?.requests_per_minute || 0,
                    lastCheck: provider.lastHealthCheck || null,
                    error: provider.lastError || null
                };

                status.providers[providerName] = providerStatus;
                status.summary.total++;
                
                if (providerStatus.isAuthenticated) {
                    status.summary.authenticated++;
                    status.summary.capacity += providerStatus.capacity;
                }
                
                if (providerStatus.isHealthy) {
                    status.summary.healthy++;
                }
            }

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Unified auth status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get authentication status'
            });
        }
    }

    /**
     * Initiate authentication for a specific provider
     */
    async initiateProviderAuth(req, res) {
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

            let authData = {};

            switch (provider) {
                case 'upstox':
                    authData = {
                        authUrl: `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${process.env.UPSTOX_CLIENT_ID}&redirect_uri=${process.env.UPSTOX_REDIRECT_URI}`,
                        flow: 'oauth',
                        provider: 'upstox'
                    };
                    break;

                case 'fyers':
                    authData = {
                        authUrl: `https://api.fyers.in/api/v2/generate-authcode?client_id=${process.env.FYERS_APP_ID}&redirect_uri=${process.env.FYERS_REDIRECT_URI}&response_type=code&state=sample_state`,
                        flow: 'oauth',
                        provider: 'fyers'
                    };
                    break;

                case 'aliceblue':
                    authData = {
                        authUrl: `https://ant.aliceblueonline.com/?appcode=${process.env.ALICEBLUE_APP_CODE}`,
                        flow: 'oauth',
                        provider: 'aliceblue'
                    };
                    break;

                case 'flattrade':
                    authData = {
                        authUrl: `https://piconnect.flattrade.in/PiConnectTP/`,
                        flow: 'redirect',
                        provider: 'flattrade'
                    };
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        error: `Authentication not supported for ${provider}`
                    });
            }

            res.json({
                success: true,
                data: authData
            });

        } catch (error) {
            console.error('Provider auth initiation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initiate authentication'
            });
        }
    }

    /**
     * Complete authentication for a provider
     */
    async completeProviderAuth(req, res) {
        try {
            const { provider } = req.params;
            const { code, state, authCode } = req.body;
            
            const apiManager = require('../services/api/api-manager');
            const providerInstance = apiManager.providers.get(provider);
            
            if (!providerInstance) {
                return res.status(404).json({
                    success: false,
                    error: `Provider ${provider} not found`
                });
            }

            let result;

            switch (provider) {
                case 'upstox':
                    if (!providerInstance.exchangeCodeForToken) {
                        throw new Error('Upstox token exchange not implemented');
                    }
                    result = await providerInstance.exchangeCodeForToken(code);
                    break;

                case 'aliceblue':
                    if (!providerInstance.exchangeCodeForToken) {
                        throw new Error('AliceBlue token exchange not implemented');
                    }
                    result = await providerInstance.exchangeCodeForToken(authCode);
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        error: `Authentication completion not supported for ${provider}`
                    });
            }

            // Update provider status
            this.authStatus.set(provider, {
                authenticated: true,
                timestamp: new Date().toISOString(),
                tokenExpiry: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null
            });

            res.json({
                success: true,
                message: `${provider} authentication completed successfully`,
                data: {
                    provider: provider,
                    authenticated: true,
                    capacity: providerInstance.config?.rate_limits?.requests_per_minute || 0
                }
            });

        } catch (error) {
            console.error('Provider auth completion error:', error);
            res.status(500).json({
                success: false,
                error: `Failed to complete ${provider} authentication: ${error.message}`
            });
        }
    }

    /**
     * Refresh tokens for all authenticated providers
     */
    async refreshAllTokens(req, res) {
        try {
            const apiManager = require('../services/api/api-manager');
            const results = {};

            for (const [providerName, provider] of apiManager.providers) {
                if (provider.isAuthenticated && provider.refreshToken) {
                    try {
                        await provider.refreshToken();
                        results[providerName] = { success: true, message: 'Token refreshed' };
                    } catch (error) {
                        results[providerName] = { success: false, error: error.message };
                    }
                } else {
                    results[providerName] = { success: false, error: 'Not authenticated or refresh not supported' };
                }
            }

            res.json({
                success: true,
                message: 'Token refresh completed',
                data: results
            });

        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to refresh tokens'
            });
        }
    }

    /**
     * Disconnect a specific provider
     */
    async disconnectProvider(req, res) {
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

            // Clear authentication
            providerInstance.isAuthenticated = false;
            providerInstance.accessToken = null;
            providerInstance.userSession = null;

            // Update status
            this.authStatus.delete(provider);

            res.json({
                success: true,
                message: `${provider} disconnected successfully`,
                data: {
                    provider: provider,
                    authenticated: false
                }
            });

        } catch (error) {
            console.error('Provider disconnect error:', error);
            res.status(500).json({
                success: false,
                error: `Failed to disconnect ${provider}`
            });
        }
    }

    /**
     * Get authentication statistics
     */
    async getAuthStats(req, res) {
        try {
            const apiManager = require('../services/api/api-manager');
            const stats = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalProviders: apiManager.providers.size,
                    authenticatedProviders: 0,
                    totalCapacity: 0,
                    healthyProviders: 0
                },
                providers: {},
                performance: {
                    avgResponseTime: 0,
                    totalRequests: 0,
                    errorRate: 0
                }
            };

            let totalResponseTime = 0;
            let totalRequests = 0;
            let totalErrors = 0;

            for (const [providerName, provider] of apiManager.providers) {
                const providerStats = {
                    authenticated: provider.isAuthenticated || false,
                    healthy: provider.isHealthy || false,
                    capacity: provider.config?.rate_limits?.requests_per_minute || 0,
                    requestsToday: provider.requestsToday || 0,
                    errorsToday: provider.errorsToday || 0,
                    avgResponseTime: provider.avgResponseTime || 0
                };

                stats.providers[providerName] = providerStats;

                if (providerStats.authenticated) {
                    stats.summary.authenticatedProviders++;
                    stats.summary.totalCapacity += providerStats.capacity;
                }

                if (providerStats.healthy) {
                    stats.summary.healthyProviders++;
                }

                totalRequests += providerStats.requestsToday;
                totalErrors += providerStats.errorsToday;
                totalResponseTime += providerStats.avgResponseTime;
            }

            stats.performance.totalRequests = totalRequests;
            stats.performance.errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
            stats.performance.avgResponseTime = apiManager.providers.size > 0 ? totalResponseTime / apiManager.providers.size : 0;

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Auth stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get authentication statistics'
            });
        }
    }
}

module.exports = new MultiAuthController();
