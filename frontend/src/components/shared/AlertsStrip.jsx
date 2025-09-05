// frontend/src/components/shared/AlertsStrip.jsx
import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  XMarkIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AlertsStrip = () => {
  const [alerts, setAlerts] = useState([]);
  const [isScrolling, setIsScrolling] = useState(true);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  // Sample alerts data (replace with real-time data from WebSocket)
  const sampleAlerts = [
    {
      id: 1,
      type: 'success',
      title: 'Trade Executed',
      message: 'NIFTY 50 BUY order executed at ₹18,520.50',
      timestamp: new Date().toLocaleTimeString(),
      icon: CheckCircleIcon
    },
    {
      id: 2,
      type: 'warning',
      title: 'Risk Alert',
      message: 'Portfolio exposure exceeds 80% of available capital',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      icon: ExclamationTriangleIcon
    },
    {
      id: 3,
      type: 'info',
      title: 'Market Update',
      message: 'NIFTY 50 approaching resistance level at 18,600',
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
      icon: InformationCircleIcon
    },
    {
      id: 4,
      type: 'signal',
      title: 'ML Signal',
      message: 'Strong BUY signal detected for RELIANCE (Confidence: 87%)',
      timestamp: new Date(Date.now() - 900000).toLocaleTimeString(),
      icon: ChartBarIcon
    },
    {
      id: 5,
      type: 'info',
      title: 'Connection Status',
      message: 'Successfully connected to Flattrade API',
      timestamp: new Date(Date.now() - 1200000).toLocaleTimeString(),
      icon: BellIcon
    }
  ];

  // Initialize alerts
  useEffect(() => {
    setAlerts(sampleAlerts);
  }, []);

  // Auto-scroll through alerts
  useEffect(() => {
    if (isScrolling && alerts.length > 1) {
      const interval = setInterval(() => {
        setCurrentAlertIndex(prev => (prev + 1) % alerts.length);
      }, 4000); // Change alert every 4 seconds

      return () => clearInterval(interval);
    }
  }, [isScrolling, alerts.length]);

  // Add new alert
  const addAlert = (newAlert) => {
    const alertWithId = {
      ...newAlert,
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [alertWithId, ...prev.slice(0, 9)]); // Keep only 10 most recent
  };

  // Remove alert
  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Get alert styling
  const getAlertStyle = (type) => {
    const styles = {
      success: 'bg-green-50 text-green-800 border-green-200',
      warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      error: 'bg-red-50 text-red-800 border-red-200',
      info: 'bg-blue-50 text-blue-800 border-blue-200',
      signal: 'bg-purple-50 text-purple-800 border-purple-200'
    };
    return styles[type] || styles.info;
  };

  const getAlertIcon = (type) => {
    const icons = {
      success: CheckCircleIcon,
      warning: ExclamationTriangleIcon,
      error: ExclamationTriangleIcon,
      info: InformationCircleIcon,
      signal: ChartBarIcon
    };
    return icons[type] || InformationCircleIcon;
  };

  if (alerts.length === 0) {
    return (
      <div className="alerts-strip empty">
        <div className="empty-alert">
          <BellIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500 text-sm">No alerts</span>
        </div>
      </div>
    );
  }

  const currentAlert = alerts[currentAlertIndex];
  const IconComponent = currentAlert.icon;

  return (
    <div className="alerts-strip">
      
      {/* Main Alert Display */}
      <div 
        className={`alert-main ${getAlertStyle(currentAlert.type)}`}
        onMouseEnter={() => setIsScrolling(false)}
        onMouseLeave={() => setIsScrolling(true)}
      >
        <div className="alert-content">
          <IconComponent className="h-4 w-4 flex-shrink-0" />
          <div className="alert-text">
            <span className="alert-title">{currentAlert.title}</span>
            <span className="alert-message">{currentAlert.message}</span>
          </div>
          <span className="alert-time">{currentAlert.timestamp}</span>
        </div>

        {/* Alert Navigation */}
        <div className="alert-navigation">
          <button
            onClick={() => setCurrentAlertIndex(prev => 
              prev === 0 ? alerts.length - 1 : prev - 1
            )}
            className="nav-btn"
            title="Previous alert"
          >
            ‹
          </button>
          
          <div className="alert-indicators">
            {alerts.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAlertIndex(index)}
                className={`indicator ${index === currentAlertIndex ? 'active' : ''}`}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentAlertIndex(prev => 
              (prev + 1) % alerts.length
            )}
            className="nav-btn"
            title="Next alert"
          >
            ›
          </button>
        </div>

        {/* Pause/Play Button */}
        <button
          onClick={() => setIsScrolling(!isScrolling)}
          className="scroll-toggle"
          title={isScrolling ? 'Pause auto-scroll' : 'Resume auto-scroll'}
        >
          {isScrolling ? '⏸️' : '▶️'}
        </button>
      </div>

      {/* Alert Counter */}
      <div className="alert-counter">
        <span className="counter-text">
          {currentAlertIndex + 1} of {alerts.length}
        </span>
        {alerts.length > 5 && (
          <span className="more-alerts">
            +{alerts.length - 5} more
          </span>
        )}
      </div>

      {/* Alert Types Summary */}
      <div className="alert-summary">
        {['success', 'warning', 'error', 'info', 'signal'].map(type => {
          const count = alerts.filter(alert => alert.type === type).length;
          if (count === 0) return null;
          
          return (
            <div key={type} className={`summary-item ${type}`} title={`${count} ${type} alerts`}>
              <span className="summary-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// CSS styles for the alerts strip
const alertsStripStyles = `
.alerts-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  min-height: 40px;
  max-width: 600px;
  overflow: hidden;
}

.alerts-strip.empty {
  justify-content: center;
}

.empty-alert {
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-main {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid;
  flex: 1;
  min-width: 0;
  transition: all 0.2s ease;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.alert-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.alert-title {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.alert-message {
  font-size: 12px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-time {
  font-size: 10px;
  opacity: 0.7;
  flex-shrink: 0;
}

.alert-navigation {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.alert-indicators {
  display: flex;
  gap: 2px;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator.active {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

.scroll-toggle {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.alert-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 9px;
  color: #64748b;
}

.counter-text {
  font-weight: 500;
}

.more-alerts {
  color: #94a3b8;
}

.alert-summary {
  display: flex;
  gap: 4px;
}

.summary-item {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
}

.summary-item.success {
  background: #dcfce7;
  color: #166534;
}

.summary-item.warning {
  background: #fef3c7;
  color: #92400e;
}

.summary-item.error {
  background: #fecaca;
  color: #991b1b;
}

.summary-item.info {
  background: #dbeafe;
  color: #1e40af;
}

.summary-item.signal {
  background: #e9d5ff;
  color: #7c2d12;
}

.summary-count {
  line-height: 1;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = alertsStripStyles;
  document.head.appendChild(styleSheet);
}

export default AlertsStrip;
