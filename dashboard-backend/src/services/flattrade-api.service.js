// dashboard-backend/src/services/flattrade-api.service.js
// Flattrade API integration service with authenticated endpoints
// Updated according to Flattrade API v1.19.0 documentation

const crypto = require('crypto');

class FlattradeAPIService {
    constructor() {
        this.loadCredentials();
        
        // Track session expiry (24 hours according to documentation)
        this.tokenExpiry = null;
        this.rateLimitCounts = {
            requests: 0,
            lastReset: Date.now()
        };
        
        if (!this.jKey || !this.clientCode) {
            console.warn('⚠️ Flattrade credentials not found in environment variables');
        }
        
        // Check if token is likely expired (simple check)
        this.checkTokenExpiry();
    }

    /**
     * Reload credentials from environment variables
     * This allows for runtime updates when .env file is modified
     */
    loadCredentials() {
        this.baseURL = process.env.FLATTRADE_API_URL || 'https://piconnect.flattrade.in/PiConnectTP/';
        this.clientCode = process.env.FLATTRADE_CLIENT_CODE;
        this.jKey = process.env.FLATTRADE_TOKEN;
        this.apiKey = process.env.FLATTRADE_API_KEY;
        this.apiSecret = process.env.FLATTRADE_API_SECRET;
        this.requestCode = process.env.FLATTRADE_REQUEST_CODE;
        
        console.log('🔄 Credentials reloaded from environment variables');
    }

    /**
     * Force reload credentials from environment variables
     * Public method for external use (e.g., from auth controller)
     */
    forceReloadCredentials() {
        console.log('🔄 Force reloading Flattrade credentials...');
        this.loadCredentials();
        this.tokenExpiry = null; // Reset token expiry check
        return { success: true, message: 'Credentials reloaded successfully' };
    }

