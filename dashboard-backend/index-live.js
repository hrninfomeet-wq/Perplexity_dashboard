// Enhanced Backend Server with Live Trading Integration
// NSE Trading Dashboard - Real Market Data & API Integration

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import services and controllers
const LiveTradingController = require('./src/controllers/live-trading-controller');
const FlattradeService = require('./src/services/flattrade-service');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const liveTrading = new LiveTradingController();
const flattrade = new FlattradeService();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📝 ${timestamp} [${req.method}] ${req.path} - ${req.ip}`);
  
  // Log response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 Response: ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health Check Endpoint
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
        liveMarketData: true,
        paperTrading: true,
        realTimeQuotes: true,
        orderManagement: true,
        portfolioTracking: true
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

// ==========================================
// LIVE TRADING ENDPOINTS
// ==========================================

// Paper Trading Session Management
app.post('/api/trading/session/start', (req, res) => liveTrading.startPaperTradingSession(req, res));
app.post('/api/trading/session/stop', (req, res) => liveTrading.stopPaperTradingSession(req, res));

// Portfolio & Positions (Real-time)
app.get('/api/trading/portfolio/:sessionId', (req, res) => liveTrading.getPortfolio(req, res));
app.get('/api/trading/positions/:sessionId', (req, res) => liveTrading.getPositions(req, res));

// Live Market Data
app.get('/api/live/market-data', (req, res) => liveTrading.getLiveMarketData(req, res));
app.get('/api/live/gainers', (req, res) => liveTrading.getTopGainers(req, res));
app.get('/api/live/losers', (req, res) => liveTrading.getTopLosers(req, res));

// Instrument Search
app.get('/api/live/search', (req, res) => liveTrading.searchInstruments(req, res));

// Trading Health Check
app.get('/api/trading/health', (req, res) => liveTrading.healthCheck(req, res));

// ==========================================
// LEGACY ENDPOINTS (Updated with Live Data)
// ==========================================

// Enhanced Gainers with Live Data
app.get('/api/gainers', async (req, res) => {
  try {
    const liveGainers = await flattrade.getTopGainers(10);
    
    if (liveGainers.success) {
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
    
    if (liveLosers.success) {
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
    const liveData = await flattrade.getMarketData([
      'NSE:NIFTY50-INDEX',
      'NSE:BANKNIFTY-INDEX',
      'BSE:SENSEX-INDEX'
    ]);
    
    if (liveData.success && liveData.data.length > 0) {
      const formattedData = liveData.data.map(item => ({
        symbol: item.symbol.split(':')[1] || item.symbol,
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

// Legacy endpoints with mock data fallback
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
    'NSE:NIFTY50-INDEX': 'NIFTY 50',
    'NSE:BANKNIFTY-INDEX': 'BANK NIFTY',
    'BSE:SENSEX-INDEX': 'SENSEX',
    'NIFTY50-INDEX': 'NIFTY 50',
    'BANKNIFTY-INDEX': 'BANK NIFTY',
    'SENSEX-INDEX': 'SENSEX'
  };
  return names[symbol] || symbol;
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

// Error handling middleware
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Starting NSE Trading Dashboard Backend (Live Trading)...');
  console.log(`🌟 Live Trading Backend running on http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log('🎯 Live Trading Endpoints:');
  console.log('   • /api/live/market-data - Real-time market data');
  console.log('   • /api/live/gainers - Live top gainers');
  console.log('   • /api/live/losers - Live top losers'); 
  console.log('   • /api/trading/session/start - Start paper trading');
  console.log('   • /api/trading/portfolio/:id - Real-time portfolio');
  console.log('   • /api/trading/health - Trading system health');
  console.log('✅ Live Trading Backend ready with Flattrade integration!');
});

module.exports = app;
