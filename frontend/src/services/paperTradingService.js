// frontend/src/services/paperTradingService.js
import websocketService from './websocketService';

class PaperTradingService {
  constructor() {
    this.activeSession = null;
    this.sessionHistory = [];
    this.callbacks = {
      onSessionUpdate: [],
      onTradeExecuted: [],
      onPortfolioUpdate: [],
      onError: []
    };

    // Initialize WebSocket listeners
    this.initializeWebSocketListeners();
  }

  // Initialize WebSocket event listeners
  initializeWebSocketListeners() {
    websocketService.on('onTradeUpdate', (data) => {
      if (data.type === 'session_started') {
        this.handleSessionStarted(data.data);
      } else if (data.type === 'session_stopped') {
        this.handleSessionStopped(data.data);
      } else if (data.type === 'trade_executed') {
        this.handleTradeExecuted(data.data);
      }
    });

    websocketService.on('onPortfolioUpdate', (data) => {
      this.handlePortfolioUpdate(data);
    });

    websocketService.on('onError', (error) => {
      if (error.type === 'risk_alert') {
        this.handleRiskAlert(error);
      }
    });
  }

  // Start paper trading session
  async startSession(userId, options = {}) {
    try {
      const sessionOptions = {
        userId,
        startingCapital: options.startingCapital || 100000,
        strategy: options.strategy || 'manual',
        riskLevel: options.riskLevel || 'medium',
        autoExecution: options.autoExecution || false,
        timeframes: options.timeframes || ['5m'],
        maxPositions: options.maxPositions || 10,
        stopLoss: options.stopLoss || 2, // 2% default stop loss
        takeProfit: options.takeProfit || 5, // 5% default take profit
        maxDailyLoss: options.maxDailyLoss || 5, // 5% max daily loss
        leverage: options.leverage || 1,
        allowedSymbols: options.allowedSymbols || ['NIFTY 50', 'BANKNIFTY'],
        ...options
      };

      // Send start session request to backend
      const response = await fetch('/api/paper-trading/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionOptions)
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }

      const sessionData = await response.json();
      
      // Set active session
      this.activeSession = {
        ...sessionData,
        startTime: new Date().toISOString(),
        status: 'active',
        trades: [],
        portfolio: {
          totalCapital: sessionOptions.startingCapital,
          availableCapital: sessionOptions.startingCapital,
          investedAmount: 0,
          currentValue: sessionOptions.startingCapital,
          dayPnL: 0,
          totalPnL: 0,
          totalReturnPercentage: 0
        },
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
          maxDrawdown: 0
        }
      };

      // Subscribe to session updates via WebSocket
      if (websocketService.isSocketConnected()) {
        websocketService.subscribeToSession(sessionData.sessionId);
      }

      // Notify listeners
      this.notifySessionUpdate(this.activeSession);

      console.log('📊 Paper trading session started:', this.activeSession);
      return this.activeSession;

    } catch (error) {
      console.error('Failed to start paper trading session:', error);
      this.notifyError(error);
      throw error;
    }
  }

  // Stop paper trading session
  async stopSession(sessionId) {
    try {
      if (!this.activeSession || this.activeSession.sessionId !== sessionId) {
        throw new Error('No active session found');
      }

      // Send stop session request to backend
      const response = await fetch('/api/paper-trading/session/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error(`Failed to stop session: ${response.statusText}`);
      }

      const result = await response.json();

      // Update session status
      this.activeSession.status = 'stopped';
      this.activeSession.endTime = new Date().toISOString();
      this.activeSession.finalPerformance = result.performance;

      // Add to session history
      this.sessionHistory.unshift({ ...this.activeSession });

      // Clear active session
      const stoppedSession = this.activeSession;
      this.activeSession = null;

      // Notify listeners
      this.notifySessionUpdate(null);

      console.log('⏹️ Paper trading session stopped:', stoppedSession);
      return stoppedSession;

    } catch (error) {
      console.error('Failed to stop paper trading session:', error);
      this.notifyError(error);
      throw error;
    }
  }

  // Execute trade (manual or auto)
  async executeTrade(tradeData) {
    try {
      if (!this.activeSession) {
        throw new Error('No active trading session');
      }

      const trade = {
        sessionId: this.activeSession.sessionId,
        symbol: tradeData.symbol,
        side: tradeData.side, // 'buy' or 'sell'
        quantity: tradeData.quantity,
        orderType: tradeData.orderType || 'market',
        price: tradeData.price,
        stopLoss: tradeData.stopLoss,
        takeProfit: tradeData.takeProfit,
        strategy: tradeData.strategy || 'manual',
        confidence: tradeData.confidence || 0,
        timestamp: new Date().toISOString()
      };

      // Validate trade before execution
      const validation = await this.validateTrade(trade);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Send trade execution request
      const response = await fetch('/api/paper-trading/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trade)
      });

      if (!response.ok) {
        throw new Error(`Trade execution failed: ${response.statusText}`);
      }

      const executedTrade = await response.json();
      
      // Update local session data
      this.activeSession.trades.push(executedTrade);
      this.updateSessionPerformance();

      // Notify listeners
      this.notifyTradeExecuted(executedTrade);

      console.log('✅ Trade executed:', executedTrade);
      return executedTrade;

    } catch (error) {
      console.error('Trade execution failed:', error);
      this.notifyError(error);
      throw error;
    }
  }

  // Validate trade before execution
  async validateTrade(trade) {
    try {
      // Check available capital
      const requiredCapital = trade.quantity * trade.price;
      if (trade.side === 'buy' && this.activeSession.portfolio.availableCapital < requiredCapital) {
        return { valid: false, error: 'Insufficient capital' };
      }

      // Check position limits
      if (this.activeSession.trades.filter(t => t.status === 'open').length >= this.activeSession.maxPositions) {
        return { valid: false, error: 'Maximum position limit reached' };
      }

      // Check daily loss limit
      if (this.activeSession.portfolio.dayPnL < -(this.activeSession.portfolio.totalCapital * this.activeSession.maxDailyLoss / 100)) {
        return { valid: false, error: 'Daily loss limit exceeded' };
      }

      // Check allowed symbols
      if (this.activeSession.allowedSymbols && !this.activeSession.allowedSymbols.includes(trade.symbol)) {
        return { valid: false, error: 'Symbol not allowed' };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get current session portfolio
  getPortfolio() {
    return this.activeSession?.portfolio || null;
  }

  // Get current positions
  getPositions() {
    if (!this.activeSession) return [];
    
    return this.activeSession.trades
      .filter(trade => trade.status === 'open')
      .map(trade => ({
        ...trade,
        unrealizedPnL: this.calculateUnrealizedPnL(trade),
        unrealizedPnLPercentage: this.calculateUnrealizedPnLPercentage(trade)
      }));
  }

  // Get trade history
  getTradeHistory() {
    return this.activeSession?.trades || [];
  }

  // Get session performance
  getPerformance() {
    return this.activeSession?.performance || null;
  }

  // Get session history
  getSessionHistory() {
    return this.sessionHistory;
  }

  // Calculate unrealized P&L for position
  calculateUnrealizedPnL(trade) {
    // This would use real-time market data
    // For now, using simulated data
    const currentPrice = trade.price * (1 + (Math.random() - 0.5) * 0.02); // ±1% variation
    const pnl = trade.side === 'buy' 
      ? (currentPrice - trade.price) * trade.quantity
      : (trade.price - currentPrice) * trade.quantity;
    return pnl;
  }

  // Calculate unrealized P&L percentage
  calculateUnrealizedPnLPercentage(trade) {
    const unrealizedPnL = this.calculateUnrealizedPnL(trade);
    const invested = trade.price * trade.quantity;
    return invested > 0 ? (unrealizedPnL / invested) * 100 : 0;
  }

  // Update session performance metrics
  updateSessionPerformance() {
    if (!this.activeSession) return;

    const closedTrades = this.activeSession.trades.filter(trade => trade.status === 'closed');
    const winningTrades = closedTrades.filter(trade => trade.pnl > 0);
    const losingTrades = closedTrades.filter(trade => trade.pnl < 0);

    const totalWins = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));

    this.activeSession.performance = {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      avgWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
      totalPnL: totalWins - totalLosses,
      maxDrawdown: this.calculateMaxDrawdown()
    };

    // Update portfolio
    const openPositions = this.getPositions();
    const unrealizedPnL = openPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    
    this.activeSession.portfolio.currentValue = this.activeSession.portfolio.totalCapital + this.activeSession.performance.totalPnL + unrealizedPnL;
    this.activeSession.portfolio.totalPnL = this.activeSession.performance.totalPnL + unrealizedPnL;
    this.activeSession.portfolio.investedAmount = openPositions.reduce((sum, pos) => sum + (pos.price * pos.quantity), 0);
    this.activeSession.portfolio.availableCapital = this.activeSession.portfolio.totalCapital - this.activeSession.portfolio.investedAmount;
  }

  // Calculate maximum drawdown
  calculateMaxDrawdown() {
    if (!this.activeSession || this.activeSession.trades.length === 0) return 0;

    let peak = this.activeSession.portfolio.totalCapital;
    let maxDrawdown = 0;
    let runningTotal = this.activeSession.portfolio.totalCapital;

    this.activeSession.trades.forEach(trade => {
      if (trade.status === 'closed') {
        runningTotal += trade.pnl;
        
        if (runningTotal > peak) {
          peak = runningTotal;
        }
        
        const drawdown = (peak - runningTotal) / peak * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    });

    return maxDrawdown;
  }

  // Event handlers
  handleSessionStarted(data) {
    console.log('📊 Session started event received:', data);
  }

  handleSessionStopped(data) {
    console.log('⏹️ Session stopped event received:', data);
  }

  handleTradeExecuted(data) {
    console.log('✅ Trade executed event received:', data);
    this.updateSessionPerformance();
    this.notifyTradeExecuted(data);
  }

  handlePortfolioUpdate(data) {
    if (this.activeSession && data.sessionId === this.activeSession.sessionId) {
      this.activeSession.portfolio = { ...this.activeSession.portfolio, ...data.portfolio };
      this.notifyPortfolioUpdate(data);
    }
  }

  handleRiskAlert(alert) {
    console.warn('⚠️ Risk alert received:', alert);
    this.notifyError(alert);
  }

  // Event subscription methods
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  // Notification methods
  notifySessionUpdate(session) {
    this.callbacks.onSessionUpdate.forEach(callback => {
      callback(session);
    });
  }

  notifyTradeExecuted(trade) {
    this.callbacks.onTradeExecuted.forEach(callback => {
      callback(trade);
    });
  }

  notifyPortfolioUpdate(data) {
    this.callbacks.onPortfolioUpdate.forEach(callback => {
      callback(data);
    });
  }

  notifyError(error) {
    this.callbacks.onError.forEach(callback => {
      callback(error);
    });
  }

  // Utility methods
  isSessionActive() {
    return this.activeSession && this.activeSession.status === 'active';
  }

  getActiveSession() {
    return this.activeSession;
  }

  // Export session data
  exportSessionData(sessionId) {
    const session = sessionId === this.activeSession?.sessionId 
      ? this.activeSession 
      : this.sessionHistory.find(s => s.sessionId === sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    return {
      sessionInfo: {
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        strategy: session.strategy,
        startingCapital: session.portfolio.totalCapital
      },
      performance: session.performance,
      trades: session.trades,
      portfolio: session.portfolio
    };
  }
}

// Create singleton instance
const paperTradingService = new PaperTradingService();

export default paperTradingService;
