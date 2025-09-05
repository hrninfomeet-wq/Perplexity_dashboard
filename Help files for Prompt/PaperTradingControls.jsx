// 🎯 Paper Trading Controls Component
// Professional trading session management interface

import React, { useState } from 'react';
import { useTradingContext } from '../contexts/TradingContext';
import './PaperTradingControls.css';

const PaperTradingControls = () => {
  const { 
    currentSession, 
    isLoading, 
    isConnected,
    startPaperTradingSession, 
    stopPaperTradingSession,
    strategies,
    error
  } = useTradingContext();

  const [sessionConfig, setSessionConfig] = useState({
    initialCapital: 100000,
    maxDailyLoss: 5000,
    maxPositionSize: 20000,
    riskLevel: 'MEDIUM',
    enabledStrategies: [],
    autoStopLoss: true,
    riskPerTrade: 0.02
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStartSession = async () => {
    try {
      const result = await startPaperTradingSession(sessionConfig);
      if (result.success) {
        console.log('✅ Paper trading session started successfully');
      }
    } catch (error) {
      console.error('❌ Failed to start paper trading session:', error);
    }
  };

  const handleStopSession = async () => {
    if (!currentSession) return;
    
    if (window.confirm('Are you sure you want to stop the current trading session?')) {
      try {
        await stopPaperTradingSession(currentSession.sessionId);
        console.log('✅ Paper trading session stopped');
      } catch (error) {
        console.error('❌ Failed to stop paper trading session:', error);
      }
    }
  };

  const handleConfigChange = (field, value) => {
    setSessionConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleStrategy = (strategyId) => {
    setSessionConfig(prev => ({
      ...prev,
      enabledStrategies: prev.enabledStrategies.includes(strategyId)
        ? prev.enabledStrategies.filter(id => id !== strategyId)
        : [...prev.enabledStrategies, strategyId]
    }));
  };

  const isSessionActive = currentSession && currentSession.status === 'ACTIVE';

  return (
    <div className="trading-panel paper-trading-controls">
      <div className="trading-panel-header">
        <h3 className="trading-panel-title">Paper Trading</h3>
        <div className="session-status">
          {isSessionActive ? (
            <span className="status-indicator status-online">
              <span className="status-dot"></span>
              Active
            </span>
          ) : (
            <span className="status-indicator status-offline">
              <span className="status-dot"></span>
              Inactive
            </span>
          )}
        </div>
      </div>

      <div className="trading-panel-content">
        {!isConnected && (
          <div className="connection-warning">
            <span className="warning-icon">⚠️</span>
            <p>Not connected to trading engine. Please check your connection.</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            <p>{error}</p>
          </div>
        )}

        {isSessionActive ? (
          // Active Session Display
          <div className="active-session">
            <div className="session-info">
              <div className="info-row">
                <span className="info-label">Session ID:</span>
                <span className="info-value font-mono">{currentSession.sessionId}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Start Time:</span>
                <span className="info-value">
                  {new Date(currentSession.startTime).toLocaleString()}
                </span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Initial Capital:</span>
                <span className="info-value price-neutral">
                  ${currentSession.initialCapital?.toLocaleString() || '0'}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Available Capital:</span>
                <span className="info-value price-positive">
                  ${currentSession.availableCapital?.toLocaleString() || '0'}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Daily P&L:</span>
                <span className={`info-value ${
                  (currentSession.dailyPnL || 0) >= 0 ? 'price-positive' : 'price-negative'
                }`}>
                  {(currentSession.dailyPnL || 0) >= 0 ? '+' : ''}
                  ${(currentSession.dailyPnL || 0).toLocaleString()}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Active Strategies:</span>
                <span className="info-value">
                  {currentSession.activeStrategies?.length || 0}
                </span>
              </div>
            </div>

            <div className="session-actions">
              <button
                className="btn btn-danger"
                onClick={handleStopSession}
                disabled={isLoading}
              >
                {isLoading ? 'Stopping...' : 'Stop Session'}
              </button>
            </div>
          </div>
        ) : (
          // Session Configuration
          <div className="session-config">
            <div className="config-section">
              <h4 className="config-title">Basic Configuration</h4>
              
              <div className="config-row">
                <label className="form-label">Initial Capital ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={sessionConfig.initialCapital}
                  onChange={(e) => handleConfigChange('initialCapital', parseInt(e.target.value))}
                  min="10000"
                  max="1000000"
                  step="1000"
                />
              </div>

              <div className="config-row">
                <label className="form-label">Max Daily Loss ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={sessionConfig.maxDailyLoss}
                  onChange={(e) => handleConfigChange('maxDailyLoss', parseInt(e.target.value))}
                  min="500"
                  max="50000"
                  step="100"
                />
              </div>

              <div className="config-row">
                <label className="form-label">Max Position Size ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={sessionConfig.maxPositionSize}
                  onChange={(e) => handleConfigChange('maxPositionSize', parseInt(e.target.value))}
                  min="1000"
                  max="100000"
                  step="1000"
                />
              </div>

              <div className="config-row">
                <label className="form-label">Risk Level</label>
                <select
                  className="form-input"
                  value={sessionConfig.riskLevel}
                  onChange={(e) => handleConfigChange('riskLevel', e.target.value)}
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>
            </div>

            <div className="config-section">
              <div className="section-header">
                <h4 className="config-title">Strategy Selection</h4>
                <span className="strategy-count">
                  {sessionConfig.enabledStrategies.length} selected
                </span>
              </div>

              <div className="strategies-list">
                {strategies.available.length > 0 ? (
                  strategies.available.map(strategy => (
                    <div key={strategy.id} className="strategy-item">
                      <label className="strategy-checkbox">
                        <input
                          type="checkbox"
                          checked={sessionConfig.enabledStrategies.includes(strategy.id)}
                          onChange={() => toggleStrategy(strategy.id)}
                        />
                        <span className="strategy-name">{strategy.name}</span>
                      </label>
                      <span className="strategy-type">{strategy.type}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-strategies">
                    <p>No strategies available</p>
                    <small>Strategies will be loaded when connected</small>
                  </div>
                )}
              </div>
            </div>

            {showAdvanced && (
              <div className="config-section">
                <h4 className="config-title">Advanced Settings</h4>
                
                <div className="config-row">
                  <label className="form-label">Risk Per Trade (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={sessionConfig.riskPerTrade * 100}
                    onChange={(e) => handleConfigChange('riskPerTrade', parseFloat(e.target.value) / 100)}
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                </div>

                <div className="config-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={sessionConfig.autoStopLoss}
                      onChange={(e) => handleConfigChange('autoStopLoss', e.target.checked)}
                    />
                    Enable Automatic Stop Loss
                  </label>
                </div>
              </div>
            )}

            <div className="config-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </button>
              
              <button
                className="btn btn-success"
                onClick={handleStartSession}
                disabled={isLoading || !isConnected || sessionConfig.enabledStrategies.length === 0}
              >
                {isLoading ? 'Starting...' : 'Start Trading'}
              </button>
            </div>

            {sessionConfig.enabledStrategies.length === 0 && (
              <div className="validation-warning">
                <span className="warning-icon">⚠️</span>
                <p>Please select at least one trading strategy</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperTradingControls;