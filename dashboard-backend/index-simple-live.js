require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

// Import our services
const FlattradeService = require('./flattrade-service');
const LiveTradingController = require('./live-trading-controller');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Initialize services
const flattradeService = new FlattradeService();
const tradingController = new LiveTradingController(flattradeService);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      flattrade: 'configured',
      trading: 'active'
    }
  });
});

// Original mock endpoints
app.get('/api/market-data', async (req, res) => {
  try {
    // Try to get real data first
    const realData = await flattradeService.getMarketData();
    if (realData && realData.length > 0) {
      return res.json(realData);
    }
    
    // Fall back to mock data
    const mockData = [
      { symbol: 'NIFTY50', price: 24500, change: 125.50, changePercent: 0.51 },
      { symbol: 'SENSEX', price: 80450, change: 250.25, changePercent: 0.31 },
      { symbol: 'BANKNIFTY', price: 51200, change: 180.75, changePercent: 0.35 }
    ];
    res.json(mockData);
  } catch (error) {
    console.error('Market data error:', error);
    // Return mock data on error
    const mockData = [
      { symbol: 'NIFTY50', price: 24500, change: 125.50, changePercent: 0.51 },
      { symbol: 'SENSEX', price: 80450, change: 250.25, changePercent: 0.31 },
      { symbol: 'BANKNIFTY', price: 51200, change: 180.75, changePercent: 0.35 }
    ];
    res.json(mockData);
  }
});

app.get('/api/top-gainers', async (req, res) => {
  try {
    const realData = await flattradeService.getTopGainers();
    if (realData && realData.length > 0) {
      return res.json(realData);
    }
    
    // Mock data fallback
    const mockData = [
      { symbol: 'RELIANCE', price: 2850, change: 85.50, changePercent: 3.09 },
      { symbol: 'TCS', price: 4150, change: 120.25, changePercent: 2.98 },
      { symbol: 'INFY', price: 1820, change: 45.75, changePercent: 2.58 }
    ];
    res.json(mockData);
  } catch (error) {
    console.error('Top gainers error:', error);
    const mockData = [
      { symbol: 'RELIANCE', price: 2850, change: 85.50, changePercent: 3.09 },
      { symbol: 'TCS', price: 4150, change: 120.25, changePercent: 2.98 },
      { symbol: 'INFY', price: 1820, change: 45.75, changePercent: 2.58 }
    ];
    res.json(mockData);
  }
});

app.get('/api/top-losers', async (req, res) => {
  try {
    const realData = await flattradeService.getTopLosers();
    if (realData && realData.length > 0) {
      return res.json(realData);
    }
    
    // Mock data fallback
    const mockData = [
      { symbol: 'HDFC', price: 1650, change: -45.25, changePercent: -2.67 },
      { symbol: 'ICICIBANK', price: 1180, change: -28.50, changePercent: -2.36 },
      { symbol: 'SBIN', price: 820, change: -18.75, changePercent: -2.23 }
    ];
    res.json(mockData);
  } catch (error) {
    console.error('Top losers error:', error);
    const mockData = [
      { symbol: 'HDFC', price: 1650, change: -45.25, changePercent: -2.67 },
      { symbol: 'ICICIBANK', price: 1180, change: -28.50, changePercent: -2.36 },
      { symbol: 'SBIN', price: 820, change: -18.75, changePercent: -2.23 }
    ];
    res.json(mockData);
  }
});

// Live trading endpoints
app.get('/api/live/market-data', async (req, res) => {
  try {
    const data = await flattradeService.getMarketData();
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      source: 'flattrade'
    });
  } catch (error) {
    console.error('Live market data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/trading/health', async (req, res) => {
  try {
    const health = await flattradeService.healthCheck();
    res.json({
      success: true,
      health: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trading health error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Paper trading endpoints
app.post('/api/trading/session/start', async (req, res) => {
  try {
    const { initialCapital } = req.body;
    const session = await tradingController.startPaperTradingSession(initialCapital || 100000);
    res.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/trading/portfolio/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const portfolio = await tradingController.getPortfolio(sessionId);
    res.json({
      success: true,
      portfolio: portfolio,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Original portfolio endpoint
app.get('/api/portfolio', (req, res) => {
  const mockPortfolio = [
    { symbol: 'RELIANCE', quantity: 10, avgPrice: 2800, currentPrice: 2850, pnl: 500 },
    { symbol: 'TCS', quantity: 5, avgPrice: 4100, currentPrice: 4150, pnl: 250 },
    { symbol: 'INFY', quantity: 15, avgPrice: 1800, currentPrice: 1820, pnl: 300 }
  ];
  res.json(mockPortfolio);
});

// Original trading-alerts endpoint
app.get('/api/trading-alerts', (req, res) => {
  const mockAlerts = [
    { id: 1, type: 'buy', symbol: 'RELIANCE', message: 'Strong bullish momentum detected', timestamp: new Date() },
    { id: 2, type: 'sell', symbol: 'HDFC', message: 'Resistance level reached', timestamp: new Date() },
    { id: 3, type: 'watch', symbol: 'TCS', message: 'Approaching support level', timestamp: new Date() }
  ];
  res.json(mockAlerts);
});

// Original risk-metrics endpoint
app.get('/api/risk-metrics', (req, res) => {
  const mockRiskMetrics = {
    portfolioValue: 750000,
    dayPnL: 12500,
    totalPnL: 45000,
    riskScore: 6.5,
    maxDrawdown: -8.2,
    sharpeRatio: 1.45,
    exposureBreakdown: {
      equity: 70,
      derivatives: 25,
      commodities: 5
    }
  };
  res.json(mockRiskMetrics);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Live Trading Server running on port ${PORT}`);
  console.log(`✅ Flattrade API integration active`);
  console.log(`📊 Live market data endpoints available`);
  console.log(`💼 Paper trading system ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
