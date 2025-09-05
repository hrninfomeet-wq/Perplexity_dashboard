// Flattrade API Service for Live Trading Integration
// Implements real-time market data and trading functionality

const crypto = require('crypto');
const axios = require('axios');

class FlattradeService {
  constructor() {
    this.apiKey = process.env.FLATTRADE_API_KEY;
    this.apiSecret = process.env.FLATTRADE_API_SECRET;
    this.clientCode = process.env.FLATTRADE_CLIENT_CODE;
    this.baseURL = process.env.FLATTRADE_API_URL || 'https://piconnect.flattrade.in/PiConnectTP/';
    this.token = process.env.FLATTRADE_TOKEN;
    this.requestToken = process.env.FLATTRADE_REQUEST_CODE;
    
    // Rate limiting (250 requests per minute for Flattrade)
    this.requestCount = 0;
    this.requestWindow = 60000; // 1 minute
    this.maxRequests = 240; // Leave buffer for 250 limit
    
    this.resetRequestCount();
  }

  resetRequestCount() {
    setInterval(() => {
      this.requestCount = 0;
    }, this.requestWindow);
  }

  // Generate authentication headers
  generateHeaders(endpoint, payload = {}) {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `${endpoint}|${JSON.stringify(payload)}|${timestamp}`;
    
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(stringToSign)
      .digest('hex');

    return {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
      'X-CLIENT-CODE': this.clientCode,
      'X-TIMESTAMP': timestamp.toString(),
      'X-SIGNATURE': signature,
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Rate limiting check
  async checkRateLimit() {
    if (this.requestCount >= this.maxRequests) {
      throw new Error('Rate limit exceeded. Please wait.');
    }
    this.requestCount++;
  }

  // Make authenticated API request
  async makeRequest(endpoint, method = 'POST', data = {}) {
    try {
      await this.checkRateLimit();
      
      const url = `${this.baseURL}${endpoint}`;
      const headers = this.generateHeaders(endpoint, data);
      
      const config = {
        method,
        url,
        headers,
        timeout: 10000
      };

      if (method === 'POST' && Object.keys(data).length > 0) {
        config.data = data;
      }

      console.log(`🔗 Flattrade API Request: ${method} ${endpoint}`);
      const response = await axios(config);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`❌ Flattrade API Error:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      };
    }
  }

  // Get user profile and limits
  async getUserProfile() {
    const response = await this.makeRequest('UserDetails', 'POST', {
      uid: this.clientCode,
      actid: this.clientCode
    });
    
    if (response.success) {
      return {
        success: true,
        profile: response.data,
        limits: response.data.limits || {}
      };
    }
    return response;
  }

  // Get live market data for symbols
  async getMarketData(symbols = []) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      symbols = ['NSE:NIFTY50-INDEX', 'NSE:BANKNIFTY-INDEX', 'BSE:SENSEX-INDEX'];
    }

    try {
      const marketData = [];
      
      for (const symbol of symbols.slice(0, 10)) { // Limit to 10 symbols per request
        const response = await this.makeRequest('GetQuotes', 'POST', {
          uid: this.clientCode,
          exch: 'NSE',
          token: symbol.split(':')[1] || symbol
        });
        
        if (response.success && response.data) {
          marketData.push({
            symbol: symbol,
            price: parseFloat(response.data.lp || 0),
            change: parseFloat(response.data.c || 0),
            change_pct: parseFloat(response.data.chgp || 0),
            volume: parseInt(response.data.v || 0),
            high: parseFloat(response.data.h || 0),
            low: parseFloat(response.data.l || 0),
            open: parseFloat(response.data.o || 0),
            timestamp: new Date()
          });
        }
      }
      
      return {
        success: true,
        data: marketData,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get top gainers
  async getTopGainers(limit = 10) {
    const response = await this.makeRequest('TopGainersLosers', 'POST', {
      uid: this.clientCode,
      exch: 'NSE',
      strval: 'TopGainers',
      cnt: limit.toString()
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.map(item => ({
          symbol: item.tsym,
          price: parseFloat(item.lp),
          change: parseFloat(item.c),
          change_pct: parseFloat(item.chgp),
          volume: parseInt(item.v || 0)
        }))
      };
    }
    return response;
  }

  // Get top losers
  async getTopLosers(limit = 10) {
    const response = await this.makeRequest('TopGainersLosers', 'POST', {
      uid: this.clientCode,
      exch: 'NSE',
      strval: 'TopLosers',
      cnt: limit.toString()
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.map(item => ({
          symbol: item.tsym,
          price: parseFloat(item.lp),
          change: parseFloat(item.c),
          change_pct: parseFloat(item.chgp),
          volume: parseInt(item.v || 0)
        }))
      };
    }
    return response;
  }

  // Get portfolio holdings
  async getPortfolio() {
    const response = await this.makeRequest('Holdings', 'POST', {
      uid: this.clientCode,
      actid: this.clientCode
    });
    
    if (response.success) {
      return {
        success: true,
        holdings: response.data || [],
        totalValue: response.data?.reduce((sum, holding) => 
          sum + (parseFloat(holding.upldprc || 0) * parseInt(holding.holdqty || 0)), 0) || 0
      };
    }
    return response;
  }

  // Get positions
  async getPositions() {
    const response = await this.makeRequest('PositionBook', 'POST', {
      uid: this.clientCode,
      actid: this.clientCode
    });
    
    if (response.success) {
      return {
        success: true,
        positions: response.data || [],
        totalPnL: response.data?.reduce((sum, pos) => 
          sum + parseFloat(pos.urmtom || 0), 0) || 0
      };
    }
    return response;
  }

  // Place order
  async placeOrder(orderData) {
    const {
      symbol,
      quantity,
      price,
      orderType = 'LIMIT',
      side, // 'BUY' or 'SELL'
      productType = 'MIS' // MIS, CNC, NRML
    } = orderData;

    const response = await this.makeRequest('PlaceOrder', 'POST', {
      uid: this.clientCode,
      actid: this.clientCode,
      exch: 'NSE',
      tsym: symbol,
      qty: quantity.toString(),
      prc: price.toString(),
      prd: productType,
      trantype: side,
      prctyp: orderType,
      ret: 'DAY'
    });
    
    if (response.success) {
      return {
        success: true,
        orderId: response.data?.norenordno,
        message: 'Order placed successfully',
        data: response.data
      };
    }
    return response;
  }

  // Get order book
  async getOrderBook() {
    const response = await this.makeRequest('OrderBook', 'POST', {
      uid: this.clientCode
    });
    
    if (response.success) {
      return {
        success: true,
        orders: response.data || []
      };
    }
    return response;
  }

  // Get trade book
  async getTradeBook() {
    const response = await this.makeRequest('TradeBook', 'POST', {
      uid: this.clientCode,
      actid: this.clientCode
    });
    
    if (response.success) {
      return {
        success: true,
        trades: response.data || []
      };
    }
    return response;
  }

  // Get account limits
  async getLimits() {
    const response = await this.makeRequest('Limits', 'POST', {
      uid: this.clientCode,
      actid: this.clientCode
    });
    
    if (response.success) {
      return {
        success: true,
        limits: response.data,
        availableMargin: parseFloat(response.data?.marginused || 0),
        totalMargin: parseFloat(response.data?.marginused || 0) + parseFloat(response.data?.marginutil || 0)
      };
    }
    return response;
  }

  // Search instruments
  async searchInstruments(query) {
    const response = await this.makeRequest('SearchScrip', 'POST', {
      uid: this.clientCode,
      stext: query
    });
    
    if (response.success) {
      return {
        success: true,
        instruments: response.data?.values || []
      };
    }
    return response;
  }

  // Get historical data
  async getHistoricalData(symbol, interval = '1', days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const response = await this.makeRequest('TPSeries', 'POST', {
      uid: this.clientCode,
      exch: 'NSE',
      token: symbol,
      st: Math.floor(startDate.getTime() / 1000).toString(),
      et: Math.floor(endDate.getTime() / 1000).toString(),
      intrv: interval
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data || [],
        symbol,
        interval,
        period: `${days} days`
      };
    }
    return response;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.getUserProfile();
      return {
        success: response.success,
        provider: 'Flattrade',
        status: response.success ? 'Connected' : 'Error',
        limits: response.limits || {},
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        provider: 'Flattrade',
        status: 'Error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = FlattradeService;
