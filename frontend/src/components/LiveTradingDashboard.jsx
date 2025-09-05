import React, { useState, useEffect, useRef } from 'react';
import { useTrading } from '../contexts/TradingContext';
import '../styles/live-trading-enhancements.css';

const LiveTradingDashboard = () => {
  const {
    activeSession,
    portfolio,
    positions,
    performance,
    trades,
    signals,
    riskMetrics,
    isLoading,
    error,
    startPaperTrading,
    stopPaperTrading,
    refreshPortfolio,
    refreshPositions,
    formatCurrency,
    formatPercentage,
    formatNumber
  } = useTrading();

  const [selectedTab, setSelectedTab] = useState('portfolio');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const intervalRef = useRef(null);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && activeSession) {
      intervalRef.current = setInterval(() => {
        refreshPortfolio(activeSession.sessionId);
        refreshPositions(activeSession.sessionId);
      }, refreshInterval * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, activeSession, refreshPortfolio, refreshPositions]);

  const handleStartTrading = async () => {
    const options = {
      startingCapital: 100000, // $100,000 default
      strategy: 'manual',
      riskLevel: 'medium'
    };

    await startPaperTrading('user123', options);
  };

  const handleStopTrading = async () => {
    if (activeSession) {
      await stopPaperTrading(activeSession.sessionId);
    }
  };

  const getPnLColor = (value) => {
    if (value > 0) return '#00ff88';
    if (value < 0) return '#ff4757';
    return '#747d8c';
  };

  const getPositionPnLColor = (position) => {
    const unrealizedPnL = (position.currentPrice - position.averagePrice) * position.quantity;
    return getPnLColor(unrealizedPnL);
  };

  const renderPortfolioSection = () => (
    <div className="portfolio-section">
      <div className="portfolio-header">
        <h3>Portfolio Overview</h3>
        <div className="portfolio-controls">
          <div className="auto-refresh-control">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto Refresh
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
            >
              <option value={1}>1s</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
            </select>
          </div>
        </div>
      </div>

      <div className="portfolio-metrics">
        <div className="metric-card">
          <div className="metric-label">Total Capital</div>
          <div className="metric-value">
            {formatCurrency(portfolio.totalCapital)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Available Capital</div>
          <div className="metric-value">
            {formatCurrency(portfolio.availableCapital)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Invested Amount</div>
          <div className="metric-value">
            {formatCurrency(portfolio.investedAmount)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Current Value</div>
          <div className="metric-value">
            {formatCurrency(portfolio.currentValue)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Day P&L</div>
          <div className="metric-value" style={{ color: getPnLColor(portfolio.dayPnL) }}>
            {formatCurrency(portfolio.dayPnL)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total P&L</div>
          <div className="metric-value" style={{ color: getPnLColor(portfolio.totalPnL) }}>
            {formatCurrency(portfolio.totalPnL)}
            <span className="percentage">
              ({formatPercentage(portfolio.totalReturnPercentage)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPositionsSection = () => (
    <div className="positions-section">
      <div className="section-header">
        <h3>Current Positions ({positions.length})</h3>
        <div className="positions-summary">
          <span>Total Value: {formatCurrency(
            positions.reduce((sum, pos) => sum + (pos.currentPrice * pos.quantity), 0)
          )}</span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="no-data">
          <p>No open positions</p>
        </div>
      ) : (
        <div className="positions-table">
          <div className="table-header">
            <div className="col">Symbol</div>
            <div className="col">Qty</div>
            <div className="col">Avg Price</div>
            <div className="col">Current Price</div>
            <div className="col">Market Value</div>
            <div className="col">Unrealized P&L</div>
            <div className="col">% Change</div>
          </div>

          <div className="table-body">
            {positions.map((position) => {
              const marketValue = position.currentPrice * position.quantity;
              const unrealizedPnL = (position.currentPrice - position.averagePrice) * position.quantity;
              const percentChange = ((position.currentPrice - position.averagePrice) / position.averagePrice) * 100;

              return (
                <div key={position.positionId} className="table-row">
                  <div className="col symbol">{position.symbol}</div>
                  <div className="col">{formatNumber(position.quantity)}</div>
                  <div className="col">{formatCurrency(position.averagePrice)}</div>
                  <div className="col">{formatCurrency(position.currentPrice)}</div>
                  <div className="col">{formatCurrency(marketValue)}</div>
                  <div className="col" style={{ color: getPnLColor(unrealizedPnL) }}>
                    {formatCurrency(unrealizedPnL)}
                  </div>
                  <div className="col" style={{ color: getPnLColor(percentChange) }}>
                    {formatPercentage(percentChange)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceSection = () => (
    <div className="performance-section">
      <div className="section-header">
        <h3>Performance Metrics</h3>
      </div>

      <div className="performance-grid">
        <div className="perf-group">
          <h4>Trading Statistics</h4>
          <div className="perf-metrics">
            <div className="perf-item">
              <span className="label">Total Trades</span>
              <span className="value">{performance.totalTrades}</span>
            </div>
            <div className="perf-item">
              <span className="label">Win Rate</span>
              <span className="value">{formatPercentage(performance.winRate)}</span>
            </div>
            <div className="perf-item">
              <span className="label">Winning Trades</span>
              <span className="value">{performance.winningTrades}</span>
            </div>
            <div className="perf-item">
              <span className="label">Losing Trades</span>
              <span className="value">{performance.losingTrades}</span>
            </div>
          </div>
        </div>

        <div className="perf-group">
          <h4>Profit & Loss</h4>
          <div className="perf-metrics">
            <div className="perf-item">
              <span className="label">Gross Profit</span>
              <span className="value" style={{ color: getPnLColor(performance.grossProfit) }}>
                {formatCurrency(performance.grossProfit)}
              </span>
            </div>
            <div className="perf-item">
              <span className="label">Gross Loss</span>
              <span className="value" style={{ color: getPnLColor(performance.grossLoss) }}>
                {formatCurrency(performance.grossLoss)}
              </span>
            </div>
            <div className="perf-item">
              <span className="label">Net Profit</span>
              <span className="value" style={{ color: getPnLColor(performance.netProfit) }}>
                {formatCurrency(performance.netProfit)}
              </span>
            </div>
            <div className="perf-item">
              <span className="label">Profit Factor</span>
              <span className="value">{formatNumber(performance.profitFactor, 2)}</span>
            </div>
          </div>
        </div>

        <div className="perf-group">
          <h4>Risk Metrics</h4>
          <div className="perf-metrics">
            <div className="perf-item">
              <span className="label">Max Drawdown</span>
              <span className="value" style={{ color: getPnLColor(-performance.maxDrawdown) }}>
                {formatCurrency(performance.maxDrawdown)}
              </span>
            </div>
            <div className="perf-item">
              <span className="label">Max DD %</span>
              <span className="value" style={{ color: getPnLColor(-performance.maxDrawdownPercentage) }}>
                {formatPercentage(performance.maxDrawdownPercentage)}
              </span>
            </div>
            <div className="perf-item">
              <span className="label">Sharpe Ratio</span>
              <span className="value">{formatNumber(performance.sharpeRatio, 2)}</span>
            </div>
            <div className="perf-item">
              <span className="label">Avg Trade Return</span>
              <span className="value" style={{ color: getPnLColor(performance.averageTradeReturn) }}>
                {formatCurrency(performance.averageTradeReturn)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTradesSection = () => (
    <div className="trades-section">
      <div className="section-header">
        <h3>Recent Trades ({trades.length})</h3>
      </div>

      {trades.length === 0 ? (
        <div className="no-data">
          <p>No trades yet</p>
        </div>
      ) : (
        <div className="trades-table">
          <div className="table-header">
            <div className="col">Time</div>
            <div className="col">Symbol</div>
            <div className="col">Type</div>
            <div className="col">Qty</div>
            <div className="col">Price</div>
            <div className="col">Total</div>
            <div className="col">P&L</div>
            <div className="col">Status</div>
          </div>

          <div className="table-body">
            {trades.slice(0, 20).map((trade) => (
              <div key={trade.tradeId} className="table-row">
                <div className="col">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </div>
                <div className="col symbol">{trade.symbol}</div>
                <div className="col">
                  <span className={`trade-type ${trade.type.toLowerCase()}`}>
                    {trade.type}
                  </span>
                </div>
                <div className="col">{formatNumber(trade.quantity)}</div>
                <div className="col">{formatCurrency(trade.price)}</div>
                <div className="col">{formatCurrency(trade.quantity * trade.price)}</div>
                <div className="col" style={{ color: getPnLColor(trade.realizedPnL || 0) }}>
                  {formatCurrency(trade.realizedPnL || 0)}
                </div>
                <div className="col">
                  <span className={`trade-status ${trade.status.toLowerCase()}`}>
                    {trade.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="live-trading-dashboard">
      {/* Professional Trading Dashboard Header */}
      <div className="trading-dashboard-header professional-card">
        <div className="trading-header-top">
          <div className="trading-title">
            Live Trading Dashboard
          </div>
          
          <div className="trading-status-indicator">
            <div className={`status-dot ${activeSession ? 'active' : 'inactive'}`}></div>
            <span>{activeSession ? 'Session Active' : 'No Active Session'}</span>
            {activeSession && (
              <div className="auto-refresh-indicator">
                <div className="refresh-dot"></div>
                <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
              </div>
            )}
          </div>
        </div>

        {activeSession && (
          <div className="session-info">
            <div className="session-details">
              <span className="session-label">Session ID:</span>
              <span className="session-value">{activeSession.sessionId}</span>
            </div>
            <div className="session-details">
              <span className="session-label">Trading Mode:</span>
              <span className="session-value">Paper Trading</span>
            </div>
            <div className="session-details">
              <span className="session-label">Strategy:</span>
              <span className="session-value">{activeSession.strategy || 'Manual'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Trading Controls Section */}
      <div className="trading-controls-section professional-card">
        <div className="controls-header">
          <h3 className="controls-title">Trading Controls</h3>
          
          <div className="trading-action-buttons">
            {!activeSession ? (
              <button 
                className="trading-btn primary"
                onClick={handleStartTrading}
                disabled={isLoading}
              >
                <i className="fas fa-play" />
                {isLoading ? 'Starting Session...' : 'Start Paper Trading'}
              </button>
            ) : (
              <button 
                className="trading-btn danger"
                onClick={handleStopTrading}
                disabled={isLoading}
              >
                <i className="fas fa-stop" />
                {isLoading ? 'Stopping Session...' : 'Stop Trading'}
              </button>
            )}
            
            {activeSession && (
              <>
                <button 
                  className="trading-btn secondary"
                  onClick={() => refreshPortfolio(activeSession.sessionId)}
                  disabled={isLoading}
                >
                  <i className="fas fa-sync-alt" />
                  Refresh Data
                </button>
                
                <div className="refresh-controls">
                  <label className="auto-refresh-toggle">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <span>Auto Refresh</span>
                  </label>
                  
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    disabled={!autoRefresh}
                    className="refresh-interval-select"
                  >
                    <option value={1}>1 sec</option>
                    <option value={5}>5 sec</option>
                    <option value={10}>10 sec</option>
                    <option value={30}>30 sec</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle" />
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="trading-btn secondary">
            <i className="fas fa-times" />
            Dismiss
          </button>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!activeSession ? (
        <div className="trading-card professional-card glow-effect">
          <div className="no-session-content" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.7 }}>📈</div>
            <h3 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--trading-text-primary)' }}>
              Ready to Start Trading?
            </h3>
            <p style={{ fontSize: '16px', color: 'var(--trading-text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              Launch a paper trading session to practice your strategies with real market data 
              without risking actual capital. Perfect for testing and learning.
            </p>
            <button 
              className="trading-btn primary"
              onClick={handleStartTrading}
              disabled={isLoading}
              style={{ fontSize: '16px', padding: '12px 32px' }}
            >
              <i className="fas fa-rocket" />
              {isLoading ? 'Initializing Session...' : 'Launch Paper Trading'}
            </button>
          </div>
        </div>
      ) : (
        <div className="trading-layout-container">
          {/* Enhanced Tab Navigation */}
          <div className="trading-tabs">
            <button 
              className={`tab-button ${selectedTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setSelectedTab('portfolio')}
            >
              <i className="fas fa-wallet" />
              Portfolio Overview
            </button>
            <button 
              className={`tab-button ${selectedTab === 'positions' ? 'active' : ''}`}
              onClick={() => setSelectedTab('positions')}
            >
              <i className="fas fa-list-alt" />
              Positions ({positions.length})
            </button>
            <button 
              className={`tab-button ${selectedTab === 'performance' ? 'active' : ''}`}
              onClick={() => setSelectedTab('performance')}
            >
              <i className="fas fa-chart-line" />
              Performance
            </button>
            <button 
              className={`tab-button ${selectedTab === 'trades' ? 'active' : ''}`}
              onClick={() => setSelectedTab('trades')}
            >
              <i className="fas fa-exchange-alt" />
              Trade History ({trades.length})
            </button>
          </div>

          {/* Enhanced Tab Content */}
          <div className="dashboard-content">
            {selectedTab === 'portfolio' && (
              <div className="trading-card professional-card">
                {renderPortfolioSection()}
              </div>
            )}
            {selectedTab === 'positions' && (
              <div className="trading-card professional-card">
                {renderPositionsSection()}
              </div>
            )}
            {selectedTab === 'performance' && (
              <div className="trading-card professional-card">
                {renderPerformanceSection()}
              </div>
            )}
            {selectedTab === 'trades' && (
              <div className="trading-card professional-card">
                {renderTradesSection()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(12, 16, 23, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ textAlign: 'center', color: 'var(--trading-text-primary)' }}>
            <div className="loading-spinner" style={{ marginBottom: '16px' }}></div>
            <p>Processing trading operation...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTradingDashboard;
