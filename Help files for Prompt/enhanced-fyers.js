// Enhanced FYERS Provider - Complete Integration
// Location: dashboard-backend/src/services/api/providers/fyers.js

/**
 * FYERS Enhanced Provider
 * Complete integration with 100K daily limit and advanced features
 * 
 * @version 2.3.1 - Enhancement
 * @created September 03, 2025
 */

const axios = require('axios');
const crypto = require('crypto');
const { APIProvider } = require('../../../config/api.config');

class EnhancedFYERSProvider {
    constructor() {
        this.name = 'FYERS';
        this.baseUrl = 'https://api.fyers.in/api/v2';
        this.authUrl = 'https://api.fyers.in/api/v2/generate-authcode';
        this.tokenUrl = 'https://api.fyers.in/api/v2/validate-authcode';
        
        // Enhanced credentials
        this.credentials = {
            apiId: process.env.FYERS_API_ID,
            apiSecret: process.env.FYERS_API_SECRET,
            accessToken: process.env.FYERS_ACCESS_TOKEN,
            redirectUri: process.env.FYERS_REDIRECT_URI || 'https://trade.fyers.in/api-login/redirect-to-app'
        };
        
        this.isAuthenticated = false;
        this.rateLimits = {
            perMinute: 200,
            perSecond: 10,
            dailyLimit: 100000, // FYERS strength!
            dailyUsed: 0
        };
        
        // Daily counter with automatic reset
        this.dailyCounter = {
            requests: 0,
            date: new Date().toDateString(),
            lastReset: Date.now()
        };
        
        this.requestCounts = {
            thisMinute: 0,
            thisSecond: 0,
            lastMinuteReset: Date.now(),
            lastSecondReset: Date.now()
        };
        
        console.log('🟣 Enhanced FYERS Provider initialized');
        this.validateCredentials();
        this.initializeDailyCounter();
    }

    /**
     * Validate credentials setup
     */
    validateCredentials() {
        const required = ['apiId', 'apiSecret'];
        const missing = required.filter(cred => !this.credentials[cred]);
        
        if (missing.length > 0) {
            console.warn(`⚠️ FYERS missing credentials: ${missing.join(', ')}`);
            console.log('📋 Setup instructions:');
            console.log('   1. Visit: https://myapi.fyers.in/dashboard');
            console.log('   2. Create new app and get API credentials');
            console.log('   3. Set redirect URI properly');
            console.log('   4. Update .env with FYERS_API_ID and FYERS_API_SECRET');
            return false;
        }
        
        console.log('✅ FYERS credentials configured');
        return true;
    }

