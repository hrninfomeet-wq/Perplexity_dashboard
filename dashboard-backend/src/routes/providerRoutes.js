// dashboard-backend/src/routes/providerRoutes.js

/**
 * API Provider Management Routes
 * Routes for managing individual API providers and authentication
 * 
 * @version 2.3.0
 * @created September 03, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const User = require('../models/userModel');
const { APIHealthSummary } = require('../models/apiHealthModel');

/**
 * @route GET /api/providers/user-config
 * @desc Get user's API provider configuration
 * @access Private
 */
router.get('/user-config', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        const authenticatedProviders = user.getAuthenticatedProviders();
        const dashboardConfig = user.getDashboardConfig();
        
        res.json({
            success: true,
            data: {
                authenticatedProviders: authenticatedProviders,
                apiProviders: dashboardConfig.apiProviders,
                flattrade: {
                    isAuthenticated: user.flattrade.is_authenticated,
                    userId: user.flattrade.user_id,
                    lastTokenRefresh: user.flattrade.last_token_refresh
                },
                totalProviders: authenticatedProviders.length,
                primaryProvider: dashboardConfig.apiProviders.preferredProvider
            }
        });
        
    } catch (error) {
        console.error('User config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user configuration',
            message: error.message
        });
    }
});

/**
 * @route POST /api/providers/enable/:provider
 * @desc Enable specific API provider for user
 * @access Private
 */
router.post('/enable/:provider', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.params;
        const validProviders = ['upstox', 'fyers', 'aliceblue'];
        
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid provider name',
                validProviders: validProviders
            });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        await user.toggleProvider(provider, true);
        
        res.json({
            success: true,
            message: `Provider ${provider} enabled successfully`,
            data: {
                provider: provider,
                enabled: true,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error('Provider enable error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to enable provider',
            message: error.message
        });
    }
});

/**
 * @route POST /api/providers/disable/:provider
 * @desc Disable specific API provider for user
 * @access Private
 */
router.post('/disable/:provider', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.params;
        const validProviders = ['upstox', 'fyers', 'aliceblue'];
        
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid provider name',
                validProviders: validProviders
            });
        }
        
        if (provider === 'flattrade') {
            return res.status(400).json({
                success: false,
                error: 'Flattrade cannot be disabled as it is the primary provider'
            });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        await user.toggleProvider(provider, false);
        
        res.json({
            success: true,
            message: `Provider ${provider} disabled successfully`,
            data: {
                provider: provider,
                enabled: false,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error('Provider disable error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disable provider',
            message: error.message
        });
    }
});

/**
 * @route POST /api/providers/priority
 * @desc Update provider priority order for user
 * @access Private
 */
router.post('/priority', authenticateToken, async (req, res) => {
    try {
        const { priority_order } = req.body;
        
        if (!priority_order || !Array.isArray(priority_order)) {
            return res.status(400).json({
                success: false,
                error: 'Priority order array is required'
            });
        }
        
        const validProviders = ['flattrade', 'upstox', 'fyers', 'aliceblue', 'nse-public'];
        const invalidProviders = priority_order.filter(p => !validProviders.includes(p));
        
        if (invalidProviders.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid providers in priority order',
                invalidProviders: invalidProviders,
                validProviders: validProviders
            });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        await user.updateProviderPriority(priority_order);
        
        res.json({
            success: true,
            message: 'Provider priority updated successfully',
            data: {
                priorityOrder: priority_order,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error('Provider priority error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update provider priority',
            message: error.message
        });
    }
});

/**
 * @route GET /api/providers/health/:provider
 * @desc Get health status for specific provider
 * @access Private
 */
router.get('/health/:provider', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.params;
        const validProviders = ['flattrade', 'upstox', 'fyers', 'aliceblue', 'nse-public'];
        
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid provider name',
                validProviders: validProviders
            });
        }
        
        const healthSummary = await APIHealthSummary.findOne({ provider: provider });
        
        if (!healthSummary) {
            return res.status(404).json({
                success: false,
                error: 'Health data not found for provider',
                provider: provider
            });
        }
        
        res.json({
            success: true,
            data: {
                provider: provider,
                status: healthSummary.currentStatus,
                lastUpdated: healthSummary.lastUpdated,
                metrics: {
                    averageResponseTime: healthSummary.averageResponseTime,
                    uptime: healthSummary.uptime,
                    errorRate: healthSummary.errorRate,
                    totalRequests: healthSummary.totalRequests,
                    successfulRequests: healthSummary.successfulRequests,
                    failedRequests: healthSummary.failedRequests
                },
                rateLimits: healthSummary.rateLimitInfo,
                performance: healthSummary.performanceMetrics,
                lastError: {
                    time: healthSummary.lastErrorTime,
                    message: healthSummary.lastErrorMessage
                }
            }
        });
        
    } catch (error) {
        console.error('Provider health error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get provider health',
            message: error.message
        });
    }
});

