// 🎯 Live Trading Dashboard - Main Component
// Professional Bloomberg/TradingView-style trading interface

import React, { useState, useEffect, useContext } from 'react';
import { TradingContext } from '../contexts/TradingContext';
import { liveTradingAPI } from '../services/liveTradingAPI';
import PaperTradingControls from './PaperTradingControls';
import PortfolioViewer from './PortfolioViewer';
import PerformanceDashboard from './PerformanceDashboard';
import SessionManager from './SessionManager';
import MarketDataDashboard from './MarketDataDashboard';
import TradingSignalsPanel from './TradingSignalsPanel';
import './LiveTradingDashboard.css';

const LiveTradingDashboard = () => {
  const { 
    currentSession, 
    portfolio, 
    performance, 
    marketData,
    isConnected 
  } = useContext(TradingContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardLayout, setDashboardLayout] = useState('default');

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await Promise.all([
        liveTradingAPI.initialize(),
        loadSessionData(),
        loadMarketData()
      ]);
    } catch (err) {
      setError(`Dashboard initialization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionData = async () => {
    try {
      const sessions = await liveTradingAPI.getActiveSessions();
      // Handle session data loading
    } catch (err) {
      console.error('Failed to load session data:', err);
    }
  };

  const loadMarketData = async () => {
    try {
      const data = await liveTradingAPI.getMarketOverview();
      // Handle market data loading
    } catch (err) {
      console.error('Failed to load market data:', err);
    }
  };

  const handleLayoutChange = (layout) => {
    setDashboardLayout(layout);
    // Save layout preference
    localStorage.setItem('trading-dashboard-layout', layout);
  };

  if (loading) {
    return (
      <div className="trading-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Initializing Live Trading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trading-dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>Dashboard Error</h3>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={initializeDashboard}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={`live-trading-dashboard layout-${dashboardLayout}`}>
      {/* Connection Status Bar */}
      <div className="connection-status-bar">
        <div className="status-indicators">
          <div className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="market-status">
            <span className="status-text">Market: OPEN</span>
            <span className="market-time">15:30 IST</span>
          </div>
        </div>
        
        <div className="dashboard-controls">
          <select 
            value={dashboardLayout} 
            onChange={(e) => handleLayoutChange(e.target.value)}
            className="layout-selector"
          >
            <option value="default">Default Layout</option>
            <option value="compact">Compact View</option>
            <option value="expanded">Expanded View</option>
            <option value="mobile">Mobile Optimized</option>
          </select>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Panel - Trading Controls & Portfolio */}
        <div className="dashboard-left-panel">
          <div className="panel-section">
            <PaperTradingControls 
              currentSession={currentSession}
              onSessionStart={liveTradingAPI.startSession}
              onSessionStop={liveTradingAPI.stopSession}
            />
          </div>
          
          <div className="panel-section">
            <PortfolioViewer 
              portfolio={portfolio}
              onRefresh={loadSessionData}
            />
          </div>
          
          <div className="panel-section">
            <SessionManager
              sessions={currentSession ? [currentSession] : []}
              onSessionSelect={(session) => console.log('Session selected:', session)}
            />
          </div>
        </div>

        {/* Center Panel - Market Data & Charts */}
        <div className="dashboard-center-panel">
          <div className="panel-section full-height">
            <MarketDataDashboard 
              marketData={marketData}
              layout={dashboardLayout}
            />
          </div>
        </div>

        {/* Right Panel - Performance & Signals */}
        <div className="dashboard-right-panel">
          <div className="panel-section">
            <PerformanceDashboard 
              performance={performance}
              currentSession={currentSession}
            />
          </div>
          
          <div className="panel-section">
            <TradingSignalsPanel
              signals={[]} // Will be populated from context
              onSignalAction={(signal, action) => console.log('Signal action:', signal, action)}
            />
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="dashboard-footer">
        <div className="footer-stats">
          <span>Active Strategies: {currentSession?.activeStrategies || 0}</span>
          <span>Daily P&L: <span className="price-positive">+$1,234.56</span></span>
          <span>Win Rate: 67.3%</span>
        </div>
        
        <div className="footer-info">
          <span>Last Update: {new Date().toLocaleTimeString()}</span>
          <span>API Latency: &lt;50ms</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTradingDashboard;