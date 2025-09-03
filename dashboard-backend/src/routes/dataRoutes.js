// dashboard-backend/src/routes/dataRoutes.js

/**
 * Data Management Routes
 * Handles user data, trade management, and analytics endpoints
 * 
 * @version 2.2.0
 * @created September 02, 2025
 */

const express = require('express');
const router = express.Router();

// Import middleware and models
const AuthMiddleware = require('../middleware/auth.middleware');
const User = require('../models/userModel');
const Trade = require('../models/tradeModel');
const dbConfig = require('../config/db.config');

// Apply common middleware
router.use(AuthMiddleware.securityHeaders);
router.use(AuthMiddleware.requestLogger);

/**
 * User Data Management Routes
 */

// Get user profile and preferences
router.get('/user/profile', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    message: 'User session not found',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                user: user.toSafeObject(),
                dashboard_config: user.getDashboardConfig(),
                activity: user.activity,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Get user profile error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Profile retrieval failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Update user preferences
router.put('/user/preferences', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }
            
            const success = await user.updatePreferences(req.body);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Preferences updated successfully',
                    preferences: user.getDashboardConfig(),
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Preferences update failed',
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('❌ Update preferences error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Preferences update failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Trade Management Routes
 */

// Get user's active trades
router.get('/trades/active', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }
            
            const limit = parseInt(req.query.limit) || 50;
            const activeTrades = await Trade.getActiveTrades(user._id, limit);
            
            res.json({
                success: true,
                trades: activeTrades.map(trade => trade.toClientObject()),
                count: activeTrades.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Get active trades error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get active trades',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get user's trade history
router.get('/trades/history', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }
            
            const filters = {
                symbol: req.query.symbol,
                signal_type: req.query.signal_type,
                status: req.query.status,
                date_from: req.query.date_from,
                date_to: req.query.date_to
            };
            
            const limit = parseInt(req.query.limit) || 100;
            const tradeHistory = await Trade.getTradeHistory(user._id, filters, limit);
            
            res.json({
                success: true,
                trades: tradeHistory.map(trade => trade.toClientObject()),
                count: tradeHistory.length,
                filters: filters,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Get trade history error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get trade history',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Create new trade signal
router.post('/trades/create', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Create new trade with user association
            const tradeData = {
                ...req.body,
                user_id: user._id
            };
            
            const newTrade = new Trade(tradeData);
            await newTrade.save();
            
            console.log(`✅ New trade created: ${newTrade.symbol} ${newTrade.action} for user ${user.username}`);
            
            res.status(201).json({
                success: true,
                message: 'Trade signal created successfully',
                trade: newTrade.toClientObject(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Create trade error:', error.message);
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }));
                
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Invalid trade data',
                    validation_errors: validationErrors,
                    timestamp: new Date().toISOString()
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Trade creation failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Update trade price and status
router.put('/trades/:tradeId/update', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }
            
            const trade = await Trade.findOne({
                _id: req.params.tradeId,
                user_id: user._id
            });
            
            if (!trade) {
                return res.status(404).json({
                    success: false,
                    error: 'Trade not found',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Update trade price if provided
            if (req.body.current_price) {
                await trade.updatePrice(req.body.current_price);
            }
            
            // Update other fields if provided
            Object.keys(req.body).forEach(key => {
                if (key !== 'current_price' && trade[key] !== undefined) {
                    trade[key] = req.body[key];
                }
            });
            
            await trade.save();
            
            res.json({
                success: true,
                message: 'Trade updated successfully',
                trade: trade.toClientObject(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Update trade error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Trade update failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Analytics and Statistics Routes
 */

// Get user performance summary
router.get('/analytics/performance', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const user = await User.findBySessionToken(req.authToken);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }
            
            const period = req.query.period || '30d';
            const performance = await Trade.getPerformanceSummary(user._id, period);
            
            res.json({
                success: true,
                performance: performance,
                period: period,
                user_activity: user.activity,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Get performance analytics error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Performance analytics failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Database Health and Management Routes
 */

// Database health check
router.get('/database/health', 
    AuthMiddleware.optionalAuth,
    async (req, res) => {
        try {
            const healthStatus = await dbConfig.getHealthStatus();
            
            res.json({
                success: true,
                database: healthStatus,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Database health check error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Database health check failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Cleanup expired trades
router.post('/database/cleanup', 
    AuthMiddleware.requireAdminAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
            }
            
            const expiredTrades = await Trade.cleanupExpiredTrades();
            const expiredSessions = await User.cleanupAllExpiredSessions();
            
            res.json({
                success: true,
                message: 'Database cleanup completed',
                results: {
                    expired_trades: expiredTrades,
                    expired_sessions: expiredSessions
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Database cleanup error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Database cleanup failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
    console.error('❌ Data route error:', error.message);
    
    res.status(error.status || 500).json({
        success: false,
        error: error.message,
        message: 'Data management route error',
        route: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

/**
 * Route not found handler
 */
router.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Data route ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /api/data/user/profile',
            'PUT /api/data/user/preferences',
            'GET /api/data/trades/active',
            'GET /api/data/trades/history',
            'POST /api/data/trades/create',
            'PUT /api/data/trades/:tradeId/update',
            'GET /api/data/analytics/performance',
            'GET /api/data/database/health',
            'POST /api/data/database/cleanup'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
