import React, { createContext, useContext, useReducer, useEffect } from 'react';
import liveTradingAPI from '../services/liveTradingAPI';
import backendApiService from '../services/backendApiService';
import paperTradingService from '../services/paperTradingService';
import websocketService from '../services/websocketService';
import apiPortalService from '../services/apiPortalService';

// Trading Context
const TradingContext = createContext();

// Action Types
const TRADING_ACTIONS = {
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_ACTIVE_SESSION: 'SET_ACTIVE_SESSION',
  SET_PORTFOLIO: 'SET_PORTFOLIO',
  SET_POSITIONS: 'SET_POSITIONS',
  SET_PERFORMANCE: 'SET_PERFORMANCE',
  SET_TRADES: 'SET_TRADES',
  SET_MARKET_DATA: 'SET_MARKET_DATA',
  SET_SIGNALS: 'SET_SIGNALS',
  SET_SYSTEM_HEALTH: 'SET_SYSTEM_HEALTH',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_SESSION_STATUS: 'UPDATE_SESSION_STATUS',
  ADD_TRADE: 'ADD_TRADE',
  UPDATE_POSITION: 'UPDATE_POSITION',
  UPDATE_PERFORMANCE: 'UPDATE_PERFORMANCE',
  SET_STRATEGY_PERFORMANCE: 'SET_STRATEGY_PERFORMANCE',
  SET_RISK_METRICS: 'SET_RISK_METRICS'
};

// Initial State
const initialState = {
  // Connection Status
  isConnected: false,
  isLoading: false,
  error: null,
  
  // Trading Session
  activeSession: null,
  sessionStatus: 'stopped', // 'active', 'paused', 'stopped'
  
  // Portfolio Data
  portfolio: {
    totalCapital: 0,
    availableCapital: 0,
    investedAmount: 0,
    currentValue: 0,
    totalPnL: 0,
    dayPnL: 0,
    totalReturn: 0,
    totalReturnPercentage: 0
  },
  
  // Positions
  positions: [],
  
  // Performance Metrics
  performance: {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    grossProfit: 0,
    grossLoss: 0,
    netProfit: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    maxDrawdownPercentage: 0,
    sharpeRatio: 0,
    averageTradeReturn: 0,
    averageWinReturn: 0,
    averageLossReturn: 0,
    largestWin: 0,
    largestLoss: 0
  },
  
  // Trades
  trades: [],
  
  // Market Data
  marketData: {},
  
  // Trading Signals
  signals: [],
  
  // Strategy Performance
  strategyPerformance: {},
  
  // Risk Metrics
  riskMetrics: {
    currentDrawdown: 0,
    maxDailyLoss: 0,
    maxPositionSize: 0,
    riskScore: 0,
    portfolioRisk: 0
  },
  
  // System Health
  systemHealth: {
    healthy: false,
    uptime: 0,
    memory: 0,
    latency: 0,
    apiStatus: {}
  }
};

