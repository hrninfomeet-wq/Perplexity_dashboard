// 🎯 Live Trading API Service
// Connects frontend to Phase 3A Step 8 live trading backend infrastructure

class LiveTradingAPI {
  constructor() {
    this.baseURL = 'http://localhost:3001/api/v8/live-trading';
    this.websocketURL = 'ws://localhost:3001';
    this.websocket = null;
    this.isInitialized = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // === INITIALIZATION === //
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Test backend connection
      const healthCheck = await this.get('/health');
      if (!healthCheck.success) {
        throw new Error('Backend health check failed');
      }

      // Initialize WebSocket connection
      await this.initializeWebSocket();
      
      this.isInitialized = true;
      console.log('✅ Live Trading API initialized successfully');
      
      return { success: true, message: 'API initialized' };
    } catch (error) {
      console.error('❌ Live Trading API initialization failed:', error);
      throw error;
    }
  }

  // === WEBSOCKET MANAGEMENT === //
  async initializeWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(`${this.websocketURL}/live-trading`);
        
        this.websocket.onopen = () => {
          console.log('🔗 WebSocket connected to live trading feed');
          this.reconnectAttempts = 0;
          this.emit('connection', { status: 'connected' });
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (err) {
            console.error('WebSocket message parsing error:', err);
          }
        };

        this.websocket.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.emit('connection', { status: 'disconnected' });
          this.handleReconnection();
        };

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', { error: 'WebSocket connection error' });
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  handleWebSocketMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'MARKET_DATA_UPDATE':
        this.emit('marketData', payload);
        break;
      case 'PORTFOLIO_UPDATE':
        this.emit('portfolioUpdate', payload);
        break;
      case 'TRADE_EXECUTION':
        this.emit('tradeExecution', payload);
        break;
      case 'PERFORMANCE_UPDATE':
        this.emit('performanceUpdate', payload);
        break;
      case 'TRADING_SIGNAL':
        this.emit('tradingSignal', payload);
        break;
      case 'SESSION_STATUS':
        this.emit('sessionStatus', payload);
        break;
      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`🔄 Reconnecting WebSocket in ${delay/1000}s (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket().catch(console.error);
      }, delay);
    } else {
      console.error('❌ Max WebSocket reconnection attempts reached');
      this.emit('error', { error: 'WebSocket connection failed permanently' });
    }
  }

  // === EVENT HANDLING === //
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in event handler for ${event}:`, err);
        }
      });
    }
  }

  // === PAPER TRADING SESSION MANAGEMENT === //
  async startSession(config = {}) {
    const sessionConfig = {
      initialCapital: config.initialCapital || 100000,
      maxDailyLoss: config.maxDailyLoss || 5000,
      maxPositionSize: config.maxPositionSize || 20000,
      enabledStrategies: config.enabledStrategies || [],
      riskLevel: config.riskLevel || 'MEDIUM',
      ...config
    };

    return this.post('/sessions/start', sessionConfig);
  }

  async stopSession(sessionId) {
    return this.post(`/sessions/${sessionId}/stop`);
  }

  async getActiveSessions() {
    return this.get('/sessions/active');
  }

  async getSessionDetails(sessionId) {
    return this.get(`/sessions/${sessionId}`);
  }

  // === PORTFOLIO MANAGEMENT === //
  async getPortfolio(sessionId) {
    return this.get(`/portfolio/${sessionId}`);
  }

  async getPortfolioPositions(sessionId) {
    return this.get(`/portfolio/${sessionId}/positions`);
  }

  async getPortfolioPerformance(sessionId) {
    return this.get(`/portfolio/${sessionId}/performance`);
  }

  // === MARKET DATA === //
  async getMarketOverview() {
    return this.get('/market/overview');
  }

  async getSymbolData(symbol) {
    return this.get(`/market/symbol/${symbol}`);
  }

  async getMarketStatus() {
    return this.get('/market/status');
  }

  // === TRADING SIGNALS === //
  async getTradingSignals(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.get(`/signals${queryParams ? '?' + queryParams : ''}`);
  }

  async executeSignal(signalId, action) {
    return this.post(`/signals/${signalId}/execute`, { action });
  }

  // === PERFORMANCE ANALYTICS === //
  async getPerformanceMetrics(sessionId, timeframe = '1d') {
    return this.get(`/performance/${sessionId}?timeframe=${timeframe}`);
  }

  async getStrategyPerformance(sessionId, strategyId) {
    return this.get(`/performance/${sessionId}/strategy/${strategyId}`);
  }

  async getRiskMetrics(sessionId) {
    return this.get(`/risk/${sessionId}/metrics`);
  }

  // === TRADE EXECUTION === //
  async getTradeHistory(sessionId, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.get(`/trades/${sessionId}${queryParams ? '?' + queryParams : ''}`);
  }

  async getExecutionQuality(sessionId) {
    return this.get(`/execution/${sessionId}/quality`);
  }

  // === STRATEGY MANAGEMENT === //
  async getAvailableStrategies() {
    return this.get('/strategies');
  }

  async updateStrategyConfig(strategyId, config) {
    return this.put(`/strategies/${strategyId}/config`, config);
  }

  async enableStrategy(sessionId, strategyId) {
    return this.post(`/sessions/${sessionId}/strategies/${strategyId}/enable`);
  }

  async disableStrategy(sessionId, strategyId) {
    return this.post(`/sessions/${sessionId}/strategies/${strategyId}/disable`);
  }

  // === HTTP METHODS === //
  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();
      return responseData;
      
    } catch (error) {
      console.error(`API request failed [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // === UTILITY METHODS === //
  isConnected() {
    return this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }

  getConnectionStatus() {
    if (!this.websocket) return 'DISCONNECTED';
    
    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isInitialized = false;
  }

  // === ERROR HANDLING === //
  handleAPIError(error, context) {
    console.error(`API Error in ${context}:`, error);
    
    this.emit('error', {
      context,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Return user-friendly error for display
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network connection error. Please check your connection.';
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      return 'Authentication error. Please refresh and try again.';
    }
    
    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    
    return error.message || 'Unknown error occurred';
  }
}

// Create and export singleton instance
export const liveTradingAPI = new LiveTradingAPI();
export default liveTradingAPI;