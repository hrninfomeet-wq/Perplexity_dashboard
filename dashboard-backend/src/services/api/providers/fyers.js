// Enhanced FYERS Provider - Complete Integration
// Location: dashboard-backend/src/services/api/providers/fyers.js

/**
 * FYERS Enhanced Provider
 * Complete integration with 100K daily limit and advanced features
 * 
 * @version 2.3.1 - Enhancement
 * @created September 03, 2025
 */

const BaseProvider = require('./base-provider');
const axios = require('axios');
const crypto = require('crypto');

class FYERSProvider extends BaseProvider {
    constructor() {
        super('fyers');
        
        this.accessToken = this.config.authentication.access_token;
        this.isAuthenticated = !!this.accessToken;
        this.dailyRequestCount = 0;
        this.lastResetDate = new Date().toDateString();
        
        console.log(`🔵 FYERS provider initialized (${this.isAuthenticated ? 'authenticated' : 'requires auth'})`);
    }

    /**
     * Initialize FYERS provider
     */
    async initialize() {
        try {
            if (this.accessToken) {
                await this.validateToken();
                console.log('🔵 FYERS API: Connected (200 req/min)');
            } else {
                console.log('🔐 FYERS authentication required');
            }
            
            this.resetDailyCountIfNeeded();
            return true;
            
        } catch (error) {
            console.warn('⚠️ FYERS initialization failed:', error.message);
            this.isAuthenticated = false;
            return false;
        }
    }

    /**
     * Health check for FYERS
     */
    async healthCheck() {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Not authenticated');
            }
            
            const response = await this.makeRequest('/profile');
            
