// dashboard-backend/src/services/enhancedFlattradeService.js
const axios = require('axios');
const enhancedAuthController = require('../controllers/enhancedAuthController');

class EnhancedFlattradeService {
    constructor() {
        this.FLATTRADE_BASE_URL = 'https://piconnect.flattrade.in/PiConnectTP/';
        this.CLIENT_CODE = process.env.FLATTRADE_CLIENT_CODE;
        
        // Rate limiting
        this.apiCallCount = 0;
        this.apiCallResetTime = Date.now();
        this.API_CALLS_PER_MINUTE = 100;
        this.API_CALL_DELAY = 200;
        
        // Request cache
        this.cache = new Map();
        this.cacheTimeout = 10000; // 10 seconds cache
        
        console.log('🚀 Enhanced Flattrade Service initialized');
    }

    /**
     * Make authenticated request to Flattrade API with auto-retry
     */
    async makeRequest(endpoint, data = {}, retryCount = 0) {
        const maxRetries = 2;
        
        try {
            // Get valid token (this handles auto-refresh)
            const token = await enhancedAuthController.getValidToken();
            
            // Check cache first
            const cacheKey = `${endpoint}_${JSON.stringify(data)}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Cache hit for ${endpoint}`);
                    return cached.data;
                }
            }

            // Rate limiting
            await this.handleRateLimit();

            const payload = {
                ...data,
                uid: this.CLIENT_CODE,
                jKey: token
            };

            console.log(`📡 API call ${this.apiCallCount}/${this.API_CALLS_PER_MINUTE} to: ${endpoint}`);

            const response = await axios.post(
                `${this.FLATTRADE_BASE_URL}${endpoint}`,
                `jData=${JSON.stringify(payload)}&jKey=${token}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 15000
                }
            );

            if (response.data.stat !== 'Ok') {
                const errorMsg = response.data.emsg || 'Flattrade API error';
                
                // Check if it's an authentication error
                if (this.isAuthError(errorMsg)) {
                    console.log('🔐 Authentication error detected, clearing session');
                    await enhancedAuthController.logout();
                    
                    if (retryCount < maxRetries) {
                        console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries})...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return this.makeRequest(endpoint, data, retryCount + 1);
                    }
                }
                
                throw new Error(errorMsg);
            }

            // Cache successful response
            this.cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });

            // Clean old cache entries
            this.cleanCache();

            return response.data;

        } catch (error) {
            if (this.isAuthError(error.message) && retryCount < maxRetries) {
                console.log(`🔄 Auth error, retrying request (${retryCount + 1}/${maxRetries})...`);
                
                // Clear session and try to re-authenticate
                await enhancedAuthController.logout();
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.makeRequest(endpoint, data, retryCount + 1);
            }
            
            console.error(`❌ API Error for ${endpoint}:`, error.message);
            throw error;
        }
    }

    /**
     * Handle rate limiting
     */
    async handleRateLimit() {
        const now = Date.now();
        
        // Reset counter every minute
        if (now - this.apiCallResetTime > 60000) {
            this.apiCallCount = 0;
            this.apiCallResetTime = now;
        }

        // If we've hit the limit, wait
        if (this.apiCallCount >= this.API_CALLS_PER_MINUTE) {
            console.log('⏳ API rate limit reached, waiting...');
            await new Promise(resolve => setTimeout(resolve, this.API_CALL_DELAY * 5));
        }

        // Add delay between calls
        if (this.apiCallCount > 0) {
            await new Promise(resolve => setTimeout(resolve, this.API_CALL_DELAY));
        }

        this.apiCallCount++;
    }

    /**
     * Check if error is authentication related
     */
    isAuthError(errorMsg) {
        const authErrors = [
            'session',
            'invalid',
            'token',
            'unauthorized',
            'authentication',
            'login',
            'expired'
        ];
        
        return authErrors.some(error => 
            errorMsg.toLowerCase().includes(error)
        );
    }

    /**
     * Clean old cache entries
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout * 2) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ API cache cleared');
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            authenticated: enhancedAuthController.isAuthenticated(),
            apiCallCount: this.apiCallCount,
            cacheSize: this.cache.size,
            rateLimitRemaining: this.API_CALLS_PER_MINUTE - this.apiCallCount,
            resetTime: new Date(this.apiCallResetTime + 60000)
        };
    }

    // Specific API methods for easy use
    
    /**
     * Get market data for specific symbols
     */
    async getMarketData(symbols) {
        return this.makeRequest('MarketWatch', { symbols });
    }

    /**
     * Get option chain
     */
    async getOptionChain(symbol, strikePrice, expiryDate) {
        return this.makeRequest('GetOptionChain', {
            symbol,
            strikePrice,
            expiryDate
        });
    }

    /**
     * Get positions
     */
    async getPositions() {
        return this.makeRequest('PositionBook');
    }

    /**
     * Get holdings
     */
    async getHoldings() {
        return this.makeRequest('Holdings');
    }

    /**
     * Get user details
     */
    async getUserDetails() {
        return this.makeRequest('UserDetails');
    }

    /**
     * Search stocks
     */
    async searchStocks(searchText) {
        return this.makeRequest('SearchScrip', { stext: searchText });
    }

    /**
     * Get historical data
     */
    async getHistoricalData(symbol, interval, fromDate, toDate) {
        return this.makeRequest('TPSeries', {
            symbol,
            interval,
            from: fromDate,
            to: toDate
        });
    }

    /**
     * Place order
     */
    async placeOrder(orderData) {
        return this.makeRequest('PlaceOrder', orderData);
    }

    /**
     * Get order book
     */
    async getOrderBook() {
        return this.makeRequest('OrderBook');
    }

    /**
     * Get trade book
     */
    async getTradeBook() {
        return this.makeRequest('TradeBook');
    }
}

// Create singleton instance
const enhancedFlattradeService = new EnhancedFlattradeService();

module.exports = enhancedFlattradeService;
