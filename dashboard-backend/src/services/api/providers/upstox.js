// dashboard-backend/src/services/api/providers/upstox.js

/**
 * Upstox API Provider
 * Primary provider with highest rate limits (250 req/min, 25 req/sec)
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const BaseProvider = require('./base-provider');
const axios = require('axios');
const WebSocket = require('ws');

class UpstoxProvider extends BaseProvider {
    constructor() {
        super('upstox');
        
        this.accessToken = this.config.authentication.access_token;
        this.isAuthenticated = !!this.accessToken;
        this.websocketConnection = null;
        this.subscriptions = new Set();
        
        console.log(`🌐 Upstox provider initialized (${this.isAuthenticated ? 'authenticated' : 'requires auth'})`);
    }

    /**
     * Initialize Upstox provider
     */
    async initialize() {
        try {
            if (this.accessToken) {
                await this.validateToken();
                console.log('🌐 Upstox API: Connected (250 req/min)');
            } else {
                console.log('🔐 Upstox authentication required');
            }
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ Upstox initialization failed:', error.message);
            this.isAuthenticated = false;
            return false;
        }
    }

    /**
     * Health check for Upstox
     */
    async healthCheck() {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Not authenticated');
            }
            
            const response = await this.makeRequest('/user/profile');
            
            if (response && response.status === 'success') {
                return { status: 'healthy', user: response.data };
            } else {
                throw new Error('Invalid health check response');
            }
            
        } catch (error) {
            throw new Error(`Upstox health check failed: ${error.message}`);
        }
    }

    /**
     * Authenticate with Upstox
     */
    async authenticate() {
        if (!this.config.authentication.api_key || !this.config.authentication.api_secret) {
            throw new Error('Upstox credentials not configured');
        }
        
        if (this.accessToken) {
            await this.validateToken();
            return true;
        }
        
        // Generate auth URL for manual authentication
        const authUrl = this.generateAuthUrl();
        console.log('🔐 Upstox authentication URL:', authUrl);
        
        throw new Error('Upstox authentication requires manual authorization');
    }

    /**
     * Generate authentication URL
     */
    generateAuthUrl() {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.authentication.api_key,
            redirect_uri: this.config.authentication.redirect_uri,
            state: 'upstox_auth'
        });
        
        return `${this.config.endpoints.auth_url}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(authCode) {
        try {
            const response = await axios.post(this.config.endpoints.token_url, {
                code: authCode,
                client_id: this.config.authentication.api_key,
                client_secret: this.config.authentication.api_secret,
                redirect_uri: this.config.authentication.redirect_uri,
                grant_type: 'authorization_code'
            });
            
            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                this.isAuthenticated = true;
                
                console.log('✅ Upstox authentication successful');
                return this.accessToken;
            } else {
                throw new Error('Invalid token response');
            }
            
        } catch (error) {
            throw new Error(`Token exchange failed: ${error.message}`);
        }
    }

    /**
     * Validate access token
     */
    async validateToken() {
        try {
            const response = await axios.get(
                `${this.config.endpoints.base_url}/user/profile`,
                {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` },
                    timeout: 5000
                }
            );
            
            if (response.data && response.data.status === 'success') {
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
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        
        headers['Accept'] = 'application/json';
        
        return headers;
    }

    /**
     * Get market data from Upstox
     */
    async getMarketData(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('/market-data/ltp', {
            params: {
                instrument_key: formattedSymbol
            }
        });
        
        return this.formatMarketDataResponse(response, symbol);
    }

    /**
     * Get historical data from Upstox
     */
    async getHistoricalData(symbol, interval = '1day', from_date, to_date) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        // Default date range (30 days)
        const toDate = to_date || new Date().toISOString().split('T')[0];
        const fromDate = from_date || this.getDateDaysAgo(30);
        
        const response = await this.makeRequest('/historical-candle/intraday', {
            params: {
                instrument_key: formattedSymbol,
                interval: interval,
                from_date: fromDate,
                to_date: toDate
            }
        });
        
        return this.formatHistoricalDataResponse(response);
    }

    /**
     * Get option chain from Upstox
     */
    async getOptionChain(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('/option-chain', {
            params: {
                instrument_key: formattedSymbol,
                expiry_date: this.getNextExpiry()
            }
        });
        
        return this.formatOptionChainResponse(response);
    }

    /**
     * Get market quotes (multiple symbols)
     */
    async getMarketQuotes(symbols) {
        const formattedSymbols = symbols.map(symbol => this.formatSymbol(symbol));
        
        const response = await this.makeRequest('/market-data/quotes', {
            params: {
                instrument_key: formattedSymbols.join(',')
            }
        });
        
        return this.formatQuotesResponse(response);
    }

    /**
     * Format market data response
     */
    formatMarketDataResponse(response, originalSymbol) {
        if (!response || response.status !== 'success' || !response.data) {
            throw new Error('Invalid market data response');
        }
        
        const data = Object.values(response.data)[0]; // Get first instrument data
        
        return {
            symbol: originalSymbol,
            ltp: parseFloat(data.last_price),
            change: parseFloat(data.change),
            changePercent: parseFloat(data.change_percent),
            volume: parseInt(data.volume),
            high: parseFloat(data.ohlc?.high),
            low: parseFloat(data.ohlc?.low),
            open: parseFloat(data.ohlc?.open),
            previousClose: parseFloat(data.ohlc?.close),
            timestamp: new Date(),
            provider: 'upstox'
        };
    }

    /**
     * Format historical data response
     */
    formatHistoricalDataResponse(response) {
        if (!response || response.status !== 'success' || !response.data?.candles) {
            throw new Error('Invalid historical data response');
        }
        
        return response.data.candles.map(candle => ({
            timestamp: new Date(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseInt(candle[5]),
            provider: 'upstox'
        }));
    }

    /**
     * Format option chain response
     */
    formatOptionChainResponse(response) {
        if (!response || response.status !== 'success' || !response.data) {
            throw new Error('Invalid option chain response');
        }
        
        return {
            underlying: response.data.underlying_key,
            expiry: response.data.expiry,
            strikes: response.data.options?.map(option => ({
                strikePrice: parseFloat(option.strike_price),
                call: option.call_options ? {
                    ltp: parseFloat(option.call_options.last_price),
                    volume: parseInt(option.call_options.volume),
                    oi: parseInt(option.call_options.oi)
                } : null,
                put: option.put_options ? {
                    ltp: parseFloat(option.put_options.last_price),
                    volume: parseInt(option.put_options.volume),
                    oi: parseInt(option.put_options.oi)
                } : null
            })) || [],
            provider: 'upstox'
        };
    }

    /**
     * Format quotes response
     */
    formatQuotesResponse(response) {
        if (!response || response.status !== 'success' || !response.data) {
            throw new Error('Invalid quotes response');
        }
        
        const quotes = {};
        
        for (const [key, data] of Object.entries(response.data)) {
            quotes[key] = {
                ltp: parseFloat(data.last_price),
                change: parseFloat(data.change),
                changePercent: parseFloat(data.change_percent),
                volume: parseInt(data.volume),
                timestamp: new Date(),
                provider: 'upstox'
            };
        }
        
        return quotes;
    }

    /**
     * Initialize WebSocket connection
     */
    async initializeWebSocket() {
        if (!this.isAuthenticated) {
            throw new Error('Authentication required for WebSocket');
        }
        
        try {
            this.websocketConnection = new WebSocket(this.config.websocket.url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            this.websocketConnection.on('open', () => {
                console.log('📡 Upstox WebSocket connected');
                this.startHeartbeat();
            });
            
            this.websocketConnection.on('message', (data) => {
                this.handleWebSocketMessage(data);
            });
            
            this.websocketConnection.on('error', (error) => {
                console.error('❌ Upstox WebSocket error:', error.message);
            });
            
            this.websocketConnection.on('close', () => {
                console.log('🔌 Upstox WebSocket disconnected');
                this.attemptReconnect();
            });
            
        } catch (error) {
            throw new Error(`WebSocket initialization failed: ${error.message}`);
        }
    }

    /**
     * Subscribe to real-time data
     */
    async subscribe(symbols) {
        if (!this.websocketConnection || this.websocketConnection.readyState !== WebSocket.OPEN) {
            await this.initializeWebSocket();
        }
        
        const instrumentKeys = symbols.map(symbol => this.formatSymbol(symbol));
        
        const subscribeMessage = {
            guid: 'upstox_subscription',
            method: 'sub',
            data: {
                mode: 'full',
                instrumentKeys: instrumentKeys
            }
        };
        
        this.websocketConnection.send(JSON.stringify(subscribeMessage));
        
        instrumentKeys.forEach(key => this.subscriptions.add(key));
        console.log(`📡 Subscribed to ${instrumentKeys.length} instruments via Upstox`);
    }

    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            
            // Emit real-time data event
            this.emit('realTimeData', {
                provider: 'upstox',
                data: message
            });
            
        } catch (error) {
            console.warn('⚠️ Failed to parse WebSocket message:', error.message);
        }
    }

    /**
     * Start WebSocket heartbeat
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.websocketConnection?.readyState === WebSocket.OPEN) {
                this.websocketConnection.ping();
            }
        }, this.config.websocket.heartbeat_interval);
    }

    /**
     * Attempt WebSocket reconnection
     */
    async attemptReconnect() {
        if (this.reconnectAttempts >= this.config.websocket.max_reconnect_attempts) {
            console.error('❌ Upstox WebSocket max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
        
        console.log(`🔄 Attempting Upstox WebSocket reconnection ${this.reconnectAttempts}...`);
        
        setTimeout(() => {
            this.initializeWebSocket();
        }, this.config.websocket.reconnect_interval);
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
        // Calculate next Thursday (typical option expiry)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToThursday = (4 - dayOfWeek + 7) % 7;
        const nextThursday = new Date(today);
        nextThursday.setDate(today.getDate() + daysToThursday);
        return nextThursday.toISOString().split('T')[0];
    }

    /**
     * Process Upstox response
     */
    processResponse(response) {
        const data = response.data;
        
        if (data && data.status === 'error') {
            throw new Error(data.message || 'Upstox API error');
        }
        
        return data;
    }

    /**
     * Disconnect provider
     */
    async disconnect() {
        console.log('🔌 Disconnecting Upstox provider...');
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.websocketConnection) {
            this.websocketConnection.close();
        }
        
        this.subscriptions.clear();
    }

    /**
     * Get provider status
     */
    getStatus() {
        return {
            ...super.getStatus(),
            websocketConnected: this.websocketConnection?.readyState === WebSocket.OPEN,
            subscriptions: this.subscriptions.size,
            rateLimits: {
                ...this.config.rate_limits,
                effective: {
                    per_minute: Math.floor(this.config.rate_limits.requests_per_minute * 0.8),
                    per_second: Math.floor(this.config.rate_limits.requests_per_second * 0.8)
                }
            }
        };
    }
}

module.exports = UpstoxProvider;
