// frontend/src/components/dashboard/StrategySelector.jsx
import React, { useState, useEffect } from 'react';
import { useTrading } from '../../contexts/TradingContext';
import { 
  PlayIcon, 
  StopIcon, 
  CogIcon, 
  ChartBarIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const StrategySelector = () => {
  const {
    activeSession,
    startPaperTrading,
    stopPaperTrading,
    isLoading
  } = useTrading();

  const [selectedStrategy, setSelectedStrategy] = useState('scalping');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [capital, setCapital] = useState(100000);
  const [autoExecution, setAutoExecution] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Available trading strategies
  const strategies = [
    {
      id: 'scalping',
      name: 'Scalping Strategy',
      description: 'Quick profits from small price movements',
      timeframes: ['1m', '3m', '5m'],
      riskLevel: 'High',
      avgReturn: '2-5%/day',
      icon: '⚡',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'swing',
      name: 'Swing Trading',
      description: 'Medium-term trend following',
      timeframes: ['15m', '1h', '1d'],
      riskLevel: 'Medium',
      avgReturn: '5-15%/month',
      icon: '📈',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'btst',
      name: 'BTST Strategy',
      description: 'Buy Today, Sell Tomorrow',
      timeframes: ['1h', '1d'],
      riskLevel: 'Medium',
      avgReturn: '1-3%/trade',
      icon: '🌙',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'options',
      name: 'Options Strategy',
      description: 'Premium collection and volatility trading',
      timeframes: ['15m', '1h', '1d'],
      riskLevel: 'High',
      avgReturn: '10-25%/month',
      icon: '🎯',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'arbitrage',
      name: 'F&O Arbitrage',
      description: 'Risk-free profit from price differences',
      timeframes: ['1m', '5m'],
      riskLevel: 'Low',
      avgReturn: '1-2%/month',
      icon: '⚖️',
      color: 'bg-gray-100 text-gray-800'
    }
  ];

  const riskLevels = [
    { id: 'low', name: 'Conservative', multiplier: 0.5, color: 'text-green-600' },
    { id: 'medium', name: 'Moderate', multiplier: 1.0, color: 'text-blue-600' },
    { id: 'high', name: 'Aggressive', multiplier: 1.5, color: 'text-red-600' }
  ];

  // Handle strategy selection
  const handleStrategyChange = (strategyId) => {
    setSelectedStrategy(strategyId);
  };

  // Start paper trading session
  const handleStartTrading = async () => {
    try {
      const options = {
        startingCapital: capital,
        strategy: selectedStrategy,
        riskLevel: riskLevel,
        autoExecution: autoExecution,
        timeframes: strategies.find(s => s.id === selectedStrategy)?.timeframes || ['5m']
      };

      await startPaperTrading('user123', options);
    } catch (error) {
      console.error('Failed to start trading:', error);
    }
  };

  // Stop paper trading session
  const handleStopTrading = async () => {
    if (activeSession) {
      await stopPaperTrading(activeSession.sessionId);
    }
  };

  const selectedStrategyData = strategies.find(s => s.id === selectedStrategy);

  return (
    <div className="strategy-selector">
      
      {/* Strategy Cards */}
      <div className="strategy-cards">
        {strategies.map(strategy => (
          <div
            key={strategy.id}
            onClick={() => handleStrategyChange(strategy.id)}
            className={`strategy-card ${selectedStrategy === strategy.id ? 'selected' : ''}`}
          >
            <div className="strategy-header">
              <span className="strategy-icon">{strategy.icon}</span>
              <div className="strategy-info">
                <h4 className="strategy-name">{strategy.name}</h4>
                <p className="strategy-description">{strategy.description}</p>
              </div>
            </div>
            
            <div className="strategy-details">
              <div className="detail-item">
                <span className="detail-label">Risk Level</span>
                <span className={`detail-value ${strategy.color}`}>
                  {strategy.riskLevel}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Avg Return</span>
                <span className="detail-value">{strategy.avgReturn}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Timeframes</span>
                <span className="detail-value">{strategy.timeframes.join(', ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trading Controls */}
      <div className="trading-controls">
        
        {/* Risk Level Selector */}
        <div className="control-section">
          <label className="control-label">
            <ShieldCheckIcon className="h-4 w-4" />
            Risk Level
          </label>
          <div className="risk-buttons">
            {riskLevels.map(level => (
              <button
                key={level.id}
                onClick={() => setRiskLevel(level.id)}
                className={`risk-btn ${riskLevel === level.id ? 'active' : ''}`}
              >
                <span className={level.color}>{level.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Capital Input */}
        <div className="control-section">
          <label className="control-label">
            <ChartBarIcon className="h-4 w-4" />
            Paper Trading Capital
          </label>
          <div className="capital-input">
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              min="10000"
              max="10000000"
              step="10000"
              className="capital-field"
            />
            <div className="capital-presets">
              {[50000, 100000, 500000, 1000000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setCapital(amount)}
                  className={`preset-btn ${capital === amount ? 'active' : ''}`}
                >
                  ₹{(amount / 100000).toFixed(0)}L
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="control-section">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="settings-toggle"
          >
            <CogIcon className="h-4 w-4" />
            Advanced Settings
          </button>
        </div>

        {/* Advanced Settings Panel */}
        {showSettings && (
          <div className="advanced-settings">
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={autoExecution}
                  onChange={(e) => setAutoExecution(e.target.checked)}
                  className="setting-checkbox"
                />
                <LightBulbIcon className="h-4 w-4" />
                Auto-Execute ML Signals
              </label>
              <p className="setting-description">
                Automatically execute trades when ML confidence exceeds 80%
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {!activeSession ? (
            <button
              onClick={handleStartTrading}
              disabled={isLoading}
              className="start-trading-btn"
            >
              <PlayIcon className="h-5 w-5" />
              {isLoading ? 'Starting...' : 'Start Paper Trading'}
            </button>
          ) : (
            <button
              onClick={handleStopTrading}
              disabled={isLoading}
              className="stop-trading-btn"
            >
              <StopIcon className="h-5 w-5" />
              {isLoading ? 'Stopping...' : 'Stop Trading Session'}
            </button>
          )}
        </div>

        {/* Strategy Summary */}
        {selectedStrategyData && (
          <div className="strategy-summary">
            <h5 className="summary-title">Selected Strategy Summary</h5>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">Strategy</span>
                <span className="summary-value">{selectedStrategyData.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Capital</span>
                <span className="summary-value">₹{capital.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Risk Level</span>
                <span className="summary-value">
                  {riskLevels.find(r => r.id === riskLevel)?.name}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Expected Return</span>
                <span className="summary-value">{selectedStrategyData.avgReturn}</span>
              </div>
            </div>
          </div>
        )}

        {/* Active Session Info */}
        {activeSession && (
          <div className="active-session-info">
            <div className="session-status">
              <span className="status-dot active"></span>
              <span className="status-text">Trading Session Active</span>
            </div>
            <div className="session-details">
              <div className="session-detail">
                <span className="detail-label">Strategy</span>
                <span className="detail-value">{activeSession.strategy}</span>
              </div>
              <div className="session-detail">
                <span className="detail-label">Started</span>
                <span className="detail-value">{activeSession.startTime}</span>
              </div>
              <div className="session-detail">
                <span className="detail-label">Capital</span>
                <span className="detail-value">₹{activeSession.startingCapital?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategySelector;
