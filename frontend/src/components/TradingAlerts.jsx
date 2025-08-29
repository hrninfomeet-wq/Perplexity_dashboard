import React, { useState, useEffect } from 'react';

const TradingAlerts = () => {
  const [alerts, setAlerts] = useState([
    { 
      id: 1,
      symbol: 'RELIANCE', 
      price: '₹2,485.50', 
      target: '₹2,520.00', 
      action: 'BUY', 
      time: '2 min ago',
      change: '+1.2%',
      volume: '2.1M'
    },
    { 
      id: 2,
      symbol: 'TCS', 
      price: '₹4,125.80', 
      target: '₹4,090.00', 
      action: 'SELL', 
      time: '5 min ago',
      change: '-0.8%',
      volume: '1.8M'
    },
    { 
      id: 3,
      symbol: 'HDFC BANK', 
      price: '₹1,745.25', 
      target: '₹1,780.00', 
      action: 'BUY', 
      time: '8 min ago',
      change: '+2.1%',
      volume: '3.2M'
    }
  ]);

  const [newAlert, setNewAlert] = useState({
    symbol: '',
    target: '',
    action: 'BUY'
  });

  const addAlert = () => {
    if (newAlert.symbol && newAlert.target) {
      const alert = {
        id: Date.now(),
        symbol: newAlert.symbol.toUpperCase(),
        price: '₹0.00',
        target: `₹${newAlert.target}`,
        action: newAlert.action,
        time: 'Just now',
        change: '0.0%',
        volume: '0'
      };
      setAlerts(prev => [alert, ...prev]);
      setNewAlert({ symbol: '', target: '', action: 'BUY' });
    }
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div className="trading-alerts">
      <div className="alerts-header">
        <div className="header-title">
          <span className="alert-icon">🚨</span>
          <h3>Trading Alerts</h3>
        </div>
        <div className="alerts-stats">
          <span className="alerts-count">{alerts.length} Active</span>
          <span className="profit-count">{alerts.filter(a => a.action === 'BUY').length} Buy</span>
          <span className="loss-count">{alerts.filter(a => a.action === 'SELL').length} Sell</span>
        </div>
      </div>

      {/* Quick Alert Creator */}
      <div className="alert-creator">
        <div className="creator-inputs">
          <input
            type="text"
            placeholder="Symbol (e.g., RELIANCE)"
            value={newAlert.symbol}
            onChange={(e) => setNewAlert({...newAlert, symbol: e.target.value})}
            className="symbol-input"
          />
          <input
            type="number"
            placeholder="Target Price"
            value={newAlert.target}
            onChange={(e) => setNewAlert({...newAlert, target: e.target.value})}
            className="target-input"
          />
          <select
            value={newAlert.action}
            onChange={(e) => setNewAlert({...newAlert, action: e.target.value})}
            className="action-select"
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <button onClick={addAlert} className="add-alert-btn">
            + Add
          </button>
        </div>
      </div>
      
      <div className="alerts-grid">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-card ${alert.action.toLowerCase()}`}>
            <div className="alert-header">
              <div className="symbol-info">
                <span className="symbol">{alert.symbol}</span>
                <span className={`change ${alert.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {alert.change}
                </span>
              </div>
              <div className="alert-actions">
                <span className="time">{alert.time}</span>
                <button 
                  className="remove-btn"
                  onClick={() => removeAlert(alert.id)}
                  title="Remove Alert"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="alert-details">
              <div className="price-section">
                <div className="price-info">
                  <span className="label">Current</span>
                  <span className="value current-price">{alert.price}</span>
                </div>
                
                <div className="target-info">
                  <span className="label">Target</span>
                  <span className="value target-price">{alert.target}</span>
                </div>
              </div>
              
              <div className="action-section">
                <div className={`action-badge ${alert.action.toLowerCase()}`}>
                  {alert.action}
                </div>
                <div className="volume-info">
                  <span className="volume-label">Vol:</span>
                  <span className="volume-value">{alert.volume}</span>
                </div>
              </div>
            </div>

            <div className="alert-progress">
              <div className="progress-bar">
                <div className={`progress-fill ${alert.action.toLowerCase()}`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .trading-alerts {
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Roboto Mono', 'Courier New', monospace;
        }
        
        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 2px solid #37474f;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-icon {
          font-size: 20px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .alerts-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .alerts-stats {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .alerts-count {
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
        }

        .profit-count {
          background: linear-gradient(135deg, #00ff88, #00e676);
          color: #0a0e1a;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }

        .loss-count {
          background: linear-gradient(135deg, #ff4757, #e53935);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }

        .alert-creator {
          background: linear-gradient(135deg, #1a1f2e 0%, #232940 100%);
          border: 1px solid #37474f;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .creator-inputs {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .symbol-input, .target-input {
          background: #0a0e1a;
          border: 1px solid #37474f;
          border-radius: 6px;
          padding: 10px 12px;
          color: #ffffff;
          font-family: 'Roboto Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .symbol-input:focus, .target-input:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }

        .action-select {
          background: #0a0e1a;
          border: 1px solid #37474f;
          border-radius: 6px;
          padding: 10px 12px;
          color: #ffffff;
          font-family: 'Roboto Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .add-alert-btn {
          background: linear-gradient(135deg, #00ff88, #00e676);
          color: #0a0e1a;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-alert-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
        }
        
        .alerts-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }
        
        .alert-card {
          background: linear-gradient(135deg, #1a1f2e 0%, #232940 100%);
          border: 1px solid #37474f;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .alert-card:hover {
          border-color: #2196f3;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(33, 150, 243, 0.3);
        }
        
        .alert-card.buy {
          border-left: 4px solid #00ff88;
        }
        
        .alert-card.sell {
          border-left: 4px solid #ff4757;
        }
        
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .symbol-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .symbol {
          font-weight: 700;
          color: #ffffff;
          font-size: 16px;
          letter-spacing: 1px;
        }

        .change {
          font-size: 12px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .change.positive {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .change.negative {
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
        }

        .alert-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .time {
          color: #9e9e9e;
          font-size: 12px;
          font-weight: 500;
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: #9e9e9e;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .remove-btn:hover {
          background: #ff4757;
          color: white;
        }
        
        .alert-details {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: center;
          margin-bottom: 12px;
        }

        .price-section {
          display: flex;
          gap: 20px;
        }
        
        .price-info, .target-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .label {
          color: #9e9e9e;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .value {
          font-weight: 700;
          font-size: 14px;
        }

        .current-price {
          color: #ffffff;
        }

        .target-price {
          color: #2196f3;
        }

        .action-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        
        .action-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          letter-spacing: 1px;
        }
        
        .action-badge.buy {
          background: linear-gradient(135deg, #00ff88, #00e676);
          color: #0a0e1a;
        }
        
        .action-badge.sell {
          background: linear-gradient(135deg, #ff4757, #e53935);
          color: white;
        }

        .volume-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
        }

        .volume-label {
          color: #9e9e9e;
          font-weight: 600;
        }

        .volume-value {
          color: #ffffff;
          font-weight: 700;
        }

        .alert-progress {
          margin-top: 12px;
        }

        .progress-bar {
          background: #0a0e1a;
          border-radius: 4px;
          height: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          width: 30%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-fill.buy {
          background: linear-gradient(90deg, #00ff88, #00e676);
        }

        .progress-fill.sell {
          background: linear-gradient(90deg, #ff4757, #e53935);
        }

        @media (max-width: 768px) {
          .creator-inputs {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .alert-details {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .action-section {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default TradingAlerts;
