// dashboard-backend/src/routes/dataRoutes.js

/**
 * Data Management Routes
 * CRUD operations for trades, users, and analytics data
 * 
 * @version 2.2.0
 * @created September 02, 2025
 */

const express = require('express');
const router = express.Router();

// Import middleware
const AuthMiddleware = require('../middleware/auth.middleware');

// Import database models
const User = require('../models/userModel');
const Trade = require('../models/tradeModel');
const dbConfig = require('../config/db.config');

// Apply common middleware
router.use(AuthMiddleware.securityHeaders);
router.use(AuthMiddleware.requestLogger);

/**
 * Database Health and Status Routes
 */

// Database health check
router.get('/health/db', async (req, res) => {
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
});

// Database statistics
router.get('/stats/db', 
    AuthMiddleware.optionalAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database not connected',
                    timestamp: new Date().toISOString()
                });
            }

            const stats = {
                users: {
                    total: await User.countDocuments(),
                    active: await User.countDocuments({ status: 'active' }),
                    authenticated: await User.countDocuments({ 'flattrade.is_authenticated': true }),
                    active_today: await User.getActiveUsersCount()
                },
                trades: {
                    total: await Trade.countDocuments(),
                    active: await Trade.countDocuments({ status: 'active' }),
                    completed: await Trade.countDocuments({ status: 'completed' }),
                    expired: await Trade.countDocuments({ status: 'expired' })
                },
                sessions: await User.aggregate([
                    { $unwind: '$sessions' },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            active: {
                                $sum: {
                                    $cond: [
                                        { 
                                            $and: [
                                                { $eq: ['$sessions.is_active', true] },
                                                { $gt: ['$sessions.expires_at', new Date()] }
                                            ]
                                        },
                                        1, 0
                                    ]
                                }
                            }
                        }
                    }
                ]).then(result => result[0] || { total: 0, active: 0 })
            };

            res.json({
                success: true,
                statistics: stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Database statistics error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get database statistics',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * User Data Routes
 */

// Get all users (admin only)
router.get('/users', 
    AuthMiddleware.requireAdminAuth,
    async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const users = await User.find({ status: 'active' })
                .select('-sessions -password_hash')
                .skip(skip)
                .limit(limit)
                .sort({ created_at: -1 });

            const totalUsers = await User.countDocuments({ status: 'active' });

            res.json({
                success: true,
                users: users,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(totalUsers / limit),
                    total_users: totalUsers,
                    per_page: limit
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get users error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve users',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get user by ID
router.get('/users/:userId', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const userId = req.params.userId;
            
            // Users can only access their own data unless admin
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser || (currentUser._id.toString() !== userId && !currentUser.isAdmin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'You can only access your own user data',
                    timestamp: new Date().toISOString()
                });
            }

            const user = await User.findById(userId).select('-sessions -password_hash');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                user: user.toSafeObject(),
                dashboard_config: user.getDashboardConfig(),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get user by ID error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve user',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Update user data
router.put('/users/:userId', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const userId = req.params.userId;
            
            // Users can only update their own data unless admin
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser || (currentUser._id.toString() !== userId && !currentUser.isAdmin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'You can only update your own user data',
                    timestamp: new Date().toISOString()
                });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Update allowed fields
            const allowedFields = ['preferences', 'activity'];
            const updateData = {};

            allowedFields.forEach(field => {
                if (req.body[field]) {
                    updateData[field] = req.body[field];
                }
            });

            Object.assign(user, updateData);
            await user.save();

            res.json({
                success: true,
                message: 'User updated successfully',
                user: user.toSafeObject(),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Update user error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to update user',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Trade Data Routes
 */

// Get all trades with filtering
router.get('/trades', 
    AuthMiddleware.optionalAuth,
    async (req, res) => {
        try {
            if (!dbConfig.isConnected) {
                return res.status(503).json({
                    success: false,
                    error: 'Database not connected',
                    timestamp: new Date().toISOString()
                });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;

            // Build query filters
            const filters = {};

            if (req.query.user_id) {
                filters.user_id = req.query.user_id;
            }

            if (req.query.symbol) {
                filters.symbol = req.query.symbol.toUpperCase();
            }

            if (req.query.signal_type) {
                filters.signal_type = req.query.signal_type;
            }

            if (req.query.status) {
                filters.status = req.query.status;
            }

            if (req.query.date_from || req.query.date_to) {
                filters.signal_generated_at = {};
                if (req.query.date_from) {
                    filters.signal_generated_at.$gte = new Date(req.query.date_from);
                }
                if (req.query.date_to) {
                    filters.signal_generated_at.$lte = new Date(req.query.date_to);
                }
            }

            // Execute query
            const trades = await Trade.find(filters)
                .populate('user_id', 'username email')
                .skip(skip)
                .limit(limit)
                .sort({ signal_generated_at: -1 });

            const totalTrades = await Trade.countDocuments(filters);

            // Convert to client-safe objects
            const clientTrades = trades.map(trade => trade.toClientObject());

            res.json({
                success: true,
                trades: clientTrades,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(totalTrades / limit),
                    total_trades: totalTrades,
                    per_page: limit
                },
                filters: filters,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get trades error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve trades',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get active trades for user
router.get('/trades/active', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }

            const limit = parseInt(req.query.limit) || 50;
            const activeTrades = await Trade.getActiveTrades(currentUser._id, limit);

            res.json({
                success: true,
                trades: activeTrades.map(trade => trade.toClientObject()),
                count: activeTrades.length,
                user_id: currentUser._id,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get active trades error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve active trades',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get trade history for user
router.get('/trades/history', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser) {
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
            const tradeHistory = await Trade.getTradeHistory(currentUser._id, filters, limit);

            res.json({
                success: true,
                trades: tradeHistory.map(trade => trade.toClientObject()),
                count: tradeHistory.length,
                user_id: currentUser._id,
                filters: filters,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get trade history error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve trade history',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get performance summary
router.get('/trades/performance', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }

            const period = req.query.period || '30d';
            const performanceSummary = await Trade.getPerformanceSummary(currentUser._id, period);

            if (!performanceSummary) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate performance summary',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                performance: performanceSummary,
                period: period,
                user_id: currentUser._id,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get performance summary error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve performance summary',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Create new trade
router.post('/trades', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    timestamp: new Date().toISOString()
                });
            }

            // Validate required fields
            const requiredFields = ['symbol', 'signal_type', 'action', 'entry_price', 'target_price', 'stop_loss', 'quantity'];
            const missingFields = requiredFields.filter(field => !req.body[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    missing_fields: missingFields,
                    timestamp: new Date().toISOString()
                });
            }

            // Create new trade
            const tradeData = {
                ...req.body,
                user_id: currentUser._id,
                signal_generated_at: new Date(),
                valid_until: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours default
                source: {
                    algorithm: req.body.algorithm || 'manual',
                    version: '2.2.0',
                    parameters: req.body.parameters || {}
                }
            };

            const newTrade = new Trade(tradeData);
            await newTrade.save();

            // Update user activity
            await currentUser.recordTrade({ profit: 0 }); // Initial record

            console.log(`✅ New trade created: ${newTrade.symbol} ${newTrade.action} for user ${currentUser.username}`);

            res.status(201).json({
                success: true,
                message: 'Trade created successfully',
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
                    validation_errors: validationErrors,
                    timestamp: new Date().toISOString()
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to create trade',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Get trade by ID
router.get('/trades/:tradeId', 
    AuthMiddleware.optionalAuth,
    async (req, res) => {
        try {
            const tradeId = req.params.tradeId;

            const trade = await Trade.findById(tradeId).populate('user_id', 'username email');

            if (!trade) {
                return res.status(404).json({
                    success: false,
                    error: 'Trade not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if user has access to this trade
            if (req.authToken) {
                const currentUser = await User.findBySessionToken(req.authToken);
                if (currentUser && currentUser._id.toString() !== trade.user_id._id.toString() && !currentUser.isAdmin) {
                    return res.status(403).json({
                        success: false,
                        error: 'Access denied',
                        message: 'You can only access your own trades',
                        timestamp: new Date().toISOString()
                    });
                }
            }

            res.json({
                success: true,
                trade: trade.toClientObject(),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Get trade by ID error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve trade',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Update trade
router.put('/trades/:tradeId', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const tradeId = req.params.tradeId;

            const trade = await Trade.findById(tradeId);

            if (!trade) {
                return res.status(404).json({
                    success: false,
                    error: 'Trade not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if user owns this trade
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser || (currentUser._id.toString() !== trade.user_id.toString() && !currentUser.isAdmin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'You can only update your own trades',
                    timestamp: new Date().toISOString()
                });
            }

            // Update allowed fields
            const allowedFields = ['current_price', 'user_notes', 'tags', 'status'];
            const updateData = {};

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            });

            // Special handling for price updates
            if (req.body.current_price) {
                await trade.updatePrice(req.body.current_price);
            } else {
                Object.assign(trade, updateData);
                await trade.save();
            }

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
                error: 'Failed to update trade',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Execute trade (mark as completed)
router.post('/trades/:tradeId/execute', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const tradeId = req.params.tradeId;

            const trade = await Trade.findById(tradeId);

            if (!trade) {
                return res.status(404).json({
                    success: false,
                    error: 'Trade not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if user owns this trade
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser || (currentUser._id.toString() !== trade.user_id.toString() && !currentUser.isAdmin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'You can only execute your own trades',
                    timestamp: new Date().toISOString()
                });
            }

            if (trade.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    error: 'Trade not active',
                    message: 'Only active trades can be executed',
                    timestamp: new Date().toISOString()
                });
            }

            const executionData = {
                price: req.body.price || trade.current_price,
                quantity: req.body.quantity || trade.quantity,
                orderId: req.body.order_id,
                type: req.body.type || 'market'
            };

            const success = await trade.executeTradeCompleted(executionData);

            if (success) {
                // Update user activity
                await currentUser.recordTrade({ 
                    profit: trade.performance.pnl
                });

                res.json({
                    success: true,
                    message: 'Trade executed successfully',
                    trade: trade.toClientObject(),
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Trade execution failed',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('❌ Execute trade error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to execute trade',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Cancel trade
router.post('/trades/:tradeId/cancel', 
    AuthMiddleware.requireAuth,
    async (req, res) => {
        try {
            const tradeId = req.params.tradeId;

            const trade = await Trade.findById(tradeId);

            if (!trade) {
                return res.status(404).json({
                    success: false,
                    error: 'Trade not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if user owns this trade
            const currentUser = await User.findBySessionToken(req.authToken);
            if (!currentUser || (currentUser._id.toString() !== trade.user_id.toString() && !currentUser.isAdmin)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'You can only cancel your own trades',
                    timestamp: new Date().toISOString()
                });
            }

            if (trade.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    error: 'Trade not active',
                    message: 'Only active trades can be cancelled',
                    timestamp: new Date().toISOString()
                });
            }

            const reason = req.body.reason || 'User cancelled';
            const success = await trade.cancelTrade(reason);

            if (success) {
                res.json({
                    success: true,
                    message: 'Trade cancelled successfully',
                    trade: trade.toClientObject(),
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Trade cancellation failed',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('❌ Cancel trade error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel trade',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Maintenance Routes (Admin only)
 */

// Cleanup expired trades and sessions
router.post('/maintenance/cleanup', 
    AuthMiddleware.requireAdminAuth,
    async (req, res) => {
        try {
            const results = {
                expired_trades: await Trade.cleanupExpiredTrades(),
                expired_sessions: await User.cleanupAllExpiredSessions(),
                database_indexes: false
            };

            // Recreate database indexes if requested
            if (req.body.recreate_indexes) {
                results.database_indexes = await dbConfig.createIndexes();
            }

            res.json({
                success: true,
                message: 'Maintenance cleanup completed',
                results: results,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Maintenance cleanup error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Maintenance cleanup failed',
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
        message: 'Data route error',
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
            'GET /api/data/health/db',
            'GET /api/data/stats/db',
            'GET /api/data/users',
            'GET /api/data/trades',
            'POST /api/data/trades',
            'GET /api/data/trades/active',
            'GET /api/data/trades/history',
            'GET /api/data/trades/performance',
            'PUT /api/data/trades/:id',
            'POST /api/data/trades/:id/execute',
            'POST /api/data/trades/:id/cancel'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;