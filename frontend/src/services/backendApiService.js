// frontend/src/services/backendApiService.js
import websocketService from './websocketService';
import paperTradingService from './paperTradingService';
import apiPortalService from './apiPortalService';

/**
 * Backend API Integration Service
 * Links frontend services with backend v7/v8 endpoints for strategy execution and live trading
 */
class BackendApiService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.apiVersion = 'v8'; // Using latest enhanced API
    this.isInitialized = false;
    this.endpoints = {
      strategies: `${this.baseUrl}/api/${this.apiVersion}/strategies`,
      trading: `${this.baseUrl}/api/${this.apiVersion}/trading`,
      paperTrading: `${this.baseUrl}/api/${this.apiVersion}/paper-trading`,
      marketData: `${this.baseUrl}/api/${this.apiVersion}/market-data`,
      portfolio: `${this.baseUrl}/api/${this.apiVersion}/portfolio`,
      auth: `${this.baseUrl}/api/${this.apiVersion}/auth`,
      websocket: `${this.baseUrl}/api/${this.apiVersion}/websocket`,
      health: `${this.baseUrl}/api/health`
    };
    
    this.eventHandlers = new Map();
    this.init();
  }

  /**
   * Initialize backend connection and sync services
   */
  async init() {
    try {
      console.log('🔄 Initializing Backend API Service...');
      
      // Check backend health
      const health = await this.checkBackendHealth();
      if (!health.success) {
        throw new Error('Backend server is not available');
      }
      
      // Initialize WebSocket connection to backend
      await this.initializeWebSocketConnection();
      
      // Subscribe to paper trading events
      this.setupPaperTradingIntegration();
      
      // Setup API portal integration
      this.setupApiPortalIntegration();
      
      this.isInitialized = true;
      console.log('✅ Backend API Service initialized successfully');
      
      this.emit('onInitialized', { status: 'ready' });
      
    } catch (error) {
      console.error('❌ Backend API Service initialization failed:', error);
      this.emit('onError', { error: error.message });
    }
  }

  /**
   * Check backend server health and capabilities
   */
  async checkBackendHealth() {
    try {
      const response = await fetch(this.endpoints.health, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
      
      const health = await response.json();
      console.log('🏥 Backend Health:', health);
      
      return {
        success: true,
        data: health,
        capabilities: health.capabilities || []
      };
      
    } catch (error) {
      console.error('Backend health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize WebSocket connection with backend
   */
  async initializeWebSocketConnection() {
    try {
      // Configure WebSocket with backend endpoints
      const wsConfig = {
        backendUrl: this.baseUrl.replace('http', 'ws'),
        apiVersion: this.apiVersion,
        reconnect: true,
        maxReconnectAttempts: 10
      };
      
      // Update websocketService configuration
      websocketService.updateConfig(wsConfig);
      
      // Connect to backend WebSocket
      await websocketService.connect();
      
      console.log('🔌 WebSocket connected to backend');
      
    } catch (error) {
      console.error('WebSocket backend connection failed:', error);
      throw error;
    }
  }

  /**
   * Setup paper trading integration with backend
   */
  setupPaperTradingIntegration() {
    // Handle paper trading session events
    paperTradingService.on('onSessionStarted', async (session) => {
      try {
        await this.createBackendSession(session);
      } catch (error) {
        console.error('Failed to sync session with backend:', error);
      }
    });

    paperTradingService.on('onTradeExecuted', async (trade) => {
      try {
        await this.syncTradeWithBackend(trade);
      } catch (error) {
        console.error('Failed to sync trade with backend:', error);
      }
    });

    paperTradingService.on('onSessionStopped', async (session) => {
      try {
        await this.stopBackendSession(session.sessionId);
      } catch (error) {
        console.error('Failed to stop backend session:', error);
      }
    });
  }

  /**
   * Setup API portal integration with backend
   */
  setupApiPortalIntegration() {
    apiPortalService.on('onProviderConnected', async (provider) => {
      try {
        await this.registerProviderWithBackend(provider);
      } catch (error) {
        console.error('Failed to register provider with backend:', error);
      }
    });

    apiPortalService.on('onProviderDisconnected', async (provider) => {
      try {
        await this.unregisterProviderFromBackend(provider);
      } catch (error) {
        console.error('Failed to unregister provider from backend:', error);
      }
    });
  }

  /**
   * Strategy Management
   */
  async getAvailableStrategies() {
    try {
      const response = await this.makeApiCall('GET', this.endpoints.strategies);
      return response.data?.strategies || [];
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
      return [];
    }
  }

  async executeStrategy(strategyConfig) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.strategies}/execute`, {
        strategy: strategyConfig.strategy,
        symbol: strategyConfig.symbol,
        capital: strategyConfig.capital,
        riskLevel: strategyConfig.riskLevel,
        parameters: strategyConfig.parameters
      });
      
      return response;
    } catch (error) {
      console.error('Strategy execution failed:', error);
      throw error;
    }
  }

  async stopStrategy(strategyId) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.strategies}/${strategyId}/stop`);
      return response;
    } catch (error) {
      console.error('Strategy stop failed:', error);
      throw error;
    }
  }

  /**
   * Paper Trading Backend Integration
   */
  async createBackendSession(session) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.paperTrading}/sessions`, {
        sessionId: session.sessionId,
        userId: session.userId,
        strategy: session.strategy,
        startingCapital: session.portfolio.totalCapital,
        configuration: session.configuration
      });
      
      console.log('📊 Paper trading session synced with backend:', response);
      return response;
      
    } catch (error) {
      console.error('Failed to create backend session:', error);
      throw error;
    }
  }

  async syncTradeWithBackend(trade) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.paperTrading}/trades`, {
        sessionId: trade.sessionId,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        timestamp: trade.timestamp,
        orderType: trade.orderType,
        metadata: trade.metadata
      });
      
      return response;
      
    } catch (error) {
      console.error('Failed to sync trade with backend:', error);
      throw error;
    }
  }

  async stopBackendSession(sessionId) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.paperTrading}/sessions/${sessionId}/stop`);
      return response;
    } catch (error) {
      console.error('Failed to stop backend session:', error);
      throw error;
    }
  }

  /**
   * Market Data Integration
   */
  async subscribeToMarketData(symbols) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.marketData}/subscribe`, {
        symbols: Array.isArray(symbols) ? symbols : [symbols],
        includeDepth: true,
        includeTickData: true
      });
      
      // Also subscribe via WebSocket
      websocketService.subscribeToSymbols(symbols);
      
      return response;
      
    } catch (error) {
      console.error('Failed to subscribe to market data:', error);
      throw error;
    }
  }

  async getHistoricalData(symbol, timeframe, from, to) {
    try {
      const response = await this.makeApiCall('GET', `${this.endpoints.marketData}/historical`, {
        symbol,
        timeframe,
        from: from?.toISOString(),
        to: to?.toISOString()
      });
      
      return response.data?.candles || [];
      
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      return [];
    }
  }

  /**
   * Portfolio Management
   */
  async getPortfolioSummary(userId) {
    try {
      const response = await this.makeApiCall('GET', `${this.endpoints.portfolio}/${userId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch portfolio summary:', error);
      return null;
    }
  }

  async getPositions(userId) {
    try {
      const response = await this.makeApiCall('GET', `${this.endpoints.portfolio}/${userId}/positions`);
      return response.data?.positions || [];
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      return [];
    }
  }

  /**
   * Provider Registration
   */
  async registerProviderWithBackend(provider) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.auth}/providers/register`, {
        providerId: provider.id,
        providerName: provider.name,
        credentials: provider.credentials,
        capabilities: provider.capabilities
      });
      
      console.log('🔗 Provider registered with backend:', response);
      return response;
      
    } catch (error) {
      console.error('Failed to register provider with backend:', error);
      throw error;
    }
  }

  async unregisterProviderFromBackend(provider) {
    try {
      const response = await this.makeApiCall('DELETE', `${this.endpoints.auth}/providers/${provider.id}`);
      return response;
    } catch (error) {
      console.error('Failed to unregister provider from backend:', error);
      throw error;
    }
  }

  /**
   * Live Trading Integration
   */
  async executeLiveTrade(tradeRequest) {
    try {
      const response = await this.makeApiCall('POST', `${this.endpoints.trading}/execute`, {
        symbol: tradeRequest.symbol,
        side: tradeRequest.side,
        quantity: tradeRequest.quantity,
        orderType: tradeRequest.orderType,
        price: tradeRequest.price,
        stopLoss: tradeRequest.stopLoss,
        takeProfit: tradeRequest.takeProfit,
        providerId: tradeRequest.providerId
      });
      
      return response;
      
    } catch (error) {
      console.error('Live trade execution failed:', error);
      throw error;
    }
  }

  async cancelOrder(orderId) {
    try {
      const response = await this.makeApiCall('DELETE', `${this.endpoints.trading}/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('Order cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Generic API call helper
   */
  async makeApiCall(method, url, data = null, options = {}) {
    try {
      const config = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };
      
      if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
        config.body = JSON.stringify(data);
      } else if (data && config.method === 'GET') {
        const params = new URLSearchParams(data);
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Event handling
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Service status
   */
  isReady() {
    return this.isInitialized;
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      backendConnected: true, // Will be set based on actual health checks
      websocketConnected: websocketService.isSocketConnected(),
      apiVersion: this.apiVersion,
      endpoints: Object.keys(this.endpoints)
    };
  }

  /**
   * Cleanup
   */
  async destroy() {
    try {
      // Cleanup WebSocket connection
      if (websocketService.isSocketConnected()) {
        websocketService.disconnect();
      }
      
      // Clear event handlers
      this.eventHandlers.clear();
      
      this.isInitialized = false;
      console.log('🧹 Backend API Service destroyed');
      
    } catch (error) {
      console.error('Error during service cleanup:', error);
    }
  }
}

// Create singleton instance
const backendApiService = new BackendApiService();

export default backendApiService;
