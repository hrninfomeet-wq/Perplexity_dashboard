// dashboard-backend/src/services/api/providers/flattrade.js

/**
 * Enhanced Flattrade API Provider
 * Improved integration with existing Flattrade implementation
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const BaseProvider = require('./base-provider');
const axios = require('axios');
const crypto = require('crypto');

class FlattradeProvider extends BaseProvider {
    constructor() {
        super('flattrade');
        
        // Use existing token if available
        this.accessToken = this.config.authentication.access_token;
        this.isAuthenticated = !!this.accessToken;
        
        console.log(`🟡 Flattrade provider initialized (${this.isAuthenticated ? 'authenticated' : 'requires auth'})`);
    }

    /**
     * Initialize Flattrade provider
     */
    async initialize() {
        try {
            if (this.accessToken) {
                // Validate existing token
                await this.validateToken();
            }
            
            console.log('✅ Flattrade provider ready');
            return true;
            
        } catch (error) {
            console.warn('⚠️ Flattrade initialization failed:', error.message);
            this.isAuthenticated = false;
            return false;
        }
    }

    /**
     * Health check for Flattrade
     */
    async healthCheck() {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Not authenticated');
            }
            
            // Simple API call to check connectivity
            const response = await this.makeRequest('UserDetails', {
                method: 'POST',
                data: {
                    uid: this.config.authentication.client_code,
                    actid: this.config.authentication.client_code
                }
            });
            
            return { status: 'healthy', response };
            
        } catch (error) {
            throw new Error(`Flattrade health check failed: ${error.message}`);
        }
    }

    /**
     * Authenticate with Flattrade
     */
    async authenticate() {
        // Flattrade authentication is handled externally through web flow
        // This method checks if we have valid credentials
        
        if (!this.config.authentication.api_key || !this.config.authentication.client_code) {
            throw new Error('Flattrade credentials not configured');
        }
        
        if (this.accessToken) {
            await this.validateToken();
            return true;
        }
        
        throw new Error('Flattrade authentication requires manual login process');
    }

    /**
     * Validate access token
     */
    async validateToken() {
        try {
            const response = await axios.post(
                `${this.config.endpoints.base_url}UserDetails`,
                {
                    uid: this.config.authentication.client_code,
                    actid: this.config.authentication.client_code
                },
                {
                    headers: this.getHeaders(),
                    timeout: 5000
                }
            );
            
            if (response.data && response.data.stat === 'Ok') {
                this.isAuthenticated = true;
                return true;
            } else {
                throw new Error('Invalid token response');
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
            headers['Authorization'] = `token ${this.accessToken}`;
        }
        
        return headers;
    }

    /**
     * Get market data from Flattrade
     */
    async getMarketData(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('MarketWatch', {
            method: 'POST',
            data: {
                uid: this.config.authentication.client_code,
                actid: this.config.authentication.client_code,
                exch: 'NSE',
                token: formattedSymbol
            }
        });
        
        return this.formatMarketDataResponse(response);
    }

    /**
     * Get historical data from Flattrade
     */
    async getHistoricalData(symbol, timeframe = '1', from_date, to_date) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('TPSeries', {
            method: 'POST',
            data: {
                uid: this.config.authentication.client_code,
                exch: 'NSE',
                token: formattedSymbol,
                st: from_date || this.getDefaultFromDate(),
                et: to_date || this.getDefaultToDate(),
                intrv: timeframe
            }
        });
        
        return this.formatHistoricalDataResponse(response);
    }

    /**
     * Get option chain from Flattrade
     */
    async getOptionChain(symbol) {
        const formattedSymbol = this.formatSymbol(symbol);
        
        const response = await this.makeRequest('GetOptionChain', {
            method: 'POST',
            data: {
                uid: this.config.authentication.client_code,
                exch: 'NSE',
                strprc: '19000', // Strike price range
                cnt: '50' // Number of strikes
            }
        });
        
        return this.formatOptionChainResponse(response);
    }

    /**
     * Format market data response
     */
    formatMarketDataResponse(response) {
        if (!response || response.stat !== 'Ok') {
            throw new Error('Invalid market data response');
        }
        
        return {
            symbol: response.tsym,
            ltp: parseFloat(response.lp),
            change: parseFloat(response.c),
            changePercent: parseFloat(response.prctyp),
            volume: parseInt(response.v),
            high: parseFloat(response.h),
            low: parseFloat(response.l),
            open: parseFloat(response.o),
            previousClose: parseFloat(response.c),
            timestamp: new Date(response.ft * 1000),
            provider: 'flattrade'
        };
    }

    /**
     * Format historical data response
     */
    formatHistoricalDataResponse(response) {
        if (!response || !Array.isArray(response)) {
            throw new Error('Invalid historical data response');
        }
        
        return response.map(candle => ({
            timestamp: new Date(candle.time),
            open: parseFloat(candle.into),
            high: parseFloat(candle.inth),
            low: parseFloat(candle.intl),
            close: parseFloat(candle.intc),
            volume: parseInt(candle.intv),
            provider: 'flattrade'
        }));
    }

    /**
     * Format option chain response
     */
    formatOptionChainResponse(response) {
        if (!response || response.stat !== 'Ok') {
            throw new Error('Invalid option chain response');
        }
        
        return {
            underlying: response.values?.[0]?.token,
            strikes: response.values?.map(strike => ({
                strikePrice: parseFloat(strike.strprc),
                call: {
                    ltp: parseFloat(strike.c_lp),
                    volume: parseInt(strike.c_v),
                    oi: parseInt(strike.c_oi)
                },
                put: {
                    ltp: parseFloat(strike.p_lp),
                    volume: parseInt(strike.p_v),
                    oi: parseInt(strike.p_oi)
                }
            })) || [],
            provider: 'flattrade'
        };
    }

    /**
     * Get default from date (30 days ago)
     */
    getDefaultFromDate() {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    }

    /**
     * Get default to date (today)
     */
    getDefaultToDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Process Flattrade response
     */
    processResponse(response) {
        const data = response.data;
        
        // Handle Flattrade error responses
        if (data && data.stat === 'Not_Ok') {
            throw new Error(data.emsg || 'Flattrade API error');
        }
        
        return data;
    }

    /**
     * Get provider status
     */
    getStatus() {
        return {
            ...super.getStatus(),
            clientCode: this.config.authentication.client_code,
            tokenValid: this.isAuthenticated,
            apiUrl: this.config.endpoints.base_url
        };
    }
}

module.exports = FlattradeProvider;
