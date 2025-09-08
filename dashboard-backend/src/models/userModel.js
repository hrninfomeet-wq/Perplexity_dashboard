// dashboard-backend/src/models/userModel.js

/**
 * User Data Model
 * Handles user authentication, preferences, and session management
 * 
 * @version 2.2.0
 * @created September 02, 2025
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User schema definition
const userSchema = new mongoose.Schema({
    // Basic user information
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [50, 'Username cannot exceed 50 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    
    // Authentication data
    password_hash: {
        type: String,
        select: false // Don't include in queries by default
    },
    
    // Flattrade integration
    flattrade: {
        user_id: {
            type: String,
            sparse: true
        },
        api_key: {
            type: String,
            select: false
        },
        client_code: {
            type: String,
            select: false
        },
        is_authenticated: {
            type: Boolean,
            default: false
        },
        last_token_refresh: {
            type: Date
        },
        token_expires_at: {
            type: Date
        }
    },
    
    // Multi-API Provider Configurations (Phase 2.5)
    api_providers: {
        upstox: {
            client_id: { type: String, select: false },
            client_secret: { type: String, select: false },
            redirect_uri: { type: String, select: false },
            access_token: { type: String, select: false },
            refresh_token: { type: String, select: false },
            is_authenticated: { type: Boolean, default: false },
            last_token_refresh: { type: Date },
            token_expires_at: { type: Date },
            enabled: { type: Boolean, default: false }
        },
        
        fyers: {
            app_id: { type: String, select: false },
            app_secret: { type: String, select: false },
            access_token: { type: String, select: false },
            refresh_token: { type: String, select: false },
            is_authenticated: { type: Boolean, default: false },
            last_token_refresh: { type: Date },
            token_expires_at: { type: Date },
            enabled: { type: Boolean, default: false }
        },
        
        aliceblue: {
            user_id: { type: String, select: false },
            api_key: { type: String, select: false },
            access_token: { type: String, select: false },
            session_id: { type: String, select: false },
            is_authenticated: { type: Boolean, default: false },
            last_token_refresh: { type: Date },
            token_expires_at: { type: Date },
            enabled: { type: Boolean, default: false }
        },
        
        // Provider priority and preferences
        priority_order: [{
            type: String,
            enum: ['flattrade', 'upstox', 'fyers', 'aliceblue', 'nse-public']
        }],
        
        failover_enabled: {
            type: Boolean,
            default: true
        },
        
        load_balancing: {
            type: String,
            enum: ['round_robin', 'priority_based', 'performance_based'],
            default: 'priority_based'
        }
    },

    // User preferences
    preferences: {
        dashboard: {
            refresh_rate: {
                type: Number,
                default: 5000, // 5 seconds
                min: [1000, 'Refresh rate cannot be less than 1 second'],
                max: [60000, 'Refresh rate cannot exceed 60 seconds']
            },
            default_view: {
                type: String,
                enum: ['full', 'compact', 'minimal'],
                default: 'full'
            },
            show_alerts: {
                type: Boolean,
                default: true
            },
            show_btst: {
                type: Boolean,
                default: true
            },
            show_scalping: {
                type: Boolean,
                default: true
            },
            show_fno: {
                type: Boolean,
                default: true
            },
            preferred_api_provider: {
                type: String,
                enum: ['auto', 'flattrade', 'upstox', 'fyers', 'aliceblue'],
                default: 'auto'
            },
            show_api_health: {
                type: Boolean,
                default: true
            }
        },
        
        trading: {
            risk_tolerance: {
                type: String,
                enum: ['conservative', 'moderate', 'aggressive'],
                default: 'moderate'
            },
            default_capital: {
                type: Number,
                default: 10000,
                min: [1000, 'Default capital must be at least ₹1,000']
            },
            auto_signals: {
                type: Boolean,
                default: true
            },
            signal_types: [{
                type: String,
                enum: ['btst', 'scalping', 'swing', 'positional']
            }],
            preferred_segments: [{
                type: String,
                enum: ['equity', 'fno', 'commodity', 'currency']
            }]
        },
        
        notifications: {
            email_alerts: {
                type: Boolean,
                default: false
            },
            browser_notifications: {
                type: Boolean,
                default: true
            },
            sound_alerts: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Session management
    sessions: [{
        session_id: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        },
        device_info: {
            user_agent: String,
            ip_address: String,
            device_type: {
                type: String,
                enum: ['desktop', 'mobile', 'tablet'],
                default: 'desktop'
            }
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        last_activity: {
            type: Date,
            default: Date.now
        },
        expires_at: {
            type: Date,
            required: true
        },
        is_active: {
            type: Boolean,
            default: true
        }
    }],
    
    // Activity tracking
    activity: {
        total_trades: {
            type: Number,
            default: 0
        },
        successful_trades: {
            type: Number,
            default: 0
        },
        total_pnl: {
            type: Number,
            default: 0
        },
        last_login: {
            type: Date
        },
        login_count: {
            type: Number,
            default: 0
        },
        favorite_stocks: [{
            symbol: String,
            added_at: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // Account status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },
    
    // Subscription information
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'pro'],
            default: 'free'
        },
        expires_at: {
            type: Date
        },
        features: [{
            type: String
        }]
    },
    
    // Metadata
    created_at: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    
    updated_at: {
        type: Date,
        default: Date.now
    },
    
    last_active_at: {
        type: Date,
        default: Date.now
    }
}, {
    // Schema options
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    
    // Add version key for concurrent update handling
    versionKey: '__v',
    
    // Optimize for queries
    collection: 'users'
});

// Indexes for performance (excluding duplicates of unique fields)
userSchema.index({ 'flattrade.user_id': 1 }, { sparse: true });
userSchema.index({ 'flattrade.client_code': 1 }, { sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ last_active_at: -1 });
userSchema.index({ 'sessions.session_id': 1 });
userSchema.index({ 'sessions.expires_at': 1 });

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
    try {
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified('password_hash')) {
            return next();
        }

        // Hash password with bcrypt
        const saltRounds = 12;
        this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware for updating timestamps
userSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Instance methods
userSchema.methods = {
    /**
     * Compare provided password with stored hash
     */
    async comparePassword(candidatePassword) {
        try {
            if (!this.password_hash) {
                return false;
            }
            return await bcrypt.compare(candidatePassword, this.password_hash);
        } catch (error) {
            console.error('Password comparison error:', error);
            return false;
        }
    },

    /**
     * Create new session for user
     */
    async createSession(token, deviceInfo = {}, expiresIn = 86400000) { // 24 hours default
        try {
            const sessionId = require('crypto').randomUUID();
            const expiresAt = new Date(Date.now() + expiresIn);

            const newSession = {
                session_id: sessionId,
                token: token,
                device_info: {
                    user_agent: deviceInfo.userAgent || 'Unknown',
                    ip_address: deviceInfo.ipAddress || '127.0.0.1',
                    device_type: this.detectDeviceType(deviceInfo.userAgent)
                },
                created_at: new Date(),
                last_activity: new Date(),
                expires_at: expiresAt,
                is_active: true
            };

            this.sessions.push(newSession);
            this.last_active_at = new Date();

            await this.save();
            return sessionId;
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    },

    /**
     * Update session activity
     */
    async updateSessionActivity(sessionId) {
        try {
            const session = this.sessions.find(s => s.session_id === sessionId);
            if (session) {
                session.last_activity = new Date();
                this.last_active_at = new Date();
                await this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Session update error:', error);
            return false;
        }
    },

    /**
     * Remove session (logout)
     */
    async removeSession(sessionId) {
        try {
            this.sessions = this.sessions.filter(s => s.session_id !== sessionId);
            await this.save();
            return true;
        } catch (error) {
            console.error('Session removal error:', error);
            return false;
        }
    },

    /**
     * Update Flattrade authentication info
     */
    async updateFlattradeAuth(authData) {
        try {
            this.flattrade = {
                ...this.flattrade,
                ...authData,
                is_authenticated: true,
                last_token_refresh: new Date()
            };
            
            await this.save();
            return true;
        } catch (error) {
            console.error('Flattrade auth update error:', error);
            return false;
        }
    },

    /**
     * Update user preferences
     */
    async updatePreferences(newPreferences) {
        try {
            this.preferences = {
                ...this.preferences,
                ...newPreferences
            };
            
            await this.save();
            return true;
        } catch (error) {
            console.error('Preferences update error:', error);
            return false;
        }
    },

    /**
     * Detect device type from user agent
     */
    detectDeviceType(userAgent) {
        if (!userAgent) return 'desktop';
        
        const ua = userAgent.toLowerCase();
        
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    },

    /**
     * Get safe user data for client (excludes sensitive fields)
     */
    toSafeObject() {
        const userObj = this.toObject();
        
        // Remove sensitive fields
        delete userObj.password_hash;
        delete userObj.flattrade.api_key;
        delete userObj.sessions;
        
        return userObj;
    },

    /**
     * Get user dashboard configuration
     */
    getDashboardConfig() {
        return {
            refreshRate: this.preferences.dashboard.refresh_rate,
            defaultView: this.preferences.dashboard.default_view,
            enabledSections: {
                alerts: this.preferences.dashboard.show_alerts,
                btst: this.preferences.dashboard.show_btst,
                scalping: this.preferences.dashboard.show_scalping,
                fno: this.preferences.dashboard.show_fno
            },
            tradingPreferences: this.preferences.trading,
            notifications: this.preferences.notifications,
            apiProviders: {
                preferredProvider: this.preferences.dashboard.preferred_api_provider,
                showHealthStatus: this.preferences.dashboard.show_api_health,
                priorityOrder: this.api_providers.priority_order,
                failoverEnabled: this.api_providers.failover_enabled,
                loadBalancing: this.api_providers.load_balancing
            }
        };
    },

    /**
     * Get authenticated API providers for user
     */
    getAuthenticatedProviders() {
        const providers = [];
        
        // Check Flattrade
        if (this.flattrade.is_authenticated) {
            providers.push('flattrade');
        }
        
        // Check Upstox
        if (this.api_providers.upstox.is_authenticated && this.api_providers.upstox.enabled) {
            providers.push('upstox');
        }
        
        // Check FYERS
        if (this.api_providers.fyers.is_authenticated && this.api_providers.fyers.enabled) {
            providers.push('fyers');
        }
        
        // Check AliceBlue
        if (this.api_providers.aliceblue.is_authenticated && this.api_providers.aliceblue.enabled) {
            providers.push('aliceblue');
        }
        
        // NSE Public is always available
        providers.push('nse-public');
        
        return providers;
    },

    /**
     * Set API provider authentication
     */
    async setProviderAuth(provider, authData) {
        const providerPath = provider === 'flattrade' ? 'flattrade' : `api_providers.${provider}`;
        
        const updateData = {
            [`${providerPath}.is_authenticated`]: true,
            [`${providerPath}.last_token_refresh`]: new Date()
        };
        
        if (authData.access_token) {
            updateData[`${providerPath}.access_token`] = authData.access_token;
        }
        
        if (authData.refresh_token) {
            updateData[`${providerPath}.refresh_token`] = authData.refresh_token;
        }
        
        if (authData.expires_at) {
            updateData[`${providerPath}.token_expires_at`] = authData.expires_at;
        }
        
        if (authData.session_id) {
            updateData[`${providerPath}.session_id`] = authData.session_id;
        }
        
        Object.assign(this, updateData);
        return this.save();
    },

    /**
     * Enable/disable API provider
     */
    async toggleProvider(provider, enabled) {
        if (provider === 'flattrade') {
            // Flattrade cannot be disabled as it's the primary
            return this;
        }
        
        this.api_providers[provider].enabled = enabled;
        return this.save();
    },

    /**
     * Update provider priority order
     */
    async updateProviderPriority(priorityOrder) {
        this.api_providers.priority_order = priorityOrder;
        return this.save();
    }
};

// Static methods
userSchema.statics = {
    /**
     * Find user by session token
     */
    async findBySessionToken(token) {
        try {
            const user = await this.findOne({
                'sessions.token': token,
                'sessions.expires_at': { $gt: new Date() },
                'sessions.is_active': true,
                status: 'active'
            }).select('+password_hash');
            
            return user;
        } catch (error) {
            console.error('Find by session token error:', error);
            return null;
        }
    },

    /**
     * Find user by Flattrade ID
     */
    async findByFlattradeId(flattradeUserId) {
        try {
            return await this.findOne({
                'flattrade.user_id': flattradeUserId,
                status: 'active'
            });
        } catch (error) {
            console.error('Find by Flattrade ID error:', error);
            return null;
        }
    },

    /**
     * Get active users count
     */
    async getActiveUsersCount() {
        try {
            return await this.countDocuments({
                status: 'active',
                last_active_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            });
        } catch (error) {
            console.error('Get active users count error:', error);
            return 0;
        }
    }
};

// Virtual fields
userSchema.virtual('isAuthenticated').get(function() {
    return this.flattrade.is_authenticated && this.status === 'active';
});

userSchema.virtual('activeSessions').get(function() {
    const now = new Date();
    return this.sessions.filter(session => 
        session.expires_at > now && session.is_active
    );
});

userSchema.virtual('successRate').get(function() {
    if (this.activity.total_trades === 0) return 0;
    return (this.activity.successful_trades / this.activity.total_trades * 100).toFixed(2);
});

// Export the model
const User = mongoose.model('User', userSchema);

module.exports = User;
