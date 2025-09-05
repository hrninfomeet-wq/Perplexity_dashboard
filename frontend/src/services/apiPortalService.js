// frontend/src/services/apiPortalService.js
import { io } from 'socket.io-client';

class APIPortalService {
  constructor() {
    this.currentProvider = null;
    this.connectionStatus = 'disconnected';
    this.socket = null;
    this.callbacks = {
      onConnectionChange: [],
      onDataUpdate: [],
      onError: []
    };
  }

  // Provider configurations
  getProviderConfig() {
    return {
      flattrade: {
        baseUrl: '/api/flattrade',
        authEndpoint: '/api/login/url',
        websocketPath: '/flattrade-ws',
        features: ['live_data', 'trading', 'portfolio', 'analytics']
      },
      upstox: {
        baseUrl: '/api/upstox',
        authEndpoint: '/api/upstox/auth',
        websocketPath: '/upstox-ws',
        features: ['live_data', 'trading', 'portfolio']
      },
      fyers: {
        baseUrl: '/api/fyers',
        authEndpoint: '/api/fyers/auth',
        websocketPath: '/fyers-ws',
        features: ['live_data', 'trading', 'analytics']
      },
      aliceblue: {
        baseUrl: '/api/aliceblue',
        authEndpoint: '/api/aliceblue/auth',
        websocketPath: '/aliceblue-ws',
        features: ['live_data', 'trading']
      },
      nse_public: {
        baseUrl: '/api/nse-public',
        authEndpoint: '/api/nse-public/connect',
        websocketPath: '/nse-public-ws',
        features: ['live_data'] // Limited features for public API
      }
    };
  }

  // Connect to a specific provider
  async connectToProvider(provider) {
    try {
      this.updateConnectionStatus('connecting');
      
      const config = this.getProviderConfig()[provider.id];
      if (!config) {
        throw new Error(`Provider ${provider.id} not configured`);
      }

      // Disconnect from current provider first
      if (this.currentProvider) {
        await this.disconnect();
      }

      // Handle authentication based on provider
      const authResult = await this.authenticateProvider(provider.id, config);
      
      if (authResult.success) {
        this.currentProvider = provider;
        this.updateConnectionStatus('connected');
        
        // Initialize WebSocket connection
        await this.initializeWebSocket(config);
        
        // Notify listeners
        this.notifyConnectionChange(provider, 'connected');
        
        return {
          success: true,
          provider: provider,
          message: `Connected to ${provider.name} successfully`
        };
      } else {
        throw new Error(authResult.error || 'Authentication failed');
      }
      
    } catch (error) {
      this.updateConnectionStatus('error');
      this.notifyError(error);
      throw error;
    }
  }

  // Handle provider-specific authentication
  async authenticateProvider(providerId, config) {
    switch (providerId) {
      case 'flattrade':
        return await this.authenticateFlattrade(config);
      
      case 'upstox':
        return await this.authenticateUpstox(config);
      
      case 'fyers':
        return await this.authenticateFyers(config);
      
      case 'aliceblue':
        return await this.authenticateAliceBlue(config);
      
      case 'nse_public':
        return await this.authenticateNSEPublic(config);
      
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  }

  // Flattrade authentication (existing implementation)
  async authenticateFlattrade(config) {
    try {
      const response = await fetch(config.authEndpoint);
      if (!response.ok) throw new Error('Failed to get login URL');
      
      const data = await response.json();
      if (data.loginUrl) {
        return await this.handleOAuthFlow(data.loginUrl, 'Flattrade');
      }
      
      throw new Error('No login URL received');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // OAuth flow handler for popup-based authentication
  async handleOAuthFlow(loginUrl, providerName) {
    return new Promise((resolve) => {
      const authWindow = window.open(loginUrl, `${providerName}Login`, 'width=600,height=700');
      
      const messageListener = (event) => {
        if (event.source === authWindow) {
          if (event.data?.type === 'auth-success') {
            window.removeEventListener('message', messageListener);
            authWindow.close();
            resolve({ success: true, data: event.data });
          } else if (event.data?.type === 'auth-error') {
            window.removeEventListener('message', messageListener);
            authWindow.close();
            resolve({ success: false, error: event.data.error });
          }
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          resolve({ success: false, error: 'Authentication cancelled' });
        }
      }, 1000);
    });
  }

  // Placeholder authentication methods for other providers
  async authenticateUpstox(config) {
    // TODO: Implement Upstox-specific authentication
    return { success: false, error: 'Upstox integration coming soon' };
  }

  async authenticateFyers(config) {
    // TODO: Implement FYERS-specific authentication
    return { success: false, error: 'FYERS integration coming soon' };
  }

  async authenticateAliceBlue(config) {
    // TODO: Implement Alice Blue-specific authentication
    return { success: false, error: 'Alice Blue integration coming soon' };
  }

  async authenticateNSEPublic(config) {
    // NSE Public API doesn't require authentication
    return { success: true, message: 'Connected to NSE Public API' };
  }

  // Initialize WebSocket connection
  async initializeWebSocket(config) {
    try {
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(config.websocketPath, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log(`✅ WebSocket connected to ${this.currentProvider?.name}`);
        this.updateConnectionStatus('connected');
      });

      this.socket.on('disconnect', () => {
        console.log(`🔌 WebSocket disconnected from ${this.currentProvider?.name}`);
        this.updateConnectionStatus('disconnected');
      });

      this.socket.on('market_data', (data) => {
        this.notifyDataUpdate('market_data', data);
      });

      this.socket.on('portfolio_update', (data) => {
        this.notifyDataUpdate('portfolio_update', data);
      });

      this.socket.on('trade_update', (data) => {
        this.notifyDataUpdate('trade_update', data);
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.notifyError(error);
      });

    } catch (error) {
      console.error('WebSocket initialization failed:', error);
      throw error;
    }
  }

  // Disconnect from current provider
  async disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentProvider = null;
    this.updateConnectionStatus('disconnected');
    this.notifyConnectionChange(null, 'disconnected');
  }

  // Get current connection info
  getConnectionInfo() {
    return {
      provider: this.currentProvider,
      status: this.connectionStatus,
      isConnected: this.connectionStatus === 'connected',
      features: this.currentProvider ? this.getProviderConfig()[this.currentProvider.id]?.features || [] : []
    };
  }

  // Event handling methods
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

  // Internal notification methods
  updateConnectionStatus(status) {
    this.connectionStatus = status;
  }

  notifyConnectionChange(provider, status) {
    this.callbacks.onConnectionChange.forEach(callback => {
      callback({ provider, status });
    });
  }

  notifyDataUpdate(type, data) {
    this.callbacks.onDataUpdate.forEach(callback => {
      callback({ type, data });
    });
  }

  notifyError(error) {
    this.callbacks.onError.forEach(callback => {
      callback(error);
    });
  }

  // API methods for different providers
  async makeAPICall(endpoint, options = {}) {
    if (!this.currentProvider) {
      throw new Error('No provider connected');
    }

    const config = this.getProviderConfig()[this.currentProvider.id];
    const url = `${config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiPortalService = new APIPortalService();

export default apiPortalService;
