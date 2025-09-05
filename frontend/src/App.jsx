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
import SearchScripSection from './components/SearchScripSection';
import TradingLayout from './components/TradingLayout';
import LiveTradingDashboard from './components/LiveTradingDashboard';
import { SettingsProvider } from './contexts/SettingsContext';
import { TradingProvider } from './contexts/TradingContext';
import './styles/trading-dark-theme.css';
import './styles/live-trading-enhancements.css';
import './main-styles.css';

function App() {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'trading'
  const [dataSource, setDataSource] = useState('Mock');
  const [headerIndices, setHeaderIndices] = useState([
    { symbol: 'NIFTY', name: 'NIFTY 50', price: 24500.00, change: 125.50, change_pct: 0.51, support: 24350, resistance: 24650 },
    { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 51200.00, change: -200.25, change_pct: -0.39, support: 50800, resistance: 51500 },
    { symbol: 'SENSEX', name: 'SENSEX', price: 80450.00, change: 180.75, change_pct: 0.22, support: 80200, resistance: 80800 },
    { symbol: 'VIX', name: 'INDIA VIX', price: 13.25, change: -0.15, change_pct: -1.12, support: null, resistance: null },
    { symbol: 'GOLDM', name: 'GOLD FUT', price: 72850.00, change: 45.50, change_pct: 0.06, support: 72500, resistance: 73200 }
  ]);

  // State for collapsible sections
  const [isIndicesCollapsed, setIsIndicesCollapsed] = useState(false);
  const [isTradingAlertsCollapsed, setIsTradingAlertsCollapsed] = useState(false);
  const [isTradingTipsCollapsed, setIsTradingTipsCollapsed] = useState(false);
  const [isFnOCollapsed, setIsFnOCollapsed] = useState(false);
  const [isBTSTCollapsed, setIsBTSTCollapsed] = useState(false);
  const [isScalpingCollapsed, setIsScalpingCollapsed] = useState(false);
  const [isTopGainersCollapsed, setIsTopGainersCollapsed] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);

  // Fetch header indices data
  useEffect(() => {
    const fetchHeaderIndices = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/indices');
        if (response.ok) {
          const data = await response.json();
          const allIndices = data.data || [];
          
          console.log('Header API Response:', allIndices);
          
          const updatedHeaderIndices = headerIndices.map(headerItem => {
            const apiData = allIndices.find(index => index.symbol === headerItem.symbol);
            return apiData ? { ...headerItem, ...apiData } : headerItem;
          });
          
          console.log('Updated Header Indices:', updatedHeaderIndices);
          setHeaderIndices(updatedHeaderIndices);
        }
      } catch (error) {
        console.log('Using mock data for header indices due to API error:', error.message);
      }
    };

    if (dataSource === 'API') {
      fetchHeaderIndices();
    }
  }, [dataSource]);

  return (
    <TradingProvider>
      <SettingsProvider>
        {viewMode === 'trading' ? (
          <div className="trading-app-container">
            <Header 
              dataSource={dataSource} 
              onDataSourceChange={setDataSource}
              indices={headerIndices}
              onToggleView={(newView) => setViewMode(newView || (viewMode === 'dashboard' ? 'trading' : 'dashboard'))}
              currentView={viewMode}
            />
            <LiveTradingDashboard />
          </div>
        ) : (
          <div className="App">
            <Header 
              dataSource={dataSource} 
              onDataSourceChange={setDataSource}
              indices={headerIndices}
              onToggleView={(newView) => setViewMode(newView || (viewMode === 'dashboard' ? 'trading' : 'dashboard'))}
              currentView={viewMode}
            />
            
            {/* Two-Column Layout Container */}
            <div className="two-column-container">
              {/* LEFT COLUMN (70%) */}
              <div className="left-column">
                
                {/* Major Indices Strip - Collapsible Section */}
                <section className={`major-indices-section ${isIndicesCollapsed ? 'collapsed' : 'expanded'}`}>
                  <div className="collapsible-header" onClick={() => setIsIndicesCollapsed(!isIndicesCollapsed)}>
                    <div className="section-title-wrapper">
                      <h2 className="section-title">📊 Major Indices</h2>
                      <span className="section-subtitle">Real-time index movements and trends</span>
                </div>
                <button className="collapse-toggle" aria-label={isIndicesCollapsed ? 'Expand major indices' : 'Collapse major indices'}>
                  <svg 
                    className={`chevron-icon ${isIndicesCollapsed ? 'collapsed' : 'expanded'}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <MajorIndicesStrip 
                  dataSource={dataSource} 
                  indices={headerIndices}
                />
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
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <FnOAnalysis dataSource={dataSource} />
              </div>
            </section>

            {/* Scalping Opportunities - Collapsible Section */}
            <section className={`scalping-opportunities-section ${isScalpingCollapsed ? 'collapsed' : 'expanded'}`}>
              <div className="collapsible-header" onClick={() => setIsScalpingCollapsed(!isScalpingCollapsed)}>
                <div className="section-title-wrapper">
                  <h2 className="section-title">⚡ Scalping Opportunities</h2>
                  <span className="section-subtitle">Quick profit opportunities</span>
                </div>
                <button className="collapse-toggle" aria-label={isScalpingCollapsed ? 'Expand scalping opportunities' : 'Collapse scalping opportunities'}>
                  <svg 
                    className={`chevron-icon ${isScalpingCollapsed ? 'collapsed' : 'expanded'}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <ScalpingOpportunities dataSource={dataSource} />
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
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <BTSTScanner dataSource={dataSource} />
              </div>
            </section>

            {/* Market Movers - Collapsible Section (Combined Gainers & Losers) */}
            <section className={`top-gainers-section ${isTopGainersCollapsed ? 'collapsed' : 'expanded'}`}>
              <div className="collapsible-header" onClick={() => setIsTopGainersCollapsed(!isTopGainersCollapsed)}>
                <div className="section-title-wrapper">
                  <h2 className="section-title">� Market Movers</h2>
                  <span className="section-subtitle">Top gainers and losers side by side</span>
                </div>
                <button className="collapse-toggle" aria-label={isTopGainersCollapsed ? 'Expand market movers' : 'Collapse market movers'}>
                  <svg 
                    className={`chevron-icon ${isTopGainersCollapsed ? 'collapsed' : 'expanded'}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <TopGainersSection dataSource={dataSource} />
              </div>
            </section>

          </div>
          
          {/* RESIZE HANDLE */}
          <div className="resize-handle"></div>
          
          {/* RIGHT COLUMN (30%) */}
          <div className="right-column">
            
            {/* Trading Alerts - Collapsible Section */}
            <section className={`trading-alerts-section ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}>
              <div className="collapsible-header" onClick={() => setIsTradingAlertsCollapsed(!isTradingAlertsCollapsed)}>
                <div className="section-title-wrapper">
                  <h2 className="section-title">🚨 Trading Alerts</h2>
                  <span className="section-subtitle">Real-time trading opportunities</span>
                </div>
                <button className="collapse-toggle" aria-label={isTradingAlertsCollapsed ? 'Expand trading alerts' : 'Collapse trading alerts'}>
                  <svg 
                    className={`chevron-icon ${isTradingAlertsCollapsed ? 'collapsed' : 'expanded'}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <TradingAlertsSection />
              </div>
            </section>

            {/* Trading Tips - Collapsible Section */}
            <section className={`trading-tips-section ${isTradingTipsCollapsed ? 'collapsed' : 'expanded'}`}>
              <div className="collapsible-header" onClick={() => setIsTradingTipsCollapsed(!isTradingTipsCollapsed)}>
                <div className="section-title-wrapper">
                  <h2 className="section-title">💡 Trading Tips</h2>
                  <span className="section-subtitle">Expert insights and strategies</span>
                </div>
                <button className="collapse-toggle" aria-label={isTradingTipsCollapsed ? 'Expand trading tips' : 'Collapse trading tips'}>
                  <svg 
                    className={`chevron-icon ${isTradingTipsCollapsed ? 'collapsed' : 'expanded'}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <div className="trading-tips-content">
                  <div className="tip-card">
                    <div className="tip-header">
                      <span className="tip-type">STRATEGY</span>
                      <span className="tip-time">Today</span>
                    </div>
                    <div className="tip-content">
                      <h3>Market Outlook</h3>
                      <p>Consider booking profits near resistance levels. Watch for volume confirmation on breakouts.</p>
                      <div className="tip-tags">
                        <span className="tip-tag">Profit Booking</span>
                        <span className="tip-tag">Risk Management</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tip-card">
                    <div className="tip-header">
                      <span className="tip-type">TECHNIQUE</span>
                      <span className="tip-time">2h ago</span>
                    </div>
                    <div className="tip-content">
                      <h3>Support & Resistance</h3>
                      <p>Use previous day's high/low as key levels. Monitor price action around these zones.</p>
                      <div className="tip-tags">
                        <span className="tip-tag">Technical Analysis</span>
                        <span className="tip-tag">Price Action</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Search Scrip Section - Collapsible */}
            <section className={`search-scrip-section ${isSearchCollapsed ? 'collapsed' : 'expanded'}`}>
              <div className="collapsible-header" onClick={() => setIsSearchCollapsed(!isSearchCollapsed)}>
                <div className="section-title-wrapper">
                  <h2 className="section-title">🔍 Search Scrip for Analysis</h2>
                  <span className="section-subtitle">Find and analyze any stock or index</span>
                </div>
                <button className="collapse-toggle" aria-label={isSearchCollapsed ? 'Expand search scrip' : 'Collapse search scrip'}>
                  <svg 
                    className={`chevron-icon ${isSearchCollapsed ? 'collapsed' : 'expanded'}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <SearchScripSection />
              </div>
            </section>

            {/* Settings - Collapsible Section */}
            <section className={`settings-section ${isSettingsCollapsed ? 'collapsed' : 'expanded'}`}>
              <div className="collapsible-header" onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}>
                <div className="section-title-wrapper">
                  <h2 className="section-title">⚙️ Settings</h2>
                  <span className="section-subtitle">Configure dashboard preferences</span>
                </div>
                <button className="collapse-toggle" aria-label={isSettingsCollapsed ? 'Expand settings' : 'Collapse settings'}>
                  <svg 
                    className={`chevron-icon ${isSettingsCollapsed ? 'collapsed' : 'expanded'}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="collapsible-content">
                <SettingsSection />
              </div>
            </section>

            </div>
          </div>
        </div>
        )}
      </SettingsProvider>
    </TradingProvider>
  );
}

export default App;