/**
 * @route GET /api/providers/auth-status
 * @desc Get authentication status for all providers
 * @access Private
 */
router.get('/auth-status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        const authStatus = {
            flattrade: {
                isAuthenticated: user.flattrade.is_authenticated,
                lastTokenRefresh: user.flattrade.last_token_refresh,
                tokenExpiresAt: user.flattrade.token_expires_at,
                enabled: true // Always enabled
            },
            upstox: {
                isAuthenticated: user.api_providers.upstox.is_authenticated,
                lastTokenRefresh: user.api_providers.upstox.last_token_refresh,
                tokenExpiresAt: user.api_providers.upstox.token_expires_at,
                enabled: user.api_providers.upstox.enabled
            },
            fyers: {
                isAuthenticated: user.api_providers.fyers.is_authenticated,
                lastTokenRefresh: user.api_providers.fyers.last_token_refresh,
                tokenExpiresAt: user.api_providers.fyers.token_expires_at,
                enabled: user.api_providers.fyers.enabled
            },
            aliceblue: {
                isAuthenticated: user.api_providers.aliceblue.is_authenticated,
                lastTokenRefresh: user.api_providers.aliceblue.last_token_refresh,
                tokenExpiresAt: user.api_providers.aliceblue.token_expires_at,
                enabled: user.api_providers.aliceblue.enabled
            },
            'nse-public': {
                isAuthenticated: true, // No auth required
                lastTokenRefresh: null,
                tokenExpiresAt: null,
                enabled: true // Always available
            }
        };
        
        const summary = {
            totalProviders: Object.keys(authStatus).length,
            authenticatedProviders: Object.values(authStatus).filter(p => p.isAuthenticated).length,
            enabledProviders: Object.values(authStatus).filter(p => p.enabled).length,
            needsAuthentication: Object.entries(authStatus)
                .filter(([name, status]) => !status.isAuthenticated && name !== 'nse-public')
                .map(([name]) => name)
        };
        
        res.json({
            success: true,
            data: {
                providers: authStatus,
                summary: summary,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error('Auth status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get authentication status',
            message: error.message
        });
    }
});

/**
 * @route POST /api/providers/auth/:provider
 * @desc Initiate authentication for specific provider
 * @access Private
 */
router.post('/auth/:provider', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.params;
        const validProviders = ['upstox', 'fyers', 'aliceblue'];
        
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid provider for authentication',
                validProviders: validProviders,
                note: 'Flattrade uses existing authentication, NSE Public requires no authentication'
            });
        }
        
        // Generate authentication URLs based on provider
        let authUrl = '';
        let authData = {};
        
        switch (provider) {
            case 'upstox':
                // OAuth flow for Upstox
                authData = {
                    authUrl: `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${process.env.UPSTOX_CLIENT_ID}&redirect_uri=${process.env.UPSTOX_REDIRECT_URI}`,
                    flow: 'oauth',
                    steps: [
                        'Click the authentication URL',
                        'Login to your Upstox account',
                        'Grant permissions',
                        'Copy the authorization code from redirect URL',
                        'Use /api/providers/auth/upstox/callback with the code'
                    ]
                };
                break;
                
            case 'fyers':
                // OAuth flow for FYERS
                authData = {
                    authUrl: `https://api.fyers.in/api/v2/generate-authcode?client_id=${process.env.FYERS_APP_ID}&redirect_uri=${process.env.FYERS_REDIRECT_URI}&response_type=code&state=sample_state`,
                    flow: 'oauth',
                    steps: [
                        'Click the authentication URL',
                        'Login to your FYERS account',
                        'Grant permissions',
                        'Copy the authorization code from redirect URL',
                        'Use /api/providers/auth/fyers/callback with the code'
                    ]
                };
                break;
                
            case 'aliceblue':
                // OAuth flow for AliceBlue
                authData = {
                    authUrl: `https://ant.aliceblueonline.com/?appcode=${process.env.ALICEBLUE_APP_CODE}`,
                    flow: 'oauth',
                    steps: [
                        'Click the authentication URL',
                        'Login to your AliceBlue account',
                        'Grant permissions',
                        'Copy the authCode from redirect URL',
                        'Use /api/providers/auth/aliceblue/callback with the authCode'
                    ]
                };
                break;
        }
        
        res.json({
            success: true,
            message: `Authentication process initiated for ${provider}`,
            data: {
                provider: provider,
                authData: authData,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error('Auth initiation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate authentication',
            message: error.message
        });
    }
});

/**
 * @route POST /api/providers/test/:provider
 * @desc Test API connection for specific provider
 * @access Private
 */
