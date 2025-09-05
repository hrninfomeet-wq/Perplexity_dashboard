// frontend/src/components/trading/PaperTradingControls.jsx
import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  StopIcon, 
  PauseIcon,
  CogIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import paperTradingService from '../../services/paperTradingService';
import websocketService from '../../services/websocketService';
import './PaperTradingControls.css';

const PaperTradingControls = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Session configuration
  const [sessionConfig, setSessionConfig] = useState({
    startingCapital: 100000,
    strategy: 'scalping',
    riskLevel: 'medium',
    autoExecution: false,
    maxPositions: 10,
    stopLoss: 2,
    takeProfit: 5,
    maxDailyLoss: 5,
    leverage: 1
  });

  // Initialize component
  useEffect(() => {
    // Set initial states
    setActiveSession(paperTradingService.getActiveSession());
    setSessionHistory(paperTradingService.getSessionHistory());
    setConnectionStatus(websocketService.getConnectionInfo().status);

    // Subscribe to events
    const handleSessionUpdate = (session) => {
      setActiveSession(session);
      setSessionHistory(paperTradingService.getSessionHistory());
    };

    const handleConnectionChange = ({ status }) => {
      setConnectionStatus(status);
    };

    paperTradingService.on('onSessionUpdate', handleSessionUpdate);
    websocketService.on('onConnectionChange', handleConnectionChange);

    return () => {
      paperTradingService.off('onSessionUpdate', handleSessionUpdate);
      websocketService.off('onConnectionChange', handleConnectionChange);
    };
  }, []);

  // Start paper trading session
  const handleStartSession = async () => {
    try {
      setIsLoading(true);
      
      const session = await paperTradingService.startSession('user123', sessionConfig);
      
      // Connect WebSocket if not connected
      if (!websocketService.isSocketConnected()) {
        websocketService.connect();
      }
      
      console.log('✅ Paper trading session started:', session);
      
    } catch (error) {
      console.error('Failed to start session:', error);
      alert(`Failed to start session: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop paper trading session
  const handleStopSession = async () => {
    try {
      setIsLoading(true);
      
      if (activeSession) {
        const stoppedSession = await paperTradingService.stopSession(activeSession.sessionId);
        console.log('⏹️ Paper trading session stopped:', stoppedSession);
      }
      
    } catch (error) {
      console.error('Failed to stop session:', error);
      alert(`Failed to stop session: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update session configuration
  const updateConfig = (key, value) => {
    setSessionConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get session duration
  const getSessionDuration = () => {
    if (!activeSession?.startTime) return '00:00:00';
    
    const start = new Date(activeSession.startTime);
    const now = new Date();
    const diff = now - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get risk level color
  const getRiskLevelColor = (level) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100'
    };
    return colors[level] || colors.medium;
  };

  // Get connection status indicator
  const getConnectionIndicator = () => {
    const indicators = {
      connected: { color: 'bg-green-500', text: 'Connected' },
      connecting: { color: 'bg-yellow-500', text: 'Connecting' },
      disconnected: { color: 'bg-red-500', text: 'Disconnected' },
      error: { color: 'bg-red-500', text: 'Error' }
    };
    
    return indicators[connectionStatus] || indicators.disconnected;
  };

  const connectionIndicator = getConnectionIndicator();

  return (
    <div className="paper-trading-controls">
      
      {/* Connection Status */}
      <div className="connection-status">
        <div className="status-indicator">
          <div className={`status-dot ${connectionIndicator.color}`} />
          <span className="status-text">{connectionIndicator.text}</span>
        </div>
        
        {connectionStatus !== 'connected' && (
          <button
            onClick={() => websocketService.connect()}
            className="connect-btn"
            disabled={connectionStatus === 'connecting'}
          >
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>

      {/* Active Session Display */}
      {activeSession ? (
        <div className="active-session">
          <div className="session-header">
            <div className="session-status">
              <div className="status-dot bg-green-500 animate-pulse" />
              <span className="session-title">Paper Trading Active</span>
            </div>
            <div className="session-duration">
              <ClockIcon className="h-4 w-4" />
              <span>{getSessionDuration()}</span>
            </div>
          </div>

          <div className="session-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Strategy</span>
                <span className="info-value">{activeSession.strategy}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Capital</span>
                <span className="info-value">₹{activeSession.portfolio?.totalCapital?.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">P&L</span>
                <span className={`info-value ${(activeSession.portfolio?.totalPnL || 0) >= 0 ? 'positive' : 'negative'}`}>
                  ₹{activeSession.portfolio?.totalPnL?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Risk Level</span>
                <span className={`info-value badge ${getRiskLevelColor(activeSession.riskLevel)}`}>
                  {activeSession.riskLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="session-controls">
            <button
              onClick={handleStopSession}
              disabled={isLoading}
              className="stop-btn"
            >
              <StopIcon className="h-4 w-4" />
              {isLoading ? 'Stopping...' : 'Stop Session'}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="settings-btn"
            >
              <CogIcon className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      ) : (
        /* New Session Setup */
        <div className="new-session">
          <div className="session-setup">
            <h3 className="setup-title">Start Paper Trading Session</h3>
            
            <div className="setup-form">
              {/* Starting Capital */}
              <div className="form-group">
                <label className="form-label">
                  <CurrencyRupeeIcon className="h-4 w-4" />
                  Starting Capital
                </label>
                <div className="capital-input">
                  <input
                    type="number"
                    value={sessionConfig.startingCapital}
                    onChange={(e) => updateConfig('startingCapital', Number(e.target.value))}
                    min="10000"
                    max="10000000"
                    step="10000"
                    className="capital-field"
                  />
                  <div className="capital-presets">
                    {[50000, 100000, 500000, 1000000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => updateConfig('startingCapital', amount)}
                        className={`preset-btn ${sessionConfig.startingCapital === amount ? 'active' : ''}`}
                      >
                        ₹{(amount / 100000).toFixed(0)}L
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategy Selection */}
              <div className="form-group">
                <label className="form-label">
                  <ChartBarIcon className="h-4 w-4" />
                  Trading Strategy
                </label>
                <select
                  value={sessionConfig.strategy}
                  onChange={(e) => updateConfig('strategy', e.target.value)}
                  className="strategy-select"
                >
                  <option value="scalping">Scalping Strategy</option>
                  <option value="swing">Swing Trading</option>
                  <option value="btst">BTST Strategy</option>
                  <option value="options">Options Strategy</option>
                  <option value="arbitrage">F&O Arbitrage</option>
                  <option value="manual">Manual Trading</option>
                </select>
              </div>

              {/* Risk Level */}
              <div className="form-group">
                <label className="form-label">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Risk Level
                </label>
                <div className="risk-buttons">
                  {['low', 'medium', 'high'].map(level => (
                    <button
                      key={level}
                      onClick={() => updateConfig('riskLevel', level)}
                      className={`risk-btn ${sessionConfig.riskLevel === level ? 'active' : ''} ${getRiskLevelColor(level)}`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Execution */}
              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={sessionConfig.autoExecution}
                    onChange={(e) => updateConfig('autoExecution', e.target.checked)}
                    className="checkbox"
                  />
                  Auto-Execute ML Signals (80%+ confidence)
                </label>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="advanced-toggle"
              >
                <CogIcon className="h-4 w-4" />
                {showSettings ? 'Hide' : 'Show'} Advanced Settings
              </button>
            </div>

            {/* Advanced Settings */}
            {showSettings && (
              <div className="advanced-settings">
                <div className="settings-grid">
                  <div className="setting-item">
                    <label className="setting-label">Max Positions</label>
                    <input
                      type="number"
                      value={sessionConfig.maxPositions}
                      onChange={(e) => updateConfig('maxPositions', Number(e.target.value))}
                      min="1"
                      max="50"
                      className="setting-input"
                    />
                  </div>
                  
                  <div className="setting-item">
                    <label className="setting-label">Stop Loss (%)</label>
                    <input
                      type="number"
                      value={sessionConfig.stopLoss}
                      onChange={(e) => updateConfig('stopLoss', Number(e.target.value))}
                      min="0.5"
                      max="10"
                      step="0.5"
                      className="setting-input"
                    />
                  </div>
                  
                  <div className="setting-item">
                    <label className="setting-label">Take Profit (%)</label>
                    <input
                      type="number"
                      value={sessionConfig.takeProfit}
                      onChange={(e) => updateConfig('takeProfit', Number(e.target.value))}
                      min="1"
                      max="20"
                      step="0.5"
                      className="setting-input"
                    />
                  </div>
                  
                  <div className="setting-item">
                    <label className="setting-label">Max Daily Loss (%)</label>
                    <input
                      type="number"
                      value={sessionConfig.maxDailyLoss}
                      onChange={(e) => updateConfig('maxDailyLoss', Number(e.target.value))}
                      min="1"
                      max="20"
                      step="1"
                      className="setting-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              disabled={isLoading || connectionStatus !== 'connected'}
              className="start-session-btn"
            >
              <PlayIcon className="h-5 w-5" />
              {isLoading ? 'Starting Session...' : 'Start Paper Trading'}
            </button>

            {connectionStatus !== 'connected' && (
              <p className="connection-warning">
                ⚠️ Connect to market data first to start trading
              </p>
            )}
          </div>
        </div>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <div className="session-history">
          <h4 className="history-title">Recent Sessions</h4>
          <div className="history-list">
            {sessionHistory.slice(0, 3).map((session, index) => (
              <div key={session.sessionId} className="history-item">
                <div className="history-header">
                  <span className="history-date">
                    {new Date(session.startTime).toLocaleDateString()}
                  </span>
                  <span className="history-strategy">{session.strategy}</span>
                </div>
                <div className="history-performance">
                  <span className="history-capital">₹{session.portfolio.totalCapital.toLocaleString()}</span>
                  <span className={`history-pnl ${session.performance?.totalPnL >= 0 ? 'positive' : 'negative'}`}>
                    ₹{session.performance?.totalPnL?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperTradingControls;