// Reducer
function tradingReducer(state, action) {
  switch (action.type) {
    case TRADING_ACTIONS.SET_CONNECTION_STATUS:
      return {
        ...state,
        isConnected: action.payload
      };
      
    case TRADING_ACTIONS.SET_ACTIVE_SESSION:
      return {
        ...state,
        activeSession: action.payload,
        sessionStatus: action.payload ? 'active' : 'stopped'
      };
      
    case TRADING_ACTIONS.SET_PORTFOLIO:
      return {
        ...state,
        portfolio: { ...state.portfolio, ...action.payload }
      };
      
    case TRADING_ACTIONS.SET_POSITIONS:
      return {
        ...state,
        positions: action.payload
      };
      
    case TRADING_ACTIONS.SET_PERFORMANCE:
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };
      
    case TRADING_ACTIONS.SET_TRADES:
      return {
        ...state,
        trades: action.payload
      };
      
    case TRADING_ACTIONS.SET_MARKET_DATA:
      return {
        ...state,
        marketData: { ...state.marketData, ...action.payload }
      };
      
    case TRADING_ACTIONS.SET_SIGNALS:
      return {
        ...state,
        signals: action.payload
      };
      
    case TRADING_ACTIONS.SET_SYSTEM_HEALTH:
      return {
        ...state,
        systemHealth: { ...state.systemHealth, ...action.payload }
      };
      
    case TRADING_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case TRADING_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case TRADING_ACTIONS.UPDATE_SESSION_STATUS:
      return {
        ...state,
        sessionStatus: action.payload
      };
      
    case TRADING_ACTIONS.ADD_TRADE:
      return {
        ...state,
        trades: [action.payload, ...state.trades].slice(0, 100) // Keep last 100 trades
      };
      
    case TRADING_ACTIONS.UPDATE_POSITION:
      const updatedPositions = state.positions.map(pos => 
        pos.positionId === action.payload.positionId 
          ? { ...pos, ...action.payload }
          : pos
      );
      return {
        ...state,
        positions: updatedPositions
      };
      
    case TRADING_ACTIONS.UPDATE_PERFORMANCE:
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };
      
    case TRADING_ACTIONS.SET_STRATEGY_PERFORMANCE:
      return {
        ...state,
        strategyPerformance: action.payload
      };
      
    case TRADING_ACTIONS.SET_RISK_METRICS:
      return {
        ...state,
        riskMetrics: { ...state.riskMetrics, ...action.payload }
      };
      
    default:
      return state;
  }
}

