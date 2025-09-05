// frontend/src/components/dashboard/PortfolioView.jsx
import React, { useState, useEffect } from 'react';
import { useTrading } from '../../contexts/TradingContext';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const PortfolioView = () => {
  const {
    activeSession,
    portfolio,
    positions,
    performance,
    trades,
    formatCurrency,
    formatPercentage,
    formatNumber
  } = useTrading();

  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('today');

  // Calculate additional metrics
  const totalInvested = portfolio.investedAmount || 0;
  const currentValue = portfolio.currentValue || 0;
  const totalReturn = currentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  
  const dayPnL = portfolio.dayPnL || 0;
  const dayPnLPercent = totalInvested > 0 ? (dayPnL / totalInvested) * 100 : 0;

  // Get color for P&L values
  const getPnLColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPnLIcon = (value) => {
    if (value > 0) return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
    return <ChartBarIcon className="h-4 w-4 text-gray-600" />;
  };

  // Sample performance data
  const performanceMetrics = {
    winRate: 68.5,
    avgWin: 1250,
    avgLoss: -890,
    profitFactor: 1.65,
    sharpeRatio: 1.23,
    maxDrawdown: -4.2,
    totalTrades: 45,
    winningTrades: 31,
    losingTrades: 14
  };

  return (
    <div className="portfolio-view">
      
      {/* Tab Navigation */}
      <div className="portfolio-tabs">
        {['overview', 'positions', 'performance'].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`portfolio-tab ${selectedTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        {['today', 'week', 'month', 'year'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="portfolio-overview">
          
          {/* Main Metrics */}
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-header">
                <span className="metric-label">Total Portfolio Value</span>
                <ClockIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="metric-value">
                {formatCurrency(currentValue)}
              </div>
              <div className="metric-change">
                <span className={getPnLColor(totalReturn)}>
                  {getPnLIcon(totalReturn)}
                  {formatCurrency(totalReturn)} ({formatPercentage(totalReturnPercent)})
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Day P&L</span>
              </div>
              <div className={`metric-value ${getPnLColor(dayPnL)}`}>
                {formatCurrency(dayPnL)}
              </div>
              <div className="metric-change">
                <span className={getPnLColor(dayPnLPercent)}>
                  {formatPercentage(dayPnLPercent)}
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Available Capital</span>
              </div>
              <div className="metric-value">
                {formatCurrency(portfolio.availableCapital)}
              </div>
              <div className="metric-change">
                <span className="text-gray-500">
                  {formatPercentage((portfolio.availableCapital / portfolio.totalCapital) * 100)} of total
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Invested Amount</span>
              </div>
              <div className="metric-value">
                {formatCurrency(totalInvested)}
              </div>
              <div className="metric-change">
                <span className="text-gray-500">
                  {positions.length} positions
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">{performanceMetrics.winRate}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Trades</span>
              <span className="stat-value">{performanceMetrics.totalTrades}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Profit Factor</span>
              <span className="stat-value">{performanceMetrics.profitFactor}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Drawdown</span>
              <span className="stat-value text-red-600">{performanceMetrics.maxDrawdown}%</span>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'positions' && (
        <div className="portfolio-positions">
          <div className="positions-header">
            <h4>Active Positions ({positions.length})</h4>
            <div className="positions-summary">
              <span className="summary-item">
                Total: {formatCurrency(positions.reduce((sum, pos) => sum + (pos.currentValue || 0), 0))}
              </span>
            </div>
          </div>

          <div className="positions-list">
            {positions.length > 0 ? positions.map((position, index) => {
              const unrealizedPnL = position.unrealizedPnL || 0;
              const unrealizedPnLPercent = position.unrealizedPnLPercentage || 0;
              
              return (
                <div key={index} className="position-card">
                  <div className="position-header">
                    <div className="position-symbol">
                      <span className="symbol-name">{position.symbol}</span>
                      <span className={`position-side ${position.side}`}>
                        {position.side === 'buy' ? 'LONG' : 'SHORT'}
                      </span>
                    </div>
                    <div className="position-actions">
                      <button className="action-btn">Exit</button>
                    </div>
                  </div>

                  <div className="position-details">
                    <div className="detail-row">
                      <span className="detail-label">Quantity</span>
                      <span className="detail-value">{formatNumber(position.quantity)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Avg Price</span>
                      <span className="detail-value">{formatCurrency(position.averagePrice)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Current Price</span>
                      <span className="detail-value">{formatCurrency(position.currentPrice)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">P&L</span>
                      <span className={`detail-value ${getPnLColor(unrealizedPnL)}`}>
                        {formatCurrency(unrealizedPnL)} ({formatPercentage(unrealizedPnLPercent)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="no-positions">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-gray-500 mt-2">No active positions</p>
                <p className="text-gray-400 text-sm">Start trading to see your positions here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'performance' && (
        <div className="portfolio-performance">
          <div className="performance-metrics">
            <div className="metrics-row">
              <div className="performance-metric">
                <span className="metric-label">Win Rate</span>
                <span className="metric-value text-green-600">{performanceMetrics.winRate}%</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill bg-green-500" 
                    style={{ width: `${performanceMetrics.winRate}%` }}
                  />
                </div>
              </div>

              <div className="performance-metric">
                <span className="metric-label">Profit Factor</span>
                <span className="metric-value">{performanceMetrics.profitFactor}</span>
                <span className="metric-sublabel">
                  Avg Win: {formatCurrency(performanceMetrics.avgWin)} | 
                  Avg Loss: {formatCurrency(performanceMetrics.avgLoss)}
                </span>
              </div>
            </div>

            <div className="metrics-row">
              <div className="performance-metric">
                <span className="metric-label">Sharpe Ratio</span>
                <span className="metric-value">{performanceMetrics.sharpeRatio}</span>
              </div>

              <div className="performance-metric">
                <span className="metric-label">Max Drawdown</span>
                <span className="metric-value text-red-600">{performanceMetrics.maxDrawdown}%</span>
              </div>
            </div>

            <div className="trade-summary">
              <div className="summary-item">
                <span className="summary-label">Total Trades</span>
                <span className="summary-value">{performanceMetrics.totalTrades}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Winning Trades</span>
                <span className="summary-value text-green-600">{performanceMetrics.winningTrades}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Losing Trades</span>
                <span className="summary-value text-red-600">{performanceMetrics.losingTrades}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Info */}
      {activeSession && (
        <div className="session-info">
          <div className="session-header">
            <span className="session-status active">●</span>
            <span className="session-label">Paper Trading Session</span>
          </div>
          <div className="session-details">
            <div className="session-detail">
              <span className="detail-label">Session ID</span>
              <span className="detail-value">{activeSession.sessionId?.slice(0, 8)}...</span>
            </div>
            <div className="session-detail">
              <span className="detail-label">Started</span>
              <span className="detail-value">{activeSession.startTime}</span>
            </div>
            <div className="session-detail">
              <span className="detail-label">Strategy</span>
              <span className="detail-value">{activeSession.strategy}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioView;
