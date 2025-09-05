// frontend/src/services/websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Event callbacks
    this.callbacks = {
      onConnectionChange: [],
      onMarketData: [],
      onTradeUpdate: [],
      onPortfolioUpdate: [],
      onSignalUpdate: [],
      onError: []
    };
  }

  // Connect to WebSocket server
  connect(provider = 'flattrade') {
    try {
      // Disconnect existing connection
      if (this.socket) {
        this.disconnect();
      }

      // Determine WebSocket endpoint based on provider
      const wsEndpoints = {
        flattrade: 'ws://localhost:5000/flattrade',
        upstox: 'ws://localhost:5000/upstox',
        fyers: 'ws://localhost:5000/fyers',
        aliceblue: 'ws://localhost:5000/aliceblue',
        nse_public: 'ws://localhost:5000/nse-public'
      };

      const endpoint = wsEndpoints[provider] || wsEndpoints.flattrade;

      this.socket = io(endpoint, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        maxHttpBufferSize: 1e6, // 1MB
        pingTimeout: 60000,
        pingInterval: 25000
      });

      this.setupEventListeners();
      
      console.log(`🔌 Connecting to ${provider} WebSocket...`);
      this.updateConnectionStatus('connecting');

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.notifyError(error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');
      this.notifyConnectionChange('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.updateConnectionStatus('disconnected');
      this.notifyConnectionChange('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.updateConnectionStatus('error');
      this.notifyError(error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.updateConnectionStatus('connected');
      this.notifyConnectionChange('reconnected');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection failed:', error);
      this.updateConnectionStatus('reconnecting');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed permanently');
      this.updateConnectionStatus('failed');
      this.notifyError(new Error('WebSocket reconnection failed'));
    });

    // Data events
    this.socket.on('market_data', (data) => {
      this.notifyMarketData(data);
    });

    this.socket.on('trade_update', (data) => {
      this.notifyTradeUpdate(data);
    });

    this.socket.on('portfolio_update', (data) => {
      this.notifyPortfolioUpdate(data);
    });

    this.socket.on('signal_update', (data) => {
      this.notifySignalUpdate(data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.notifyError(error);
    });

    // Trading session events
    this.socket.on('session_started', (data) => {
      console.log('📊 Trading session started:', data);
      this.notifyTradeUpdate({ type: 'session_started', data });
    });

    this.socket.on('session_stopped', (data) => {
      console.log('⏹️ Trading session stopped:', data);
      this.notifyTradeUpdate({ type: 'session_stopped', data });
    });

    // Pattern recognition events
    this.socket.on('pattern_detected', (data) => {
      console.log('🎯 Pattern detected:', data);
      this.notifySignalUpdate({ type: 'pattern', ...data });
    });

    // ML signal events
    this.socket.on('ml_signal', (data) => {
      console.log('🤖 ML signal received:', data);
      this.notifySignalUpdate({ type: 'ml_signal', ...data });
    });

    // Risk management alerts
    this.socket.on('risk_alert', (data) => {
      console.log('⚠️ Risk alert:', data);
      this.notifyError({ type: 'risk_alert', ...data });
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.updateConnectionStatus('disconnected');
    this.notifyConnectionChange('disconnected');
  }

  // Subscribe to specific symbols
  subscribeToSymbols(symbols) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { symbols });
      console.log('📡 Subscribed to symbols:', symbols);
    }
  }

  // Unsubscribe from symbols
  unsubscribeFromSymbols(symbols) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe', { symbols });
      console.log('📡 Unsubscribed from symbols:', symbols);
    }
  }

  // Subscribe to trading session updates
  subscribeToSession(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_session', { sessionId });
      console.log('📊 Subscribed to session updates:', sessionId);
    }
  }

  // Send trading command
  sendTradingCommand(command) {
    if (this.socket && this.isConnected) {
      this.socket.emit('trading_command', command);
      console.log('📤 Trading command sent:', command);
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  // Send strategy update
  sendStrategyUpdate(strategyData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('strategy_update', strategyData);
      console.log('📤 Strategy update sent:', strategyData);
    }
  }

  // Request historical data
  requestHistoricalData(symbol, timeframe, startDate, endDate) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const requestId = `hist_${Date.now()}`;
      
      // Set up one-time listener for response
      this.socket.once(`historical_data_${requestId}`, (data) => {
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data);
        }
      });

      // Send request
      this.socket.emit('request_historical_data', {
        requestId,
        symbol,
        timeframe,
        startDate,
        endDate
      });

      // Set timeout
      setTimeout(() => {
        reject(new Error('Historical data request timeout'));
      }, 30000);
    });
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

  // Connection status
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Internal notification methods
  updateConnectionStatus(status) {
    this.connectionStatus = status;
  }

  notifyConnectionChange(status) {
    this.callbacks.onConnectionChange.forEach(callback => {
      callback({ status, isConnected: this.isConnected });
    });
  }

  notifyMarketData(data) {
    this.callbacks.onMarketData.forEach(callback => {
      callback(data);
    });
  }

  notifyTradeUpdate(data) {
    this.callbacks.onTradeUpdate.forEach(callback => {
      callback(data);
    });
  }

  notifyPortfolioUpdate(data) {
    this.callbacks.onPortfolioUpdate.forEach(callback => {
      callback(data);
    });
  }

  notifySignalUpdate(data) {
    this.callbacks.onSignalUpdate.forEach(callback => {
      callback(data);
    });
  }

  notifyError(error) {
    this.callbacks.onError.forEach(callback => {
      callback(error);
    });
  }

  // Utility methods
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  // Ping server for latency testing
  pingServer() {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ latency: -1, error: 'Not connected' });
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping', startTime, (response) => {
        const latency = Date.now() - startTime;
        resolve({ latency, timestamp: response });
      });
    });
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
