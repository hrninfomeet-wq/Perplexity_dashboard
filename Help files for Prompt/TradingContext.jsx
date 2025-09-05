// 🎯 Trading Context - Global State Management
// Manages live trading state, portfolio, performance, and real-time data

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { liveTradingAPI } from '../services/liveTradingAPI';

// === INITIAL STATE === //
const initialState = {
  // Connection State
  isConnected: false,
  isLoading: false,
  error: null,

  // Session Management
  currentSession: null,
  availableSessions: [],

  // Portfolio Data
  portfolio: {
    totalValue: 0,
    positions: [],
    availableCapital: 100000,
    investedCapital: 0,
    unrealizedPnL: 0,
    realizedPnL: 0,
    dailyPnL: 0,
    totalPnL: 0
  },

  // Performance Metrics
  performance: {
    winRate: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    averageWin: 0,
    averageLoss: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    currentDrawdown: 0,
    profitFactor: 0,
    dailyReturns: [],
    monthlyReturns: []
  },

  // Market Data
  marketData: {
    indices: {},
    cryptoPrices: {},
    marketStatus: 'UNKNOWN',
    lastUpdate: null
  },

  // Trading Signals
  signals: [],

  // Strategy Status
  strategies: {
    available: [],
    active: [],
    performance: {}
  },

  // Risk Metrics
  risk: {
    portfolioRisk: 0,
    positionSizing: 0,
    maxPositionSize: 20000,
    riskPerTrade: 0.02,
    stopLossLevel: 0.05
  }
};

// === ACTION TYPES === //
const actionTypes = {
  // Connection Actions
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Session Actions
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  UPDATE_SESSION_STATUS: 'UPDATE_SESSION_STATUS',
  SET_AVAILABLE_SESSIONS: 'SET_AVAILABLE_SESSIONS',

  // Portfolio Actions
  UPDATE_PORTFOLIO: 'UPDATE_PORTFOLIO',
  UPDATE_POSITIONS: 'UPDATE_POSITIONS',
  ADD_TRADE_EXECUTION: 'ADD_TRADE_EXECUTION',

  // Performance Actions
  UPDATE_PERFORMANCE: 'UPDATE_PERFORMANCE',
  UPDATE_DAILY_PERFORMANCE: 'UPDATE_DAILY_PERFORMANCE',

  // Market Data Actions
  UPDATE_MARKET_DATA: 'UPDATE_MARKET_DATA',
  UPDATE_CRYPTO_PRICES: 'UPDATE_CRYPTO_PRICES',
  UPDATE_MARKET_STATUS: 'UPDATE_MARKET_STATUS',

  // Trading Signals Actions
  ADD_TRADING_SIGNAL: 'ADD_TRADING_SIGNAL',
  UPDATE_SIGNAL_STATUS: 'UPDATE_SIGNAL_STATUS',
  CLEAR_OLD_SIGNALS: 'CLEAR_OLD_SIGNALS',

  // Strategy Actions
  SET_AVAILABLE_STRATEGIES: 'SET_AVAILABLE_STRATEGIES',
  UPDATE_STRATEGY_STATUS: 'UPDATE_STRATEGY_STATUS',
  UPDATE_STRATEGY_PERFORMANCE: 'UPDATE_STRATEGY_PERFORMANCE',

  // Risk Actions
  UPDATE_RISK_METRICS: 'UPDATE_RISK_METRICS'
};

