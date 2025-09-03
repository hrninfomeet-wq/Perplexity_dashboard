// dashboard-backend/src/services/api/providers/aliceblue.js

/**
 * AliceBlue API Provider
 * OAuth 2.0 based authentication with authCode and apiSecret (120 req/min)
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @updated September 03, 2025 - New OAuth 2.0 flow
 * @phase Phase 2.5 - Multi-API Integration
 */

const BaseProvider = require('./base-provider');
const axios = require('axios');
const crypto = require('crypto');

class AliceBlueProvider extends BaseProvider {
    constructor() {
        super('aliceblue');
        
        this.userId = this.config.authentication.user_id;
        this.appCode = this.config.authentication.app_code;
        this.apiSecret = this.config.authentication.api_secret;
        this.userSession = this.config.authentication.access_token;
        this.isAuthenticated = !!this.userSession;
        
        console.log(`🟢 AliceBlue provider initialized (${this.isAuthenticated ? 'authenticated' : 'requires auth'})`);
    }

    /**
     * Initialize AliceBlue provider
     */
    async initialize() {
        try {
            if (this.userSession) {
                await this.validateToken();
                console.log('🟢 AliceBlue API: Connected (120 req/min)');
            } else {
                console.log('🔐 AliceBlue authentication required');
            }
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ AliceBlue initialization failed:', error.message);
            this.isAuthenticated = false;
            return false;
        }
    }

    /**
     * Generate AliceBlue login URL
     */
    getLoginUrl() {
        return `${this.config.endpoints.auth_url}${this.appCode}`;
    }

    /**
     * Exchange auth code for user session
     */
    async exchangeCodeForToken(authCode) {
        try {
            // Create checksum: SHA-256 hash of userId + authCode + apiSecret
            const checkSum = crypto
                .createHash('sha256')
                .update(`${this.userId}${authCode}${this.apiSecret}`)
                .digest('hex');

            const response = await axios.post(this.config.endpoints.token_url, {
                checkSum: checkSum
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.data.stat === 'Ok') {
                this.userSession = response.data.userSession;
                this.isAuthenticated = true;
                
                return {
                    success: true,
                    userSession: this.userSession,
                    clientId: response.data.clientId,
                    userId: response.data.userId
                };
            } else {
                throw new Error(response.data.emsg || 'Authentication failed');
            }

        } catch (error) {
            console.error('AliceBlue token exchange error:', error);
            throw error;
        }
    }

    /**
     * Health check for AliceBlue
     */
    async healthCheck() {
        try {
            if (!this.isAuthenticated) {
                return {
                    status: 'unhealthy',
                    error: 'Not authenticated'
                };
            }

            // Simple health check - try to get profile
            const response = await axios.get(`${this.config.endpoints.base_url}/open-api/od-rest/v1/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            return {
                status: 'healthy',
                latency: Date.now() - startTime,
                provider: this.name
            };

        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                provider: this.name
            };
        }
    }

    /**
     * Validate current session token
     */
    async validateToken() {
        const startTime = Date.now();
        
        try {
            const response = await axios.get(`${this.config.endpoints.base_url}/open-api/od-rest/v1/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            if (response.status === 200) {
                this.isAuthenticated = true;
                return true;
            }

        } catch (error) {
            console.warn('AliceBlue token validation failed:', error.message);
            this.isAuthenticated = false;
            return false;
        }
    }

    /**
     * Get real-time quote data
     */
    async getQuote(symbol) {
        if (!this.isAuthenticated) {
            throw new Error('AliceBlue: Authentication required');
        }

        await this.rateLimiter.checkLimit();

        try {
            const response = await axios.get(`${this.config.endpoints.base_url}${this.config.endpoints.market_data}`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    symbol: symbol,
                    exchange: 'NSE'
                },
                timeout: this.config.timeout || 10000
            });

            return this.normalizeQuoteData(response.data, symbol);

        } catch (error) {
            throw this.handleError(error, 'getQuote');
        }
    }