// Provider Component
export function TradingProvider({ children }) {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // Action Creators
  const actions = {
    setConnectionStatus: (status) => dispatch({
      type: TRADING_ACTIONS.SET_CONNECTION_STATUS,
      payload: status
    }),
    
    setActiveSession: (session) => dispatch({
      type: TRADING_ACTIONS.SET_ACTIVE_SESSION,
      payload: session
    }),
    
    setPortfolio: (portfolio) => dispatch({
      type: TRADING_ACTIONS.SET_PORTFOLIO,
      payload: portfolio
    }),
    
    setPositions: (positions) => dispatch({
      type: TRADING_ACTIONS.SET_POSITIONS,
      payload: positions
    }),
    
    setPerformance: (performance) => dispatch({
      type: TRADING_ACTIONS.SET_PERFORMANCE,
      payload: performance
    }),
    
    setTrades: (trades) => dispatch({
      type: TRADING_ACTIONS.SET_TRADES,
      payload: trades
    }),
    
    setMarketData: (data) => dispatch({
      type: TRADING_ACTIONS.SET_MARKET_DATA,
      payload: data
    }),
    
    setSignals: (signals) => dispatch({
      type: TRADING_ACTIONS.SET_SIGNALS,
      payload: signals
    }),
    
    setSystemHealth: (health) => dispatch({
      type: TRADING_ACTIONS.SET_SYSTEM_HEALTH,
      payload: health
    }),
    
    setLoading: (loading) => dispatch({
      type: TRADING_ACTIONS.SET_LOADING,
      payload: loading
    }),
    
    setError: (error) => dispatch({
      type: TRADING_ACTIONS.SET_ERROR,
      payload: error
    }),
    
    updateSessionStatus: (status) => dispatch({
      type: TRADING_ACTIONS.UPDATE_SESSION_STATUS,
      payload: status
    }),
    
    addTrade: (trade) => dispatch({
      type: TRADING_ACTIONS.ADD_TRADE,
      payload: trade
    }),
    
    updatePosition: (position) => dispatch({
      type: TRADING_ACTIONS.UPDATE_POSITION,
      payload: position
    }),
    
    updatePerformance: (performance) => dispatch({
      type: TRADING_ACTIONS.UPDATE_PERFORMANCE,
      payload: performance
    }),
    
    setStrategyPerformance: (strategies) => dispatch({
      type: TRADING_ACTIONS.SET_STRATEGY_PERFORMANCE,
      payload: strategies
    }),
    
    setRiskMetrics: (risk) => dispatch({
      type: TRADING_ACTIONS.SET_RISK_METRICS,
      payload: risk
    })
  };

  // API Integration Functions
  const tradingActions = {
    // Session Management
    async startPaperTrading(userId, options) {
      actions.setLoading(true);
      actions.setError(null);
      
      try {
        const result = await liveTradingAPI.startPaperTradingSession(userId, options);
        
        if (result.success) {
          actions.setActiveSession(result.session);
          actions.updateSessionStatus('active');
          
          // Start monitoring session data
          monitorSession(result.session.sessionId);
        } else {
          actions.setError(result.error || 'Failed to start paper trading session');
        }
        
        actions.setLoading(false);
        return result;
      } catch (error) {
        actions.setError(error.message);
        actions.setLoading(false);
        return { success: false, error: error.message };
      }
    },
    
    async stopPaperTrading(sessionId) {
      actions.setLoading(true);
      
      try {
        const result = await liveTradingAPI.stopPaperTradingSession(sessionId);
        
        if (result.success) {
          actions.setActiveSession(null);
          actions.updateSessionStatus('stopped');
          stopMonitoring();
        } else {
          actions.setError(result.error || 'Failed to stop paper trading session');
        }
        
        actions.setLoading(false);
        return result;
      } catch (error) {
        actions.setError(error.message);
        actions.setLoading(false);
        return { success: false, error: error.message };
      }
    },
    
    // Data Refresh Functions
    async refreshPortfolio(sessionId) {
      if (!sessionId) return;
      
      try {
        const portfolio = await liveTradingAPI.getPortfolioStatus(sessionId);
        if (portfolio) {
          actions.setPortfolio(portfolio);
        }
      } catch (error) {
        console.error('Failed to refresh portfolio:', error);
      }
    },
    
    async refreshPositions(sessionId) {
      if (!sessionId) return;
      
      try {
        const positions = await liveTradingAPI.getPositions(sessionId);
        actions.setPositions(positions);
      } catch (error) {
        console.error('Failed to refresh positions:', error);
      }
    },
    
    async refreshPerformance(sessionId) {
      if (!sessionId) return;
      
      try {
        const performance = await liveTradingAPI.getPerformanceMetrics(sessionId);
        if (performance) {
          actions.setPerformance(performance);
        }
      } catch (error) {
        console.error('Failed to refresh performance:', error);
      }
    },
    
    async refreshTrades(sessionId) {
      if (!sessionId) return;
      
      try {
        const trades = await liveTradingAPI.getTradeHistory(sessionId);
        actions.setTrades(trades);
      } catch (error) {
        console.error('Failed to refresh trades:', error);
      }
    },
    
    async refreshMarketData(symbols) {
      try {
        const data = await liveTradingAPI.getMarketData(symbols);
        const marketDataMap = data.reduce((acc, item) => {
          acc[item.symbol] = item;
          return acc;
        }, {});
        actions.setMarketData(marketDataMap);
      } catch (error) {
        console.error('Failed to refresh market data:', error);
      }
    },
    
    async refreshSystemHealth() {
      try {
        const health = await liveTradingAPI.getSystemHealth();
        actions.setSystemHealth(health);
        actions.setConnectionStatus(health.healthy);
      } catch (error) {
        console.error('Failed to refresh system health:', error);
        actions.setConnectionStatus(false);
      }
    }
  };

  // Real-time Monitoring
  let monitoringInterval = null;
  
  const monitorSession = (sessionId) => {
    // Clear existing monitoring
    stopMonitoring();
    
    // Start monitoring with 5-second intervals
    monitoringInterval = setInterval(async () => {
      await Promise.all([
        tradingActions.refreshPortfolio(sessionId),
        tradingActions.refreshPositions(sessionId),
        tradingActions.refreshPerformance(sessionId),
        tradingActions.refreshTrades(sessionId)
      ]);
    }, 5000);
    
    // Also refresh market data every 10 seconds
    setInterval(() => {
      if (state.positions.length > 0) {
        const symbols = state.positions.map(pos => pos.symbol);
        tradingActions.refreshMarketData(symbols);
      }
    }, 10000);
  };
  
  const stopMonitoring = () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
  };

  // Setup API Event Listeners
  useEffect(() => {
    // Initialize backend services
    const initializeServices = async () => {
      try {
        // Initialize backend API service
        await backendApiService.init();
        
        // Setup backend event listeners
        backendApiService.on('onInitialized', () => {
          console.log('✅ Backend API service ready');
          actions.setConnectionStatus(true);
        });
        
        backendApiService.on('onError', (error) => {
          console.error('❌ Backend API error:', error);
          actions.setError(error.error);
        });
        
      } catch (error) {
        console.error('Service initialization failed:', error);
        actions.setError(error.message);
      }
    };
    
    // Listen for paper trading events
    paperTradingService.on('onSessionStarted', (session) => {
      actions.setActiveSession(session);
      actions.updateSessionStatus('active');
      monitorSession(session.sessionId);
    });
    
    paperTradingService.on('onSessionStopped', (session) => {
      actions.setActiveSession(null);
      actions.updateSessionStatus('stopped');
      stopMonitoring();
    });
    
    paperTradingService.on('onTradeExecuted', (trade) => {
      actions.addTrade(trade);
    });
    
    paperTradingService.on('onPortfolioUpdate', (portfolio) => {
      actions.setPortfolio(portfolio);
    });
    
    // Listen for WebSocket events
    websocketService.on('onMarketData', (data) => {
      actions.setMarketData(data);
    });
    
    websocketService.on('onConnectionChange', (status) => {
      console.log('WebSocket connection status:', status);
    });
    
    // Listen for API portal events
    apiPortalService.on('onProviderConnected', (provider) => {
      console.log('Provider connected:', provider);
      actions.setConnectionStatus(true);
    });
    
    apiPortalService.on('onProviderDisconnected', (provider) => {
      console.log('Provider disconnected:', provider);
      actions.setConnectionStatus(false);
    });
    
    // Listen for legacy API events
    liveTradingAPI.on('session_started', (data) => {
      actions.setActiveSession(data.session);
      actions.updateSessionStatus('active');
    });
    
    liveTradingAPI.on('session_stopped', (data) => {
      actions.setActiveSession(null);
      actions.updateSessionStatus('stopped');
      stopMonitoring();
    });
    
    liveTradingAPI.on('trade_executed', (trade) => {
      actions.addTrade(trade);
    });
    
    liveTradingAPI.on('position_updated', (position) => {
      actions.updatePosition(position);
    });
    
    liveTradingAPI.on('performance_updated', (performance) => {
      actions.updatePerformance(performance);
    });
    
    // Initialize services
    initializeServices();
    
    // Initial system health check
    tradingActions.refreshSystemHealth();
    
    // Setup periodic health checks
    const healthInterval = setInterval(() => {
      tradingActions.refreshSystemHealth();
    }, 30000); // Every 30 seconds
    
    return () => {
      stopMonitoring();
      clearInterval(healthInterval);
      
      // Cleanup services
      backendApiService.destroy();
      websocketService.disconnect();
      liveTradingAPI.disconnect();
    };
  }, []);

  const contextValue = {
    // State
    ...state,
    
    // Actions
    ...actions,
    
    // Trading Actions
    ...tradingActions,
    
    // Utility Functions
    formatCurrency: liveTradingAPI.formatCurrency.bind(liveTradingAPI),
    formatPercentage: liveTradingAPI.formatPercentage.bind(liveTradingAPI),
    formatNumber: liveTradingAPI.formatNumber.bind(liveTradingAPI)
  };

  return (
    <TradingContext.Provider value={contextValue}>
      {children}
    </TradingContext.Provider>
  );
}

// Hook to use Trading Context
export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}

export default TradingContext;
