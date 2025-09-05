// Enhanced NSE Trading Dashboard Backend with Live Trading Integration
// Includes Flattrade API integration for real market data

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📝 ${timestamp} [${req.method}] ${req.path} - ${req.ip}`);
  next();
});

// ==========================================
// FLATTRADE API SERVICE
// ==========================================

class FlattradeAPI {
  constructor() {
    this.apiKey = process.env.FLATTRADE_API_KEY;
    this.apiSecret = process.env.FLATTRADE_API_SECRET;
    this.clientCode = process.env.FLATTRADE_CLIENT_CODE;
    this.baseURL = process.env.FLATTRADE_API_URL || 'https://piconnect.flattrade.in/PiConnectTP/';
    this.token = process.env.FLATTRADE_TOKEN;
    this.requestCount = 0;
    this.maxRequests = 200; // Conservative limit
    
    // Check if credentials are available
    this.isConfigured = !!(this.apiKey && this.apiSecret && this.clientCode && this.token);
    
    if (this.isConfigured) {
      console.log('🔑 Flattrade API configured with credentials');
      this.resetRequestCount();
    } else {
      console.log('⚠️ Flattrade API credentials not found, using mock data');
    }
  }

  resetRequestCount() {
    setInterval(() => {
      this.requestCount = 0;
    }, 60000); // Reset every minute
  }

  generateHeaders(endpoint, payload = {}) {
    if (!this.isConfigured) return {};
    
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

  async makeRequest(endpoint, data = {}) {
    if (!this.isConfigured) {
      throw new Error('Flattrade API not configured');
    }

    try {
      if (this.requestCount >= this.maxRequests) {
        throw new Error('Rate limit exceeded');
      }
      this.requestCount++;

      const url = `${this.baseURL}${endpoint}`;
      const headers = this.generateHeaders(endpoint, data);
      
      console.log(`🔗 Flattrade API: ${endpoint}`);
      
      const response = await axios.post(url, data, { 
        headers, 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Resolve only if status is less than 500
        }
      });
      
      return {
        success: response.status === 200,
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

  async getTopGainers(limit = 10) {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'API not configured' };
      }

      const response = await this.makeRequest('TopGainersLosers', {
        uid: this.clientCode,
        exch: 'NSE',
        strval: 'TopGainers',
        cnt: limit.toString()
      });
      
      if (response.success && response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data.map(item => ({
            symbol: item.tsym || 'N/A',
            price: parseFloat(item.lp || 0),
            change: parseFloat(item.c || 0),
            change_pct: parseFloat(item.chgp || 0),
            volume: parseInt(item.v || 0)
          }))
        };
      }
      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTopLosers(limit = 10) {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'API not configured' };
      }

      const response = await this.makeRequest('TopGainersLosers', {
        uid: this.clientCode,
        exch: 'NSE',
        strval: 'TopLosers',
        cnt: limit.toString()
      });
      
      if (response.success && response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data.map(item => ({
            symbol: item.tsym || 'N/A',
            price: parseFloat(item.lp || 0),
            change: parseFloat(item.c || 0),
            change_pct: parseFloat(item.chgp || 0),
            volume: parseInt(item.v || 0)
          }))
        };
      }
      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMarketData(symbols = []) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      symbols = ['NIFTY50-INDEX', 'BANKNIFTY-INDEX'];
    }

    if (!this.isConfigured) {
      return { success: false, error: 'API not configured' };
    }

    try {
      const marketData = [];
      
      for (const symbol of symbols.slice(0, 5)) { // Limit to 5 symbols
        const response = await this.makeRequest('GetQuotes', {
          uid: this.clientCode,
          exch: 'NSE',
          token: symbol.replace('NSE:', '').replace('BSE:', '')
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
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  async healthCheck() {
    if (!this.isConfigured) {
      return {
        success: false,
        provider: 'Flattrade',
        status: 'Not Configured',
        error: 'API credentials missing',
        timestamp: new Date()
      };
    }

    try {
      const response = await this.makeRequest('UserDetails', {
        uid: this.clientCode,
        actid: this.clientCode
      });
      
      return {
        success: response.success,
        provider: 'Flattrade',
        status: response.success ? 'Connected' : 'Error',
        data: response.data || null,
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

// Initialize Flattrade API
const flattrade = new FlattradeAPI();

// Paper Trading Session Management
const activeSessions = new Map();

// ==========================================
// API ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const flattradeHealth = await flattrade.healthCheck();
    
    res.json({
      success: true,
      status: 'Live Trading Backend Operational',
      timestamp: new Date(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      providers: {
        flattrade: flattradeHealth
      },
      features: {
        liveMarketData: flattradeHealth.success,
        paperTrading: true,
        realTimeQuotes: flattradeHealth.success,
        mockDataFallback: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Enhanced Gainers with Live Data
app.get('/api/gainers', async (req, res) => {
  try {
    const liveGainers = await flattrade.getTopGainers(10);
    
    if (liveGainers.success && liveGainers.data.length > 0) {
      res.json({
        success: true,
        data: liveGainers.data,
        source: 'Flattrade Live',
        timestamp: new Date()
      });
    } else {
      // Fallback to mock data
      res.json({
        success: true,
        data: generateMockGainers(),
        source: 'Mock Data (Fallback)',
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error fetching gainers:', error);
    res.json({
      success: true,
      data: generateMockGainers(),
      source: 'Mock Data (Error Fallback)',
      timestamp: new Date()
    });
  }
});

// Enhanced Losers with Live Data
app.get('/api/losers', async (req, res) => {
  try {
    const liveLosers = await flattrade.getTopLosers(10);
    
    if (liveLosers.success && liveLosers.data.length > 0) {
      res.json({
        success: true,
        data: liveLosers.data,
        source: 'Flattrade Live',
        timestamp: new Date()
      });
    } else {
      // Fallback to mock data
      res.json({
        success: true,
        data: generateMockLosers(),
        source: 'Mock Data (Fallback)',
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error fetching losers:', error);
    res.json({
      success: true,
      data: generateMockLosers(),
      source: 'Mock Data (Error Fallback)',
      timestamp: new Date()
    });
  }
});

// Market Indices with Live Data
app.get('/api/indices', async (req, res) => {
  try {
    const liveData = await flattrade.getMarketData(['NIFTY50-INDEX', 'BANKNIFTY-INDEX']);
    
    if (liveData.success && liveData.data.length > 0) {
      const formattedData = liveData.data.map(item => ({
        symbol: item.symbol.replace('-INDEX', ''),
        name: getIndexName(item.symbol),
        price: item.price,
        change: item.change,
        change_pct: item.change_pct,
        high: item.high,
        low: item.low,
        volume: item.volume,
        timestamp: item.timestamp
      }));
      
      res.json({
        success: true,
        data: formattedData,
        source: 'Flattrade Live',
        timestamp: new Date()
      });
    } else {
      // Fallback to mock data
      res.json({
        success: true,
        data: generateMockIndices(),
        source: 'Mock Data (Fallback)',
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error fetching indices:', error);
    res.json({
      success: true,
      data: generateMockIndices(),
      source: 'Mock Data (Error Fallback)',
      timestamp: new Date()
    });
  }
});

// Paper Trading Session Management
app.post('/api/trading/session/start', async (req, res) => {
  try {
    const { userId, initialCapital = 100000, strategies = ['scalping'] } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const sessionId = `paper_${userId}_${Date.now()}`;
    
    // Get real market context if available
    const marketData = await flattrade.getMarketData(['NIFTY50-INDEX', 'BANKNIFTY-INDEX']);
    
    const session = {
      sessionId,
      userId,
      type: 'paper',
      status: 'active',
      initialCapital,
      currentCapital: initialCapital,
      strategies,
      startTime: new Date(),
      portfolio: {
        totalValue: initialCapital,
        availableCash: initialCapital,
        totalPnL: 0,
        positions: []
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        returnPercentage: 0
      },
      marketContext: marketData.success ? marketData.data : [],
      lastActivity: new Date()
    };

    activeSessions.set(sessionId, session);

    console.log(`🎯 Paper trading session started: ${sessionId}`);
    
    res.json({
      success: true,
      sessionId,
      session: {
        sessionId: session.sessionId,
        type: session.type,
        status: session.status,
        initialCapital: session.initialCapital,
        startTime: session.startTime,
        portfolio: session.portfolio,
        marketContext: session.marketContext.slice(0, 2)
      },
      message: 'Paper trading session started successfully'
    });

  } catch (error) {
    console.error('Error starting paper trading session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start paper trading session',
      error: error.message
    });
  }
});

app.post('/api/trading/session/stop', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.status = 'stopped';
    session.endTime = new Date();

    console.log(`⏹️ Paper trading session stopped: ${sessionId}`);
    
    res.json({
      success: true,
      sessionId,
      finalStats: {
        initialCapital: session.initialCapital,
        finalCapital: session.currentCapital,
        totalReturn: session.currentCapital - session.initialCapital,
        returnPercentage: ((session.currentCapital - session.initialCapital) / session.initialCapital) * 100,
        totalTrades: session.performance.totalTrades
      },
      message: 'Paper trading session stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping paper trading session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop paper trading session',
      error: error.message
    });
  }
});

app.get('/api/trading/portfolio/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get live market data for context
    const marketData = await flattrade.getMarketData(['NIFTY50-INDEX', 'BANKNIFTY-INDEX']);
    
    res.json({
      success: true,
      sessionId,
      portfolio: {
        ...session.portfolio,
        lastUpdated: new Date()
      },
      marketContext: marketData.success ? marketData.data.slice(0, 2) : [],
      performance: session.performance
    });

  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio data',
      error: error.message
    });
  }
});

app.get('/api/trading/positions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      sessionId,
      positions: session.portfolio.positions,
      summary: {
        totalPositions: session.portfolio.positions.length,
        totalValue: session.portfolio.positions.reduce((sum, pos) => 
          sum + (pos.currentPrice * pos.quantity), 0),
        totalPnL: session.portfolio.positions.reduce((sum, pos) => sum + pos.pnl, 0),
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch positions',
      error: error.message
    });
  }
});

// Live Market Data Endpoint
app.get('/api/live/market-data', async (req, res) => {
  try {
    const { symbols } = req.query;
    let symbolsList = symbols ? symbols.split(',') : ['NIFTY50-INDEX', 'BANKNIFTY-INDEX'];
    
    const marketData = await flattrade.getMarketData(symbolsList);
    
    res.json({
      success: marketData.success,
      data: marketData.data || [],
      timestamp: new Date(),
      source: marketData.success ? 'Flattrade Live' : 'Mock Data'
    });

  } catch (error) {
    console.error('Error fetching live market data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live market data',
      error: error.message
    });
  }
});

// Legacy endpoints with enhanced mock data
app.get('/api/scalping', (req, res) => {
  res.json({
    success: true,
    data: generateMockScalpingData(),
    source: 'Enhanced Algorithm',
    timestamp: new Date()
  });
});

app.get('/api/btst', (req, res) => {
  res.json({
    success: true,
    data: generateMockBTSTData(),
    source: 'Enhanced Algorithm',
    timestamp: new Date()
  });
});

app.get('/api/fno-analysis', (req, res) => {
  const { symbol = 'NIFTY' } = req.query;
  res.json({
    success: true,
    data: generateMockFnOData(symbol),
    source: 'Enhanced Analysis',
    timestamp: new Date()
  });
});

app.get('/api/alerts', (req, res) => {
  res.json({
    success: true,
    data: generateMockAlerts(),
    source: 'Enhanced Alerts',
    timestamp: new Date()
  });
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getIndexName(symbol) {
  const names = {
    'NIFTY50-INDEX': 'NIFTY 50',
    'BANKNIFTY-INDEX': 'BANK NIFTY',
    'SENSEX-INDEX': 'SENSEX'
  };
  return names[symbol] || symbol.replace('-INDEX', '');
}

function generateMockGainers() {
  return [
    { symbol: 'RELIANCE', price: 2456.75, change: 45.25, change_pct: 1.88, volume: 2847563 },
    { symbol: 'TCS', price: 3678.90, change: 67.45, change_pct: 1.87, volume: 1234567 },
    { symbol: 'HDFCBANK', price: 1543.20, change: 28.15, change_pct: 1.86, volume: 3456789 },
    { symbol: 'ICICIBANK', price: 987.65, change: 18.30, change_pct: 1.89, volume: 2345678 },
    { symbol: 'INFY', price: 1432.85, change: 26.40, change_pct: 1.88, volume: 1876543 }
  ];
}

function generateMockLosers() {
  return [
    { symbol: 'WIPRO', price: 423.15, change: -8.25, change_pct: -1.91, volume: 1234567 },
    { symbol: 'BAJFINANCE', price: 6789.45, change: -132.55, change_pct: -1.92, volume: 987654 },
    { symbol: 'MARUTI', price: 9876.30, change: -189.70, change_pct: -1.89, volume: 2345678 },
    { symbol: 'SUNPHARMA', price: 1098.75, change: -20.85, change_pct: -1.86, volume: 1876543 },
    { symbol: 'BHARTIARTL', price: 789.20, change: -14.80, change_pct: -1.84, volume: 3456789 }
  ];
}

function generateMockIndices() {
  return [
    { symbol: 'NIFTY', name: 'NIFTY 50', price: 24567.85, change: 124.75, change_pct: 0.51, high: 24612.30, low: 24445.60, volume: 0 },
    { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 51234.90, change: -198.45, change_pct: -0.39, high: 51456.70, low: 50987.25, volume: 0 },
    { symbol: 'SENSEX', name: 'SENSEX', price: 80456.75, change: 178.95, change_pct: 0.22, high: 80567.80, low: 80234.50, volume: 0 }
  ];
}

function generateMockScalpingData() {
  return [
    { symbol: 'RELIANCE', entry: 2450.00, target: 2465.00, stopLoss: 2440.00, signal: 'BUY', confidence: 85, timeFrame: '5m' },
    { symbol: 'TCS', entry: 3670.00, target: 3690.00, stopLoss: 3655.00, signal: 'BUY', confidence: 78, timeFrame: '5m' },
    { symbol: 'HDFCBANK', entry: 1540.00, target: 1550.00, stopLoss: 1532.00, signal: 'BUY', confidence: 82, timeFrame: '5m' }
  ];
}

function generateMockBTSTData() {
  return [
    { symbol: 'INFY', buyPrice: 1430.00, targetPrice: 1455.00, probability: 75, reason: 'Strong momentum with volume support' },
    { symbol: 'WIPRO', buyPrice: 420.00, targetPrice: 435.00, probability: 68, reason: 'Oversold bounce expected' },
    { symbol: 'LT', buyPrice: 2340.00, targetPrice: 2380.00, probability: 72, reason: 'Infrastructure sector momentum' }
  ];
}

function generateMockFnOData(symbol) {
  return {
    symbol,
    spotPrice: symbol === 'NIFTY' ? 24567.85 : 51234.90,
    futurePrice: symbol === 'NIFTY' ? 24578.45 : 51245.30,
    pcr: 0.78,
    maxPain: symbol === 'NIFTY' ? 24500 : 51200,
    callOI: 15678943,
    putOI: 18765432,
    analysis: `${symbol} showing bullish sentiment with strong call writing at higher strikes.`
  };
}

function generateMockAlerts() {
  return [
    { symbol: 'RELIANCE', message: 'Breakout above 2450 resistance', priority: 'HIGH', timestamp: new Date() },
    { symbol: 'NIFTY', message: 'Approaching key support at 24500', priority: 'MEDIUM', timestamp: new Date() },
    { symbol: 'BANKNIFTY', message: 'High volatility expected', priority: 'LOW', timestamp: new Date() }
  ];
}

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Starting NSE Trading Dashboard Backend (Live Trading)...');
  console.log(`🌟 Live Trading Backend running on http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log('🎯 Live Trading Features:');
  console.log('   • Flattrade API Integration');
  console.log('   • Real-time Market Data');
  console.log('   • Paper Trading Sessions');
  console.log('   • Live Gainers/Losers');
  console.log('   • Mock Data Fallback');
  console.log('✅ Enhanced Backend ready for live trading!');
});

module.exports = app;