    /**
     * Get historical data
     */
    async getHistoricalData(symbol, interval = '1d', period = '1y') {
        if (!this.isAuthenticated) {
            throw new Error('AliceBlue: Authentication required');
        }

        await this.rateLimiter.checkLimit();

        try {
            const response = await axios.get(`${this.config.endpoints.base_url}${this.config.endpoints.historical}`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    symbol: symbol,
                    exchange: 'NSE',
                    interval: interval,
                    period: period
                },
                timeout: this.config.timeout || 15000
            });

            return this.normalizeHistoricalData(response.data, symbol);

        } catch (error) {
            throw this.handleError(error, 'getHistoricalData');
        }
    }

    /**
     * Get option chain data
     */
    async getOptionChain(symbol, expiry) {
        if (!this.isAuthenticated) {
            throw new Error('AliceBlue: Authentication required');
        }

        await this.rateLimiter.checkLimit();

        try {
            const response = await axios.get(`${this.config.endpoints.base_url}${this.config.endpoints.options}`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    symbol: symbol,
                    expiry: expiry
                },
                timeout: this.config.timeout || 15000
            });

            return this.normalizeOptionChainData(response.data, symbol);

        } catch (error) {
            throw this.handleError(error, 'getOptionChain');
        }
    }

    /**
     * Normalize quote data to common format
     */
    normalizeQuoteData(data, symbol) {
        return {
            symbol: symbol,
            price: parseFloat(data.ltp || data.lastPrice || 0),
            change: parseFloat(data.change || 0),
            changePercent: parseFloat(data.changePercent || 0),
            volume: parseInt(data.volume || 0),
            high: parseFloat(data.high || 0),
            low: parseFloat(data.low || 0),
            open: parseFloat(data.open || 0),
            close: parseFloat(data.close || data.previousClose || 0),
            timestamp: new Date().toISOString(),
            provider: this.name
        };
    }

    /**
     * Normalize historical data to common format
     */
    normalizeHistoricalData(data, symbol) {
        const candles = Array.isArray(data) ? data : (data.data || []);
        
        return {
            symbol: symbol,
            data: candles.map(candle => ({
                timestamp: candle.timestamp || candle.time,
                open: parseFloat(candle.open || 0),
                high: parseFloat(candle.high || 0),
                low: parseFloat(candle.low || 0),
                close: parseFloat(candle.close || 0),
                volume: parseInt(candle.volume || 0)
            })),
            provider: this.name
        };
    }

    /**
     * Normalize option chain data to common format
     */
    normalizeOptionChainData(data, symbol) {
        return {
            symbol: symbol,
            underlyingValue: parseFloat(data.underlyingValue || 0),
            options: {
                calls: data.calls || [],
                puts: data.puts || []
            },
            timestamp: new Date().toISOString(),
            provider: this.name
        };
    }

    /**
     * Make authenticated request to AliceBlue API
     */
    async makeRequest(endpoint, params = {}) {
        if (!this.isAuthenticated) {
            throw new Error('AliceBlue: Authentication required');
        }

        await this.rateLimiter.checkLimit();

        try {
            const response = await axios.get(`${this.config.endpoints.base_url}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.userSession}`,
                    'Content-Type': 'application/json'
                },
                params: params,
                timeout: this.config.timeout || 10000
            });

            return response.data;

        } catch (error) {
            throw this.handleError(error, 'makeRequest');
        }
    }

    /**
     * Handle API errors consistently
     */
    handleError(error, method) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.emsg || error.response.data?.message || error.message;
            
            if (status === 401) {
                this.isAuthenticated = false;
                return new Error(`AliceBlue ${method}: Authentication expired - ${message}`);
            }
            
            return new Error(`AliceBlue ${method}: HTTP ${status} - ${message}`);
        }
        
        return new Error(`AliceBlue ${method}: ${error.message}`);
    }
}

