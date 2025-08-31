// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MajorIndicesStrip from './components/MajorIndicesStrip';
import MarketIndices from './components/MarketIndices';
import FnOAnalysis from './components/FnOAnalysis';
import BTSTScanner from './components/BTSTScanner';
import ScalpingOpportunities from './components/ScalpingOpportunities';
import TradingAlertsSection from './components/TradingAlertsSection';
import SettingsSection from './components/SettingsSection';
import TopGainersSection from './components/TopGainersSection';
import TopLosersSection from './components/TopLosersSection';
import { SettingsProvider } from './contexts/SettingsContext';
import './style.css';
import './dashboard-styles.css';
import './trading-desk-styles.css';
import './responsive-layout.css';

function App() {
  const [dataSource, setDataSource] = useState('Mock');
  const [headerIndices, setHeaderIndices] = useState([
    { symbol: 'NIFTY', name: 'NIFTY 50', price: 24500.00, change: 125.50, change_pct: 0.51, support: 24350, resistance: 24650 },
    { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 51200.00, change: -200.25, change_pct: -0.39, support: 50800, resistance: 51500 },
    { symbol: 'SENSEX', name: 'SENSEX', price: 80450.00, change: 180.75, change_pct: 0.22, support: 80200, resistance: 80800 },
    { symbol: 'VIX', name: 'INDIA VIX', price: 13.25, change: -0.15, change_pct: -1.12, support: null, resistance: null },
    { symbol: 'GOLDM', name: 'GOLD FUT', price: 72850.00, change: 45.50, change_pct: 0.06, support: 72500, resistance: 73200 }
  ]);
  const [isIndicesCollapsed, setIsIndicesCollapsed] = useState(false);
  const [isTradingAlertsCollapsed, setIsTradingAlertsCollapsed] = useState(false);
  const [isFnOCollapsed, setIsFnOCollapsed] = useState(false);
  const [isBTSTCollapsed, setIsBTSTCollapsed] = useState(false);
  const [isScalpingCollapsed, setIsScalpingCollapsed] = useState(false);
  const [isTopGainersCollapsed, setIsTopGainersCollapsed] = useState(false);
  const [isTopLosersCollapsed, setIsTopLosersCollapsed] = useState(false);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);

  // Fetch header indices data
  useEffect(() => {
    const fetchHeaderIndices = async () => {
      try {
        const response = await fetch('/api/indices');
        if (response.ok) {
          const data = await response.json();
          const allIndices = data.data || [];
          
          console.log('Header API Response:', allIndices); // Debug log
          
          // Create updated header data by merging API data with existing state
          const updatedHeaderIndices = headerIndices.map(headerItem => {
            const apiData = allIndices.find(index => index.symbol === headerItem.symbol);
            return apiData ? { ...headerItem, ...apiData } : headerItem;
          });
          
          console.log('Updated Header Indices:', updatedHeaderIndices); // Debug log
          setHeaderIndices(updatedHeaderIndices);
        }
      } catch (error) {
        console.error('Failed to fetch header indices:', error);
        // Keep existing data as fallback - don't reset to empty
      }
    };

    fetchHeaderIndices();
    if (dataSource === 'Live') {
      const interval = setInterval(fetchHeaderIndices, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [dataSource]); // Removed headerIndices from dependency to avoid infinite loop

  const formatHeaderPrice = (price) => {
    if (typeof price !== 'number') return price || '????';
    return price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatHeaderChange = (change, changePct) => {
    if (typeof change !== 'number' || typeof changePct !== 'number') return '????';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} (${sign}${changePct.toFixed(2)}%)`;
  };

  const getHeaderChangeClass = (change) => {
    if (typeof change !== 'number') return '';
    return change >= 0 ? 'header-positive' : 'header-negative';
  };

  const formatHeaderLevels = (index) => {
    if (index.symbol === 'VIX') {
      return 'Volatility Index';
    }
    
    const support = index.support || (index.price * 0.98);
    const resistance = index.resistance || (index.price * 1.02);
    
    return `S: ${Math.round(support).toLocaleString('en-IN')} | R: ${Math.round(resistance).toLocaleString('en-IN')}`;
  };

  const handleDataSourceChange = async (newSource) => {
    setDataSource(newSource);
    
    if (newSource === 'Live') {
      try {
        console.log('🔄 Connecting to live market data...');
        
        const response = await fetch('/api/connect/live', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Connected to live data successfully');
        } else if (data.needsLogin && data.loginUrl) {
          console.log('🔐 Authentication required, opening login window...');
          
          const authWindow = window.open(data.loginUrl, 'flattradeLogin', 'width=600,height=700');
          
          // Listen for message from popup
          const messageListener = (event) => {
            if (event.source === authWindow) {
              if (event.data?.type === 'auth-success') {
                console.log('✅ Authentication successful!');
                window.removeEventListener('message', messageListener);
                authWindow.close();
              } else if (event.data?.type === 'auth-error') {
                console.error('❌ Authentication failed:', event.data.error);
                window.removeEventListener('message', messageListener);
                authWindow.close();
                setDataSource('Mock');
              }
            }
          };
          window.addEventListener('message', messageListener);
          
        } else {
          throw new Error(data.error || 'Failed to connect to live data');
        }
        
      } catch (error) {
        console.error('❌ Failed to connect to live data:', error);
        setDataSource('Mock');
      }
    }
  };

  return (
    <SettingsProvider>
      <div className="trading-dashboard">
        {/* Professional Header */}
        <header className="trading-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="trading-title">My Trading Desk</h1>
              <div className="datetime-info">
                <span className="current-date">{new Date().toLocaleDateString('en-IN')}</span>
                <span className="current-time">{new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
              </div>
            </div>
            <div className="header-center">
              <div className="header-tickers">
                {headerIndices.map(index => (
                  <div key={index.symbol} className="header-ticker-card">
                    <div className="ticker-symbol">{index.symbol}</div>
                    <div className="ticker-price">{formatHeaderPrice(index.price)}</div>
                    <div className={`ticker-change ${getHeaderChangeClass(index.change)}`}>
                      {formatHeaderChange(index.change, index.change_pct)}
                    </div>
                    <div className="ticker-levels">{formatHeaderLevels(index)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="header-right">
              <div className="header-right-content">
                <div className="data-toggle-container">
                  <span className="toggle-label">Data Source</span>
                  <div className={`toggle-pill ${dataSource === 'Live' ? 'live' : 'mock'}`} 
                       onClick={() => handleDataSourceChange(dataSource === 'Live' ? 'Mock' : 'Live')}>
                    <div className="toggle-indicator"></div>
                    <span className="toggle-text">{dataSource}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Major Sectoral Indices - Collapsible Section */}
        <section className={`sectoral-indices ${isIndicesCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsIndicesCollapsed(!isIndicesCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">📊 Major Sectoral Indices</h2>
              <span className="section-subtitle">Live market sector performance</span>
            </div>
            <button className="collapse-toggle" aria-label={isIndicesCollapsed ? 'Expand indices' : 'Collapse indices'}>
              <svg 
                className={`chevron-icon ${isIndicesCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isIndicesCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="indices-grid">
              <MajorIndicesStrip dataSource={dataSource} />
            </div>
          </div>
        </section>

        {/* Stock Trading Tips - Collapsible Section */}
        <section className={`trading-alerts ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsTradingAlertsCollapsed(!isTradingAlertsCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">💡 Stock Trading Tips</h2>
              <span className="section-subtitle">Live trading signals and recommendations</span>
            </div>
            <button className="collapse-toggle" aria-label={isTradingAlertsCollapsed ? 'Expand alerts' : 'Collapse alerts'}>
              <svg 
                className={`chevron-icon ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="alerts-container">
              {/* Sample Trading Alert Cards */}
              <div className="alert-card buy-alert">
                <div className="alert-header">
                  <span className="alert-type">BUY SIGNAL</span>
                  <span className="alert-time">2 min ago</span>
                </div>
                <div className="alert-content">
                  <h3>RELIANCE</h3>
                  <div className="alert-details">
                    <div className="alert-detail">
                      <span className="alert-detail-label">Price:</span>
                      <span className="alert-detail-value">₹2,485.50</span>
                    </div>
                    <div className="alert-detail">
                      <span className="alert-detail-label">Target:</span>
                      <span className="alert-detail-value">₹2,520.00</span>
                    </div>
                    <div className="alert-detail">
                      <span className="alert-detail-label">SL:</span>
                      <span className="alert-detail-value">₹2,460.00</span>
                    </div>
                  </div>
                </div>
                <div className="alert-actions">
                  <button className="trade-btn buy-btn">BUY</button>
                </div>
              </div>

              <div className="alert-card sell-alert">
                <div className="alert-header">
                  <span className="alert-type">SELL SIGNAL</span>
                  <span className="alert-time">5 min ago</span>
                </div>
                <div className="alert-content">
                  <h3>TCS</h3>
                  <div className="alert-details">
                    <div className="alert-detail">
                      <span className="alert-detail-label">Price:</span>
                      <span className="alert-detail-value">₹4,125.80</span>
                    </div>
                    <div className="alert-detail">
                      <span className="alert-detail-label">Target:</span>
                      <span className="alert-detail-value">₹4,090.00</span>
                    </div>
                    <div className="alert-detail">
                      <span className="alert-detail-label">SL:</span>
                      <span className="alert-detail-value">₹4,150.00</span>
                    </div>
                  </div>
                </div>
                <div className="alert-actions">
                  <button className="trade-btn sell-btn">SELL</button>
                </div>
              </div>

              <div className="alert-card buy-alert">
                <div className="alert-header">
                  <span className="alert-type">BREAKOUT</span>
                  <span className="alert-time">8 min ago</span>
                </div>
                <div className="alert-content">
                  <h3>HDFC BANK</h3>
                  <div className="alert-details">
                    <div className="alert-detail">
                      <span className="alert-detail-label">Price:</span>
                      <span className="alert-detail-value">₹1,745.25</span>
                    </div>
                    <div className="alert-detail">
                      <span className="alert-detail-label">Target:</span>
                      <span className="alert-detail-value">₹1,780.00</span>
                    </div>
                    <div className="alert-detail">
                      <span className="alert-detail-label">SL:</span>
                      <span className="alert-detail-value">₹1,730.00</span>
                    </div>
                  </div>
                </div>
                <div className="alert-actions">
                  <button className="trade-btn buy-btn">BUY</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* F&O Analysis - Collapsible Section */}
        <section className={`fno-analysis-section ${isFnOCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsFnOCollapsed(!isFnOCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">🎯 F&O Analysis (NIFTY)</h2>
              <span className="section-subtitle">Options data and derivatives insights</span>
            </div>
            <button className="collapse-toggle" aria-label={isFnOCollapsed ? 'Expand F&O analysis' : 'Collapse F&O analysis'}>
              <svg 
                className={`chevron-icon ${isFnOCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isFnOCollapsed ? 'collapsed' : 'expanded'}`}>
            <FnOAnalysis />
          </div>
        </section>

        {/* BTST Scanner - Collapsible Section */}
        <section className={`btst-scanner-section ${isBTSTCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsBTSTCollapsed(!isBTSTCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">🌙 BTST Scanner</h2>
              <span className="section-subtitle">Buy Today Sell Tomorrow opportunities</span>
            </div>
            <button className="collapse-toggle" aria-label={isBTSTCollapsed ? 'Expand BTST scanner' : 'Collapse BTST scanner'}>
              <svg 
                className={`chevron-icon ${isBTSTCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isBTSTCollapsed ? 'collapsed' : 'expanded'}`}>
            <BTSTScanner />
          </div>
        </section>

        {/* Scalping Opportunities - Collapsible Section */}
        <section className={`scalping-opportunities-section ${isScalpingCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsScalpingCollapsed(!isScalpingCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">⚡ Scalping Opportunities</h2>
              <span className="section-subtitle">High-frequency trading signals</span>
            </div>
            <button className="collapse-toggle" aria-label={isScalpingCollapsed ? 'Expand scalping opportunities' : 'Collapse scalping opportunities'}>
              <svg 
                className={`chevron-icon ${isScalpingCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isScalpingCollapsed ? 'collapsed' : 'expanded'}`}>
            <ScalpingOpportunities />
          </div>
        </section>

        {/* Trading Alerts - Collapsible Section */}
        <section className={`trading-alerts-section ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsTradingAlertsCollapsed(!isTradingAlertsCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">🚨 Trading Alerts</h2>
              <span className="section-subtitle">Real-time market notifications</span>
            </div>
            <button className="collapse-toggle" aria-label={isTradingAlertsCollapsed ? 'Expand trading alerts' : 'Collapse trading alerts'}>
              <svg 
                className={`chevron-icon ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}>
            <TradingAlertsSection />
          </div>
        </section>

        {/* Top Gainers - Collapsible Section */}
        <section className={`top-gainers-main-section ${isTopGainersCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsTopGainersCollapsed(!isTopGainersCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">📈 Top Gainers</h2>
              <span className="section-subtitle">Best performing stocks today</span>
            </div>
            <button className="collapse-toggle" aria-label={isTopGainersCollapsed ? 'Expand top gainers' : 'Collapse top gainers'}>
              <svg 
                className={`chevron-icon ${isTopGainersCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isTopGainersCollapsed ? 'collapsed' : 'expanded'}`}>
            <TopGainersSection />
          </div>
        </section>

        {/* Top Losers - Collapsible Section */}
        <section className={`top-losers-main-section ${isTopLosersCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsTopLosersCollapsed(!isTopLosersCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">📉 Top Losers</h2>
              <span className="section-subtitle">Worst performing stocks today</span>
            </div>
            <button className="collapse-toggle" aria-label={isTopLosersCollapsed ? 'Expand top losers' : 'Collapse top losers'}>
              <svg 
                className={`chevron-icon ${isTopLosersCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isTopLosersCollapsed ? 'collapsed' : 'expanded'}`}>
            <TopLosersSection />
          </div>
        </section>

        {/* Settings - Collapsible Section */}
        <section className={`settings-main-section ${isSettingsCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="collapsible-header" onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}>
            <div className="section-title-wrapper">
              <h2 className="section-title">⚙️ Settings</h2>
              <span className="section-subtitle">Dashboard configuration</span>
            </div>
            <button className="collapse-toggle" aria-label={isSettingsCollapsed ? 'Expand settings' : 'Collapse settings'}>
              <svg 
                className={`chevron-icon ${isSettingsCollapsed ? 'collapsed' : 'expanded'}`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          <div className={`collapsible-content ${isSettingsCollapsed ? 'collapsed' : 'expanded'}`}>
            <SettingsSection />
          </div>
        </section>
      </div>
    </SettingsProvider>
  );
}

export default App;