// === REDUCER === //
const tradingReducer = (state, action) => {
  switch (action.type) {
    // Connection Reducers
    case actionTypes.SET_CONNECTION_STATUS:
      return { ...state, isConnected: action.payload };

    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    // Session Reducers
    case actionTypes.SET_CURRENT_SESSION:
      return { ...state, currentSession: action.payload };

    case actionTypes.UPDATE_SESSION_STATUS:
      return {
        ...state,
        currentSession: state.currentSession 
          ? { ...state.currentSession, ...action.payload }
          : null
      };

    case actionTypes.SET_AVAILABLE_SESSIONS:
      return { ...state, availableSessions: action.payload };

    // Portfolio Reducers
    case actionTypes.UPDATE_PORTFOLIO:
      return {
        ...state,
        portfolio: { ...state.portfolio, ...action.payload }
      };

    case actionTypes.UPDATE_POSITIONS:
      return {
        ...state,
        portfolio: { ...state.portfolio, positions: action.payload }
      };

    case actionTypes.ADD_TRADE_EXECUTION:
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          // Update relevant portfolio metrics based on trade
          totalTrades: state.performance.totalTrades + 1
        }
      };

    // Performance Reducers
    case actionTypes.UPDATE_PERFORMANCE:
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };

    case actionTypes.UPDATE_DAILY_PERFORMANCE:
      const { date, pnl } = action.payload;
      return {
        ...state,
        performance: {
          ...state.performance,
          dailyReturns: [
            ...state.performance.dailyReturns.filter(r => r.date !== date),
            { date, pnl }
          ].slice(-30) // Keep last 30 days
        }
      };

    // Market Data Reducers
    case actionTypes.UPDATE_MARKET_DATA:
      return {
        ...state,
        marketData: { 
          ...state.marketData, 
          ...action.payload,
          lastUpdate: new Date().toISOString()
        }
      };

    case actionTypes.UPDATE_CRYPTO_PRICES:
      return {
        ...state,
        marketData: {
          ...state.marketData,
          cryptoPrices: { ...state.marketData.cryptoPrices, ...action.payload },
          lastUpdate: new Date().toISOString()
        }
      };

    case actionTypes.UPDATE_MARKET_STATUS:
      return {
        ...state,
        marketData: { ...state.marketData, marketStatus: action.payload }
      };

    // Trading Signals Reducers
    case actionTypes.ADD_TRADING_SIGNAL:
      return {
        ...state,
        signals: [action.payload, ...state.signals].slice(0, 50) // Keep latest 50 signals
      };

    case actionTypes.UPDATE_SIGNAL_STATUS:
      const { signalId, status } = action.payload;
      return {
        ...state,
        signals: state.signals.map(signal => 
          signal.id === signalId 
            ? { ...signal, status }
            : signal
        )
      };

    case actionTypes.CLEAR_OLD_SIGNALS:
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      return {
        ...state,
        signals: state.signals.filter(signal => signal.timestamp > cutoffTime)
      };

    // Strategy Reducers
    case actionTypes.SET_AVAILABLE_STRATEGIES:
      return {
        ...state,
        strategies: { ...state.strategies, available: action.payload }
      };

    case actionTypes.UPDATE_STRATEGY_STATUS:
      return {
        ...state,
        strategies: { ...state.strategies, active: action.payload }
      };

    case actionTypes.UPDATE_STRATEGY_PERFORMANCE:
      const { strategyId, performance } = action.payload;
      return {
        ...state,
        strategies: {
          ...state.strategies,
          performance: {
            ...state.strategies.performance,
            [strategyId]: performance
          }
        }
      };

    // Risk Reducers
    case actionTypes.UPDATE_RISK_METRICS:
      return {
        ...state,
        risk: { ...state.risk, ...action.payload }
      };

    default:
      return state;
  }
};

// === CONTEXT CREATION === //
const TradingContext = createContext();