            if (response && response.code === 200) {
                return { status: 'healthy', profile: response.data };
            } else {
                throw new Error('Invalid health check response');
            }
            
        } catch (error) {
            throw new Error(`FYERS health check failed: ${error.message}`);
        }
    }

    /**
     * Authenticate with FYERS
     */
    async authenticate() {
        if (!this.config.authentication.api_id || !this.config.authentication.api_secret) {
            throw new Error('FYERS credentials not configured');
        }
        
        if (this.accessToken) {
            await this.validateToken();
            return true;
        }
        
        // Generate auth URL for manual authentication
        const authUrl = this.generateAuthUrl();
        console.log('🔐 FYERS authentication URL:', authUrl);
        
        throw new Error('FYERS authentication requires manual authorization');
    }

    /**
     * Generate authentication URL
     */
    generateAuthUrl() {
        const state = crypto.randomBytes(16).toString('hex');
        const params = new URLSearchParams({
            client_id: this.config.authentication.api_id,
            redirect_uri: 'http://localhost:5000/api/auth/fyers/callback',
            response_type: 'code',
            state: state
        });
        
        return `${this.config.endpoints.auth_url}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(authCode) {
        try {
            const response = await axios.post(this.config.endpoints.token_url, {
                grant_type: 'authorization_code',
                appIdHash: this.generateAppIdHash(),
                code: authCode
            });
            
            if (response.data && response.data.code === 200 && response.data.access_token) {
                this.accessToken = response.data.access_token;
                this.isAuthenticated = true;
                
                console.log('✅ FYERS authentication successful');
                return this.accessToken;
            } else {
                throw new Error(response.data?.message || 'Invalid token response');
            }
            
        } catch (error) {
            throw new Error(`FYERS token exchange failed: ${error.message}`);
        }
    }

    /**
     * Generate app ID hash for FYERS authentication
     */
    generateAppIdHash() {
        const appId = this.config.authentication.api_id;
        const secretKey = this.config.authentication.api_secret;
        return crypto.createHash('sha256').update(appId + ':' + secretKey).digest('hex');
    }

    /**
     * Validate access token
     */
    async validateToken() {
        try {
            const response = await axios.get(
                `${this.config.endpoints.base_url}/profile`,
                {
                    headers: { 'Authorization': this.accessToken },
                    timeout: 5000
                }
            );
            
            if (response.data && response.data.code === 200) {
                this.isAuthenticated = true;
                return true;
            } else {
                throw new Error('Invalid token validation response');
            }
            
        } catch (error) {
            this.isAuthenticated = false;
            throw error;
        }
    }

    /**
     * Get headers with authentication
     */
    getHeaders(options = {}) {
        const headers = super.getHeaders(options);
        
        if (this.accessToken) {
            headers['Authorization'] = this.accessToken;
        }
        
        return headers;
    }

    /**
     * Make request with daily limit tracking
     */
    async makeRequest(endpoint, options = {}) {
        this.resetDailyCountIfNeeded();
        
        if (this.dailyRequestCount >= this.config.rate_limits.daily_limit) {
            throw new Error('FYERS daily request limit exceeded');
        }
        
        const result = await super.makeRequest(endpoint, options);
        this.dailyRequestCount++;
        
        return result;
    }

    /**
     * Reset daily request count if new day
     */
    resetDailyCountIfNeeded() {
        const today = new Date().toDateString();
        if (this.lastResetDate !== today) {
            this.dailyRequestCount = 0;
            this.lastResetDate = today;
            console.log('🔄 FYERS daily request count reset');
        }
    }

    /**
     * Get market data from FYERS
     */
    async getMarketData(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('/data/quotes', {
            params: {
                symbols: formattedSymbol
            }
        });
        
        return this.formatMarketDataResponse(response, symbol);
    }

    /**
     * Get historical data from FYERS (excellent for historical data)
     */
    async getHistoricalData(symbol, resolution = 'D', from_date, to_date) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        // FYERS date format: YYYY-MM-DD
        const toDate = to_date || new Date().toISOString().split('T')[0];
        const fromDate = from_date || this.getDateDaysAgo(30);
        
        const response = await this.makeRequest('/data/history', {
            params: {
                symbol: formattedSymbol,
                resolution: resolution,
                date_format: '1',
                range_from: fromDate,
                range_to: toDate,
                cont_flag: '1'
            }
        });
        
        return this.formatHistoricalDataResponse(response);
    }

    /**
     * Get option chain from FYERS
     */
    async getOptionChain(symbol, expiry) {
        const formattedSymbol = this.formatSymbol(symbol);
        const expiryDate = expiry || this.getNextExpiry();
        
        const response = await this.makeRequest('/data/optionchain', {
            params: {
                symbol: formattedSymbol,
                expiry: expiryDate
            }
        });
        
        return this.formatOptionChainResponse(response);
    }

    /**
     * Get multiple quotes (efficient for bulk data)
     */
    async getMultipleQuotes(symbols) {
        const formattedSymbols = symbols.map(symbol => this.formatSymbol(symbol)).join(',');
        
        const response = await this.makeRequest('/data/quotes', {
            params: {
                symbols: formattedSymbols
            }
        });
        
        return this.formatMultipleQuotesResponse(response);
    }

    /**
     * Get market depth (Level 2 data)
     */
    async getMarketDepth(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('/data/depth', {
            params: {
                symbol: formattedSymbol,
                ohlcv_flag: '1'
            }
        });
        
        return this.formatMarketDepthResponse(response);
    }

    /**
     * Format market data response
     */
    formatMarketDataResponse(response, originalSymbol) {
        if (!response || response.code !== 200 || !response.d) {
            throw new Error('Invalid market data response');
        }
        
        const data = Object.values(response.d)[0]; // Get first symbol data
        
        return {
            symbol: originalSymbol,
            ltp: parseFloat(data.v.lp),
            change: parseFloat(data.v.ch),
            changePercent: parseFloat(data.v.chp),
            volume: parseInt(data.v.vol),
            high: parseFloat(data.v.h),
            low: parseFloat(data.v.l),
            open: parseFloat(data.v.o),
            previousClose: parseFloat(data.v.prev_close_price),
            timestamp: new Date(data.v.tt * 1000),
            provider: 'fyers'
        };
    }

    /**
     * Format historical data response
     */
    formatHistoricalDataResponse(response) {
        if (!response || response.code !== 200 || !response.candles) {
            throw new Error('Invalid historical data response');
        }
        
        return response.candles.map(candle => ({
            timestamp: new Date(candle[0] * 1000),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseInt(candle[5]),
            provider: 'fyers'
        }));
    }

    /**
     * Format option chain response
     */
    formatOptionChainResponse(response) {
        if (!response || response.code !== 200 || !response.data) {
            throw new Error('Invalid option chain response');
        }
        
        return {
            underlying: response.data.underlying,
            expiry: response.data.expiry,
            strikes: response.data.optionsChain?.map(strike => ({
                strikePrice: parseFloat(strike.strike_price),
                call: strike.call ? {
                    ltp: parseFloat(strike.call.ltp),
                    volume: parseInt(strike.call.volume),
                    oi: parseInt(strike.call.oi),
                    bid: parseFloat(strike.call.bid),
                    ask: parseFloat(strike.call.ask)
                } : null,
                put: strike.put ? {
                    ltp: parseFloat(strike.put.ltp),
                    volume: parseInt(strike.put.volume),
                    oi: parseInt(strike.put.oi),
                    bid: parseFloat(strike.put.bid),
                    ask: parseFloat(strike.put.ask)
                } : null
            })) || [],
            provider: 'fyers'
        };
    }

    /**
     * Format multiple quotes response
     */
    formatMultipleQuotesResponse(response) {
        if (!response || response.code !== 200 || !response.d) {
            throw new Error('Invalid multiple quotes response');
        }
        
        const quotes = {};
        
        for (const [symbol, data] of Object.entries(response.d)) {
            quotes[symbol] = {
                ltp: parseFloat(data.v.lp),
                change: parseFloat(data.v.ch),
                changePercent: parseFloat(data.v.chp),
                volume: parseInt(data.v.vol),
                timestamp: new Date(data.v.tt * 1000),
                provider: 'fyers'
            };
        }
        
        return quotes;
    }

    /**
     * Format market depth response
     */
    formatMarketDepthResponse(response) {
        if (!response || response.code !== 200 || !response.d) {
            throw new Error('Invalid market depth response');
        }
        
        const data = response.d;
        
        return {
            symbol: data.symbol,
            bids: data.bids?.map(bid => ({
                price: parseFloat(bid.price),
                quantity: parseInt(bid.quantity),
                orders: parseInt(bid.orders)
            })) || [],
            asks: data.asks?.map(ask => ({
                price: parseFloat(ask.price),
                quantity: parseInt(ask.quantity),
                orders: parseInt(ask.orders)
            })) || [],
            totalBidQty: parseInt(data.totalbuyqty),
            totalAskQty: parseInt(data.totalsellqty),
            provider: 'fyers'
        };
    }

    /**
     * Get date N days ago
     */
    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }

    /**
     * Get next expiry date
     */
    getNextExpiry() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToThursday = (4 - dayOfWeek + 7) % 7;
        const nextThursday = new Date(today);
        nextThursday.setDate(today.getDate() + daysToThursday);
        return nextThursday.toISOString().split('T')[0];
    }

    /**
     * Process FYERS response
     */
    processResponse(response) {
        const data = response.data;
        
        if (data && data.code !== 200) {
            throw new Error(data.message || `FYERS API error: ${data.code}`);
        }
        
        return data;
    }

    /**
     * Get provider status
     */
    getStatus() {
        return {
            ...super.getStatus(),
            dailyRequestCount: this.dailyRequestCount,
            dailyLimitRemaining: this.config.rate_limits.daily_limit - this.dailyRequestCount,
            lastResetDate: this.lastResetDate,
            rateLimits: {
                ...this.config.rate_limits,
                effective: {
                    per_minute: Math.floor(this.config.rate_limits.requests_per_minute * 0.8),
                    daily_remaining: this.config.rate_limits.daily_limit - this.dailyRequestCount
                }
            }
        };
    }
}

module.exports = FYERSProvider;