    checkTokenExpiry() {
        if (!this.jKey) return false;
        
        // Simple check - if token looks old or invalid, mark as expired
        if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
            console.log('⚠️ Token appears to be expired');
            return false;
        }
        return true;
    }

    async makeAPICall(endpoint, params = {}, retryCount = 0) {
        try {
            // Check rate limits
            await this.checkRateLimit();

            const url = `${this.baseURL}${endpoint}`;
            const requestData = { 
                jKey: this.jKey,
                ...params 
            };

            console.log(`📡 Making Flattrade API call to: ${endpoint}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            
            // Check for API errors
            if (data.stat !== 'Ok') {
                console.error(`❌ Flattrade API error for ${endpoint}:`, data.emsg || data);
                
                // Handle session expiry with automatic retry using credential reload
                if (data.emsg && data.emsg.includes('Session Expired') && retryCount === 0) {
                    console.log('🔄 Session expired, reloading credentials and retrying...');
                    this.loadCredentials(); // Reload from environment instead of broken token refresh
                    
                    // Retry with reloaded credentials
                    return await this.makeAPICall(endpoint, params, retryCount + 1);
                }
                
                throw new Error(data.emsg || `API call failed for ${endpoint}`);
            }

            return data;
        } catch (error) {
            console.error(`❌ Error calling Flattrade ${endpoint}:`, error.message);
            
            // Handle network errors or session issues with credential reload
            if (error.message.includes('Session') && retryCount === 0) {
                console.log('🔄 Session error detected, attempting credential reload...');
                this.loadCredentials();
                return await this.makeAPICall(endpoint, params, retryCount + 1);
            }
            
            throw new Error(`Session invalid and refresh failed. Please re-authenticate via /api/login/url`);
        }
    }

    async checkRateLimit() {
        const now = Date.now();
        const timeWindow = 60 * 1000; // 1 minute window
        
        // Reset counter every minute
        if (now - this.rateLimitCounts.lastReset > timeWindow) {
            this.rateLimitCounts.requests = 0;
            this.rateLimitCounts.lastReset = now;
        }
        
        // Flattrade allows 200 requests per minute
        if (this.rateLimitCounts.requests >= 200) {
            const waitTime = timeWindow - (now - this.rateLimitCounts.lastReset);
            console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.rateLimitCounts.requests = 0;
            this.rateLimitCounts.lastReset = Date.now();
        }
        
        this.rateLimitCounts.requests++;
    }

    async validateSession() {
        try {
            // Try a simple API call to validate session
            const response = await this.getUserDetails();
            return response.stat === 'Ok';
        } catch (error) {
            console.log('🔄 Session validation failed, attempting credential reload...');
            this.loadCredentials();
            
            try {
                // Retry with reloaded credentials
                const retryResponse = await this.getUserDetails();
                return retryResponse.stat === 'Ok';
            } catch (retryError) {
                console.log('❌ Session validation failed even after credential reload');
                return false;
            }
        }
    }

    async refreshToken() {
        console.log('🔄 Attempting to refresh Flattrade token...');
        
        // Use credential reload instead of broken token refresh API
        console.log('🔄 Using credential reload approach instead of token refresh...');
        this.loadCredentials();
        
        // Validate the reloaded credentials
        const isValid = await this.validateSession();
        if (isValid) {
            console.log('✅ Credentials successfully reloaded and validated');
            return { success: true };
        } else {
            throw new Error('Credential reload failed - session still invalid');
        }
    }

    // User Details API
    async getUserDetails() {
        return await this.makeAPICall('UserDetails');
    }

    // Get Quotes API
    async getQuotes(exchange, tokens) {
        console.log(`📊 Fetching quotes for tokens: ${tokens} on ${exchange}`);
        const params = {
            exch: exchange,
            token: tokens
        };
        return await this.makeAPICall('GetQuotes', params);
    }

    // Get Single Quote
    async getSingleQuote(exchange, token) {
        try {
            const quotes = await this.getQuotes(exchange, token);
            return quotes;
        } catch (error) {
            console.error(`❌ Error getting single quote for token ${token}:`, error.message);
            throw error;
        }
    }

    // Top List API for market movers
    async getTopList(exchange, type = 'top_gainers') {
        const params = {
            exch: exchange,
            tb: type
        };
        return await this.makeAPICall('TopList', params);
    }

    // Get Holdings
    async getHoldings() {
        return await this.makeAPICall('Holdings');
    }

    // Get Positions
    async getPositions() {
        return await this.makeAPICall('PositionBook');
    }

    // Get Order Book
    async getOrderBook() {
        return await this.makeAPICall('OrderBook');
    }

    // Get Trade Book
    async getTradeBook() {
        return await this.makeAPICall('TradeBook');
    }

    // Place Order
    async placeOrder(orderParams) {
        // Generate unique order ID using timestamp and random number
        const orderId = `FT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        const params = {
            norenordno: orderId,
            ...orderParams
        };
        
        return await this.makeAPICall('PlaceOrder', params);
    }

    // Modify Order
    async modifyOrder(orderParams) {
        return await this.makeAPICall('ModifyOrder', orderParams);
    }

    // Cancel Order
    async cancelOrder(norenordno) {
        const params = { norenordno };
        return await this.makeAPICall('CancelOrder', params);
    }

    // Get Security Info
    async getSecurityInfo(exchange, token) {
        const params = {
            exch: exchange,
            token: token
        };
        return await this.makeAPICall('GetSecurityInfo', params);
    }

    // Time Price Series
    async getTimePriceSeries(exchange, token, startTime, endTime, interval = '1') {
        const params = {
            exch: exchange,
            token: token,
            st: startTime,
            et: endTime,
            intrv: interval
        };
        return await this.makeAPICall('TPSeries', params);
    }

    // Get Option Chain
    async getOptionChain(exchange, tsym, strikePrice, count = 5) {
        const params = {
            exch: exchange,
            tsym: tsym,
            strprc: strikePrice,
            cnt: count.toString()
        };
        return await this.makeAPICall('GetOptionChain', params);
    }

    // Span Calculator
    async calculateSpan(positions) {
        const params = {
            positionbook: JSON.stringify(positions)
        };
        return await this.makeAPICall('SpanCalc', params);
    }

    // Get Limits/Margins
    async getLimits() {
        return await this.makeAPICall('Limits');
    }

    // Get Market Status
    async getMarketStatus() {
        return await this.makeAPICall('MarketStatus');
    }

    // Convert Position
    async convertPosition(exchange, tsym, qty, prd, prevprd, trantype, postype, ordersource = 'API') {
        const params = {
            exch: exchange,
            tsym: tsym,
            qty: qty,
            prd: prd,
            prevprd: prevprd,
            trantype: trantype,
            postype: postype,
            ordersource: ordersource
        };
        return await this.makeAPICall('PositionConversion', params);
    }

    // Get Product Conversion
    async getProductConversion(exchange, tsym, qty, prd, trantype, ordersource = 'API') {
        const params = {
            exch: exchange,
            tsym: tsym,
            qty: qty,
            prd: prd,
            trantype: trantype,
            ordersource: ordersource
        };
        return await this.makeAPICall('GetConvertedPosition', params);
    }

    // Order Margin Calculator
    async calculateOrderMargin(orderlist) {
        const params = {
            orderlist: JSON.stringify(orderlist)
        };
        return await this.makeAPICall('OrderMargin', params);
    }

    // Basket Margin Calculator
    async calculateBasketMargin(basketlist) {
        const params = {
            basketlist: JSON.stringify(basketlist)
        };
        return await this.makeAPICall('BasketMargin', params);
    }

    // Multi-leg Order Margin
    async calculateMultiLegMargin(tradingsymbol, positions) {
        const params = {
            tradingsymbol: tradingsymbol,
            positions: JSON.stringify(positions)
        };
        return await this.makeAPICall('MultiLegOrderMargin', params);
    }

    // Index List
    async getIndexList(exchange) {
        const params = { exch: exchange };
        return await this.makeAPICall('GetIndexList', params);
    }

    // Bracket Order
    async placeBracketOrder(orderParams) {
        const orderId = `FT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const params = {
            norenordno: orderId,
            ...orderParams
        };
        return await this.makeAPICall('PlaceBracketOrder', params);
    }

    // Cover Order
    async placeCoverOrder(orderParams) {
        const orderId = `FT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const params = {
            norenordno: orderId,
            ...orderParams
        };
        return await this.makeAPICall('PlaceCoverOrder', params);
    }
}

module.exports = FlattradeAPIService;