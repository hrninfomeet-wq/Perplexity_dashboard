// frontend/src/components/dashboard/DashboardComponent.jsx
import React, { useState, useEffect } from 'react';
import { useTrading } from '../../contexts/TradingContext';
import TradingChart from './TradingChart';
import PortfolioView from './PortfolioView';
import StrategySelector from './StrategySelector';
import ConnectButton from '../shared/ConnectButton';
import AlertsStrip from '../shared/AlertsStrip';
import PaperTradingControls from '../trading/PaperTradingControls';
import apiPortalService from '../../services/apiPortalService';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const DashboardComponent = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY 50');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    provider: null,
    status: 'disconnected',
    isConnected: false
  });

  const {
    activeSession,
    portfolio,
    positions,
    trades,
    signals,
    performance,
    isLoading
  } = useTrading();

  // Connection state management
  useEffect(() => {
    setConnectionInfo(apiPortalService.getConnectionInfo());

    const handleConnectionChange = () => {
      setConnectionInfo(apiPortalService.getConnectionInfo());
    };

    apiPortalService.on('onConnectionChange', handleConnectionChange);
    return () => apiPortalService.off('onConnectionChange', handleConnectionChange);
  }, []);

  // Handle provider selection
  const handleProviderSelect = async (provider) => {
    try {
      await apiPortalService.connectToProvider(provider);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Bar */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="sidebar-toggle-btn"
          >
            {sidebarCollapsed ? <Bars3Icon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5" />}
          </button>
          
          <h1 className="dashboard-title">NSE Trading Dashboard</h1>
          
          {/* Real-time Status Indicators */}
          <div className="status-indicators">
            <div className={`status-dot ${connectionInfo.isConnected ? 'connected' : 'disconnected'}`} />
            <span className="status-text">
              {connectionInfo.isConnected ? connectionInfo.provider?.name || 'Connected' : 'Disconnected'}
            </span>
            
            {activeSession && (
              <>
                <div className="session-status">
                  <span className="session-dot active" />
                  <span>Paper Trading Active</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="header-center">
          <AlertsStrip />
        </div>

        <div className="header-right">
          <ConnectButton
            onProviderSelect={handleProviderSelect}
            selectedProvider={connectionInfo.provider}
            isConnected={connectionInfo.isConnected}
            connectionStatus={connectionInfo.status}
          />
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className={`dashboard-grid ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${rightPanelCollapsed ? 'right-panel-collapsed' : ''}`}>
        
        {/* Left Sidebar - Strategy & Controls */}
        {!sidebarCollapsed && (
          <aside className="dashboard-sidebar">
            <div className="sidebar-section">
              <h3 className="section-title">Trading Strategies</h3>
              <StrategySelector />
            </div>

            <div className="sidebar-section">
              <h3 className="section-title">Symbol Selection</h3>
              <div className="symbol-selector">
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="symbol-dropdown"
                >
                  <option value="NIFTY 50">NIFTY 50</option>
                  <option value="BANKNIFTY">BANK NIFTY</option>
                  <option value="RELIANCE">RELIANCE</option>
                  <option value="TCS">TCS</option>
                  <option value="HDFC">HDFC BANK</option>
                  <option value="INFY">INFOSYS</option>
                  <option value="ITC">ITC</option>
                  <option value="SBIN">SBI</option>
                </select>
              </div>
            </div>

            <div className="sidebar-section">
              <h3 className="section-title">Timeframe</h3>
              <div className="timeframe-selector">
                {['1m', '3m', '5m', '15m', '1h', '1d'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`timeframe-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Portfolio Summary */}
            <div className="sidebar-section">
              <h3 className="section-title">Portfolio Summary</h3>
              <div className="portfolio-quick-stats">
                <div className="quick-stat">
                  <span className="stat-label">Total P&L</span>
                  <span className={`stat-value ${portfolio.totalPnL >= 0 ? 'positive' : 'negative'}`}>
                    ₹{portfolio.totalPnL?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Day P&L</span>
                  <span className={`stat-value ${portfolio.dayPnL >= 0 ? 'positive' : 'negative'}`}>
                    ₹{portfolio.dayPnL?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Available</span>
                  <span className="stat-value">
                    ₹{portfolio.availableCapital?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Chart Area */}
        <main className="main-chart-area">
          <div className="chart-header">
            <div className="chart-title">
              <h2>{selectedSymbol} - {selectedTimeframe}</h2>
              <div className="chart-controls">
                <button className="chart-btn">Technical Analysis</button>
                <button className="chart-btn">Pattern Recognition</button>
                <button className="chart-btn">ML Signals</button>
              </div>
            </div>
          </div>
          
          <TradingChart 
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            connectionInfo={connectionInfo}
          />
        </main>

        {/* Right Panel - Portfolio & Analytics */}
        {!rightPanelCollapsed && (
          <aside className="right-panel">
            <div className="panel-header">
              <h3>Portfolio & Analytics</h3>
              <button
                onClick={() => setRightPanelCollapsed(true)}
                className="panel-toggle-btn"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <PortfolioView />

            <div className="panel-section">
              <h4 className="panel-section-title">Paper Trading</h4>
              <PaperTradingControls />
            </div>

            <div className="panel-section">
              <h4 className="panel-section-title">Recent Signals</h4>
              <div className="signals-list">
                {signals.slice(0, 5).map((signal, index) => (
                  <div key={index} className="signal-item">
                    <div className="signal-header">
                      <span className={`signal-type ${signal.type}`}>{signal.type.toUpperCase()}</span>
                      <span className="signal-time">{signal.timestamp}</span>
                    </div>
                    <div className="signal-details">
                      <span className="signal-symbol">{signal.symbol}</span>
                      <span className={`signal-confidence confidence-${Math.round(signal.confidence / 20)}`}>
                        {signal.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section">
              <h4 className="panel-section-title">Active Positions</h4>
              <div className="positions-list">
                {positions.slice(0, 3).map((position, index) => (
                  <div key={index} className="position-item">
                    <div className="position-header">
                      <span className="position-symbol">{position.symbol}</span>
                      <span className={`position-side ${position.side}`}>{position.side}</span>
                    </div>
                    <div className="position-details">
                      <span className="position-qty">Qty: {position.quantity}</span>
                      <span className={`position-pnl ${position.unrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
                        ₹{position.unrealizedPnL?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Collapsed Panel Toggle */}
        {rightPanelCollapsed && (
          <button
            onClick={() => setRightPanelCollapsed(false)}
            className="collapsed-panel-toggle"
          >
            <Bars3Icon className="h-5 w-5" />
            <span>Analytics</span>
          </button>
        )}
      </div>

      {/* Bottom Panel - Trade History & Logs */}
      <div className="bottom-panel">
        <div className="panel-tabs">
          <button className="tab-btn active">Trade History</button>
          <button className="tab-btn">Execution Logs</button>
          <button className="tab-btn">Performance</button>
        </div>
        
        <div className="panel-content">
          <div className="trades-table">
            <div className="table-header">
              <span>Time</span>
              <span>Symbol</span>
              <span>Side</span>
              <span>Quantity</span>
              <span>Price</span>
              <span>P&L</span>
              <span>Status</span>
            </div>
            {trades.slice(0, 10).map((trade, index) => (
              <div key={index} className="table-row">
                <span>{trade.timestamp}</span>
                <span>{trade.symbol}</span>
                <span className={`trade-side ${trade.side}`}>{trade.side}</span>
                <span>{trade.quantity}</span>
                <span>₹{trade.price}</span>
                <span className={`trade-pnl ${trade.pnl >= 0 ? 'positive' : 'negative'}`}>
                  ₹{trade.pnl?.toFixed(2)}
                </span>
                <span className={`trade-status ${trade.status}`}>{trade.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardComponent;