module.exports = AliceBlueProvider;
    async healthCheck() {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Not authenticated');
            }
            
            const response = await this.makeRequest('/profile/getProfile');
            
            if (response && response.stat === 'Ok') {
                return { status: 'healthy', profile: response };
            } else {
                throw new Error('Invalid health check response');
            }
            
        } catch (error) {
            throw new Error(`AliceBlue health check failed: ${error.message}`);
        }
    }

    /**
     * Authenticate with AliceBlue
     */
    async authenticate() {
        if (!this.config.authentication.api_key) {
            throw new Error('AliceBlue API key not configured');
        }
        
        if (this.accessToken) {
            await this.validateToken();
            return true;
        }
        
        throw new Error('AliceBlue authentication requires manual token generation');
    }

    /**
     * Validate access token
     */
    async validateToken() {
        try {
            const response = await axios.post(
                `${this.config.endpoints.base_url}/profile/getProfile`,
                {},
                {
                    headers: this.getHeaders(),
                    timeout: 5000
                }
            );
            
            if (response.data && response.data.stat === 'Ok') {
                this.isAuthenticated = true;
                this.sessionToken = response.data.sessionID;
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
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        
        if (this.sessionToken) {
            headers['X-SessionToken'] = this.sessionToken;
        }
        
        return headers;
    }

    /**
     * Get market data from AliceBlue
     */
    async getMarketData(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('/marketData/instruments/subscription', {
            method: 'POST',
            data: {
                instruments: [{
                    exchange: 'NSE',
                    token: formattedSymbol,
                    symbol: symbol
                }],
                t: 't'
            }
        });
        
        return this.formatMarketDataResponse(response, symbol);
    }

    /**
     * Get historical data from AliceBlue
     */
    async getHistoricalData(symbol, resolution = '1D', from_date, to_date) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        // AliceBlue date format: dd-mm-yyyy
        const toDate = to_date ? this.formatDateForAliceBlue(to_date) : this.formatDateForAliceBlue(new Date());
        const fromDate = from_date ? this.formatDateForAliceBlue(from_date) : this.formatDateForAliceBlue(this.getDateDaysAgo(30));
        
        const response = await this.makeRequest('/chart/history', {
            method: 'POST',
            data: {
                exchange: 'NSE',
                token: formattedSymbol,
                resolution: resolution,
                from: fromDate,
                to: toDate
            }
        });
        
        return this.formatHistoricalDataResponse(response);
    }

    /**
     * Get option chain from AliceBlue
     */
    async getOptionChain(symbol, expiry) {
        const formattedSymbol = this.formatSymbol(symbol);
        const expiryDate = expiry || this.getNextExpiry();
        
        const response = await this.makeRequest('/marketData/optionChain', {
            method: 'POST',
            data: {
                exchange: 'NFO',
                symbol: symbol,
                expiry: this.formatDateForAliceBlue(expiryDate),
                strike: '0' // Get all strikes
            }
        });
        
        return this.formatOptionChainResponse(response);
    }

    /**
     * Get market depth (Level 2 data)
     */
    async getMarketDepth(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('/marketData/instruments/subscription', {
            method: 'POST',
            data: {
                instruments: [{
                    exchange: 'NSE',
                    token: formattedSymbol,
                    symbol: symbol
                }],
                t: 'd'
            }
        });
        
        return this.formatMarketDepthResponse(response);
    }

    /**
     * Get instrument list for symbol search
     */
    async searchInstruments(query) {
        const response = await this.makeRequest('/contract_info', {
            params: {
                exch: 'NSE',
                symbol: query
            }
        });
        
        return this.formatInstrumentSearchResponse(response);
    }

    /**
     * Format market data response
     */
    formatMarketDataResponse(response, originalSymbol) {
        if (!response || response.stat !== 'Ok') {
            throw new Error('Invalid market data response');
        }
        
        const data = response.values?.[0];
        if (!data) {
            throw new Error('No market data found');
        }
        
        return {
            symbol: originalSymbol,
            ltp: parseFloat(data.lp),
            change: parseFloat(data.c),
            changePercent: parseFloat(data.pc),
            volume: parseInt(data.v),
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            open: parseFloat(data.o),
            previousClose: parseFloat(data.lc),
            timestamp: new Date(data.ft),
            provider: 'aliceblue'
        };
    }

    /**
     * Format historical data response
     */
    formatHistoricalDataResponse(response) {
        if (!response || response.stat !== 'Ok' || !response.values) {
            throw new Error('Invalid historical data response');
        }
        
        return response.values.map(candle => ({
            timestamp: new Date(candle.time * 1000),
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            volume: parseInt(candle.volume),
            provider: 'aliceblue'
        }));
    }

    /**
     * Format option chain response
     */
    formatOptionChainResponse(response) {
        if (!response || response.stat !== 'Ok') {
            throw new Error('Invalid option chain response');
        }
        
        const strikes = new Map();
        
        response.values?.forEach(option => {
            const strikePrice = parseFloat(option.strprc);
            
            if (!strikes.has(strikePrice)) {
                strikes.set(strikePrice, { strikePrice, call: null, put: null });
            }
            
            const strike = strikes.get(strikePrice);
            
            if (option.optt === 'CE') {
                strike.call = {
                    ltp: parseFloat(option.lp),
                    volume: parseInt(option.v),
                    oi: parseInt(option.oi),
                    bid: parseFloat(option.bp1),
                    ask: parseFloat(option.ap1)
                };
            } else if (option.optt === 'PE') {
                strike.put = {
                    ltp: parseFloat(option.lp),
                    volume: parseInt(option.v),
                    oi: parseInt(option.oi),
                    bid: parseFloat(option.bp1),
                    ask: parseFloat(option.ap1)
                };
            }
        });
        
        return {
            underlying: response.underlying || symbol,
            expiry: response.expiry,
            strikes: Array.from(strikes.values()).sort((a, b) => a.strikePrice - b.strikePrice),
            provider: 'aliceblue'
        };
    }

    /**
     * Format market depth response
     */
    formatMarketDepthResponse(response) {
        if (!response || response.stat !== 'Ok') {
            throw new Error('Invalid market depth response');
        }
        
        const data = response.values?.[0];
        if (!data) {
            throw new Error('No market depth data found');
        }
        
        return {
            symbol: data.token,
            bids: [
                { price: parseFloat(data.bp1), quantity: parseInt(data.bq1) },
                { price: parseFloat(data.bp2), quantity: parseInt(data.bq2) },
                { price: parseFloat(data.bp3), quantity: parseInt(data.bq3) },
                { price: parseFloat(data.bp4), quantity: parseInt(data.bq4) },
                { price: parseFloat(data.bp5), quantity: parseInt(data.bq5) }
            ].filter(bid => bid.price > 0),
            asks: [
                { price: parseFloat(data.ap1), quantity: parseInt(data.aq1) },
                { price: parseFloat(data.ap2), quantity: parseInt(data.aq2) },
                { price: parseFloat(data.ap3), quantity: parseInt(data.aq3) },
                { price: parseFloat(data.ap4), quantity: parseInt(data.aq4) },
                { price: parseFloat(data.ap5), quantity: parseInt(data.aq5) }
            ].filter(ask => ask.price > 0),
            provider: 'aliceblue'
        };
    }

    /**
     * Format instrument search response
     */
    formatInstrumentSearchResponse(response) {
        if (!response || response.stat !== 'Ok') {
            throw new Error('Invalid instrument search response');
        }
        
        return response.values?.map(instrument => ({
            symbol: instrument.symbol,
            token: instrument.token,
            exchange: instrument.exch,
            instrumentType: instrument.instname,
            lotSize: parseInt(instrument.ls)
        })) || [];
    }

    /**
     * Format date for AliceBlue API (dd-mm-yyyy)
     */
    formatDateForAliceBlue(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    /**
     * Get date N days ago
     */
    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
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
        return nextThursday;
    }

    /**
     * Process AliceBlue response
     */
    processResponse(response) {
        const data = response.data;
        
        if (data && data.stat === 'Not_Ok') {
            throw new Error(data.emsg || 'AliceBlue API error');
        }
        
        return data;
    }

    /**
     * Get provider status
     */
    getStatus() {
        return {
            ...super.getStatus(),
            sessionToken: !!this.sessionToken,
            rateLimits: {
                ...this.config.rate_limits,
                effective: {
                    per_minute: Math.floor(this.config.rate_limits.requests_per_minute * 0.8)
                }
            }
        };
    }
}

module.exports = AliceBlueProvider;
