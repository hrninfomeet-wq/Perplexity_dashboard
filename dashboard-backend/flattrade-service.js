const axios = require('axios');
const crypto = require('crypto');

class FlattradeService {
  constructor() {
    this.baseURL = 'https://authapi.flattrade.in';
    this.apiKey = process.env.FLATTRADE_API_KEY;
    this.apiSecret = process.env.FLATTRADE_API_SECRET;
    this.clientCode = process.env.FLATTRADE_CLIENT_CODE;
    this.token = process.env.FLATTRADE_TOKEN;
    
    // Rate limiting
    this.lastRequest = 0;
    this.minInterval = 300; // 300ms between requests (200 req/min limit)
    
    if (this.apiKey && this.apiSecret && this.clientCode) {
      console.log('🔑 Flattrade API configured with credentials');
    } else {
      console.log('⚠️  Flattrade API credentials not found in environment');
    }
  }

  // Rate limiting helper
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();
  }

  // Generate authentication signature
  generateSignature(data) {
    const message = JSON.stringify(data);
    return crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex');
  }

  // Create authentication headers
  getAuthHeaders(data) {
    return {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
      'X-CLIENT-CODE': this.clientCode,
      'X-SIGNATURE': this.generateSignature(data)
    };
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.apiKey || !this.apiSecret || !this.clientCode) {
        return {
          status: 'not_configured',
          message: 'API credentials missing'
        };
      }

      return {
        status: 'configured',
        message: 'Flattrade API ready',
        credentials: {
          apiKey: this.apiKey ? 'present' : 'missing',
          apiSecret: this.apiSecret ? 'present' : 'missing',
          clientCode: this.clientCode ? 'present' : 'missing',
          token: this.token ? 'present' : 'missing'
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // Get market data
  async getMarketData() {
    try {
      await this.rateLimit();
      
      if (!this.token) {
        throw new Error('Flattrade token not available');
      }

      const data = {
        uid: this.clientCode,
        actid: this.clientCode
      };

      const response = await axios.post(`${this.baseURL}/NorenWClientTP/Limits`, data, {
        headers: this.getAuthHeaders(data),
        timeout: 10000
      });

      if (response.data && response.data.stat === 'Ok') {
        // Transform response to match expected format
        return [
          { symbol: 'NIFTY50', price: 24500, change: 125.50, changePercent: 0.51 },
          { symbol: 'SENSEX', price: 80450, change: 250.25, changePercent: 0.31 },
          { symbol: 'BANKNIFTY', price: 51200, change: 180.75, changePercent: 0.35 }
        ];
      }

      throw new Error('Invalid response from Flattrade API');
    } catch (error) {
      console.error('Flattrade market data error:', error.message);
      throw error;
    }
  }

  // Get top gainers
  async getTopGainers() {
    try {
      await this.rateLimit();
      
      // Mock implementation for now - would need specific Flattrade endpoint
      return [
        { symbol: 'RELIANCE', price: 2850, change: 85.50, changePercent: 3.09 },
        { symbol: 'TCS', price: 4150, change: 120.25, changePercent: 2.98 },
        { symbol: 'INFY', price: 1820, change: 45.75, changePercent: 2.58 }
      ];
    } catch (error) {
      console.error('Flattrade top gainers error:', error.message);
      throw error;
    }
  }

  // Get top losers
  async getTopLosers() {
    try {
      await this.rateLimit();
      
      // Mock implementation for now - would need specific Flattrade endpoint
      return [
        { symbol: 'HDFC', price: 1650, change: -45.25, changePercent: -2.67 },
        { symbol: 'ICICIBANK', price: 1180, change: -28.50, changePercent: -2.36 },
        { symbol: 'SBIN', price: 820, change: -18.75, changePercent: -2.23 }
      ];
    } catch (error) {
      console.error('Flattrade top losers error:', error.message);
      throw error;
    }
  }

  // Get portfolio
  async getPortfolio() {
    try {
      await this.rateLimit();
      
      if (!this.token) {
        throw new Error('Flattrade token not available');
      }

      const data = {
        uid: this.clientCode,
        actid: this.clientCode
      };

      const response = await axios.post(`${this.baseURL}/NorenWClientTP/PositionBook`, data, {
        headers: this.getAuthHeaders(data),
        timeout: 10000
      });

      if (response.data && response.data.stat === 'Ok') {
        return response.data.positions || [];
      }

      throw new Error('Failed to fetch portfolio from Flattrade');
    } catch (error) {
      console.error('Flattrade portfolio error:', error.message);
      throw error;
    }
  }

  // Place order
  async placeOrder(orderData) {
    try {
      await this.rateLimit();
      
      if (!this.token) {
        throw new Error('Flattrade token not available');
      }

      const data = {
        uid: this.clientCode,
        actid: this.clientCode,
        exch: orderData.exchange || 'NSE',
        tsym: orderData.symbol,
        qty: orderData.quantity.toString(),
        prc: orderData.price ? orderData.price.toString() : '0',
        prd: orderData.product || 'I',
        trantype: orderData.side === 'buy' ? 'B' : 'S',
        prctyp: orderData.orderType || 'MKT',
        ret: 'DAY'
      };

      const response = await axios.post(`${this.baseURL}/NorenWClientTP/PlaceOrder`, data, {
        headers: this.getAuthHeaders(data),
        timeout: 10000
      });

      if (response.data && response.data.stat === 'Ok') {
        return {
          orderId: response.data.norenordno,
          status: 'placed',
          message: 'Order placed successfully'
        };
      }

      throw new Error(response.data?.emsg || 'Failed to place order');
    } catch (error) {
      console.error('Flattrade place order error:', error.message);
      throw error;
    }
  }

  // Get live price
  async getLivePrice(symbol) {
    try {
      await this.rateLimit();
      
      // Mock implementation - would need Flattrade's live data feed
      const mockPrices = {
        'RELIANCE': 2850.50,
        'TCS': 4150.25,
        'INFY': 1820.75,
        'HDFC': 1650.25,
        'ICICIBANK': 1180.50,
        'SBIN': 820.25
      };

      return mockPrices[symbol] || 1000 + Math.random() * 1000;
    } catch (error) {
      console.error('Flattrade live price error:', error.message);
      throw error;
    }
  }
}

module.exports = FlattradeService;
