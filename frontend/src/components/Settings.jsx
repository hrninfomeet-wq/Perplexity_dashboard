import React, { useState, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

const Settings = () => {
  const { refreshRate, setRefreshRate } = useContext(SettingsContext);
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [apiMode, setApiMode] = useState('live');

  const refreshOptions = [
    { value: 1000, label: '1 Second' },
    { value: 2000, label: '2 Seconds' },
    { value: 5000, label: '5 Seconds' },
    { value: 10000, label: '10 Seconds' },
    { value: 30000, label: '30 Seconds' },
    { value: 60000, label: '1 Minute' }
  ];

  const resetSettings = () => {
    setRefreshRate(5000);
    setTheme('dark');
    setNotifications(true);
    setAutoRefresh(true);
    setApiMode('live');
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <div className="header-title">
          <span className="settings-icon">⚙️</span>
          <h3>Dashboard Settings</h3>
        </div>
        <button className="reset-btn" onClick={resetSettings}>
          🔄 Reset
        </button>
      </div>

      <div className="settings-content">
        {/* Data Refresh Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h4>Data Refresh</h4>
            <span className="section-status active">Active</span>
          </div>
          
          <div className="setting-item">
            <label className="setting-label">
              <span>Auto Refresh</span>
              <div className={`toggle-switch ${autoRefresh ? 'active' : ''}`} 
                   onClick={() => setAutoRefresh(!autoRefresh)}>
                <div className="toggle-slider"></div>
              </div>
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">Refresh Rate</label>
            <select 
              className="setting-select"
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              disabled={!autoRefresh}
            >
              {refreshOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* API Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h4>API Configuration</h4>
            <span className={`section-status ${apiMode === 'live' ? 'live' : 'demo'}`}>
              {apiMode === 'live' ? 'Live' : 'Demo'}
            </span>
          </div>
          
          <div className="setting-item">
            <label className="setting-label">Data Source</label>
            <div className="radio-group">
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="apiMode" 
                  value="live"
                  checked={apiMode === 'live'}
                  onChange={(e) => setApiMode(e.target.value)}
                />
                <span className="radio-custom"></span>
                Live Market Data
              </label>
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="apiMode" 
                  value="demo"
                  checked={apiMode === 'demo'}
                  onChange={(e) => setApiMode(e.target.value)}
                />
                <span className="radio-custom"></span>
                Demo Data
              </label>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h4>Display Preferences</h4>
            <span className="section-status active">Configured</span>
          </div>
          
          <div className="setting-item">
            <label className="setting-label">Theme</label>
            <select 
              className="setting-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="dark">Dark Professional</option>
              <option value="light">Light Theme</option>
              <option value="blue">Trading Blue</option>
              <option value="green">Matrix Green</option>
            </select>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              <span>Desktop Notifications</span>
              <div className={`toggle-switch ${notifications ? 'active' : ''}`} 
                   onClick={() => setNotifications(!notifications)}>
                <div className="toggle-slider"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h4>Performance</h4>
            <span className="section-status optimized">Optimized</span>
          </div>
          
          <div className="performance-stats">
            <div className="stat-item">
              <span className="stat-label">Memory Usage</span>
              <span className="stat-value">45.2 MB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">API Calls/Min</span>
              <span className="stat-value">78/80</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Response Time</span>
              <span className="stat-value">245ms</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="settings-section">
          <div className="section-header">
            <h4>Quick Actions</h4>
          </div>
          
          <div className="action-buttons">
            <button className="action-btn primary">
              📊 Export Data
            </button>
            <button className="action-btn secondary">
              🔄 Clear Cache
            </button>
            <button className="action-btn danger">
              🗑️ Reset Layout
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .settings-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #37474f;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-icon {
          font-size: 20px;
          animation: rotate 4s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .settings-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .reset-btn {
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .reset-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .settings-section {
          background: linear-gradient(135deg, #1a1f2e 0%, #232940 100%);
          border: 1px solid #37474f;
          border-radius: 12px;
          padding: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h4 {
          margin: 0;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-status.active {
          background: linear-gradient(135deg, #00ff88, #00e676);
          color: #0a0e1a;
        }

        .section-status.live {
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
        }

        .section-status.demo {
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
        }

        .section-status.optimized {
          background: linear-gradient(135deg, #4caf50, #388e3c);
          color: white;
        }

        .setting-item {
          margin-bottom: 16px;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #e0e0e0;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .setting-select {
          width: 100%;
          background: #0a0e1a;
          border: 1px solid #37474f;
          border-radius: 6px;
          padding: 10px 12px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .setting-select:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }

        .setting-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-switch {
          width: 48px;
          height: 24px;
          background: #37474f;
          border-radius: 24px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-switch.active {
          background: linear-gradient(135deg, #00ff88, #00e676);
        }

        .toggle-slider {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(24px);
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #e0e0e0;
          font-size: 14px;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .radio-option:hover {
          color: #ffffff;
        }

        .radio-option input[type="radio"] {
          display: none;
        }

        .radio-custom {
          width: 18px;
          height: 18px;
          border: 2px solid #37474f;
          border-radius: 50%;
          position: relative;
          transition: all 0.3s ease;
        }

        .radio-option input[type="radio"]:checked + .radio-custom {
          border-color: #2196f3;
          background: #2196f3;
        }

        .radio-option input[type="radio"]:checked + .radio-custom::after {
          content: '';
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .performance-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #0a0e1a;
          border: 1px solid #37474f;
          border-radius: 6px;
        }

        .stat-label {
          color: #9e9e9e;
          font-size: 12px;
          font-weight: 500;
        }

        .stat-value {
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Roboto Mono', monospace;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-btn {
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
        }

        .action-btn.secondary {
          background: linear-gradient(135deg, #37474f, #455a64);
          color: white;
        }

        .action-btn.danger {
          background: linear-gradient(135deg, #ff4757, #e53935);
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .settings-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .radio-group {
            flex-direction: row;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
