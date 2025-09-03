// dashboard-backend/src/services/api/providers/nse-public.js

/**
 * NSE Public API Provider
 * Backup data source for basic market data (60 req/min, no authentication)
 * 
 * @version 2.3.0
 * @created September 02, 2025
 * @phase Phase 2.5 - Multi-API Integration
 */

const BaseProvider = require('./base-provider');
const axios = require('axios');

class NSEPublicProvider extends BaseProvider {
    constructor() {
        super('nse_public');
        
        this.isAuthenticated = true; // No authentication required
        this.cookies = new Map();
        this.sessionHeaders = {};
        
        console.log('📊 NSE Public provider initialized (backup data source)');
    }

    /**
     * Initialize NSE Public provider
     */
    async initialize() {
        try {
            // Initialize session with NSE website
            await this.initializeSession();
            console.log('📊 NSE Public: Connected (60 req/min, backup)');
            return true;
            
        } catch (error) {
            console.warn('⚠️ NSE Public initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Initialize session with NSE website
     */
    async initializeSession() {
        try {
            const response = await axios.get('https://www.nseindia.com', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 10000
            });
            
            // Extract cookies from response
            const setCookieHeader = response.headers['set-cookie'];
            if (setCookieHeader) {
                setCookieHeader.forEach(cookie => {
                    const [name, value] = cookie.split(';')[0].split('=');
                    this.cookies.set(name, value);
                });
            }
            
            this.sessionHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.nseindia.com/',
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            if (this.cookies.size > 0) {
                this.sessionHeaders['Cookie'] = Array.from(this.cookies.entries())
                    .map(([name, value]) => `${name}=${value}`)
                    .join('; ');
            }
            
        } catch (error) {
            console.warn('⚠️ NSE session initialization failed:', error.message);
        }
    }

    /**
     * Health check for NSE Public
     */
    async healthCheck() {
        try {
            const response = await this.makeRequest('/equity-stockIndices', {
                params: { index: 'NIFTY 50' }
            });
            
            if (response && response.data) {
                return { status: 'healthy', indices: response.data.length };
            } else {
                throw new Error('Invalid health check response');
            }
            
        } catch (error) {
            throw new Error(`NSE Public health check failed: ${error.message}`);
        }
    }

    /**
     * No authentication required for NSE Public
     */
    async authenticate() {
        return true; // Always authenticated
    }

    /**
     * Get headers for NSE requests
     */
    getHeaders(options = {}) {
        return {
            ...this.sessionHeaders,
            ...options.headers
        };
    }

    /**
     * Get market data from NSE Public
     */
    async getMarketData(symbol) {
        try {
            // Try to get data from equity stock indices
            const response = await this.makeRequest('/equity-stockIndices', {
                params: { index: 'NIFTY 50' }
            });
            
            if (response && response.data) {
                const stockData = response.data.find(stock => 
                    stock.symbol === symbol || stock.symbol === symbol.toUpperCase()
                );
                
                if (stockData) {
                    return this.formatMarketDataResponse(stockData, symbol);
                }
            }
            
            // Fallback to quote API
            return await this.getQuoteData(symbol);
            
        } catch (error) {
            throw new Error(`NSE Public market data failed: ${error.message}`);
        }
    }

    /**
     * Get quote data for individual symbol
     */
    async getQuoteData(symbol) {
        const response = await this.makeRequest('/quote-equity', {
            params: { symbol: symbol.toUpperCase() }
        });
        
        return this.formatQuoteDataResponse(response, symbol);
    }

    /**
     * Get historical data (limited for NSE Public)
     */
    async getHistoricalData(symbol, period = '1M') {
        try {
            const response = await this.makeRequest('/chart-databyindex', {
                params: {
                    index: symbol === 'NIFTY' ? 'NIFTY 50' : symbol.toUpperCase(),
                    indices: 'true'
                }
            });
            
            return this.formatHistoricalDataResponse(response);
            
        } catch (error) {
            console.warn(`⚠️ NSE Public historical data not available for ${symbol}`);
            return [];
        }
    }

    /**
     * Get option chain from NSE Public
     */
    async getOptionChain(symbol) {
        try {
            const formattedSymbol = symbol === 'NIFTY' ? 'NIFTY' : symbol === 'BANKNIFTY' ? 'BANKNIFTY' : symbol;
            
            const response = await this.makeRequest('/option-chain-indices', {
                params: { symbol: formattedSymbol }
            });
            
            return this.formatOptionChainResponse(response, formattedSymbol);
            
        } catch (error) {
            throw new Error(`NSE Public option chain failed: ${error.message}`);
        }
    }

    /**
     * Get all indices data
     */
    async getAllIndices() {
        const response = await this.makeRequest('/allIndices');
        return this.formatIndicesResponse(response);
    }

    /**
     * Get gainers data
     */
    async getGainers() {
        const response = await this.makeRequest('/live_analysis/gainers/security_in_focus');
        return this.formatGainersLosersResponse(response, 'gainers');
    }

    /**
     * Get losers data
     */
    async getLosers() {
        const response = await this.makeRequest('/live_analysis/losers/security_in_focus');
        return this.formatGainersLosersResponse(response, 'losers');
    }

    /**
     * Format market data response
     */
    formatMarketDataResponse(data, originalSymbol) {
        return {
            symbol: originalSymbol,
            ltp: parseFloat(data.lastPrice || data.close),
            change: parseFloat(data.change),
            changePercent: parseFloat(data.pChange),
            volume: parseInt(data.totalTradedVolume || 0),
            high: parseFloat(data.dayHigh),
            low: parseFloat(data.dayLow),
            open: parseFloat(data.open),
            previousClose: parseFloat(data.previousClose),
            timestamp: new Date(),
            provider: 'nse_public'
        };
    }

    /**
     * Format quote data response
     */
    formatQuoteDataResponse(response, originalSymbol) {
        if (!response || !response.data) {
            throw new Error('Invalid quote data response');
        }
        
        const data = response.data;
        
        return {
            symbol: originalSymbol,
            ltp: parseFloat(data.lastPrice),
            change: parseFloat(data.change),
            changePercent: parseFloat(data.pChange),
            volume: parseInt(data.totalTradedVolume),
            high: parseFloat(data.dayHigh),
            low: parseFloat(data.dayLow),
            open: parseFloat(data.open),
            previousClose: parseFloat(data.previousClose),
            timestamp: new Date(data.lastUpdateTime),
            provider: 'nse_public'
        };
    }

    /**
     * Format historical data response
     */
    formatHistoricalDataResponse(response) {
        if (!response || !response.grapthData) {
            return [];
        }
        
        return response.grapthData.map(point => ({
            timestamp: new Date(point[0]),
            close: parseFloat(point[1]),
            // NSE public data doesn't provide OHLCV, only close prices
            open: parseFloat(point[1]),
            high: parseFloat(point[1]),
            low: parseFloat(point[1]),
            volume: 0,
            provider: 'nse_public'
        }));
    }

    /**
     * Format option chain response
     */
    formatOptionChainResponse(response, symbol) {
        if (!response || !response.records) {
            throw new Error('Invalid option chain response');
        }
        
        const strikes = [];
        
        response.records.data?.forEach(strike => {
            strikes.push({
                strikePrice: parseFloat(strike.strikePrice),
                call: strike.CE ? {
                    ltp: parseFloat(strike.CE.lastPrice),
                    volume: parseInt(strike.CE.totalTradedVolume),
                    oi: parseInt(strike.CE.openInterest),
                    bid: parseFloat(strike.CE.bidprice),
                    ask: parseFloat(strike.CE.askPrice)
                } : null,
                put: strike.PE ? {
                    ltp: parseFloat(strike.PE.lastPrice),
                    volume: parseInt(strike.PE.totalTradedVolume),
                    oi: parseInt(strike.PE.openInterest),
                    bid: parseFloat(strike.PE.bidprice),
                    ask: parseFloat(strike.PE.askPrice)
                } : null
            });
        });
        
        return {
            underlying: symbol,
            expiry: response.records.expiryDates?.[0],
            underlyingValue: parseFloat(response.records.underlyingValue),
            strikes: strikes,
            provider: 'nse_public'
        };
    }

    /**
     * Format indices response
     */
    formatIndicesResponse(response) {
        if (!response || !response.data) {
            return [];
        }
        
        return response.data.map(index => ({
            name: index.index,
            value: parseFloat(index.last),
            change: parseFloat(index.change),
            changePercent: parseFloat(index.percentChange),
            timestamp: new Date(),
            provider: 'nse_public'
        }));
    }

    /**
     * Format gainers/losers response
     */
    formatGainersLosersResponse(response, type) {
        if (!response || !response.data) {
            return [];
        }
        
        return response.data.map(stock => ({
            symbol: stock.symbol,
            ltp: parseFloat(stock.lastPrice),
            change: parseFloat(stock.change),
            changePercent: parseFloat(stock.pChange),
            volume: parseInt(stock.totalTradedVolume),
            type: type,
            provider: 'nse_public'
        }));
    }

    /**
     * Make request with session management
     */
    async makeRequest(endpoint, options = {}) {
        try {
            // Reinitialize session if cookies expired
            if (this.cookies.size === 0) {
                await this.initializeSession();
            }
            
            return await super.makeRequest(endpoint, options);
            
        } catch (error) {
            // If request fails, try reinitializing session
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('🔄 Reinitializing NSE session...');
                await this.initializeSession();
                return await super.makeRequest(endpoint, options);
            }
            
            throw error;
        }
    }

    /**
     * Process NSE response
     */
    processResponse(response) {
        const data = response.data;
        
        // NSE sometimes returns HTML on errors
        if (typeof data === 'string' && data.includes('<html>')) {
            throw new Error('NSE returned HTML page - possible session issue');
        }
        
        return data;
    }

    /**
     * Get provider status
     */
    getStatus() {
        return {
            ...super.getStatus(),
            sessionActive: this.cookies.size > 0,
            cookieCount: this.cookies.size,
            rateLimits: {
                ...this.config.rate_limits,
                note: 'Public API - limited features, backup only'
            }
        };
    }
}

module.exports = NSEPublicProvider;
