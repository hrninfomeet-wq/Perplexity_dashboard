import React, { useState, useEffect } from 'react';
import { useTrading } from '../contexts/TradingContext';
import '../styles/live-trading-enhancements.css';

const TradingLayout = ({ children }) => {
  const { 
    isConnected, 
    systemHealth, 
    activeSession,
    sessionStatus,
    refreshSystemHealth
  } = useTrading();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSessionStatusColor = () => {
    switch (sessionStatus) {
      case 'active': return '#00ff88';
      case 'paused': return '#ffaa00';
      case 'stopped': return '#ff4757';
      default: return '#747d8c';
    }
  };

  const getConnectionStatusColor = () => {
    return isConnected ? '#00ff88' : '#ff4757';
  };

  return (
    <div className="trading-layout">
      {/* Header */}
      <header className="trading-header">
        <div className="header-left">
          <div className="logo-section">
            <h1>Trading Terminal</h1>
            <span className="version">v3.0</span>
          </div>
          
          <div className="session-info">
            {activeSession && (
              <>
                <span className="session-label">Session:</span>
                <span className="session-id">{activeSession.sessionId}</span>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getSessionStatusColor() }}
                  title={`Status: ${sessionStatus}`}
                />
              </>
            )}
          </div>
        </div>

        <div className="header-center">
          <div className="time-display">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="current-date">{formatDate(currentTime)}</div>
          </div>
        </div>

        <div className="header-right">
          <div className="connection-status">
            <div 
              className="connection-indicator"
              style={{ backgroundColor: getConnectionStatusColor() }}
              title={`Connection: ${isConnected ? 'Connected' : 'Disconnected'}`}
            />
            <span className="connection-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="system-health">
            <span className="health-label">System</span>
            <div 
              className="health-indicator"
              style={{ 
                backgroundColor: systemHealth.healthy ? '#00ff88' : '#ff4757' 
              }}
              title={`Health: ${systemHealth.healthy ? 'Good' : 'Issues'}`}
            />
          </div>

          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Toggle Sidebar"
          >
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'left' : 'right'}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="trading-main">
        <div className={`content-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {children}
        </div>

        {/* Right Sidebar */}
        <aside className={`trading-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h3>Quick Stats</h3>
          </div>

          <div className="sidebar-content">
            {activeSession ? (
              <div className="session-stats">
                <div className="stat-item">
                  <span className="stat-label">Session Time</span>
                  <span className="stat-value">
                    {activeSession.startTime ? 
                      new Date(activeSession.startTime).toLocaleTimeString() : 
                      'N/A'
                    }
                  </span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-label">Capital</span>
                  <span className="stat-value">
                    ${activeSession.startingCapital?.toLocaleString() || '0'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Strategy</span>
                  <span className="stat-value">
                    {activeSession.strategy || 'None'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="no-session">
                <p>No active session</p>
                <small>Start a paper trading session to view stats</small>
              </div>
            )}

            {systemHealth && (
              <div className="system-stats">
                <h4>System Metrics</h4>
                
                <div className="stat-item">
                  <span className="stat-label">Memory</span>
                  <span className="stat-value">
                    {systemHealth.memory ? `${systemHealth.memory}%` : 'N/A'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Uptime</span>
                  <span className="stat-value">
                    {systemHealth.uptime ? `${Math.floor(systemHealth.uptime / 3600)}h` : 'N/A'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Latency</span>
                  <span className="stat-value">
                    {systemHealth.latency ? `${systemHealth.latency}ms` : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <button 
              className="refresh-btn"
              onClick={refreshSystemHealth}
              title="Refresh System Health"
            >
              <i className="fas fa-sync-alt" />
              Refresh
            </button>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="trading-footer">
        <div className="footer-left">
          <span className="app-info">NSE Trading Dashboard</span>
          <span className="separator">|</span>
          <span className="backend-status">
            Backend: {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="footer-center">
          {activeSession && (
            <span className="session-footer-info">
              Paper Trading Session Active - {sessionStatus.toUpperCase()}
            </span>
          )}
        </div>

        <div className="footer-right">
          <span className="last-update">
            Last Update: {formatTime(currentTime)}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default TradingLayout;
