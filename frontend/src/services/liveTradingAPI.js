// Live Trading API Service - Frontend Integration Layer
// Connects to the enterprise-grade backend live trading infrastructure

class LiveTradingAPI {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.liveTradingURL = `${this.baseURL}/trading`;
    this.websocketURL = 'ws://localhost:5000';
    this.isConnected = false;
    this.websocket = null;
    this.listeners = new Map();
  }

  // Connection Management
  async connect() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Connected to Live Trading Backend');
        this.setupWebSocket();
        return { success: true, message: 'Connected to backend' };
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  setupWebSocket() {
    // Simplified version - no websockets in simple backend
    // Use polling instead for now
    console.log('� Using polling instead of WebSocket for simplified backend');
    return;
  }

  // Event Listener Management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Paper Trading Session Management
  async startPaperTradingSession(userId, options = {}) {
    try {
      const response = await fetch(`${this.liveTradingURL}/trading/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          initialCapital: options.initialCapital || 100000,
          maxDailyLoss: options.maxDailyLoss || 10000,
          maxPositionSize: options.maxPositionSize || 20000,
          strategies: options.strategies || ['scalping', 'swing'],
          marketType: options.marketType || 'mixed'
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('🎯 Paper trading session started:', result.sessionId);
        this.notifyListeners('session_started', result);
      }
      return result;
    } catch (error) {
      console.error('Failed to start paper trading session:', error);
      return { success: false, error: error.message };
    }
  }

  async stopPaperTradingSession(sessionId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/trading/session/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();
      if (result.success) {
        console.log('⏹️ Paper trading session stopped:', sessionId);
        this.notifyListeners('session_stopped', result);
      }
      return result;
    } catch (error) {
      console.error('Failed to stop paper trading session:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveSessions(userId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/trading/sessions/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.sessions : [];
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  // Portfolio Management
  async getPortfolioStatus(sessionId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/trading/portfolio/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.portfolio : null;
    } catch (error) {
      console.error('Failed to get portfolio status:', error);
      return null;
    }
  }

  async getPositions(sessionId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/trading/positions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.positions : [];
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  // Performance Analytics
  async getPerformanceMetrics(sessionId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/trading/performance/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.performance : null;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }

  async getTradeHistory(sessionId, limit = 50) {
    try {
      const response = await fetch(`${this.liveTradingURL}/trading/trades/${sessionId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.trades : [];
    } catch (error) {
      console.error('Failed to get trade history:', error);
      return [];
    }
  }

  // Market Data
  async getMarketData(symbols = []) {
    try {
      const symbolsQuery = symbols.length > 0 ? `?symbols=${symbols.join(',')}` : '';
      const response = await fetch(`${this.baseURL}/market-data${symbolsQuery}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Failed to get market data:', error);
      return [];
    }
  }

  // Trading Signals
  async getTradingSignals(sessionId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/signals/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.signals : [];
    } catch (error) {
      console.error('Failed to get trading signals:', error);
      return [];
    }
  }

  // Strategy Management
  async updateStrategySettings(sessionId, strategy, settings) {
    try {
      const response = await fetch(`${this.liveTradingURL}/strategy/${sessionId}/${strategy}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      if (result.success) {
        this.notifyListeners('strategy_updated', { strategy, settings });
      }
      return result;
    } catch (error) {
      console.error('Failed to update strategy settings:', error);
      return { success: false, error: error.message };
    }
  }

  async getStrategyPerformance(sessionId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/strategy/${sessionId}/performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.strategies : {};
    } catch (error) {
      console.error('Failed to get strategy performance:', error);
      return {};
    }
  }

  // Risk Management
  async getRiskMetrics(sessionId) {
    try {
      const response = await fetch(`${this.liveTradingURL}/risk/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result.success ? result.risk : null;
    } catch (error) {
      console.error('Failed to get risk metrics:', error);
      return null;
    }
  }

  async updateRiskSettings(sessionId, riskSettings) {
    try {
      const response = await fetch(`${this.liveTradingURL}/risk/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(riskSettings)
      });

      const result = await response.json();
      if (result.success) {
        this.notifyListeners('risk_settings_updated', riskSettings);
      }
      return result;
    } catch (error) {
      console.error('Failed to update risk settings:', error);
      return { success: false, error: error.message };
    }
  }

  // System Health
  async getSystemHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health/detailed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return { healthy: false, error: error.message };
    }
  }

  // Utility Methods
  formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  // Cleanup
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    console.log('🔌 Disconnected from Live Trading Backend');
  }
}

// Create singleton instance
const liveTradingAPI = new LiveTradingAPI();

// Auto-connect on creation
liveTradingAPI.connect();

export default liveTradingAPI;