// === CONTEXT PROVIDER === //
const TradingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // === INITIALIZATION === //
  useEffect(() => {
    initializeTrading();
    
    return () => {
      cleanupTrading();
    };
  }, []);

  const initializeTrading = async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      // Initialize API connection
      await liveTradingAPI.initialize();
      
      // Set up event listeners
      setupEventListeners();
      
      // Load initial data
      await loadInitialData();
      
      dispatch({ type: actionTypes.SET_CONNECTION_STATUS, payload: true });
      dispatch({ type: actionTypes.CLEAR_ERROR });
      
    } catch (error) {
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Failed to initialize trading: ${error.message}` 
      });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  const setupEventListeners = () => {
    // Connection status
    liveTradingAPI.on('connection', (data) => {
      dispatch({ 
        type: actionTypes.SET_CONNECTION_STATUS, 
        payload: data.status === 'connected' 
      });
    });

    // Market data updates
    liveTradingAPI.on('marketData', (data) => {
      dispatch({ type: actionTypes.UPDATE_MARKET_DATA, payload: data });
    });

    // Portfolio updates
    liveTradingAPI.on('portfolioUpdate', (data) => {
      dispatch({ type: actionTypes.UPDATE_PORTFOLIO, payload: data });
    });

    // Performance updates
    liveTradingAPI.on('performanceUpdate', (data) => {
      dispatch({ type: actionTypes.UPDATE_PERFORMANCE, payload: data });
    });

    // Trading signals
    liveTradingAPI.on('tradingSignal', (data) => {
      dispatch({ type: actionTypes.ADD_TRADING_SIGNAL, payload: data });
    });

    // Trade executions
    liveTradingAPI.on('tradeExecution', (data) => {
      dispatch({ type: actionTypes.ADD_TRADE_EXECUTION, payload: data });
    });

    // Session status updates
    liveTradingAPI.on('sessionStatus', (data) => {
      dispatch({ type: actionTypes.UPDATE_SESSION_STATUS, payload: data });
    });

    // Error handling
    liveTradingAPI.on('error', (data) => {
      dispatch({ type: actionTypes.SET_ERROR, payload: data.error });
    });
  };

  const loadInitialData = async () => {
    try {
      // Load active sessions
      const sessions = await liveTradingAPI.getActiveSessions();
      dispatch({ type: actionTypes.SET_AVAILABLE_SESSIONS, payload: sessions.data || [] });
      
      // Set current session if available
      if (sessions.data && sessions.data.length > 0) {
        const currentSession = sessions.data[0];
        dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: currentSession });
        
        // Load portfolio for current session
        await loadPortfolioData(currentSession.sessionId);
        
        // Load performance data
        await loadPerformanceData(currentSession.sessionId);
      }
      
      // Load market data
      await loadMarketData();
      
      // Load available strategies
      await loadStrategies();
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Failed to load initial data: ${error.message}` 
      });
    }
  };

  // === ACTION CREATORS === //
  const startPaperTradingSession = useCallback(async (config) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await liveTradingAPI.startSession(config);
      
      if (result.success) {
        dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: result.session });
        dispatch({ type: actionTypes.CLEAR_ERROR });
      }
      
      return result;
    } catch (error) {
      const errorMessage = `Failed to start session: ${error.message}`;
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  const stopPaperTradingSession = useCallback(async (sessionId) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const result = await liveTradingAPI.stopSession(sessionId);
      
      if (result.success) {
        dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: null });
        dispatch({ type: actionTypes.CLEAR_ERROR });
      }
      
      return result;
    } catch (error) {
      const errorMessage = `Failed to stop session: ${error.message}`;
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  const loadPortfolioData = useCallback(async (sessionId) => {
    try {
      const portfolio = await liveTradingAPI.getPortfolio(sessionId);
      const positions = await liveTradingAPI.getPortfolioPositions(sessionId);
      
      dispatch({ 
        type: actionTypes.UPDATE_PORTFOLIO, 
        payload: { ...portfolio.data, positions: positions.data || [] }
      });
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    }
  }, []);

  const loadPerformanceData = useCallback(async (sessionId) => {
    try {
      const performance = await liveTradingAPI.getPerformanceMetrics(sessionId);
      dispatch({ type: actionTypes.UPDATE_PERFORMANCE, payload: performance.data });
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  }, []);

  const loadMarketData = useCallback(async () => {
    try {
      const marketData = await liveTradingAPI.getMarketOverview();
      dispatch({ type: actionTypes.UPDATE_MARKET_DATA, payload: marketData.data });
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  }, []);

  const loadStrategies = useCallback(async () => {
    try {
      const strategies = await liveTradingAPI.getAvailableStrategies();
      dispatch({ 
        type: actionTypes.SET_AVAILABLE_STRATEGIES, 
        payload: strategies.data || [] 
      });
    } catch (error) {
      console.error('Failed to load strategies:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  }, []);

  const refreshData = useCallback(async () => {
    if (state.currentSession) {
      await Promise.all([
        loadPortfolioData(state.currentSession.sessionId),
        loadPerformanceData(state.currentSession.sessionId),
        loadMarketData()
      ]);
    } else {
      await loadMarketData();
    }
  }, [state.currentSession, loadPortfolioData, loadPerformanceData, loadMarketData]);

  const cleanupTrading = () => {
    liveTradingAPI.disconnect();
  };

  // === CONTEXT VALUE === //
  const contextValue = {
    // State
    ...state,
    
    // Actions
    startPaperTradingSession,
    stopPaperTradingSession,
    clearError,
    refreshData,
    
    // Data loaders
    loadPortfolioData,
    loadPerformanceData,
    loadMarketData,
    loadStrategies,
    
    // Utilities
    isConnected: state.isConnected && liveTradingAPI.isConnected(),
    connectionStatus: liveTradingAPI.getConnectionStatus()
  };

  return (
    <TradingContext.Provider value={contextValue}>
      {children}
    </TradingContext.Provider>
  );
};

// === CUSTOM HOOK === //
const useTradingContext = () => {
  const context = useContext(TradingContext);
  
  if (!context) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  
  return context;
};

export { TradingContext, TradingProvider, useTradingContext };
export default TradingContext;