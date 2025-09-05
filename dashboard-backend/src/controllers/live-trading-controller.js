// Live Trading Controller - Real Market Integration
// Handles live trading operations with Flattrade API

const FlattradeService = require('../services/flattrade-service');

class LiveTradingController {
  constructor() {
    this.flattrade = new FlattradeService();
    this.activeSessions = new Map();
    this.portfolioCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Paper Trading Session Management (Enhanced with Real Market Data)
  async startPaperTradingSession(req, res) {
    try {
      const { userId, initialCapital = 100000, strategies = ['scalping'] } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Generate session ID
      const sessionId = `paper_${userId}_${Date.now()}`;
      
      // Get real market data for session initialization
      const marketData = await this.flattrade.getMarketData([
        'NSE:NIFTY50-INDEX', 
        'NSE:BANKNIFTY-INDEX', 
        'BSE:SENSEX-INDEX'
      ]);

      // Create paper trading session with real market context
      const session = {
        sessionId,
        userId,
        type: 'paper',
        status: 'active',
        initialCapital,
        currentCapital: initialCapital,
        availableMargin: initialCapital * 0.8, // 80% margin
        strategies,
        startTime: new Date(),
        portfolio: {
          totalValue: initialCapital,
          investedValue: 0,
          availableCash: initialCapital,
          totalPnL: 0,
          dayPnL: 0,
          positions: [],
          holdings: []
        },
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          returnPercentage: 0
        },
        riskMetrics: {
          maxPositionSize: initialCapital * 0.1, // 10% per position
          stopLossPercentage: 2, // 2% stop loss
          dailyLossLimit: initialCapital * 0.05, // 5% daily loss limit
          riskRewardRatio: 2
        },
        marketContext: marketData.success ? marketData.data : [],
        lastActivity: new Date()
      };

      // Store session
      this.activeSessions.set(sessionId, session);

      console.log(`🎯 Paper trading session started: ${sessionId} for user: ${userId}`);
      
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
          riskMetrics: session.riskMetrics,
          marketContext: session.marketContext.slice(0, 3) // Send only key indices
        },
        message: 'Paper trading session started with real market data'
      });

    } catch (error) {
      console.error('Error starting paper trading session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start paper trading session',
        error: error.message
      });
    }
  }

  // Stop Paper Trading Session
  async stopPaperTradingSession(req, res) {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Update session status
      session.status = 'stopped';
      session.endTime = new Date();
      session.duration = session.endTime - session.startTime;

      // Calculate final performance metrics
      session.performance.returnPercentage = 
        ((session.currentCapital - session.initialCapital) / session.initialCapital) * 100;

      console.log(`⏹️ Paper trading session stopped: ${sessionId}`);
      
      res.json({
        success: true,
        sessionId,
        finalStats: {
          duration: session.duration,
          initialCapital: session.initialCapital,
          finalCapital: session.currentCapital,
          totalReturn: session.currentCapital - session.initialCapital,
          returnPercentage: session.performance.returnPercentage,
          totalTrades: session.performance.totalTrades,
          winRate: session.performance.winRate
        },
        message: 'Paper trading session stopped successfully'
      });

      // Keep session for analysis but mark as inactive
      setTimeout(() => {
        this.activeSessions.delete(sessionId);
      }, 3600000); // Remove after 1 hour

    } catch (error) {
      console.error('Error stopping paper trading session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop paper trading session',
        error: error.message
      });
    }
  }

  // Get Live Portfolio Data
  async getPortfolio(req, res) {
    try {
      const { sessionId } = req.params;
      
      // Check cache first
      const cacheKey = `portfolio_${sessionId}`;
      const cached = this.portfolioCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return res.json(cached.data);
      }

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // For paper trading, get real market data to update portfolio values
      let marketData = { success: false, data: [] };
      if (session.portfolio.positions.length > 0) {
        const symbols = session.portfolio.positions.map(pos => pos.symbol);
        marketData = await this.flattrade.getMarketData(symbols);
      }

      // Update portfolio with real market prices
      if (marketData.success) {
        session.portfolio.positions.forEach(position => {
          const marketPrice = marketData.data.find(m => m.symbol === position.symbol);
          if (marketPrice) {
            position.currentPrice = marketPrice.price;
            position.pnl = (marketPrice.price - position.averagePrice) * position.quantity;
            position.pnlPercentage = ((marketPrice.price - position.averagePrice) / position.averagePrice) * 100;
          }
        });

        // Recalculate portfolio totals
        session.portfolio.totalPnL = session.portfolio.positions.reduce((sum, pos) => sum + pos.pnl, 0);
        session.portfolio.totalValue = session.portfolio.availableCash + 
          session.portfolio.positions.reduce((sum, pos) => sum + (pos.currentPrice * pos.quantity), 0);
      }

      // Get live market context
      const liveMarketData = await this.flattrade.getMarketData();
      
      const portfolioData = {
        success: true,
        sessionId,
        portfolio: {
          ...session.portfolio,
          lastUpdated: new Date()
        },
        marketContext: liveMarketData.success ? liveMarketData.data.slice(0, 5) : [],
        performance: session.performance
      };

      // Cache the result
      this.portfolioCache.set(cacheKey, {
        data: portfolioData,
        timestamp: Date.now()
      });

      res.json(portfolioData);

    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch portfolio data',
        error: error.message
      });
    }
  }

  // Get Live Positions
  async getPositions(req, res) {
    try {
      const { sessionId } = req.params;
      
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Get real-time quotes for all positions
      if (session.portfolio.positions.length > 0) {
        const symbols = session.portfolio.positions.map(pos => pos.symbol);
        const marketData = await this.flattrade.getMarketData(symbols);
        
        if (marketData.success) {
          // Update positions with live prices
          session.portfolio.positions.forEach(position => {
            const liveQuote = marketData.data.find(quote => quote.symbol === position.symbol);
            if (liveQuote) {
              position.currentPrice = liveQuote.price;
              position.change = liveQuote.change;
              position.changePercent = liveQuote.change_pct;
              position.pnl = (liveQuote.price - position.averagePrice) * position.quantity;
              position.pnlPercentage = ((liveQuote.price - position.averagePrice) / position.averagePrice) * 100;
              position.lastUpdated = new Date();
            }
          });
        }
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
  }

  // Get Live Market Data
  async getLiveMarketData(req, res) {
    try {
      const { symbols } = req.query;
      let symbolsList = [];

      if (symbols) {
        symbolsList = symbols.split(',').map(s => s.trim());
      } else {
        // Default symbols
        symbolsList = [
          'NSE:NIFTY50-INDEX',
          'NSE:BANKNIFTY-INDEX', 
          'BSE:SENSEX-INDEX',
          'NSE:RELIANCE',
          'NSE:TCS'
        ];
      }

      const marketData = await this.flattrade.getMarketData(symbolsList);
      
      res.json({
        success: marketData.success,
        data: marketData.data || [],
        timestamp: new Date(),
        source: 'Flattrade Live',
        symbols: symbolsList
      });

    } catch (error) {
      console.error('Error fetching live market data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch live market data',
        error: error.message
      });
    }
  }

  // Get Top Gainers (Live)
  async getTopGainers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const gainers = await this.flattrade.getTopGainers(parseInt(limit));
      
      res.json({
        success: gainers.success,
        data: gainers.data || [],
        source: 'Flattrade Live',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error fetching top gainers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top gainers',
        error: error.message
      });
    }
  }

  // Get Top Losers (Live)
  async getTopLosers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const losers = await this.flattrade.getTopLosers(parseInt(limit));
      
      res.json({
        success: losers.success,
        data: losers.data || [],
        source: 'Flattrade Live',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error fetching top losers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top losers',
        error: error.message
      });
    }
  }

  // API Health Check
  async healthCheck(req, res) {
    try {
      const flattradeHealth = await this.flattrade.healthCheck();
      
      res.json({
        success: true,
        status: 'Live Trading Ready',
        providers: {
          flattrade: flattradeHealth
        },
        activeSessions: this.activeSessions.size,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error in health check:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }

  // Search Instruments
  async searchInstruments(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const results = await this.flattrade.searchInstruments(query);
      
      res.json({
        success: results.success,
        data: results.instruments || [],
        query,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error searching instruments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search instruments',
        error: error.message
      });
    }
  }
}

module.exports = LiveTradingController;