router.post('/test/:provider', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.params;
        const validProviders = ['flattrade', 'upstox', 'fyers', 'aliceblue', 'nse-public'];
        
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid provider name',
                validProviders: validProviders
            });
        }
        
        // This would integrate with the actual API manager to test the provider
        // For now, we'll return a mock response
        const testResult = {
            provider: provider,
            status: 'success',
            responseTime: Math.floor(Math.random() * 1000) + 200, // Mock response time
            timestamp: new Date(),
            testEndpoint: 'health_check',
            capabilities: getProviderCapabilities(provider)
        };
        
        res.json({
            success: true,
            message: `Provider ${provider} test completed`,
            data: testResult
        });
        
    } catch (error) {
        console.error('Provider test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test provider',
            message: error.message
        });
    }
});

/**
 * Get provider capabilities
 */
function getProviderCapabilities(provider) {
    const capabilities = {
        flattrade: {
            quotes: true,
            historical: true,
            optionChain: true,
            orderPlacement: true,
            portfolio: true,
            rateLimit: '80 req/min'
        },
        upstox: {
            quotes: true,
            historical: true,
            optionChain: true,
            orderPlacement: true,
            portfolio: true,
            websocket: true,
            rateLimit: '250 req/min'
        },
        fyers: {
            quotes: true,
            historical: true,
            optionChain: true,
            orderPlacement: true,
            portfolio: true,
            websocket: true,
            rateLimit: '200 req/min, 100K/day'
        },
        aliceblue: {
            quotes: true,
            historical: true,
            optionChain: true,
            orderPlacement: true,
            portfolio: true,
            marketDepth: true,
            rateLimit: '120 req/min'
        },
        'nse-public': {
            quotes: true,
            indices: true,
            marketStatus: true,
            basicData: true,
            rateLimit: '60 req/min',
            note: 'Public data only, no authentication required'
        }
    };
    
    return capabilities[provider] || {};
}

/**
 * @route POST /api/providers/auth/upstox/callback
 * @desc Handle Upstox OAuth callback
 * @access Public
 */
router.post('/auth/upstox/callback', async (req, res) => {
    try {
        const { code, state } = req.body;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code is required'
            });
        }

        // Exchange code for access token
        const response = await fetch('https://api.upstox.com/v2/login/authorization/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.UPSTOX_CLIENT_ID,
                client_secret: process.env.UPSTOX_CLIENT_SECRET,
                redirect_uri: process.env.UPSTOX_REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await response.json();
        
        if (!response.ok || !tokenData.access_token) {
            return res.status(400).json({
                success: false,
                error: 'Failed to exchange authorization code for access token',
                details: tokenData
            });
        }

        res.json({
            success: true,
            message: 'Upstox authentication successful',
            data: {
                access_token: tokenData.access_token,
                expires_in: tokenData.expires_in,
                token_type: tokenData.token_type
            }
        });
        
    } catch (error) {
        console.error('Upstox callback error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during Upstox authentication'
        });
    }
});

/**
 * @route POST /api/providers/auth/fyers/callback
 * @desc Handle FYERS OAuth callback
 * @access Public
 */
router.post('/auth/fyers/callback', async (req, res) => {
    try {
        const { code, state } = req.body;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code is required'
            });
        }

        res.json({
            success: true,
            message: 'FYERS authentication successful',
            data: {
                auth_code: code,
                next_step: 'Use this code to generate access token'
            }
        });
        
    } catch (error) {
        console.error('FYERS callback error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during FYERS authentication'
        });
    }
});

/**
 * @route POST /api/providers/auth/aliceblue/callback
 * @desc Handle AliceBlue OAuth callback
 * @access Public
 */
router.post('/auth/aliceblue/callback', async (req, res) => {
    try {
        const { authCode, userId } = req.body;
        
        if (!authCode || !userId) {
            return res.status(400).json({
                success: false,
                error: 'AuthCode and userId are required'
            });
        }

        // Get the AliceBlue provider instance
        const apiManager = require('../services/api/api-manager');
        const aliceblueProvider = apiManager.providers.get('aliceblue');
        
        if (!aliceblueProvider) {
            return res.status(500).json({
                success: false,
                error: 'AliceBlue provider not available'
            });
        }

        // Exchange auth code for user session
        const result = await aliceblueProvider.exchangeCodeForToken(authCode);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'AliceBlue authentication successful',
                data: {
                    userSession: result.userSession,
                    clientId: result.clientId,
                    userId: result.userId,
                    provider: 'aliceblue'
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Failed to authenticate with AliceBlue'
            });
        }
        
    } catch (error) {
        console.error('AliceBlue callback error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during AliceBlue authentication',
            details: error.message
        });
    }
});

module.exports = router;