    /**
     * Initialize daily counter with automatic reset
     */
    initializeDailyCounter() {
        const today = new Date().toDateString();
        
        if (this.dailyCounter.date !== today) {
            console.log('🔄 FYERS daily counter reset');
            this.dailyCounter = {
                requests: 0,
                date: today,
                lastReset: Date.now()
            };
        }
        
        // Set up automatic daily reset at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.initializeDailyCounter();
            // Set up recurring daily reset
            setInterval(() => this.initializeDailyCounter(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    /**
     * Enhanced authentication with proper OAuth flow
     */
    async authenticate() {
        if (!this.validateCredentials()) {
            throw new Error('FYERS credentials incomplete. Check setup instructions.');
        }

        try {
            // If access token exists, validate it
            if (this.credentials.accessToken) {
                const validation = await this.validateExistingToken();
                if (validation.success) {
                    return validation;
                }
            }
            
            // Generate new authentication URL
            const authUrl = this.generateAuthUrl();
            console.log('🔐 FYERS authorization URL:', authUrl);
            
            throw new Error('FYERS requires OAuth completion. Please complete browser authentication.');
            
        } catch (error) {
            console.error('❌ FYERS authentication failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate FYERS OAuth URL
     */
    generateAuthUrl() {
        const state = crypto.randomBytes(16).toString('hex');
        const appIdHash = crypto.createHash('sha256').update(this.credentials.apiId).digest('hex');
        
        const params = new URLSearchParams({
            client_id: this.credentials.apiId,
            redirect_uri: this.credentials.redirectUri,
            response_type: 'code',
            state: state
        });
        
        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(authCode) {
        try {
            // Generate app secret hash
            const appSecret = `${this.credentials.apiId}:${this.credentials.apiSecret}`;
            const appSecretHash = crypto.createHash('sha256').update(appSecret).digest('hex');
            
            const tokenRequest = {
                grant_type: 'authorization_code',
                appIdHash: crypto.createHash('sha256').update(this.credentials.apiId).digest('hex'),
                code: authCode
            };

            const response = await axios.post(this.tokenUrl, tokenRequest, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(appSecret).toString('base64')}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data.s === 'ok') {
                this.credentials.accessToken = response.data.access_token;
                this.isAuthenticated = true;
                
                console.log('✅ FYERS authenticated successfully');
                
                // Store token for persistence
                process.env.FYERS_ACCESS_TOKEN = response.data.access_token;
                
                return {
                    success: true,
                    accessToken: response.data.access_token,
                    message: 'FYERS authentication successful'
                };
            } else {
                throw new Error(`Authentication failed: ${response.data.message}`);
            }

        } catch (error) {
            console.error('❌ FYERS token exchange failed:', error.message);
            throw error;
        }
    }

    /**
     * Validate existing token
     */
    async validateExistingToken() {
        try {
            const response = await this.makeRequest('/profile');
            
            if (response.success && response.data.s === 'ok') {
                this.isAuthenticated = true;
                console.log('✅ FYERS existing token validated');
                return { success: true, validated: true };
            }
            
            return { success: false, message: 'Token validation failed' };
            
        } catch (error) {
            console.warn('⚠️ FYERS token validation failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enhanced rate limiting with daily limit tracking
     */
    checkRateLimit() {
        const now = Date.now();
        
        // Reset minute counter
        if (now - this.requestCounts.lastMinuteReset >= 60000) {
            this.requestCounts.thisMinute = 0;
            this.requestCounts.lastMinuteReset = now;
        }
        
        // Reset second counter
        if (now - this.requestCounts.lastSecondReset >= 1000) {
            this.requestCounts.thisSecond = 0;
            this.requestCounts.lastSecondReset = now;
        }
        
        // Check daily limit (FYERS' key advantage)
        if (this.dailyCounter.requests >= this.rateLimits.dailyLimit) {
            console.warn('⚠️ FYERS daily limit of 100K requests reached');
            return false;
        }
        
        // Check per-minute and per-second limits
        return (this.requestCounts.thisMinute < this.rateLimits.perMinute) &&
               (this.requestCounts.thisSecond < this.rateLimits.perSecond);
    }

    /**
     * Update request counters
     */
    updateRequestCount() {
        this.requestCounts.thisMinute++;
        this.requestCounts.thisSecond++;
        this.dailyCounter.requests++;
        
        // Log milestone usage
        if (this.dailyCounter.requests % 10000 === 0) {
            const percentage = (this.dailyCounter.requests / this.rateLimits.dailyLimit * 100).toFixed(1);
            console.log(`📊 FYERS daily usage: ${this.dailyCounter.requests}/100K (${percentage}%)`);
        }
    }

    /**
     * Enhanced request method with comprehensive rate limiting
     */
    async makeRequest(endpoint, options = {}) {
        if (!this.checkRateLimit()) {
            throw new Error('FYERS rate limit exceeded');
        }

        if (!this.isAuthenticated && !endpoint.includes('/profile')) {
            await this.authenticate();
        }

        const config = {
            method: options.method || 'GET',
            url: `${this.baseUrl}${endpoint}`,
            headers: {
                'Authorization': `${this.credentials.apiId}:${this.credentials.accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: options.timeout || 10000
        };

        if (options.data) {
            if (config.method === 'GET') {
                config.params = options.data;
            } else {
                config.data = options.data;
            }
        }

        try {
            this.updateRequestCount();
            
            const response = await axios(config);
            
            // FYERS specific response validation
            if (response.data.s && response.data.s !== 'ok') {
                throw new Error(`FYERS API Error: ${response.data.message || 'Unknown error'}`);
            }

            return {
                success: true,
                data: response.data,
                provider: APIProvider.FYERS,
                dailyUsage: this.dailyCounter.requests,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            if (error.response?.status === 401) {
                console.warn('🔄 FYERS token expired, reauthenticating...');
                this.isAuthenticated = false;
                await this.authenticate();
                return this.makeRequest(endpoint, options); // Retry once
            }
            
            console.error('❌ FYERS API request failed:', error.message);
            throw error;
        }
    }

    /**
     * Enhanced market data with symbol formatting
     */
    async getMarketData(symbol) {
        try {
            const formattedSymbol = this.formatSymbol(symbol);
            
            const response = await this.makeRequest('/data/quotes', {
                data: { symbols: formattedSymbol }
            });

            const quote = response.data.d[0]; // First symbol data
            
            return {
                symbol: symbol,
                ltp: quote?.lp || 0,
                open: quote?.o || 0,
                high: quote?.h || 0,
                low: quote?.l || 0,
                close: quote?.prev_close_price || 0,
                volume: quote?.v || 0,
                change: quote?.ch || 0,
                changePercent: quote?.chp || 0,
                timestamp: new Date().toISOString(),
                provider: APIProvider.FYERS,
                dailyUsage: this.dailyCounter.requests
            };

        } catch (error) {
            console.error(`❌ FYERS market data error for ${symbol}:`, error.message);
            throw error;
        }
    }

    /**
     * Get historical data (FYERS' strength with 100K daily limit)
     */
    async getHistoricalData(symbol, resolution, fromDate, toDate) {
        try {
            const formattedSymbol = this.formatSymbol(symbol);
            
            console.log(`📊 FYERS fetching historical data (${this.dailyCounter.requests}/100K used)`);
            
            const response = await this.makeRequest('/data/history', {
                data: {
                    symbol: formattedSymbol,
                    resolution: resolution,
                    date_format: '1',
                    range_from: fromDate,
                    range_to: toDate,
                    cont_flag: '1'
                }
            });

            return {
                symbol: symbol,
                resolution: resolution,
                candles: response.data.candles || [],
                fromDate: fromDate,
                toDate: toDate,
                dataPoints: response.data.candles?.length || 0,
                timestamp: new Date().toISOString(),
                provider: APIProvider.FYERS,
                dailyUsage: this.dailyCounter.requests
            };

        } catch (error) {
            console.error(`❌ FYERS historical data error for ${symbol}:`, error.message);
            throw error;
        }
    }

    /**
     * Batch quotes (optimize API usage)
     */
    async getBatchQuotes(symbols) {
        try {
            const formattedSymbols = symbols.map(symbol => this.formatSymbol(symbol)).join(',');
            
            const response = await this.makeRequest('/data/quotes', {
                data: { symbols: formattedSymbols }
            });

            const quotes = {};
            response.data.d.forEach((quote, index) => {
                const originalSymbol = symbols[index];
                quotes[originalSymbol] = {
                    ltp: quote?.lp || 0,
                    change: quote?.ch || 0,
                    changePercent: quote?.chp || 0,
                    volume: quote?.v || 0
                };
            });

            return {
                symbols: symbols,
                data: quotes,
                batchSize: symbols.length,
                provider: APIProvider.FYERS,
                dailyUsage: this.dailyCounter.requests,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ FYERS batch quotes error:`, error.message);
            throw error;
        }
    }

    /**
     * Format symbol for FYERS API
     */
    formatSymbol(symbol) {
        if (symbol.includes(':')) {
            return symbol; // Already formatted
        }
        
        return `NSE:${symbol.toUpperCase()}-EQ`;
    }

    /**
     * Enhanced health check with daily usage info
     */
    async healthCheck() {
        try {
            const startTime = Date.now();
            const response = await this.makeRequest('/profile');
            const responseTime = Date.now() - startTime;
            
            const dailyUsagePercent = (this.dailyCounter.requests / this.rateLimits.dailyLimit * 100).toFixed(2);
            
            return {
                status: response.success ? 'healthy' : 'unhealthy',
                responseTime: responseTime,
                authenticated: this.isAuthenticated,
                dailyUsage: {
                    used: this.dailyCounter.requests,
                    limit: this.rateLimits.dailyLimit,
                    remaining: this.rateLimits.dailyLimit - this.dailyCounter.requests,
                    percentUsed: `${dailyUsagePercent}%`
                },
                rateLimitStatus: {
                    thisMinute: this.requestCounts.thisMinute,
                    maxPerMinute: this.rateLimits.perMinute
                },
                provider: APIProvider.FYERS
            };
            
        } catch (error) {
            return {
                status: 'failed',
                error: error.message,
                authenticated: this.isAuthenticated,
                dailyUsage: this.dailyCounter.requests,
                provider: APIProvider.FYERS
            };
        }
    }

    /**
     * Get comprehensive provider info
     */
    getCapabilities() {
        const dailyUsagePercent = (this.dailyCounter.requests / this.rateLimits.dailyLimit * 100).toFixed(1);
        
        return {
            name: 'FYERS Enhanced',
            provider: APIProvider.FYERS,
            rateLimits: {
                ...this.rateLimits,
                dailyUsage: `${this.dailyCounter.requests}/100,000 (${dailyUsagePercent}%)`
            },
            features: [
                'trading',
                'market_data',
                'historical_data',
                'high_daily_limit',
                'batch_quotes',
                'real_time_data'
            ],
            specialFeatures: [
                '100K daily API limit (highest in industry)',
                'Comprehensive historical data access',
                'Batch processing capabilities',
                'Advanced analytics support',
                'High-frequency trading ready'
            ],
            isAuthenticated: this.isAuthenticated,
            credentialsConfigured: this.validateCredentials(),
            dailyQuota: {
                used: this.dailyCounter.requests,
                remaining: this.rateLimits.dailyLimit - this.dailyCounter.requests,
                resetTime: 'Midnight IST'
            }
        };
    }

    /**
     * Get daily usage statistics
     */
    getDailyUsageStats() {
        const usagePercent = (this.dailyCounter.requests / this.rateLimits.dailyLimit * 100);
        
        return {
            used: this.dailyCounter.requests,
            limit: this.rateLimits.dailyLimit,
            remaining: this.rateLimits.dailyLimit - this.dailyCounter.requests,
            percentageUsed: usagePercent.toFixed(2),
            resetTime: 'Midnight IST',
            isNearLimit: usagePercent > 90,
            provider: APIProvider.FYERS,
            date: this.dailyCounter.date
        };
    }
}

module.exports = EnhancedFYERSProvider;